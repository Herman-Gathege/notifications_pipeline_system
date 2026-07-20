#backend/app/api/v1/router.py
from fastapi import APIRouter

from .applications import router as application_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(application_router)