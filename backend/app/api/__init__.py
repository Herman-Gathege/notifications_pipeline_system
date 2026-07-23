#backend/app/api/__init__.py
from .v1.router import api_router


__all__ = ["api_router"]