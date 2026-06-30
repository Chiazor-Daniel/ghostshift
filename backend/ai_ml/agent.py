"""
Agent loop for the AI assistant.

Implements a minimal ReAct-style tool-use agent on top of any
OpenAI-compatible API (Groq, OpenAI, Ollama). The loop:

  1. Build a system prompt describing the user's role + the org context.
  2. Send the conversation (history + new message + available tool specs)
     to the LLM.
  3. If the LLM returned tool_calls, execute each via the matching Tool
     executor (which enforces RBAC), append results, and loop.
  4. If the LLM returned plain text, that is the final answer.

Hard cap: `max_iters` so a runaway loop can't hang the request.
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy.orm import Session

from config.env import load_env
load_env()

from models.user import User
from ai_ml.tools import Tool, tools_for_role, _execute

logger = logging.getLogger(__name__)


@dataclass
class AgentResult:
    response: str
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    iterations: int = 0
    raw_messages: List[Dict[str, Any]] = field(default_factory=list)


class AgentLoop:
    """Tool-using agent. Stateless across calls — pass history each time."""

    def __init__(
        self,
        client,                     # OpenAI-compatible client
        model: str,                 # model name resolved by AIAssistant
        tools: List[Tool],
        max_iters: int = 5,
        max_tokens: int = 1500,
        temperature: float = 0.4,
    ):
        if client is None:
            raise ValueError("LLM client is not configured. Check GROQ_API_KEY.")
        self.client = client
        self.model = model
        self.tools = tools
        self.tool_index = {t.name: t for t in tools}
        self.max_iters = max_iters
        self.max_tokens = max_tokens
        self.temperature = temperature

    def _system_prompt(self, user: User, org_name: str, departments: List[str]) -> str:
        tools_list = "\n".join(f"  - {t.name}: {t.description}" for t in self.tools)
        return f"""You are Shift, the AI scheduling assistant for **{org_name}**, a healthcare workforce platform.

You have tools to read and act on behalf of the user. Your tools:

{tools_list}

# Rules
1. Use a tool whenever it would answer the question more accurately than guessing.
2. **Never expose internal identifiers** — no shift IDs (s_xxx, sw_xxx, lv_xxx), user IDs (user_xxx), org IDs (org_xxx), or technical jargon like "database" / "rows" / "queries". Speak in human terms: employee names, shift titles, dates ("Tuesday July 1st"), departments.
3. **Never reveal one employee's private data** (burnout score, schedule, etc.) to another employee. Admins may see team-wide rollups; employees see only their own.
4. **Write tools (approvals, creates, sends) require explicit user intent.** If the user asks a question like "how many open shifts are there?" do NOT take action — just read data and answer. Only call a write tool when the user clearly asks you to do something ("approve...", "cancel...", "send...").
5. Hard cap: 5 tool calls per turn. After that, summarise what you have and ask the user for clarification if needed.
6. Format: respond in concise, friendly prose. Use **bold** for emphasis and short bullet lists when helpful. Don't preface with "Sure!" or "I can help with that" — get to the substance.
7. If a tool returns `ok: false` with an error, surface the error message to the user in plain language and ask if they want to proceed differently. For example, if a leave approval fails because of a conflict, say "I couldn't approve that one — there's a scheduling conflict" not "HTTPException 409".
8. For destructive asks (cancel my leave, reject leave, etc.), confirm the impact in your answer so the user understands what just happened.
9. **When you can't do something, tell the user what to do instead.** If an action requires admin and the caller is an employee, say "I can't do that for you — ask an admin (e.g. in the **Leaves** tab) to approve it." If a tool isn't available, point them to the right page: "Go to **Swaps** in the sidebar and use the marketplace there." Never just say "I cannot do this" — always give a concrete next step. Also tell them which page or button to tap.

# User context for this conversation
- Name: {user.name}
- Role: {user.role}  ("admin" can manage everyone; "employee" can only act on themselves)
- Department: {user.department or "—"}
- Org: {org_name}
- Known departments: {", ".join(departments) if departments else "(load via get_user_context if needed)"}
"""

    def run(
        self,
        db: Session,
        user: User,
        message: str,
        history: List[Dict[str, Any]],
        org_name: str = "",
        departments: Optional[List[str]] = None,
    ) -> AgentResult:
        """Single-turn agent run. `history` is a list of {role, content} dicts."""
        departments = departments or []
        tool_specs = [t.to_openai_spec() for t in self.tools]

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": self._system_prompt(user, org_name, departments)},
        ]
        # History (already trimmed by caller)
        messages.extend(history)
        messages.append({"role": "user", "content": message})

        tool_calls_log: List[Dict[str, Any]] = []
        iterations = 0

        for iteration in range(self.max_iters):
            iterations = iteration + 1
            try:
                resp = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=tool_specs or None,
                    tool_choice="auto" if tool_specs else None,
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                )
            except Exception as e:
                logger.error(f"LLM call failed: {e}")
                return AgentResult(
                    response=f"The AI service is unavailable right now ({type(e).__name__}). Please try again in a moment.",
                    iterations=iterations,
                )

            choice = resp.choices[0]
            msg = choice.message

            # ── Branch 1: assistant emitted tool calls ──────────────
            if getattr(msg, "tool_calls", None):
                # Append the assistant message (with tool_calls) so the conversation
                # state continues cleanly.
                messages.append({
                    "role": "assistant",
                    "content": msg.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in msg.tool_calls
                    ],
                })

                for tc in msg.tool_calls:
                    name = tc.function.name
                    raw_args = tc.function.arguments or "{}"
                    try:
                        args = json.loads(raw_args)
                    except json.JSONDecodeError:
                        args = {}

                    tool = self.tool_index.get(name)
                    if tool is None:
                        result = {"ok": False, "error": f"Unknown tool: {name}"}
                    elif tool.requires_role and tool.requires_role != user.role:
                        result = {"ok": False, "error": f"This action requires {tool.requires_role} role."}
                    else:
                        try:
                            result = _execute(tool, db, user, args)
                        except Exception as e:
                            logger.exception(f"Tool {name} crashed")
                            result = {"ok": False, "error": f"Tool {name} failed: {type(e).__name__}: {e}"}

                    tool_calls_log.append({
                        "name": name,
                        "args": args,
                        "result": result,
                    })

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tc.id,
                        "content": json.dumps(result, default=str)[:6000],  # cap per-tool payload
                    })

                # Loop again so the LLM can read the tool results and answer.
                continue

            # ── Branch 2: assistant returned plain text ─────────────
            return AgentResult(
                response=(msg.content or "").strip(),
                tool_calls=tool_calls_log,
                iterations=iterations,
                raw_messages=messages,
            )

        # Ran out of iterations — surface a useful failure instead of silently hanging.
        logger.warning(f"Agent hit max_iters={self.max_iters} without finalising")
        return AgentResult(
            response="I made progress on this but ran out of tool-call budget before reaching a final answer. Could you narrow the question, or ask me to summarise what I have so far?",
            tool_calls=tool_calls_log,
            iterations=iterations,
            raw_messages=messages,
        )


def build_history_from_turns(turns: List[Any]) -> List[Dict[str, str]]:
    """Convert a list of ConversationTurn ORM rows into the {role, content}
    shape that OpenAI/Groq accepts.

    Tool turns are flattened into assistant messages so the LLM has full
    context of what was decided previously.
    """
    out: List[Dict[str, str]] = []
    for t in turns:
        if t.role == "user" and t.content:
            out.append({"role": "user", "content": t.content})
        elif t.role == "assistant" and t.content:
            out.append({"role": "assistant", "content": t.content})
        # tool / system turns are skipped (already collapsed into assistant response)
    return out
