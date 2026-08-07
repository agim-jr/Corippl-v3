# backend/app/api/search.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.content import Content
from ..models.user import User
from ..models.schemas import ContentResponse
from ..utils.dependencies import get_current_user
from sqlalchemy import or_, func
from datetime import date
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)

@router.get("/", response_model=List[ContentResponse])
def search_content(
    query: str = Query(..., min_length=1, max_length=100, description="Search query"),
    content_type: Optional[List[str]] = Query(None, description="Filter by content types"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories"),
    date_from: Optional[date] = Query(None, description="Filter content created from this date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter content created up to this date (YYYY-MM-DD)"),
    min_views: Optional[int] = Query(None, ge=0, description="Filter content with at least this many views"),
    sort_by: Optional[str] = Query("relevance", description="Sort results by 'relevance', 'date', or 'views'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Comprehensive search functionality for premium users.
    """
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only premium users can perform advanced searches."
        )

    logger.info(f"Search params - User: {current_user.id}, Query: '{query}', Categories: {categories}, Content Type: {content_type}")

    # Base query
    base_query = db.query(Content).filter(
        Content.user_id != current_user.id,
        Content.status == "active"
    )

    # DEBUG: Count before filters
    count_before = base_query.count()
    logger.info(f"Content from other users (active): {count_before}")

    # Text search
    base_query = base_query.filter(
        or_(
            Content.title.ilike(f"%{query}%"),
            Content.description.ilike(f"%{query}%")
        )
    )

    # DEBUG: Count after text search
    count_after_text = base_query.count()
    logger.info(f"After text search '{query}': {count_after_text}")

    # Content type filter
    if content_type:
        logger.info(f"Applying content_type filter: {content_type}")
        base_query = base_query.filter(Content.content_type.in_(content_type))

        count_after_type = base_query.count()
        logger.info(f"After content_type filter: {count_after_type}")

    # Date filters
    if date_from:
        base_query = base_query.filter(Content.created_at >= date_from)
    if date_to:
        base_query = base_query.filter(Content.created_at <= date_to)

    # Min views filter
    if min_views is not None:
        base_query = base_query.filter(Content.view_count >= min_views)

    # Sorting
    if sort_by == "date":
        base_query = base_query.order_by(Content.created_at.desc())
    elif sort_by == "views":
        base_query = base_query.order_by(Content.view_count.desc())
    else:
        base_query = base_query.order_by(Content.share_count.desc())

    # Get results BEFORE category filter (we'll filter in Python)
    results = base_query.all()

    logger.info(f"Results before category filter: {len(results)}")

    # Case-insensitive category filtering in Python
    if categories:
        lower_categories = [cat.lower() for cat in categories]
        logger.info(f"Filtering by categories (case-insensitive): {categories}")
        logger.info(f"Lowercase search categories: {lower_categories}")

        filtered_results = []
        for r in results:
            if r.categories:
                content_cats_lower = [c.lower() for c in r.categories]
                logger.debug(f"Content {r.id} '{r.title}' - DB categories: {r.categories}, lowercase: {content_cats_lower}")

                # Check if any search category matches any content category
                if any(search_cat in content_cats_lower for search_cat in lower_categories):
                    filtered_results.append(r)
                    logger.debug(f"  ✓ Match found for content {r.id}")
                else:
                    logger.debug(f"  ✗ No match for content {r.id}")

        results = filtered_results
        logger.info(f"After case-insensitive category filter: {len(results)}")

    logger.info(f"FINAL SEARCH RESULTS: {len(results)} items")
    return results
