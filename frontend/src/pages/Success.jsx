// frontend/src/pages/Success.jsx
import React, { useEffect, useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { useApi } from "../lib/api"; // Changed to use the hook instead

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const query = new URLSearchParams(location.search);
  const sessionId = query.get("session_id");
  const { apiFetch } = useApi(); // Use the hook to get apiFetch

  useEffect(() => {
    const completeSubscription = async () => {
      if (!sessionId) {
        console.error("No session ID provided");
        toast.error("No session ID provided");
        setLoading(false);
        setTimeout(() => navigate("/pricing"), 2000);
        return;
      }

      console.log("Payment successful! Session ID:", sessionId);

      try {
        // Try both methods:

        // 1. Verify session directly (this will work even if webhooks fail)
        console.log("Verifying session directly...");
        try {
          const response = await apiFetch(
            `/api/subscription/verify-session/${sessionId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          const verifyResponse = await response.json();
          console.log("Session verification response:", verifyResponse);
        } catch (verifyError) {
          console.error("Error verifying session:", verifyError);
          // Continue even if this fails
        }

        // 2. Give webhook a chance to process
        console.log("Waiting for webhook processing...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 3. Refresh user data
        console.log("Refreshing user data...");
        await refreshUser();

        toast.success("Successfully upgraded to Premium!");
        setLoading(false);
        setTimeout(() => navigate("/app/home"), 1000);
      } catch (error) {
        console.error("Error completing subscription:", error);
        toast.error("Error updating premium status. Please contact support.");
        setLoading(false);
      }
    };

    completeSubscription();
  }, [sessionId, refreshUser, navigate, apiFetch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Thank You!</h1>

        {loading ? (
          <>
            <div className="animate-pulse h-2 bg-blue-500 rounded-full mb-6"></div>
            <p className="text-lg text-gray-600 mb-2">
              Processing your payment...
            </p>
            <p className="text-sm text-gray-500">
              This should only take a few seconds
            </p>
          </>
        ) : (
          <p className="text-lg text-gray-600">
            Your payment was successful! You now have access to all premium
            features.
          </p>
        )}
      </div>
    </div>
  );
};

export default Success;
