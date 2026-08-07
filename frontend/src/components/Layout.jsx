import React, { useRef, useState, useContext, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ProfileModal from "./ProfileModal";
import NotificationsModal from "./NotificationsModal";
import ContactsModal from "./ContactsModal";
import PremiumModal from "./PremiumModal";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GuidedTour from "./GuidedTour";
import ProgressModal from "./ProgressModal";

export default function Layout() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const guidedTourRef = useRef(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] =
    useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const handleProfileClick = () => setIsProfileModalOpen(true);
  const handleCloseModal = () => setIsProfileModalOpen(false);

  const handleNotificationsClick = () => setIsNotificationsModalOpen(true);
  const handleCloseNotificationsModal = () =>
    setIsNotificationsModalOpen(false);

  const handleContactsClick = () => setIsContactsModalOpen(true);
  const handleCloseContactsModal = () => setIsContactsModalOpen(false);

  const handleHelpClick = () => {
    if (guidedTourRef.current && guidedTourRef.current.startTour) {
      guidedTourRef.current.startTour();
    }
  };

  const handlePremiumClick = () => setIsPremiumModalOpen(true);
  const handleProgressClick = () => setIsProgressModalOpen(true);
  const handleCloseProgressModal = () => setIsProgressModalOpen(false);
  const handleClosePremiumModal = () => setIsPremiumModalOpen(false);

  return (
    <div className="h-screen w-full bg-white">
      <GuidedTour ref={guidedTourRef} />

      <main className="h-screen w-full bg-white overflow-y-auto">
        <Outlet />
      </main>

      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseModal}
          userId={user.id}
        />
      )}

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={handleCloseNotificationsModal}
      />

      <ContactsModal
        isOpen={isContactsModalOpen}
        onClose={handleCloseContactsModal}
      />

      <PremiumModal
        isOpen={isPremiumModalOpen}
        onClose={handleClosePremiumModal}
      />

      <ProgressModal
        isOpen={isProgressModalOpen}
        onClose={handleCloseProgressModal}
      />
    </div>
  );
}
