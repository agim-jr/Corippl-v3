import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import navLinks from "../lib/navLinks"; // Centralized navigation links

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8); // Adjust trigger point as needed
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 bg-white z-50 transition-all duration-200 ${
        scrolled ? "border-b border-gray-200 shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link
              to="/"
              className="group flex items-center focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              aria-label="Go to homepage"
            >
              <style jsx>{`
                @keyframes ripple {
                  0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 1;
                  }
                  100% {
                    transform: translate(-50%, -50%) scale(1.8);
                    opacity: 0;
                  }
                }
                .ripple-container::before {
                  content: "";
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  border-radius: 50%;
                  width: 100%;
                  height: 100%;
                  background: rgba(45, 44, 41, 0.3);
                  animation: ripple 2s infinite;
                }
              `}</style>

              {/* Logo Container */}
              <div
                className="enhanced-final"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "1.5rem",
                  fontWeight: 400,
                  letterSpacing: "-0.05em",
                }}
              >
                {/* "Co" with black background */}
                <span
                  className="co"
                  style={{
                    background: "#2d2c29",
                    color: "#ffffff",
                    padding: "0 6px",
                    borderRadius: "6px",
                    fontWeight: 500,
                  }}
                >
                  Co
                </span>

                {/* "Rippl" */}
                <span
                  className="rippl"
                  style={{
                    fontWeight: 300,
                    color: "#2d2c29",
                    padding: "0 4px",
                    position: "relative",
                  }}
                >
                  Rippl
                </span>

                {/* Animated Ripple Dot */}
                <span
                  className="ripple-container"
                  style={{
                    position: "relative",
                    display: "inline-block",
                    marginLeft: "6px",
                    width: "16px",
                    height: "16px",
                  }}
                >
                  {/* Center dot */}
                  <span
                    style={{
                      content: "",
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      borderRadius: "50%",
                      width: "8px",
                      height: "8px",
                      background: "#d1d1d1",
                      zIndex: 2,
                    }}
                  />
                </span>
              </div>
            </Link>
          </div>

          {/* Right Container: Action Buttons + Hamburger Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Action Buttons - Hidden on mobile (below sm breakpoint) */}
            <div className="hidden sm:flex items-center space-x-4">
              <Link
                to="/signup"
                className="px-4 py-2 bg-black text-white rounded-full text-base font-semibold shadow-md transition-all duration-200
    hover:bg-gray-800 hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-gray-700 whitespace-nowrap"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-white px-4 py-2 text-base font-semibold text-gray-900 shadow-md ring-1 ring-inset ring-gray-300
                  hover:bg-gray-100 hover:text-gray-800 hover:shadow-lg hover:ring-gray-400 transition-all duration-200 whitespace-nowrap"
              >
                Login
              </Link>
            </div>

            {/* Mobile Get Started Button - Only visible on mobile (below sm breakpoint) */}
            <div className="flex sm:hidden items-center">
              <Link
                to="/signup"
                className="px-3 py-1.5 bg-black text-white rounded-md text-xs font-semibold shadow-md transition-all duration-200
    hover:bg-gray-800 hover:shadow-lg focus:ring-2 focus:ring-gray-700"
              >
                Get Started
              </Link>
            </div>

            {/* Hamburger Menu - Always visible */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-800"
                aria-controls="hamburger-menu"
                aria-expanded={isMenuOpen}
              >
                <span className="sr-only">Open menu</span>
                {!isMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hamburger Menu Dropdown */}
      {isMenuOpen && (
        <div
          className="bg-white shadow-lg border-t border-gray-200"
          id="hamburger-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => {
                  setIsMenuOpen(false);
                  if (link.name === "Pricing" && window.gtag) {
                    window.gtag("event", "click", {
                      event_category: "Navigation",
                      event_label: "Navbar Pricing Click",
                    });
                  }
                }}
                className="block text-gray-700 font-semibold px-3 sm:px-4 py-2 rounded-lg transition-all duration-150 text-sm sm:text-base
                  hover:bg-gray-100 hover:text-gray-900 hover:pl-5 sm:hover:pl-6 hover:shadow-sm"
              >
                {link.name}
              </Link>
            ))}

            {/* Login Button - Centered in hamburger menu, only visible on mobile */}
            <div className="pt-2 pb-1 flex justify-center sm:hidden">
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-md ring-2 ring-inset ring-gray-300
                  hover:bg-gray-100 hover:text-gray-800 hover:shadow-lg hover:ring-gray-400 transition-all duration-200"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
