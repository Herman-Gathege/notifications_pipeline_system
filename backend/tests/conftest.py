"""
Pytest bootstrap for the FikaTu backend.

Adds the backend root (``parent of tests/``) to ``sys.path`` so that
``import app.…`` resolves when ``pytest`` is invoked from inside the
container or from the project root.
"""

import os
import sys

_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_ROOT not in sys.path:
    sys.path.insert(0, _BACKEND_ROOT)
