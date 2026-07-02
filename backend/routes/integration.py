"""Integration routes — AI assistant (tool-using agent), Slack, Google calendar."""
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config.database import get_db
from config.env import load_env
load_env()

from middleware.auth import get_current_user
from ai_ml.assistant import ai_assistant
from ai_ml.agent import AgentLoop, build_history_from_turns
from ai_ml.tools import tools_for_role
from models.conversation import ConversationTurn
from models.organization import Organization, Department

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Pydantic request shapes ─────────────────────────────────────────────


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[dict] = {}


class ShiftRecommendationRequest(BaseModel):
    department_id: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None
    required_roles: list = []
    hours_needed: int = 0


class BurnoutAnalysisRequest(BaseModel):
    employee_data: dict = {}


class ScheduleOptimizationRequest(BaseModel):
    org_id: Optional[str] = None
    date_range: dict = {}
    constraints: dict = {}


def _new_turn_id() -> str:
    return f"ct_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(4)}"


def _persist_turn(db: Session, *, turn_id, org_id, user_id, session_id,
                  role, content=None, tool_name=None, tool_args=None, tool_result=None):
    t = ConversationTurn(
        id=turn_id,
        org_id=org_id,
        user_id=user_id,
        session_id=session_id,
        role=role,
        content=content,
        tool_name=tool_name,
        tool_args=tool_args,
        tool_result=tool_result,
        created_at=datetime.now(timezone.utc),
    )
    db.add(t)
    return t


# ─── AI chat (the real one now) ──────────────────────────────────────────


@router.post("/ai/chat")
async def ai_chat(request: Request, payload: dict, db: Session = Depends(get_db)):
    """Tool-using AI assistant with per-user conversation memory.

    Body: {message, session_id?}
    Returns: {response, session_id, tool_calls, iterations, available_tools}
    """
    user = await get_current_user(request, db)
    message = (payload.get("message") or "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required")

    session_id = payload.get("session_id") or secrets.token_urlsafe(16)

    # Fetch history for this session (last 20 turns)
    history_rows = (
        db.query(ConversationTurn)
        .filter(
            ConversationTurn.user_id == user.id,
            ConversationTurn.session_id == session_id,
        )
        .order_by(ConversationTurn.created_at.asc())
        .all()
    )
    # Trim to last 20 user/assistant messages so we don't blow context
    history_rows = [t for t in history_rows if t.role in ("user", "assistant")][-20:]
    history = build_history_from_turns(history_rows)

    # Org context for the system prompt
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    org_name = org.name if org else "your organization"
    dept_rows = db.query(Department).filter(Department.org_id == user.org_id).limit(50).all()
    departments = [d.name for d in dept_rows]

    # Build the agent fresh each request so role changes (and tool additions) take effect
    tools = tools_for_role(user.role)
    if not ai_assistant.client:
        # No LLM configured — degrade gracefully
        return {
            "response": "The AI service is not configured on this server. Please set GROQ_API_KEY in the backend .env and restart.",
            "session_id": session_id,
            "tool_calls": [],
            "iterations": 0,
            "available_tools": [t.name for t in tools],
        }
    agent = AgentLoop(
        client=ai_assistant.client,
        model=ai_assistant.model,
        tools=tools,
    )

    # Persist user turn BEFORE running the agent so we don't lose it on crash
    _persist_turn(
        db, turn_id=_new_turn_id(),
        org_id=user.org_id, user_id=user.id, session_id=session_id,
        role="user", content=message,
    )

    result = agent.run(
        db=db,
        user=user,
        message=message,
        history=history,
        org_name=org_name,
        departments=departments,
    )

    # Persist assistant turn + tool turns (collapsed into assistant content)
    _persist_turn(
        db, turn_id=_new_turn_id(),
        org_id=user.org_id, user_id=user.id, session_id=session_id,
        role="assistant",
        content=result.response,
    )
    for tc in result.tool_calls:
        _persist_turn(
            db, turn_id=_new_turn_id(),
            org_id=user.org_id, user_id=user.id, session_id=session_id,
            role="tool",
            tool_name=tc.get("name"),
            tool_args=tc.get("args"),
            tool_result=tc.get("result"),
        )
    db.commit()

    return {
        "response": result.response,
        "session_id": session_id,
        "tool_calls": [
            {"name": tc["name"], "args": tc["args"], "result": tc["result"]}
            for tc in result.tool_calls
        ],
        "iterations": result.iterations,
        "available_tools": [t.name for t in tools],
    }


# ─── Conversation history / sessions ─────────────────────────────────────


@router.get("/ai/history")
async def ai_history(
    request: Request,
    session_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Return prior turns for the given session_id (most recent first)."""
    user = await get_current_user(request, db)
    limit = max(1, min(int(limit or 50), 200))
    rows = (
        db.query(ConversationTurn)
        .filter(
            ConversationTurn.user_id == user.id,
            ConversationTurn.session_id == session_id,
        )
        .order_by(ConversationTurn.created_at.asc())
        .limit(limit)
        .all()
    )
    return {"session_id": session_id, "turns": [t.serialize() for t in rows], "count": len(rows)}


@router.get("/ai/sessions")
async def ai_sessions(request: Request, db: Session = Depends(get_db)):
    """Return the user's recent conversation sessions with first-user-msg preview."""
    user = await get_current_user(request, db)
    # Distinct session_ids for this user, most-recent first, capped to 10
    rows = (
        db.query(ConversationTurn.session_id, ConversationTurn.created_at)
        .filter(
            ConversationTurn.user_id == user.id,
            ConversationTurn.role == "user",
        )
        .order_by(ConversationTurn.created_at.desc())
        .limit(200)
        .all()
    )
    seen = set()
    sessions = []
    for sid, ts in rows:
        if sid in seen:
            continue
        seen.add(sid)
        # First user message in that session
        first = (
            db.query(ConversationTurn)
            .filter(
                ConversationTurn.user_id == user.id,
                ConversationTurn.session_id == sid,
                ConversationTurn.role == "user",
            )
            .order_by(ConversationTurn.created_at.asc())
            .first()
        )
        last = (
            db.query(ConversationTurn)
            .filter(
                ConversationTurn.user_id == user.id,
                ConversationTurn.session_id == sid,
            )
            .order_by(ConversationTurn.created_at.desc())
            .first()
        )
        sessions.append({
            "session_id": sid,
            "first_message": (first.content[:120] if first and first.content else ""),
            "updated_at": last.created_at.isoformat() if last else None,
        })
        if len(sessions) >= 10:
            break
    return {"sessions": sessions}


@router.delete("/ai/sessions/{session_id}")
async def ai_clear_session(request: Request, session_id: str, db: Session = Depends(get_db)):
    """Wipe the user's history for a single session."""
    user = await get_current_user(request, db)
    deleted = (
        db.query(ConversationTurn)
        .filter(
            ConversationTurn.user_id == user.id,
            ConversationTurn.session_id == session_id,
        )
        .delete()
    )
    db.commit()
    return {"deleted": int(deleted), "session_id": session_id}


# ─── Other AI tools (unchanged) ─────────────────────────────────────────


@router.post("/ai/shift-recommendations")
async def shift_recommendations(request: Request, payload: dict, db: Session = Depends(get_db)):
    await get_current_user(request, db)
    response = ai_assistant.generate_shift_recommendations(
        department_id=payload.get("department_id") or payload.get("department"),
        date=payload.get("date"),
        required_roles=payload.get("required_roles", []),
        hours_needed=payload.get("hours_needed", 0),
    )
    return response


@router.post("/ai/burnout-analysis")
async def burnout_analysis(request: Request, payload: dict, db: Session = Depends(get_db)):
    await get_current_user(request, db)
    response = ai_assistant.analyze_burnout_risk(payload.get("employee_data") or {})
    return response


@router.post("/ai/schedule-optimization")
async def schedule_optimization(request: Request, payload: dict, db: Session = Depends(get_db)):
    await get_current_user(request, db)
    response = ai_assistant.generate_schedule_optimization(
        org_id=payload.get("org_id"),
        date_range=payload.get("date_range") or {},
        constraints=payload.get("constraints") or {},
    )
    return response


# ─── Stub integrations ──────────────────────────────────────────────────


@router.post("/slack")
async def slack_integration(request: Request, payload: dict):
    """Stub Slack webhook receiver."""
    await get_current_user(request)
    return {"status": "received"}


@router.post("/google")
async def google_integration(request: Request, payload: dict):
    """Stub Google calendar sync receiver."""
    await get_current_user(request)
    return {"status": "synced"}


@router.post("/webex")
async def webex_integration(request: Request, payload: dict):
    """Stub Webex integration."""
    await get_current_user(request)
    return {"status": "received"}


@router.get("/status")
async def integrations_status(request: Request, db: Session = Depends(get_db)):
    """Report which integrations are available."""
    user = await get_current_user(request, db)
    return {
        "ai_assistant": {
            "available": ai_assistant.client is not None,
            "provider": ai_assistant.provider,
            "model": getattr(ai_assistant, 'model', None),
            "tools": [t.name for t in tools_for_role(user.role)],
        },
        "burnout_predictor": {"available": True},
        "available_integrations": ["ai_assistant", "slack", "google", "webex"],
        "user_role": user.role,
    }