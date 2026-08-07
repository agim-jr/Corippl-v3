// frontend/src/components/TooltipDemo.jsx

"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const TooltipDemo = ({
  id = "tooltip-content",
  indicator = "dot",
  label,
  payload,
  hideLabel,
  hideIndicator,
  className,
  position,
  transformOrigin = "bottom",
}) => {
  const { top, left } = position || { top: 0, left: 0 };
  const [adjustedPosition, setAdjustedPosition] = useState({ top, left });

  // Adjust tooltip position to stay in viewport
  useEffect(() => {
    if (!position) return;
    const tooltipElement = document.getElementById(id);
    if (!tooltipElement) return;

    const tooltipHeight = tooltipElement.offsetHeight;
    const tooltipWidth = tooltipElement.offsetWidth;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    let newTop = top;
    let newLeft = left;

    if (top + tooltipHeight > windowHeight - 20) {
      newTop = Math.max(20, top - tooltipHeight - 10);
    }
    if (left + tooltipWidth / 2 > windowWidth - 20) {
      newLeft = windowWidth - tooltipWidth / 2 - 20;
    }
    if (left - tooltipWidth / 2 < 20) {
      newLeft = tooltipWidth / 2 + 20;
    }

    setAdjustedPosition({ top: newTop, left: newLeft });
  }, [top, left, id, position]);

  if (!payload?.length) return null;

  // Indicator shape
  const renderIndicator = () => {
    if (hideIndicator) return null;
    switch (indicator) {
      case "dot":
        return (
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-black mr-2"></span>
        );
      case "line":
        return (
          <span className="inline-block w-1 h-4 bg-black mr-2 rounded"></span>
        );
      case "dashed":
        return (
          <span className="inline-block w-0 border-l-2 border-dashed border-black h-4 mr-2"></span>
        );
      default:
        return null;
    }
  };

  // Tooltip content
  const tooltipContent = (
    <div
      id={id}
      role="tooltip"
      className={cn(
        "w-72 max-w-full rounded border border-black bg-white px-4 py-3 text-sm font-mono shadow-lg transition-opacity duration-200 ease-in-out",
        "opacity-100 animate-fadeIn",
        className
      )}
      style={{
        position: "fixed",
        top: adjustedPosition.top,
        left: adjustedPosition.left,
        transform: "translateX(-50%)",
        zIndex: 1000,
        pointerEvents: "auto",
        transformOrigin: transformOrigin,
      }}
    >
      {!hideLabel && (
        <div className="font-bold mb-3 flex items-center uppercase">
          {renderIndicator()}
          {label}
        </div>
      )}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <p key={index} className="text-xs font-mono">
            {item.name}: {item.value}
          </p>
        ))}
      </div>
    </div>
  );

  // Ensure tooltip root exists
  useEffect(() => {
    if (!document.getElementById("tooltip-root")) {
      const tooltipRoot = document.createElement("div");
      tooltipRoot.id = "tooltip-root";
      document.body.appendChild(tooltipRoot);
    }
    return () => {
      const root = document.getElementById("tooltip-root");
      if (root && root.childNodes.length === 0) {
        document.body.removeChild(root);
      }
    };
  }, []);

  const tooltipRoot = document.getElementById("tooltip-root");
  if (!tooltipRoot) return null;

  return createPortal(tooltipContent, tooltipRoot);
};

export default TooltipDemo;
