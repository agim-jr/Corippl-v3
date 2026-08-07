// frontend/src/components/Step1.jsx

import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

/**
 * Step1 Component
 * For collecting user's name and bio with validation feedback.
 */
const Step1 = ({ formData = {}, handleChange, errors = {} }) => {
  return (
    <div className="space-y-8">
      {/* Name Field */}
      <div className="group transition-all">
        <label
          htmlFor="name"
          className="block text-base font-bold text-black mb-1 font-mono"
        >
          Your Name
        </label>
        <div className="relative mt-1">
          <input
            type="text"
            id="name"
            name="name"
            required
            autoComplete="name"
            value={formData.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
            className={`block w-full rounded-xl border px-4 py-3 text-base font-mono shadow-sm transition bg-white
              ${
                errors.name
                  ? "border-red-500 text-red-900 placeholder:text-red-400 focus:ring-red-500"
                  : "border-black text-black placeholder:text-gray-400 "
              }
               focus:outline-none`}
            placeholder="Enter your name"
            aria-describedby="name-error"
            aria-invalid={errors.name ? "true" : "false"}
            maxLength={50}
          />
          {errors.name && (
            <ExclamationCircleIcon
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 top-3 h-5 w-5 text-red-500"
            />
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400 font-mono">
          What should we call you? (Max 50 characters)
        </div>
        {errors.name && (
          <p
            id="name-error"
            className="mt-2 text-sm text-red-600 flex items-center gap-1 font-mono"
          >
            <ExclamationCircleIcon className="h-4 w-4 text-red-400" />
            {errors.name}
          </p>
        )}
      </div>

      {/* Bio Field */}
      <div className="group transition-all">
        <label
          htmlFor="bio"
          className="block text-base font-bold text-black mb-1 font-mono"
        >
          Bio
        </label>
        <div className="relative mt-1">
          <textarea
            id="bio"
            name="bio"
            required
            value={formData.bio || ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            className={`block w-full rounded-xl border px-4 py-3 text-base font-mono shadow-sm transition bg-white placeholder:text-gray-400
              ${
                errors.bio
                  ? "border-red-500 text-red-900 placeholder:text-red-400 focus:ring-red-500"
                  : "border-black text-black "
              }
            `}
            placeholder="Tell us a bit about yourself"
            rows={4}
            aria-describedby="bio-error"
            aria-invalid={!!errors.bio}
            maxLength={280}
          ></textarea>
          {errors.bio && (
            <ExclamationCircleIcon
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-red-500"
            />
          )}
        </div>
        <div className="mt-1 text-xs text-gray-400 font-mono">
          Example: “Web developer. Coffee lover. Always learning. 🚀” (Max 280
          characters)
        </div>
        {errors.bio && (
          <p
            id="bio-error"
            className="mt-2 text-sm text-red-600 flex items-center gap-1 font-mono"
          >
            <ExclamationCircleIcon className="h-4 w-4 text-red-400" />
            {errors.bio}
          </p>
        )}
      </div>
      <style>
        {`
          .group :is(input, textarea) {
            transition: border 0.2s, box-shadow 0.2s;
          }
        `}
      </style>
    </div>
  );
};

export default Step1;
