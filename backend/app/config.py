import os
from typing import List


class Settings:
    """Application settings loaded from environment variables with defaults."""

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "sqlite:///./data/schedule.db"
    )

    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "capacitor://localhost",
    ]

    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    @classmethod
    def get_cors_origins(cls) -> List[str]:
        env_origins = os.getenv("CORS_ORIGINS")
        if env_origins:
            return [origin.strip() for origin in env_origins.split(",")]
        return cls.CORS_ORIGINS


settings = Settings()
