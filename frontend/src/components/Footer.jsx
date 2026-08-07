import React from "react";
import { Link } from "react-router-dom";

const navigation = {
  main: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Terms", href: "/terms" },
    { name: "Privacy", href: "/privacy" },
    { name: "Pricing", href: "/pricing" },
  ],
  social: [
    {
      name: "X",
      href: "#",
      icon: (props) => (
        <svg
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          {...props}
        >
          <path d="M13.6823 10.6218L20.2391 3H18.6854L12.9921 9.61788L8.44486 3H3.2002L10.0765 13.0074L3.2002 21H4.75404L10.7663 14.0113L15.5685 21H20.8131L13.6819 10.6218H13.6823ZM11.5541 13.0956L10.8574 12.0991L5.31391 4.16971H7.70053L12.1742 10.5689L12.8709 11.5655L18.6861 19.8835H16.2995L11.5541 13.096V13.0956Z" />
        </svg>
      ),
    },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 lg:py-20 lg:px-8">
        {/* Logo - Inverted Colors for Black Background */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <Link
            to="/"
            className="group focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black inline-flex items-center"
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
                background: rgba(200, 200, 200, 0.3);
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
                fontSize: "1.8rem",
                fontWeight: 400,
                letterSpacing: "-0.05em",
              }}
            >
              {/* "Co" with WHITE background (opposite of black) */}
              <span
                className="co"
                style={{
                  background: "#ffffff",
                  color: "#2d2c29",
                  padding: "0 6px",
                  borderRadius: "6px",
                  fontWeight: 500,
                }}
              >
                Co
              </span>

              {/* "Rippl" in WHITE (opposite of black text) */}
              <span
                className="rippl"
                style={{
                  fontWeight: 300,
                  color: "#ffffff",
                  padding: "0 4px",
                  position: "relative",
                }}
              >
                Rippl
              </span>

              {/* Animated Ripple Dot - LIGHT COLOR */}
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
                {/* Center dot - LIGHT GRAY */}
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
                    background: "#e5e5e5",
                    zIndex: 2,
                  }}
                />
              </span>
            </div>
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav
          aria-label="Footer"
          className="flex flex-wrap justify-center gap-x-6 sm:gap-x-9 gap-y-3 sm:gap-y-4 text-sm sm:text-base font-semibold"
        >
          {navigation.main.map((item) =>
            item.href.startsWith("#") ? (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-white hover:bg-gray-900/70 hover:backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full transition-all duration-200 shadow-none hover:shadow-lg hover:scale-105"
              >
                {item.name}
              </a>
            ) : (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-400 hover:text-white hover:bg-gray-900/70 hover:backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full transition-all duration-200 shadow-none hover:shadow-lg hover:scale-105"
              >
                {item.name}
              </Link>
            ),
          )}
        </nav>

        {/* Social Media Links */}
        {navigation.social.length > 0 && (
          <div className="mt-8 sm:mt-12 flex justify-center gap-x-4 sm:gap-x-6">
            {navigation.social.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-400 hover:text-white transition-all duration-200 rounded-full p-2 sm:p-2.5 hover:bg-gray-900/70 hover:shadow-lg"
                aria-label={item.name}
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            ))}
          </div>
        )}

        {/* Footer Text */}
        <p className="mt-8 sm:mt-10 text-center text-xs sm:text-sm text-gray-500">
          &copy; 2025 CoRippl by Shadow AOI LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
