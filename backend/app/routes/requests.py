import datetime
from typing import Optional, List, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from ..database import get_db
from ..models import EmergencyRequest, VerificationRecord, AuditEvent, Assignment, Resource
from ..schemas import (
    EmergencyRequestCreate,
    EmergencyRequestStatusUpdate,
    EmergencyRequestVerify,
    EmergencyRequestDetailResponse,
    EmergencyRequestPublicResponse
)

router = APIRouter(prefix="/api/requests", tags=["Emergency Requests"])

def mask_phone(phone: str) -> str:
    if not phone or len(phone) < 4:
        return "***-****"
    return phone[:3] + " ***-***-" + phone[-4:]

def mask_name(name: str) -> str:
    parts = name.split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}. ***"
    return f"{name[:2]}***"

@router.post("", response_model=EmergencyRequestDetailResponse, status_code=201)
def create_emergency_request(
    payload: EmergencyRequestCreate,
    db: Session = Depends(get_db)
):
    # Idempotency check: if key provided and exists, return existing
    if payload.idempotency_key:
        existing = db.query(EmergencyRequest).filter(
            EmergencyRequest.idempotency_key == payload.idempotency_key
        ).first()
        if existing:
            return existing

    # Duplicate detection heuristic: check same phone or close address within last 4 hours
    four_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=4)
    potential_duplicate = db.query(EmergencyRequest).filter(
        EmergencyRequest.created_at >= four_hours_ago,
        or_(
            EmergencyRequest.contact_phone == payload.contact_phone,
            EmergencyRequest.location_address == payload.location_address
        )
    ).first()

    is_duplicate = False
    duplicate_ref = None
    if potential_duplicate:
        is_duplicate = True
        duplicate_ref = potential_duplicate.request_code

    # Generate request code
    total_count = db.query(EmergencyRequest).count()
    request_code = f"REQ-2026-{total_count + 1:03d}"

    new_request = EmergencyRequest(
        request_code=request_code,
        citizen_name=payload.citizen_name,
        contact_phone=payload.contact_phone,
        district=payload.district,
        location_address=payload.location_address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        emergency_type=payload.emergency_type,
        urgency_level=payload.urgency_level,
        details=payload.details,
        special_needs=payload.special_needs,
        status="RECEIVED",
        credibility="UNCONFIRMED",
        credibility_notes="Awaiting initial coordinator review",
        reporter_type=payload.reporter_type,
        is_duplicate=is_duplicate,
        duplicate_reference=duplicate_ref,
        idempotency_key=payload.idempotency_key
    )

    db.add(new_request)
    db.flush()

    # Log audit event
    audit = AuditEvent(
        entity_type="REQUEST",
        entity_id=new_request.request_code,
        action="CREATE",
        performed_by=f"Citizen ({payload.reporter_type})",
        details=f"New emergency request registered: {payload.emergency_type} ({payload.urgency_level}) in {payload.district}. Details: {payload.details[:80]}..."
    )
    db.add(audit)
    db.commit()
    db.refresh(new_request)

    return new_request


@router.get("", response_model=List[dict])
def list_emergency_requests(
    status: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    credibility: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    include_duplicates: bool = Query(True),
    x_resqgrid_role: Optional[str] = Header(None, alias="X-ResQGrid-Role"),
    db: Session = Depends(get_db)
):
    query = db.query(EmergencyRequest)

    if status:
        query = query.filter(EmergencyRequest.status == status.upper())
    if district:
        query = query.filter(EmergencyRequest.district == district)
    if urgency:
        query = query.filter(EmergencyRequest.urgency_level == urgency.upper())
    if credibility:
        query = query.filter(EmergencyRequest.credibility == credibility.upper())
    if not include_duplicates:
        query = query.filter(EmergencyRequest.is_duplicate == False)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                EmergencyRequest.request_code.ilike(search_filter),
                EmergencyRequest.citizen_name.ilike(search_filter),
                EmergencyRequest.details.ilike(search_filter),
                EmergencyRequest.location_address.ilike(search_filter),
                EmergencyRequest.special_needs.ilike(search_filter)
            )
        )

    records = query.order_by(desc(EmergencyRequest.created_at)).all()

    # Role check: If public, sanitize PII
    is_public = (x_resqgrid_role != "coordinator" and x_resqgrid_role != "responder" and x_resqgrid_role != "admin")

    results = []
    for req in records:
        assignments_data = []
        for a in req.assignments:
            assignments_data.append({
                "id": a.id,
                "resource_id": a.resource_id,
                "resource_name": a.resource.name if a.resource else None,
                "resource_type": a.resource.type if a.resource else None,
                "status": a.status,
                "assigned_by": a.assigned_by,
                "assigned_at": a.assigned_at,
                "completed_at": a.completed_at
            })

        verifications_data = []
        for v in req.verifications:
            verifications_data.append({
                "id": v.id,
                "previous_credibility": v.previous_credibility,
                "new_credibility": v.new_credibility,
                "notes": v.notes,
                "verified_by": v.verified_by,
                "created_at": v.created_at
            })

        if is_public:
            results.append({
                "id": req.id,
                "request_code": req.request_code,
                "citizen_name": mask_name(req.citizen_name),
                "contact_phone": mask_phone(req.contact_phone),
                "district": req.district,
                "location_address": f"{req.district} Sector (Restricted Privacy)",
                "latitude": req.latitude,
                "longitude": req.longitude,
                "emergency_type": req.emergency_type,
                "urgency_level": req.urgency_level,
                "details": req.details,
                "special_needs": "Protected Medical Information" if req.special_needs else None,
                "status": req.status,
                "credibility": req.credibility,
                "is_duplicate": req.is_duplicate,
                "created_at": req.created_at
            })
        else:
            results.append({
                "id": req.id,
                "request_code": req.request_code,
                "citizen_name": req.citizen_name,
                "contact_phone": req.contact_phone,
                "district": req.district,
                "location_address": req.location_address,
                "latitude": req.latitude,
                "longitude": req.longitude,
                "emergency_type": req.emergency_type,
                "urgency_level": req.urgency_level,
                "details": req.details,
                "special_needs": req.special_needs,
                "status": req.status,
                "credibility": req.credibility,
                "credibility_notes": req.credibility_notes,
                "reporter_type": req.reporter_type,
                "is_duplicate": req.is_duplicate,
                "duplicate_reference": req.duplicate_reference,
                "idempotency_key": req.idempotency_key,
                "resolved_at": req.resolved_at,
                "resolved_by": req.resolved_by,
                "resolution_notes": req.resolution_notes,
                "created_at": req.created_at,
                "updated_at": req.updated_at,
                "assignments": assignments_data,
                "verifications": verifications_data
            })

    return results


@router.get("/{id}", response_model=dict)
def get_emergency_request(
    id: int,
    x_resqgrid_role: Optional[str] = Header(None, alias="X-ResQGrid-Role"),
    db: Session = Depends(get_db)
):
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    is_public = (x_resqgrid_role != "coordinator" and x_resqgrid_role != "responder" and x_resqgrid_role != "admin")

    assignments_data = []
    for a in req.assignments:
        assignments_data.append({
            "id": a.id,
            "resource_id": a.resource_id,
            "resource_name": a.resource.name if a.resource else None,
            "resource_type": a.resource.type if a.resource else None,
            "status": a.status,
            "assigned_by": a.assigned_by,
            "assigned_at": a.assigned_at,
            "completed_at": a.completed_at
        })

    verifications_data = []
    for v in req.verifications:
        verifications_data.append({
            "id": v.id,
            "previous_credibility": v.previous_credibility,
            "new_credibility": v.new_credibility,
            "notes": v.notes,
            "verified_by": v.verified_by,
            "created_at": v.created_at
        })

    if is_public:
        return {
            "id": req.id,
            "request_code": req.request_code,
            "citizen_name": mask_name(req.citizen_name),
            "contact_phone": mask_phone(req.contact_phone),
            "district": req.district,
            "location_address": f"{req.district} Sector (Restricted Privacy)",
            "latitude": req.latitude,
            "longitude": req.longitude,
            "emergency_type": req.emergency_type,
            "urgency_level": req.urgency_level,
            "details": req.details,
            "special_needs": "Protected Medical Information" if req.special_needs else None,
            "status": req.status,
            "credibility": req.credibility,
            "is_duplicate": req.is_duplicate,
            "created_at": req.created_at
        }

    return {
        "id": req.id,
        "request_code": req.request_code,
        "citizen_name": req.citizen_name,
        "contact_phone": req.contact_phone,
        "district": req.district,
        "location_address": req.location_address,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "emergency_type": req.emergency_type,
        "urgency_level": req.urgency_level,
        "details": req.details,
        "special_needs": req.special_needs,
        "status": req.status,
        "credibility": req.credibility,
        "credibility_notes": req.credibility_notes,
        "reporter_type": req.reporter_type,
        "is_duplicate": req.is_duplicate,
        "duplicate_reference": req.duplicate_reference,
        "idempotency_key": req.idempotency_key,
        "resolved_at": req.resolved_at,
        "resolved_by": req.resolved_by,
        "resolution_notes": req.resolution_notes,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "assignments": assignments_data,
        "verifications": verifications_data
    }


@router.patch("/{id}/status", response_model=dict)
def update_emergency_request_status(
    id: int,
    payload: EmergencyRequestStatusUpdate,
    db: Session = Depends(get_db)
):
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    old_status = req.status
    new_status = payload.status

    # Rule: Only mark a request resolved after explicit confirmation
    if new_status == "RESOLVED":
        if not payload.resolution_notes:
            raise HTTPException(
                status_code=400,
                detail="Explicit confirmation notes required to mark a rescue request as RESOLVED"
            )
        req.resolved_at = datetime.datetime.utcnow()
        req.resolved_by = payload.performed_by
        req.resolution_notes = payload.resolution_notes

    req.status = new_status
    req.updated_at = datetime.datetime.utcnow()

    # Create audit event
    audit = AuditEvent(
        entity_type="REQUEST",
        entity_id=req.request_code,
        action="STATUS_UPDATE",
        performed_by=payload.performed_by,
        details=f"Status transitioned from {old_status} to {new_status}. Notes: {payload.notes or 'None'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(req)

    return {
        "status": "success",
        "message": f"Request {req.request_code} status updated to {new_status}",
        "request_code": req.request_code,
        "new_status": req.status,
        "updated_at": req.updated_at
    }


@router.post("/{id}/verify", response_model=dict)
def verify_emergency_request(
    id: int,
    payload: EmergencyRequestVerify,
    db: Session = Depends(get_db)
):
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    old_credibility = req.credibility
    new_credibility = payload.credibility

    # Record verification history
    verif = VerificationRecord(
        request_id=req.id,
        previous_credibility=old_credibility,
        new_credibility=new_credibility,
        notes=payload.notes,
        verified_by=payload.verified_by
    )
    db.add(verif)

    req.credibility = new_credibility
    req.credibility_notes = payload.notes
    req.updated_at = datetime.datetime.utcnow()

    # Also transition status from RECEIVED to VERIFIED or UNDER_REVIEW if appropriate
    if new_credibility in ["VERIFIED", "CORROBORATED"] and req.status == "RECEIVED":
        req.status = "UNDER_REVIEW"

    # Audit event
    audit = AuditEvent(
        entity_type="REQUEST",
        entity_id=req.request_code,
        action="CREDIBILITY_UPDATE",
        performed_by=payload.verified_by,
        details=f"Credibility changed from {old_credibility} to {new_credibility}. Notes: {payload.notes}"
    )
    db.add(audit)
    db.commit()
    db.refresh(req)

    return {
        "status": "success",
        "message": f"Credibility for {req.request_code} updated to {new_credibility}",
        "request_code": req.request_code,
        "credibility": req.credibility,
        "credibility_notes": req.credibility_notes
    }
