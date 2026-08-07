// frontend/src/pages/Checkout.jsx
import React, { useEffect } from "react";
import { useApi } from "../lib/api";
import { toast } from "react-toastify";
import stripePromise from "../lib/stripe";

const Checkout = () => {
  const { createCheckoutSession } = useApi();

  useEffect(() => {
    const initiateCheckout = async () => {
      try {
        console.log("Initiating checkout session");
        const data = await createCheckoutSession();

        if (data.checkout_session_id) {
          console.log(
            "Redirecting to Stripe with session ID:",
            data.checkout_session_id
          );
          const stripe = await stripePromise;
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.checkout_session_id,
          });

          if (error) {
            console.error("Redirect error:", error);
            toast.error("Payment redirection failed. Please try again.");
          }
        } else {
          console.error("No checkout session ID received");
          toast.error("Could not initialize payment. Please try again.");
        }
      } catch (error) {
        console.error("Checkout process failed:", error);
        toast.error(
          "Failed to initiate checkout. Please try again or contact support."
        );
      }
    };

    initiateCheckout();
  }, [createCheckoutSession]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Redirecting to Checkout...</h2>
        <p className="text-gray-600 mb-4">
          Please wait while we redirect you to our secure payment page.
        </p>
        <div className="animate-pulse h-2 bg-gray-300 rounded mt-6"></div>
      </div>
    </div>
  );
};

export default Checkout;
