# GhostShift — User Story

## Overview

GhostShift is a shift-scheduling and workforce intelligence platform for healthcare teams. Three roles access three different views of the same system. All data is mocked; every action shows a toast.

---

## Roles & Access

| Page                | Employee | Manager | Admin |
| ------------------- | :------: | :-----: | :---: |
| My Portal           |    ✓     |         |       |
| Marketplace         |    ✓     |         |       |
| Manager Dashboard   |          |    ✓    |   ✓   |
| Swap Requests       |          |    ✓    |   ✓   |
| Availability        |    ✓     |    ✓    |   ✓   |
| Health Analytics    |          |    ✓    |   ✓   |
| Admin Settings      |          |         |   ✓   |
| Notifications       |    ✓     |    ✓    |   ✓   |
| Support             |    ✓     |    ✓    |   ✓   |

---

## Employee

### Auth
- Signs in via `/login` with role selector → lands on **My Portal**

### My Portal
- **Check-in flow**: taps "Check in" on upcoming shift → live countdown timer (`Xh Ym remaining`) → auto-completes when timer hits 0
- **Calendar**: month/week/day views of all assigned shifts; clicking a shift opens drawer with "Remove from calendar" (deletes from state)
- **Burnout card**: colored card (green/yellow/red) with pulsing dot, heartbeat SVG wave, and vitals sidebar
- **Weekly hours** card was removed; replaced by "Your next shift" card (content left + tall action button right)

### Marketplace
- **Browse shifts** tab: grid of open shifts (3 columns); clicking a card opens "Take shift" drawer with shift info, cert eligibility check, and request button
- **My requests** tab: tracks requested shifts with pending/confirmed status
- Shifts already requested show "Already requested" state in the drawer
- "Requested" badge on cards the user has already taken

### Availability
- **My template** tab: weekly grid (7 days × 4 slots) — tap cells to cycle Preferred / Available / Unavailable
- Inline counters showing counts per preference

---

## Manager

### Auth
- Signs in as Manager → lands on **Manager Dashboard**

### Manager Dashboard
- **New shift** button (header): opens drawer with form (department, title, date, start time, duration, certs, notes)
- **Calendar** (month/week/day): shows all shifts filtered by department; clicking opens shift details drawer with AI suggestion panel
- **AI candidate match** sidebar: top 5 matches for ICU Ward B with match % and burnout flags
- **Pending swaps** sidebar: list of pending swap requests with approve/review actions

### Swap Requests
- Three tabs: Pending, Needs Review, Resolved
- Each swap shows requester ↔ target, matching score, reason
- Approve (resolves) or open drawer for review

### Availability
- **My template** tab: same weekly grid as employee
- **Team overview** tab: heatmap of all employees' availability density per slot
- **Coverage gaps** tab: lists unfilled slots with severity, have/need counts, "Find coverage" button

### Health Analytics
- Overview stats: avg burnout index, at-risk depts, trend, flagged employees
- **Burnout heatmap**: dept × week grid with color intensity based on predicted burnout score
- **At-risk employees** table with individual scores and trends
- **Burnout trend** chart (line)
- **AI Burnout Diagnostic** modal: opens for selected employee with score breakdown, pattern analysis, and AI-recommended interventions

### Notifications
- List of system notifications (swap requests, burnout alerts, open shifts, AI matches)
- Filter by type, mark as read

---

## Admin

### Auth
- Signs in as Admin → lands on **Health Analytics** (role home)

Everything the Manager sees, plus:

### Admin Settings
Vertical tab navigation with sections:

- **Organization**: edit name, type, size, timezone, integrations
- **Integrations**: toggle Workday, Kronos, UKG, Epic, etc. (toasts only)
- **Policies**: max consecutive days, min hours between shifts, weekend rotation
- **Departments**: list with lead, active staff count, burnout score
- **Billing**: plan type, usage summary, invoice list
- **Team**: searchable member list with role filter; click to edit role
- **AI Engine**: toggle AI matching, burnout prediction, auto-approve threshold; model health indicators (toasts only)
- **Audit Log**: static list of recent events

### Extra
- **Support page**: FAQ accordion + contact form + status badge

---

## Auth Flow

### Sign In (`/login`)
- Email + password inputs
- Demo role selector (Employee / Manager / Admin)
- "Set up your organization" link → `/signup`

### Onboarding (`/signup`)
5-step wizard:
1. **Organization** — name, type (hospital/clinic/etc.), size, location
2. **Admin account** — name, email, password
3. **Departments** — multi-select from department list
4. **Team** — avg staff per dept + primary shift pattern
5. **Review** — confirms all data, saves to localStorage, redirects as admin

---

## UI Conventions

- **Sidebar**: single nav source; collapsed/expanded states; role switcher at bottom; theme toggle
- **Cards**: `rounded-xl shadow-soft-md bg-gradient-to-b from-surface to-surface-dim`
- **Buttons**: `btn-primary` (gradient), `btn-secondary` (bordered), `btn-ghost` (text)
- **Selects**: custom `<Select>` component with dropdown panel, checkmark, and theme styling
- **Dark mode**: `darkMode: 'class'` in Tailwind; toggle in sidebar; persisted to localStorage; CSS RGB variables
- **Drawers**: slide-in from right for shift details, create shift, swap review
- **Modals**: centered for AI diagnostics
- **All actions show toasts** (no backend)

---

## Data Model (mock source)

```js
users:        { id, name, role, title, department, email, avatar, certifications, burnoutScore, trend, hoursThisWeek, overtime }
shifts:       { id, employeeId, title, role, department, date, startHour, durationHours, status }
swapRequests: { id, requesterId, targetId, fromShift, toShift, aiScore, aiConcerns, reason, status }
departments:  { id, name, lead, leadAvatar, staffCount, openShifts, burnoutScore }
employees:    { ...user fields + burnoutScore, trend, hoursThisWeek, swapsOpen, certifications, rating }
availabilityTemplate: { days[], slots[], grid[] }  // 7×4 preference grid
burnoutHeatmap:       { departments[], weeks[], values[][] }
```
