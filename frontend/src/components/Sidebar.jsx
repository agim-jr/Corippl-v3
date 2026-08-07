import React, { useContext, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { fetchNotifications } from "../lib/utils";
import LogoutModal from "./LogoutModal";
import { Menu, X } from "lucide-react";

const navigation = [
  {
    name: "Profile",
    tier: "free",
    description: "Manage your profile",
    shortcut: "P",
  },
  {
    name: "Contacts",
    tier: "free",
    description: "Your network connections",
    shortcut: "C",
  },
  {
    name: "Add content",
    tier: "free",
    description: "Share new content",
    shortcut: "A",
  },
  {
    name: "Notifications",
    tier: "free",
    description: "Latest updates",
    shortcut: "N",
  },
  {
    name: "Progress",
    tier: "free",
    description: "View your progress",
    shortcut: "G",
  },
  {
    name: "Premium",
    tier: "pro",
    description: "Upgrade your account",
    shortcut: "R",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Tier badge component
const TierBadge = ({ tier, isCompact = false }) => {
  const badges = {
    free: {
      label: "FREE",
      classes: "bg-gray-100 text-gray-600 border-gray-200",
      icon: "🆓",
    },
    pro: {
      label: "PRO",
      classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: "⭐",
    },
    ai: {
      label: "AI",
      classes: "bg-purple-50 text-purple-700 border-purple-200",
      icon: "🤖",
    },
  };

  const badge = badges[tier] || badges.free;

  if (isCompact) {
    return (
      <span
        className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
          badge.classes.split(" ")[0]
        } border`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold font-mono rounded border ${badge.classes}`}
    >
      <span className="text-xs">{badge.icon}</span>
      {badge.label}
    </span>
  );
};

// Activity indicator
const ActivityIndicator = ({ isActive, type = "default" }) => {
  const types = {
    default: "bg-green-400",
    warning: "bg-yellow-400",
    error: "bg-red-400",
    info: "bg-blue-400",
  };

  if (!isActive) return null;

  return (
    <span
      className={`absolute top-1 right-1 w-2 h-2 rounded-full ${types[type]} border border-white shadow-sm animate-pulse`}
    />
  );
};

export default function Sidebar({
  onProfileClick,
  onNotificationsClick,
  onContactsClick,
  onAddContentClick,
  onProgressClick,
  onPremiumClick,
  onHelpClick,
  viewMode,
  setViewMode,
}) {
  const { logout, user, isPremium } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activityStatus, setActivityStatus] = useState({
    profile: false,
    notifications: false,
    contacts: false,
    addContent: false,
    premium: false,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        const count = data.filter((notif) => !notif.is_read).length;
        setUnreadCount(count);
        setActivityStatus((prev) => ({ ...prev, notifications: count > 0 }));
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch notifications");
      });
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "p":
            e.preventDefault();
            onProfileClick();
            closeMobileMenu();
            break;
          case "c":
            e.preventDefault();
            onContactsClick();
            closeMobileMenu();
            break;
          case "a":
            e.preventDefault();
            onAddContentClick();
            closeMobileMenu();
            break;
          case "n":
            e.preventDefault();
            onNotificationsClick();
            closeMobileMenu();
            break;
          case "g":
            e.preventDefault();
            onProgressClick();
            closeMobileMenu();
            break;
          case "r":
            e.preventDefault();
            onPremiumClick();
            closeMobileMenu();
            break;
          case "h":
            e.preventDefault();
            onHelpClick();
            closeMobileMenu();
            break;
          case "q":
            e.preventDefault();
            openLogoutModal();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onProfileClick,
    onContactsClick,
    onAddContentClick,
    onNotificationsClick,
    onPremiumClick,
    onHelpClick,
  ]);

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);
  const confirmLogout = () => {
    logout();
    closeLogoutModal();
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleToggleViewMode = () => {
    console.log("🔄 Current viewMode:", viewMode);
    const newMode = viewMode === "guided" ? "dashboard" : "guided";
    console.log("🔄 Switching to:", newMode);
    setViewMode(newMode);
    localStorage.setItem("preferredViewMode", newMode);
    window.dispatchEvent(new Event("viewModeChanged"));
  };

  const renderNavButton = (
    item,
    onClick,
    dataTourId,
    svgIcon,
    additionalContent = null,
  ) => {
    const isLocked = item.tier === "pro" && !isPremium;
    const activityKey = item.name.toLowerCase().replace(" ", "");

    return (
      <div className="relative group">
        <button
          data-tour-id={dataTourId}
          onClick={() => {
            if (isLocked) {
              onPremiumClick();
            } else {
              onClick();
            }
            closeMobileMenu();
          }}
          className={`flex items-center justify-center p-3 rounded border transition-all relative focus:outline-none focus:ring-2 focus:ring-gray-300 ${
            isLocked
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-pointer hover:bg-gray-100"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-black"
          } ${isCollapsed ? "w-12" : "w-full"}`}
          aria-label={item.name}
        >
          {svgIcon}

          <ActivityIndicator
            isActive={activityStatus[activityKey]}
            type={
              item.name === "Notifications" && unreadCount > 0
                ? "warning"
                : "default"
            }
          />

          {item.tier !== "free" && <TierBadge tier={item.tier} isCompact />}

          {isLocked && (
            <svg
              className="absolute bottom-1 right-1 w-3 h-3 text-gray-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          )}

          {additionalContent}
        </button>

        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-black text-white text-xs font-mono rounded px-3 py-2 shadow-lg border border-gray-300 whitespace-nowrap">
            <div className="font-bold">{item.name}</div>
            <div className="text-gray-300 text-xs">{item.description}</div>
            <div className="flex items-center justify-between mt-1">
              <TierBadge tier={item.tier} />
              <span className="text-gray-400 ml-2">⌘{item.shortcut}</span>
            </div>
            {isLocked && (
              <div className="text-yellow-300 text-xs mt-1">
                🔒 Upgrade to unlock
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderMobileNavButton = (
    item,
    onClick,
    svgIcon,
    additionalContent = null,
  ) => {
    const isLocked = item.tier === "pro" && !isPremium;

    return (
      <button
        onClick={() => {
          if (isLocked) {
            onPremiumClick();
          } else {
            onClick();
          }
          closeMobileMenu();
        }}
        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all relative ${
          isLocked
            ? "border-gray-200 bg-gray-50 text-gray-400"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <div className="flex-shrink-0">{svgIcon}</div>
        <div className="flex-1 text-left">
          <div className="font-bold text-sm">{item.name}</div>
          <div className="text-xs text-gray-500">{item.description}</div>
        </div>
        <div className="flex items-center gap-2">
          <TierBadge tier={item.tier} />
          {isLocked && (
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          )}
        </div>
        {additionalContent}
      </button>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <div
        className={`hidden md:flex flex-col h-full bg-white border-r border-gray-300 font-mono z-50 relative transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-20"
        }`}
      >
        {/* Collapse Toggle */}
        <div className="absolute -right-3 top-4 z-10">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border border-gray-300 rounded-full p-1 text-gray-600 hover:text-black shadow-sm"
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        </div>

        {/* User Status Indicator */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  isPremium ? "bg-green-400" : "bg-gray-400"
                }`}
              />
            </div>
          </div>
          {!isCollapsed && (
            <div className="text-center mt-1">
              <div className="text-xs font-bold mb-2 text-gray-700 truncate">
                {user?.username || "User"}
              </div>
              <div className="text-xs text-gray-500">
                {isPremium ? (
                  <span className="bg-black text-white px-2 py-1 rounded-md">
                    PRO
                  </span>
                ) : (
                  <span className="bg-gray-200 text-black px-2 py-1 rounded-md">
                    FREE
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="p-2 border-b border-gray-200">
          <button
            onClick={handleToggleViewMode}
            className="w-full flex items-center justify-center gap-1 p-2 rounded border border-gray-200 bg-white hover:bg-gray-50 transition"
            title={
              viewMode === "guided" ? "Switch to Dashboard" : "Switch to Guided"
            }
          >
            <span className="text-lg">
              {viewMode === "guided" ? "🎯" : "📊"}
            </span>
          </button>
        </div>

        <nav className="flex flex-col items-center py-4 flex-1 space-y-2 relative">
          {navigation.map((item) => {
            if (item.name === "Profile") {
              return (
                <div key={item.name}>
                  {renderNavButton(
                    item,
                    onProfileClick,
                    "step2-profile",
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>,
                  )}
                </div>
              );
            }

            if (item.name === "Notifications") {
              return (
                <div key={item.name}>
                  {renderNavButton(
                    item,
                    onNotificationsClick,
                    "step2-notifications",
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>,
                    unreadCount > 0 && (
                      <span className="absolute top-0 left-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold font-mono leading-none text-white bg-red-600 rounded-full border-2 border-white shadow">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ),
                  )}
                </div>
              );
            }

            if (item.name === "Contacts") {
              return (
                <div key={item.name}>
                  {renderNavButton(
                    item,
                    onContactsClick,
                    "step2-contacts",
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                      />
                    </svg>,
                  )}
                </div>
              );
            }

            if (item.name === "Add content") {
              return (
                <div key={item.name}>
                  {renderNavButton(
                    item,
                    onAddContentClick,
                    "step2-add-content",
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>,
                  )}
                </div>
              );
            }

            if (item.name === "Premium") {
              return (
                <div key={item.name}>
                  {renderNavButton(
                    item,
                    onPremiumClick,
                    "step2-premium",
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                      />
                    </svg>,
                  )}
                </div>
              );
            }
            if (item.name === "Progress") {
              return (
                <div key={item.name}>
                  {renderNavButton(
                    item,
                    onProgressClick,
                    "step2-progress",
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                      />
                    </svg>,
                  )}
                </div>
              );
            }

            return null;
          })}

          <div className="relative group">
            <button
              onClick={onHelpClick}
              className="flex items-center justify-center p-3 rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-black transition-all relative focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Help / Tour"
              data-tour-id="step6-help-tour"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-black text-white text-xs font-mono rounded px-3 py-2 shadow-lg border border-gray-300 whitespace-nowrap">
                <div className="font-bold">Help & Tour</div>
                <div className="text-gray-300 text-xs">
                  Get help and guidance
                </div>
                <div className="text-gray-400 mt-1">⌘H</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="absolute left-20 top-2 bg-red-50 text-red-700 text-xs font-bold font-mono rounded px-3 py-1 shadow border border-red-200 z-10">
              !
            </div>
          )}

          <div className="flex-1" />

          <div className="relative group">
            <button
              onClick={openLogoutModal}
              className="flex items-center justify-center p-3 rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-black transition-all relative focus:outline-none focus:ring-2 focus:ring-gray-300"
              aria-label="Logout"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              <div className="bg-black text-white text-xs font-mono rounded px-3 py-2 shadow-lg border border-gray-300 whitespace-nowrap">
                <div className="font-bold">Logout</div>
                <div className="text-gray-300 text-xs">
                  Sign out of your account
                </div>
                <div className="text-gray-400 mt-1">⌘Q</div>
              </div>
            </div>
          </div>
        </nav>

        <LogoutModal
          isOpen={isLogoutModalOpen}
          onClose={closeLogoutModal}
          onConfirm={confirmLogout}
        />
      </div>

      {/* MOBILE HAMBURGER MENU */}
      <div className="md:hidden">
        {/* Hamburger Button - Fixed Top Right */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 right-4 z-50 p-2 bg-white border-2 border-black rounded-lg shadow-lg"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeMobileMenu}
            />

            {/* Slide-in Menu */}
            <div className="fixed top-0 right-0 bottom-0 w-80 max-w-full bg-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-200">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        isPremium ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">
                      {user?.username || "User"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isPremium ? (
                        <span className="bg-black text-white px-2 py-0.5 rounded">
                          PRO
                        </span>
                      ) : (
                        <span className="bg-gray-200 text-black px-2 py-0.5 rounded">
                          FREE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="mb-4">
                  <button
                    onClick={() => {
                      handleToggleViewMode();
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border-2 border-black bg-white hover:bg-gray-50 transition"
                  >
                    <span className="font-bold text-sm">Switch View Mode</span>
                    <span className="text-2xl">
                      {viewMode === "guided" ? "📊" : "🎯"}
                    </span>
                  </button>
                </div>

                {/* Navigation Items */}
                <div className="space-y-2 mb-4">
                  {navigation.map((item) => {
                    let svgIcon;
                    let onClick;

                    if (item.name === "Profile") {
                      onClick = onProfileClick;
                      svgIcon = (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      );
                    } else if (item.name === "Contacts") {
                      onClick = onContactsClick;
                      svgIcon = (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                          />
                        </svg>
                      );
                    } else if (item.name === "Notifications") {
                      onClick = onNotificationsClick;
                      svgIcon = (
                        <div className="relative">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                          </svg>
                          {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold font-mono leading-none text-white bg-red-600 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    } else if (item.name === "Add content") {
                      onClick = onAddContentClick;
                      svgIcon = (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      );
                    } else if (item.name === "Progress") {
                      onClick = onProgressClick;
                      svgIcon = (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                          />
                        </svg>
                      );
                    } else if (item.name === "Premium") {
                    } else if (item.name === "Premium") {
                      onClick = onPremiumClick;
                      svgIcon = (
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          />
                        </svg>
                      );
                    }

                    return (
                      <div key={item.name}>
                        {renderMobileNavButton(item, onClick, svgIcon)}
                      </div>
                    );
                  })}
                </div>

                {/* Help Button */}
                <button
                  onClick={() => {
                    onHelpClick();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition mb-2"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">Help & Tour</div>
                    <div className="text-xs text-gray-500">
                      Get help and guidance
                    </div>
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    openLogoutModal();
                    closeMobileMenu();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">Logout</div>
                    <div className="text-xs text-red-600">
                      Sign out of your account
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={closeLogoutModal}
        onConfirm={confirmLogout}
      />
    </>
  );
}
