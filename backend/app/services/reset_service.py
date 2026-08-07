from backend.app.models.user import User
from backend.app.database import SessionLocal
from datetime import date

def reset_all_shuffles():
    db = SessionLocal()
    users = db.query(User).all()
    for user in users:
        if user.tier == 'non-premium':
            user.remaining_shuffles = 5  # Set to daily limit
            user.last_shuffle_reset = date.today()
    db.commit()
    db.close()
