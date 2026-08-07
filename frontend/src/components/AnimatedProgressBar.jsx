import React, { useEffect, useRef, useState } from "react";

/**
 * AnimatedProgressBar
 * Progress bar that animates smoothly from its previous value to the new value.
 * @param {number} value - Target progress value (0 to 100)
 * @param {string} className - Extra CSS classes
 */
const AnimatedProgressBar = ({ value, className }) => {
  const [displayed, setDisplayed] = useState(value);
  const raf = useRef();

  useEffect(() => {
    // Animate progress smoothly
    const animate = () => {
      setDisplayed((prev) => {
        if (Math.abs(prev - value) < 0.5) return value;
        return prev + (value - prev) * 0.1; // Easing
      });
      if (Math.abs(displayed - value) >= 0.5) {
        raf.current = requestAnimationFrame(animate);
      }
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line
  }, [value]);

  return (
    <div
      className={`h-2 rounded-full transition-all duration-300 ${className}`}
      style={{ width: `${displayed}%` }}
    ></div>
  );
};

export default AnimatedProgressBar;
