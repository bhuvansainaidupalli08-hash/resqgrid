from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Resource, AuditEvent
from ..schemas import ResourceCreate, ResourceStatusUpdate, ResourceResponse

router = APIRouter(prefix="/api/resources", tags=["Resources"])

@router.get("", response_model=List[ResourceResponse])
def list_resources(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if status:
        query = query.filter(Resource.status == status.upper())
    if type:
        query = query.filter(Resource.type == type.upper())
    if district:
        query = query.filter(Resource.district == district)

    return query.order_by(Resource.name).all()


@router.post("", response_model=ResourceResponse, status_code=201)
def create_resource(
    payload: ResourceCreate,
    db: Session = Depends(get_db)
):
    count = db.query(Resource).count()
    prefix = payload.type[:4].upper()
    resource_code = f"{prefix}-{count + 1:02d}"

    resource = Resource(
        resource_code=resource_code,
        name=payload.name,
        type=payload.type,
        status="AVAILABLE",
        district=payload.district,
        current_location=payload.current_location,
        capacity_units=payload.capacity_units,
        callsign=payload.callsign,
        contact_number=payload.contact_number,
        notes=payload.notes
    )
    db.add(resource)
    db.flush()

    audit = AuditEvent(
        entity_type="RESOURCE",
        entity_id=resource.resource_code,
        action="CREATE",
        performed_by="Coordinator",
        details=f"New resource enlisted: {resource.name} ({resource.type}) stationed at {resource.district}."
    )
    db.add(audit)
    db.commit()
    db.refresh(resource)
    return resource


@router.patch("/{id}/status", response_model=ResourceResponse)
def update_resource_status(
    id: int,
    payload: ResourceStatusUpdate,
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    old_status = resource.status
    resource.status = payload.status
    if payload.notes:
        resource.notes = (resource.notes or "") + f" | [{payload.status}]: {payload.notes}"

    audit = AuditEvent(
        entity_type="RESOURCE",
        entity_id=resource.resource_code,
        action="STATUS_UPDATE",
        performed_by=payload.performed_by,
        details=f"Resource {resource.name} status updated from {old_status} to {payload.status}. Notes: {payload.notes or 'None'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(resource)
    return resource
