// frontend/src/lib/stripe.js
import { loadStripe } from "@stripe/stripe-js";

// Use environment variable instead of hardcoded key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
