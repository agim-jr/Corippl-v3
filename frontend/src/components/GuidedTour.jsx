// GuidedTour.jsx - Desktop Only Version with View Mode Detection

import React, { useContext, useEffect, useState } from "react";
import Joyride, { STATUS, EVENTS, ACTIONS } from "react-joyride";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const GuidedTour = React.forwardRef((props, ref) => {
  const { user, hasCompletedTour, completeTour } = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState(
    localStorage.getItem("preferredViewMode") || "guided",
  );

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Listen for view mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      const newViewMode = localStorage.getItem("preferredViewMode") || "guided";
      setViewMode(newViewMode);

      // Stop tour if switching from dashboard to guided
      if (newViewMode === "guided" && run) {
        setRun(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Also listen for custom event in case localStorage is changed in same tab
    window.addEventListener("viewModeChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("viewModeChanged", handleStorageChange);
    };
  }, [run]);

  // Desktop steps only - FOR DASHBOARD VIEW
  const getDesktopSteps = () => {
    const steps = [
      {
        target: "body",
        content: "Welcome to Echo Ride! Share and discover content seamlessly.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour-id="step2-profile"]',
        content: "Your Profile section: view and customize your profile.",
        placement: "right",
      },
      {
        target: '[data-tour-id="step2-contacts"]',
        content: "Manage your contacts here to build your sharing network.",
        placement: "right",
      },
      {
        target: '[data-tour-id="step2-add-content"]',
        content:
          "Add new content to share with your network. Remember to activate content after adding it!",
        placement: "right",
      },
      {
        target: '[data-tour-id="step2-notifications"]',
        content: "Stay updated with notifications about shares and activity.",
        placement: "right",
      },
      {
        target: '[data-tour-id="step2-premium"]',
        content:
          "Access Premium features including unlimited shuffles and AI enhancements.",
        placement: "right",
      },
    ];

    if (user?.is_ai_tier) {
      steps.push({
        target: '[data-tour-id="ai-autopilot-card"]',
        content:
          "AI Autopilot automatically handles sharing for you. Manage your AI settings and preferences here.",
        placement: "bottom",
      });
    }

    steps.push(
      {
        target: '[data-tour-id="step3-content-queue"]',
        content:
          "Browse matched content from other users. Use filters to find content that matches your audience.",
        placement: "bottom",
      },
      {
        target: '[data-tour-id="step3-shuffle-button"]',
        content:
          "Shuffle matches to discover new content. Premium users get unlimited shuffles!",
        placement: "left",
      },
      {
        target: '[data-tour-id="step4-select-content"]',
        content:
          "Click on content items to select them for sharing. Selected items will be highlighted.",
        placement: "bottom",
      },
      {
        target: '[data-tour-id="step4-manage-section"]',
        content:
          "This is your content management section. After adding content using the sidebar, click the 'MANAGE CONTENT' button to activate or deactivate items for sharing.",
        placement: "left",
      },
      {
        target: '[data-tour-id="step5-share-manage-info"]',
        content:
          "Click this info icon for guidance on sharing requirements and progress tracking.",
        placement: "right",
      },
      {
        target: '[data-tour-id="step11-view-all-matched"]',
        content:
          "View all your matched content and track sharing progress. Click 'View All' to see the complete list.",
        placement: "left",
      },
      {
        target: '[data-tour-id="step5-view-queue"]',
        content:
          "View all content in your queue and track progress toward releasing your own content.",
        placement: "left",
      },
      {
        target: '[data-tour-id="step6-help-tour"]',
        content:
          "Click here anytime to restart the tour and get help with Echo Ride features.",
        placement: "right",
      },
    );

    return steps;
  };

  const [steps, setSteps] = useState(getDesktopSteps());

  // Update steps when user changes (AI tier affects steps)
  useEffect(() => {
    setSteps(getDesktopSteps());
  }, [user?.is_ai_tier]);

  React.useImperativeHandle(ref, () => ({
    startTour: () => {
      // Check if we're in guided mode
      if (viewMode === "guided") {
        toast.info(
          "Guided tour is not available in Guided Workflow mode. Switch to Dashboard view to access the tour.",
          { autoClose: 4000 },
        );
        return;
      }

      // Only allow tour on desktop in dashboard mode
      if (!isMobile) {
        setStepIndex(0);
        setRun(true);
      } else {
        toast.info(
          "Guided tour is available on desktop only. Use the 'HOW TO' buttons for mobile guidance.",
        );
      }
    },
  }));

  useEffect(() => {
    // Only auto-start tour on desktop for first-time users AND in dashboard mode
    if (
      !hasCompletedTour &&
      user &&
      user.has_profile_completed &&
      !isMobile &&
      viewMode === "dashboard" // ✅ ONLY run in dashboard mode
    ) {
      setStepIndex(0);
      setRun(true);
    }
  }, [user, hasCompletedTour, isMobile, viewMode]);

  const handleJoyrideCallback = (data) => {
    const { status, type, action, index } = data;

    // Handle step changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      completeTour && completeTour();
      toast.success("Guided tour completed!");
    }
  };

  // Don't render Joyride at all on mobile OR in guided mode
  if (isMobile || viewMode === "guided") {
    return null;
  }

  return (
    <>
      <style>
        {`
        body.react-joyride-active {
          overflow: visible !important;
        }

        .joyride-mono-tooltip {
          font-family: 'Fira Mono', Menlo, Monaco, Consolas, monospace !important;
          border: 2px solid #000 !important;
          border-radius: 0.5rem !important;
          background: #fff !important;
          color: #000 !important;
          padding: 1.2rem 1.5rem !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          max-width: 400px !important;
        }

        .joyride-mono-tooltip h4,
        .joyride-mono-tooltip .react-joyride__tooltip-title {
          font-weight: bold !important;
          font-size: 1rem !important;
          text-transform: uppercase;
        }

        .joyride-mono-tooltip .react-joyride__tooltip-content {
          font-size: 0.95rem !important;
          color: #000 !important;
          line-height: 1.5 !important;
        }

        .joyride-mono-tooltip .react-joyride__tooltip-footer {
          border-top: 1px solid #000 !important;
          margin-top: 1rem !important;
          padding-top: 0.75rem !important;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          background: transparent !important;
        }

        .joyride-mono-tooltip button {
          font-family: inherit !important;
          font-weight: bold !important;
          border-radius: 0.25rem !important;
          border: 2px solid #000 !important;
          background: #fff !important;
          color: #000 !important;
          padding: 0.3rem 0.9rem !important;
          transition: all 0.2s;
          font-size: 0.875rem !important;
        }

        .joyride-mono-tooltip button:hover,
        .joyride-mono-tooltip button:focus {
          background: #000 !important;
          color: #fff !important;
        }

        .joyride-mono-tooltip .react-joyride__tooltip-close {
          color: #000 !important;
          border: none !important;
          background: none !important;
        }
        `}
      </style>

      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        scrollToFirstStep
        scrollOffset={100}
        disableScrolling={false}
        disableScrollParentFix={true}
        showProgress
        showSkipButton
        spotlightClicks={false}
        styles={{
          options: {
            zIndex: 10000,
            fontFamily: "'Fira Mono', Menlo, Monaco, Consolas, monospace",
            arrowColor: "#fff",
            backgroundColor: "#fff",
            overlayColor: "rgba(0,0,0,0.5)",
            primaryColor: "#000",
            textColor: "#000",
          },
          spotlight: {
            borderRadius: "4px",
          },
        }}
        locale={{
          back: "BACK",
          close: "CLOSE",
          last: "FINISH",
          next: "NEXT",
          skip: "SKIP",
        }}
        tooltipProps={{
          className: "joyride-mono-tooltip",
        }}
        callback={handleJoyrideCallback}
      />
    </>
  );
});

export default GuidedTour;
