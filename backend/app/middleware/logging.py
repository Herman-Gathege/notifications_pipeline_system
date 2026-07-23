import logging
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("notification-platform")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        start = time.time()

        response = await call_next(request)

        duration = round(time.time() - start, 4)

        logger.info(
            "%s %s %s %.4fs",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )

        return response