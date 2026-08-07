// frontend/src/components/ShuffleStatus.jsx

"use client";

import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useApi } from "../lib/api";

const ShuffleStatus = ({ onOpenPremiumModal }) => {
  const { isPremium } = useContext(AuthContext);
  const { getRemainingShuffles } = useApi();
  const [shuffleData, setShuffleData] = useState(null);

  useEffect(() => {
    const fetchShuffles = async () => {
      try {
        const data = await getRemainingShuffles();
        setShuffleData(data);
      } catch (error) {
        console.error("Error fetching remaining shuffles:", error);
      }
    };
    fetchShuffles();
  }, [getRemainingShuffles]);

  if (isPremium) {
    return <p className="font-mono text-sm font-bold">♾️ UNLIMITED SHUFFLES</p>;
  }

  if (!shuffleData) {
    return <p className="font-mono text-sm font-bold">SHUFFLES: LOADING...</p>;
  }

  const { remaining_shuffles, bonus_shuffles, total_shuffles } = shuffleData;

  // Display format based on what shuffles are available
  if (remaining_shuffles > 0 && bonus_shuffles > 0) {
    return (
      <p className="font-mono text-sm font-bold">
        🔄 SHUFFLES: {remaining_shuffles} + {bonus_shuffles} BONUS ={" "}
        {total_shuffles} TOTAL
      </p>
    );
  } else if (remaining_shuffles > 0 && bonus_shuffles === 0) {
    return (
      <p className="font-mono text-sm font-bold">
        🔄 SHUFFLES: {remaining_shuffles}
      </p>
    );
  } else if (remaining_shuffles === 0 && bonus_shuffles > 0) {
    return (
      <p className="font-mono text-sm font-bold">
        🔄 SHUFFLES: 0 + {bonus_shuffles} BONUS = {bonus_shuffles} TOTAL
      </p>
    );
  } else {
    return (
      <div className="space-y-3">
        <p className="font-mono text-sm font-bold text-red-600">
          🔄 SHUFFLES: 0
        </p>

        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">
                OUT OF SHUFFLES
              </p>
              <p className="text-xs text-yellow-700">
                Upgrade to Premium for unlimited shuffles
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenPremiumModal}
          className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">♾️</span>
              <div className="text-left">
                <div className="text-sm uppercase tracking-wide">
                  Upgrade to Premium
                </div>
                <div className="text-xs opacity-90 font-normal">
                  Unlimited shuffles forever
                </div>
              </div>
            </div>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>
      </div>
    );
  }
};

export default ShuffleStatus;
