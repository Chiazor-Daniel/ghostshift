import random
from datetime import datetime, timedelta, timezone

_health_data: dict[int, list[dict]] = {}


def _generate_metrics(user_id: int, days: int = 30) -> list[dict]:
    records = []
    now = datetime.now(timezone.utc)
    base_hr = random.randint(65, 80)
    base_steps = random.randint(5000, 12000)

    for i in range(days):
        day = now - timedelta(days=i)
        date_str = day.isoformat()
        records.append({
            "type": "heart_rate",
            "value": base_hr + random.randint(-10, 15),
            "unit": "bpm",
            "effective": date_str,
        })
        records.append({
            "type": "steps",
            "value": base_steps + random.randint(-2000, 3000),
            "unit": "steps",
            "effective": date_str,
        })
        records.append({
            "type": "sleep_hours",
            "value": round(random.uniform(5.5, 8.5), 1),
            "unit": "hours",
            "effective": date_str,
        })
        records.append({
            "type": "stress_level",
            "value": random.randint(1, 10),
            "unit": "{score}",
            "effective": date_str,
        })
        records.append({
            "type": "blood_pressure_systolic",
            "value": random.randint(110, 140),
            "unit": "mm[Hg]",
            "effective": date_str,
        })
        records.append({
            "type": "blood_pressure_diastolic",
            "value": random.randint(60, 90),
            "unit": "mm[Hg]",
            "effective": date_str,
        })
        records.append({
            "type": "oxygen_saturation",
            "value": round(random.uniform(95.0, 100.0), 1),
            "unit": "%",
            "effective": date_str,
        })

    return records


def get_health_records(user_id: int) -> list[dict]:
    if user_id not in _health_data:
        _health_data[user_id] = _generate_metrics(user_id)
    return _health_data[user_id]


def get_recent_records(user_id: int, metric: str, limit: int = 50) -> list[dict]:
    records = get_health_records(user_id)
    return [r for r in records if r["type"] == metric][:limit]


def seed_all(employee_ids: list[int]) -> None:
    for eid in employee_ids:
        get_health_records(eid)
