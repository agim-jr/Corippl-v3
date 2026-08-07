// frontend/src/components/Step3.jsx

import React from "react";

/**
 * Step3 Component
 * @param {object} formData - Contains current form data.
 */
const Step3 = ({ formData }) => {
  return (
    <div className="mb-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 mb-1">How Corippl. Works</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Upload your best content (articles, videos, tools, etc.)</li>
              <li>We match you with creators in similar niches</li>
              <li>Share their content → they share yours</li>
              <li>Build your audience together! 🚀</li>
            </ol>
          </div>
        </div>
      </div>

      <h3 className="text-xl font-bold">Confirm Your Preferences</h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <strong className="text-gray-700">Content Categories:</strong>
          <div className="mt-1 flex flex-wrap gap-2">
            {formData.categories.length > 0 ? (
              formData.categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-black text-white rounded-full text-sm"
                >
                  {cat}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">None selected</span>
            )}
          </div>
        </div>
        <div>
          <strong className="text-gray-700">Interests:</strong>
          <div className="mt-1 flex flex-wrap gap-2">
            {formData.interests.length > 0 ? (
              formData.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm">None selected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;
