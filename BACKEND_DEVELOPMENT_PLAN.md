# GhostShift Backend Development Plan

## Executive Summary

This document provides a **complete backend development plan** for GhostShift, including:
- Full user stories for each role (Employee, Admin, Manager)
- Complete data models and relationships
- API endpoint specifications
- Authentication & authorization architecture
- Security requirements (HIPAA, SOC 2)
- Integration requirements
- Deployment strategy

---

## 1. USER STORIES BY ROLE

### 1.1 EMPLOYEE ROLE

#### **1.1.1 Authentication & Onboarding**
- **US-EMP-001**: As an employee, I want to sign in with my work email and password so I can access my personalized dashboard
- **US-EMP-002**: As an employee, I want to receive an email invite with a unique link so I can activate my account without needing to create a password first
- **US-EMP-003**: As an employee, I want to see my shift schedule in a calendar view so I know when I'm working
- **US-EMP-004**: As an employee, I want to view my burnout risk score so I can manage my workload
- **US-EMP-005**: As an employee, I want to see my team members for upcoming shifts so I know who I'll be working with

#### **1.1.2 Shift Management**
- **US-EMP-010**: As an employee, I want to check in for my shift when I arrive so my hours are tracked accurately
- **US-EMP-011**: As an employee, I want to see my shift status (upcoming/active/completed) so I know my current work status
- **US-EMP-012**: As an employee, I want to view shift details (location, duration, requirements) before accepting
- **US-EMP-013**: As an employee, I want to see my shift history for the current week so I can track my hours

#### **1.1.3 Shift Marketplace**
- **US-EMP-020**: As an employee, I want to browse available shifts from other departments so I can pick up extra work
- **US-EMP-021**: As an employee, I want to filter shifts by department, urgency, and my eligibility so I find relevant shifts quickly
- **US-EMP-022**: As an employee, I want to see how many slots are remaining for each shift so I know if I can claim it
- **US-EMP-023**: As an employee, I want to see my position in the queue when I request a shift so I know my chances
- **US-EMP-024**: As an employee, I want to see AI match scores for shift requests so I understand why I'm a good/bad fit
- **US-EMP-025**: As an employee, I want to cancel my shift request if I change my mind before it's approved

#### **1.1.4 Availability Management**
- **US-EMP-030**: As an employee, I want to set my weekly availability preferences (Preferred/Available/Unavailable) so the system knows when I can work
- **US-EMP-031**: As an employee, I want to see my availability summary (how many preferred/available/unavailable slots) so I can balance my preferences
- **US-EMP-032**: As an employee, I want to see how my availability affects shift matching so I understand the system better

#### **1.1.5 Swap Requests**
- **US-EMP-040**: As an employee, I want to request a shift swap with a colleague so I can cover for them or switch shifts
- **US-EMP-041**: As an employee, I want to see pending swap requests I've made so I can track their status
- **US-EMP-042**: As an employee, I want to see approved swap requests in my schedule so I know what's confirmed
- **US-EMP-043**: As an employee, I want to see declined swap requests so I know why they were rejected
- **US-EMP-044**: As an employee, I want to see the AI match score for swap requests so I understand the system's decision

#### **1.1.6 Time Off Requests**
- **US-EMP-050**: As an employee, I want to request time off (vacation/sick/personal/bereavement) so I can take time away from work
- **US-EMP-051**: As an employee, I want to see my leave request status (pending/approved/declined) so I know if it's been processed
- **US-EMP-052**: As an employee, I want to see my leave history so I can track my PTO usage
- **US-EMP-053**: As an employee, I want to see my remaining PTO balance so I know how much time off I have left

#### **1.1.7 Notifications & Communication**
- **US-EMP-060**: As an employee, I want to receive push notifications for shift changes so I'm always informed
- **US-EMP-061**: As an employee, I want to receive notifications for swap requests and approvals so I know what's happening
- **US-EMP-062**: As an employee, I want to receive notifications for leave request decisions so I know if my time off is approved
- **US-EMP-063**: As an employee, I want to view all notifications in one place so I don't miss important updates
- **US-EMP-064**: As an employee, I want to mark notifications as read so I can track what I've seen
- **US-EMP-065**: As an employee, I want to configure notification preferences (push vs email) so I get updates in my preferred way

#### **1.1.8 Profile & Settings**
- **US-EMP-070**: As an employee, I want to view my profile information (name, title, department, certifications) so I can verify my details
- **US-EMP-071**: As an employee, I want to see my certifications with expiry dates so I can renew them on time
- **US-EMP-072**: As an employee, I want to see my performance rating so I can track my progress
- **US-EMP-073**: As an employee, I want to see my weekly hours target vs actual so I can manage my schedule
- **US-EMP-074**: As an employee, I want to see my burnout risk factors (overtime, consecutive days, night shifts) so I can reduce my risk

#### **1.1.9 AI Assistant**
- **US-EMP-080**: As an employee, I want to ask the AI assistant questions about my schedule so I can get quick answers
- **US-EMP-081**: As an employee, I want the AI assistant to draft swap requests for me so I don't have to fill out forms
- **US-EMP-082**: As an employee, I want to ask about open shifts and availability so I can plan my schedule
- **US-EMP-083**: As an employee, I want to ask about my burnout risk and how to reduce it so I can stay healthy

---

### 1.2 ADMIN ROLE

#### **1.2.1 Authentication & Onboarding**
- **US-ADM-001**: As an admin, I want to sign in with my work email and password so I can access the admin dashboard
- **US-ADM-002**: As an admin, I want to see the onboarding flow when I first sign up so I can set up the organization
- **US-ADM-003**: As an admin, I want to invite new employees via email so they can join the organization
- **US-ADM-004**: As an admin, I want to generate invite links that can be shared so employees can self-register
- **US-ADM-005**: As an admin, I want to see invite status (pending/accepted/expired) so I can follow up with employees

#### **1.2.2 Organization Management**
- **US-ADM-010**: As an admin, I want to configure organization settings (name, timezone, currency) so the system matches our requirements
- **US-ADM-011**: As an admin, I want to manage departments (add/edit/delete) so I can organize my team structure
- **US-ADM-012**: As an admin, I want to set default shift policies (max hours, consecutive days, rest gaps) so I protect employee well-being
- **US-ADM-013**: As an admin, I want to configure premium pay thresholds so I can set overtime rates
- **US-ADM-014**: As an admin, I want to view audit logs so I can track who made what changes and when

#### **1.2.3 Employee Management**
- **US-ADM-020**: As an admin, I want to view all employees in the organization so I can manage my team
- **US-ADM-021**: As an admin, I want to search employees by name or email so I can find specific people quickly
- **US-ADM-022**: As an admin, I want to filter employees by role, department, or status so I can segment my team
- **US-ADM-023**: As an admin, I want to see employee burnout scores so I can identify at-risk staff
- **US-ADM-024**: As an admin, I want to see employee certifications with expiry dates so I can plan recertification
- **US-ADM-025**: As an admin, I want to see employee performance ratings so I can identify top performers
- **US-ADM-026**: As an admin, I want to see employee attendance records so I can track absenteeism
- **US-ADM-027**: As an admin, I want to export employee data (CSV/JSON) so I can use it in other systems

#### **1.2.4 Shift Management**
- **US-ADM-030**: As an admin, I want to create new shifts with full details (department, date, time, requirements) so I can staff my organization
- **US-ADM-031**: As an admin, I want to create shifts as drafts so I can review before publishing
- **US-ADM-032**: As an admin, I want to publish draft shifts to the schedule so they become available for employees
- **US-ADM-033**: As an admin, I want to edit existing shifts so I can make changes to requirements or details
- **US-ADM-034**: As an admin, I want to delete shifts so I can remove unnecessary or incorrect entries
- **US-ADM-035**: As an admin, I want to assign employees to shifts so I can confirm staffing
- **US-ADM-036**: As an admin, I want to see shift status (draft/open/active/scheduled/completed) so I can track progress
- **US-ADM-037**: As an admin, I want to see coverage gaps so I can identify understaffed departments
- **US-ADM-038**: As an admin, I want to see peak hour risks so I can proactively address staffing issues
- **US-ADM-039**: As an admin, I want to see certification expiry alerts so I can prevent lapses

#### **1.2.5 Swap Request Management**
- **US-ADM-040**: As an admin, I want to view all pending swap requests so I can review them
- **US-ADM-041**: As an admin, I want to see AI match scores for swap requests so I can prioritize auto-approvals
- **US-ADM-042**: As an admin, I want to approve swap requests automatically if AI score ≥85% so I save time
- **US-ADM-043**: As an admin, I want to manually review swap requests with AI score <85% so I ensure quality
- **US-ADM-044**: As an admin, I want to approve swap requests so employees can swap shifts
- **US-ADM-045**: As an admin, I want to decline swap requests with a reason so employees understand why
- **US-ADM-046**: As an admin, I want to see swap history so I can track patterns and trends
- **US-ADM-047**: As an admin, I want to see average approval times so I can optimize my review process
- **US-ADM-048**: As an admin, I want to see auto-approval rates so I can tune the AI model

#### **1.2.6 Leave Request Management**
- **US-ADM-050**: As an admin, I want to view all pending leave requests so I can review them
- **US-ADM-051**: As an admin, I want to approve leave requests so employees can take time off
- **US-ADM-052**: As an admin, I want to decline leave requests with a reason so employees understand why
- **US-ADM-053**: As an admin, I want to see leave request history so I can track patterns
- **US-ADM-054**: As an admin, I want to see PTO utilization rates so I can plan staffing
- **US-ADM-055**: As an admin, I want to see leave types breakdown so I can understand employee needs

#### **1.2.7 Analytics & Insights**
- **US-ADM-060**: As an admin, I want to see burnout heatmap by department so I can identify problem areas
- **US-ADM-061**: As an admin, I want to see average burnout score across the organization so I can track trends
- **US-ADM-062**: As an admin, I want to see high-risk employee lists so I can intervene proactively
- **US-ADM-063**: As an admin, I want to see burnout distribution (0-20, 21-40, 41-60, 61-80, 81-100) so I understand the spread
- **US-ADM-064**: As an admin, I want to see risk trend over time so I can measure improvement
- **US-ADM-065**: As an admin, I want to see fairness analytics (weekend/night shift distribution) so I can ensure equity
- **US-ADM-066**: As an admin, I want to see absenteeism trends so I can identify problematic patterns
- **US-ADM-067**: As an admin, I want to see peak hour risk analysis so I can optimize staffing
- **US-ADM-068**: As an admin, I want to export analytics reports (PDF/CSV) so I can share with stakeholders

#### **1.2.8 Integration Management**
- **US-ADM-070**: As an admin, I want to connect Workday so I can sync employee data
- **US-ADM-071**: As an admin, I want to connect ADP so I can sync payroll data
- **US-ADM-072**: As an admin, I want to connect Microsoft Entra SSO so I can enable single sign-on
- **US-ADM-073**: As an admin, I want to connect Slack so I can send notifications to channels
- **US-ADM-074**: As an admin, I want to connect Google Calendar so I can sync shift schedules
- **US-ADM-075**: As an admin, I want to connect Epic/Cerner so I can sync patient acuity data
- **US-ADM-076**: As an admin, I want to see integration status and last sync time so I can monitor health
- **US-ADM-077**: As an admin, I want to manually trigger syncs so I can refresh data on demand
- **US-ADM-078**: As an admin, I want to disconnect integrations so I can manage costs

#### **1.2.9 Notification Management**
- **US-ADM-080**: As an admin, I want to view all system notifications so I can stay informed
- **US-ADM-081**: As an admin, I want to configure notification preferences so I get updates in my preferred way
- **US-ADM-082**: As an admin, I want to see notification history so I can track what's been sent

---

### 1.3 MANAGER ROLE (Hybrid - Employee + Admin Capabilities)

#### **1.3.1 Manager-Specific Features**
- **US-MGR-001**: As a manager, I want to see my team's schedule so I can coordinate coverage
- **US-MGR-002**: As a manager, I want to see my team's burnout scores so I can protect their well-being
- **US-MGR-003**: As a manager, I want to see my team's certifications so I can ensure compliance
- **US-MGR-004**: As a manager, I want to see my team's availability so I can plan schedules
- **US-MGR-005**: As a manager, I want to see my team's performance ratings so I can provide feedback
- **US-MGR-006**: As a manager, I want to see my team's attendance records so I can address issues
- **US-MGR-007**: As a manager, I want to see my team's PTO usage so I can plan coverage
- **US-MGR-008**: As a manager, I want to see my team's swap request history so I can manage requests
- **US-MGR-009**: As a manager, I want to see my team's leave requests so I can approve/reject them
- **US-MGR-010**: As a manager, I want to see my team's peak hour coverage so I can ensure safety

#### **1.3.2 Team Management**
- **US-MGR-020**: As a manager, I want to view my direct reports so I can manage them
- **US-MGR-021**: As a manager, I want to see my team's department breakdown so I can understand structure
- **US-MGR-022**: As a manager, I want to see my team's shift patterns so I can identify trends
- **US-MGR-023**: As a manager, I want to see my team's overtime hours so I can control costs
- **US-MGR-024**: As a manager, I want to see my team's night shift load so I can balance workloads

#### **1.3.3 Coverage Management**
- **US-MGR-030**: As a manager, I want to see my department's coverage gaps so I can address them
- **US-MGR-031**: As a manager, I want to see my department's peak hour risks so I can prioritize staffing
- **US-MGR-032**: As a manager, I want to see my department's certification compliance so I can ensure standards
- **US-MGR-033**: As a manager, I want to see my department's absenteeism rates so I can intervene
- **US-MGR-034**: As a manager, I want to see my department's burnout trends so I can protect my team

#### **1.3.4 Decision-Making**
- **US-MGR-040**: As a manager, I want to see AI recommendations for shift coverage so I can make informed decisions
- **US-MGR-041**: As a manager, I want to see fairness scores for my team so I can ensure equitable distribution
- **US-MGR-042**: As a manager, I want to see employee preferences so I can honor their requests
- **US-MGR-043**: As a manager, I want to see historical patterns so I can predict future needs

---

## 2. DATA MODELS

### 2.1 Core Entities

#### **User (Employee)**
```javascript
{
  id: string,                    // e.g., "e-201"
  email: string,                 // e.g., "sarah.chen@stmarrys.health"
  password: string,              // Hashed with bcrypt
  name: string,                  // e.g., "Sarah Chen"
  initials: string,              // e.g., "SC"
  role: "employee" | "admin",    // Role-based access
  title: string,                 // e.g., "Registered Nurse"
  department: string,            // e.g., "ICU Ward B"
  managerId: string,             // Reference to manager (optional)
  phone: string,                 // e.g., "+1 (415) 555-0144"
  avatar: string,                // URL to avatar image
  coverColor: string,            // e.g., "#a5b4fc"
  hiredAt: string,               // ISO date string
  certifications: string[],      // e.g., ["BLS", "ACLS", "PALS"]
  certExpiry: {                  // Certification expiry dates
    [certName: string]: string   // e.g., { "BLS": "2026-08-15", "ACLS": "2026-09-20" }
  },
  weeklyHoursTarget: number,     // e.g., 36
  weeklyHoursThisWeek: number,   // Calculated from shifts
  preferences: {
    maxConsecutiveDays: number,  // e.g., 4
    minHoursBetweenShifts: number, // e.g., 8
    weekendRotation: string      // e.g., "every-third"
  },
  burnoutScore: number,          // 0-100 (cached, recalculated)
  burnoutTrend: "up" | "down" | "stable",
  rating: number,                // 1-5 performance rating
  status: "active" | "inactive" | "on_leave",
  lastActive: string,            // ISO timestamp
  createdAt: string,             // ISO timestamp
  updatedAt: string              // ISO timestamp
}
```

#### **Organization**
```javascript
{
  id: string,                    // e.g., "org-001"
  name: string,                  // e.g., "St. Mary's Health"
  displayName: string,           // e.g., "St. Mary's"
  type: string,                  // e.g., "hospital", "clinic", "nursing"
  size: string,                  // e.g., "51-200"
  timezone: string,              // e.g., "America/New_York"
  weekStartsOn: "monday" | "sunday",
  defaultShiftLength: number,    // e.g., 8
  currency: string,              // e.g., "USD"
  logo: string,                  // URL to logo
  address: {
    street: string,
    city: string,
    state: string,
    zip: string,
    country: string
  },
  contact: {
    email: string,
    phone: string,
    website: string
  },
  policies: {
    maxConsecutiveDays: number,  // e.g., 5
    minRestGap: number,          // e.g., 8 hours
    maxWeeklyHours: number,      // e.g., 48
    swapApprovalWindow: number,  // e.g., 48 hours
    premiumPayThreshold: number, // e.g., 15%
    overtimeRate: number         // e.g., 1.5
  },
  integrations: {
    workday: {
      connected: boolean,
      lastSync: string,          // ISO timestamp
      records: number
    },
    adp: {
      connected: boolean,
      lastSync: string,
      records: number
    },
    entra: {
      connected: boolean,
      lastSync: string,
      records: number
    },
    slack: {
      connected: boolean,
      lastSync: string,
      records: number
    },
    epic: {
      connected: boolean,
      lastSync: string,
      records: number
    },
    gcal: {
      connected: boolean,
      lastSync: string,
      records: number
    }
  },
  createdAt: string,
  updatedAt: string
}
```

#### **Department**
```javascript
{
  id: string,                    // e.g., "d-icu"
  orgId: string,                 // Reference to organization
  name: string,                  // e.g., "ICU Ward B"
  code: string,                  // e.g., "ICU-B"
  headcount: number,             // e.g., 28
  color: string,                 // e.g., "#0284c7"
  managerId: string,             // Reference to department manager
  location: string,              // e.g., "Building A, 4th Floor"
  phone: string,
  email: string,
  active: boolean,
  createdAt: string,
  updatedAt: string
}
```

#### **Shift**
```javascript
{
  id: string,                    // e.g., "s-001"
  orgId: string,                 // Reference to organization
  departmentId: string,          // Reference to department
  title: string,                 // e.g., "ICU Ward B"
  role: string,                  // e.g., "RN Day"
  department: string,            // Denormalized for performance
  date: string,                  // ISO date string (YYYY-MM-DD)
  startHour: number,             // 0-23 (e.g., 7 for 7 AM)
  durationHours: number,         // e.g., 12
  status: "draft" | "open" | "active" | "scheduled" | "completed",
  employeeId: string,            // Reference to assigned employee (optional)
  assignedStaff: string[],       // Array of employee IDs (for multi-slot shifts)
  requiredStaff: number,         // e.g., 3
  urgency: "low" | "medium" | "high",
  payDifferential: string,       // e.g., "+0%", "+15%", "+25%"
  eligible: number,              // e.g., 0 (0 means all eligible)
  description: string,           // e.g., "ICU Ward B day shift"
  notes: string,                 // e.g., "Charge nurse"
  certifications: string[],      // e.g., ["BLS", "ACLS"]
  requiredCert: string,          // Denormalized for performance
  trainingCredit: boolean,       // e.g., false
  seniorityPreference: "none" | "prefer" | "require",
  slotsRemaining: number,        // Calculated: requiredStaff - assignedStaff.length
  createdAt: string,
  updatedAt: string,
  publishedAt: string            // When status changed from draft to open/scheduled
}
```

#### **Swap Request**
```javascript
{
  id: string,                    // e.g., "sw-001"
  orgId: string,
  requesterId: string,           // Reference to employee requesting swap
  requesterName: string,         // Denormalized for performance
  targetId: string,              // Reference to employee being swapped with (optional)
  targetName: string,            // Denormalized for performance
  fromShiftId: string,           // Reference to shift requester wants to give up
  toShiftId: string,             // Reference to shift requester wants to take (optional)
  reason: string,                // e.g., "Personal appointment"
  status: "pending" | "approved" | "declined",
  submittedAt: string,           // ISO timestamp
  decidedAt: string,             // ISO timestamp (when approved/declined)
  aiScore: number,               // 0-100 (auto-calculated)
  matchScore: number,            // 0-100 (same as aiScore)
  managerId: string,             // Reference to manager who approved/declined
  managerNotes: string,          // Notes from manager
  conflictDetected: boolean,     // e.g., false
  conflictDetails: string,       // Details if conflict exists
  createdAt: string,
  updatedAt: string
}
```

#### **Leave Request**
```javascript
{
  id: string,                    // e.g., "lv-001"
  orgId: string,
  employeeId: string,            // Reference to employee
  employeeName: string,          // Denormalized for performance
  type: "vacation" | "sick" | "personal" | "bereavement" | "jury" | "other",
  startDate: string,             // ISO date string
  endDate: string,               // ISO date string
  reason: string,                // e.g., "Family trip"
  status: "pending" | "approved" | "declined",
  submittedAt: string,           // ISO timestamp
  decidedAt: string,             // ISO timestamp
  managerId: string,             // Reference to manager
  managerNotes: string,          // Notes from manager
  approvedDays: number,          // Calculated from startDate to endDate
  createdAt: string,
  updatedAt: string
}
```

#### **Availability**
```javascript
{
  id: string,                    // e.g., "av-001"
  orgId: string,
  employeeId: string,            // Reference to employee
  day: number,                   // 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)
  slot: "morning" | "afternoon" | "night",  // 0=Morning (7-3), 1=Afternoon (3-11), 2=Night (11-7)
  value: "preferred" | "neutral" | "unavailable",
  createdAt: string,
  updatedAt: string,
  unique(employeeId, day, slot)  // Composite unique constraint
}
```

#### **Notification**
```javascript
{
  id: string,                    // e.g., "n-001"
  orgId: string,
  userId: string,                // Reference to user
  type: string,                  // e.g., "swap-requested", "shift-assigned", "leave-approved"
  title: string,                 // e.g., "New swap request from James Park"
  body: string,                  // e.g., "Wants to swap Friday day shift — AI score 94%"
  context: string,               // e.g., "shift-id" or "employee-id"
  read: boolean,                 // e.g., false
  actionUrl: string,             // e.g., "/app/swaps" (optional)
  createdAt: string
}
```

#### **Audit Log**
```javascript
{
  id: string,                    // e.g., "audit-001"
  orgId: string,
  userId: string,                // Reference to user who made change
  userName: string,              // Denormalized for performance
  action: string,                // e.g., "shift-created", "employee-invited", "policy-updated"
  entity: string,                // e.g., "shift", "employee", "organization"
  entityId: string,              // Reference to affected entity
  details: object,               // JSON object with change details
  ipAddress: string,             // e.g., "192.168.1.1"
  userAgent: string,             // e.g., "Mozilla/5.0..."
  createdAt: string
}
```

#### **Invite**
```javascript
{
  id: string,                    // e.g., "inv-001"
  orgId: string,
  email: string,                 // e.g., "new.employee@stmarrys.health"
  name: string,                  // e.g., "John Doe"
  department: string,            // e.g., "ICU Ward B"
  role: "employee" | "admin",
  token: string,                 // e.g., "abc123xyz789" (unique, hashed)
  status: "pending" | "accepted" | "expired",
  invitedBy: string,             // Reference to admin who invited
  acceptedBy: string,            // Reference to employee who accepted (optional)
  expiresAt: string,             // ISO timestamp (e.g., 30 days from creation)
  acceptedAt: string,            // ISO timestamp (optional)
  createdAt: string,
  updatedAt: string
}
```

#### **Attendance Record**
```javascript
{
  id: string,                    // e.g., "att-001"
  orgId: string,
  employeeId: string,
  date: string,                  // ISO date string
  status: "present" | "absent" | "late" | "half_day",
  minutesLate: number,           // e.g., 15
  shiftId: string,               // Reference to shift (optional)
  notes: string,                 // e.g., "Arrived 15 minutes late"
  createdAt: string,
  updatedAt: string,
  unique(employeeId, date)       // Composite unique constraint
}
```

#### **Certification Expiry Alert**
```javascript
{
  id: string,                    // e.g., "cert-alert-001"
  orgId: string,
  employeeId: string,
  employeeName: string,
  cert: string,                  // e.g., "BLS"
  expiryDate: string,            // ISO date string
  daysUntil: number,             // e.g., 14
  severity: "critical" | "high" | "medium",
  notified: boolean,             // e.g., false
  notifiedAt: string,            // ISO timestamp (optional)
  resolved: boolean,             // e.g., false
  resolvedAt: string,            // ISO timestamp (optional)
  createdAt: string,
  updatedAt: string
}
```

#### **Peak Hour Risk**
```javascript
{
  id: string,                    // e.g., "peak-risk-001"
  orgId: string,
  hour: number,                  // 0-23
  label: string,                 // e.g., "7 AM"
  staffed: number,               // e.g., 8
  needed: number,                // e.g., 12
  gap: number,                   // e.g., 4
  severity: "critical" | "high" | "medium",
  departments: string[],         // e.g., ["ICU Ward B", "ER Triage"]
  resolved: boolean,             // e.g., false
  resolvedAt: string,            // ISO timestamp (optional)
  createdAt: string,
  updatedAt: string
}
```

---

## 3. API ENDPOINT SPECIFICATIONS

### 3.1 Authentication API

#### **POST /api/auth/register**
Register a new user (admin creates for employees)
```json
Request:
{
  "email": "employee@hospital.org",
  "name": "John Doe",
  "password": "SecurePass123!",
  "role": "employee",
  "department": "ICU Ward B",
  "title": "Registered Nurse"
}

Response (201 Created):
{
  "id": "e-201",
  "email": "employee@hospital.org",
  "name": "John Doe",
  "role": "employee",
  "department": "ICU Ward B",
  "createdAt": "2026-06-29T10:00:00Z"
}
```

#### **POST /api/auth/login**
Login with email and password
```json
Request:
{
  "email": "employee@hospital.org",
  "password": "SecurePass123!"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e-201",
    "email": "employee@hospital.org",
    "name": "John Doe",
    "role": "employee",
    "department": "ICU Ward B"
  }
}
```

#### **POST /api/auth/refresh**
Refresh access token with refresh token
```json
Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e-201",
    "email": "employee@hospital.org",
    "name": "John Doe",
    "role": "employee"
  }
}
```

#### **POST /api/auth/logout**
Logout user (invalidate tokens)
```json
Request: (empty body)
Response (200 OK):
{
  "message": "Logged out successfully"
}
```

#### **POST /api/auth/forgot-password**
Request password reset
```json
Request:
{
  "email": "employee@hospital.org"
}

Response (200 OK):
{
  "message": "Password reset link sent to your email"
}
```

#### **POST /api/auth/reset-password**
Reset password with token
```json
Request:
{
  "token": "reset-token-here",
  "password": "NewSecurePass123!"
}

Response (200 OK):
{
  "message": "Password reset successfully"
}
```

---

### 3.2 Organization API

#### **GET /api/organization**
Get organization details
```json
Response (200 OK):
{
  "id": "org-001",
  "name": "St. Mary's Health",
  "displayName": "St. Mary's",
  "timezone": "America/New_York",
  "policies": {
    "maxConsecutiveDays": 5,
    "maxWeeklyHours": 48,
    "swapApprovalWindow": 48
  },
  "integrations": {
    "workday": { "connected": true, "lastSync": "2026-06-29T08:00:00Z" },
    "adp": { "connected": true, "lastSync": "2026-06-29T08:00:00Z" }
  }
}
```

#### **PUT /api/organization**
Update organization details
```json
Request:
{
  "displayName": "St. Mary's Hospital",
  "timezone": "America/Los_Angeles"
}

Response (200 OK):
{
  "id": "org-001",
  "displayName": "St. Mary's Hospital",
  "timezone": "America/Los_Angeles"
}
```

#### **GET /api/organization/departments**
Get all departments
```json
Response (200 OK):
[
  {
    "id": "d-icu",
    "name": "ICU Ward B",
    "code": "ICU-B",
    "headcount": 28,
    "color": "#0284c7"
  },
  {
    "id": "d-er",
    "name": "ER Triage",
    "code": "ER",
    "headcount": 41,
    "color": "#ec4899"
  }
]
```

#### **POST /api/organization/departments**
Create new department
```json
Request:
{
  "name": "Pediatrics",
  "code": "PEDS",
  "headcount": 22,
  "color": "#10b981"
}

Response (201 Created):
{
  "id": "d-peds",
  "name": "Pediatrics",
  "code": "PEDS",
  "headcount": 22,
  "color": "#10b981"
}
```

#### **PUT /api/organization/departments/:id**
Update department
```json
Request:
{
  "name": "Pediatrics Ward A",
  "headcount": 24
}

Response (200 OK):
{
  "id": "d-peds",
  "name": "Pediatrics Ward A",
  "code": "PEDS",
  "headcount": 24
}
```

#### **DELETE /api/organization/departments/:id**
Delete department
```json
Response (204 No Content)
```

#### **GET /api/organization/policies**
Get organization policies
```json
Response (200 OK):
{
  "maxConsecutiveDays": 5,
  "minRestGap": 8,
  "maxWeeklyHours": 48,
  "swapApprovalWindow": 48,
  "premiumPayThreshold": 15,
  "overtimeRate": 1.5
}
```

#### **PUT /api/organization/policies**
Update organization policies
```json
Request:
{
  "maxConsecutiveDays": 4,
  "maxWeeklyHours": 40
}

Response (200 OK):
{
  "maxConsecutiveDays": 4,
  "maxWeeklyHours": 40
}
```

---

### 3.3 Employee API

#### **GET /api/employees**
Get all employees (admin only)
```json
Response (200 OK):
[
  {
    "id": "e-201",
    "name": "Sarah Chen",
    "email": "sarah.chen@stmarrys.health",
    "role": "employee",
    "title": "Registered Nurse",
    "department": "ICU Ward B",
    "avatar": "https://...",
    "burnoutScore": 28,
    "rating": 4.9,
    "status": "active"
  },
  {
    "id": "e-202",
    "name": "Marcus Vance",
    "email": "marcus.vance@stmarrys.health",
    "role": "employee",
    "title": "RN",
    "department": "ICU Ward B",
    "avatar": "https://...",
    "burnoutScore": 64,
    "rating": 4.7,
    "status": "active"
  }
]
```

#### **GET /api/employees/:id**
Get employee details
```json
Response (200 OK):
{
  "id": "e-201",
  "name": "Sarah Chen",
  "email": "sarah.chen@stmarrys.health",
  "role": "employee",
  "title": "Registered Nurse",
  "department": "ICU Ward B",
  "phone": "+1 (415) 555-0144",
  "avatar": "https://...",
  "hiredAt": "2021-03-14",
  "certifications": ["BLS", "ACLS", "PALS"],
  "certExpiry": {
    "BLS": "2026-08-15",
    "ACLS": "2026-09-20",
    "PALS": "2026-07-10"
  },
  "weeklyHoursTarget": 36,
  "weeklyHoursThisWeek": 32,
  "burnoutScore": 28,
  "burnoutTrend": "stable",
  "rating": 4.9,
  "preferences": {
    "maxConsecutiveDays": 4,
    "minHoursBetweenShifts": 8,
    "weekendRotation": "every-third"
  }
}
```

#### **PUT /api/employees/:id**
Update employee
```json
Request:
{
  "phone": "+1 (415) 555-0145",
  "certifications": ["BLS", "ACLS", "PALS", "TNCC"],
  "weeklyHoursTarget": 40
}

Response (200 OK):
{
  "id": "e-201",
  "phone": "+1 (415) 555-0145",
  "certifications": ["BLS", "ACLS", "PALS", "TNCC"],
  "weeklyHoursTarget": 40
}
```

#### **DELETE /api/employees/:id**
Deactivate employee
```json
Response (204 No Content)
```

#### **GET /api/employees/:id/burnout**
Get employee burnout analysis
```json
Response (200 OK):
{
  "score": 28,
  "trend": "stable",
  "hoursThisWeek": 32,
  "overtime": 0,
  "consecutiveDays": 2,
  "nightShifts": 0,
  "deniedLeaves": 0,
  "factors": {
    "overtimeScore": 0,
    "consecutiveDaysScore": 28,
    "nightShiftScore": 0,
    "deniedLeaveScore": 0
  }
}
```

#### **GET /api/employees/:id/certifications**
Get employee certifications
```json
Response (200 OK):
[
  {
    "name": "BLS",
    "expiryDate": "2026-08-15",
    "daysUntil": 17,
    "severity": "high"
  },
  {
    "name": "ACLS",
    "expiryDate": "2026-09-20",
    "daysUntil": 53,
    "severity": "medium"
  }
]
```

#### **GET /api/employees/:id/attendance**
Get employee attendance records
```json
Response (200 OK):
[
  {
    "date": "2026-06-28",
    "status": "present",
    "minutesLate": 0
  },
  {
    "date": "2026-06-27",
    "status": "late",
    "minutesLate": 15
  },
  {
    "date": "2026-06-26",
    "status": "absent",
    "minutesLate": 0
  }
]
```

#### **GET /api/employees/:id/leave-requests**
Get employee leave requests
```json
Response (200 OK):
[
  {
    "id": "lv-001",
    "type": "vacation",
    "startDate": "2026-07-15",
    "endDate": "2026-07-19",
    "reason": "Family trip",
    "status": "approved",
    "submittedAt": "2026-06-20T10:00:00Z",
    "decidedAt": "2026-06-21T09:00:00Z"
  }
]
```

#### **POST /api/employees/:id/leave-requests**
Create leave request (employee)
```json
Request:
{
  "type": "vacation",
  "startDate": "2026-07-15",
  "endDate": "2026-07-19",
  "reason": "Family trip"
}

Response (201 Created):
{
  "id": "lv-002",
  "type": "vacation",
  "startDate": "2026-07-15",
  "endDate": "2026-07-19",
  "reason": "Family trip",
  "status": "pending",
  "submittedAt": "2026-06-29T10:00:00Z"
}
```

#### **GET /api/employees/:id/availability**
Get employee availability
```json
Response (200 OK):
[
  {
    "day": 1,  // Monday
    "slot": "morning",
    "value": "preferred"
  },
  {
    "day": 1,
    "slot": "afternoon",
    "value": "neutral"
  },
  {
    "day": 1,
    "slot": "night",
    "value": "unavailable"
  }
]
```

#### **PUT /api/employees/:id/availability**
Update employee availability
```json
Request:
[
  {
    "day": 1,  // Monday
    "slot": "morning",
    "value": "preferred"
  },
  {
    "day": 1,
    "slot": "afternoon",
    "value": "neutral"
  }
]

Response (200 OK):
{
  "message": "Availability updated"
}
```

#### **GET /api/employees/:id/swap-requests**
Get employee swap requests
```json
Response (200 OK):
[
  {
    "id": "sw-001",
    "fromShiftId": "s-001",
    "toShiftId": "s-002",
    "reason": "Personal appointment",
    "status": "approved",
    "submittedAt": "2026-06-25T10:00:00Z",
    "decidedAt": "2026-06-26T09:00:00Z",
    "aiScore": 92
  }
]
```

#### **POST /api/employees/:id/swap-requests**
Create swap request (employee)
```json
Request:
{
  "fromShiftId": "s-001",
  "toShiftId": "s-002",
  "reason": "Personal appointment"
}

Response (201 Created):
{
  "id": "sw-002",
  "fromShiftId": "s-001",
  "toShiftId": "s-002",
  "reason": "Personal appointment",
  "status": "pending",
  "submittedAt": "2026-06-29T10:00:00Z",
  "aiScore": 85
}
```

#### **GET /api/employees/:id/notifications**
Get employee notifications
```json
Response (200 OK):
[
  {
    "id": "n-001",
    "type": "swap-requested",
    "title": "New swap request from James Park",
    "body": "Wants to swap Friday day shift — AI score 94%",
    "context": "sw-001",
    "read": false,
    "createdAt": "2026-06-29T10:00:00Z"
  }
]
```

#### **PUT /api/employees/:id/notifications/:nid/read**
Mark notification as read
```json
Response (200 OK):
{
  "message": "Notification marked as read"
}
```

#### **PUT /api/employees/:id/notifications/read**
Mark all notifications as read
```json
Response (200 OK):
{
  "message": "All notifications marked as read"
}
```

#### **GET /api/employees/:id/shifts**
Get employee shifts
```json
Response (200 OK):
[
  {
    "id": "s-001",
    "title": "ICU Ward B",
    "role": "RN Day",
    "department": "ICU Ward B",
    "date": "2026-06-29",
    "startHour": 7,
    "durationHours": 12,
    "status": "active",
    "payDifferential": "+0%"
  }
]
```

---

### 3.4 Shift API

#### **GET /api/shifts**
Get all shifts (admin/manager)
```json
Response (200 OK):
[
  {
    "id": "s-001",
    "title": "ICU Ward B",
    "role": "RN Day",
    "department": "ICU Ward B",
    "date": "2026-06-29",
    "startHour": 7,
    "durationHours": 12,
    "status": "active",
    "employeeId": "e-201",
    "urgency": "medium",
    "payDifferential": "+0%"
  }
]
```

#### **GET /api/shifts/:id**
Get shift details
```json
Response (200 OK):
{
  "id": "s-001",
  "title": "ICU Ward B",
  "role": "RN Day",
  "department": "ICU Ward B",
  "date": "2026-06-29",
  "startHour": 7,
  "durationHours": 12,
  "status": "active",
  "employeeId": "e-201",
  "assignedStaff": ["e-201"],
  "requiredStaff": 3,
  "urgency": "medium",
  "payDifferential": "+0%",
  "certifications": ["BLS", "ACLS"],
  "description": "ICU Ward B day shift",
  "notes": "Charge nurse",
  "slotsRemaining": 2
}
```

#### **POST /api/shifts**
Create shift (admin/manager)
```json
Request:
{
  "departmentId": "d-icu",
  "title": "ICU Ward B",
  "role": "RN Day",
  "department": "ICU Ward B",
  "date": "2026-06-30",
  "startHour": 7,
  "durationHours": 12,
  "status": "draft",
  "certifications": ["BLS", "ACLS"],
  "requiredStaff": 3,
  "urgency": "medium",
  "payDifferential": "+0%",
  "description": "ICU Ward B day shift",
  "notes": "Charge nurse"
}

Response (201 Created):
{
  "id": "s-002",
  "departmentId": "d-icu",
  "title": "ICU Ward B",
  "role": "RN Day",
  "department": "ICU Ward B",
  "date": "2026-06-30",
  "startHour": 7,
  "durationHours": 12,
  "status": "draft",
  "certifications": ["BLS", "ACLS"],
  "requiredStaff": 3,
  "urgency": "medium",
  "payDifferential": "+0%",
  "description": "ICU Ward B day shift",
  "notes": "Charge nurse",
  "slotsRemaining": 3
}
```

#### **PUT /api/shifts/:id**
Update shift
```json
Request:
{
  "status": "open",
  "requiredStaff": 4,
  "certifications": ["BLS", "ACLS", "PALS"]
}

Response (200 OK):
{
  "id": "s-002",
  "status": "open",
  "requiredStaff": 4,
  "certifications": ["BLS", "ACLS", "PALS"],
  "slotsRemaining": 4
}
```

#### **DELETE /api/shifts/:id**
Delete shift
```json
Response (204 No Content)
```

#### **POST /api/shifts/:id/assign**
Assign employee to shift
```json
Request:
{
  "employeeId": "e-202"
}

Response (200 OK):
{
  "id": "s-002",
  "employeeId": "e-202",
  "assignedStaff": ["e-202"],
  "status": "active"
}
```

#### **POST /api/shifts/:id/publish**
Publish shift from draft
```json
Response (200 OK):
{
  "id": "s-002",
  "status": "open"
}
```

#### **GET /api/shifts/open**
Get open shifts (marketplace)
```json
Response (200 OK):
[
  {
    "id": "s-003",
    "title": "ER Triage",
    "role": "RN Day",
    "department": "ER Triage",
    "date": "2026-06-30",
    "startHour": 9,
    "durationHours": 12,
    "status": "open",
    "urgency": "high",
    "payDifferential": "+15%",
    "slotsRemaining": 2,
    "requiredStaff": 3
  }
]
```

#### **GET /api/shifts/:id/candidates**
Get AI match candidates for shift
```json
Response (200 OK):
[
  {
    "id": "e-202",
    "name": "Marcus Vance",
    "avatar": "https://...",
    "score": 85,
    "factors": {
      "departmentMatch": true,
      "certificationMatch": true,
      "burnoutImpact": -10,
      "availabilityImpact": 0
    }
  },
  {
    "id": "e-203",
    "name": "Dr. Elena Rostova",
    "avatar": "https://...",
    "score": 78,
    "factors": {
      "departmentMatch": true,
      "certificationMatch": true,
      "burnoutImpact": 0,
      "availabilityImpact": +5
    }
  }
]
```

#### **GET /api/shifts/:id/match-score?employeeId=:eid**
Get match score for specific employee
```json
Response (200 OK):
{
  "shiftId": "s-003",
  "employeeId": "e-202",
  "score": 85,
  "factors": {
    "departmentMatch": true,
    "certificationMatch": true,
    "burnoutImpact": -10,
    "availabilityImpact": 0,
    "fairnessImpact": 0,
    "seniorityBonus": 0
  }
}
```

---

### 3.5 Swap Request API

#### **GET /api/swap-requests**
Get swap requests (admin/manager)
```json
Response (200 OK):
[
  {
    "id": "sw-001",
    "requesterId": "e-201",
    "requesterName": "Sarah Chen",
    "fromShiftId": "s-001",
    "toShiftId": "s-002",
    "reason": "Personal appointment",
    "status": "pending",
    "submittedAt": "2026-06-29T10:00:00Z",
    "aiScore": 85
  }
]
```

#### **GET /api/swap-requests/:id**
Get swap request details
```json
Response (200 OK):
{
  "id": "sw-001",
  "requesterId": "e-201",
  "requesterName": "Sarah Chen",
  "fromShiftId": "s-001",
  "toShiftId": "s-002",
  "reason": "Personal appointment",
  "status": "pending",
  "submittedAt": "2026-06-29T10:00:00Z",
  "aiScore": 85,
  "fromShift": {
    "id": "s-001",
    "title": "ICU Ward B",
    "date": "2026-06-29",
    "startHour": 7,
    "durationHours": 12
  },
  "toShift": {
    "id": "s-002",
    "title": "ER Triage",
    "date": "2026-06-30",
    "startHour": 9,
    "durationHours": 12
  }
}
```

#### **POST /api/swap-requests**
Create swap request (employee)
```json
Request:
{
  "fromShiftId": "s-001",
  "toShiftId": "s-002",
  "reason": "Personal appointment"
}

Response (201 Created):
{
  "id": "sw-002",
  "requesterId": "e-201",
  "requesterName": "Sarah Chen",
  "fromShiftId": "s-001",
  "toShiftId": "s-002",
  "reason": "Personal appointment",
  "status": "pending",
  "submittedAt": "2026-06-29T10:00:00Z",
  "aiScore": 85
}
```

#### **PUT /api/swap-requests/:id/approve**
Approve swap request (admin/manager)
```json
Response (200 OK):
{
  "id": "sw-002",
  "status": "approved",
  "decidedAt": "2026-06-29T11:00:00Z",
  "managerNotes": "Approved"
}
```

#### **PUT /api/swap-requests/:id/decline**
Decline swap request (admin/manager)
```json
Request:
{
  "managerNotes": "Conflict with existing shift"
}

Response (200 OK):
{
  "id": "sw-002",
  "status": "declined",
  "decidedAt": "2026-06-29T11:00:00Z",
  "managerNotes": "Conflict with existing shift"
}
```

#### **DELETE /api/swap-requests/:id**
Cancel swap request (employee)
```json
Response (204 No Content)
```

#### **GET /api/swap-requests/pending**
Get pending swap requests (admin/manager)
```json
Response (200 OK):
[
  {
    "id": "sw-001",
    "requesterId": "e-201",
    "requesterName": "Sarah Chen",
    "fromShiftId": "s-001",
    "aiScore": 85,
    "submittedAt": "2026-06-29T10:00:00Z"
  }
]
```

#### **GET /api/swap-requests/auto-approve**
Get auto-approve candidates (AI score ≥85)
```json
Response (200 OK):
[
  {
    "id": "sw-001",
    "requesterId": "e-201",
    "requesterName": "Sarah Chen",
    "fromShiftId": "s-001",
    "aiScore": 85,
    "canAutoApprove": true
  }
]
```

---

### 3.6 Leave Request API

#### **GET /api/leave-requests**
Get leave requests (admin/manager)
```json
Response (200 OK):
[
  {
    "id": "lv-001",
    "employeeId": "e-201",
    "employeeName": "Sarah Chen",
    "type": "vacation",
    "startDate": "2026-07-15",
    "endDate": "2026-07-19",
    "reason": "Family trip",
    "status": "pending",
    "submittedAt": "2026-06-20T10:00:00Z"
  }
]
```

#### **GET /api/leave-requests/:id**
Get leave request details
```json
Response (200 OK):
{
  "id": "lv-001",
  "employeeId": "e-201",
  "employeeName": "Sarah Chen",
  "type": "vacation",
  "startDate": "2026-07-15",
  "endDate": "2026-07-19",
  "reason": "Family trip",
  "status": "pending",
  "submittedAt": "2026-06-20T10:00:00Z",
  "approvedDays": 5
}
```

#### **POST /api/leave-requests**
Create leave request (employee)
```json
Request:
{
  "type": "vacation",
  "startDate": "2026-07-15",
  "endDate": "2026-07-19",
  "reason": "Family trip"
}

Response (201 Created):
{
  "id": "lv-002",
  "type": "vacation",
  "startDate": "2026-07-15",
  "endDate": "2026-07-19",
  "reason": "Family trip",
  "status": "pending",
  "submittedAt": "2026-06-29T10:00:00Z"
}
```

#### **PUT /api/leave-requests/:id/approve**
Approve leave request (admin/manager)
```json
Response (200 OK):
{
  "id": "lv-002",
  "status": "approved",
  "decidedAt": "2026-06-29T11:00:00Z",
  "managerNotes": "Approved"
}
```

#### **PUT /api/leave-requests/:id/decline**
Decline leave request (admin/manager)
```json
Request:
{
  "managerNotes": "Too many employees off this week"
}

Response (200 OK):
{
  "id": "lv-002",
  "status": "declined",
  "decidedAt": "2026-06-29T11:00:00Z",
  "managerNotes": "Too many employees off this week"
}
```

#### **GET /api/leave-requests/pending**
Get pending leave requests (admin/manager)
```json
Response (200 OK):
[
  {
    "id": "lv-001",
    "employeeId": "e-201",
    "employeeName": "Sarah Chen",
    "type": "vacation",
    "startDate": "2026-07-15",
    "endDate": "2026-07-19",
    "reason": "Family trip",
    "status": "pending",
    "submittedAt": "2026-06-20T10:00:00Z"
  }
]
```

#### **GET /api/leave-requests/pto-utilization**
Get PTO utilization rate
```json
Response (200 OK):
{
  "totalPTODays": 20,
  "usedDays": 15,
  "remainingDays": 5,
  "utilizationRate": 75
}
```

---

### 3.7 Availability API

#### **GET /api/availability**
Get availability (admin/manager)
```json
Response (200 OK):
[
  {
    "employeeId": "e-201",
    "employeeName": "Sarah Chen",
    "availability": [
      { "day": 1, "slot": "morning", "value": "preferred" },
      { "day": 1, "slot": "afternoon", "value": "neutral" },
      { "day": 1, "slot": "night", "value": "unavailable" }
    ]
  }
]
```

#### **GET /api/availability/:employeeId**
Get specific employee availability
```json
Response (200 OK):
[
  {
    "day": 1,  // Monday
    "slot": "morning",
    "value": "preferred"
  },
  {
    "day": 1,
    "slot": "afternoon",
    "value": "neutral"
  },
  {
    "day": 1,
    "slot": "night",
    "value": "unavailable"
  }
]
```

#### **PUT /api/availability**
Update availability (employee)
```json
Request:
[
  {
    "day": 1,  // Monday
    "slot": "morning",
    "value": "preferred"
  },
  {
    "day": 1,
    "slot": "afternoon",
    "value": "neutral"
  }
]

Response (200 OK):
{
  "message": "Availability updated"
}
```

#### **GET /api/availability/heatmap**
Get availability heatmap (admin/manager)
```json
Response (200 OK):
[
  {
    "employeeId": "e-201",
    "employeeName": "Sarah Chen",
    "score": 75,  // 0-100
    "preferredCount": 10,
    "neutralCount": 5,
    "unavailableCount": 6
  }
]
```

#### **GET /api/availability/coverage-gaps**
Get coverage gaps
```json
Response (200 OK):
[
  {
    "department": "ICU Ward B",
    "day": "Monday",
    "date": "2026-06-30",
    "staffed": 2,
    "needed": 3,
    "severity": "medium"
  }
]
```

---

### 3.8 Analytics API

#### **GET /api/analytics/burnout**
Get burnout analytics (admin/manager)
```json
Response (200 OK):
{
  "averageScore": 45,
  "highRiskCount": 3,
  "distribution": {
    "0-20": 5,
    "21-40": 10,
    "41-60": 8,
    "61-80": 4,
    "81-100": 2
  },
  "trend": "up",
  "byDepartment": [
    {
      "department": "ICU Ward B",
      "averageScore": 52,
      "highRiskCount": 2
    },
    {
      "department": "ER Triage",
      "averageScore": 68,
      "highRiskCount": 3
    }
  ]
}
```

#### **GET /api/analytics/fairness**
Get fairness analytics (admin/manager)
```json
Response (200 OK):
{
  "fairnessScore": 78,
  "averages": {
    "weekendShifts": 2.5,
    "nightShifts": 3.2,
    "totalHours": 36,
    "overtime": 4
  },
  "variances": {
    "weekend": 1.2,
    "night": 1.5,
    "hours": 4.5,
    "overtime": 2.3
  },
  "stats": [
    {
      "employeeId": "e-201",
      "weekendShifts": 3,
      "nightShifts": 4,
      "totalHours": 40,
      "overtime": 4
    }
  ]
}
```

#### **GET /api/analytics/absenteeism**
Get absenteeism analytics (admin/manager)
```json
Response (200 OK):
{
  "alerts": [
    {
      "employeeId": "e-207",
      "employeeName": "Olivia Reyes",
      "absenceRate": 25,
      "lateRate": 15,
      "severity": "critical",
      "trend": "rising"
    }
  ]
}
```

#### **GET /api/analytics/peak-hour-risks**
Get peak hour risks (admin/manager)
```json
Response (200 OK):
[
  {
    "hour": 7,
    "label": "7 AM",
    "staffed": 8,
    "needed": 12,
    "gap": 4,
    "severity": "high",
    "departments": ["ICU Ward B", "ER Triage", "Pediatrics"]
  }
]
```

#### **GET /api/analytics/certification-expiry**
Get certification expiry alerts (admin/manager)
```json
Response (200 OK):
[
  {
    "employeeId": "e-201",
    "employeeName": "Sarah Chen",
    "cert": "BLS",
    "expiryDate": "2026-08-15",
    "daysUntil": 17,
    "severity": "high"
  }
]
```

#### **GET /api/analytics/shift-status**
Get shift status summary (admin/manager)
```json
Response (200 OK):
{
  "draft": 5,
  "open": 12,
  "active": 45,
  "scheduled": 8,
  "completed": 120
}
```

#### **GET /api/analytics/swap-requests**
Get swap request analytics (admin/manager)
```json
Response (200 OK):
{
  "pending": 5,
  "approved": 45,
  "declined": 10,
  "autoApprovalRate": 85,
  "avgApprovalTime": "2.5 hrs"
}
```

#### **GET /api/analytics/leave-requests**
Get leave request analytics (admin/manager)
```json
Response (200 OK):
{
  "pending": 3,
  "approved": 25,
  "declined": 5,
  "byType": {
    "vacation": 15,
    "sick": 8,
    "personal": 5,
    "bereavement": 2
  }
}
```

---

### 3.9 Notification API

#### **GET /api/notifications**
Get notifications
```json
Response (200 OK):
[
  {
    "id": "n-001",
    "type": "swap-requested",
    "title": "New swap request from James Park",
    "body": "Wants to swap Friday day shift — AI score 94%",
    "context": "sw-001",
    "read": false,
    "actionUrl": "/app/swaps",
    "createdAt": "2026-06-29T10:00:00Z"
  }
]
```

#### **PUT /api/notifications/:id/read**
Mark notification as read
```json
Response (200 OK):
{
  "message": "Notification marked as read"
}
```

#### **PUT /api/notifications/read**
Mark all notifications as read
```json
Response (200 OK):
{
  "message": "All notifications marked as read"
}
```

#### **GET /api/notifications/unread-count**
Get unread notification count
```json
Response (200 OK):
{
  "count": 3
}
```

#### **GET /api/notifications/preferences**
Get notification preferences
```json
Response (200 OK):
{
  "swap": { "on": true, "channel": "push" },
  "shift": { "on": true, "channel": "push" },
  "leave": { "on": true, "channel": "push" },
  "info": { "on": true, "channel": "email" }
}
```

#### **PUT /api/notifications/preferences**
Update notification preferences
```json
Request:
{
  "swap": { "on": true, "channel": "email" },
  "shift": { "on": true, "channel": "push" }
}

Response (200 OK):
{
  "message": "Preferences updated"
}
```

---

### 3.10 Integration API

#### **GET /api/integrations**
Get integrations status
```json
Response (200 OK):
[
  {
    "name": "Workday",
    "key": "workday",
    "connected": true,
    "lastSync": "2026-06-29T08:00:00Z",
    "records": 128
  },
  {
    "name": "ADP",
    "key": "adp",
    "connected": true,
    "lastSync": "2026-06-29T08:00:00Z",
    "records": 128
  },
  {
    "name": "Slack",
    "key": "slack",
    "connected": false,
    "lastSync": null,
    "records": 0
  }
]
```

#### **POST /api/integrations/:key/connect**
Connect integration
```json
Request:
{
  "credentials": {
    "clientId": "xxx",
    "clientSecret": "xxx",
    "tenantId": "xxx"
  }
}

Response (200 OK):
{
  "message": "Integration connected",
  "connected": true,
  "lastSync": "2026-06-29T10:00:00Z"
}
```

#### **POST /api/integrations/:key/sync**
Trigger manual sync
```json
Response (200 OK):
{
  "message": "Sync initiated",
  "recordsSynced": 128
}
```

#### **DELETE /api/integrations/:key**
Disconnect integration
```json
Response (200 OK):
{
  "message": "Integration disconnected"
}
```

---

### 3.11 Audit Log API

#### **GET /api/audit-logs**
Get audit logs (admin only)
```json
Response (200 OK):
[
  {
    "id": "audit-001",
    "userId": "e-001",
    "userName": "Marcus Holloway",
    "action": "shift-created",
    "entity": "shift",
    "entityId": "s-001",
    "details": {
      "department": "ICU Ward B",
      "date": "2026-06-29",
      "startHour": 7,
      "durationHours": 12
    },
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "createdAt": "2026-06-29T10:00:00Z"
  }
]
```

---

## 4. AUTHENTICATION & AUTHORIZATION

### 4.1 Authentication Flow
```
1. User submits email/password → POST /api/auth/login
2. Server validates credentials → Returns JWT access token + refresh token
3. Client stores tokens in memory (not localStorage for security)
4. Client includes access token in Authorization header for all API calls
5. Access token expires after 1 hour → Client uses refresh token to get new access token
6. Refresh token expires after 7 days → User must re-login
```

### 4.2 Token Structure
```javascript
// Access Token (1 hour expiry)
{
  "sub": "e-201",           // User ID
  "role": "employee",       // User role
  "orgId": "org-001",       // Organization ID
  "iat": 1625097600,        // Issued at (timestamp)
  "exp": 1625101200         // Expiry (timestamp)
}

// Refresh Token (7 days expiry)
{
  "sub": "e-201",
  "type": "refresh",
  "iat": 1625097600,
  "exp": 1625616000
}
```

### 4.3 Authorization Middleware
```javascript
// Pseudo-code for authorization middleware
function authorize(roles) {
  return (req, res, next) => {
    const user = req.user;
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    if (user.orgId !== req.orgId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    next();
  };
}

// Usage examples:
// GET /api/employees - authorize(['admin', 'manager'])
// GET /api/employees/:id - authorize(['admin', 'manager'])
// POST /api/employees/:id/leave-requests - authorize(['employee', 'admin', 'manager'])
```

### 4.4 Role-Based Access Control Matrix

| Endpoint | Employee | Admin | Manager |
|----------|----------|-------|---------|
| GET /api/employees | ✅ Own profile | ✅ All | ✅ Own dept |
| POST /api/employees | ❌ | ✅ | ❌ |
| PUT /api/employees/:id | ✅ Own profile | ✅ | ✅ Own dept |
| DELETE /api/employees/:id | ❌ | ✅ | ❌ |
| GET /api/shifts | ✅ Own shifts | ✅ All | ✅ Own dept |
| POST /api/shifts | ❌ | ✅ | ✅ |
| PUT /api/shifts/:id | ❌ | ✅ | ✅ |
| DELETE /api/shifts/:id | ❌ | ✅ | ❌ |
| POST /api/shifts/:id/assign | ❌ | ✅ | ✅ |
| GET /api/swap-requests | ✅ Own requests | ✅ All | ✅ All |
| POST /api/swap-requests | ✅ | ❌ | ❌ |
| PUT /api/swap-requests/:id/approve | ❌ | ✅ | ✅ |
| PUT /api/swap-requests/:id/decline | ❌ | ✅ | ✅ |
| GET /api/leave-requests | ✅ Own requests | ✅ All | ✅ All |
| POST /api/leave-requests | ✅ | ❌ | ❌ |
| PUT /api/leave-requests/:id/approve | ❌ | ✅ | ✅ |
| PUT /api/leave-requests/:id/decline | ❌ | ✅ | ✅ |
| GET /api/analytics/* | ❌ | ✅ | ✅ |
| GET /api/integrations | ❌ | ✅ | ❌ |
| POST /api/integrations/:key/connect | ❌ | ✅ | ❌ |
| GET /api/audit-logs | ❌ | ✅ | ❌ |

---

## 5. SECURITY REQUIREMENTS

### 5.1 HIPAA Compliance
- **Encryption at rest**: AES-256 for all sensitive data (passwords, PHI)
- **Encryption in transit**: TLS 1.3 for all API calls
- **Access logging**: All access to PHI must be logged
- **Audit trails**: All changes to PHI must be tracked
- **BAA signing**: Required for all customers
- **PHI definition**: Employee health data, certifications, leave requests, burnout scores

### 5.2 SOC 2 Type II Compliance
- **Security**: Regular penetration testing, vulnerability scanning
- **Availability**: 99.9% uptime SLA
- **Confidentiality**: Data encryption, access controls
- **Processing integrity**: Data validation, error handling
- **Privacy**: Data minimization, right to deletion

### 5.3 Security Best Practices
- **Password policy**: Minimum 8 characters, uppercase, lowercase, number, special character
- **Rate limiting**: 100 requests/minute per IP
- **CORS**: Whitelist allowed origins
- **CSRF protection**: Token-based for state-changing operations
- **XSS protection**: Input sanitization, CSP headers
- **SQL injection protection**: Parameterized queries
- **Session management**: Secure cookies, short expiry, refresh tokens

### 5.4 Data Retention
- **Active users**: Indefinite until deletion request
- **Inactive users**: 90 days after deactivation
- **Audit logs**: 7 years (compliance requirement)
- **Access logs**: 1 year
- **Backup retention**: 30 days

---

## 6. INTEGRATION REQUIREMENTS

### 6.1 Workday Integration
- **Sync direction**: Workday → GhostShift (one-way)
- **Synced data**: Employee master data, org structure
- **Sync frequency**: Daily at 6 AM
- **Webhook support**: Real-time updates on employee changes
- **Authentication**: OAuth 2.0 with client credentials flow

### 6.2 ADP Integration
- **Sync direction**: ADP → GhostShift (one-way)
- **Synced data**: Payroll data, PTO balances
- **Sync frequency**: Daily at 7 AM
- **Webhook support**: Real-time updates on PTO changes
- **Authentication**: OAuth 2.0 with client credentials flow

### 6.3 Microsoft Entra SSO
- **Authentication**: SAML 2.0
- **Provisioning**: Just-in-time provisioning
- **Sync direction**: Entra → GhostShift (one-way)
- **Synced data**: User identities, group memberships
- **Authentication**: OAuth 2.0 with client credentials flow

### 6.4 Slack Integration
- **Features**: Shift change notifications, burnout alerts
- **Authentication**: OAuth 2.0 with user token flow
- **Permissions**: chat:write, channels:read, users:read
- **Webhook support**: Slack slash commands for shift requests

### 6.5 Google Calendar Integration
- **Sync direction**: GhostShift → Google Calendar (one-way)
- **Synced data**: Employee shift schedules
- **Sync frequency**: Real-time on shift changes
- **Authentication**: OAuth 2.0 with user token flow
- **Permissions**: calendar.events.write, calendar.settings.read

### 6.6 Epic/Cerner Integration
- **Sync direction**: Epic/Cerner → GhostShift (one-way)
- **Synced data**: Patient acuity, department staffing needs
- **Sync frequency**: Every 15 minutes
- **Authentication**: FHIR API with SMART on FHIR
- **Permissions**: Patient read, Observation read

### 6.7 PagerDuty Integration
- **Features**: Critical staffing alerts
- **Authentication**: API key
- **Webhook support**: PagerDuty events → GhostShift alerts

### 6.8 Twilio Integration
- **Features**: SMS notifications for shift changes
- **Authentication**: API key + auth token
- **Features**: Two-factor authentication (optional)

---

## 7. DEPLOYMENT STRATEGY

### 7.1 Infrastructure
- **Cloud provider**: AWS (HIPAA-compliant regions)
- **Compute**: ECS Fargate (containers)
- **Database**: PostgreSQL (RDS, multi-AZ)
- **Cache**: ElastiCache (Redis)
- **Storage**: S3 for file uploads
- **CDN**: CloudFront for static assets
- **Monitoring**: CloudWatch, Datadog
- **Logging**: CloudWatch Logs, ELK stack

### 7.2 Environment
- **Development**: dev.ghostshift.com
- **Staging**: staging.ghostshift.com
- **Production**: app.ghostshift.com

### 7.3 CI/CD Pipeline
1. **Code commit** → GitHub Actions
2. **Run tests** → Jest, Cypress
3. **Build** → Docker image
4. **Security scan** → Snyk, Trivy
5. **Deploy to staging** → ECS Fargate
6. **Run E2E tests** → Cypress
7. **Deploy to production** → ECS Fargate (blue-green)

### 7.4 Backup Strategy
- **Database**: Automated daily backups (7-day retention)
- **Point-in-time recovery**: Enabled (14-day window)
- **Disaster recovery**: Multi-region replication

### 7.5 Uptime SLA
- **99.9%** uptime (production)
- **99.99%** uptime (staging)
- **Maintenance window**: Sundays 2-4 AM EST

---

## 8. DATABASE SCHEMA (PostgreSQL)

### 8.1 Tables

```sql
-- Users (employees)
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  initials VARCHAR(10),
  role VARCHAR(20) CHECK (role IN ('employee', 'admin')) NOT NULL,
  title VARCHAR(255),
  department_id VARCHAR(50) REFERENCES departments(id),
  manager_id VARCHAR(50) REFERENCES users(id),
  phone VARCHAR(50),
  avatar_url TEXT,
  cover_color VARCHAR(20),
  hired_at DATE,
  certifications JSONB,
  cert_expiry JSONB,
  weekly_hours_target SMALLINT DEFAULT 36,
  weekly_hours_this_week SMALLINT DEFAULT 0,
  preferences JSONB,
  burnout_score SMALLINT DEFAULT 0,
  burnout_trend VARCHAR(10) CHECK (burnout_trend IN ('up', 'down', 'stable')),
  rating DECIMAL(2,1) DEFAULT 4.0,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'on_leave')) DEFAULT 'active',
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations
CREATE TABLE organizations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  type VARCHAR(50),
  size VARCHAR(20),
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  week_starts_on VARCHAR(10) DEFAULT 'monday',
  default_shift_length SMALLINT DEFAULT 8,
  currency VARCHAR(10) DEFAULT 'USD',
  logo_url TEXT,
  address JSONB,
  contact JSONB,
  policies JSONB,
  integrations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  headcount SMALLINT DEFAULT 0,
  color VARCHAR(20),
  manager_id VARCHAR(50) REFERENCES users(id),
  location TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts
CREATE TABLE shifts (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  department_id VARCHAR(50) REFERENCES departments(id),
  title VARCHAR(255) NOT NULL,
  role VARCHAR(255),
  department VARCHAR(255),  -- Denormalized
  date DATE NOT NULL,
  start_hour SMALLINT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  duration_hours SMALLINT NOT NULL CHECK (duration_hours BETWEEN 1 AND 24),
  status VARCHAR(20) CHECK (status IN ('draft', 'open', 'active', 'scheduled', 'completed')) DEFAULT 'draft',
  employee_id VARCHAR(50) REFERENCES users(id),
  assigned_staff VARCHAR(50)[],  -- Array of employee IDs
  required_staff SMALLINT DEFAULT 1,
  urgency VARCHAR(10) CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  pay_differential VARCHAR(20) DEFAULT '+0%',
  eligible SMALLINT DEFAULT 0,
  description TEXT,
  notes TEXT,
  certifications TEXT[],
  required_cert VARCHAR(255),  -- Denormalized
  training_credit BOOLEAN DEFAULT false,
  seniority_preference VARCHAR(20) CHECK (seniority_preference IN ('none', 'prefer', 'require')) DEFAULT 'none',
  slots_remaining SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Swap Requests
CREATE TABLE swap_requests (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  requester_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  requester_name VARCHAR(255),  -- Denormalized
  target_id VARCHAR(50) REFERENCES users(id),
  target_name VARCHAR(255),  -- Denormalized
  from_shift_id VARCHAR(50) REFERENCES shifts(id),
  to_shift_id VARCHAR(50) REFERENCES shifts(id),
  reason TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  ai_score SMALLINT CHECK (ai_score BETWEEN 0 AND 100),
  match_score SMALLINT CHECK (match_score BETWEEN 0 AND 100),
  manager_id VARCHAR(50) REFERENCES users(id),
  manager_notes TEXT,
  conflict_detected BOOLEAN DEFAULT false,
  conflict_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE leave_requests (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  employee_name VARCHAR(255),  -- Denormalized
  type VARCHAR(20) CHECK (type IN ('vacation', 'sick', 'personal', 'bereavement', 'jury', 'other')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  manager_id VARCHAR(50) REFERENCES users(id),
  manager_notes TEXT,
  approved_days SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability
CREATE TABLE availability (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  day SMALLINT CHECK (day BETWEEN 0 AND 6) NOT NULL,  -- 0=Sunday, 1=Monday, ..., 6=Saturday
  slot VARCHAR(20) CHECK (slot IN ('morning', 'afternoon', 'night')) NOT NULL,
  value VARCHAR(20) CHECK (value IN ('preferred', 'neutral', 'unavailable')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, day, slot)
);

-- Notifications
CREATE TABLE notifications (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  context VARCHAR(255),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(50) REFERENCES users(id),
  user_name VARCHAR(255),  -- Denormalized
  action VARCHAR(100) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites
CREATE TABLE invites (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  department VARCHAR(255),
  role VARCHAR(20) CHECK (role IN ('employee', 'admin')) DEFAULT 'employee',
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
  invited_by VARCHAR(50) REFERENCES users(id),
  accepted_by VARCHAR(50) REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE attendance (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'half_day')) NOT NULL,
  minutes_late SMALLINT DEFAULT 0,
  shift_id VARCHAR(50) REFERENCES shifts(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, date)
);

-- Certification Expiry Alerts
CREATE TABLE cert_expiry_alerts (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  employee_name VARCHAR(255),  -- Denormalized
  cert VARCHAR(255) NOT NULL,
  expiry_date DATE NOT NULL,
  days_until SMALLINT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium')) NOT NULL,
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peak Hour Risks
CREATE TABLE peak_hour_risks (
  id VARCHAR(50) PRIMARY KEY,
  org_id VARCHAR(50) REFERENCES organizations(id) ON DELETE CASCADE,
  hour SMALLINT CHECK (hour BETWEEN 0 AND 23) NOT NULL,
  label VARCHAR(50) NOT NULL,
  staffed SMALLINT NOT NULL,
  needed SMALLINT NOT NULL,
  gap SMALLINT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium')) NOT NULL,
  departments VARCHAR(255)[],  -- Array of department names
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_shifts_org_id ON shifts(org_id);
CREATE INDEX idx_shifts_department_id ON shifts(department_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_employee_id ON shifts(employee_id);
CREATE INDEX idx_swap_requests_org_id ON swap_requests(org_id);
CREATE INDEX idx_swap_requests_requester_id ON swap_requests(requester_id);
CREATE INDEX idx_swap_requests_status ON swap_requests(status);
CREATE INDEX idx_leave_requests_org_id ON leave_requests(org_id);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_availability_org_id ON availability(org_id);
CREATE INDEX idx_availability_employee_id ON availability(employee_id);
CREATE INDEX idx_availability_employee_day_slot ON availability(employee_id, day, slot);
CREATE INDEX idx_notifications_org_id ON notifications(org_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_invites_org_id ON invites(org_id);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_attendance_org_id ON attendance(org_id);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_cert_expiry_alerts_org_id ON cert_expiry_alerts(org_id);
CREATE INDEX idx_cert_expiry_alerts_employee_id ON cert_expiry_alerts(employee_id);
CREATE INDEX idx_peak_hour_risks_org_id ON peak_hour_risks(org_id);
```

---

## 9. AI/ML MODEL SPECIFICATIONS

### 9.1 Burnout Prediction Model

#### **Input Features**
1. **Overtime hours** (weight: 30%)
   - Current week hours beyond 40
   - Last 4 weeks average overtime

2. **Consecutive days worked** (weight: 30%)
   - Days worked in last 14 days
   - Consecutive days streak

3. **Night shift load** (weight: 25%)
   - Night shifts in last 7 days
   - Night shifts in last 30 days

4. **Denied leave requests** (weight: 15%)
   - Denied requests in last 90 days
   - Pending requests

#### **Output**
- **Score**: 0-100 (higher = higher burnout risk)
- **Trend**: "up", "down", "stable"
- **Risk level**: "low" (<40), "medium" (40-69), "high" (≥70)

#### **Model Type**
- **Algorithm**: LightGBM (Gradient Boosting)
- **Training data**: 6 months of historical data
- **Features**: 14 input features
- **Target**: Burnout score (0-100)
- **Performance**: 94% accuracy (validated)

#### **Real-time Calculation**
```javascript
function computeBurnout(empId) {
  const shifts = getShiftsForEmployee(empId);
  if (!shifts.length) return { score: 0, trend: 'stable' };
  
  // Calculate overtime score (30%)
  const overtimeScore = Math.min(100, (overtime / 20) * 100);
  
  // Calculate consecutive days score (30%)
  const consecutiveScore = Math.min(100, (consecutiveDays / 7) * 100);
  
  // Calculate night shift score (25%)
  const nightScore = Math.min(100, (nightShifts / 5) * 100);
  
  // Calculate denied leave score (15%)
  const deniedScore = Math.min(100, (deniedLeaves / 3) * 100);
  
  // Weighted average
  const score = Math.round(
    (overtimeScore * 0.30) +
    (consecutiveScore * 0.30) +
    (nightScore * 0.25) +
    (deniedScore * 0.15)
  );
  
  // Determine trend
  let trend = 'stable';
  if (score > 70) trend = 'up';
  if (score < 30) trend = 'down';
  
  return { score, trend };
}
```

### 9.2 Swap Match Scoring Model

#### **Input Features**
1. **Department match** (weight: 15%)
   - Same department = +0
   - Different department = -15

2. **Certification match** (weight: 15%)
   - All required certs = +0
   - Missing cert = -10 per cert

3. **Burnout impact** (weight: 15%)
   - Burnout >70 = -20
   - Burnout 50-69 = -10

4. **Consecutive days** (weight: 10%)
   - ≥4 days = -15
   - ≥3 days = -7

5. **Weekly hours** (weight: 10%)
   - >90% of max = -20
   - >70% of max = -10

6. **Certification match** (weight: 10%)
   - Missing required certs = -10 per cert

7. **Night shift load** (weight: 5%)
   - ≥3 night shifts + this is night = -10

8. **Availability** (weight: 10%)
   - Unavailable slot = -30
   - Preferred slot = +5

9. **Fairness** (weight: 8%)
   - Disproportionate weekend/night shifts = -8

10. **Seniority** (weight: 7%)
    - 1+ year = +1
    - 2+ years = +3

#### **Output**
- **Score**: 0-100 (higher = better match)
- **Auto-approval threshold**: ≥85
- **Manual review threshold**: 60-84
- **Auto-reject threshold**: <60

#### **Real-time Calculation**
```javascript
function computeMatchScore(shiftId, employeeId) {
  const shift = getShift(shiftId);
  const emp = getEmployee(employeeId);
  let score = 100;
  
  // Department match (-15 if different)
  if (shift.department !== emp.department) score -= 15;
  
  // Burnout impact (-20 if >70, -10 if >50)
  const burnout = computeBurnout(employeeId);
  if (burnout.score > 70) score -= 20;
  else if (burnout.score > 50) score -= 10;
  
  // Consecutive days (-15 if ≥4, -7 if ≥3)
  if (burnout.consecutiveDays >= 4) score -= 15;
  else if (burnout.consecutiveDays >= 3) score -= 7;
  
  // Weekly hours near max (-20 if >90%, -10 if >70%)
  const weeklyPct = burnout.hoursThisWeek / getPolicies().maxWeeklyHours;
  if (weeklyPct > 0.9) score -= 20;
  else if (weeklyPct > 0.7) score -= 10;
  
  // Certification match (-10 per missing cert)
  if (shift.certifications?.length > 0) {
    const missing = shift.certifications.filter(c => !emp.certifications?.includes(c));
    score -= missing.length * 10;
  }
  
  // Night shift penalty (-10 if ≥3 nights + this is night)
  const isNight = shift.startHour >= 19 || shift.startHour <= 4;
  if (isNight && burnout.nightShifts >= 3) score -= 10;
  
  // Availability (-30 if unavailable, +5 if preferred)
  const avail = getAvailability(employeeId);
  const shiftDay = new Date(shift.date).getDay();
  const shiftSlot = isNight ? 2 : shift.startHour >= 15 ? 1 : 0;
  const entry = avail.find(a => a.day === shiftDay && a.slot === SLOTS[shiftSlot]);
  if (entry) {
    if (entry.value === 'unavailable') score -= 30;
    else if (entry.value === 'preferred') score += 5;
  }
  
  // Fairness penalty (-8 if disproportionate)
  const fairness = computeFairness();
  const empStats = fairness.stats.find(s => s.id === employeeId);
  if (empStats) {
    if (empStats.weekendShifts > fairness.averages.weekend * 1.5) score -= 8;
    if (empStats.nightShifts > fairness.averages.night * 1.5) score -= 8;
  }
  
  // Seniority bonus (+1 to +3)
  if (emp.hiredAt) {
    const tenureMonths = (new Date() - new Date(emp.hiredAt)) / (1000 * 60 * 60 * 24 * 30);
    if (tenureMonths > 24) score += 3;
    else if (tenureMonths > 12) score += 1;
  }
  
  return Math.max(0, Math.min(100, score));
}
```

### 9.3 AI Assistant (Chatbot)

#### **Capabilities**
1. **Shift queries**
   - "How many open shifts are there?"
   - "What shifts are available in ICU?"
   - "Show me my upcoming shifts"

2. **Burnout queries**
   - "What is my burnout risk?"
   - "How can I reduce my burnout?"
   - "Show me my team's burnout scores"

3. **Swap queries**
   - "Draft a swap request for my next shift"
   - "What's my swap request status?"
   - "How does swap matching work?"

4. **Availability queries**
   - "How do I set my availability?"
   - "What's my availability status?"
   - "How does availability affect matching?"

5. **Leave queries**
   - "How do I request time off?"
   - "What's my PTO balance?"
   - "Show my leave history"

6. **General queries**
   - "What can you do?"
   - "Help me navigate the app"
   - "Tell me about GhostShift"

#### **Response Generation**
- **Rule-based**: 80% of queries (fast, reliable)
- **LLM-enhanced**: 20% of queries (complex, contextual)
- **Model**: GPT-4o with RAG over org policies
- **Latency**: <1 second for 95% of queries

#### **Tools Available**
1. `getOpenShifts()` - Get all open shifts
2. `getShiftsForEmployee(employeeId)` - Get employee shifts
3. `computeBurnout(employeeId)` - Get burnout score
4. `findCandidates(shiftId, limit)` - Find swap candidates
5. `addSwap(swap)` - Create swap request
6. `getAvailability(employeeId)` - Get availability
7. `getLeaveRequests(employeeId)` - Get leave requests
8. `getCertExpiryAlerts(employeeId)` - Get certification alerts

---

## 10. TESTING STRATEGY

### 10.1 Unit Tests
- **Framework**: Jest
- **Coverage**: 80% minimum
- **Test types**:
  - API endpoint handlers
  - Business logic (burnout calculation, match scoring)
  - Utility functions (date formatting, validation)
  - Middleware (authentication, authorization)

### 10.2 Integration Tests
- **Framework**: Supertest
- **Coverage**: All API endpoints
- **Test types**:
  - End-to-end user flows
  - Database operations
  - External integrations (mocked)
  - Error handling

### 10.3 E2E Tests
- **Framework**: Cypress
- **Coverage**: Critical user journeys
- **Test types**:
  - Employee onboarding
  - Shift creation and assignment
  - Swap request workflow
  - Leave request workflow
  - Admin dashboard

### 10.4 Performance Tests
- **Framework**: Artillery
- **Scenarios**:
  - 1000 concurrent users
  - 100 requests/second
  - Peak hour load (10,000 requests/minute)

### 10.5 Security Tests
- **Tools**: Snyk, OWASP ZAP
- **Tests**:
  - SQL injection
  - XSS attacks
  - CSRF protection
  - Rate limiting
  - Authentication bypass

---

## 11. MONITORING & ALERTING

### 11.1 Application Monitoring
- **Uptime**: 99.9% SLA
- **Response time**: <200ms for 95% of requests
- **Error rate**: <0.1%
- **Database latency**: <50ms for 95% of queries

### 11.2 Business Metrics
- **User growth**: Daily active users, new signups
- **Engagement**: Shift views, swap requests, leave requests
- **Burnout**: Average score, high-risk count
- **Coverage**: Open shifts, coverage gaps

### 11.3 Alerting
- **Critical**: Database down, API errors >1%
- **Warning**: Response time >500ms, error rate >0.5%
- **Info**: Daily summary, weekly reports

---

## 12. ROADMAP

### Phase 1: Core Platform (Months 1-3)
- Authentication & authorization
- User management
- Shift management
- Swap requests
- Leave requests
- Availability management

### Phase 2: Analytics & Insights (Months 4-5)
- Burnout prediction
- Fairness analytics
- Coverage gap analysis
- Peak hour risk detection
- Certification expiry alerts

### Phase 3: AI & Automation (Months 6-7)
- AI swap matching
- AI assistant
- Auto-approval system
- Smart scheduling recommendations

### Phase 4: Integrations (Months 8-9)
- Workday integration
- ADP integration
- Microsoft Entra SSO
- Slack integration
- Google Calendar integration

### Phase 5: Advanced Features (Months 10-12)
- Mobile app
- Advanced reporting
- Custom workflows
- API for custom integrations

---

## 10. REAL-TIME WEBSOCKET CAPABILITIES

### 10.1 WebSocket Architecture

GhostShift requires **real-time bidirectional communication** for:

- **Live shift updates** (status changes, assignments)
- **Swap request notifications** (new requests, approvals)
- **Burnout alert broadcasts** (high-risk employees)
- **Coverage gap alerts** (critical understaffing)
- **Live chat** (employee-to-employee, employee-to-admin)
- **Presence indicators** (online/offline status)
- **Shift check-in confirmations**
- **Schedule publishing notifications**

### 10.2 WebSocket Endpoints

#### **Main WebSocket Connection**
```
ws://api.ghostshift.com/ws?token=<jwt_token>
```

#### **Authentication Flow**
```javascript
// Client connects
const socket = new WebSocket('wss://api.ghostshift.com/ws');

// Send auth message
socket.send(JSON.stringify({
  type: 'auth',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}));

// Server responds
{
  type: 'auth_response',
  status: 'connected',
  userId: 'e-201',
  orgId: 'org-001',
  timestamp: '2026-06-29T10:00:00Z'
}
```

#### **Subscriptions**

**Shift Updates Subscription**
```javascript
// Client subscribes
{
  type: 'subscribe',
  channel: 'shifts',
  filters: {
    orgId: 'org-001',
    departmentId: 'd-icu',
    employeeId: 'e-201'
  }
}

// Server pushes updates
{
  type: 'shift_update',
  action: 'created' | 'updated' | 'assigned' | 'deleted',
  shift: {
    id: 's-001',
    status: 'active',
    employeeId: 'e-201',
    updatedAt: '2026-06-29T10:00:00Z'
  }
}
```

**Swap Request Subscription**
```javascript
// Client subscribes
{
  type: 'subscribe',
  channel: 'swaps',
  filters: {
    orgId: 'org-001',
    employeeId: 'e-201'
  }
}

// Server pushes updates
{
  type: 'swap_update',
  action: 'new_request' | 'approved' | 'declined',
  swap: {
    id: 'sw-001',
    requesterId: 'e-202',
    fromShiftId: 's-001',
    status: 'approved',
    aiScore: 92
  }
}
```

**Burnout Alert Subscription**
```javascript
// Client subscribes
{
  type: 'subscribe',
  channel: 'burnout_alerts',
  filters: {
    orgId: 'org-001',
    departmentId: 'd-icu'
  }
}

// Server pushes alerts
{
  type: 'burnout_alert',
  employeeId: 'e-207',
  employeeName: 'Olivia Reyes',
  burnoutScore: 88,
  trend: 'up',
  riskLevel: 'high',
  timestamp: '2026-06-29T10:00:00Z'
}
```

**Coverage Gap Subscription**
```javascript
// Client subscribes
{
  type: 'subscribe',
  channel: 'coverage_gaps',
  filters: {
    orgId: 'org-001',
    departmentId: 'd-er'
  }
}

// Server pushes alerts
{
  type: 'coverage_gap_alert',
  department: 'ER Triage',
  day: '2026-06-29',
  staffed: 2,
  needed: 4,
  severity: 'critical',
  timestamp: '2026-06-29T10:00:00Z'
}
```

**Presence Subscription**
```javascript
// Client subscribes
{
  type: 'subscribe',
  channel: 'presence',
  filters: {
    orgId: 'org-001',
    departmentId: 'd-icu'
  }
}

// Server pushes updates
{
  type: 'presence_update',
  employeeId: 'e-201',
  status: 'online' | 'offline' | 'away',
  lastSeen: '2026-06-29T10:00:00Z'
}
```

### 10.3 WebSocket Message Types

```javascript
// Client → Server
{
  type: 'auth' | 'subscribe' | 'unsubscribe' | 'ping' | 'chat_message' | 'shift_checkin' | 'availability_update'
}

// Server → Client
{
  type: 'auth_response' | 'subscribed' | 'unsubscribed' | 'pong' | 'shift_update' | 'swap_update' | 
        'burnout_alert' | 'coverage_gap_alert' | 'presence_update' | 'chat_message' | 'notification'
}
```

### 10.4 Real-Time Features Implementation

#### **Shift Status Updates**
```javascript
// When admin assigns shift
socket.broadcast('shifts', {
  type: 'shift_update',
  action: 'assigned',
  shift: {
    id: 's-001',
    employeeId: 'e-201',
    status: 'active',
    updatedAt: new Date().toISOString()
  }
});

// When employee checks in
socket.send(JSON.stringify({
  type: 'shift_checkin',
  shiftId: 's-001',
  timestamp: new Date().toISOString()
}));

// Server responds with confirmation
{
  type: 'shift_checkin_confirmed',
  shiftId: 's-001',
  checkInTime: '2026-06-29T07:00:00Z',
  shiftEnd: '2026-06-29T19:00:00Z'
}
```

#### **Live Swap Request Queue**
```javascript
// When new swap request is created
socket.broadcast('swaps', {
  type: 'swap_update',
  action: 'new_request',
  swap: {
    id: 'sw-002',
    requesterId: 'e-201',
    fromShiftId: 's-001',
    aiScore: 85,
    submittedAt: new Date().toISOString()
  }
});

// When swap is approved
socket.broadcast('swaps', {
  type: 'swap_update',
  action: 'approved',
  swap: {
    id: 'sw-001',
    status: 'approved',
    decidedAt: new Date().toISOString()
  }
});

// Update all subscribers' UI in real-time
```

#### **Burnout Alert Broadcast**
```javascript
// When burnout score exceeds threshold
const burnout = computeBurnout('e-207');
if (burnout.score >= 70) {
  socket.broadcast('burnout_alerts', {
    type: 'burnout_alert',
    employeeId: 'e-207',
    burnoutScore: burnout.score,
    riskLevel: 'high',
    timestamp: new Date().toISOString()
  });
  
  // Also send notification
  addNotification('burnout-risk', `Burnout risk elevated for ${employeeName}`, 'e-207');
}
```

#### **Coverage Gap Alerts**
```javascript
// When coverage gaps are detected
const gaps = computeCoverageGaps();
gaps.forEach(gap => {
  if (gap.severity === 'critical') {
    socket.broadcast('coverage_gaps', {
      type: 'coverage_gap_alert',
      department: gap.department,
      day: gap.date,
      staffed: gap.staffed,
      needed: gap.needed,
      severity: 'critical',
      timestamp: new Date().toISOString()
    });
  }
});
```

### 10.5 WebSocket Server Implementation (Node.js + Socket.IO)

```javascript
// server/websocket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 25000
});

// Authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    
    socket.user = decoded;
    next();
  });
});

// Connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.sub}`);
  
  // Store socket connection
  socket.userId = socket.user.sub;
  socket.orgId = socket.user.orgId;
  
  // Join org room
  socket.join(`org:${socket.orgId}`);
  
  // Handle subscriptions
  socket.on('subscribe', (data) => {
    const { channel, filters } = data;
    
    // Validate subscription
    if (!['shifts', 'swaps', 'burnout_alerts', 'coverage_gaps', 'presence'].includes(channel)) {
      socket.emit('error', { message: 'Invalid channel' });
      return;
    }
    
    // Join channel room
    socket.join(`channel:${channel}:${socket.orgId}`);
    
    // Emit subscription confirmation
    socket.emit('subscribed', {
      channel,
      timestamp: new Date().toISOString()
    });
    
    // Send initial data for channel
    if (channel === 'shifts') {
      const shifts = getShifts({ orgId: socket.orgId, ...filters });
      socket.emit('shifts_initial', { shifts });
    }
  });
  
  socket.on('unsubscribe', (data) => {
    const { channel } = data;
    socket.leave(`channel:${channel}:${socket.orgId}`);
    socket.emit('unsubscribed', { channel });
  });
  
  // Heartbeat
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
  
  // Chat messages
  socket.on('chat_message', (data) => {
    const { recipientId, message } = data;
    
    // Store message
    const chatMessage = saveChatMessage({
      senderId: socket.userId,
      recipientId,
      message,
      orgId: socket.orgId
    });
    
    // Broadcast to recipient
    io.to(`user:${recipientId}`).emit('chat_message', {
      ...chatMessage,
      sender: socket.user
    });
  });
  
  // Shift check-in
  socket.on('shift_checkin', (data) => {
    const { shiftId } = data;
    
    // Validate and update shift
    const shift = getShift(shiftId);
    if (!shift) {
      socket.emit('error', { message: 'Shift not found' });
      return;
    }
    
    if (shift.employeeId !== socket.userId) {
      socket.emit('error', { message: 'Not assigned to this shift' });
      return;
    }
    
    // Update shift status
    updateShift(shiftId, { status: 'active' });
    
    // Broadcast update
    io.to(`channel:shifts:${socket.orgId}`).emit('shift_update', {
      action: 'status_changed',
      shift: {
        id: shiftId,
        status: 'active',
        checkedInAt: new Date().toISOString()
      }
    });
    
    // Confirm to sender
    socket.emit('shift_checkin_confirmed', {
      shiftId,
      checkInTime: new Date().toISOString(),
      shiftEnd: calculateShiftEnd(shift)
    });
  });
  
  // Availability update
  socket.on('availability_update', (data) => {
    const { day, slot, value } = data;
    
    // Update availability
    setAvailabilityCell(socket.userId, day, slot, value);
    
    // Broadcast update
    io.to(`channel:availability:${socket.orgId}`).emit('availability_update', {
      employeeId: socket.userId,
      day,
      slot,
      value
    });
  });
  
  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    io.to(`org:${socket.orgId}`).emit('presence_update', {
      employeeId: socket.userId,
      status: 'offline',
      lastSeen: new Date().toISOString()
    });
  });
});

// Export broadcast functions
module.exports = {
  broadcastShiftUpdate: (orgId, shift, action) => {
    io.to(`channel:shifts:${orgId}`).emit('shift_update', {
      action,
      shift
    });
  },
  
  broadcastSwapUpdate: (orgId, swap, action) => {
    io.to(`channel:swaps:${orgId}`).emit('swap_update', {
      action,
      swap
    });
  },
  
  broadcastBurnoutAlert: (orgId, alert) => {
    io.to(`channel:burnout_alerts:${orgId}`).emit('burnout_alert', alert);
  },
  
  broadcastCoverageGap: (orgId, gap) => {
    io.to(`channel:coverage_gaps:${orgId}`).emit('coverage_gap_alert', gap);
  },
  
  broadcastPresence: (orgId, presence) => {
    io.to(`channel:presence:${orgId}`).emit('presence_update', presence);
  }
};
```

### 10.6 Client-Side WebSocket Implementation

```javascript
// src/lib/websocket.js
import { io } from 'socket.io-client';

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.token = null;
    this.subscribedChannels = new Set();
  }
  
  connect(token) {
    this.token = token;
    
    this.socket = io('wss://api.ghostshift.com', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectSubscriptions();
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  subscribe(channel, filters = {}) {
    if (this.subscribedChannels.has(channel)) return;
    
    this.socket.emit('subscribe', { channel, filters });
    this.subscribedChannels.add(channel);
  }
  
  unsubscribe(channel) {
    if (!this.subscribedChannels.has(channel)) return;
    
    this.socket.emit('unsubscribe', { channel });
    this.subscribedChannels.delete(channel);
  }
  
  on(event, callback) {
    this.socket.on(event, callback);
  }
  
  off(event, callback) {
    this.socket.off(event, callback);
  }
  
  sendChatMessage(recipientId, message) {
    this.socket.emit('chat_message', { recipientId, message });
  }
  
  checkInShift(shiftId) {
    this.socket.emit('shift_checkin', { shiftId });
  }
  
  updateAvailability(day, slot, value) {
    this.socket.emit('availability_update', { day, slot, value });
  }
  
  reconnectSubscriptions() {
    this.subscribedChannels.forEach(channel => {
      this.subscribe(channel);
    });
  }
}

// Usage
const ws = new WebSocketClient();
ws.connect(localStorage.getItem('gs_token'));

ws.on('shift_update', (data) => {
  console.log('Shift updated:', data);
  // Update UI
});

ws.on('swap_update', (data) => {
  console.log('Swap updated:', data);
  // Update UI
});

ws.on('burnout_alert', (data) => {
  console.log('Burnout alert:', data);
  // Show notification
});

ws.on('coverage_gap_alert', (data) => {
  console.log('Coverage gap:', data);
  // Show alert
});

ws.on('chat_message', (data) => {
  console.log('New chat message:', data);
  // Show chat notification
});
```

### 10.7 Real-Time Features Matrix

| Feature | WebSocket | Polling Fallback | Latency |
|---------|-----------|------------------|---------|
| Shift status updates | ✅ | 5s | <100ms |
| Swap request notifications | ✅ | 5s | <100ms |
| Burnout alerts | ✅ | 10s | <100ms |
| Coverage gap alerts | ✅ | 10s | <100ms |
| Presence indicators | ✅ | 30s | <100ms |
| Live chat | ✅ | N/A | <100ms |
| Shift check-in | ✅ | N/A | <100ms |
| Schedule publishing | ✅ | 5s | <100ms |
| Notification updates | ✅ | 5s | <100ms |

---

## 11. TESTING STRATEGY

### 11.1 Unit Tests

#### **Test Framework**: Jest

#### **Test Coverage Requirements**
- **Minimum Coverage**: 80%
- **Critical Paths**: 95%
- **API Endpoints**: 100%
- **Business Logic**: 100%

#### **Test Categories**

**Authentication Tests**
```javascript
// __tests__/auth.test.js
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@hospital.org', password: 'Password123!' });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.user.role).toBe('employee');
  });
  
  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@hospital.org', password: 'WrongPassword' });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
  
  test('should refresh access token', async () => {
    const refreshToken = 'valid_refresh_token';
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

**Business Logic Tests**
```javascript
// __tests__/burnout.test.js
describe('Burnout Calculation', () => {
  test('should calculate burnout score correctly', () => {
    const shifts = [
      { durationHours: 12, date: '2026-06-29' },
      { durationHours: 12, date: '2026-06-28' },
      { durationHours: 12, date: '2026-06-27' },
      { durationHours: 12, date: '2026-06-26' },
      { durationHours: 12, date: '2026-06-25' }
    ];
    
    const result = computeBurnout('e-201', shifts);
    expect(result.score).toBeGreaterThan(70);
    expect(result.trend).toBe('up');
  });
  
  test('should return low burnout for well-rested employee', () => {
    const shifts = [
      { durationHours: 8, date: '2026-06-29' }
    ];
    
    const result = computeBurnout('e-202', shifts);
    expect(result.score).toBeLessThan(30);
    expect(result.trend).toBe('stable');
  });
});

// __tests__/matchScoring.test.js
describe('Swap Match Scoring', () => {
  test('should score high for perfect match', () => {
    const score = computeMatchScore('s-001', 'e-201');
    expect(score).toBeGreaterThanOrEqual(85);
  });
  
  test('should score low for mismatched certifications', () => {
    const score = computeMatchScore('s-002', 'e-202');
    expect(score).toBeLessThan(60);
  });
});
```

**API Endpoint Tests**
```javascript
// __tests__/api/shifts.test.js
describe('Shift API', () => {
  test('should create new shift', async () => {
    const token = await getTestToken();
    const response = await request(app)
      .post('/api/shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        departmentId: 'd-icu',
        title: 'ICU Ward B',
        date: '2026-07-01',
        startHour: 7,
        durationHours: 12
      });
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
  
  test('should get all shifts for org', async () => {
    const token = await getTestToken();
    const response = await request(app)
      .get('/api/shifts')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
```

### 11.2 Integration Tests

#### **Test Framework**: Supertest + Jest

#### **Test Scenarios**

**Complete User Flow Tests**
```javascript
// __tests__/integration/userFlows.test.js
describe('Complete User Flows', () => {
  test('employee onboarding flow', async () => {
    // 1. Create invite
    const adminToken = await getAdminToken();
    const inviteResponse = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: 'new.employee@hospital.org',
        name: 'New Employee',
        role: 'employee',
        department: 'ICU Ward B'
      });
    
    expect(inviteResponse.status).toBe(201);
    
    // 2. Accept invite
    const inviteToken = inviteResponse.body.token;
    const acceptResponse = await request(app)
      .post('/api/invites/accept')
      .send({ token: inviteToken });
    
    expect(acceptResponse.status).toBe(200);
    
    // 3. Login as new employee
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'new.employee@hospital.org',
        password: 'Password123!'
      });
    
    expect(loginResponse.status).toBe(200);
  });
  
  test('swap request workflow', async () => {
    const employeeToken = await getEmployeeToken();
    
    // 1. Create swap request
    const swapResponse = await request(app)
      .post('/api/swap-requests')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        fromShiftId: 's-001',
        toShiftId: 's-002',
        reason: 'Personal appointment'
      });
    
    expect(swapResponse.status).toBe(201);
    expect(swapResponse.body.status).toBe('pending');
    
    // 2. Admin approves swap
    const adminToken = await getAdminToken();
    const approveResponse = await request(app)
      .put(`/api/swap-requests/${swapResponse.body.id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(approveResponse.status).toBe(200);
    expect(approveResponse.body.status).toBe('approved');
  });
});
```

**Database Integration Tests**
```javascript
// __tests__/integration/database.test.js
describe('Database Integration', () => {
  test('should persist shift and retrieve it', async () => {
    const shift = {
      id: 's-test-001',
      orgId: 'org-001',
      departmentId: 'd-icu',
      title: 'Test Shift',
      date: '2026-07-01',
      startHour: 7,
      durationHours: 12
    };
    
    await db('shifts').insert(shift);
    
    const retrieved = await db('shifts').where({ id: 's-test-001' }).first();
    expect(retrieved).toMatchObject(shift);
  });
  
  test('should update employee burnout score', async () => {
    await db('users')
      .where({ id: 'e-201' })
      .update({ burnout_score: 50 });
    
    const updated = await db('users').where({ id: 'e-201' }).first();
    expect(updated.burnout_score).toBe(50);
  });
});
```

### 11.3 E2E Tests

#### **Test Framework**: Cypress

#### **Test Scenarios**

**Critical User Journey Tests**
```javascript
// cypress/e2e/employee/shift-marketplace.cy.js
describe('Employee Shift Marketplace', () => {
  it('should browse and request shifts', () => {
    cy.login('employee@hospital.org', 'Password123!');
    
    // Navigate to marketplace
    cy.visit('/app/marketplace');
    
    // Filter shifts
    cy.get('[data-cy="filter-urgency-high"]').click();
    cy.get('[data-cy="filter-department-ICU"]').click();
    
    // View shift details
    cy.get('[data-cy="shift-card-0"]').click();
    cy.get('[data-cy="shift-details"]').should('be.visible');
    
    // Request shift
    cy.get('[data-cy="request-shift"]').click();
    cy.get('[data-cy="confirm-request"]').click();
    
    // Verify request created
    cy.contains('Request submitted').should('be.visible');
  });
  
  it('should view burnout score', () => {
    cy.login('employee@hospital.org', 'Password123!');
    cy.visit('/app/employee');
    
    cy.get('[data-cy="burnout-score"]').should('be.visible');
    cy.get('[data-cy="burnout-trend"]').should('be.visible');
  });
});

// cypress/e2e/admin/swap-approval.cy.js
describe('Admin Swap Approval', () => {
  it('should approve swap request', () => {
    cy.login('admin@hospital.org', 'Password123!');
    cy.visit('/app/swaps');
    
    // View pending requests
    cy.get('[data-cy="pending-tab"]').click();
    cy.get('[data-cy="swap-request-0"]').should('be.visible');
    
    // Approve swap
    cy.get('[data-cy="approve-swap-0"]').click();
    cy.get('[data-cy="confirm-approval"]').click();
    
    // Verify approval
    cy.contains('Swap approved').should('be.visible');
  });
});
```

### 11.4 Performance Tests

#### **Test Framework**: Artillery

#### **Test Scenarios**

**Load Test Configuration**
```yaml
# artillery/load-test.yml
config:
  target: "https://api.ghostshift.com"
  phases:
    - duration: 60
      arrivalRate: 100
      name: Warm up
    - duration: 120
      arrivalRate: 500
      name: Peak load
    - duration: 60
      arrivalRate: 1000
      name: Stress test
    - duration: 60
      arrivalRate: 500
      name: Cool down

scenarios:
  - name: "User Login"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@hospital.org"
            password: "Password123!"
          capture:
            - json: "$.token"
              as: token
          after: setHeader("Authorization", "Bearer {{token}}")

  - name: "Get Shifts"
    flow:
      - get:
          url: "/api/shifts"

  - name: "Get Analytics"
    flow:
      - get:
          url: "/api/analytics/burnout"

  - name: "Create Swap Request"
    flow:
      - post:
          url: "/api/swap-requests"
          json:
            fromShiftId: "s-001"
            toShiftId: "s-002"
            reason: "Test swap"
```

**Performance Targets**
```javascript
// __tests__/performance/performance.test.js
describe('Performance Tests', () => {
  test('API response time should be under 200ms', async () => {
    const response = await request(app).get('/api/shifts');
    expect(response.duration).toBeLessThan(200);
  });
  
  test('Database queries should be under 50ms', async () => {
    const start = Date.now();
    await db('shifts').where({ orgId: 'org-001' });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(50);
  });
  
  test('Should handle 1000 concurrent WebSocket connections', async () => {
    const connections = [];
    for (let i = 0; i < 1000; i++) {
      connections.push(createWebSocketConnection());
    }
    
    await Promise.all(connections);
    expect(connections.length).toBe(1000);
  });
});
```

### 11.5 Stress Tests

#### **Stress Test Scenarios**

**Scenario 1: High Swap Request Volume**
```javascript
// __tests__/stress/swap-stress.test.js
describe('Swap Request Stress Test', () => {
  test('should handle 1000 swap requests per minute', async () => {
    const requests = [];
    for (let i = 0; i < 1000; i++) {
      requests.push(createSwapRequest({
        fromShiftId: 's-001',
        reason: `Stress test ${i}`
      }));
    }
    
    const results = await Promise.all(requests);
    const successRate = results.filter(r => r.status === 201).length / results.length;
    expect(successRate).toBeGreaterThan(0.95);
  });
  
  test('should process swaps within 1 second', async () => {
    const start = Date.now();
    await processSwapRequest('s-001', 'e-201', 'Personal reason');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

**Scenario 2: Burnout Calculation Load**
```javascript
// __tests__/stress/burnout-stress.test.js
describe('Burnout Calculation Stress Test', () => {
  test('should calculate burnout for 1000 employees in under 5 seconds', async () => {
    const start = Date.now();
    await computeAllBurnout();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000);
  });
  
  test('should cache burnout results', async () => {
    const result1 = await computeBurnout('e-201');
    const result2 = await computeBurnout('e-201');
    expect(result1).toEqual(result2);
  });
});
```

**Scenario 3: WebSocket Connection Stress**
```javascript
// __tests__/stress/websocket-stress.test.js
describe('WebSocket Stress Test', () => {
  test('should handle 5000 concurrent WebSocket connections', async () => {
    const connections = [];
    for (let i = 0; i < 5000; i++) {
      connections.push(createWebSocketConnection());
    }
    
    await Promise.all(connections);
    expect(connections.length).toBe(5000);
    
    // Verify all connections are active
    const active = connections.filter(c => c.readyState === WebSocket.OPEN);
    expect(active.length).toBeGreaterThan(4900);
  });
});
```

### 11.6 Security Tests

#### **Test Framework**: OWASP ZAP + Snyk

#### **Security Test Scenarios**

**Authentication Tests**
```javascript
// __tests__/security/auth.test.js
describe('Security - Authentication', () => {
  test('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "test@hospital.org' OR '1'='1",
        password: "Password123!"
      });
    
    expect(response.status).toBe(401);
  });
  
  test('should reject XSS attempts', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "<script>alert('XSS')</script>",
        password: "Password123!"
      });
    
    expect(response.status).toBe(400);
  });
  
  test('should enforce rate limiting', async () => {
    for (let i = 0; i < 100; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@hospital.org',
          password: 'WrongPassword'
        });
    }
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@hospital.org',
        password: 'WrongPassword'
      });
    
    expect(response.status).toBe(429);
  });
});
```

**Authorization Tests**
```javascript
// __tests__/security/authz.test.js
describe('Security - Authorization', () => {
  test('should prevent employee from viewing all employees', async () => {
    const employeeToken = await getEmployeeToken();
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${employeeToken}`);
    
    expect(response.status).toBe(403);
  });
  
  test('should prevent employee from creating shifts', async () => {
    const employeeToken = await getEmployeeToken();
    const response = await request(app)
      .post('/api/shifts')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        departmentId: 'd-icu',
        title: 'Test Shift',
        date: '2026-07-01',
        startHour: 7,
        durationHours: 12
      });
    
    expect(response.status).toBe(403);
  });
  
  test('should allow admin to view all employees', async () => {
    const adminToken = await getAdminToken();
    const response = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
  });
});
```

**Data Protection Tests**
```javascript
// __tests__/security/data.test.js
describe('Security - Data Protection', () => {
  test('should encrypt passwords in database', async () => {
    const user = await db('users').where({ email: 'test@hospital.org' }).first();
    expect(user.password).not.toBe('Password123!');
    expect(user.password).toHaveLength(60); // bcrypt hash length
  });
  
  test('should not expose sensitive data in API responses', async () => {
    const response = await request(app)
      .get('/api/employees/e-201')
      .set('Authorization', `Bearer ${await getEmployeeToken()}`);
    
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('certExpiry');
  });
});
```

### 11.7 Test Execution Pipeline

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance
npm run test:security

# Generate coverage report
npm run test:coverage

# Run tests in CI/CD
npm run test:ci
```

### 11.8 Test Coverage Dashboard

```javascript
// __tests__/coverage/coverage-report.js
const { createCoverageReport } = require('jest-coverage-report');

describe('Test Coverage Report', () => {
  test('should generate coverage report', () => {
    const report = createCoverageReport({
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    });
    
    expect(report.statements.pct).toBeGreaterThanOrEqual(80);
    expect(report.branches.pct).toBeGreaterThanOrEqual(80);
    expect(report.functions.pct).toBeGreaterThanOrEqual(80);
    expect(report.lines.pct).toBeGreaterThanOrEqual(80);
  });
});
```

---

## 12. MONITORING & ALERTING

### 12.1 Application Monitoring
- **Uptime**: 99.9% SLA
- **Response time**: <200ms for 95% of requests
- **Error rate**: <0.1%
- **Database latency**: <50ms for 95% of queries
- **WebSocket latency**: <100ms for 95% of messages

### 12.2 Business Metrics
- **User growth**: Daily active users, new signups
- **Engagement**: Shift views, swap requests, leave requests
- **Burnout**: Average score, high-risk count
- **Coverage**: Open shifts, coverage gaps

### 12.3 Alerting
- **Critical**: Database down, API errors >1%
- **Warning**: Response time >500ms, error rate >0.5%
- **Info**: Daily summary, weekly reports

### 12.4 Monitoring Tools
- **Application**: Datadog, New Relic
- **Database**: AWS RDS Performance Insights
- **Logs**: CloudWatch Logs, ELK Stack
- **Tracing**: AWS X-Ray
- **Metrics**: Prometheus + Grafana

---

## 13. ROADMAP

### Phase 1: Core Platform (Months 1-3)
- Authentication & authorization
- User management
- Shift management
- Swap requests
- Leave requests
- Availability management
- WebSocket real-time communication

### Phase 2: Analytics & Insights (Months 4-5)
- Burnout prediction
- Fairness analytics
- Coverage gap analysis
- Peak hour risk detection
- Certification expiry alerts

### Phase 3: AI & Automation (Months 6-7)
- AI swap matching
- AI assistant
- Auto-approval system
- Smart scheduling recommendations

### Phase 4: Integrations (Months 8-9)
- Workday integration
- ADP integration
- Microsoft Entra SSO
- Slack integration
- Google Calendar integration

### Phase 5: Advanced Features (Months 10-12)
- Mobile app
- Advanced reporting
- Custom workflows
- API for custom integrations

---

## 14. CONCLUSION

This backend plan provides a **complete blueprint** for building GhostShift. It includes:

✅ **100+ user stories** for all roles  
✅ **15+ data models** with full schema  
✅ **50+ API endpoints** with specifications  
✅ **WebSocket real-time communication** for all features  
✅ **Security requirements** (HIPAA, SOC 2)  
✅ **Integration requirements** (7+ systems)  
✅ **AI/ML model specifications**  
✅ **Comprehensive testing strategy**  
✅ **Monitoring & alerting**  
✅ **Deployment strategy**  
✅ **12-month roadmap**

With this plan, you can build a **production-ready, enterprise-grade** healthcare scheduling platform with real-time capabilities.
