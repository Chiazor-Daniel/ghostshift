"""Lightweight realtime broadcast helper — safe to call from sync route handlers."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)


def _manager():
    try:
        from websocket.app import manager
        return manager
    except Exception:
        return None


async def _broadcast(message: dict) -> None:
    mgr = _manager()
    if not mgr:
        return
    try:
        await mgr.broadcast(message)
    except Exception as exc:
        logger.debug("WebSocket broadcast skipped: %s", exc)


def notify_org(
    org_id: str,
    event_type: str,
    *,
    title: str = "",
    body: str = "",
    data: Optional[dict] = None,
) -> None:
    """Fire-and-forget org-wide event for connected clients."""
    message = {
        "type": event_type,
        "org_id": org_id,
        "title": title,
        "body": body,
        "data": data or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_broadcast(message))
    except RuntimeError:
        # No running loop (e.g. during tests) — skip silently.
        pass
