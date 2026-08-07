import React from "react";
import { Link } from "react-router-dom";

const Logo = ({ className = "", centered = false }) => (
  <div
    className={`${
      centered ? "flex justify-center items-center" : ""
    } ${className}`}
    role="banner"
    aria-label="Logo"
  >
    <Link
      to="/"
      className="group focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 inline-flex items-center"
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
        {/* "Co" with black background */}
        <span
          className="co"
          style={{
            background: "#2d2c29",
            color: "white",
            padding: "0 6px",
            borderRadius: "6px",
            fontWeight: 500,
          }}
        >
          Co
        </span>

        {/* "Rippl" in light weight */}
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
);

export default Logo;
