// frontend/src/components/Header.jsx
import React from "react";

const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Back End Developer
            </h2>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
