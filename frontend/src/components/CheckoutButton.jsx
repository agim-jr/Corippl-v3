// frontend/src/components/CheckoutButton.jsx
import React, { useState } from "react";
import { useApi } from "../lib/api";
import stripePromise from "../lib/stripe";
import { toast } from "react-toastify";

const CheckoutButton = ({
  planType = "premium",
  billingCycle = "monthly",
  children,
  className = "",
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const { createCheckoutSession } = useApi();

  const handleCheckout = async () => {
    if (loading || disabled) return;

    setLoading(true);

    try {
      console.log("🔵 Starting checkout with:", { planType, billingCycle });

      // Call the API with plan_type and billing_cycle
      const data = await createCheckoutSession({
        plan_type: planType,
        billing_cycle: billingCycle,
      });

      console.log("🔵 Checkout session created:", data);

      if (!data.checkout_session_id) {
        throw new Error("No checkout session ID received");
      }

      // Load Stripe
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe failed to load. Please refresh the page.");
      }

      console.log("🔵 Redirecting to Stripe checkout...");

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.checkout_session_id,
      });

      // This code only runs if redirect fails
      if (error) {
        console.error("❌ Stripe redirect error:", error);
        toast.error(
          error.message || "Payment redirect failed. Please try again.",
        );
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Checkout failed:", error);

      // Detailed error handling
      if (error.details?.detail) {
        toast.error(error.details.detail);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Checkout failed. Please try again.");
      }

      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || disabled}
      className={`${className} ${loading || disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {loading ? (
        <>
          <span className="inline-block animate-spin mr-2">⏳</span>
          Processing...
        </>
      ) : (
        children || "Subscribe Now"
      )}
    </button>
  );
};

export default CheckoutButton;
