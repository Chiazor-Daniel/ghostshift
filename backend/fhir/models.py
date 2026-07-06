from datetime import datetime, timezone
from typing import Optional, Any


def _utc_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _resource_id(prefix: str, pk: int | str) -> str:
    return f"{prefix}-{pk}"


def _reference(prefix: str, pk: int | str) -> dict:
    return {"reference": f"{prefix.capitalize()}/{_resource_id(prefix, pk)}"}


def patient_resource(user) -> dict:
    name_parts = (user.full_name or "").split(maxsplit=1)
    resource = {
        "resourceType": "Patient",
        "id": _resource_id("patient", user.id),
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Patient"],
            "lastUpdated": _utc_iso(),
        },
        "identifier": [
            {
                "system": "https://ghostshift.app/employees",
                "value": str(user.id),
            }
        ],
        "name": [
            {
                "use": "official",
                "family": name_parts[1] if len(name_parts) > 1 else "",
                "given": [name_parts[0]] if name_parts else ["Unknown"],
            }
        ],
        "telecom": [
            {"system": "email", "value": user.email, "use": "work"}
        ],
        "gender": getattr(user, "gender", "unknown") or "unknown",
        "birthDate": str(getattr(user, "date_of_birth", "")) if getattr(user, "date_of_birth", None) else None,
        "active": user.is_active if hasattr(user, "is_active") else True,
    }
    return {k: v for k, v in resource.items() if v is not None}


def observation_resource(user_id: int, obs_id: int, code: dict, value: Any, unit: str,
                         effective: Optional[str] = None, category: str = "vital-signs",
                         status: str = "final") -> dict:
    resource = {
        "resourceType": "Observation",
        "id": _resource_id("observation", obs_id),
        "meta": {
            "profile": ["http://hl7.org/fhir/StructureDefinition/Observation"],
            "lastUpdated": _utc_iso(),
        },
        "status": status,
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": category,
                        "display": category.replace("-", " ").title(),
                    }
                ]
            }
        ],
        "code": {
            "coding": [code],
            "text": code.get("display", ""),
        },
        "subject": _reference("patient", user_id),
        "effectiveDateTime": effective or _utc_iso(),
        "issued": _utc_iso(),
        "performer": [_reference("practitioner", 1)],
        "valueQuantity": {
            "value": value,
            "unit": unit,
            "system": "http://unitsofmeasure.org",
            "code": unit,
        },
    }
    return resource


def bundle_entry(full_url: str, resource: dict) -> dict:
    return {
        "fullUrl": full_url,
        "resource": resource,
    }


def bundle_resource(entries: list[dict], bundle_type: str = "collection") -> dict:
    return {
        "resourceType": "Bundle",
        "id": f"bundle-{bundle_type}-{int(datetime.now(timezone.utc).timestamp())}",
        "meta": {"lastUpdated": _utc_iso()},
        "type": bundle_type,
        "total": len(entries),
        "entry": entries,
    }


OBSERVATION_CODES = {
    "heart_rate": {
        "system": "http://loinc.org",
        "code": "8867-4",
        "display": "Heart rate",
    },
    "blood_pressure_systolic": {
        "system": "http://loinc.org",
        "code": "8480-6",
        "display": "Systolic blood pressure",
    },
    "blood_pressure_diastolic": {
        "system": "http://loinc.org",
        "code": "8462-4",
        "display": "Diastolic blood pressure",
    },
    "steps": {
        "system": "http://loinc.org",
        "code": "41950-7",
        "display": "Number of steps in 24 hour",
    },
    "sleep_hours": {
        "system": "http://loinc.org",
        "code": "93832-3",
        "display": "Sleep duration",
    },
    "stress_level": {
        "system": "http://loinc.org",
        "code": "95715-5",
        "display": "Stress level",
    },
    "temperature": {
        "system": "http://loinc.org",
        "code": "8310-5",
        "display": "Body temperature",
    },
    "oxygen_saturation": {
        "system": "http://loinc.org",
        "code": "59408-5",
        "display": "Oxygen saturation in Arterial blood",
    },
    "respiratory_rate": {
        "system": "http://loinc.org",
        "code": "9279-1",
        "display": "Respiratory rate",
    },
}
