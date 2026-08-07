// frontend/src/lib/constants.js

// frontend/src/lib/constants.js

export const CATEGORIES = [
  "Tech & SaaS",
  "Marketing & Growth",
  "Entrepreneurship",
  "Finance & Investing",
  "Productivity",
  "Design & Creative",
  "AI & Automation",
  "Health & Wellness",
  "Career Development",
  "Content Creation",
  "Personal Development",
  "Education & Learning",
];

// More specific, creator-focused interests
export const INTERESTS = [
  // Tech & SaaS
  "Software Development",
  "No-Code Tools",
  "APIs",
  "Web Development",
  "Mobile Apps",
  "SaaS Tools",
  "DevOps",
  "Cloud Computing",

  // Marketing & Growth
  "Social Media Marketing",
  "Email Marketing",
  "SEO",
  "Content Marketing",
  "Growth Hacking",
  "Conversion Optimization",
  "Digital Advertising",
  "Analytics",

  // Entrepreneurship
  "Startups",
  "Side Hustles",
  "Business Strategy",
  "Fundraising",
  "Product Management",
  "Scaling",
  "Leadership",
  "Innovation",

  // Finance
  "Personal Finance",
  "Investing",
  "Cryptocurrency",
  "Real Estate",
  "Trading",
  "Budgeting",
  "Wealth Building",
  "Financial Planning",

  // AI & Automation
  "ChatGPT",
  "AI Tools",
  "Automation",
  "Machine Learning",
  "Prompt Engineering",
  "Workflow Automation",
  "AI Writing",
  "Data Science",

  // Design
  "UI/UX Design",
  "Graphic Design",
  "Branding",
  "Figma",
  "Design Systems",
  "Typography",
  "Visual Design",
  "Prototyping",

  // Content Creation
  "Newsletter Writing",
  "Thread Writing",
  "Video Creation",
  "Podcasting",
  "Blogging",
  "Copywriting",
  "Storytelling",
  "Social Media Content",

  // Productivity
  "Time Management",
  "Goal Setting",
  "Habits",
  "Tools & Apps",
  "Workflows",
  "Organization",
  "Focus Techniques",
  "Project Management",

  // Health & Wellness
  "Fitness",
  "Nutrition",
  "Mental Health",
  "Meditation",
  "Sleep Optimization",
  "Biohacking",
  "Stress Management",
  "Work-Life Balance",

  // Career Development
  "Job Hunting",
  "Networking",
  "Skill Building",
  "Remote Work",
  "Freelancing",
  "Career Transitions",
  "Professional Growth",
  "Interview Skills",

  // Personal Development
  "Self-Improvement",
  "Mindset",
  "Communication",
  "Learning",
  "Reading",
  "Journaling",
  "Confidence Building",
  "Life Skills",
];

// Optional: Define static content types if not fetching from backend
export const CONTENT_TYPES = [
  "article",
  "video",
  "thread",
  "newsletter",
  "podcast",
  "image",
  "pdf",
  "presentation",
  "code",
  "link",
  "note",
  "blog",
];

// Social media platforms with emoji icons
export const SOCIAL_PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    icon: "📷",
    placeholder: "instagram.com/username",
  },
  {
    key: "twitter",
    label: "Twitter/X",
    icon: "🐦",
    placeholder: "twitter.com/username",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "▶️",
    placeholder: "youtube.com/@username",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: "🎵",
    placeholder: "tiktok.com/@username",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    placeholder: "linkedin.com/in/username",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "👥",
    placeholder: "facebook.com/username",
  },
  {
    key: "twitch",
    label: "Twitch",
    icon: "🎮",
    placeholder: "twitch.tv/username",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    icon: "📌",
    placeholder: "pinterest.com/username",
  },
  {
    key: "snapchat",
    label: "Snapchat",
    icon: "👻",
    placeholder: "snapchat.com/add/username",
  },
  {
    key: "reddit",
    label: "Reddit",
    icon: "🤖",
    placeholder: "reddit.com/user/username",
  },
];

// ==================== TIER LIMITS ====================

export const TIER_LIMITS = {
  free: {
    // Audience Pool
    pool_reviews_per_day: 5,
    pool_submissions_per_week: 1,
    pool_credits_start: 100,
    pool_credits_per_review: 5,
    pool_submission_cost: 20,

    // Creator Collectives
    collectives_max_groups: 1,
    collectives_max_members_per_group: 8,
    collectives_access: false, // ✅ FREE USERS CANNOT ACCESS

    // Quick Connects
    quick_connects_access: false, // ✅ FREE USERS CANNOT ACCESS
  },
  premium: {
    // Audience Pool
    pool_reviews_per_day: 20,
    pool_submissions_per_week: 3,
    pool_credits_start: 200,
    pool_credits_per_review: 5,
    pool_submission_cost: 20,

    // Creator Collectives
    collectives_max_groups: 3,
    collectives_max_members_per_group: 12,
    collectives_access: true, // ✅ PREMIUM USERS CAN ACCESS

    // Quick Connects
    quick_connects_access: true, // ✅ PREMIUM USERS CAN ACCESS
    quick_connects_tokens_start: 50,
  },
  ai: {
    // Audience Pool
    pool_reviews_per_day: 50,
    pool_submissions_per_week: 10,
    pool_credits_start: 500,
    pool_credits_per_review: 5,
    pool_submission_cost: 20,

    // Creator Collectives
    collectives_max_groups: 10,
    collectives_max_members_per_group: 12,
    collectives_access: true, // ✅ AI USERS CAN ACCESS

    // Quick Connects
    quick_connects_access: true, // ✅ AI USERS CAN ACCESS
    quick_connects_tokens_start: 100,
  },
};

// Helper function to get tier limits
export const getTierLimits = (tier) => {
  const normalizedTier = tier?.toLowerCase() || "free";
  return TIER_LIMITS[normalizedTier] || TIER_LIMITS.free;
};

// Helper function to check feature access
export const canAccessFeature = (userTier, feature) => {
  const limits = getTierLimits(userTier);
  return limits[`${feature}_access`] === true;
};
