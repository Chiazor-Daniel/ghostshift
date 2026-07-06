from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from config.database import get_db
from config.logging import get_logger
from middleware.auth import get_current_user
from models.user import User
from .models import (
    patient_resource,
    observation_resource,
    bundle_resource,
    bundle_entry,
    OBSERVATION_CODES,
    _resource_id,
)
from .seed import get_health_records

logger = get_logger(__name__)
router = APIRouter(prefix="/api/fhir", tags=["FHIR"])


@router.get("/Patient/{patient_id}")
def read_patient(patient_id: str, db: Session = Depends(get_db)):
    pk = patient_id.replace("patient-", "")
    if not pk.isdigit():
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    user = db.query(User).filter(User.id == int(pk)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient_resource(user)


@router.get("/Observation/{observation_id}")
def read_observation(observation_id: str):
    parts = observation_id.replace("observation-", "").split("-", 1)
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid observation ID")
    user_id, metric = int(parts[0]), parts[1]
    records = get_health_records(user_id)
    matching = [r for r in records if r["type"] == metric]
    if not matching:
        raise HTTPException(status_code=404, detail="Observation not found")
    latest = matching[0]
    code = OBSERVATION_CODES.get(metric, {
        "system": "http://loinc.org",
        "code": "unknown",
        "display": metric,
    })
    obs_id = int(f"{user_id}{hash(metric) % 1000}")
    return observation_resource(user_id, obs_id, code, latest["value"], latest["unit"],
                                effective=latest["effective"])


@router.get("/Patient/{patient_id}/$everything")
def patient_everything(patient_id: str, db: Session = Depends(get_db)):
    pk = patient_id.replace("patient-", "")
    if not pk.isdigit():
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    user = db.query(User).filter(User.id == int(pk)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient = patient_resource(user)
    entries = [bundle_entry(f"urn:uuid:{patient['id']}", patient)]

    records = get_health_records(user.id)
    seen = set()
    obs_id_counter = 1
    for r in records:
        if r["type"] in seen:
            continue
        seen.add(r["type"])
        code = OBSERVATION_CODES.get(r["type"], {
            "system": "http://loinc.org",
            "code": "unknown",
            "display": r["type"],
        })
        obs = observation_resource(user.id, obs_id_counter, code, r["value"], r["unit"],
                                   effective=r["effective"])
        entries.append(bundle_entry(f"urn:uuid:{obs['id']}", obs))
        obs_id_counter += 1

    return bundle_resource(entries, bundle_type="searchset")


@router.get("/metrics")
def list_metrics():
    return {
        "metrics": list(OBSERVATION_CODES.keys()),
        "codes": OBSERVATION_CODES,
    }


@router.get("/Patient/{patient_id}/observations")
def patient_observations(patient_id: str, metric: str | None = None,
                         db: Session = Depends(get_db)):
    pk = patient_id.replace("patient-", "")
    if not pk.isdigit():
        raise HTTPException(status_code=400, detail="Invalid patient ID")
    user = db.query(User).filter(User.id == int(pk)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Patient not found")

    records = get_health_records(user.id)
    if metric:
        records = [r for r in records if r["type"] == metric]

    obs_id_counter = 1
    entries = []
    for r in records:
        code = OBSERVATION_CODES.get(r["type"], {
            "system": "http://loinc.org",
            "code": "unknown",
            "display": r["type"],
        })
        obs = observation_resource(user.id, obs_id_counter, code, r["value"], r["unit"],
                                   effective=r["effective"])
        entries.append(bundle_entry(f"urn:uuid:{obs['id']}", obs))
        obs_id_counter += 1

    return bundle_resource(entries, bundle_type="searchset")
