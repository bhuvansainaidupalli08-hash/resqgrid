import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict

# ----------------- Emergency Requests -----------------
class EmergencyRequestCreate(BaseModel):
    citizen_name: str = Field(..., min_length=2, max_length=100)
    contact_phone: str = Field(..., min_length=7, max_length=30)
    district: str = Field(..., description="Northview, Riverdale, Eastwood, Southpoint")
    location_address: str = Field(..., min_length=3, max_length=255)
    latitude: float
    longitude: float
    emergency_type: str = Field(..., description="RESCUE, MEDICAL, FLOOD_HAZARD, FOOD_WATER, SHELTER_NEEDED")
    urgency_level: str = Field("HIGH", description="CRITICAL, HIGH, MEDIUM, LOW")
    details: str = Field(..., min_length=5)
    special_needs: Optional[str] = None
    reporter_type: str = Field("SELF", description="SELF, NEIGHBOUR, VOLUNTEER, FIRST_RESPONDER")
    idempotency_key: Optional[str] = None

    @field_validator("urgency_level")
    def validate_urgency(cls, v):
        valid = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        if v.upper() not in valid:
            raise ValueError(f"urgency_level must be one of {valid}")
        return v.upper()

    @field_validator("emergency_type")
    def validate_emergency_type(cls, v):
        valid = ["RESCUE", "MEDICAL", "FLOOD_HAZARD", "FOOD_WATER", "SHELTER_NEEDED", "INFRASTRUCTURE"]
        if v.upper() not in valid:
            raise ValueError(f"emergency_type must be one of {valid}")
        return v.upper()


class EmergencyRequestStatusUpdate(BaseModel):
    status: str = Field(..., description="RECEIVED, UNDER_REVIEW, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED")
    notes: Optional[str] = None
    performed_by: str = Field("Coordinator", min_length=2)
    resolution_notes: Optional[str] = None

    @field_validator("status")
    def validate_status(cls, v):
        valid = ["RECEIVED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]
        if v.upper() not in valid:
            raise ValueError(f"status must be one of {valid}")
        return v.upper()


class EmergencyRequestVerify(BaseModel):
    credibility: str = Field(..., description="UNCONFIRMED, CORROBORATED, VERIFIED, DISPUTED")
    notes: str = Field(..., min_length=3)
    verified_by: str = Field("Lead Coordinator", min_length=2)

    @field_validator("credibility")
    def validate_credibility(cls, v):
        valid = ["UNCONFIRMED", "CORROBORATED", "VERIFIED", "DISPUTED"]
        if v.upper() not in valid:
            raise ValueError(f"credibility must be one of {valid}")
        return v.upper()


class AssignmentSimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resource_id: int
    resource_name: Optional[str] = None
    resource_type: Optional[str] = None
    status: str
    assigned_by: str
    assigned_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None


class VerificationSimple(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    previous_credibility: str
    new_credibility: str
    notes: Optional[str] = None
    verified_by: str
    created_at: datetime.datetime


class EmergencyRequestDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_code: str
    citizen_name: str
    contact_phone: str
    district: str
    location_address: str
    latitude: float
    longitude: float
    emergency_type: str
    urgency_level: str
    details: str
    special_needs: Optional[str] = None
    status: str
    credibility: str
    credibility_notes: Optional[str] = None
    reporter_type: str
    is_duplicate: bool
    duplicate_reference: Optional[str] = None
    idempotency_key: Optional[str] = None
    resolved_at: Optional[datetime.datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    assignments: List[AssignmentSimple] = []
    verifications: List[VerificationSimple] = []


class EmergencyRequestPublicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_code: str
    citizen_name: str
    contact_phone: str
    district: str
    location_address: str
    latitude: float
    longitude: float
    emergency_type: str
    urgency_level: str
    details: str
    special_needs: Optional[str] = "Protected medical information"
    status: str
    credibility: str
    is_duplicate: bool
    created_at: datetime.datetime


# ----------------- Resources -----------------
class ResourceCreate(BaseModel):
    name: str = Field(..., min_length=2)
    type: str = Field(..., description="RESCUE_BOAT, AMBULANCE, MEDICAL_TEAM, EVAC_4X4, SUPPLY_TRUCK, VOLUNTEER_TEAM")
    district: str
    current_location: str
    capacity_units: int = 4
    callsign: str
    contact_number: str
    notes: Optional[str] = None

    @field_validator("type")
    def validate_type(cls, v):
        valid = ["RESCUE_BOAT", "AMBULANCE", "MEDICAL_TEAM", "EVAC_4X4", "SUPPLY_TRUCK", "VOLUNTEER_TEAM"]
        if v.upper() not in valid:
            raise ValueError(f"type must be one of {valid}")
        return v.upper()


class ResourceStatusUpdate(BaseModel):
    status: str = Field(..., description="AVAILABLE, ASSIGNED, MAINTENANCE, OFFLINE")
    notes: Optional[str] = None
    performed_by: str = "Coordinator"

    @field_validator("status")
    def validate_status(cls, v):
        valid = ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "OFFLINE"]
        if v.upper() not in valid:
            raise ValueError(f"status must be one of {valid}")
        return v.upper()


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    resource_code: str
    name: str
    type: str
    status: str
    district: str
    current_location: str
    capacity_units: int
    callsign: str
    contact_number: str
    notes: Optional[str] = None
    created_at: datetime.datetime


# ----------------- Assignments -----------------
class AssignmentCreate(BaseModel):
    request_id: int
    resource_id: int
    assigned_by: str = Field("Field Dispatcher", min_length=2)
    notes: Optional[str] = None


class AssignmentStatusUpdate(BaseModel):
    status: str = Field(..., description="ASSIGNED, EN_ROUTE, ON_SCENE, COMPLETED, CANCELLED")
    notes: Optional[str] = None
    performed_by: str = "Field Dispatcher"

    @field_validator("status")
    def validate_status(cls, v):
        valid = ["ASSIGNED", "EN_ROUTE", "ON_SCENE", "COMPLETED", "CANCELLED"]
        if v.upper() not in valid:
            raise ValueError(f"status must be one of {valid}")
        return v.upper()


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_id: int
    resource_id: int
    assigned_by: str
    status: str
    notes: Optional[str] = None
    assigned_at: datetime.datetime
    completed_at: Optional[datetime.datetime] = None
    request_code: Optional[str] = None
    request_details: Optional[str] = None
    resource_name: Optional[str] = None
    resource_type: Optional[str] = None
    district: Optional[str] = None


# ----------------- Shelters -----------------
class ShelterCreate(BaseModel):
    name: str
    district: str
    address: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int = 0
    status: str = "OPEN"
    supplies_status: str = "ADEQUATE"
    medical_support: bool = True
    contact_info: str
    notes: Optional[str] = None


class ShelterUpdate(BaseModel):
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    status: Optional[str] = None
    supplies_status: Optional[str] = None
    medical_support: Optional[bool] = None
    notes: Optional[str] = None
    performed_by: str = "Shelter Manager"


class ShelterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    district: str
    address: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    status: str
    supplies_status: str
    medical_support: bool
    freshness_timestamp: datetime.datetime
    contact_info: str
    notes: Optional[str] = None


# ----------------- Alerts -----------------
class AlertCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    category: str = Field(..., description="EVACUATION, WEATHER, INFRASTRUCTURE, PUBLIC_SAFETY")
    severity: str = Field(..., description="CRITICAL, WARNING, ADVISORY")
    credibility: str = Field("UNCONFIRMED", description="UNCONFIRMED, CORROBORATED, VERIFIED, DISPUTED")
    district: str
    message: str = Field(..., min_length=10)
    source: str
    flags_for_review: Optional[str] = None


class AlertCredibilityUpdate(BaseModel):
    credibility: str = Field(..., description="UNCONFIRMED, CORROBORATED, VERIFIED, DISPUTED")
    flags_for_review: Optional[str] = None
    performed_by: str = "Lead Public Info Officer"


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    alert_code: str
    title: str
    category: str
    severity: str
    credibility: str
    district: str
    message: str
    source: str
    is_active: bool
    flags_for_review: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime


# ----------------- Audit Events -----------------
class AuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    entity_type: str
    entity_id: str
    action: str
    performed_by: str
    details: str
    timestamp: datetime.datetime


# ----------------- Stats & Overview -----------------
class StatsOverview(BaseModel):
    total_requests: int
    critical_requests: int
    active_assignments: int
    available_resources: int
    total_shelters: int
    total_shelter_capacity: int
    current_shelter_occupancy: int
    active_alerts: int
    unconfirmed_alerts: int
    duplicate_requests: int
    resolved_requests: int
