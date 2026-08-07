import React, { useState, useContext } from "react";
import Step1 from "../components/Step1";
import Step2 from "../components/Step2";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { BASE_URL } from "../lib/api";

// Scrollbar styles
const scrollbarStyles = `
  .share-manage-scrollbar::-webkit-scrollbar {
    width: 10px;
  }
  .share-manage-scrollbar::-webkit-scrollbar-thumb {
    background: #222;
    border-radius: 6px;
  }
  .share-manage-scrollbar::-webkit-scrollbar-track {
    background: #f3f3f3;
  }
  .share-manage-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #222 #f3f3f3;
  }
`;

// Default values for quick start
const QUICK_START_DEFAULTS = {
  name: "Creator",
  bio: "Exploring new opportunities to connect and collaborate with fellow creators.",
  categories: ["Technology", "Business", "Marketing"],
  interests: ["Social Media", "Content Creation", "Digital Marketing"],
};

// Step information
const stepInfo = [
  {
    title: "Basic Info",
    subtitle: "Introduce yourself to other creators.",
  },
  {
    title: "Your Interests",
    subtitle: "What content do you create and consume?",
  },
];

const ProfileBuilder = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { refreshUser } = useContext(AuthContext);
  const totalSteps = 2;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    categories: [],
    interests: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [showQuickStartBanner, setShowQuickStartBanner] = useState(true);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear specific field error when user makes changes
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name?.trim()) {
        newErrors.name = "Name is required";
      } else if (formData.name.length > 50) {
        newErrors.name = "Name must be 50 characters or less";
      }

      if (!formData.bio?.trim()) {
        newErrors.bio = "Bio is required";
      } else if (formData.bio.length > 280) {
        newErrors.bio = "Bio must be 280 characters or less";
      }
    }

    if (step === 2) {
      if (!formData.categories || formData.categories.length === 0) {
        newErrors.categories =
          "⚠️ Please select at least one content niche to continue";
      }

      if (!formData.interests || formData.interests.length === 0) {
        newErrors.interests = "⚠️ Please select at least one specific interest";
      }
    }

    return newErrors;
  };

  const handleQuickStart = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Use default values - mark as incomplete so user can customize later
      const quickStartData = {
        ...QUICK_START_DEFAULTS,
        profile_incomplete: true,
      };

      const response = await fetch(`${BASE_URL}/profiles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quickStartData),
      });

      if (response.ok) {
        const data = await response.json();

        // Track quick start
        if (window.gtag) {
          window.gtag("event", "quick_start_profile", {
            event_category: "Onboarding",
            event_label: "Quick Start Used",
            value: 1,
          });
        }

        // Set flags to show completion banner (encourage customization)
        localStorage.setItem("show_profile_completion_banner", "true");
        localStorage.setItem("profile_incomplete", "true");

        refreshUser(data.user);

        // Navigate to loading page
        navigate("/onboarding-loading", {
          state: { formData: quickStartData, isQuickStart: true },
          replace: true,
        });
      } else {
        const errorData = await response.json();
        setErrors({
          submit:
            errorData.detail || "Failed to create profile with quick start.",
        });
        setShowQuickStartBanner(false);
      }
    } catch (err) {
      setErrors({ submit: "An unexpected error occurred during quick start." });
      setShowQuickStartBanner(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSetup = () => {
    // User chose manual setup - hide the banner
    setShowQuickStartBanner(false);
  };

  const handleNext = () => {
    const validationErrors = validateStep(currentStep);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Show modal if on step 2 and there are validation errors
      if (currentStep === 2) {
        setShowChoices(true);
      }

      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Clear all errors
    setErrors({});

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleModalClose = () => {
    // Validate before allowing modal to close
    const validationErrors = validateStep(2);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Don't close the modal, keep it open
      return;
    }

    // Clear errors and close modal
    setErrors({});
    setShowChoices(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation before submission
    const validationErrors = validateStep(currentStep);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (currentStep === 2) {
        setShowChoices(true);
      }
      return;
    }

    setLoading(true);
    setErrors({});

    if (currentStep === totalSteps) {
      try {
        const profileData = {
          ...formData,
          profile_incomplete: false, // Mark as complete
        };

        const response = await fetch(`${BASE_URL}/profiles/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          const data = await response.json();

          // Track profile completion
          if (window.gtag) {
            window.gtag("event", "complete_profile", {
              event_category: "Onboarding",
              event_label: "Profile Builder Complete",
              value: 1,
            });
          }

          // Remove completion banner flags since profile is complete
          localStorage.removeItem("show_profile_completion_banner");
          localStorage.removeItem("profile_incomplete");

          refreshUser(data.user);

          // Navigate to loading page with formData
          navigate("/onboarding-loading", {
            state: { formData: profileData },
            replace: true,
          });
        } else {
          const errorData = await response.json();
          setErrors({
            submit: errorData.detail || "Failed to create profile.",
          });
        }
      } catch (err) {
        setErrors({ submit: "An unexpected error occurred." });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4 py-6 font-mono">
      {/* Inject scrollbar styles */}
      <style>{scrollbarStyles}</style>

      {/* Quick Start Banner - Always visible until dismissed */}
      {showQuickStartBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl animate-slideDown">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              {/* Left: Icon + Message */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-3xl flex-shrink-0 animate-bounce">
                  ⚡
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-white mb-0.5">
                    Skip the form? Use Quick Start!
                  </h3>
                  <p className="text-sm text-blue-100">
                    Get started in 10 seconds with smart defaults. Customize
                    later in settings.
                  </p>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <button
                  onClick={handleQuickStart}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                >
                  {loading ? "⏳ Setting up..." : "🚀 Quick Start"}
                </button>
                <button
                  onClick={handleManualSetup}
                  className="flex-1 sm:flex-none px-4 py-2.5 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-all whitespace-nowrap text-sm"
                >
                  Manual Setup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`w-full max-w-md bg-white border border-black rounded-2xl shadow-lg p-6 flex flex-col transition-all duration-300 ${
          showQuickStartBanner ? "mt-32 sm:mt-24" : ""
        }`}
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="w-full mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-black text-center mb-1 font-mono">
            Welcome to Corippl.
          </h1>
          <p className="text-gray-500 text-base text-center mb-6 font-mono">
            Set up your profile to connect with creators and start
            cross-promoting content.
          </p>
        </div>

        {/* Progress Bar with step indicators */}
        <div className="w-full mb-4">
          <div className="relative flex items-center justify-between mb-2">
            {stepInfo.map((step, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${
                      currentStep === idx + 1
                        ? "bg-black text-white border-black shadow-lg"
                        : currentStep > idx + 1
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-400 border-gray-300"
                    }
                    font-bold text-lg transition`}
                  aria-current={currentStep === idx + 1 ? "step" : undefined}
                >
                  {currentStep > idx + 1 ? (
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      className="mx-auto"
                      viewBox="0 0 20 20"
                    >
                      <path
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 10l4 4 6-8"
                      />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <div className="mt-1 text-xs text-center font-mono text-gray-700 font-bold">
                  {step.title}
                </div>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-black transition-all duration-500"
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
              }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center font-mono">
            Step {currentStep} of {totalSteps}
          </div>
        </div>

        {/* Step Title and Subtitle */}
        <div className="w-full mb-4 animate-fadeIn">
          <h2 className="text-lg font-semibold text-black mb-1 font-mono">
            {stepInfo[currentStep - 1].title}
          </h2>
          <p className="text-sm text-gray-400 font-mono">
            {stepInfo[currentStep - 1].subtitle}
          </p>
        </div>

        {/* Error Modal - Only for submit errors */}
        {errors.submit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white border border-red-600 rounded-xl shadow-lg px-6 py-4 max-w-xs w-full">
              <div className="flex items-center gap-2 mb-2 text-red-700 font-bold">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Error
              </div>
              <div className="text-red-700 mb-4 font-mono">{errors.submit}</div>
              <button
                type="button"
                className="w-full rounded-xl border border-black bg-black px-4 py-2 text-sm font-bold text-white font-mono hover:bg-white hover:text-black"
                onClick={() => setErrors({})}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form
          className="flex flex-col flex-1 w-full animate-fadeIn"
          key={currentStep}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto share-manage-scrollbar space-y-6">
            {currentStep === 1 && (
              <Step1
                formData={formData}
                handleChange={handleChange}
                errors={errors}
              />
            )}
            {currentStep === 2 && (
              <div className="space-y-4">
                <button
                  type="button"
                  className={`w-full rounded-xl border px-4 py-3 text-sm font-mono font-semibold transition ${
                    formData.categories.length > 0 ||
                    formData.interests.length > 0
                      ? "border-black bg-gray-100 hover:bg-gray-200"
                      : "border-red-300 bg-red-50 hover:bg-red-100"
                  }`}
                  onClick={() => setShowChoices(true)}
                >
                  {formData.categories.length > 0 ||
                  formData.interests.length > 0
                    ? `✓ Selected: ${formData.categories.length} ${
                        formData.categories.length === 1
                          ? "category"
                          : "categories"
                      }, ${formData.interests.length} ${
                        formData.interests.length === 1
                          ? "interest"
                          : "interests"
                      }`
                    : "⚠️ Click to Select Categories & Interests (Required)"}
                </button>

                {/* Show validation errors inline */}
                {(errors.categories || errors.interests) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg
                        className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div className="space-y-1">
                        {errors.categories && (
                          <p className="text-sm text-red-600 font-mono">
                            {errors.categories}
                          </p>
                        )}
                        {errors.interests && (
                          <p className="text-sm text-red-600 font-mono">
                            {errors.interests}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-4 flex-shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-black bg-white px-4 py-2 text-sm font-bold text-black font-mono hover:bg-black hover:text-white transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl border border-black bg-black px-4 py-2 text-sm font-bold text-white font-mono hover:bg-white hover:text-black transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`rounded-xl border border-black bg-black px-4 py-2 text-sm font-bold font-mono text-white shadow-sm hover:bg-white hover:text-black focus:outline-none focus:ring-2 focus:ring-black transition ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            )}
          </div>

          {/* Categories/Interests Selection Modal */}
          {showChoices && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div
                className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col"
                style={{ maxHeight: "85vh" }}
              >
                {/* Fixed Header */}
                <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-xl font-bold text-black font-mono">
                    Select Your Preferences
                  </h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    Choose at least one category and one interest
                  </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 share-manage-scrollbar">
                  <Step2
                    formData={formData}
                    handleChange={handleChange}
                    errors={errors}
                  />
                </div>

                {/* Fixed Footer */}
                <div className="px-6 pb-6 pt-4 border-t border-gray-200 flex gap-3 flex-shrink-0">
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 font-mono hover:bg-gray-50 transition"
                    onClick={() => {
                      // Allow closing without validation
                      setShowChoices(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl border border-black bg-black px-4 py-2 text-sm font-bold text-white font-mono hover:bg-white hover:text-black transition"
                    onClick={handleModalClose}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        <style>
          {`
          .animate-shake {
            animation: shake 0.22s cubic-bezier(.36,.07,.19,.97) both;
          }
          @keyframes shake {
            10%,90% {transform: translateX(-1px);}
            20%,80% {transform: translateX(2px);}
            30%,50%,70% {transform: translateX(-3px);}
            40%,60% {transform: translateX(3px);}
          }
          .animate-fadeIn {
            animation: fadeInStep .35s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fadeInStep {
            from { opacity: 0; transform: translateY(10px);}
            to { opacity: 1; transform: none;}
          }
          .animate-fadeInCard {
            animation: fadeInCard .5s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fadeInCard {
            from { opacity: 0; transform: scale(0.98);}
            to { opacity: 1; transform: none;}
          }
          .animate-slideDown {
            animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-bounce {
            animation: bounce 1s infinite;
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(-5%);
              animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
            }
            50% {
              transform: translateY(0);
              animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
            }
          }
        `}
        </style>
      </div>
    </div>
  );
};

export default ProfileBuilder;
