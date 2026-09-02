from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.settings import settings


class AuthenticationMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        public_paths = (
            "/",
            "/health",
            "/api/v1/health",
            "/metrics",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/token",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/validate",
            "/api/v1/auth/logout",
        )

        if request.url.path in public_paths:
            return await call_next(request)

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing Authorization header"},
            )

        try:
            scheme, token = auth_header.split()

            if scheme.lower() != "bearer":
                raise ValueError("Authorization scheme must be Bearer")

            jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )

        except (JWTError, ValueError):
            return JSONResponse(
                status_code=401,
                content={"detail": "The provided token is invalid or has expired. Please obtain a new token."},
            )

        return await call_next(request)