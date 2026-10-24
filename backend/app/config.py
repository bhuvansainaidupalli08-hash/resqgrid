import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "ResQGrid Disaster Relief Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database URL: defaults to local SQLite, easily overridden with Supabase/PostgreSQL URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resqgrid.db")
    
    # CORS: Allow local dev ports, preview ports, and production frontends
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*"
    ]
    
    # Demo and safety settings
    DEMO_MODE: bool = True
    MAX_REQUESTS_PER_MINUTE: int = 120

settings = Settings()
