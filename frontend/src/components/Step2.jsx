// frontend/src/components/Step2.jsx

import React, { useState, useEffect } from "react";

/**
 * Step2 Component
 * Collects user's categories and interests with creator-focused options.
 */
const Step2 = ({ formData, handleChange, errors }) => {
  const categories = [
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

  const interestsMap = {
    "Tech & SaaS": [
      "Software Development",
      "No-Code Tools",
      "APIs",
      "Web Development",
      "Mobile Apps",
      "SaaS Tools",
      "DevOps",
      "Cloud Computing",
    ],
    "Marketing & Growth": [
      "Social Media Marketing",
      "Email Marketing",
      "SEO",
      "Content Marketing",
      "Growth Hacking",
      "Conversion Optimization",
      "Digital Advertising",
      "Analytics",
    ],
    Entrepreneurship: [
      "Startups",
      "Side Hustles",
      "Business Strategy",
      "Fundraising",
      "Product Management",
      "Scaling",
      "Leadership",
      "Innovation",
    ],
    "Finance & Investing": [
      "Personal Finance",
      "Investing",
      "Cryptocurrency",
      "Real Estate",
      "Trading",
      "Budgeting",
      "Wealth Building",
      "Financial Planning",
    ],
    "AI & Automation": [
      "ChatGPT",
      "AI Tools",
      "Automation",
      "Machine Learning",
      "Prompt Engineering",
      "Workflow Automation",
      "AI Writing",
      "Data Science",
    ],
    "Design & Creative": [
      "UI/UX Design",
      "Graphic Design",
      "Branding",
      "Figma",
      "Design Systems",
      "Typography",
      "Visual Design",
      "Prototyping",
    ],
    "Content Creation": [
      "Newsletter Writing",
      "Thread Writing",
      "Video Creation",
      "Podcasting",
      "Blogging",
      "Copywriting",
      "Storytelling",
      "Social Media Content",
    ],
    Productivity: [
      "Time Management",
      "Goal Setting",
      "Habits",
      "Tools & Apps",
      "Workflows",
      "Organization",
      "Focus Techniques",
      "Project Management",
    ],
    "Health & Wellness": [
      "Fitness",
      "Nutrition",
      "Mental Health",
      "Meditation",
      "Sleep Optimization",
      "Biohacking",
      "Stress Management",
      "Work-Life Balance",
    ],
    "Career Development": [
      "Job Hunting",
      "Networking",
      "Skill Building",
      "Remote Work",
      "Freelancing",
      "Career Transitions",
      "Professional Growth",
      "Interview Skills",
    ],
    "Personal Development": [
      "Self-Improvement",
      "Mindset",
      "Communication",
      "Learning",
      "Reading",
      "Journaling",
      "Confidence Building",
      "Life Skills",
    ],
    "Education & Learning": [
      "Online Courses",
      "Teaching",
      "Research",
      "Study Techniques",
      "Educational Technology",
      "Academic Writing",
      "Skill Development",
      "Knowledge Sharing",
    ],
  };

  const [selectedCategories, setSelectedCategories] = useState(
    formData.categories || []
  );
  const [selectedInterests, setSelectedInterests] = useState(
    formData.interests || []
  );

  useEffect(() => {
    handleChange("categories", selectedCategories);
    handleChange("interests", selectedInterests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, selectedInterests]);

  // Get interests based on selected categories (unique, sorted)
  const currentInterests = Array.from(
    new Set(
      selectedCategories.flatMap((category) => interestsMap[category] || [])
    )
  );

  const handleCategoryToggle = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((cat) => cat !== category)
        : [...prev, category]
    );
    // Remove interests from deselected category
    if (selectedCategories.includes(category)) {
      const interestsToRemove = interestsMap[category] || [];
      setSelectedInterests((prev) =>
        prev.filter((interest) => !interestsToRemove.includes(interest))
      );
    }
  };

  const handleInterestToggle = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((int) => int !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Categories Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Select Your Content Niches
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Choose the categories that best describe your content focus
          </p>
        </div>

        {/* Error message for categories */}
        {errors?.categories && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errors.categories}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const selected = selectedCategories.includes(category);
            return (
              <button
                type="button"
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`cursor-pointer px-3 py-2 rounded-lg border text-xs font-semibold transition-all
                  ${
                    selected
                      ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                  }
                  focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1`}
                aria-pressed={selected}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Selected count */}
        {selectedCategories.length > 0 && (
          <div className="text-xs text-gray-600">
            ✓ {selectedCategories.length}{" "}
            {selectedCategories.length === 1 ? "niche" : "niches"} selected
          </div>
        )}
      </div>

      {/* Interests Section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Select Your Specific Interests
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Choose specific topics within your selected niches
          </p>
        </div>

        {/* Error message for interests */}
        {errors?.interests && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {errors.interests}
          </div>
        )}

        <div className="min-h-[80px]">
          {currentInterests.length === 0 ? (
            <div className="text-gray-400 text-xs py-6 px-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              👆 Select at least one niche above to see specific interests
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 share-manage-scrollbar">
                {currentInterests.map((interest) => {
                  const selected = selectedInterests.includes(interest);
                  return (
                    <button
                      type="button"
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className={`px-3 py-2 rounded-md border text-xs font-medium text-left transition-all
                        ${
                          selected
                            ? "bg-gray-900 text-white border-gray-900 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:shadow-sm"
                        }
                        focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1`}
                      aria-pressed={selected}
                      tabIndex={0}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>

              {/* Selected count */}
              {selectedInterests.length > 0 && (
                <div className="text-xs text-gray-600 mt-2">
                  ✓ {selectedInterests.length}{" "}
                  {selectedInterests.length === 1 ? "interest" : "interests"}{" "}
                  selected
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          button[aria-pressed="true"] {
            transform: scale(1.03);
          }

          .share-manage-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .share-manage-scrollbar::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 4px;
          }
          .share-manage-scrollbar::-webkit-scrollbar-track {
            background: #f3f3f3;
            border-radius: 4px;
          }
          .share-manage-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #333 #f3f3f3;
          }
        `}
      </style>
    </div>
  );
};

export default Step2;
