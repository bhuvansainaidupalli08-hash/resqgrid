import httpx
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def log(msg, status="OK"):
    print(f"[{status}] {msg}")

def test_live_workflow():
    print("\n=======================================================")
    print("      ResQGrid Live End-to-End Workflow Verification     ")
    print("=======================================================\n")

    client = httpx.Client(timeout=10.0)

    # 1. Health check
    res = client.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    log(f"Health check succeeded: {res.json()['status']} (Version: {res.json()['version']})")

    # 2. Citizen Request Intake
    req_payload = {
        "citizen_name": "Eleanor Roosevelt",
        "contact_phone": "+1 555-4321",
        "district": "Riverdale",
        "location_address": "810 Riverdale Crossing, Apt 3",
        "latitude": 37.7654,
        "longitude": -122.4388,
        "emergency_type": "RESCUE",
        "urgency_level": "CRITICAL",
        "details": "Rapid rising flood water trapped resident on second floor porch with service animal.",
        "special_needs": "Elderly resident with mobility assistance needs (walker)",
        "reporter_type": "SELF",
        "idempotency_key": "LIVE-DEMO-REQ-999"
    }
    create_res = client.post(f"{BASE_URL}/api/requests", json=req_payload)
    assert create_res.status_code == 201, f"Create request failed: {create_res.text}"
    req_data = create_res.json()
    req_id = req_data["id"]
    req_code = req_data["request_code"]
    log(f"Citizen Emergency Request created: {req_code} (ID: {req_id}) | Urgency: {req_data['urgency_level']}")

    # 3. Privacy Masking Check (Public vs Coordinator)
    public_res = client.get(f"{BASE_URL}/api/requests/{req_id}", headers={"X-ResQGrid-Role": "public"})
    assert "***" in public_res.json()["contact_phone"]
    assert "Protected Medical Information" in public_res.json()["special_needs"]
    log("Public Privacy Masking verified: Phone and medical special needs protected")

    coord_res = client.get(f"{BASE_URL}/api/requests/{req_id}", headers={"X-ResQGrid-Role": "coordinator"})
    assert coord_res.json()["contact_phone"] == "+1 555-4321"
    assert "Elderly" in coord_res.json()["special_needs"]
    log("Coordinator Clearance verified: Unmasked full medical telemetry & contact phone")

    # 4. Coordinator Credibility Corroboration
    verify_res = client.post(
        f"{BASE_URL}/api/requests/{req_id}/verify",
        json={
            "credibility": "VERIFIED",
            "notes": "Drone reconnaissance unit Raven-2 confirmed resident and service animal on porch.",
            "verified_by": "Sarah Chen (Lead Coordinator)"
        },
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    assert verify_res.status_code == 200
    log(f"Credibility Elevated: {verify_res.json()['credibility']} (Drone corroborated)")

    # 5. Dispatch Available Resource
    resources = client.get(f"{BASE_URL}/api/resources?status=AVAILABLE").json()
    assert len(resources) > 0, "No available resources found"
    boat = next((r for r in resources if r["type"] == "RESCUE_BOAT"), resources[0])
    log(f"Assigning Resource: {boat['name']} ({boat['resource_code']})")

    asg_res = client.post(
        f"{BASE_URL}/api/assignments",
        json={
            "request_id": req_id,
            "resource_id": boat["id"],
            "assigned_by": "Sarah Chen (Lead Coordinator)",
            "notes": "Deploy immediately with shallow water 3-diver crew"
        },
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    assert asg_res.status_code == 201
    asg_id = asg_res.json()["assignment_id"]
    log(f"Resource Assigned successfully (Assignment #{asg_id}) | Boat Status: ASSIGNED")

    # 6. Verify Conflict Prevention (Double Booking Prevented)
    conflict_res = client.post(
        f"{BASE_URL}/api/assignments",
        json={
            "request_id": req_id,
            "resource_id": boat["id"],
            "assigned_by": "Sarah Chen (Lead Coordinator)",
            "notes": "Conflicting double booking attempt"
        },
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    assert conflict_res.status_code == 400
    log("Conflict Prevention Confirmed: Double-booking unavailable resource rejected with HTTP 400")

    # 7. Progress Assignment Lifecycle: ASSIGNED -> EN_ROUTE -> ON_SCENE -> COMPLETED
    client.patch(
        f"{BASE_URL}/api/assignments/{asg_id}/status",
        json={"status": "EN_ROUTE", "performed_by": "Field Dispatcher", "notes": "Navigating flood waters"},
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    log("Assignment transitioned: EN_ROUTE")

    client.patch(
        f"{BASE_URL}/api/assignments/{asg_id}/status",
        json={"status": "ON_SCENE", "performed_by": "Field Dispatcher", "notes": "Arrival on porch"},
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    log("Assignment transitioned: ON_SCENE")

    complete_res = client.patch(
        f"{BASE_URL}/api/assignments/{asg_id}/status",
        json={"status": "COMPLETED", "performed_by": "Field Dispatcher", "notes": "Resident and pet onboard boat"},
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    assert complete_res.json()["resource_status"] == "AVAILABLE"
    log("Assignment COMPLETED: Resource released back to AVAILABLE")

    # 8. Resolution with Outcome Confirmation Notes
    resolve_res = client.patch(
        f"{BASE_URL}/api/requests/{req_id}/status",
        json={
            "status": "RESOLVED",
            "performed_by": "Sarah Chen (Lead Coordinator)",
            "resolution_notes": "Resident Eleanor Roosevelt and service animal safely transferred to Riverdale Evacuation Center."
        },
        headers={"X-ResQGrid-Role": "coordinator"}
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["new_status"] == "RESOLVED"
    log(f"Request {req_code} confirmed RESOLVED with authorized outcome documentation")

    # 9. Verify Audit Ledger
    audit_res = client.get(f"{BASE_URL}/api/audit?limit=10")
    events = audit_res.json()
    actions = [e["action"] for e in events]
    assert "CREATE" in actions
    assert "CREDIBILITY_UPDATE" in actions or "CREDIBILITY_DECISION" in actions
    assert "ASSIGNMENT_CREATE" in actions
    assert "STATUS_UPDATE" in actions
    log(f"Audit Ledger verified: {len(events)} recent events recorded with full attribution")

    # 10. Operational Metrics
    stats_res = client.get(f"{BASE_URL}/api/stats").json()
    log(f"Final Stats: Total Requests: {stats_res['total_requests']}, Resolved: {stats_res['resolved_requests']}, Shelters: {stats_res['total_shelters']}")

    print("\n=======================================================")
    print("      ALL LIVE END-TO-END WORKFLOW CHECKS PASSED!      ")
    print("=======================================================\n")

if __name__ == "__main__":
    test_live_workflow()
