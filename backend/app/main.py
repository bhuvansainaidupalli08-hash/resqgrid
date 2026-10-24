import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .routes import requests, assignments, resources, shelters, alerts, audit, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Seed demonstration dataset
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ResQGrid: Next-Generation Real-Time Disaster Relief Coordination Platform (IMPACTX 2026 Challenge)",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "description": "ResQGrid Disaster Relief Coordination Platform API (IMPACTX 2026)",
        "docs_url": "/docs",
        "health_url": "/health",
        "endpoints": {
            "requests": "/api/requests",
            "assignments": "/api/assignments",
            "resources": "/api/resources",
            "shelters": "/api/shelters",
            "alerts": "/api/alerts",
            "audit": "/api/audit",
            "stats": "/api/stats"
        }
    }

# Health endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "database": "connected"
    }

# Include routers
app.include_router(requests.router)
app.include_router(assignments.router)
app.include_router(resources.router)
app.include_router(shelters.router)
app.include_router(alerts.router)
app.include_router(audit.router)
app.include_router(stats.router)
