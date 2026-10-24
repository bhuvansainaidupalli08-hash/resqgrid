# ResQGrid — Next-Generation Disaster Relief Coordination Platform
> **IMPACTX 2026 Challenge:** *“Disaster Relief, From Alert to Assistance”*

ResQGrid is a full-stack, mission-critical emergency management and triage platform built to coordinate disaster response across citizens, coordinators, field rescue squads, and emergency evacuation shelters.

---

## 1. System Architecture

```
[ Citizens & Public ] <==== (Encrypted Intake & Masked Views) ====> [ ResQGrid React 19 Frontend ]
                                                                             |
                                                                             | (REST API + JSON)
                                                                             v
                                                                 [ FastAPI Backend Engine ]
                                                                      |             |
                                                    (SQLAlchemy ORM) |             | (Audit Logger)
                                                                      v             v
                                                       [ SQLite / Supabase PostgreSQL ]
```

### Technology Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide Icons, Leaflet (Dark Matter CartoDB tiles).
- **Backend:** Python 3.13, FastAPI, Pydantic v2 (strict validation & schemas), SQLAlchemy 2.0 ORM.
- **Database:** Local SQLite (`resqgrid.db`) with one-line config switch to cloud Supabase PostgreSQL.
- **Testing:** Pytest, HTTPX, and live end-to-end integration test suites.
- **Deployment:** Render (`render.yaml`), Vercel (`vercel.json`), Docker (`Dockerfile`).

---

## 2. Core IMPACTX 2026 Test Scenarios

The platform includes seed data representing real-world crisis challenges across four sectors (**Northview**, **Riverdale**, **Eastwood**, **Southpoint**):

1. **Oxygen-Dependent Resident:** Harold Vance (`REQ-2026-001`) in Northview. Power substation failure with failing battery inverter and rising basement flood waters.
2. **Elderly Resident Reported by Neighbour:** Margaret O'Malley (`REQ-2026-002`) in Eastwood. Neighbour Martha Stewart reported mobility-impaired resident trapped on 2nd floor.
3. **Disputed Evacuation Alert:** `ALT-2026-01` in Southpoint Sector 4. Social media audio claiming mandatory evacuation; flagged and marked DISPUTED by official EOC.
4. **Conflicting Infrastructure Telemetry:** `ALT-2026-02`. Riverdale Causeway Bridge reported closed by civilian 911 calls vs police patrol reporting emergency lane passable.
5. **Stale Shelter Telemetry:** Eastwood High School Shelter headcount last updated 6 hours ago; flagged with `STALE TELEMETRY — AUDIT REQUIRED`.
6. **Resource Double-Booking Prevention:** Conflicting assignment of `BOAT-01` prevented by backend transactional validation.
7. **Offline Draft Queue & Idempotency:** Citizens submitting during cell tower drop have drafts stored locally with `NOT SENT — WAITING FOR CONNECTION` and can retry with zero duplicates.

---

## 3. Local Quickstart

### Prerequisites
- Node.js (v18+) and npm
- Python 3.10+

### Step 1: Run the Backend
```bash
# In project root
python -m venv venv
.\venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate

pip install -r backend/requirements.txt

# Run server on port 8000
python -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
- API will be accessible at: `http://localhost:8000`
- Interactive Swagger docs at: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Step 2: Run the Frontend
```bash
# In frontend directory
cd frontend
npm install
npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 4. Switching to Supabase / Hosted PostgreSQL

1. Create a project at [supabase.com](https://supabase.com).
2. Retrieve your PostgreSQL connection string from **Project Settings > Database > URI**.
3. In `backend/.env` (or cloud host environment variables), set:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Restart the backend. SQLAlchemy will automatically create all tables and apply seed demonstrations.

---

## 5. Live Cloud Deployment Guide

### Deploy Backend to Render
1. Push repository to GitHub.
2. Log into [Render.com](https://render.com) and click **New > Blueprint**.
3. Connect your repository. Render reads `render.yaml` automatically and configures both `resqgrid-api` and `resqgrid-web`.
4. Alternatively, create a **Web Service** with:
   - **Runtime:** Python
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** `ENVIRONMENT=production`, `DEMO_MODE=true`, `CORS_ORIGINS=["*"]`

### Deploy Frontend to Vercel
1. Log into [Vercel.com](https://vercel.com) and import the repository.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `VITE_API_URL`: URL of your deployed backend (e.g., `https://resqgrid-api.onrender.com`).
4. Click **Deploy**.

---

## 6. Five-Minute Hackathon Demonstration Sequence

1. **Overview & Sector Situation (1 min):**
   - Open Command Overview. Show real-time KPI counters: Critical Requests, Active Missions, Fleet Capacity, Shelters Occupancy.
   - Show the IMPACTX Challenge test cases checklist.
2. **Interactive Tactical Map (1 min):**
   - Switch to **Tactical Map**. Show CartoDB Dark Matter map with Riverdale flood inundation polygon, Causeway bridge conflict line, pulsating critical emergency pins, and shelters.
3. **Offline Resilience & Citizen Intake (1 min):**
   - In header, click **Simulate Drop** (Offline mode). Show `OFFLINE DRAFT MODE` badge.
   - Fill out an emergency request in **Citizen Request Intake** and submit.
   - Show draft saved in local browser persistence: `NOT SENT — WAITING FOR CONNECTION`.
   - Click **Disable Sim**, click **Sync Now**. Request transmits cleanly with Tracking Code.
4. **Coordinator Triage & Resource Dispatch (1.5 min):**
   - Switch role to **Coordinator**.
   - Show Harold Vance oxygen-dependent request and Margaret O'Malley elderly resident.
   - Click **Verify Credibility**: Corroborate with drone telemetry.
   - Click **Dispatch Resource**: Assign `BOAT-01` (Swift Water Rescue Boat Alpha).
   - In **Rescue Fleet**, transition mission: `ASSIGNED` -> `EN_ROUTE` -> `ON_SCENE` -> `COMPLETED`.
   - Show `BOAT-01` automatically released back to `AVAILABLE`.
   - Mark request `RESOLVED` with confirmed evacuation notes.
5. **Auditing & Privacy Masking (0.5 min):**
   - Switch to **Public View**: Observe citizen phone numbers and medical details masked.
   - Open **Operational Audit Ledger**: Point out complete attribution trail for all triage decisions.

---

## 7. Automated Test Verification Results

All tests have been run locally and passed:

```
backend/tests/test_api.py::test_health_check PASSED                      [11%]
backend/tests/test_api.py::test_list_requests_privacy_masking_for_public PASSED [22%]
backend/tests/test_api.py::test_list_requests_unmasked_for_coordinator PASSED [33%]
backend/tests/test_api.py::test_create_emergency_request_success PASSED  [44%]
backend/tests/test_api.py::test_invalid_emergency_request_rejected PASSED [55%]
backend/tests/test_api.py::test_conflict_prevention_on_resource_assignment PASSED [66%]
backend/tests/test_api.py::test_request_resolution_requires_confirmation_notes PASSED [77%]
backend/tests/test_api.py::test_audit_log_persists_events PASSED         [88%]
backend/tests/test_api.py::test_operational_stats_metrics PASSED         [100%]
============================== 9 passed in 1.04s ===============================
```

Live system verification script (`backend/test_live_system.py`) executed against live server:
```
[OK] Health check succeeded: healthy
[OK] Citizen Emergency Request created: REQ-2026-006 (ID: 6)
[OK] Public Privacy Masking verified: Phone and medical special needs protected
[OK] Coordinator Clearance verified: Unmasked full medical telemetry & contact phone
[OK] Credibility Elevated: VERIFIED (Drone corroborated)
[OK] Resource Assigned: Swift Water Rescue Boat Alpha (BOAT-01)
[OK] Conflict Prevention Confirmed: Double-booking rejected with HTTP 400
[OK] Assignment transitioned: EN_ROUTE -> ON_SCENE -> COMPLETED
[OK] Assignment COMPLETED: Resource released back to AVAILABLE
[OK] Request REQ-2026-006 confirmed RESOLVED with outcome documentation
[OK] Audit Ledger verified: Events recorded with full attribution
================ ALL LIVE END-TO-END WORKFLOW CHECKS PASSED! =================
```
