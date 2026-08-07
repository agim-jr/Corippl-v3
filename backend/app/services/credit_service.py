# backend/app/services/credit_service.py

import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional
from ..models.user import User
from ..models.pool import CreditTransaction
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

# Credit rules configuration
CREDIT_RULES = {
    "REVIEW_SUBMITTED": 5.0,
    "CLICK_DRIVEN": 0.5,
    "QUALITY_REVIEW_BONUS": 2.0,
    "SUBMIT_CONTENT": -20.0,
    "BOOST_CONTENT": -10.0,
    "FAST_TRACK": -30.0,
}


class CreditService:
    """Service for managing user credits in the Pool system"""

    def __init__(self, db: Session):
        self.db = db

    def get_user_balance(self, user_id: int) -> float:
        """Get current credit balance for a user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return float(user.pool_credits or 0)

    def add_credits(
        self,
        user_id: int,
        amount: float,
        transaction_type: str,
        description: str,
        related_content_id: Optional[int] = None,
        related_review_id: Optional[int] = None
    ) -> CreditTransaction:
        """
        Add credits to a user's account

        Args:
            user_id: ID of the user
            amount: Amount of credits to add (positive number)
            transaction_type: Type of transaction (review/click_earned/etc)
            description: Human-readable description
            related_content_id: Optional related content ID
            related_review_id: Optional related review ID

        Returns:
            CreditTransaction object
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            # Initialize pool_credits if None
            if user.pool_credits is None:
                user.pool_credits = 0.0

            # Calculate new balance
            new_balance = float(user.pool_credits) + float(amount)

            # Create transaction record
            transaction = CreditTransaction(
                user_id=user_id,
                amount=float(amount),
                type=transaction_type,
                description=description,
                related_content_id=related_content_id,
                related_review_id=related_review_id,
                balance_after=new_balance
            )

            # Update user balance
            user.pool_credits = new_balance

            self.db.add(transaction)
            self.db.commit()
            self.db.refresh(transaction)

            logger.info(
                f"Added {amount} credits to user {user_id}. "
                f"New balance: {new_balance}. Type: {transaction_type}"
            )

            return transaction

        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error adding credits: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add credits"
            )

    def deduct_credits(
        self,
        user_id: int,
        amount: float,
        transaction_type: str,
        description: str,
        related_content_id: Optional[int] = None
    ) -> CreditTransaction:
        """
        Deduct credits from a user's account

        Args:
            user_id: ID of the user
            amount: Amount of credits to deduct (positive number)
            transaction_type: Type of transaction (submit/boost/etc)
            description: Human-readable description
            related_content_id: Optional related content ID

        Returns:
            CreditTransaction object

        Raises:
            HTTPException: If insufficient credits
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )

            # Initialize pool_credits if None
            if user.pool_credits is None:
                user.pool_credits = 0.0

            current_balance = float(user.pool_credits)

            # Check if user has enough credits
            if current_balance < amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient credits. Required: {amount}, Available: {current_balance}"
                )

            # Calculate new balance
            new_balance = current_balance - float(amount)

            # Create transaction record (negative amount)
            transaction = CreditTransaction(
                user_id=user_id,
                amount=-float(amount),
                type=transaction_type,
                description=description,
                related_content_id=related_content_id,
                balance_after=new_balance
            )

            # Update user balance
            user.pool_credits = new_balance

            self.db.add(transaction)
            self.db.commit()
            self.db.refresh(transaction)

            logger.info(
                f"Deducted {amount} credits from user {user_id}. "
                f"New balance: {new_balance}. Type: {transaction_type}"
            )

            return transaction

        except HTTPException:
            raise
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Database error deducting credits: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deduct credits"
            )

    def get_transaction_history(
        self,
        user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> list:
        """Get credit transaction history for a user"""
        try:
            transactions = self.db.query(CreditTransaction).filter(
                CreditTransaction.user_id == user_id
            ).order_by(
                CreditTransaction.created_at.desc()
            ).limit(limit).offset(offset).all()

            return transactions

        except SQLAlchemyError as e:
            logger.error(f"Error fetching transaction history: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch transaction history"
            )

    def award_review_credits(self, user_id: int, review_id: int) -> CreditTransaction:
        """Award credits for submitting a review"""
        return self.add_credits(
            user_id=user_id,
            amount=CREDIT_RULES["REVIEW_SUBMITTED"],
            transaction_type="review",
            description="Reviewed Pool content",
            related_review_id=review_id
        )

    def award_click_credits(self, user_id: int, claim_id: int) -> CreditTransaction:
        """Award credits for a click on claimed content"""
        return self.add_credits(
            user_id=user_id,
            amount=CREDIT_RULES["CLICK_DRIVEN"],
            transaction_type="click_earned",
            description="Earned from content click",
            related_content_id=claim_id
        )

    def charge_submit_fee(self, user_id: int, content_id: int) -> CreditTransaction:
        """Charge fee for submitting content to Pool"""
        return self.deduct_credits(
            user_id=user_id,
            amount=abs(CREDIT_RULES["SUBMIT_CONTENT"]),
            transaction_type="submit",
            description="Submitted content to Pool",
            related_content_id=content_id
        )
