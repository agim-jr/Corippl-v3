"""
Hybrid AI Service - Pure Math + Local ML (No External APIs)
Uses scikit-learn's TF-IDF for embeddings + custom math algorithms
"""

import numpy as np
import re
from typing import Dict, List, Tuple, Optional
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from datetime import datetime

class HybridAIEngine:
    """
    Local AI engine using TF-IDF + custom algorithms
    No external API calls - 100% self-contained
    """

    def __init__(self):
        # TF-IDF vectorizer for text embeddings
        self.vectorizer = TfidfVectorizer(
            max_features=100,  # Limit features for efficiency
            stop_words='english',
            ngram_range=(1, 2),  # Unigrams and bigrams
            min_df=1,
            max_df=0.95
        )

        # Topic detection keywords (expandable)
        self.topic_keywords = {
            "productivity": [
                "productivity", "efficiency", "time management", "organization",
                "workflow", "gtd", "pomodoro", "focus", "productivity hack"
            ],
            "fitness": [
                "fitness", "health", "workout", "exercise", "nutrition",
                "gym", "training", "bodybuilding", "cardio", "strength"
            ],
            "technology": [
                "tech", "coding", "programming", "software", "ai",
                "machine learning", "web dev", "app", "javascript", "python"
            ],
            "business": [
                "business", "entrepreneur", "startup", "marketing", "sales",
                "growth", "strategy", "founder", "revenue", "b2b"
            ],
            "creativity": [
                "art", "design", "creative", "photography", "writing",
                "illustration", "video editing", "content creation", "aesthetic"
            ],
            "finance": [
                "money", "finance", "investing", "crypto", "wealth",
                "stocks", "trading", "passive income", "financial freedom"
            ],
            "education": [
                "teaching", "learning", "education", "course", "training",
                "tutorial", "student", "study", "knowledge", "skill"
            ],
            "lifestyle": [
                "lifestyle", "travel", "food", "vlog", "daily life",
                "minimalism", "self improvement", "personal development"
            ]
        }

        # Tone detection patterns
        self.tone_patterns = {
            "inspirational": [
                "inspire", "motivate", "empower", "transform", "achieve",
                "dreams", "goals", "passion", "journey", "breakthrough"
            ],
            "professional": [
                "data", "research", "analysis", "expert", "professional",
                "insights", "methodology", "framework", "strategy", "proven"
            ],
            "casual": [
                "fun", "lol", "haha", "chill", "easy", "simple",
                "hey", "yo", "cool", "awesome", "btw"
            ],
            "educational": [
                "learn", "tutorial", "guide", "how to", "step by step",
                "explained", "beginner", "tips", "tricks", "mistakes"
            ]
        }

        # Audience detection patterns
        self.audience_patterns = {
            "entrepreneurs": [
                "entrepreneur", "founder", "startup", "business owner",
                "solopreneur", "side hustle", "building", "scaling"
            ],
            "students": [
                "student", "college", "university", "learning", "study",
                "exam", "degree", "academic", "school"
            ],
            "professionals": [
                "professional", "career", "corporate", "manager",
                "workplace", "job", "employee", "9-5", "office"
            ],
            "creators": [
                "creator", "artist", "designer", "writer", "content creator",
                "influencer", "youtuber", "blogger", "maker"
            ],
            "parents": [
                "parent", "mom", "dad", "family", "kids", "children",
                "parenting", "family life", "work life balance"
            ],
            "fitness_enthusiasts": [
                "fitness enthusiast", "gym rat", "athlete", "bodybuilder",
                "runner", "lifter", "health conscious"
            ]
        }

        # Model storage
        self.model_path = "backend/data/ai_models"
        os.makedirs(self.model_path, exist_ok=True)

        # Try to load existing vectorizer
        self._load_or_initialize_vectorizer()

    def _load_or_initialize_vectorizer(self):
        """Load pre-trained vectorizer or initialize new one"""
        vectorizer_path = os.path.join(self.model_path, "tfidf_vectorizer.pkl")

        try:
            if os.path.exists(vectorizer_path):
                with open(vectorizer_path, 'rb') as f:
                    self.vectorizer = pickle.load(f)
        except Exception as e:
            print(f"Could not load vectorizer: {e}. Using new one.")

    def save_vectorizer(self):
        """Save trained vectorizer for reuse"""
        vectorizer_path = os.path.join(self.model_path, "tfidf_vectorizer.pkl")
        with open(vectorizer_path, 'wb') as f:
            pickle.dump(self.vectorizer, f)

    # ============= PROFILE ANALYSIS =============

    def analyze_profile(self, bio: str, niche: str, content_description: str = "") -> Dict:
        """
        Comprehensive profile analysis using hybrid approach
        """
        # Combine all text
        full_text = self._clean_text(f"{bio} {niche} {content_description}")

        if not full_text.strip():
            return self._empty_profile_result()

        # Generate TF-IDF embedding
        embedding = self._generate_embedding(full_text)

        # Extract topics (rule-based)
        topics = self._extract_topics(full_text)

        # Detect tone (pattern matching)
        tone = self._detect_tone(full_text)

        # Identify target audience (keyword matching)
        target_audience = self._identify_audience(full_text)

        # Calculate profile strength (mathematical scoring)
        profile_strength = self._calculate_profile_strength(
            bio, niche, topics, full_text
        )

        # Extract key phrases
        key_phrases = self._extract_key_phrases(full_text)

        return {
            "embedding": embedding.tolist() if embedding is not None else [],
            "topics": topics,
            "tone": tone,
            "target_audience": target_audience,
            "profile_strength": profile_strength,
            "key_phrases": key_phrases,
            "word_count": len(full_text.split()),
            "analyzed_at": datetime.utcnow().isoformat()
        }

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        # Remove special characters but keep spaces
        text = re.sub(r'[^\w\s]', ' ', text)
        # Remove extra whitespace
        text = ' '.join(text.split())
        return text.lower()

    def _generate_embedding(self, text: str) -> Optional[np.ndarray]:
        """Generate TF-IDF embedding for text"""
        try:
            # Fit and transform if not fitted
            if not hasattr(self.vectorizer, 'vocabulary_') or self.vectorizer.vocabulary_ is None:
                # Need corpus to fit - use text itself
                embedding = self.vectorizer.fit_transform([text]).toarray()[0]
            else:
                embedding = self.vectorizer.transform([text]).toarray()[0]

            return embedding
        except Exception as e:
            print(f"Embedding generation failed: {e}")
            return None

    def _extract_topics(self, text: str) -> List[str]:
        """Extract topics using keyword matching with scoring"""
        topic_scores = {}

        for topic, keywords in self.topic_keywords.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                topic_scores[topic] = score

        # Return top 3 topics sorted by score
        sorted_topics = sorted(topic_scores.items(), key=lambda x: x[1], reverse=True)
        return [topic for topic, score in sorted_topics[:3]]

    def _detect_tone(self, text: str) -> str:
        """Detect communication tone"""
        tone_scores = {}

        for tone, patterns in self.tone_patterns.items():
            score = sum(1 for pattern in patterns if pattern in text)
            tone_scores[tone] = score

        # Return tone with highest score
        if tone_scores:
            detected_tone = max(tone_scores, key=tone_scores.get)
            if tone_scores[detected_tone] > 0:
                return detected_tone

        return "balanced"

    def _identify_audience(self, text: str) -> List[str]:
        """Identify target audience"""
        audience_scores = {}

        for audience, patterns in self.audience_patterns.items():
            score = sum(1 for pattern in patterns if pattern in text)
            if score > 0:
                audience_scores[audience] = score

        # Return top audiences
        sorted_audiences = sorted(audience_scores.items(), key=lambda x: x[1], reverse=True)
        found = [aud for aud, score in sorted_audiences[:2] if score > 0]

        return found if found else ["general"]

    def _calculate_profile_strength(
        self, bio: str, niche: str, topics: List[str], full_text: str
    ) -> int:
        """
        Calculate profile completeness score (0-100)
        Mathematical scoring based on multiple factors
        """
        score = 0

        # Bio length scoring (max 35 points)
        bio_length = len(bio.strip()) if bio else 0
        if bio_length > 100:
            score += 35
        elif bio_length > 50:
            score += 25
        elif bio_length > 20:
            score += 15

        # Niche clarity (max 25 points)
        if niche and len(niche.strip()) > 3:
            score += 25

        # Topics identified (max 20 points)
        score += min(len(topics) * 10, 20)

        # Word diversity (max 20 points)
        words = full_text.split()
        if words:
            unique_ratio = len(set(words)) / len(words)
            score += int(unique_ratio * 20)

        return min(score, 100)

    def _extract_key_phrases(self, text: str, max_phrases: int = 5) -> List[str]:
        """Extract key phrases from text"""
        # Simple n-gram extraction
        words = text.split()

        # Extract 2-3 word phrases
        phrases = []
        for i in range(len(words) - 1):
            phrase = f"{words[i]} {words[i+1]}"
            if len(phrase) > 6:  # Avoid very short phrases
                phrases.append(phrase)

        # Count frequency
        phrase_counts = Counter(phrases)

        # Return most common
        return [phrase for phrase, count in phrase_counts.most_common(max_phrases)]

    def _empty_profile_result(self) -> Dict:
        """Return empty result for invalid profiles"""
        return {
            "embedding": [],
            "topics": [],
            "tone": "unknown",
            "target_audience": ["general"],
            "profile_strength": 0,
            "key_phrases": [],
            "word_count": 0,
            "analyzed_at": datetime.utcnow().isoformat()
        }

    # ============= MATCH SCORING =============

    def calculate_match_score(
        self,
        user1_data: Dict,
        user2_data: Dict,
        user1_metrics: Dict,
        user2_metrics: Dict
    ) -> Dict:
        """
        Calculate comprehensive match score using hybrid approach

        Scoring breakdown:
        - Content Similarity (TF-IDF): 35 points
        - Topic Overlap (Math): 25 points
        - Audience Alignment (Math): 20 points
        - Growth Stage (Math): 15 points
        - Engagement Pattern (Math): 5 points
        """
        score_breakdown = {
            "content_similarity": 0,
            "topic_overlap": 0,
            "audience_alignment": 0,
            "growth_stage": 0,
            "engagement_pattern": 0,
            "total": 0
        }

        # 1. Content Similarity using TF-IDF cosine similarity (35 points)
        if user1_data.get("embedding") and user2_data.get("embedding"):
            try:
                emb1 = np.array(user1_data["embedding"]).reshape(1, -1)
                emb2 = np.array(user2_data["embedding"]).reshape(1, -1)

                if emb1.size > 0 and emb2.size > 0:
                    similarity = cosine_similarity(emb1, emb2)[0][0]
                    # Convert -1 to 1 range to 0 to 35
                    score_breakdown["content_similarity"] = int((similarity + 1) / 2 * 35)
            except Exception as e:
                print(f"Similarity calculation error: {e}")

        # 2. Topic Overlap (25 points)
        topics1 = set(user1_data.get("topics", []))
        topics2 = set(user2_data.get("topics", []))

        if topics1 and topics2:
            overlap = len(topics1 & topics2)
            max_possible = min(len(topics1), len(topics2))
            if max_possible > 0:
                score_breakdown["topic_overlap"] = int((overlap / max_possible) * 25)

        # 3. Audience Alignment (20 points)
        aud1 = set(user1_data.get("target_audience", []))
        aud2 = set(user2_data.get("target_audience", []))

        if aud1 and aud2 and "general" not in aud1 and "general" not in aud2:
            overlap = len(aud1 & aud2)
            if overlap > 0:
                score_breakdown["audience_alignment"] = min(overlap * 10, 20)

        # 4. Growth Stage Compatibility (15 points)
        followers1 = user1_metrics.get("total_followers", 0)
        followers2 = user2_metrics.get("total_followers", 0)

        if followers1 > 0 and followers2 > 0:
            ratio = min(followers1, followers2) / max(followers1, followers2)
            if ratio > 0.7:  # Within 30% of each other
                score_breakdown["growth_stage"] = 15
            elif ratio > 0.5:  # Within 50%
                score_breakdown["growth_stage"] = 10
            elif ratio > 0.3:  # Within 70%
                score_breakdown["growth_stage"] = 5

        # 5. Engagement Pattern (5 points)
        content1 = user1_metrics.get("content_count", 0)
        content2 = user2_metrics.get("content_count", 0)

        # Both actively posting
        if content1 > 5 and content2 > 5:
            score_breakdown["engagement_pattern"] = 5
        elif content1 > 2 and content2 > 2:
            score_breakdown["engagement_pattern"] = 3

        # Calculate total
        score_breakdown["total"] = sum([
            score_breakdown["content_similarity"],
            score_breakdown["topic_overlap"],
            score_breakdown["audience_alignment"],
            score_breakdown["growth_stage"],
            score_breakdown["engagement_pattern"]
        ])

        return score_breakdown

    def generate_match_reasons(self, score_breakdown: Dict, user1_data: Dict, user2_data: Dict) -> List[str]:
        """Generate human-readable match reasons"""
        reasons = []

        if score_breakdown["content_similarity"] >= 25:
            reasons.append("✓ Highly similar content themes")
        elif score_breakdown["content_similarity"] >= 15:
            reasons.append("✓ Related content topics")

        if score_breakdown["topic_overlap"] >= 15:
            common = set(user1_data.get("topics", [])) & set(user2_data.get("topics", []))
            reasons.append(f"✓ Shared interests: {', '.join(common)}")

        if score_breakdown["audience_alignment"] >= 10:
            reasons.append("✓ Targeting same audience")

        if score_breakdown["growth_stage"] >= 10:
            reasons.append("✓ Similar growth stage")

        if score_breakdown["engagement_pattern"] >= 3:
            reasons.append("✓ Both actively creating content")

        if not reasons:
            reasons.append("Potential collaboration opportunity")

        return reasons

    # ============= ICEBREAKER GENERATION =============

    def generate_icebreaker(
        self,
        sender_data: Dict,
        recipient_data: Dict,
        match_score: int
    ) -> Dict:
        """
        Generate personalized conversation starters
        Pure template-based (no external AI API)
        """
        sender_name = sender_data.get("username", "there")
        recipient_name = recipient_data.get("username", "there")

        # Find common ground
        common_topics = list(
            set(sender_data.get("topics", [])) &
            set(recipient_data.get("topics", []))
        )

        common_audience = list(
            set(sender_data.get("target_audience", [])) &
            set(recipient_data.get("target_audience", []))
        )

        # Generate collaboration ideas
        collab_ideas = self._generate_collab_ideas(
            common_topics,
            sender_data.get("topics", []),
            recipient_data.get("topics", [])
        )

        # Generate 3 message templates
        templates = [
            self._template_enthusiastic_intro(
                recipient_name, common_topics, match_score
            ),
            self._template_specific_interest(
                recipient_name, recipient_data, common_topics
            ),
            self._template_collab_pitch(
                recipient_name, collab_ideas[0] if collab_ideas else None,
                sender_data.get("total_followers", 0)
            )
        ]

        return {
            "templates": templates,
            "common_topics": common_topics,
            "common_audience": common_audience,
            "collab_ideas": collab_ideas,
            "recommended_template": templates[0],
            "match_quality": "high" if match_score >= 70 else "medium" if match_score >= 50 else "potential"
        }

    def _generate_collab_ideas(
        self,
        common_topics: List[str],
        topics1: List[str],
        topics2: List[str]
    ) -> List[str]:
        """Generate collaboration ideas based on topics"""
        ideas = []

        collab_templates = {
            "productivity": [
                "Co-create a productivity system guide",
                "Host a 'productivity tools we use' livestream",
                "Create a 30-day productivity challenge together"
            ],
            "fitness": [
                "Partner workout challenge series",
                "Nutrition + exercise collaboration",
                "Joint transformation program"
            ],
            "technology": [
                "Code together on a tutorial series",
                "Tech review collaboration",
                "Build an open-source project together"
            ],
            "business": [
                "Business growth case study collaboration",
                "Joint webinar on scaling strategies",
                "Guest post exchange on growth tactics"
            ],
            "creativity": [
                "Creative challenge collaboration",
                "Behind-the-scenes process swap",
                "Joint design/art project"
            ],
            "finance": [
                "Investment strategy discussion series",
                "Financial planning collaboration",
                "Money management tips exchange"
            ]
        }

        # Add ideas from common topics
        for topic in common_topics:
            if topic in collab_templates:
                ideas.extend(collab_templates[topic][:2])

        # Generic ideas if no common topics
        if not ideas:
            ideas = [
                "Cross-promote each other's best content",
                "Co-host a Q&A session for both audiences",
                "Feature each other in newsletters/posts",
                "Create a joint resource or guide",
                "Podcast interview exchange"
            ]

        return ideas[:4]  # Return top 4 ideas

    def _template_enthusiastic_intro(
        self,
        recipient_name: str,
        common_topics: List[str],
        match_score: int
    ) -> str:
        """Generate enthusiastic introduction"""
        if common_topics and match_score >= 70:
            topic_str = " and ".join(common_topics)
            return f"Hey {recipient_name}! 👋 Just came across your {topic_str} content through Audience Pool - we're a {match_score}% match! Your approach really resonates with me. Would love to connect and explore potential collaborations! 🚀"
        elif common_topics:
            topic = common_topics[0]
            return f"Hey {recipient_name}! 👋 Discovered your {topic} content and really enjoyed it! I'm also creating content in this space. Think we could create something amazing together - interested in chatting?"
        else:
            return f"Hey {recipient_name}! 👋 Your content caught my attention on Audience Pool. Love what you're building! Would be great to connect and see if there's a way we could collaborate or support each other's growth."

    def _template_specific_interest(
        self,
        recipient_name: str,
        recipient_data: Dict,
        common_topics: List[str]
    ) -> str:
        """Generate specific interest template"""
        followers = recipient_data.get("total_followers", 0)
        key_phrases = recipient_data.get("key_phrases", [])

        if key_phrases:
            phrase = key_phrases[0]
            return f"Hey {recipient_name}! I love your focus on '{phrase}' - it's exactly what I'm passionate about too. We're at similar stages and I think our audiences would benefit from a collaboration. Interested?"
        elif followers > 500:
            return f"Hey {recipient_name}! Impressive to see you've built {followers}+ followers! We're on similar growth journeys and I think we could really help each other. Want to explore collaboration ideas?"
        else:
            return f"Hey {recipient_name}! We're both at exciting early stages in our creator journey - perfect for collaborating! Would love to chat about how we can support each other's growth. 💪"

    def _template_collab_pitch(
        self,
        recipient_name: str,
        collab_idea: Optional[str],
        sender_followers: int
    ) -> str:
        """Generate collaboration pitch"""
        idea = collab_idea or "cross-promote each other's work"

        return f"Hey {recipient_name}! Quick idea: what if we {idea}? I think our audiences would love it and it would be mutually beneficial. I'm at {sender_followers} followers and growing steadily. Let me know if you're interested! 🤝"


# Singleton instance
_ai_engine = None

def get_ai_engine() -> HybridAIEngine:
    """Get or create AI engine singleton"""
    global _ai_engine
    if _ai_engine is None:
        _ai_engine = HybridAIEngine()
    return _ai_engine
