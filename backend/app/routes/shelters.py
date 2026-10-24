import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Shelter, AuditEvent
from ..schemas import ShelterCreate, ShelterUpdate, ShelterResponse

router = APIRouter(prefix="/api/shelters", tags=["Shelters"])

@router.get("", response_model=List[ShelterResponse])
def list_shelters(
    district: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Shelter)
    if district:
        query = query.filter(Shelter.district == district)
    if status:
        query = query.filter(Shelter.status == status.upper())

    return query.order_by(Shelter.name).all()


@router.post("", response_model=ShelterResponse, status_code=201)
def create_shelter(
    payload: ShelterCreate,
    db: Session = Depends(get_db)
):
    shelter = Shelter(
        name=payload.name,
        district=payload.district,
        address=payload.address,
        latitude=payload.latitude,
        longitude=payload.longitude,
        capacity=payload.capacity,
        current_occupancy=payload.current_occupancy,
        status=payload.status,
        supplies_status=payload.supplies_status,
        medical_support=payload.medical_support,
        freshness_timestamp=datetime.datetime.utcnow(),
        contact_info=payload.contact_info,
        notes=payload.notes
    )
    db.add(shelter)
    db.flush()

    audit = AuditEvent(
        entity_type="SHELTER",
        entity_id=str(shelter.id),
        action="CREATE",
        performed_by="Coordinator",
        details=f"New shelter opened: {shelter.name} in {shelter.district} (Capacity: {shelter.capacity})."
    )
    db.add(audit)
    db.commit()
    db.refresh(shelter)
    return shelter


@router.patch("/{id}", response_model=ShelterResponse)
def update_shelter(
    id: int,
    payload: ShelterUpdate,
    db: Session = Depends(get_db)
):
    shelter = db.query(Shelter).filter(Shelter.id == id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")

    if payload.capacity is not None:
        shelter.capacity = payload.capacity
    if payload.current_occupancy is not None:
        shelter.current_occupancy = payload.current_occupancy
        # Auto calculate status if not explicitly given
        if payload.status is None:
            if shelter.current_occupancy >= shelter.capacity:
                shelter.status = "FULL"
            elif shelter.current_occupancy >= (shelter.capacity * 0.85):
                shelter.status = "NEAR_CAPACITY"
            else:
                shelter.status = "OPEN"

    if payload.status is not None:
        shelter.status = payload.status
    if payload.supplies_status is not None:
        shelter.supplies_status = payload.supplies_status
    if payload.medical_support is not None:
        shelter.medical_support = payload.medical_support
    if payload.notes is not None:
        shelter.notes = payload.notes

    # Updating freshness timestamp to current UTC time
    shelter.freshness_timestamp = datetime.datetime.utcnow()

    audit = AuditEvent(
        entity_type="SHELTER",
        entity_id=str(shelter.id),
        action="UPDATE",
        performed_by=payload.performed_by,
        details=f"Shelter {shelter.name} updated: Occupancy {shelter.current_occupancy}/{shelter.capacity}, Status {shelter.status}, Supplies {shelter.supplies_status}."
    )
    db.add(audit)
    db.commit()
    db.refresh(shelter)
    return shelter
