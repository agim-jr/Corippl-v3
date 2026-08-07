// frontend/src/pages/NotAuthorized.jsx

import React from "react";

const NotAuthorized = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md text-center">
        <h1 className="text-3xl font-bold mb-4">403 - Not Authorized</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    </div>
  );
};

export default NotAuthorized;
