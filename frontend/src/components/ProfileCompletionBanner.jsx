// frontend/src/components/ProfileCompletionBanner.jsx

import React, { useState, useEffect } from "react";

const ProfileCompletionBanner = ({ onOpenProfile }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const shouldShow = localStorage.getItem("show_profile_completion_banner");
    const dismissed = sessionStorage.getItem("profile_banner_dismissed");

    if (shouldShow === "true" && !dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("profile_banner_dismissed", "true");
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handleComplete = () => {
    setIsVisible(false);
    onOpenProfile();
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-bold text-yellow-900">
                Complete Your Profile for Better Matches
              </p>
              <p className="text-xs text-yellow-700">
                You're using default settings. Customize your profile to get
                more relevant content matches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-bold rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Complete Profile
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 text-yellow-600 hover:text-yellow-800 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;
