"""
Centralised .env loader for the GhostShift backend.

Other modules call `load_env()` at import time so that any env-var driven
configuration (JWT_SECRET, DATABASE_URL, etc.) is available before the
module-level constants are read.
"""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv  # type: ignore

    _loaded = False

    def load_env() -> bool:
        """Load .env into os.environ. Idempotent; returns True if loaded."""
        global _loaded
        if _loaded:
            return True
        here = Path(__file__).resolve().parent
        for candidate in [here.parent / ".env", here / ".env", Path.cwd() / ".env"]:
            if candidate.exists():
                load_dotenv(candidate, override=False)
                _loaded = True
                return True
        return False

    load_env()
except ImportError:  # pragma: no cover - dotenv not installed
    def load_env() -> bool:  # type: ignore
        return False
