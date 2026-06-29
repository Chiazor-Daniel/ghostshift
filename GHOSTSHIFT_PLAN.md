# GhostShift — Product & Backend Build Plan

> Status: **Frontend complete (mock data), backend not started.**
> This document is the source of truth for what exists, what each role does, and
> exactly what we have to build on the backend to make GhostShift real.

---

## 1. What GhostShift is

A **workforce-intelligence SaaS for hospital shift scheduling** that does two things
legacy nurse-scheduling tools don't do together:

1. **AI-assisted shift swaps** — when a clinician can't work a shift, the system finds
   the best *qualified, available, willing* coverage — factoring in labor-law rules
   and whether a candidate is already burning out (not just "who's free").
2. **Burnout prediction** — watches hours, night shifts, consecutive days, denied
   leave, overtime ratio, etc., and flags clinicians heading toward burnout *before*
   they quit or make errors.

**Goal:** cut expensive agency fill-ins and attrition by letting staff safely trade
shifts among themselves, while leadership sees risk early.

---

## 2. What exists today (frontend only)

A **Vite + React 18 + Tailwind** single-page app. Every screen is built and every
clickable is wired — but to **mock data and toasts**, not a real API. Clicking
"Approve swap" shows a toast; nothing persists. Treat it as a high-fidelity,
clickable prototype of the real product.

### Stack
- Vite + React 18 + Tailwind CSS (custom token system, not shadcn CSS vars)
- framer-motion (animations), recharts (charts), react-router-dom (routing)
- date-fns (the real calendar) — no other calendar lib needed
- Material Symbols (icons)

### Frontend architecture
| File | Role |
|------|------|
| `src/data/roles.js` | Single source of truth for the 3 roles + where each lands |
| `src/data/mock.js` | All fake data (users, shifts, swaps, availability, depts, telemetry) |
| `src/layout/AppShell.jsx` | Shell: sidebar + mesh bg + mobile-drawer context |
| `src/components/Sidebar.jsx` | The ONE nav: collapsible desktop rail + mobile drawer |
| `src/components/TopBar.jsx` | Page header: search, notifications, account menu, mobile hamburger |
| `src/components/Calendar.jsx` | Real Google-style Month/Week/Day calendar |
| `src/components/ui.jsx` | Card, StatCard, Badge, ProgressBar, Avatar, Modal, Drawer, Tabs… |
| `src/components/Toast.jsx` | Feedback system standing in for the backend |
| `src/App.jsx` | Routes + role guard + localStorage resync |

- Role persists in `localStorage.gs_role`; sidebar collapse in `gs_sidebar_collapsed`.
- Color system: **Clinical Blue** (primary `#2563eb`, accent sky `#0ea5e9`, success
  green reserved for data). Light blue→slate gradient background, frosted glass cards.
- **Single sidebar nav** (no in-dashboard tab bars, no bottom nav). Desktop = collapsible
  icon rail; mobile = slide-in drawer via top-bar hamburger.

### Roles & routes
| Role | Home route | Sidebar destinations |
|------|-----------|---------------------|
| Employee | `/app/employee` | My Portal, Marketplace, Availability |
| Manager | `/app/manager` | Manager Dashboard, Marketplace, Swap Requests, Availability, Health Analytics |
| Admin | `/app/insights` | Manager Dashboard, My Portal, Marketplace, Swap Requests, Availability, Health Analytics, Admin Settings |

Shared routes: `/app/notifications`, `/app/support`.

---

## 3. The three roles & every screen

### Employee — "My Portal" (`/app/employee`)
- Top stats: next shift (with Check in), AI burnout score / Health & Balance, this-week hours vs target.
- **Real calendar** (Month/Week/Day) of own shifts; click a shift → drawer → Request a swap / Offer to a peer / Drop shift.
- **Marketplace** (`/app/marketplace`): open shifts up for grabs, urgency + incentive pay, "Take shift".
- **Availability** (`/app/availability`): weekly preference grid (Preferred/Available/Unavailable), team-overview heatmap, coverage-gaps view.

### Manager — Dashboard (`/app/manager`)
- KPIs: unfilled shifts, active workers, burnout risk, avg match time.
- **Weekly canvas** schedule grid (shift blocks by day/hour; unfilled = dashed). Department filter. Click a shift → drawer with details + **AI match candidates** (ranked, with burnout flags).
- Side panels: pending swaps + team alerts.
- Swap Requests (`/app/swaps`): approve/review queue with Pending/Recent filter.
- Health Analytics (`/app/insights`): burnout KPIs, risk trend, dept×week heatmap, distribution, dept health; click a high-risk cell → read-only Burnout Diagnostic modal.

### Admin — Health Analytics (`/app/insights`)
- Same burnout view as manager (admin's home).
- Admin Settings (`/app/admin`): Org, Integrations (6 static), Policies, AI Engine (3 read-only status cards), Audit log, Team.

---

## 4. How to use it now

1. `npm run dev` → sign in → pick a role.
2. Desktop: sidebar collapses via chevron. Mobile: ☰ hamburger opens the sidebar drawer.
3. Employee: My Portal → calendar Week view → click a shift → Request a swap.
4. Manager: dashboard → click an unfilled shift → see AI candidates; Swap Requests → approve.
5. Admin: Health Analytics is home; Admin Settings has integrations/policies/audit.
6. "View as" in sidebar jumps roles. Avatar menu → Sign out.

---

## 5. Backend — what we have to build

The frontend is shaped around a specific spec. **Two endpoints + two ML engines** are
the core; everything else is CRUD + auth around them.

### 5.1 The two API endpoints

**`POST /match-candidates`** — given an unstaffed shift, return ranked coverage candidates.
- Input: shift id (role, dept, datetime, required qualifications), requester.
- Engine: **OR-Tools** constraint solver.
  - Constraints: qualifications/competencies, availability template, labor-law rules
    (max hours, min rest gap, max consecutive days), current shift load.
  - Objective: maximize match quality (proximity, fairness, willingness) while
    *penalizing candidates already flagged high burnout*.
- Output: ordered candidates with match score + per-factor breakdown (the manager
  drawer already renders the score + partial breakdown).

**`GET /burnout-assessment`** — return burnout risk for a clinician or whole team.
- Engine: **LightGBM** model trained on historical schedules + outcomes
  (sick calls, attrition, incidents).
- Features (named in the diagnostic modal): `rolling_hours_30d`, `night_shifts_14d`,
  `consecutive_days_worked`, `denied_leaves_90d`, `overtime_ratio` (+ more).
  **These fields are missing from the mock — wire them when the model exists.**
- Output: risk score 0–100, band (Optimal/Watch/Elevated/Critical), contributing-factor
  bars (the modal already renders the layout).

### 5.2 Data model (replaces `mock.js`)
- **Users** — id, name, role, title, department, qualifications, avatar, managerId
- **Shifts** — id, date, startHour, durationHours, department, role, status
  (open/assigned/active/completed), assignedEmployeeId
- **SwapRequests** — id, requesterId, targetId, fromShift, toShift, reason, status
  (pending/approved/denied), aiScore
- **Availability** — employeeId × weekly slot grid (preferred/neutral/unavailable) + recurrence
- **Marketplace listings** — posted open shifts available for pickup, urgency, incentive
- **Burnout telemetry** — rolling-feature store feeding LightGBM (computed nightly from shifts)
- **Audit log**, **Integrations** config, **Policies** (max hours, min rest, etc. OR-Tools reads)
- **Notifications**

### 5.3 Services
- **Auth** — real login (replace role picker), sessions, role-based access (frontend
  already guards routes by role; mirror server-side).
- **Scheduler job** — nightly: recompute burnout features, run the model, refresh risk
  scores; scan for coverage gaps.
- **Notifications** — push/email/Slack on swap request/approve or burnout-threshold crossing.
- **Integration adapters** — Epic (EHR rosters), Google Calendar/Outlook (shift sync),
  Slack (alerts), Workday/ADP (payroll + identity), Entra SSO. Admin → Integrations
  already lists these.
- **Swap workflow state machine** — request → match-candidates → select → peer accept →
  manager approve → shift reassign + marketplace update. Today each step is a toast;
  make them real mutations.

### 5.4 Suggested build phases
1. **Foundation** — backend scaffold, DB schema, real auth (replace role picker),
   CRUD for users/shifts/availability, swap requests state machine. Frontend: swap
   the inline toasts for real async API calls (thin client layer).
2. **Burnout engine** — telemetry pipeline (nightly feature rollups from shifts),
   LightGBM model + training, `GET /burnout-assessment`, bind diagnostic modal +
   heatmap to real data.
3. **Match engine** — OR-Tools solver, `POST /match-candidates`, bind manager drawer
   candidates to real results, post initiate-swap to marketplace.
4. **Integrations & notifications** — Epic/Calendar/Slack/SSO adapters, real
   notification delivery, audit log writes.
5. **Polish & gaps** — employee-ranked heatmap, unassigned-shift yellow+pulsing,
   telemetry fields in modal, fairness reporting.

---

## 6. Known frontend gaps to close when backend lands

- Burnout heatmap is **department × week**; spec wants **employee-ranked**.
- Diagnostic modal telemetry fields are placeholders — bind to LightGBM features.
- "Initiate swap" doesn't post a marketplace listing yet.
- Unassigned shifts should be **yellow + pulsing** (currently dashed-primary).
- Every action currently fires a toast — replace with real async calls + error states.

---

## 7. Open decisions (need your call before building)

- **Backend stack** — Node/Express? Python/FastAPI (natural fit for OR-Tools + LightGBM
  in one repo)? A split (Python ML services + Node API)? *Recommend: FastAPI for the
  whole thing — OR-Tools and LightGBM are Python-native.*
- **Database** — Postgres (relational, fits the schema) vs something else.
- **Auth provider** — Entra SSO first, or email/password for MVP?
- **Model hosting** — train offline, ship artifacts; or a live inference service?
- **Realtime** — do swaps/notifications need live updates (websockets) or is polling fine for v1?

---

## 8. Verification (current frontend)

- `npm run build` passes (no new warnings; only pre-existing chunk-size note).
- Grep confirms zero teal literals remain; no duplicate in-dashboard tab nav; bottom
  nav removed; MobileHomePage retired.
- Dev server serves the app + all modules (HTTP 200).
- `npm run dev`, sign in as each role, exercise the calendar, swaps, marketplace,
  availability, insights, admin — all clickables respond (via toasts until backend exists).