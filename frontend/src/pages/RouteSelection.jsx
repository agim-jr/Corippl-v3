import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  LogOut,
  Users,
  Zap,
  Lock,
  Crown,
  User,
} from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";
import LogoutModal from "../components/LogoutModal";
import PremiumModal from "../components/PremiumModal";
import ProfileModal from "../components/ProfileModal";

const fontStyles = `
  @font-face {
    font-family: 'Space Mono';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/spacemono/v17/i7dPIFZifjKcF5UAWdDRUEY.ttf) format('truetype');
  }
  @font-face {
    font-family: 'Space Mono';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url(https://fonts.gstatic.com/s/spacemono/v17/i7dMIFZifjKcF5UAWdDRaPpZYFI.ttf) format('truetype');
  }

  * {
    font-family: 'Space Mono', monospace;
  }
`;

const RouteSelection = () => {
  const navigate = useNavigate();
  // ✅ ADD isPremium to destructuring
  const { logout, user, isPremium } = useContext(AuthContext);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // ✅ REMOVE these 3 lines:
  // const userTier = user?.tier || "free";
  // const canAccessCollectives = canAccessFeature(userTier, "collectives");
  // const canAccessQuickConnects = canAccessFeature(userTier, "quick_connects");

  // ✅ ADD these 2 lines instead:
  const canAccessCollectives = isPremium;
  const canAccessQuickConnects = isPremium;
  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate("/login");
  };

  const handleNavigate = (path, requiresPremium) => {
    if (requiresPremium && !isPremium) {
      // ✅ Allow preview access for both Collectives and Quick Connects
      if (path === "/app/collectives" || path === "/app/quick-connects") {
        navigate(path, { state: { isPreview: true } });
      } else {
        setIsPremiumModalOpen(true);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <style>{fontStyles}</style>
      <div className="min-h-screen relative overflow-hidden bg-white">
        {/* Dotted Grid Background */}
        <div
          className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="relative z-10 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Profile and Logout Buttons */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col gap-2 z-20">
              {/* Profile Button */}
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                title="Profile Settings"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:border-red-600 hover:text-red-600 hover:bg-red-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-12 pt-4">
              <div className="inline-flex items-center gap-2 bg-black text-white rounded-full px-5 py-2 text-sm font-bold uppercase tracking-wider mb-6 shadow-lg">
                <Zap className="w-4 h-4" />
                <span>Choose Your Path</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-gray-900 leading-tight">
                Choose Your Growth Path
              </h1>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Select the approach that matches your current stage and start
                building your audience today
              </p>
            </div>

            {/* Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Audience Pool Card - ALWAYS ACCESSIBLE */}
              <button
                onClick={() => handleNavigate("/app/pool", false)}
                className="group relative bg-white rounded-2xl p-6 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 transform hover:scale-[1.03] text-left border-2 border-black overflow-hidden"
              >
                {/* Green accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

                {/* FREE Badge */}
                <div className="absolute top-4 right-4 bg-green-100 border-2 border-green-600 rounded-full px-3 py-1">
                  <p className="text-xs font-extrabold text-green-800 uppercase tracking-wider">
                    FREE
                  </p>
                </div>

                {/* Icon Badge */}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                      Audience Pool
                    </h2>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      Start Here
                    </p>
                  </div>
                </div>

                {/* Stage Badge */}
                <div className="bg-green-50 border-2 border-green-600 rounded-lg px-3 py-2 mb-4 inline-block">
                  <p className="text-xs font-extrabold text-green-800 uppercase tracking-wider">
                    🌱 STARTING (0-100 followers)
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  Get matched with creators building similar audiences. Discover
                  genuine connections and find your first 100 true fans.
                </p>

                {/* Features */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">Smart niche matching</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">
                      Free & authentic engagement
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">
                      Find collaboration partners
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                  <span className="text-sm font-bold text-green-700 uppercase tracking-wider group-hover:gap-2 flex items-center gap-1.5 transition-all">
                    Start Discovering
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <ArrowRight className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </button>

              {/* Creator Collectives Card - PREMIUM REQUIRED */}
              <button
                onClick={() =>
                  handleNavigate("/app/collectives", !canAccessCollectives)
                }
                className={`group relative bg-white rounded-2xl p-6 shadow-2xl transition-all duration-300 text-left border-2 border-black overflow-hidden ${
                  !canAccessCollectives
                    ? "opacity-75"
                    : "hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform hover:scale-[1.03]"
                }`}
              >
                {/* Orange accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>

                {/* PREMIUM Badge or Lock */}
                {!canAccessCollectives ? (
                  <div className="absolute top-4 right-4 bg-yellow-100 border-2 border-yellow-600 rounded-full px-3 py-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-yellow-800" />
                    <p className="text-xs font-extrabold text-yellow-800 uppercase tracking-wider">
                      PREMIUM
                    </p>
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 bg-yellow-100 border-2 border-yellow-600 rounded-full px-3 py-1 flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-yellow-800" />
                    <p className="text-xs font-extrabold text-yellow-800 uppercase tracking-wider">
                      UNLOCKED
                    </p>
                  </div>
                )}

                {/* Icon Badge */}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                      Collectives
                    </h2>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      Level Up
                    </p>
                  </div>
                </div>

                {/* Stage Badge */}
                <div className="bg-orange-50 border-2 border-orange-600 rounded-lg px-3 py-2 mb-4 inline-block">
                  <p className="text-xs font-extrabold text-orange-800 uppercase tracking-wider">
                    🤝 GROWING (50+ followers)
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  Join small, matched groups for structured reciprocal support.
                  Automated schedules and tracking keep everyone accountable.
                </p>

                {/* Features */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">
                      AI-matched groups (4-8 members)
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">
                      Rotating schedules & verification
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                  {!canAccessCollectives ? (
                    <span className="text-sm font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      Upgrade to Unlock
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-orange-700 uppercase tracking-wider group-hover:gap-2 flex items-center gap-1.5 transition-all">
                      Join Groups
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      !canAccessCollectives
                        ? "bg-yellow-100"
                        : "bg-orange-100 group-hover:bg-orange-600"
                    }`}
                  >
                    {!canAccessCollectives ? (
                      <Lock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-orange-600 group-hover:text-white transition-colors" />
                    )}
                  </div>
                </div>
              </button>

              {/* Quick Connects Card - PREMIUM REQUIRED */}
              <button
                onClick={() =>
                  handleNavigate("/app/quick-connects", !canAccessQuickConnects)
                }
                className={`group relative bg-white rounded-2xl p-6 shadow-2xl transition-all duration-300 text-left border-2 border-black overflow-hidden ${
                  !canAccessQuickConnects
                    ? "opacity-75"
                    : "hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transform hover:scale-[1.03]"
                }`}
              >
                {/* Purple accent stripe */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 to-purple-600"></div>

                {/* PREMIUM Badge or Lock */}
                {!canAccessQuickConnects ? (
                  <div className="absolute top-4 right-4 bg-yellow-100 border-2 border-yellow-600 rounded-full px-3 py-1 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-yellow-800" />
                    <p className="text-xs font-extrabold text-yellow-800 uppercase tracking-wider">
                      PREMIUM
                    </p>
                  </div>
                ) : (
                  <div className="absolute top-4 right-4 bg-yellow-100 border-2 border-yellow-600 rounded-full px-3 py-1 flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-yellow-800" />
                    <p className="text-xs font-extrabold text-yellow-800 uppercase tracking-wider">
                      UNLOCKED
                    </p>
                  </div>
                )}

                {/* Icon Badge */}
                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 uppercase tracking-tight">
                      Quick Connects
                    </h2>
                    <p className="text-xs text-gray-600 uppercase tracking-wider">
                      Get Help
                    </p>
                  </div>
                </div>

                {/* Stage Badge */}
                <div className="bg-purple-50 border-2 border-purple-600 rounded-lg px-3 py-2 mb-4 inline-block">
                  <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider">
                    🚀 ALL LEVELS
                  </p>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 mb-5 leading-relaxed">
                  Request help or offer expertise. Earn tokens by helping
                  others, spend tokens to get community support.
                </p>

                {/* Features */}
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">
                      Request beta testers & advice
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">
                      Build reputation & earn tokens
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100">
                  {!canAccessQuickConnects ? (
                    <span className="text-sm font-bold text-yellow-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-4 h-4" />
                      Upgrade to Unlock
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-purple-700 uppercase tracking-wider group-hover:gap-2 flex items-center gap-1.5 transition-all">
                      Start Connecting
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      !canAccessQuickConnects
                        ? "bg-yellow-100"
                        : "bg-purple-100 group-hover:bg-purple-600"
                    }`}
                  >
                    {!canAccessQuickConnects ? (
                      <Lock className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <ArrowRight className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Help Text */}
            <div className="text-center mt-12 mb-6">
              <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto">
                <strong className="text-gray-900">
                  Not sure where to start?
                </strong>{" "}
                Begin with{" "}
                <strong className="text-green-700">Audience Pool</strong> if
                you're just getting started
                {canAccessCollectives && (
                  <>
                    , or jump into{" "}
                    <strong className="text-orange-700">Collectives</strong> if
                    you already have an established following
                  </>
                )}
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />

      {/* Premium Modal */}
      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
      />
      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={user?.id}
      />
    </>
  );
};

export default RouteSelection;
