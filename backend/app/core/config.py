import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "WESAL - Smart Hospital Visitor Management & Access Control"
    HOSPITAL_NAME: str = "Sultan Qaboos Hospital"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "wesal-sultan-qaboos-hospital-secret-key-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./wesal.db"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()
