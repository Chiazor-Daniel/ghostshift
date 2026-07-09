"""
AI Assistant Integration - Supports Groq, OpenAI, and Ollama
"""

import os
import logging
import json
from typing import Dict, List, Optional

# Load .env deterministically so GROQ_API_KEY etc. are available even if
# `config.env` hasn't been imported yet via the normal boot order.
from config.env import load_env  # noqa: F401  (side-effect import)

load_env()

from openai import OpenAI  # noqa: E402

logger = logging.getLogger(__name__)


class AIAssistant:
    def __init__(self):
        # Try Groq first (free tier, very fast)
        _raw_key = (os.getenv("GROQ_KEY_A", "") + os.getenv("GROQ_KEY_B", "")) or os.getenv("GROQ_API_KEY", "")
        self.groq_api_key = _raw_key or None
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.ollama_api_key = os.getenv("OLLAMA_API_KEY")
        
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3:70b")
        
        # Groq model mapping (for decommissioned models)
        self.groq_model_map = {
            "llama3-70b-8192": "llama3-70b-8192",  # Still works
            "llama3-8b-8192": "llama3-8b-8192",
            "mixtral-8x7b-32768": "mixtral-8x7b-32768",
            "gemma-7b": "gemma-7b",
            "gemma2-9b": "gemma2-9b"
        }
        
        self.client = None
        self.provider = None
        
        # Initialize client based on available API
        if self.groq_api_key:
            try:
                self.client = OpenAI(api_key=self.groq_api_key, base_url="https://api.groq.com/openai/v1")
                self.provider = "groq"
                logger.info("Groq client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Groq client: {e}")
        elif self.openai_api_key:
            try:
                self.client = OpenAI(api_key=self.openai_api_key)
                self.provider = "openai"
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing OpenAI client: {e}")
        elif self.ollama_api_key:
            try:
                self.client = OpenAI(api_key=self.ollama_api_key, base_url="https://api.ollama.com/v1")
                self.provider = "ollama"
                logger.info("Ollama client initialized successfully")
            except Exception as e:
                logger.error(f"Error initializing Ollama client: {e}")
        else:
            logger.warning("No AI API key configured - AI features will be limited")

        # Resolve the model name for whichever provider we picked. Without this
        # every method that uses self.model raises AttributeError.
        if self.provider == "groq":
            self.model = self.groq_model
        elif self.provider == "openai":
            self.model = self.openai_model
        elif self.provider == "ollama":
            self.model = self.ollama_model
        else:
            self.model = None

    def generate_shift_recommendations(
        self,
        department_id: str,
        date: str,
        required_roles: List[str],
        hours_needed: int
    ) -> Dict:
        """Generate shift coverage recommendations"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        prompt = f"""
        You are an expert healthcare workforce scheduler. 
        Department ID: {department_id}
        Date: {date}
        Required Roles: {required_roles}
        Hours Needed: {hours_needed}

        Analyze the following:
        1. Staff availability for this date
        2. Staff workload and availability
        3. Burnout risk scores
        4. Coverage gaps
        5. Optimal shift assignments

        Provide recommendations in JSON format:
        {{
            "recommended_staff": [
                {{"employee_id": "string", "name": "string", "role": "string", "confidence": 0.95}}
            ],
            "coverage_gaps": [
                {{"role": "string", "hours_missing": 4, "risk_level": "high"}}
            ],
            "suggested_actions": ["string"],
            "total_score": 0.85
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare workforce optimization expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            return {
                "success": True,
                "recommendations": response.choices[0].message.content,
                "model": self.model,
                "timestamp": "2026-06-29T10:00:00Z"
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return {"error": str(e)}

    def analyze_burnout_risk(self, employee_data: Dict) -> Dict:
        """Analyze burnout risk using AI"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        prompt = f"""
        Analyze burnout risk for this employee:
        {employee_data}

        Provide:
        1. Risk assessment (low/medium/high)
        2. Contributing factors
        3. Specific recommendations
        4. Timeline for intervention
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare worker wellness expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            return {
                "success": True,
                "analysis": response.choices[0].message.content,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error analyzing burnout risk: {e}")
            return {"error": str(e)}

    def generate_schedule_optimization(
        self,
        org_id: str,
        date_range: Dict,
        constraints: Dict
    ) -> Dict:
        """Generate optimized schedule"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        prompt = f"""
        Optimize schedule for organization {org_id}
        Date Range: {date_range}
        Constraints: {constraints}

        Provide optimized schedule with:
        1. Staff assignments
        2. Coverage optimization
        3. Cost efficiency
        4. Staff satisfaction
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a healthcare scheduling optimization expert."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            return {
                "success": True,
                "optimization": response.choices[0].message.content,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error generating schedule optimization: {e}")
            return {"error": str(e)}

    def chat(self, message: str, context: Dict = None) -> Dict:
        """General chat interaction"""
        if not self.client:
            return {"error": "OpenAI API not configured"}

        system_prompt = """You are GhostShift AI Assistant, helping healthcare administrators 
        with workforce scheduling, burnout prevention, and staff management."""

        messages = [{"role": "system", "content": system_prompt}]
        
        if context:
            messages.append({"role": "context", "content": str(context)})
        
        messages.append({"role": "user", "content": message})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            return {
                "success": True,
                "response": response.choices[0].message.content,
                "model": self.model
            }
            
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            return {"error": str(e)}

    def _call_llm(self, system_prompt: str, user_prompt: str, max_tokens: int = 400) -> str:
        """Lightweight LLM call with deterministic fallback."""
        if not self.client or not self.model:
            return ""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=max_tokens,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as e:
            logger.warning(f"LLM reasoning failed: {e}")
            return ""

    def explain_swap_decision(
        self,
        swap: Dict,
        requester: Dict,
        from_shift: Dict,
        to_shift: Optional[Dict],
        target: Optional[Dict],
        staffing_context: Optional[Dict] = None,
    ) -> Dict:
        """
        Generate a short, natural approve/decline suggestion for a swap/pickup request.
        Always returns a result; falls back to deterministic reasoning if LLM is unavailable.
        """
        kind = swap.get("kind", "swap")
        fit_score = swap.get("ai_score") or swap.get("match_score") or 0
        score_text = "strong" if fit_score >= 80 else "moderate" if fit_score >= 60 else "weak"

        sc = staffing_context or {}
        dept = sc.get("department") or requester.get("department") or "Unknown"
        dept_count = sc.get("department_staff_count", 0)
        dept_on_window = sc.get("department_staff_on_shift_window", 0)
        only_staff = sc.get("requester_is_only_staff", False)

        if only_staff:
            staffing_note = f"WARNING: {requester.get('name', 'Unknown')} is the only active staff member in {dept}. Approving would leave the department with zero coverage for this shift window."
        elif dept_count == 2:
            staffing_note = f"Note: {dept} only has 2 active staff members. Removing {requester.get('name', 'Unknown')} from this window leaves very thin coverage."
        else:
            staffing_note = f"Department staffing: {dept_count} active staff members, {dept_on_window} assigned in this shift window."

        system_prompt = """You are GhostShift AI, an expert healthcare workforce scheduler. 
Write concise, natural-language advice (2-5 sentences) for an admin deciding whether to approve a shift swap or pickup.
Be specific: mention the employee name, the shift, department, and any risks or benefits.
Pay special attention to department staffing impact — if approving would leave a department with zero or very thin coverage, warn the admin strongly.
Do not use technical IDs. Keep it plain and decisive."""

        if kind == "pickup":
            user_prompt = f"""Employee {requester.get('name', 'Unknown')} ({requester.get('department', 'Unknown')}) wants to pick up the open shift:
"{from_shift.get('role') or from_shift.get('title') or 'Open shift'}" on {from_shift.get('date')} in {from_shift.get('department', 'Unknown')}.
Fit score: {fit_score}% ({score_text}).
{staffing_note}
Should the admin approve or decline? Give a short reason and note any coverage benefit or risk."""
        else:
            user_prompt = f"""Employee {requester.get('name', 'Unknown')} ({requester.get('department', 'Unknown')}) wants to swap their shift:
"{from_shift.get('role') or from_shift.get('title') or 'Shift'}" on {from_shift.get('date')}
for {target.get('name', 'another employee')}'s shift:
"{to_shift.get('role') or to_shift.get('title') or 'Shift'}" on {to_shift.get('date')} in {to_shift.get('department', 'Unknown')}.
Fit score: {fit_score}% ({score_text}).
{staffing_note}
Should the admin approve or decline? Give a short reason covering fairness, coverage, and staffing impact."""

        llm_text = self._call_llm(system_prompt, user_prompt)

        if not llm_text:
            # Deterministic fallback
            if only_staff:
                if kind == "pickup":
                    llm_text = f"{requester.get('name')} is the only active staff member in {dept}. Picking up this shift still keeps them assigned, so coverage is preserved, but they will be overloaded. Suggested action: approve only if no one else can cover."
                else:
                    llm_text = f"{requester.get('name')} is the only active staff member in {dept}. This swap would leave the department without coverage for their original shift. Suggested action: decline or find replacement coverage first."
            elif kind == "pickup":
                if fit_score >= 80:
                    llm_text = f"{requester.get('name')} is a strong match for this open shift and coverage would improve. {staffing_note} Suggested action: approve."
                elif fit_score >= 60:
                    llm_text = f"{requester.get('name')} looks reasonably suited, but review department workload. {staffing_note} Suggested action: approve with caution."
                else:
                    llm_text = f"{requester.get('name')} is a weak match for this shift; approving may create coverage or fairness issues. {staffing_note} Suggested action: review manually."
            else:
                if fit_score >= 80:
                    llm_text = f"This swap is well-balanced and the fit score is strong. {staffing_note} Suggested action: approve."
                elif fit_score >= 60:
                    llm_text = f"The swap is plausible, but check whether both employees are equally suitable for the exchanged shifts. {staffing_note} Suggested action: approve with caution."
                else:
                    llm_text = f"The fit score is low; this swap could leave a gap or place someone outside their usual role. {staffing_note} Suggested action: review manually."

        # Suggestion logic: default to fit score, but strongly review if only staff
        suggestion = "approve" if fit_score >= 70 else "review"
        if only_staff:
            suggestion = "review"

        return {
            "success": True,
            "kind": kind,
            "suggestion": suggestion,
            "reasoning": llm_text,
            "fit_score": fit_score,
            "staffing_context": sc,
            "model": self.model if self.client else "rule-based",
        }

    def explain_leave_decision(
        self,
        leave: Dict,
        requester: Dict,
        org_shifts: List[Dict],
        work_history: Optional[Dict] = None,
    ) -> Dict:
        """
        Generate a short, natural approve/decline suggestion for a leave request.
        """
        start = leave.get("start_date", "")
        end = leave.get("end_date", "")
        duration = leave.get("duration_days") or 1
        dept = requester.get("department", "Unknown")
        reason = (leave.get("reason") or "Not provided").lower()

        # Count overlapping shifts in the same department
        overlapping = 0
        for s in org_shifts or []:
            if s.get("department") == dept and s.get("date") and start <= s.get("date", "") <= end:
                overlapping += 1

        # Work history from real check-in / check-out data
        wh = work_history or {}
        completed = wh.get("total_completed_shifts", 0)
        assigned = wh.get("total_assigned_shifts", 0)
        last_check_out = wh.get("last_check_out")

        # Reason categories for fairness nuance
        sick_reasons = ["sick", "illness", "medical", "doctor", "flu", "migraine", "health"]
        family_reasons = ["family", "childcare", "wedding", "funeral", "care"]
        personal_reasons = ["personal", "appointment", "moving"]
        vacation_reasons = ["vacation", "holiday", "trip", "travel", "pto", "annual leave"]

        reason_type = "general"
        if any(r in reason for r in sick_reasons):
            reason_type = "sick/medical"
        elif any(r in reason for r in family_reasons):
            reason_type = "family"
        elif any(r in reason for r in personal_reasons):
            reason_type = "personal"
        elif any(r in reason for r in vacation_reasons):
            reason_type = "vacation"

        # Build a fairness signal for the prompt
        if completed == 0:
            tenure_signal = "new hire with no completed shifts yet"
        elif completed <= 2:
            tenure_signal = "recently started; only a few completed shifts"
        else:
            tenure_signal = f"has completed {completed} shifts"

        system_prompt = """You are GhostShift AI, an expert healthcare workforce scheduler. 
Write concise, natural-language advice (2-5 sentences) for an admin deciding whether to approve a leave request.
Mention the employee name, dates, department coverage impact, their work history, and the reason they gave.
Be fair: approve sick/medical leave for new hires when coverage allows; be more cautious with vacation requests from employees who haven't worked much yet."""

        user_prompt = f"""Employee {requester.get('name', 'Unknown')} ({dept}) requested leave from {start} to {end} ({duration} day{'s' if duration != 1 else ''}).
Reason: {leave.get('reason') or 'Not provided'} (category: {reason_type}).
There are {overlapping} shifts scheduled in {dept} during that period.
Work history: {tenure_signal} ({assigned} assigned shifts total, {completed} completed with check-in/out{'; last check-out: ' + last_check_out[:10] if last_check_out else ''}).
Should the admin approve or decline? Give a short reason and note any fairness or coverage concern."""

        llm_text = self._call_llm(system_prompt, user_prompt)

        if not llm_text:
            # Deterministic fallback: balance coverage + tenure + reason
            if reason_type == "sick/medical":
                if overlapping == 0:
                    llm_text = f"{requester.get('name')} is new and has no overlapping shifts. Sick/medical leave is a fair exception. Suggested action: approve."
                elif overlapping <= 2:
                    llm_text = f"Sick/medical leave from {requester.get('name')} should generally be approved; only {overlapping} shifts overlap and coverage can be backfilled. Suggested action: approve if staffing allows."
                else:
                    llm_text = f"Sick/medical leave from {requester.get('name')} is valid, but {overlapping} shifts overlap in {dept}. Suggested action: approve only if you can secure coverage."
            elif completed == 0 and reason_type == "vacation":
                llm_text = f"{requester.get('name')} is newly hired with no completed shifts and is requesting vacation. Suggested action: review or decline for fairness; consider approving only for urgent personal reasons."
            elif completed <= 2 and reason_type == "vacation":
                llm_text = f"{requester.get('name')} has only completed {completed} shifts and is requesting vacation. Suggested action: review carefully to maintain team fairness."
            else:
                if overlapping == 0:
                    llm_text = f"{requester.get('name')} has no overlapping shifts in {dept} during this leave ({tenure_signal}). Low coverage risk. Suggested action: approve."
                elif overlapping <= 2:
                    llm_text = f"Only {overlapping} shifts overlap in {dept}; coverage can likely be backfilled. {requester.get('name')} {tenure_signal}. Suggested action: approve if staffing allows."
                else:
                    llm_text = f"{overlapping} shifts in {dept} overlap with this leave, which could create a coverage gap. {requester.get('name')} {tenure_signal}. Suggested action: review carefully or ask employee to adjust dates."

        # Suggestion logic: approve if coverage risk is low or sick/medical with manageable overlap
        suggestion = "review"
        if reason_type == "sick/medical":
            suggestion = "approve" if overlapping <= 2 else "review"
        elif overlapping == 0:
            suggestion = "approve"
        elif overlapping <= 1 and completed >= 2:
            suggestion = "approve"

        return {
            "success": True,
            "suggestion": suggestion,
            "reasoning": llm_text,
            "overlapping_shifts": overlapping,
            "work_history": wh,
            "model": self.model if self.client else "rule-based",
        }

    def suggest_swap_options(
        self,
        employee: Dict,
        from_shift: Dict,
        candidate_shifts: List[Dict],
        peer_shifts: List[Dict],
    ) -> Dict:
        """
        Generate AI suggestions for an employee trying to get rid of / swap a shift.
        Returns ranked open-shift pickups and peer trade options with short reasons.
        Falls back to deterministic scoring if no LLM.
        """
        system_prompt = """You are GhostShift AI, a helpful healthcare scheduling assistant.
An employee wants to swap or give up one of their shifts. Review the options and return a concise JSON object with no markdown formatting.
For each option include a short 'reason' (1 sentence) written for the employee, a 'score' 0-100, and a 'risk' label (low/medium/high).
Be honest: warn about overtime, back-to-back shifts, department mismatch, or thin coverage."""

        def fmt_shift(s):
            return {
                "id": s.get("id"),
                "role": s.get("role") or s.get("title") or "Shift",
                "department": s.get("department", "Unknown"),
                "date": s.get("date"),
                "start_hour": s.get("start_hour"),
                "duration_hours": s.get("duration_hours"),
            }

        user_prompt = f"""Employee: {employee.get('name', 'Unknown')} ({employee.get('department', 'Unknown')}).
Shift they want to swap out of:
{fmt_shift(from_shift)}

Open shifts they could pick up instead:
{[fmt_shift(s) for s in candidate_shifts]}

Other employees' shifts they could trade into (peer swap):
{[fmt_shift(s) for s in peer_shifts]}

Return JSON exactly like this:
{{
  "pickups": [{{"shift_id": "...", "score": 85, "reason": "...", "risk": "low"}}],
  "peer_swaps": [{{"shift_id": "...", "score": 72, "reason": "...", "risk": "medium"}}],
  "draft_reason": "A short, polite message the employee can send to their manager explaining why they want to swap."
}}"""

        llm_text = self._call_llm(system_prompt, user_prompt, max_tokens=700)

        # Fallback: deterministic scoring
        pickups = []
        peer_swaps = []
        for s in candidate_shifts:
            score, reason, risk = self._score_swap_option(employee, from_shift, s, peer=False)
            pickups.append({"shift_id": s.get("id"), "score": score, "reason": reason, "risk": risk})
        for s in peer_shifts:
            score, reason, risk = self._score_swap_option(employee, from_shift, s, peer=True)
            peer_swaps.append({"shift_id": s.get("id"), "score": score, "reason": reason, "risk": risk})

        pickups.sort(key=lambda x: x["score"], reverse=True)
        peer_swaps.sort(key=lambda x: x["score"], reverse=True)

        draft_reason = None
        if llm_text:
            # The LLM is asked to return JSON; if it does not, treat the whole response as the draft reason
            # only when it does not look like JSON.
            cleaned = llm_text.strip()
            if cleaned.startswith("{") and cleaned.endswith("}"):
                try:
                    parsed = json.loads(cleaned)
                    if isinstance(parsed, dict):
                        pickups = parsed.get("pickups") or pickups
                        peer_swaps = parsed.get("peer_swaps") or peer_swaps
                        draft_reason = parsed.get("draft_reason")
                except Exception as e:
                    logger.warning(f"Could not parse swap suggestion JSON: {e}")
                    draft_reason = None
            else:
                # Plain-text response: use as the drafted reason if it is short and readable.
                if 10 < len(cleaned) < 300 and "shift" in cleaned.lower():
                    draft_reason = cleaned

        if not draft_reason or not isinstance(draft_reason, str):
            draft_reason = f"I'm requesting to swap my {from_shift.get('role') or from_shift.get('title')} shift on {from_shift.get('date')} because of a scheduling conflict. Please review available options."

        return {
            "success": True,
            "pickups": pickups,
            "peer_swaps": peer_swaps,
            "draft_reason": draft_reason,
            "model": self.model if self.client else "rule-based",
        }

    def _score_swap_option(self, employee: Dict, from_shift: Dict, option: Dict, peer: bool) -> tuple:
        """Simple deterministic score + reason for a swap/pickup option."""
        score = 70
        reasons = []
        risk = "low"

        # Department match
        emp_dept = (employee.get("department") or "").lower()
        opt_dept = (option.get("department") or "").lower()
        if emp_dept and opt_dept:
            if emp_dept == opt_dept:
                score += 15
            elif emp_dept in opt_dept or opt_dept in emp_dept:
                score += 5
                reasons.append("related department")
            else:
                score -= 20
                reasons.append("different department")
                risk = "medium"

        # Avoid same-day back-to-back
        if from_shift.get("date") == option.get("date"):
            from_end = (from_shift.get("start_hour") or 0) + (from_shift.get("duration_hours") or 0)
            opt_start = option.get("start_hour") or 0
            gap = abs(opt_start - from_end)
            if gap < 2:
                score -= 25
                reasons.append("too close to your current shift")
                risk = "high"
            elif gap < 8:
                score -= 10
                reasons.append("same day — short rest window")

        # Penalize weekend/holiday complexity if same role
        if from_shift.get("role") == option.get("role") and from_shift.get("date") == option.get("date"):
            score -= 5

        if peer:
            score -= 5  # Peer swaps need the other person to agree/approve
            reasons.append("requires coworker + admin approval")

        score = min(100, max(0, score))

        if score >= 80:
            risk = "low"
        elif score >= 55:
            risk = "medium"
        else:
            risk = "high"

        reason = ", ".join(reasons) if reasons else "good fit"
        return score, reason, risk

    def explain_batch_approvals(self, items: List[Dict]) -> Dict:
        """
        Generate a natural-language summary of why a batch of requests can be safely auto-approved.
        """
        count = len(items)
        kinds = {}
        depts = {}
        avg_score = 0
        for it in items:
            k = it.get("kind", "request")
            kinds[k] = kinds.get(k, 0) + 1
            d = it.get("department", "Unknown")
            depts[d] = depts.get(d, 0) + 1
            avg_score += it.get("fit_score") or it.get("ai_score") or 0
        avg_score = round(avg_score / count, 1) if count else 0

        system_prompt = """You are GhostShift AI, an expert healthcare workforce scheduler. 
Write a concise, natural-language summary (2-4 sentences) for an admin about why a batch of requests is safe to auto-approve.
Mention the count, types, fit score, and departments. Be decisive."""

        kind_summary = ", ".join(f"{v} {k}" for k, v in kinds.items())
        user_prompt = f"""Batch of {count} requests to auto-approve.
Types: {kind_summary}.
Average fit score: {avg_score}%.
Departments affected: {', '.join(depts.keys()) or 'None'}.
Why is this batch safe to approve?"""

        llm_text = self._call_llm(system_prompt, user_prompt)

        if not llm_text:
            llm_text = f"These {count} requests all have fit scores of 70% or higher. The {kind_summary} cover {', '.join(depts.keys()) or 'various departments'} and should not create coverage gaps. Suggested action: auto-approve."

        return {
            "success": True,
            "count": count,
            "reasoning": llm_text,
            "average_fit_score": avg_score,
            "model": self.model if self.client else "rule-based",
        }

    def generate_executive_summary(self, data: Dict) -> Dict:
        """
        Generate a short executive summary from real org analytics.
        Uses org name/type and only cites metrics that exist in data.
        """
        org_name = data.get("org_name") or "Your organization"
        org_type = data.get("org_type")
        window_days = data.get("window_days", 14)
        coverage_rate = data.get("coverage_rate", 0)
        open_shifts = data.get("open_shifts", 0)
        total_shifts = data.get("total_shifts", 0)
        filled_shifts = data.get("filled_shifts", 0)
        check_in_rate = data.get("check_in_rate", 0)
        completed_shifts = data.get("completed_shifts", 0)
        pending_swaps = data.get("pending_swaps", 0)
        pending_leaves = data.get("pending_leaves", 0)
        high_risk = data.get("high_risk", 0)
        total_employees = data.get("total_employees", 0)
        late_count = data.get("late_count", 0)
        total_swaps = data.get("total_swaps", 0)
        total_leaves = data.get("total_leaves", 0)

        org_label = org_name
        if org_type:
            org_label = f"{org_name} ({org_type})"

        # No schedule data — return a factual one-liner, skip the LLM.
        if total_shifts == 0:
            if total_employees <= 1:
                summary = (
                    f"{org_name}: No shifts in the next {window_days} days yet. "
                    "Add employees and schedule shifts to see insights here."
                )
            else:
                summary = (
                    f"{org_name}: No shifts scheduled in the next {window_days} days "
                    f"({total_employees} team members on file)."
                )
            return {"success": True, "summary": summary, "model": "deterministic"}

        def _deterministic_summary() -> str:
            parts = [f"{org_name}: {filled_shifts}/{total_shifts} shifts filled ({coverage_rate}%)"]
            if open_shifts:
                parts.append(f"{open_shifts} open")
            if completed_shifts:
                parts.append(f"{check_in_rate}% on-time check-ins ({late_count} late)")
            actions = []
            if pending_swaps:
                actions.append(f"{pending_swaps} swap{'s' if pending_swaps != 1 else ''} pending")
            if pending_leaves:
                actions.append(f"{pending_leaves} leave{'s' if pending_leaves != 1 else ''} pending")
            if actions:
                parts.append("; ".join(actions) + " need review")
            elif high_risk:
                parts.append(f"{high_risk} at high burnout risk")
            else:
                parts.append("no urgent actions")
            return ". ".join(parts) + "."

        industry_line = f"Industry/type: {org_type}." if org_type else "Do not assume healthcare or hospital context."

        system_prompt = f"""You are GhostShift AI. Write exactly 1-2 short sentences for an admin at {org_label}.
{industry_line}
Rules:
- Use only the numbers provided. Never invent metrics.
- If completed_shifts is 0, do not mention attendance or check-in rates.
- If total_swaps or total_leaves is 0, do not mention approval rates or processes.
- No filler, no generic advice, no "ongoing monitoring" platitudes.
- Lead with the org name."""

        facts = [
            f"Window: next {window_days} days",
            f"Shifts: {filled_shifts}/{total_shifts} filled ({coverage_rate}%), {open_shifts} open",
            f"Team size: {total_employees}",
        ]
        if completed_shifts:
            facts.append(f"Attendance: {check_in_rate}% on-time, {late_count} late, {completed_shifts} completed shifts")
        if total_swaps:
            facts.append(f"Swaps: {pending_swaps} pending of {total_swaps} total")
        elif pending_swaps:
            facts.append(f"Swaps: {pending_swaps} pending")
        if total_leaves:
            facts.append(f"Leaves: {pending_leaves} pending of {total_leaves} total")
        elif pending_leaves:
            facts.append(f"Leaves: {pending_leaves} pending")
        if high_risk:
            facts.append(f"Burnout: {high_risk} high-risk of {total_employees}")

        user_prompt = "Facts:\n" + "\n".join(f"- {f}" for f in facts) + "\n\nWrite 1-2 sentences."

        llm_text = self._call_llm(system_prompt, user_prompt, max_tokens=120)
        if not llm_text:
            llm_text = _deterministic_summary()

        return {
            "success": True,
            "summary": llm_text.strip(),
            "model": self.model if self.client else "rule-based",
        }


# Global instance
ai_assistant = AIAssistant()
