from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import EmergencyRequest, Assignment, Resource, Shelter, Alert
from ..schemas import StatsOverview
from ..seed_data import seed_database

router = APIRouter(prefix="/api", tags=["Statistics & Operations"])

@router.get("/stats", response_model=StatsOverview)
def get_operational_stats(db: Session = Depends(get_db)):
    total_requests = db.query(EmergencyRequest).count()
    critical_requests = db.query(EmergencyRequest).filter(EmergencyRequest.urgency_level == "CRITICAL").count()
    resolved_requests = db.query(EmergencyRequest).filter(EmergencyRequest.status.in_(["RESOLVED", "CLOSED"])).count()
    duplicate_requests = db.query(EmergencyRequest).filter(EmergencyRequest.is_duplicate == True).count()

    active_assignments = db.query(Assignment).filter(
        Assignment.status.in_(["ASSIGNED", "EN_ROUTE", "ON_SCENE"])
    ).count()

    available_resources = db.query(Resource).filter(Resource.status == "AVAILABLE").count()

    shelters = db.query(Shelter).all()
    total_shelters = len(shelters)
    total_capacity = sum(s.capacity for s in shelters)
    current_occupancy = sum(s.current_occupancy for s in shelters)

    active_alerts = db.query(Alert).filter(Alert.is_active == True).count()
    unconfirmed_alerts = db.query(Alert).filter(
        Alert.is_active == True,
        Alert.credibility.in_(["UNCONFIRMED", "DISPUTED"])
    ).count()

    return StatsOverview(
        total_requests=total_requests,
        critical_requests=critical_requests,
        active_assignments=active_assignments,
        available_resources=available_resources,
        total_shelters=total_shelters,
        total_shelter_capacity=total_capacity,
        current_shelter_occupancy=current_occupancy,
        active_alerts=active_alerts,
        unconfirmed_alerts=unconfirmed_alerts,
        duplicate_requests=duplicate_requests,
        resolved_requests=resolved_requests
    )

@router.post("/seed", status_code=200)
def run_seed(db: Session = Depends(get_db)):
    result = seed_database(db)
    return result
