from fastapi import FastAPI, Response
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

app = FastAPI(
    title="Notification Platform API",
    description="Centralized Notification Platform",
    version="1.0.0",
)


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