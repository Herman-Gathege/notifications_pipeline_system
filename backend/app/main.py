from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from app.api.v1.router import api_router
from app.config.settings import settings
from app.middleware.authentication import AuthenticationMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_id import RequestIDMiddleware


app = FastAPI(
    title="FikaTu API",
    description="FikaTu — Centralized Notification Platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthenticationMiddleware)


@app.get("/")
async def root():
    return {
        "message": "FikaTu — Centralized Notification Platform",
        "status": "running",
    }


@app.get("/health")
@app.get("/api/v1/health")
async def health():
    return {
        "status": "healthy",
        "service": "fikatu",
        "version": "1.0.0",
    }


@app.get("/metrics")
def metrics():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


app.include_router(api_router)