import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.seed_data import seed_database
from app.models import EmergencyRequest, Resource, Assignment, AuditEvent

# Use an isolated test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_resqgrid.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_list_requests_privacy_masking_for_public():
    # Without X-ResQGrid-Role header, should be treated as public
    response = client.get("/api/requests")
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    first = items[0]
    # Check phone number is masked
    assert "***" in first["contact_phone"]
    # Check special needs is protected
    if first.get("special_needs"):
        assert "Protected Medical Information" in first["special_needs"]

def test_list_requests_unmasked_for_coordinator():
    # With coordinator header
    response = client.get("/api/requests", headers={"X-ResQGrid-Role": "coordinator"})
    assert response.status_code == 200
    items = response.json()
    assert len(items) > 0
    # Search for Harold Vance seeded request
    harold = next((r for r in items if "Harold" in r["citizen_name"]), None)
    assert harold is not None
    assert "OXYGEN" in harold["special_needs"]
    assert harold["contact_phone"] == "+1 555-0811"

def test_create_emergency_request_success():
    payload = {
        "citizen_name": "Test Citizen Alpha",
        "contact_phone": "+1 555-0999",
        "district": "Northview",
        "location_address": "99 Highland Road, Northview",
        "latitude": 37.791,
        "longitude": -122.421,
        "emergency_type": "MEDICAL",
        "urgency_level": "HIGH",
        "details": "Need immediate medical checkup after electrical power outage.",
        "special_needs": "Insulin requires refrigeration",
        "reporter_type": "SELF",
        "idempotency_key": "TEST-KEY-001"
    }
    response = client.post("/api/requests", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["citizen_name"] == "Test Citizen Alpha"
    assert data["status"] == "RECEIVED"
    assert data["credibility"] == "UNCONFIRMED"
    assert data["request_code"].startswith("REQ-2026-")

    # Idempotent retry: same key returns existing request without duplicate error
    retry_response = client.post("/api/requests", json=payload)
    assert retry_response.status_code == 201
    assert retry_response.json()["id"] == data["id"]

def test_invalid_emergency_request_rejected():
    # Missing required details and invalid urgency
    invalid_payload = {
        "citizen_name": "X",
        "contact_phone": "123",
        "district": "Northview",
        "location_address": "A",
        "latitude": 37.791,
        "longitude": -122.421,
        "emergency_type": "INVALID_TYPE",
        "urgency_level": "SUPER_URGENT",
        "details": "tiny"
    }
    response = client.post("/api/requests", json=invalid_payload)
    assert response.status_code == 422

def test_conflict_prevention_on_resource_assignment():
    # Find an available rescue resource
    res_list = client.get("/api/resources?status=AVAILABLE").json()
    assert len(res_list) > 0
    resource = res_list[0]

    # Find an open request
    req_list = client.get("/api/requests", headers={"X-ResQGrid-Role": "coordinator"}).json()
    req = next(r for r in req_list if r["status"] in ["RECEIVED", "UNDER_REVIEW", "VERIFIED"])

    # 1. First assignment succeeds
    asg_payload = {
        "request_id": req["id"],
        "resource_id": resource["id"],
        "assigned_by": "Dispatcher Sarah",
        "notes": "Deploying immediate rescue assistance."
    }
    asg_res = client.post("/api/assignments", json=asg_payload)
    assert asg_res.status_code == 201
    assignment_id = asg_res.json()["assignment_id"]

    # 2. Conflicting assignment to another request using the same resource MUST FAIL!
    another_req = next(r for r in req_list if r["id"] != req["id"] and r["status"] not in ["RESOLVED", "CLOSED"])
    conflict_payload = {
        "request_id": another_req["id"],
        "resource_id": resource["id"],
        "assigned_by": "Dispatcher Sarah",
        "notes": "Attempting conflicting assignment"
    }
    conflict_res = client.post("/api/assignments", json=conflict_payload)
    assert conflict_res.status_code == 400
    assert "not available" in conflict_res.json()["detail"].lower() or "active deployment" in conflict_res.json()["detail"].lower()

    # 3. Clean up / Complete the assignment to release resource
    update_res = client.patch(
        f"/api/assignments/{assignment_id}/status",
        json={"status": "COMPLETED", "notes": "Rescue operation successfully conducted.", "performed_by": "Dispatcher Sarah"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["resource_status"] == "AVAILABLE"

def test_request_resolution_requires_confirmation_notes():
    # Marking resolved without notes must fail with 400
    req_list = client.get("/api/requests", headers={"X-ResQGrid-Role": "coordinator"}).json()
    req = req_list[0]

    fail_res = client.patch(
        f"/api/requests/{req['id']}/status",
        json={"status": "RESOLVED", "performed_by": "Coordinator", "resolution_notes": None}
    )
    assert fail_res.status_code == 400
    assert "confirmation notes required" in fail_res.json()["detail"].lower()

    # Providing resolution notes succeeds
    ok_res = client.patch(
        f"/api/requests/{req['id']}/status",
        json={
            "status": "RESOLVED",
            "performed_by": "Coordinator Sarah",
            "resolution_notes": "Resident safely evacuated to Northview Civic Sports Complex shelter."
        }
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["new_status"] == "RESOLVED"

def test_audit_log_persists_events():
    audit_res = client.get("/api/audit")
    assert audit_res.status_code == 200
    events = audit_res.json()
    assert len(events) > 0
    # Check that events have required schema fields
    for ev in events[:5]:
        assert "entity_type" in ev
        assert "action" in ev
        assert "performed_by" in ev
        assert "timestamp" in ev

def test_operational_stats_metrics():
    stats_res = client.get("/api/stats")
    assert stats_res.status_code == 200
    s = stats_res.json()
    assert s["total_requests"] >= 5
    assert s["total_shelters"] >= 4
    assert s["total_shelter_capacity"] > 500
