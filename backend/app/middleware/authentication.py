from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from app.config.settings import settings


class AuthenticationMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request, call_next):

        public_prefixes = (
            "/",
            "/health",
            "/metrics",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/token",
        )

        if any(request.url.path.startswith(path) for path in public_prefixes):
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
                raise ValueError()

            jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=["HS256"],
            )

        except (JWTError, ValueError):
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token"},
            )

        return await call_next(request)