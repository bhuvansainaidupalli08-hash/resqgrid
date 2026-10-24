import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), default="COORDINATOR", nullable=False)  # COORDINATOR, RESPONDER, CITIZEN, ADMIN
    district = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_code = Column(String(30), unique=True, index=True, nullable=False)
    citizen_name = Column(String(100), nullable=False)
    contact_phone = Column(String(30), nullable=False)
    district = Column(String(50), nullable=False, index=True)  # Northview, Riverdale, Eastwood, Southpoint
    location_address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    emergency_type = Column(String(50), nullable=False)  # RESCUE, MEDICAL, FLOOD_HAZARD, FOOD_WATER, SHELTER_NEEDED
    urgency_level = Column(String(30), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    details = Column(Text, nullable=False)
    special_needs = Column(Text, nullable=True)  # e.g., "Oxygen-dependent bedridden resident", "Elderly"
    status = Column(String(30), default="RECEIVED", index=True, nullable=False)
    # Statuses: RECEIVED, UNDER_REVIEW, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
    credibility = Column(String(30), default="UNCONFIRMED", index=True, nullable=False)
    # Credibility: UNCONFIRMED, CORROBORATED, VERIFIED, DISPUTED
    credibility_notes = Column(Text, nullable=True)
    reporter_type = Column(String(50), default="SELF", nullable=False)  # SELF, NEIGHBOUR, VOLUNTEER, FIRST_RESPONDER
    is_duplicate = Column(Boolean, default=False)
    duplicate_reference = Column(String(50), nullable=True)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    assignments = relationship("Assignment", back_populates="request", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="request", cascade="all, delete-orphan")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False)
    previous_credibility = Column(String(30), nullable=False)
    new_credibility = Column(String(30), nullable=False)
    notes = Column(Text, nullable=True)
    verified_by = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    request = relationship("EmergencyRequest", back_populates="verifications")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_code = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # RESCUE_BOAT, AMBULANCE, MEDICAL_TEAM, EVAC_4X4, SUPPLY_TRUCK, VOLUNTEER_TEAM
    status = Column(String(30), default="AVAILABLE", index=True, nullable=False)
    # Status: AVAILABLE, ASSIGNED, MAINTENANCE, OFFLINE
    district = Column(String(50), nullable=False)
    current_location = Column(String(255), nullable=False)
    capacity_units = Column(Integer, default=4)
    callsign = Column(String(50), nullable=False)
    contact_number = Column(String(30), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assignments = relationship("Assignment", back_populates="resource")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("emergency_requests.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(String(100), nullable=False)
    status = Column(String(30), default="ASSIGNED", nullable=False)
    # Status: ASSIGNED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    request = relationship("EmergencyRequest", back_populates="assignments")
    resource = relationship("Resource", back_populates="assignments")


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    district = Column(String(50), nullable=False, index=True)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_occupancy = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="OPEN", nullable=False)  # OPEN, NEAR_CAPACITY, FULL, CLOSED
    supplies_status = Column(String(30), default="ADEQUATE", nullable=False)  # ADEQUATE, LOW, CRITICAL
    medical_support = Column(Boolean, default=True)
    freshness_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    contact_info = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(30), unique=True, index=True, nullable=False)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # EVACUATION, WEATHER, INFRASTRUCTURE, PUBLIC_SAFETY
    severity = Column(String(30), nullable=False)  # CRITICAL, WARNING, ADVISORY
    credibility = Column(String(30), default="UNCONFIRMED", nullable=False)
    # Credibility: UNCONFIRMED, CORROBORATED, VERIFIED, DISPUTED
    district = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    flags_for_review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # REQUEST, ASSIGNMENT, RESOURCE, SHELTER, ALERT
    entity_id = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # CREATE, STATUS_UPDATE, CREDIBILITY_UPDATE, ASSIGNMENT_CREATE, RESOURCE_RELEASE, RESOLUTION
    performed_by = Column(String(100), nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
