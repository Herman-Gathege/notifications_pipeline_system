#backend/app/main.py
from fastapi import FastAPI, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from app.api.v1.router import api_router 
from app.api.v1 import auth
from app.middleware.authentication import AuthenticationMiddleware
from app.middleware.logging import LoggingMiddleware
from app.middleware.request_id import RequestIDMiddleware

app = FastAPI(
    title="Notification Platform API",
    description="Centralized Notification Platform",
    version="1.0.0",
)

app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(AuthenticationMiddleware)

@app.get("/")
async def root():
    return {
        "message": "Notification Platform API",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "notification-platform",
        "version": "1.0.0",
    }



@app.get("/metrics")
def metrics():
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )

app.include_router(api_router)
app.include_router(
    auth.router,
    prefix="/api/v1",
)