# backend/app/api/v1/router.py
from fastapi import APIRouter

from .applications import router as application_router
from .auth import router as auth_router
from .events import router as event_router
from .notifications import router as notification_router
from .providers import router as provider_router
from .templates import router as template_router
from .reports import router as report_router
from .monitoring import router as monitoring_router


api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(application_router)
api_router.include_router(event_router)
api_router.include_router(notification_router)
api_router.include_router(provider_router)
api_router.include_router(template_router)
api_router.include_router(report_router)
api_router.include_router(monitoring_router)