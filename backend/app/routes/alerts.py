import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import Alert, AuditEvent
from ..schemas import AlertCreate, AlertCredibilityUpdate, AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def list_alerts(
    district: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    credibility: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if district:
        query = query.filter(Alert.district == district)
    if category:
        query = query.filter(Alert.category == category.upper())
    if credibility:
        query = query.filter(Alert.credibility == credibility.upper())
    if is_active is not None:
        query = query.filter(Alert.is_active == is_active)

    return query.order_by(desc(Alert.created_at)).all()


@router.post("", response_model=AlertResponse, status_code=201)
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db)
):
    count = db.query(Alert).count()
    alert_code = f"ALT-2026-{count + 1:02d}"

    alert = Alert(
        alert_code=alert_code,
        title=payload.title,
        category=payload.category,
        severity=payload.severity,
        credibility=payload.credibility,
        district=payload.district,
        message=payload.message,
        source=payload.source,
        is_active=True,
        flags_for_review=payload.flags_for_review
    )
    db.add(alert)
    db.flush()

    audit = AuditEvent(
        entity_type="ALERT",
        entity_id=alert.alert_code,
        action="CREATE",
        performed_by="Emergency Operations Center",
        details=f"New alert broadcast: '{alert.title}' in {alert.district} ({alert.severity}). Initial credibility: {alert.credibility}."
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/{id}/credibility", response_model=AlertResponse)
def update_alert_credibility(
    id: int,
    payload: AlertCredibilityUpdate,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    old_credibility = alert.credibility
    alert.credibility = payload.credibility
    if payload.flags_for_review:
        alert.flags_for_review = payload.flags_for_review
    alert.updated_at = datetime.datetime.utcnow()

    # Create audit trail for the credibility decision
    audit = AuditEvent(
        entity_type="ALERT",
        entity_id=alert.alert_code,
        action="CREDIBILITY_DECISION",
        performed_by=payload.performed_by,
        details=f"Human review decision: Alert {alert.alert_code} credibility changed from {old_credibility} to {payload.credibility}. Review notes: {payload.flags_for_review or 'Verified by coordinator'}"
    )
    db.add(audit)
    db.commit()
    db.refresh(alert)
    return alert
