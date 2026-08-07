// frontend/src/App.jsx
import React, { useState, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RouteSelection from "./pages/RouteSelection";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProfileBuilder from "./pages/ProfileBuilder";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AuthContext } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationsModal from "./components/NotificationsModal";
import NotAuthorized from "./pages/NotAuthorized";
import Success from "./pages/Success";
import Cancel from "./pages/Cancel";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminReport from "./pages/AdminReport";
import Checkout from "./pages/Checkout";
import OnboardingLoading from "./pages/OnboardingLoading";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactPage from "./pages/ContactPage";
import Promote from "./pages/Promote";
import EmailVerification from "./pages/EmailVerification";
import VerifyEmail from "./pages/VerifyEmail";
import QuickConnects from "./components/QuickConnects";
import PoolFeature from "./components/PoolFeature";
import GuidedWorkflow from "./components/GuidedWorkflow";
import CreatorCollectives from "./components/CreatorCollectives"; // ✅ ADD THIS

function App() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { isAuthenticated, user } = useContext(AuthContext);

  const handleNotificationsClick = () => {
    setIsNotificationsOpen(true);
  };

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false);
  };

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/app/home" replace /> : <Landing />
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/about" element={<About />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/promote" element={<Promote />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding-loading" element={<OnboardingLoading />} />

          {/* ✅ Full-width pages WITHOUT sidebar */}
          <Route path="/app/home" element={<RouteSelection />} />
          <Route path="/app/quick-connects" element={<QuickConnects />} />
          <Route path="/app/pool" element={<PoolFeature user={user} />} />
          {/* ✅ Add Cross-Promotion route */}
          <Route
            path="/app/cross-promotion"
            element={<GuidedWorkflow user={user} />}
          />
          {/* ✅ ADD Creator Collectives routes */}
          <Route
            path="/app/collectives"
            element={<CreatorCollectives isPreview={!user?.isPremium} />}
          />
          <Route
            path="/app/collectives/:groupId"
            element={<CreatorCollectives isPreview={!user?.isPremium} />}
          />

          {/* Pages WITH sidebar */}
          <Route
            path="/app"
            element={<Layout onNotificationsClick={handleNotificationsClick} />}
          >
            <Route index element={<Navigate to="/app/home" replace />} />
            <Route
              path="profile-builder"
              element={
                user && !user.has_profile_completed ? (
                  <ProfileBuilder />
                ) : (
                  <Navigate to="/app/home" replace />
                )
              }
            />
          </Route>

          <Route path="/checkout" element={<Checkout />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin-report" element={<AdminReport />} />
        </Route>

        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={handleNotificationsClose}
      />
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
