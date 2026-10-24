import datetime
from sqlalchemy.orm import Session
from .models import User, EmergencyRequest, VerificationRecord, Resource, Assignment, Shelter, Alert, AuditEvent

def seed_database(db: Session):
    # Check if data already exists
    if db.query(EmergencyRequest).first():
        return {"status": "already_seeded", "message": "Database already contains seed data"}

    now = datetime.datetime.utcnow()

    # 1. Users
    users = [
        User(
            username="coordinator_sarah",
            email="sarah.chen@resqgrid.demo",
            full_name="Sarah Chen (Lead Emergency Coordinator)",
            role="COORDINATOR",
            district="Command HQ",
            is_active=True
        ),
        User(
            username="responder_marcus",
            email="marcus.vance@resqgrid.demo",
            full_name="Marcus Vance (Field Team Bravo)",
            role="RESPONDER",
            district="Riverdale",
            is_active=True
        ),
        User(
            username="volunteer_elena",
            email="elena.rostova@resqgrid.demo",
            full_name="Elena Rostova (Community Aid)",
            role="VOLUNTEER",
            district="Eastwood",
            is_active=True
        ),
    ]
    db.add_all(users)
    db.flush()

    # 2. Shelters
    shelters = [
        Shelter(
            name="Eastwood Community High School Shelter",
            district="Eastwood",
            address="1400 Eastwood Blvd",
            latitude=37.7780,
            longitude=-122.4120,
            capacity=250,
            current_occupancy=230,
            status="NEAR_CAPACITY",
            supplies_status="ADEQUATE",
            medical_support=True,
            freshness_timestamp=now - datetime.timedelta(hours=6),  # Stale data scenario
            contact_info="Capt. Harris (Freq: 154.2 MHz / +1 555-0192)",
            notes="WARNING: Stale occupancy telemetry (last verified 6 hours ago). Needs physical count audit."
        ),
        Shelter(
            name="Northview Civic Sports Complex",
            district="Northview",
            address="820 Northview Parkway",
            latitude=37.7950,
            longitude=-122.4280,
            capacity=400,
            current_occupancy=185,
            status="OPEN",
            supplies_status="ADEQUATE",
            medical_support=True,
            freshness_timestamp=now - datetime.timedelta(minutes=25),
            contact_info="Supervisor Miller (+1 555-0144)",
            notes="Equipped with emergency diesel generator and auxiliary oxygen supplies."
        ),
        Shelter(
            name="Riverdale Central Evacuation Center",
            district="Riverdale",
            address="310 Riverdale Crossing",
            latitude=37.7620,
            longitude=-122.4350,
            capacity=180,
            current_occupancy=178,
            status="FULL",
            supplies_status="LOW",
            medical_support=False,
            freshness_timestamp=now - datetime.timedelta(minutes=15),
            contact_info="Director Gomez (+1 555-0187)",
            notes="Bottled water and cots low. Requesting supply delivery from Eastwood logistics hub."
        ),
        Shelter(
            name="Southpoint Maritime Terminal Relief Station",
            district="Southpoint",
            address="50 Harbour Way, Southpoint",
            latitude=37.7450,
            longitude=-122.4050,
            capacity=300,
            current_occupancy=90,
            status="OPEN",
            supplies_status="ADEQUATE",
            medical_support=True,
            freshness_timestamp=now - datetime.timedelta(minutes=40),
            contact_info="Chief O'Connor (+1 555-0120)",
            notes="Direct deep-water dock access for rescue boats and maritime transports."
        ),
    ]
    db.add_all(shelters)
    db.flush()

    # 3. Resources (Demonstrating limited rescue boat constraints)
    resources = [
        Resource(
            resource_code="BOAT-01",
            name="Swift Water Rescue Boat Alpha",
            type="RESCUE_BOAT",
            status="AVAILABLE",
            district="Riverdale",
            current_location="Riverdale Marina Pier 3",
            capacity_units=6,
            callsign="WATER-RESCUE-1",
            contact_number="+1 555-0301",
            notes="Equipped with sonar, thermal camera, and life vests. Crew: 3 trained divers."
        ),
        Resource(
            resource_code="BOAT-02",
            name="Delta Flood Rescue Zodiac",
            type="RESCUE_BOAT",
            status="MAINTENANCE",
            district="Southpoint",
            current_location="Southpoint Maintenance Yard",
            capacity_units=4,
            callsign="WATER-RESCUE-2",
            contact_number="+1 555-0302",
            notes="OUT OF SERVICE: Propeller shaft damage from debris. ETA 4 hours to repair."
        ),
        Resource(
            resource_code="AMB-01",
            name="Heavy Duty 4x4 Mobile Paramedic Unit",
            type="AMBULANCE",
            status="AVAILABLE",
            district="Northview",
            current_location="Northview Fire Station 9",
            capacity_units=2,
            callsign="MEDIC-44",
            contact_number="+1 555-0303",
            notes="Fitted with portable ventilators, AED, and emergency oxygen tanks."
        ),
        Resource(
            resource_code="TRUCK-01",
            name="High-Clearance Evacuation Transport",
            type="EVAC_4X4",
            status="AVAILABLE",
            district="Eastwood",
            current_location="Eastwood DPW Depot",
            capacity_units=16,
            callsign="TRAN-EAST-1",
            contact_number="+1 555-0304",
            notes="Can ford through 3.5 ft standing flood water."
        ),
        Resource(
            resource_code="VOL-01",
            name="Eastwood Rapid Volunteer Squad 4",
            type="VOLUNTEER_TEAM",
            status="AVAILABLE",
            district="Eastwood",
            current_location="Eastwood Community Center",
            capacity_units=8,
            callsign="VOL-SQUAD-4",
            contact_number="+1 555-0305",
            notes="Volunteer team specializing in elderly mobility evacuation and wellness checks."
        ),
    ]
    db.add_all(resources)
    db.flush()

    # 4. Emergency Requests (Covering the specific IMPACTX challenge test cases)
    requests = [
        # Test Case 1: Oxygen-dependent bedridden resident
        EmergencyRequest(
            request_code="REQ-2026-001",
            citizen_name="Harold Vance (Caregiver: Clara Vance)",
            contact_phone="+1 555-0811",
            district="Northview",
            location_address="412 Pinecrest Ridge, Northview",
            latitude=37.7925,
            longitude=-122.4245,
            emergency_type="MEDICAL",
            urgency_level="CRITICAL",
            details="Patient is bedridden and oxygen-dependent (5L/min). Grid power has failed and backup battery inverter is at 18%, estimated 50 minutes remaining. Basement flood water approaching breaker box.",
            special_needs="OXYGEN DEPENDENT - CRITICAL. Bedridden patient requires stretcher evacuation.",
            status="UNDER_REVIEW",
            credibility="CORROBORATED",
            credibility_notes="Corroborated by power utility grid map confirming substation outage in sector N-4.",
            reporter_type="SELF",
            is_duplicate=False,
            idempotency_key="DEMO-IDEM-001",
            created_at=now - datetime.timedelta(minutes=35),
            updated_at=now - datetime.timedelta(minutes=10)
        ),
        # Test Case 2: Elderly resident reported by neighbour
        EmergencyRequest(
            request_code="REQ-2026-002",
            citizen_name="Margaret O'Malley (Reported by neighbour Martha Stewart)",
            contact_phone="+1 555-0923",
            district="Eastwood",
            location_address="188 Elm Court, Apt 2B, Eastwood",
            latitude=37.7812,
            longitude=-122.4150,
            emergency_type="RESCUE",
            urgency_level="HIGH",
            details="Neighbour reporting 84-year-old Margaret lives alone on 2nd floor with walker. Ground floor lobby is submerged under 2 feet of water. Resident is unable to negotiate emergency stairs without assistance.",
            special_needs="Elderly resident with severe mobility limitation; needs physical carry assist down external fire escape.",
            status="RECEIVED",
            credibility="UNCONFIRMED",
            credibility_notes="Reported by third-party neighbour Martha Stewart. Needs direct phone or field contact verification.",
            reporter_type="NEIGHBOUR",
            is_duplicate=False,
            idempotency_key="DEMO-IDEM-002",
            created_at=now - datetime.timedelta(minutes=22),
            updated_at=now - datetime.timedelta(minutes=22)
        ),
        # Test Case 3: Water rescue in Riverdale (Basement flood - duplicate 1)
        EmergencyRequest(
            request_code="REQ-2026-003",
            citizen_name="David Chen",
            contact_phone="+1 555-0744",
            district="Riverdale",
            location_address="744 Riverdale Marsh Road",
            latitude=37.7654,
            longitude=-122.4388,
            emergency_type="RESCUE",
            urgency_level="CRITICAL",
            details="Rapid river bank overflow into residential property. 3 adults and 1 dog stranded on front porch roof as flood reaches 5 feet.",
            special_needs="Family stranded on roof; requires shallow-draft rescue boat.",
            status="VERIFIED",
            credibility="VERIFIED",
            credibility_notes="Visual confirmation via drone reconnaissance unit Raven-2.",
            reporter_type="SELF",
            is_duplicate=False,
            idempotency_key="DEMO-IDEM-003",
            created_at=now - datetime.timedelta(minutes=48),
            updated_at=now - datetime.timedelta(minutes=15)
        ),
        # Test Case 4: Duplicate report of Test Case 3
        EmergencyRequest(
            request_code="REQ-2026-004",
            citizen_name="Linda Chen (Co-resident)",
            contact_phone="+1 555-0749",
            district="Riverdale",
            location_address="744 Riverdale Marsh Road, Unit A",
            latitude=37.7655,
            longitude=-122.4389,
            emergency_type="RESCUE",
            urgency_level="CRITICAL",
            details="Water rising fast around our house at 744 Marsh Rd. Please send boat!",
            special_needs="Stranded on roof with family.",
            status="UNDER_REVIEW",
            credibility="CORROBORATED",
            credibility_notes="FLAGGED AS PROBABLE DUPLICATE of REQ-2026-003 (Identical coordinates and family name). Preserved for audit.",
            reporter_type="SELF",
            is_duplicate=True,
            duplicate_reference="REQ-2026-003",
            idempotency_key="DEMO-IDEM-004",
            created_at=now - datetime.timedelta(minutes=30),
            updated_at=now - datetime.timedelta(minutes=12)
        ),
        # Test Case 5: Southpoint isolated nursing home food/water supply
        EmergencyRequest(
            request_code="REQ-2026-005",
            citizen_name="Nurse Supervisor Angela Adams",
            contact_phone="+1 555-0633",
            district="Southpoint",
            location_address="12 Shoreline Point, Southpoint Care Facility",
            latitude=37.7420,
            longitude=-122.4080,
            emergency_type="FOOD_WATER",
            urgency_level="HIGH",
            details="Facility has 34 residents. Road cut off by fallen trees and downed power lines. Potable water reserve down to 24-hour supply.",
            special_needs="34 senior citizens, requires potable water crates and basic dietary supplies.",
            status="RECEIVED",
            credibility="VERIFIED",
            credibility_notes="Facility verified on municipal emergency registry.",
            reporter_type="FIRST_RESPONDER",
            is_duplicate=False,
            idempotency_key="DEMO-IDEM-005",
            created_at=now - datetime.timedelta(minutes=65),
            updated_at=now - datetime.timedelta(minutes=65)
        ),
    ]
    db.add_all(requests)
    db.flush()

    # 5. Verification History records
    verif1 = VerificationRecord(
        request_id=requests[0].id,
        previous_credibility="UNCONFIRMED",
        new_credibility="CORROBORATED",
        notes="Corroborated by power grid outage report in Northview sector N-4. Oxygen equipment confirmed with primary care physician registry.",
        verified_by="Sarah Chen (Lead Coordinator)",
        created_at=now - datetime.timedelta(minutes=20)
    )
    verif3 = VerificationRecord(
        request_id=requests[2].id,
        previous_credibility="UNCONFIRMED",
        new_credibility="VERIFIED",
        notes="Drone Raven-2 transmitted video feed confirming 3 persons and dog on roof of 744 Marsh Rd.",
        verified_by="Sarah Chen (Lead Coordinator)",
        created_at=now - datetime.timedelta(minutes=15)
    )
    db.add_all([verif1, verif3])

    # 6. Alerts (Covering fake alert, conflicting bridge reports, network outages)
    alerts = [
        # Test Case: Potentially fake evacuation alert
        Alert(
            alert_code="ALT-2026-01",
            title="UNVERIFIED NOTICE: Rumored Mandatory Evacuation for Southpoint Sector 4",
            category="EVACUATION",
            severity="WARNING",
            credibility="DISPUTED",
            district="Southpoint",
            message="Social media claims of an immediate mandatory evacuation order for Southpoint Sector 4 have NOT been authorized by the Unified Disaster Command. Southpoint levee remains structurally sound. Residents should shelter in place and await official sirens.",
            source="Social Media Rumor Monitoring",
            is_active=True,
            flags_for_review="FLAGGED FOR REVIEW: Viral audio clip purporting to be Police Chief. Authenticity disputed by Emergency Operations Center.",
            created_at=now - datetime.timedelta(minutes=50),
            updated_at=now - datetime.timedelta(minutes=10)
        ),
        # Test Case: Conflicting bridge status reports
        Alert(
            alert_code="ALT-2026-02",
            title="INFRASTRUCTURE CONFLICT: Riverdale Causeway Bridge Status Under Evaluation",
            category="INFRASTRUCTURE",
            severity="CRITICAL",
            credibility="CORROBORATED",
            district="Riverdale",
            message="Civilian motorists report bridge closed due to structural vibration. However, Police Patrol Unit 12 reports the inbound emergency lane is passable for high-clearance rescue vehicles only. Structural engineering team is en route. Non-emergency traffic MUST detour via Eastwood Expressway.",
            source="Police Patrol 12 vs Civilian 911 Calls",
            is_active=True,
            flags_for_review="CONFLICT DETECTED: 2 opposing reports. Bridge restricted to emergency convoys only until engineer sign-off.",
            created_at=now - datetime.timedelta(minutes=40),
            updated_at=now - datetime.timedelta(minutes=5)
        ),
        # Test Case: Partial mobile-network outage
        Alert(
            alert_code="ALT-2026-03",
            title="COMMUNICATION ADVISORY: Partial Cellular Tower Outage in Northview Sector B",
            category="PUBLIC_SAFETY",
            severity="WARNING",
            credibility="VERIFIED",
            district="Northview",
            message="Tower N-09 is operating on auxiliary battery backup with 60% packet loss. Citizens submitting emergency requests through ResQGrid are advised that offline draft queuing is active. Requests will auto-sync when line-of-sight signal is acquired.",
            source="Telecom Infrastructure Liaison",
            is_active=True,
            flags_for_review=None,
            created_at=now - datetime.timedelta(minutes=75),
            updated_at=now - datetime.timedelta(minutes=30)
        ),
        Alert(
            alert_code="ALT-2026-04",
            title="WEATHER BULLETIN: Flash Flood Warning in Riverdale Basin",
            category="WEATHER",
            severity="CRITICAL",
            credibility="VERIFIED",
            district="Riverdale",
            message="Water levels in Riverdale basin have exceeded crest stage by 1.8 meters. Rapid runoff expected to continue for next 3 hours.",
            source="National Weather Service",
            is_active=True,
            flags_for_review=None,
            created_at=now - datetime.timedelta(minutes=90),
            updated_at=now - datetime.timedelta(minutes=60)
        ),
    ]
    db.add_all(alerts)
    db.flush()

    # 7. Audit Events
    audit_events = [
        AuditEvent(
            entity_type="SYSTEM",
            entity_id="SYS-BOOT",
            action="INITIALIZE",
            performed_by="System",
            details="ResQGrid emergency coordination platform initialized with IMPACTX 2026 synthetic exercise scenario.",
            timestamp=now - datetime.timedelta(minutes=100)
        ),
        AuditEvent(
            entity_type="REQUEST",
            entity_id="REQ-2026-001",
            action="CREATE",
            performed_by="Citizen (Harold/Clara Vance)",
            details="Emergency request submitted: Bedridden oxygen-dependent resident at 412 Pinecrest Ridge.",
            timestamp=now - datetime.timedelta(minutes=35)
        ),
        AuditEvent(
            entity_type="REQUEST",
            entity_id="REQ-2026-001",
            action="CREDIBILITY_UPDATE",
            performed_by="Sarah Chen (Lead Coordinator)",
            details="Credibility elevated from UNCONFIRMED to CORROBORATED based on electrical grid telemetry.",
            timestamp=now - datetime.timedelta(minutes=20)
        ),
        AuditEvent(
            entity_type="ALERT",
            entity_id="ALT-2026-01",
            action="CREDIBILITY_UPDATE",
            performed_by="Sarah Chen (Lead Coordinator)",
            details="Alert flagged as DISPUTED: No official evacuation ordered for Southpoint Sector 4.",
            timestamp=now - datetime.timedelta(minutes=10)
        ),
    ]
    db.add_all(audit_events)
    db.commit()

    return {"status": "success", "message": "Synthetic demonstration dataset successfully loaded."}
