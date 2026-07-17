from fastapi import FastAPI

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