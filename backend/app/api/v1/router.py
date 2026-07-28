# backend/app/api/v1/router.py
from fastapi import APIRouter

from .applications import router as application_router
from .auth import router as auth_router
from .events import router as event_router
from .notifications import router as notification_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(application_router)
api_router.include_router(event_router)
api_router.include_router(notification_router)