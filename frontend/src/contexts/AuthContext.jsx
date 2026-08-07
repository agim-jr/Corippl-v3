// frontend/src/contexts/AuthContext.jsx
import { createContext } from "react";

export const AuthContext = createContext({
  token: null,
  user: null,
  isAdmin: false,
  isPremium: false,
  isAITier: false, // Added for AI tier status
  autopilotEnabled: false, // Added for autopilot status
  hasCompletedTour: false,
  completeTour: () => {},
  login: () => {},
  logout: () => {},
  refreshUser: () => {},
});

console.log("AuthContext Initialized with Default Values:", {
  token: null,
  user: null,
  isAdmin: false,
  isPremium: false,
  isAITier: false, // Added for AI tier status
  autopilotEnabled: false, // Added for autopilot status
  hasCompletedTour: false,
  completeTour: "Function",
  login: "Function",
  logout: "Function",
  refreshUser: "Function",
});
