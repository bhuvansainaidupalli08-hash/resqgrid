import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Assignment, EmergencyRequest, Resource, AuditEvent
from ..schemas import AssignmentCreate, AssignmentStatusUpdate, AssignmentResponse

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])

@router.post("", response_model=dict, status_code=201)
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db)
):
    # 1. Fetch request
    req = db.query(EmergencyRequest).filter(EmergencyRequest.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Target emergency request not found")

    if req.status in ["RESOLVED", "CLOSED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot assign resources to a request that is already {req.status}"
        )

    # 2. Fetch resource
    resource = db.query(Resource).filter(Resource.id == payload.resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Target resource not found")

    # 3. Check resource availability and conflicting active assignments
    if resource.status != "AVAILABLE":
        raise HTTPException(
            status_code=400,
            detail=f"Resource '{resource.name}' ({resource.resource_code}) is not available (Current status: {resource.status}). Conflicting assignment prevented."
        )

    # Double check for any active uncompleted assignment for this resource
    active_assignment = db.query(Assignment).filter(
        Assignment.resource_id == resource.id,
        Assignment.status.in_(["ASSIGNED", "EN_ROUTE", "ON_SCENE"])
    ).first()

    if active_assignment:
        raise HTTPException(
            status_code=400,
            detail=f"Resource '{resource.name}' already has an active deployment (Assignment #{active_assignment.id}). Double-booking prohibited."
        )

    # 4. Create assignment
    assignment = Assignment(
        request_id=req.id,
        resource_id=resource.id,
        assigned_by=payload.assigned_by,
        status="ASSIGNED",
        notes=payload.notes,
        assigned_at=datetime.datetime.utcnow()
    )
    db.add(assignment)

    # 5. Transition resource to ASSIGNED
    resource.status = "ASSIGNED"

    # 6. Transition request status to ASSIGNED if received or under review
    if req.status in ["RECEIVED", "UNDER_REVIEW", "VERIFIED"]:
        req.status = "ASSIGNED"
        req.updated_at = datetime.datetime.utcnow()

    # 7. Audit log
    audit = AuditEvent(
        entity_type="ASSIGNMENT",
        entity_id=f"ASG-{req.request_code}-{resource.resource_code}",
        action="ASSIGNMENT_CREATE",
        performed_by=payload.assigned_by,
        details=f"Resource {resource.name} ({resource.resource_code}) dispatched to {req.request_code} ({req.citizen_name}, {req.district}). Notes: {payload.notes or 'None'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(assignment)

    return {
        "status": "success",
        "message": f"Resource {resource.name} assigned to {req.request_code}",
        "assignment_id": assignment.id,
        "request_code": req.request_code,
        "resource_name": resource.name,
        "resource_status": resource.status,
        "request_status": req.status,
        "assigned_at": assignment.assigned_at
    }


@router.get("", response_model=List[dict])
def list_assignments(
    status: Optional[str] = Query(None),
    request_id: Optional[int] = Query(None),
    resource_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment)
    if status:
        query = query.filter(Assignment.status == status.upper())
    if request_id:
        query = query.filter(Assignment.request_id == request_id)
    if resource_id:
        query = query.filter(Assignment.resource_id == resource_id)

    records = query.order_by(desc(Assignment.assigned_at)).all()
    results = []
    for a in records:
        results.append({
            "id": a.id,
            "request_id": a.request_id,
            "resource_id": a.resource_id,
            "assigned_by": a.assigned_by,
            "status": a.status,
            "notes": a.notes,
            "assigned_at": a.assigned_at,
            "completed_at": a.completed_at,
            "request_code": a.request.request_code if a.request else None,
            "request_details": a.request.details if a.request else None,
            "emergency_type": a.request.emergency_type if a.request else None,
            "urgency_level": a.request.urgency_level if a.request else None,
            "district": a.request.district if a.request else None,
            "resource_name": a.resource.name if a.resource else None,
            "resource_type": a.resource.type if a.resource else None,
            "resource_callsign": a.resource.callsign if a.resource else None
        })
    return results


@router.patch("/{id}/status", response_model=dict)
def update_assignment_status(
    id: int,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db)
):
    assignment = db.query(Assignment).filter(Assignment.id == id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    old_status = assignment.status
    new_status = payload.status
    assignment.status = new_status
    if payload.notes:
        assignment.notes = (assignment.notes or "") + f" | [{new_status}]: {payload.notes}"

    # If assignment is in progress (EN_ROUTE or ON_SCENE), update request status to IN_PROGRESS
    if new_status in ["EN_ROUTE", "ON_SCENE"] and assignment.request:
        if assignment.request.status in ["ASSIGNED", "UNDER_REVIEW"]:
            assignment.request.status = "IN_PROGRESS"
            assignment.request.updated_at = datetime.datetime.utcnow()

    # If assignment is completed or cancelled, release resource back to AVAILABLE
    if new_status in ["COMPLETED", "CANCELLED"]:
        assignment.completed_at = datetime.datetime.utcnow()
        if assignment.resource:
            assignment.resource.status = "AVAILABLE"
            audit_res = AuditEvent(
                entity_type="RESOURCE",
                entity_id=assignment.resource.resource_code,
                action="RESOURCE_RELEASE",
                performed_by=payload.performed_by,
                details=f"Resource {assignment.resource.name} released back to AVAILABLE following assignment {assignment.id} {new_status}."
            )
            db.add(audit_res)

    audit = AuditEvent(
        entity_type="ASSIGNMENT",
        entity_id=str(assignment.id),
        action="STATUS_UPDATE",
        performed_by=payload.performed_by,
        details=f"Assignment #{assignment.id} status transitioned from {old_status} to {new_status}."
    )
    db.add(audit)
    db.commit()
    db.refresh(assignment)

    return {
        "status": "success",
        "message": f"Assignment #{assignment.id} status changed to {new_status}",
        "assignment_id": assignment.id,
        "new_status": assignment.status,
        "resource_status": assignment.resource.status if assignment.resource else None,
        "completed_at": assignment.completed_at
    }
