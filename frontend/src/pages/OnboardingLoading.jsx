import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OnboardingLoading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Get formData from navigation state
  const formData = location.state?.formData || {};

  const loadingSteps = [
    {
      message: "Analyzing your profile...",
      duration: 1200,
      icon: "👤",
    },
    {
      message: `Finding content that matches ${
        formData?.categories?.[0] || "your interests"
      }...`,
      duration: 1500,
      icon: "🔍",
    },
    {
      message: "Building your personalized content queue...",
      duration: 1300,
      icon: "📊",
    },
    {
      message: "Connecting you with relevant creators...",
      duration: 1000,
      icon: "🤝",
    },
    {
      message: "Finalizing your dashboard...",
      duration: 800,
      icon: "✨",
    },
  ];

  useEffect(() => {
    // Redirect if no formData (user tried to access directly)
    if (!location.state?.formData) {
      navigate("/app/home", { replace: true });
      return;
    }

    let stepTimeout;
    let progressInterval;

    const totalDuration = loadingSteps.reduce(
      (sum, step) => sum + step.duration,
      0,
    );
    const progressIncrement = 100 / totalDuration;

    // Smooth progress bar animation
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + progressIncrement * 50;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);

    // Step through loading messages
    const advanceStep = (stepIndex) => {
      if (stepIndex < loadingSteps.length) {
        setCurrentStep(stepIndex);
        stepTimeout = setTimeout(() => {
          advanceStep(stepIndex + 1);
        }, loadingSteps[stepIndex].duration);
      } else {
        // All steps complete, navigate to home
        // All steps complete, navigate to home
        clearInterval(progressInterval);
        setProgress(100);

        // Track onboarding completion
        if (window.gtag) {
          window.gtag("event", "complete_onboarding", {
            event_category: "Onboarding",
            event_label: "Onboarding Flow Complete",
            value: 1,
          });
        }

        setTimeout(() => {
          navigate("/app/home", { replace: true });
        }, 500);
      }
    };

    advanceStep(0);

    return () => {
      clearTimeout(stepTimeout);
      clearInterval(progressInterval);
    };
  }, [navigate, location.state]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 font-mono">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent animate-pulse" />
          </div>

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-black mb-2">
                Setting Up Your Experience
              </h1>
              <p className="text-sm text-gray-600">
                Personalizing your content feed based on your preferences
              </p>
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24">
                {/* Spinning Outer Ring */}
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-black border-t-transparent rounded-full animate-spin" />

                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-4xl animate-bounce">
                  {loadingSteps[currentStep]?.icon}
                </div>
              </div>
            </div>

            {/* Current Step Message */}
            <div className="mb-6 h-12 flex items-center justify-center">
              <p className="text-center text-base font-semibold text-black animate-fadeIn">
                {loadingSteps[currentStep]?.message}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center gap-2">
              {loadingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? "w-8 bg-black"
                      : index < currentStep
                        ? "w-2 bg-black"
                        : "w-2 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            {/* Fun Fact / Tip */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                💡 <span className="font-semibold">Pro Tip:</span> Content with
                engaging visuals gets 3x more shares on average
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-4 text-xs text-gray-500">
          This won't take long...
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnboardingLoading;
