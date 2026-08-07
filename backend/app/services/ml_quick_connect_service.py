# backend/app/services/ml_quick_connect_service.py

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
import re

from app.models import (
    User, QuickConnectRequest, QuickConnectHelp,
    QuickConnectToken, Notification  # ✅ FIXED: QuickConnectToken (singular)
)

class MLQuickConnectService:
    """Pure Math + ML based Quick Connect matching (No external APIs)"""

    def __init__(self):
        self.category_weights = {
            'technical': ['code', 'programming', 'bug', 'api', 'database', 'server', 'debug'],
            'career': ['job', 'resume', 'interview', 'career', 'professional', 'work'],
            'creative': ['design', 'art', 'creative', 'writing', 'content', 'video'],
            'academic': ['study', 'research', 'paper', 'academic', 'thesis', 'homework'],
            'general': ['help', 'advice', 'guidance', 'support', 'question']
        }

    # ==================== PRIORITY 1: SMART MATCHING ====================

    def suggest_helpers(
        self,
        request_id: int,
        db: Session,
        max_suggestions: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Pure ML matching based on:
        - TF-IDF text similarity
        - Category experience
        - Success rate calculations
        - Reputation scoring
        - Response time analysis
        """
        request = db.query(QuickConnectRequest).filter(
            QuickConnectRequest.id == request_id
        ).first()

        if not request:
            raise ValueError("Request not found")

        # Get all potential helpers
        helpers_data = self._get_helper_profiles(db, exclude_user_id=request.requester_id)

        if not helpers_data:
            return []

        # Calculate match scores
        scored_helpers = []
        for helper_data in helpers_data:
            score_breakdown = self._calculate_match_score(request, helper_data, db)

            if score_breakdown['total_score'] > 0:  # Only include viable matches
                scored_helpers.append({
                    'helper_data': helper_data,
                    'score_breakdown': score_breakdown
                })

        # Sort by total score
        scored_helpers.sort(key=lambda x: x['score_breakdown']['total_score'], reverse=True)

        # Format results
        suggestions = []
        for item in scored_helpers[:max_suggestions]:
            helper_data = item['helper_data']
            score_breakdown = item['score_breakdown']

            helper = db.query(User).filter(User.id == helper_data['id']).first()

            suggestions.append({
                'helper': {
                    'id': helper.id,
                    'username': helper.username,
                    'profile_picture': helper.profile_picture
                },
                'match_score': int(score_breakdown['total_score']),
                'reasoning': self._generate_reasoning(score_breakdown, helper_data),
                'estimated_response_time': self._estimate_response_time(helper_data),
                'relevant_experience': self._get_relevant_experience(helper_data, request.category),
                'score_breakdown': score_breakdown  # For debugging
            })

        return suggestions

    def _calculate_match_score(
        self,
        request: QuickConnectRequest,
        helper_data: Dict,
        db: Session
    ) -> Dict[str, float]:
        """
        Calculate comprehensive match score with breakdown

        Scoring Formula:
        - Text Similarity (30%): TF-IDF cosine similarity
        - Category Match (25%): Experience in category
        - Success Rate (20%): Past performance
        - Reputation (15%): Overall reputation score
        - Response Factor (10%): Speed of response
        """

        # 1. TEXT SIMILARITY (30 points)
        text_sim_score = self._calculate_text_similarity(request, helper_data) * 30

        # 2. CATEGORY MATCH (25 points)
        category_score = self._calculate_category_score(request, helper_data) * 25

        # 3. SUCCESS RATE (20 points)
        success_score = self._calculate_success_rate(helper_data, request.category) * 20

        # 4. REPUTATION (15 points)
        reputation_score = self._calculate_reputation_score(helper_data) * 15

        # 5. RESPONSE FACTOR (10 points)
        response_score = self._calculate_response_score(helper_data, db) * 10

        total = text_sim_score + category_score + success_score + reputation_score + response_score

        return {
            'text_similarity': round(text_sim_score, 2),
            'category_match': round(category_score, 2),
            'success_rate': round(success_score, 2),
            'reputation': round(reputation_score, 2),
            'response_speed': round(response_score, 2),
            'total_score': round(total, 2)
        }

    def _calculate_text_similarity(self, request: QuickConnectRequest, helper_data: Dict) -> float:
        """TF-IDF based text similarity"""
        # Build request text
        request_text = f"{request.title} {request.description}"
        if request.tags:
            request_text += " " + " ".join(request.tags)

        # Build helper text
        helper_skills = " ".join(helper_data.get('skills', []))
        helper_interests = " ".join(helper_data.get('interests', []))
        helper_text = f"{helper_skills} {helper_interests}"

        # Add category keywords
        category_keywords = " ".join(self.category_weights.get(request.category, []))
        request_text += " " + category_keywords

        if not helper_text.strip():
            return 0.3  # Base score if no helper info

        try:
            # TF-IDF vectorization
            vectorizer = TfidfVectorizer(stop_words='english', max_features=100)
            vectors = vectorizer.fit_transform([request_text, helper_text])

            # Cosine similarity
            similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]

            return float(similarity)
        except:
            return 0.3

    def _calculate_category_score(self, request: QuickConnectRequest, helper_data: Dict) -> float:
        """Score based on category experience"""
        recent_categories = helper_data.get('recent_categories', {})

        if request.category in recent_categories:
            category_data = recent_categories[request.category]
            count = category_data.get('count', 0)
            avg_rating = category_data.get('avg_rating', 0)

            # More experience = higher score (diminishing returns)
            experience_factor = min(count / 5.0, 1.0)  # Caps at 5 helps
            rating_factor = avg_rating / 5.0  # Normalize to 0-1

            return (experience_factor * 0.6 + rating_factor * 0.4)
        else:
            # Check if helper has related skills
            category_keywords = self.category_weights.get(request.category, [])
            helper_skills = helper_data.get('skills', [])
            helper_interests = helper_data.get('interests', [])

            all_helper_terms = " ".join(helper_skills + helper_interests).lower()

            matches = sum(1 for keyword in category_keywords if keyword in all_helper_terms)

            if matches > 0:
                return min(matches / len(category_keywords), 0.5)  # Max 0.5 for indirect match

            return 0.2  # Small base score

    def _calculate_success_rate(self, helper_data: Dict, category: str) -> float:
        """Calculate success rate in similar requests"""
        help_given = helper_data.get('help_given_count', 0)
        avg_rating = helper_data.get('average_rating', 0)

        if help_given == 0:
            return 0.3  # New helpers get base score

        # Success rate based on ratings
        success_rate = avg_rating / 5.0

        # Boost for category-specific experience
        recent_categories = helper_data.get('recent_categories', {})
        if category in recent_categories:
            category_rating = recent_categories[category].get('avg_rating', 0) / 5.0
            success_rate = (success_rate * 0.4 + category_rating * 0.6)

        # Experience bonus (more helps = more reliable)
        experience_bonus = min(help_given / 20.0, 0.2)  # Up to 0.2 bonus

        return min(success_rate + experience_bonus, 1.0)

    def _calculate_reputation_score(self, helper_data: Dict) -> float:
        """Normalize reputation score"""
        reputation = helper_data.get('reputation_score', 0)

        # Reputation typically ranges 0-200, normalize to 0-1
        return min(reputation / 150.0, 1.0)

    def _calculate_response_score(self, helper_data: Dict, db: Session) -> float:
        """Estimate response speed score"""
        helper_id = helper_data['id']

        # Get recent help responses
        recent_helps = db.query(QuickConnectHelp).filter(
            QuickConnectHelp.helper_id == helper_id,
            QuickConnectHelp.accepted_at.isnot(None)
        ).order_by(desc(QuickConnectHelp.created_at)).limit(10).all()

        if not recent_helps:
            return 0.5  # Neutral score for new helpers

        # Calculate average response time
        response_times = []
        for help_record in recent_helps:
            if help_record.request.created_at and help_record.accepted_at:
                delta = help_record.accepted_at - help_record.request.created_at
                hours = delta.total_seconds() / 3600
                response_times.append(hours)

        if not response_times:
            return 0.5

        avg_response_hours = np.mean(response_times)

        # Score: faster = better (exponential decay)
        # < 1 hour = 1.0, 24 hours = 0.5, > 48 hours = 0.2
        score = 1.0 / (1.0 + avg_response_hours / 12.0)

        return max(score, 0.2)

    def _get_helper_profiles(self, db: Session, exclude_user_id: int) -> List[Dict]:
        """Get helper profiles with statistics"""
        # ✅ FIXED: Use QuickConnectToken (singular)
        helpers = db.query(
            User.id,
            User.username,
            User.interests,
            User.skills,
            QuickConnectToken.reputation_score,
            QuickConnectToken.help_given_count,
            QuickConnectToken.average_rating,
            func.count(QuickConnectHelp.id).label('total_helps')
        ).join(
            QuickConnectToken, User.id == QuickConnectToken.user_id
        ).outerjoin(
            QuickConnectHelp,
            and_(
                User.id == QuickConnectHelp.helper_id,
                QuickConnectHelp.status == 'completed'
            )
        ).filter(
            User.id != exclude_user_id,
            User.is_active == True
        ).group_by(
            User.id,
            User.username,
            User.interests,
            User.skills,
            QuickConnectToken.reputation_score,
            QuickConnectToken.help_given_count,
            QuickConnectToken.average_rating
        ).all()

        helpers_data = []
        for helper in helpers:
            # Get recent help history by category
            recent_helps = db.query(QuickConnectHelp).join(
                QuickConnectRequest
            ).filter(
                QuickConnectHelp.helper_id == helper.id,
                QuickConnectHelp.status == 'completed',
                QuickConnectHelp.rating.isnot(None)
            ).order_by(desc(QuickConnectHelp.created_at)).limit(10).all()

            recent_categories = {}
            for help_record in recent_helps:
                category = help_record.request.category
                if category not in recent_categories:
                    recent_categories[category] = {
                        'count': 0,
                        'ratings': []
                    }
                recent_categories[category]['count'] += 1
                recent_categories[category]['ratings'].append(help_record.rating)

            # Calculate averages
            for category in recent_categories:
                ratings = recent_categories[category]['ratings']
                recent_categories[category]['avg_rating'] = sum(ratings) / len(ratings)
                del recent_categories[category]['ratings']

            helpers_data.append({
                'id': helper.id,
                'username': helper.username,
                'interests': helper.interests or [],
                'skills': helper.skills or [],
                'reputation_score': float(helper.reputation_score or 0),
                'help_given_count': helper.help_given_count or 0,
                'average_rating': float(helper.average_rating or 0),
                'recent_categories': recent_categories
            })

        return helpers_data

    def _generate_reasoning(self, score_breakdown: Dict, helper_data: Dict) -> str:
        """Generate human-readable reasoning from scores"""
        reasons = []

        # Text similarity
        if score_breakdown['text_similarity'] > 20:
            reasons.append("Strong skill/interest match with your request")
        elif score_breakdown['text_similarity'] > 10:
            reasons.append("Good skill alignment")

        # Category experience
        if score_breakdown['category_match'] > 15:
            reasons.append("Extensive experience in this category")
        elif score_breakdown['category_match'] > 10:
            reasons.append("Has relevant experience")

        # Success rate
        avg_rating = helper_data.get('average_rating', 0)
        if avg_rating >= 4.5:
            reasons.append(f"Excellent track record ({avg_rating:.1f}★ average)")
        elif avg_rating >= 4.0:
            reasons.append(f"Highly rated helper ({avg_rating:.1f}★)")

        # Reputation
        reputation = helper_data.get('reputation_score', 0)
        if reputation > 100:
            reasons.append("Top-rated community helper")
        elif reputation > 50:
            reasons.append("Established reputation")

        # Response speed
        if score_breakdown['response_speed'] > 7:
            reasons.append("Typically responds quickly")

        if not reasons:
            reasons.append("Active helper ready to assist")

        return ". ".join(reasons)

    def _estimate_response_time(self, helper_data: Dict) -> str:
        """Estimate response time based on helper activity"""
        help_count = helper_data.get('help_given_count', 0)

        if help_count > 20:
            return "15-30 minutes"
        elif help_count > 10:
            return "30-60 minutes"
        elif help_count > 5:
            return "1-2 hours"
        else:
            return "2-4 hours"

    def _get_relevant_experience(self, helper_data: Dict, category: str) -> str:
        """Get relevant experience description"""
        recent_categories = helper_data.get('recent_categories', {})

        if category in recent_categories:
            count = recent_categories[category]['count']
            avg_rating = recent_categories[category]['avg_rating']
            return f"{count} successful help sessions in {category} ({avg_rating:.1f}★ avg)"

        total_helps = helper_data.get('help_given_count', 0)
        if total_helps > 0:
            return f"{total_helps} total help sessions across various categories"

        return "Eager to help and build experience"

    # ==================== PRIORITY 2: AUTO-GENERATE REQUEST ====================

    def enhance_request(
        self,
        title: str,
        description: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        ML-based request enhancement using rules and patterns
        """
        enhanced_title = self._enhance_title(title)
        enhanced_description = self._enhance_description(title, description)
        suggested_category = self._suggest_category(title, description, category)
        suggested_tags = self._extract_tags(title, description, suggested_category)
        suggested_urgency = self._suggest_urgency(title, description)
        suggested_reward = self._suggest_reward(title, description, suggested_category, suggested_urgency)

        return {
            'enhanced_title': enhanced_title,
            'enhanced_description': enhanced_description,
            'suggested_category': suggested_category,
            'suggested_tags': suggested_tags,
            'suggested_urgency': suggested_urgency,
            'suggested_reward': suggested_reward,
            'improvement_notes': self._generate_improvement_notes(title, enhanced_title, description, enhanced_description)
        }

    def _enhance_title(self, title: str) -> str:
        """Clean and enhance title"""
        # Remove excessive punctuation
        title = re.sub(r'[!?]{2,}', '!', title)

        # Capitalize properly
        title = title.strip().capitalize()

        # Ensure it's not too long
        if len(title) > 100:
            title = title[:97] + "..."

        # Add context if too vague
        vague_words = ['help', 'need', 'want', 'looking', 'question']
        if len(title.split()) <= 3 and any(word in title.lower() for word in vague_words):
            if not title.endswith('?'):
                title = "Help needed: " + title

        return title

    def _enhance_description(self, title: str, description: Optional[str]) -> str:
        """Enhance and expand description"""
        if not description or len(description.strip()) < 20:
            # Generate basic template
            return f"I need help with: {title}\n\nPlease provide guidance or assistance with this matter. Any help would be appreciated!"

        # Clean up description
        desc = description.strip()

        # Add structure if missing
        if '\n' not in desc and len(desc) > 100:
            # Try to split into paragraphs at sentence boundaries
            sentences = desc.split('. ')
            if len(sentences) > 2:
                desc = '. '.join(sentences[:len(sentences)//2]) + '.\n\n' + '. '.join(sentences[len(sentences)//2:])

        return desc

    def _suggest_category(self, title: str, description: Optional[str], provided_category: Optional[str]) -> str:
        """ML-based category suggestion"""
        if provided_category and provided_category in self.category_weights:
            return provided_category

        text = f"{title} {description or ''}".lower()

        # Score each category
        category_scores = {}
        for category, keywords in self.category_weights.items():
            score = sum(1 for keyword in keywords if keyword in text)
            category_scores[category] = score

        # Get best match
        best_category = max(category_scores.items(), key=lambda x: x[1])

        if best_category[1] > 0:
            return best_category[0]

        return 'general'

    def _extract_tags(self, title: str, description: Optional[str], category: str) -> List[str]:
        """Extract relevant tags from text"""
        text = f"{title} {description or ''}".lower()

        # Get category keywords
        category_keywords = self.category_weights.get(category, [])

        # Find matching keywords
        tags = [keyword for keyword in category_keywords if keyword in text]

        # Add common technical terms if technical category
        if category == 'technical':
            tech_terms = ['python', 'javascript', 'react', 'api', 'database', 'frontend', 'backend']
            tags.extend([term for term in tech_terms if term in text])

        # Limit to 5 tags
        return list(set(tags))[:5]

    def _suggest_urgency(self, title: str, description: Optional[str]) -> str:
        """Suggest urgency based on keywords"""
        text = f"{title} {description or ''}".lower()

        urgent_keywords = ['urgent', 'asap', 'emergency', 'immediately', 'critical', 'deadline', 'today']
        high_keywords = ['soon', 'quickly', 'fast', 'hurry', 'important']

        if any(keyword in text for keyword in urgent_keywords):
            return 'high'
        elif any(keyword in text for keyword in high_keywords):
            return 'normal'

        return 'low'

    def _suggest_reward(self, title: str, description: Optional[str], category: str, urgency: str) -> int:
        """Calculate suggested token reward"""
        base_rewards = {
            'technical': 60,
            'career': 50,
            'creative': 55,
            'academic': 50,
            'general': 40
        }

        base = base_rewards.get(category, 50)

        # Adjust for urgency
        if urgency == 'high':
            base += 20
        elif urgency == 'normal':
            base += 10

        # Adjust for complexity (length of description)
        if description and len(description) > 200:
            base += 10

        # Cap between 30-100
        return max(30, min(base, 100))

    def _generate_improvement_notes(self, old_title: str, new_title: str, old_desc: Optional[str], new_desc: str) -> str:
        """Generate notes about improvements made"""
        notes = []

        if old_title != new_title:
            notes.append("Improved title clarity")

        if not old_desc or len(old_desc) < 20:
            notes.append("Added structured description template")

        if not notes:
            return "Request looks good! Minor formatting applied."

        return ". ".join(notes)

    # ==================== PRIORITY 3: PROACTIVE NOTIFICATIONS ====================

    def notify_relevant_helpers(
        self,
        request_id: int,
        db: Session,
        max_notifications: int = 3
    ) -> int:
        """Send proactive notifications to best-match helpers"""
        suggestions = self.suggest_helpers(request_id, db, max_suggestions=max_notifications)

        request = db.query(QuickConnectRequest).filter(
            QuickConnectRequest.id == request_id
        ).first()

        notifications_sent = 0

        for suggestion in suggestions:
            match_score = suggestion['match_score']

            # Only notify high-match helpers (score >= 70)
            if match_score >= 70:
                helper_id = suggestion['helper']['id']

                notification = Notification(
                    user_id=helper_id,
                    type='quick_connect_match',
                    title=f"🎯 Perfect Match: {request.title}",
                    message=f"Match score: {match_score}%. {suggestion['reasoning'][:150]}",
                    link=f"/quick-connects/{request_id}",
                    data={
                        'request_id': request_id,
                        'match_score': match_score,
                        'token_reward': request.token_reward,
                        'category': request.category,
                        'urgency': request.urgency
                    }
                )
                db.add(notification)
                notifications_sent += 1

        if notifications_sent > 0:
            db.commit()

        return notifications_sent

    def generate_help_response_draft(
        self,
        request_id: int,
        helper_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """Generate template for helper response"""
        request = db.query(QuickConnectRequest).filter(
            QuickConnectRequest.id == request_id
        ).first()

        helper = db.query(User).filter(User.id == helper_id).first()

        if not request or not helper:
            raise ValueError("Request or helper not found")

        # Get helper's experience
        past_helps = db.query(QuickConnectHelp).join(
            QuickConnectRequest
        ).filter(
            QuickConnectHelp.helper_id == helper_id,
            QuickConnectHelp.status == 'completed',
            QuickConnectHelp.rating >= 4
        ).order_by(desc(QuickConnectHelp.created_at)).limit(3).all()

        # Build message
        message_parts = [
            f"Hi! I'd be happy to help you with '{request.title}'."
        ]

        # Add experience if relevant
        category_helps = [h for h in past_helps if h.request.category == request.category]
        if category_helps:
            message_parts.append(f"I have experience helping with {request.category} requests.")
        elif past_helps:
            message_parts.append("I have successfully helped others with similar issues.")

        # Add availability
        if request.urgency == 'high':
            message_parts.append("I understand this is urgent and can start right away.")
        else:
            message_parts.append("I'm available to assist you with this.")

        message = " ".join(message_parts)

        # Generate talking points
        talking_points = [
            f"Review the details of your {request.category} situation",
            "Provide step-by-step guidance",
            "Answer any follow-up questions you have"
        ]

        return {
            'suggested_message': message,
            'talking_points': talking_points,
            'tone_notes': "Keep it friendly and professional. Mention any specific relevant experience you have."
        }

# Singleton instance
ml_quick_connect_service = MLQuickConnectService()
