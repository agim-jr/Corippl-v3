import React from "react";

const ViewModeToggle = ({ viewMode, setViewMode }) => {
  const handleToggle = () => {
    const newMode = viewMode === "guided" ? "dashboard" : "guided";
    setViewMode(newMode);
    localStorage.setItem("preferredViewMode", newMode);

    // ✅ Dispatch custom event so GuidedTour can react to view mode changes
    window.dispatchEvent(new Event("viewModeChanged"));
  };

  return (
    <div className="mb-4 flex items-center justify-between bg-white border-2 border-black rounded-lg px-4 py-2 shadow-lg">
      <h1 className="text-xl font-bold"></h1>

      <div className="flex items-center gap-3">
        <span
          className={`text-xs font-bold transition-colors ${
            viewMode === "guided" ? "text-black" : "text-gray-400"
          }`}
        >
          🎯 GUIDED
        </span>
        <button
          onClick={handleToggle}
          className={`
            relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
            ${viewMode === "guided" ? "bg-black" : "bg-gray-300"}
          `}
          aria-label="Toggle view mode"
        >
          <div
            className={`
            absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform shadow-md
            ${viewMode === "guided" ? "left-0.5" : "left-7"}
          `}
          />
        </button>
        <span
          className={`text-xs font-bold transition-colors ${
            viewMode === "dashboard" ? "text-black" : "text-gray-400"
          }`}
        >
          📊 DASHBOARD
        </span>
      </div>
    </div>
  );
};

export default ViewModeToggle;
