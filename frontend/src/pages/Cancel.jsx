// frontend/src/pages/Cancel.jsx

import React from "react";
import { Link } from "react-router-dom";

const Cancel = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Payment Canceled</h1>
        <p className="mt-4 text-lg text-gray-600">
          Your payment was canceled. You can try again or contact support for
          assistance.
        </p>
        <Link
          to="/pricing"
          className="mt-6 inline-block text-blue-500 hover:underline"
        >
          Back to Pricing
        </Link>
      </div>
    </div>
  );
};

export default Cancel;
