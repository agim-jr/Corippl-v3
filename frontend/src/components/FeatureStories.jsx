import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const DEFAULT_SLIDES = [
  {
    title: "🤝 Connect With Ideal Partners",
    desc: "Find creators in your niche instantly. Our smart matching turns hours of searching into seconds of connecting.",
  },
  {
    title: "🔄 Share & Grow Together",
    desc: "Give to receive: share quality content to get yours promoted. Every exchange builds your audience authentically.",
  },
  {
    title: "📊 Track Real Impact",
    desc: "See which partnerships drive actual growth. Simple metrics show what works so you can do more of it.",
  },
  {
    title: "⏱️ Focus On Creating, Not Promoting",
    desc: "Let Corippl handle your cross-promotion strategy while you create. Maximum reach with minimum effort.",
  },
];

const STORY_DURATION = 2500;

export default function FeatureStories({
  slides = DEFAULT_SLIDES,
  buttonLabel = "View Corippl Features",
  buttonClass = "",
  icon = true,
}) {
  const [show, setShow] = useState(false);
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  // Auto-advance logic
  useEffect(() => {
    if (!show) return;
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 99) {
          clearInterval(timerRef.current);
          if (idx < slides.length - 1) {
            setIdx((i) => i + 1);
            return 0;
          } else {
            setShow(false);
            return 100;
          }
        }
        return p + 4;
      });
    }, STORY_DURATION / 25);
    return () => clearInterval(timerRef.current);
  }, [show, idx, slides.length]);

  // Prevent background scroll
  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  // Manual controls
  const next = (e) => {
    e && e.stopPropagation();
    clearInterval(timerRef.current);
    if (idx < slides.length - 1) {
      setIdx(idx + 1);
      setProgress(0);
    } else {
      setShow(false);
    }
  };
  const prev = (e) => {
    e && e.stopPropagation();
    clearInterval(timerRef.current);
    if (idx > 0) {
      setIdx(idx - 1);
      setProgress(0);
    }
  };
  const close = (e) => {
    e && e.stopPropagation();
    setShow(false);
    setIdx(0);
    setProgress(0);
    clearInterval(timerRef.current);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!show) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line
  }, [show, idx, slides.length]);

  // Portal modal content
  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col justify-center items-center overflow-x-hidden">
      {/* Progress Bar */}
      <div className="flex gap-2 w-full px-6 pt-8 fixed top-0 left-0 z-10">
        {slides.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full bg-gray-800 overflow-hidden"
          >
            <div
              className="h-2 bg-white rounded-full transition-all duration-100"
              style={{
                width: i < idx ? "100%" : i === idx ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>
      {/* Close Button */}
      <button
        onClick={close}
        className="fixed top-5 right-5 z-20 bg-black/70 hover:bg-black text-white font-bold rounded-full w-12 h-12 flex items-center justify-center text-3xl focus:outline-none"
        aria-label="Close"
      >
        ×
      </button>
      {/* Slide Content */}
      <div
        className="flex-1 flex flex-col justify-center items-center w-full px-2 sm:px-4"
        onClick={next}
        style={{ cursor: "pointer" }}
      >
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center px-2 sm:px-6">
          <div
            className="text-3xl sm:text-4xl font-bold text-white mb-6 mt-8 text-center drop-shadow-lg"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
          >
            {slides[idx].title}
          </div>
          <div
            className="text-lg sm:text-2xl text-white font-mono text-center drop-shadow-lg"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
          >
            {slides[idx].desc}
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="fixed bottom-8 left-0 right-0 flex items-center justify-between px-10 z-20 pointer-events-none">
        <button
          onClick={prev}
          disabled={idx === 0}
          className={`pointer-events-auto rounded-full w-14 h-14 flex items-center justify-center text-3xl font-bold border border-white bg-black/70 hover:bg-black text-white transition focus:outline-none ${
            idx === 0 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label="Previous"
          tabIndex={idx === 0 ? -1 : 0}
          style={{ userSelect: "none" }}
        >
          &#8592;
        </button>
        <button
          onClick={next}
          disabled={idx === slides.length - 1}
          className={`pointer-events-auto rounded-full w-14 h-14 flex items-center justify-center text-3xl font-bold border border-white bg-black/70 hover:bg-black text-white transition focus:outline-none ${
            idx === slides.length - 1 ? "opacity-50 cursor-not-allowed" : ""
          }`}
          aria-label="Next"
          tabIndex={idx === slides.length - 1 ? -1 : 0}
          style={{ userSelect: "none" }}
        >
          &#8594;
        </button>
      </div>
      {/* Responsive tweaks */}
      <style>{`
        @media (max-width: 600px) {
          .max-w-2xl { max-width: 96vw !important; }
          .text-3xl { font-size: 1.5rem; }
          .text-lg { font-size: 1rem; }
        }
        .pointer-events-auto:active { outline: none; }
      `}</style>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className={
          buttonClass ||
          "inline-flex items-center gap-2 px-6 py-2 rounded-full border border-black bg-white text-black font-bold font-mono shadow hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black transition"
        }
        onClick={() => {
          setShow(true);
          setIdx(0);
          setProgress(0);
        }}
      >
        {icon && (
          <svg
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mr-1"
          >
            <circle cx="9" cy="9" r="8" />
            <polygon points="7,6 13,9 7,12" fill="currentColor" />
          </svg>
        )}
        {buttonLabel}
      </button>
      {show &&
        createPortal(
          modalContent,
          document.getElementById("root") // or document.body or a ModalRoot if you want
        )}
    </>
  );
}
