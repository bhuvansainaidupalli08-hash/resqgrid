from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from ..database import get_db
from ..models import AuditEvent
from ..schemas import AuditResponse

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditResponse])
def list_audit_events(
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEvent)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type.upper())

    return query.order_by(desc(AuditEvent.timestamp)).limit(limit).all()
