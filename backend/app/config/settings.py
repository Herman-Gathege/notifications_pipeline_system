# backend/app/config/settings.py
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    APP_NAME: str = "Notification Platform"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"

    DATABASE_URL: str
    SECRET_KEY: str

    REDIS_URL: str

    # SENDGRID_API_KEY: str
    # SENDGRID_FROM_EMAIL: str
    # SENDGRID_FROM_NAME: str

    RESEND_API_KEY: str
    RESEND_FROM_EMAIL: str
    RESEND_FROM_NAME: str

model_config = SettingsConfigDict(
    env_file=BASE_DIR / ".env",
    extra="ignore",
)


settings = Settings()
