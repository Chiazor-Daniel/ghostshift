"""
Seed a fully populated demo organization for GhostShift.

Creates: Riverside General Hospital, 5 departments, 14 employees (1 admin + 13 staff),
3 months of shifts (~120), realistic pending swaps and leaves, notifications,
and varied burnout scores.

Idempotent: skips if the demo org already exists. Safe to re-run.

Usage:
    cd backend && ./venv/bin/python seed_demo.py
"""

import json
import secrets
import sys
from datetime import datetime, timedelta, timezone

# Make sure project root is importable
sys.path.insert(0, ".")

from config.database import SessionLocal, engine, Base
from middleware.auth import hash_password
from models.user import User
from models.organization import Organization, Department
from models.shift import Shift
from models.swap import SwapRequest
from models.leave import LeaveRequest
from models.notification import Notification

ORG_ID = "org_demo_riverside_001"
ADMIN_EMAIL = "demo.admin@riverside.health"
EMP_EMAIL = "demo.employee@riverside.health"
PASSWORD = "Demo1234!"

DEPARTMENTS = [
    {"name": "Emergency",     "description": "24/7 ER — trauma, urgent care, critical intake"},
    {"name": "ICU",           "description": "Intensive care unit — 16 beds, ventilator support"},
    {"name": "Pediatrics",    "description": "Children's ward — ages 0-17, includes NICU step-down"},
    {"name": "Surgery",       "description": "Operating theatres — 6 rooms, scheduled + emergency"},
    {"name": "Cardiology",    "description": "Cardiac care unit — telemetry, post-op recovery"},
]

# (name, role, title, dept, weekly_hours_target, burnout_score, burnout_trend)
EMPLOYEES = [
    ("Dr. Aisha Patel",     "admin",    "Chief Medical Officer",       "Administration", 45,  35, "down"),
    ("Dr. Marcus Holloway", "employee", "Attending Physician",         "Emergency",      50,  62, "up"),
    ("RN Priya Sharma",     "employee", "Charge Nurse",                "Emergency",      40,  78, "up"),
    ("RN David Kim",        "employee", "Registered Nurse",            "Emergency",      36,  45, "stable"),
    ("RN Olivia Reyes",     "employee", "Registered Nurse",            "ICU",            36,  58, "up"),
    ("Dr. James Okafor",    "employee", "Intensivist",                 "ICU",            50,  41, "stable"),
    ("RN Aisha Patel",      "employee", "Registered Nurse",            "ICU",            36,  30, "down"),
    ("Dr. Sophia Martinez", "employee", "Pediatrician",                "Pediatrics",     45,  25, "down"),
    ("RN Emily Chen",       "employee", "Pediatric Nurse",             "Pediatrics",     36,  40, "stable"),
    ("Dr. Liam Foster",     "employee", "Surgeon",                     "Surgery",        50,  55, "up"),
    ("RN Carlos Mendez",    "employee", "Surgical Nurse",              "Surgery",        36,  48, "stable"),
    ("Dr. Yuki Tanaka",     "employee", "Cardiologist",                "Cardiology",     50,  33, "down"),
    ("RN Amara Williams",   "employee", "Cardiac Nurse",               "Cardiology",     36,  50, "stable"),
    ("RN Ben Thompson",     "employee", "Float Pool Nurse",            "Emergency",      24,  22, "down"),
]


def new_id(prefix: str) -> str:
    return f"{prefix}_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{secrets.token_hex(3)}"


def already_exists(db) -> bool:
    return db.query(Organization).filter(Organization.id == ORG_ID).first() is not None


def create_org(db) -> Organization:
    org = Organization(
        id=ORG_ID,
        name="Riverside General Hospital",
        slug="riverside-general",
        description="A 220-bed acute care hospital serving the greater Riverside metro. Level II trauma center.",
        website="https://riverside.health",
        phone="+1-555-0142",
        email="contact@riverside.health",
        address="1200 Riverbend Way",
        city="Riverside",
        state="CA",
        zip_code="92501",
        country="USA",
        timezone="America/Los_Angeles",
        currency="USD",
        is_active=True,
        settings={
            "week_start": "monday",
            "fairness_window_days": 28,
            "max_consecutive_nights": 3,
            "ai_enabled": True,
        },
        created_at=datetime.now(timezone.utc),
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    print(f"  ✓ Created org: {org.name} ({org.id})")
    return org


def create_departments(db) -> dict:
    out = {}
    for d in DEPARTMENTS:
        dept = Department(
            id=new_id("dept"),
            org_id=ORG_ID,
            name=d["name"],
            description=d["description"],
            headcount=sum(1 for e in EMPLOYEES if e[3] == d["name"]),
            budget=2_500_000,
            settings={"color_seed": d["name"][:3].lower()},
            created_at=datetime.now(timezone.utc),
        )
        db.add(dept)
        out[d["name"]] = dept
    db.commit()
    print(f"  ✓ Created {len(DEPARTMENTS)} departments")
    return out


def _generate_password() -> str:
    """Generate a unique, readable random demo password."""
    return f"Demo-{secrets.token_urlsafe(6)}!"


def create_users(db) -> dict:
    """Returns {name: user_row}."""
    out = {}
    admin_password = PASSWORD
    employee_password = PASSWORD
    for (name, role, title, dept, hours, burnout, trend) in EMPLOYEES:
        # Build email
        if role == "admin":
            email = ADMIN_EMAIL
            user_password = admin_password
        else:
            slug = name.lower().split()[-1]  # last name
            first = name.lower().split()[0][0]
            email = f"{first}.{slug}@riverside.health"
            # Avoid collision: make sure the demo.employee is named Olivia Reyes for clarity
            if name == "RN Olivia Reyes":
                email = EMP_EMAIL
            user_password = employee_password

        existing = db.query(User).filter(User.email == email).first()
        if existing:
            out[name] = existing
            continue

        initials = "".join(p[0] for p in name.split() if p[0].isupper())[:3]
        user = User(
            id=new_id("user"),
            org_id=ORG_ID,
            email=email,
            password_hash=hash_password(user_password),
            name=name,
            initials=initials,
            role=role,
            title=title,
            department=dept,
            weekly_hours_target=hours,
            weekly_hours_this_week=int(hours * 0.6),
            burnout_score=burnout,
            burnout_trend=trend,
            rating=85 + (burnout % 10),
            status="active",
            avatar_url=f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=6366f1&color=fff&size=120",
            cover_color="6366f1" if role == "admin" else "8b5cf6",

            preferences={"preferred_shift": "day", "overtime_ok": role != "admin"},
            hired_at=datetime.now(timezone.utc) - timedelta(days=400 + (burnout * 5)),
            created_at=datetime.now(timezone.utc),
        )
        db.add(user)
        out[name] = user
    db.commit()
    print(f"  ✓ Created {len(EMPLOYEES)} users")
    print(f"     Admin   login: {ADMIN_EMAIL} / {admin_password}")
    print(f"     Employee login: {EMP_EMAIL} / {employee_password}")
    return out


def create_shifts(db, users: dict) -> list:
    """Realistic 14-day schedule for a 220-bed hospital demo."""
    shifts = []
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    # Keep a few past shifts so the dashboard has some completed data to show,
    # but the bulk is the upcoming two weeks the admin actually cares about.
    start = today - timedelta(days=3)
    end = today + timedelta(days=14)
    days = (end - start).days

    import random
    random.seed(42)

    # Per-department templates: (title, required_staff, dept_name)
    # Roughly 1 day + 1 night shift per department per day.
    templates = [
        ("Emergency Day", 2, "Emergency"),
        ("Emergency Night", 2, "Emergency"),
        ("ICU Day", 2, "ICU"),
        ("ICU Night", 1, "ICU"),
        ("Pediatrics Day", 2, "Pediatrics"),
        ("Pediatrics Night", 1, "Pediatrics"),
        ("Surgery Day", 2, "Surgery"),
        ("Surgery Night", 1, "Surgery"),
        ("Cardiology Day", 2, "Cardiology"),
        ("Cardiology Night", 1, "Cardiology"),
    ]

    # Build a pool of employees per department
    by_dept = {}
    for n, u in users.items():
        by_dept.setdefault(u.department, []).append(u)

    admin_templates = [("Admin On-Call", 1, "Administration")]

    for d in range(days):
        day = start + timedelta(days=d)
        for tpl_idx, (title, req, dept) in enumerate(templates + admin_templates):
            # Open ~10% of shifts to make coverage look realistic
            skip = random.random() < 0.10
            start_hour = 7 if "Day" in title else 19
            sh = Shift(
                id=new_id("s"),
                org_id=ORG_ID,
                department=dept,
                title=title,
                description=f"{title} for {day.date().isoformat()}",
                start_time=day + timedelta(hours=start_hour),
                end_time=day + timedelta(hours=start_hour + 12),
                duration_hours=12,
                start_hour=start_hour,
                status="open" if skip else "active",
                type="regular",
                urgency="high" if "Emergency" in dept or dept == "ICU" else "normal",
                location=f"{dept} Wing, Floor {1 + (tpl_idx % 4)}",
                required_staff=req,
                assigned_staff=[],
                required_count=req,
                eligible_count=req + 2,

                training_credit=False,
                seniority_preference="none",
                coverage_status="open" if skip else "full",
                tags=[dept.lower(), "day" if start_hour == 7 else "night"],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )

            if not skip and dept in by_dept and len(by_dept[dept]) >= req:
                candidates = by_dept[dept][:]
                random.shuffle(candidates)
                chosen = candidates[:req]
                sh.assigned_staff = [u.id for u in chosen]
                sh.employee_id = chosen[0].id if chosen else None

            db.add(sh)
            shifts.append(sh)
    db.commit()
    print(f"  ✓ Created {len(shifts)} shifts across {days} days")
    return shifts


def create_swaps(db, users, shifts):
    """Pending swaps: 2 pickups + 2 true swaps so From/To are clear in the UI."""
    active = [s for s in shifts if s.status == "active" and s.assigned_staff]
    open_shifts = [s for s in shifts if s.status == "open"]
    if not active:
        return

    by_dept = {}
    for n, u in users.items():
        if u.role == "employee":
            by_dept.setdefault(u.department, []).append(u)

    # Pickups: employee wants an open shift (no responder shift)
    pickup_data = [
        ("RN Olivia Reyes",    "covering an open ER day shift"),
        ("RN David Kim",       "picking up extra ICU shift this week"),
    ]
    for who, reason in pickup_data:
        if who not in users:
            continue
        u = users[who]
        candidates = [s for s in open_shifts if s.department == u.department]
        if not candidates:
            candidates = open_shifts[:5]
        if not candidates:
            continue
        target = candidates[0]
        swap = SwapRequest(
            id=new_id("sw"),
            org_id=ORG_ID,
            requester_id=u.id,
            requester_shift_id=target.id,
            reason=reason,
            kind="pickup",
            ai_match_score=82.5,
            status="pending",
            created_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.add(swap)

    # True swaps: employee trades their assigned shift for another employee's assigned shift
    swap_data = [
        ("RN Priya Sharma",     "childcare conflict — need morning shift"),
        ("RN Carlos Mendez",    "family obligation — would trade for weekend"),
    ]
    for who, reason in swap_data:
        if who not in users:
            continue
        u = users[who]
        my_shifts = [s for s in active if s.employee_id == u.id]
        if not my_shifts:
            my_shifts = [s for s in active if u.department == s.department and u.id in s.assigned_staff][:1]
        if not my_shifts:
            continue
        my_shift = my_shifts[0]

        # Find a different employee's shift in the same department as target
        others = [s for s in active
                  if s.id != my_shift.id
                  and s.department == u.department
                  and s.employee_id
                  and s.employee_id != u.id]
        target = others[0] if others else None

        swap = SwapRequest(
            id=new_id("sw"),
            org_id=ORG_ID,
            requester_id=u.id,
            requester_shift_id=my_shift.id,
            responder_shift_id=target.id if target else None,
            responder_id=target.employee_id if target else None,
            target_employee_id=target.employee_id if target else None,
            reason=reason,
            kind="swap",
            ai_match_score=82.5,
            status="pending",
            created_at=datetime.now(timezone.utc) - timedelta(days=1),
        )
        db.add(swap)
    db.commit()
    print(f"  ✓ Created pending swaps")


def create_leaves(db, users):
    """A mix of pending + approved leaves."""
    pending_leaves = [
        ("RN Priya Sharma",     "vacation", 7, 14, "family wedding in Toronto"),
        ("RN David Kim",        "sick",     0, 2, "flu — doctor note attached"),
        ("Dr. Marcus Holloway", "personal", 5, 5, "moving apartments"),
        ("RN Amara Williams",   "vacation", 21, 25, "pre-booked holiday"),
        ("RN Emily Chen",       "sick",     0, 1, "migraine — rest day"),
        ("RN Olivia Reyes",     "personal", 10, 12, "attending a family event"),
    ]
    approved_leaves = [
        ("Dr. Liam Foster",     "vacation",  -7, -3, "CME conference"),
        ("Dr. Sophia Martinez", "personal",  -5, -3, "school event"),
        ("RN Ben Thompson",     "vacation",  -14, -8, "annual leave"),
    ]

    created = 0
    for who, ltype, offset_s, offset_e, reason in pending_leaves + approved_leaves:
        if who not in users:
            continue
        u = users[who]
        sd = datetime.now(timezone.utc) + timedelta(days=offset_s)
        ed = datetime.now(timezone.utc) + timedelta(days=offset_e)
        duration = (ed.date() - sd.date()).days + 1
        is_pending = (offset_s, offset_e, who) in [(p[2], p[3], p[0]) for p in pending_leaves]
        lv = LeaveRequest(
            id=new_id("lv"),
            org_id=ORG_ID,
            employee_id=u.id,
            employee_name=u.name,
            type=ltype,
            start_date=sd,
            end_date=ed,
            duration_days=duration,
            reason=reason,
            status="pending" if is_pending else "approved",
            approved_at=None if is_pending else datetime.now(timezone.utc) - timedelta(days=2),
            approved_by=users["Dr. Aisha Patel"].id if not is_pending else None,
            created_at=datetime.now(timezone.utc) - timedelta(days=3),
        )
        db.add(lv)
        created += 1
    db.commit()
    print(f"  ✓ Created {created} leave requests ({len(pending_leaves)} pending, {len(approved_leaves)} approved)")


def create_notifications(db, users):
    """Realistic notifications for the admin and a couple of staff."""
    n = [
        # Admin
        ("Dr. Aisha Patel",     "shift_unfilled",   "ICU Day Rounds tomorrow still needs 1 nurse",
         "Two nurses called out. The day ICU shift has one open slot."),
        ("Dr. Aisha Patel",     "burnout_alert",    "Priya Sharma trending toward burnout",
         "She worked 58 hours last week and her score climbed to 78."),
        ("Dr. Aisha Patel",     "swap_request",     "Marcus Holloway requested a shift swap",
         "Personal appointment — looking for a Sunday cover."),
        # RN
        ("RN Priya Sharma",     "swap_matched",     "Your shift swap has a match",
         "Carlos Mendez is willing to take your Tuesday night."),
        ("RN Priya Sharma",     "schedule_published","Next week's schedule is live",
         "Take a look — your Tuesday was swapped successfully."),
        ("Dr. Marcus Holloway", "shift_reminder",   "Shift tomorrow at 7am",
         "Emergency Day Shift — remember to check the patient handoff sheet."),
    ]
    for who, ntype, title, body in n:
        if who not in users:
            continue
        u = users[who]
        notif = Notification(
            id=new_id("n"),
            org_id=ORG_ID,
            user_id=u.id,
            type=ntype,
            title=title,
            body=body,
            status="unread",
            created_at=datetime.now(timezone.utc) - timedelta(hours=2),
        )
        db.add(notif)
    db.commit()
    print(f"  ✓ Created {len(n)} notifications")


def main():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if already_exists(db):
            print(f"Demo org {ORG_ID} already exists. Skipping seed.")
            print("To re-seed, delete the org first (it cascades to all related rows).")
            return

        print(f"Seeding demo org: Riverside General Hospital ({ORG_ID})")
        create_org(db)
        create_departments(db)
        users = create_users(db)
        shifts = create_shifts(db, users)
        create_swaps(db, users, shifts)
        create_leaves(db, users)
        create_notifications(db, users)

        print()
        print("=" * 60)
        print("✅ Demo org ready!")
        print("=" * 60)
        admin_password = None
        employee_password = None
        for u in users.values():
            if u.email == ADMIN_EMAIL:
                admin_password = "Demo1234!"
            elif u.email == EMP_EMAIL:
                employee_password = "Demo1234!"
        print(f"  Admin   login: {ADMIN_EMAIL} / {admin_password or 'see output above'}")
        print(f"  Employee login: {EMP_EMAIL} / {employee_password or 'see output above'}")
        print()
        print(f"  • {len(DEPARTMENTS)} departments")
        print(f"  • {len(EMPLOYEES)} employees")
        print(f"  • {len(shifts)} shifts across 17 days (past 3 days + next 14 days)")
        print(f"  • 2 pending pickup requests + 2 pending true swaps")
        print(f"  • 6 pending + 3 approved leave requests")
        print(f"  • 6 notifications")
        print()
        print("Visit http://localhost:5173 and use the demo buttons on /login.")
    finally:
        db.close()


if __name__ == "__main__":
    main()