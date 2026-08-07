# backend/app/api/collective_intelligence_routes.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..utils.dependencies import get_current_user
from ..services.collective_intelligence import CollectiveIntelligence

router = APIRouter(prefix="/collectives/intelligence", tags=["Collective Intelligence"])

intel = CollectiveIntelligence()


@router.get("/groups/{group_id}/optimize-schedule")
def optimize_schedule(
    group_id: int,
    weeks: int = 4,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate fair rotation schedule.
    Algorithm: Weighted round-robin
    """
    try:
        result = intel.optimize_schedule(db, group_id, weeks)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/groups/{group_id}/health")
def analyze_health(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Statistical health analysis.
    Method: Descriptive statistics + trend detection
    """
    try:
        result = intel.analyze_group_health(db, group_id)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/groups/{group_id}/users/{user_id}/predict")
def predict_engagement(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Predict next share's engagement.
    Method: Exponential smoothing (proven time-series forecasting)
    """
    try:
        result = intel.predict_engagement(db, group_id, user_id)
        return result
    except Exception as e:
        raise HTTPException(500, str(e))
