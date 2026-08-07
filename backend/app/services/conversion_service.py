# backend/app/services/conversion_service.py

from typing import List, Optional, Dict
from sqlalchemy.orm import Session

from app.models.conversion import Conversion
from app.models.schemas import ConversionCreate
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class ConversionService:
    def __init__(self, db: Session):
        self.db = db

    def record_conversion(self, conversion_data: ConversionCreate) -> Conversion:
        try:
            conversion = Conversion(
                user_id=conversion_data.user_id,
                content_id=conversion_data.content_id,
                conversion_type=conversion_data.conversion_type,
                details=conversion_data.details,
            )
            self.db.add(conversion)
            self.db.commit()
            self.db.refresh(conversion)
            return conversion
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error recording conversion: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to record conversion"
            )

    def get_conversions_by_user(self, user_id: int) -> List[Conversion]:
        return self.db.query(Conversion).filter(Conversion.user_id == user_id).all()

    def get_conversions_by_content(self, content_id: int) -> List[Conversion]:
        return self.db.query(Conversion).filter(Conversion.content_id == content_id).all()

    def get_all_conversions(self) -> List[Conversion]:
        return self.db.query(Conversion).all()

    def get_conversion_metrics(self, content_ids: List[int]) -> Dict[int, Dict[str, int]]:
        results = {}
        for content_id in content_ids:
            conversions = self.db.query(Conversion).filter(Conversion.content_id == content_id).all()
            metrics = {}
            for conv in conversions:
                metrics[conv.conversion_type] = metrics.get(conv.conversion_type, 0) + 1
            results[content_id] = metrics
        return results
