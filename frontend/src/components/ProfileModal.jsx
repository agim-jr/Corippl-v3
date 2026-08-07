"use client";

import React, { Fragment, useState, useEffect, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  X,
  User,
  Info,
  Edit2,
  Save,
  Mail,
  Lock,
  Settings,
  Award,
  Tag,
  Heart,
  Share2,
} from "lucide-react";
import PropTypes from "prop-types";
import { AuthContext } from "../contexts/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";
import EmailPreferencesModal from "./EmailPreferencesModal";
import { CATEGORIES, INTERESTS, SOCIAL_PLATFORMS } from "../lib/constants";
import { useApi } from "../lib/api";

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

  * {
    font-family: 'Space Mono', monospace;
  }

  .profile-modal-scroll::-webkit-scrollbar {
    width: 10px;
  }
  .profile-modal-scroll::-webkit-scrollbar-thumb {
    background: #000;
    border-radius: 6px;
    border: 2px solid #fff;
  }
  .profile-modal-scroll::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 6px;
  }
  .profile-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: #000 #f3f4f6;
  }
`;

export default function ProfileModal({ isOpen, onClose, userId }) {
  const { user } = useContext(AuthContext);
  const { getContentTypes, getProfile, updateProfile } = useApi();
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    categories: [],
    interests: [],
    content_type: "",
    social_links: {},
    audience_score: null,
  });
  const [loading, setLoading] = useState(false);
  const [contentTypes, setContentTypes] = useState([]);
  const [error, setError] = useState("");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isEmailPreferencesOpen, setIsEmailPreferencesOpen] = useState(false);

  // Edit mode states
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [isEditingContentType, setIsEditingContentType] = useState(false);
  const [isEditingSocialLinks, setIsEditingSocialLinks] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      getProfile(userId)
        .then((data) => {
          console.log("🔍 RAW API RESPONSE:", data);
          const profileData = data.profile || {};
          console.log("🔍 PROFILE DATA:", profileData);
          console.log("🔍 NAME:", profileData.name);
          console.log("🔍 BIO:", profileData.bio);
          console.log("🔍 CATEGORIES:", profileData.categories);
          console.log("🔍 CONTENT TYPE:", profileData.content_type);
          console.log("🔍 INTERESTS:", profileData.interests);
          console.log("🔍 AUDIENCE SCORE:", data.audience_score);
          console.log("🔍 PROFILE AUDIENCE SCORE:", profileData.audience_score);

          setProfile({
            name: profileData.name || "",
            bio: profileData.bio || "",
            categories: profileData.categories || [],
            interests: profileData.interests || [],
            content_type: profileData.content_type || "",
            social_links: profileData.social_links || {},
            audience_score:
              typeof profileData.audience_score === "number"
                ? profileData.audience_score
                : typeof data.audience_score === "number"
                  ? data.audience_score
                  : null,
          });

          console.log("🔍 PROFILE STATE AFTER SET:", {
            name: profileData.name || "",
            bio: profileData.bio || "",
            categories: profileData.categories || [],
            content_type: profileData.content_type || "",
            interests: profileData.interests || [],
          });

          setLoading(false);
        })
        .catch((err) => {
          console.error("❌ PROFILE ERROR:", err);
          setError(err.message || "Failed to fetch profile.");
          setLoading(false);
        });

      if (contentTypes.length === 0) {
        getContentTypes()
          .then((types) => {
            console.log("🔍 CONTENT TYPES:", types);
            setContentTypes(types);
          })
          .catch((err) => {
            console.error("Failed to fetch content types:", err);
          });
      }
    }
    if (!isOpen) {
      setError("");
      setIsEditingCategories(false);
      setIsEditingInterests(false);
      setIsEditingContentType(false);
      setIsEditingSocialLinks(false);
    }
  }, [isOpen, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handleCategoriesChange = (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setProfile((p) => ({ ...p, categories: selected }));
  };

  const handleInterestsChange = (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setProfile((p) => ({ ...p, interests: selected }));
  };

  const handleSocialLinkChange = (platform, value) => {
    setProfile((p) => ({
      ...p,
      social_links: {
        ...p.social_links,
        [platform]: value.trim(),
      },
    }));
  };

  const removeSocialLink = (platform) => {
    setProfile((p) => {
      const newLinks = { ...p.social_links };
      delete newLinks[platform];
      return { ...p, social_links: newLinks };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const updated = await updateProfile(userId, profile);
      const updatedProfile = updated.profile || updated;

      setProfile({
        name: updatedProfile.name || "",
        bio: updatedProfile.bio || "",
        categories: updatedProfile.categories || [],
        interests: updatedProfile.interests || [],
        content_type: updatedProfile.content_type || "",
        social_links: updatedProfile.social_links || {},
        audience_score:
          typeof updated.audience_score === "number"
            ? updated.audience_score
            : profile.audience_score,
      });
      setLoading(false);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update profile.");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{fontStyles}</style>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Backdrop with Dotted Pattern */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm">
              <div
                className="fixed inset-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
                aria-hidden="true"
              />
            </div>
          </Transition.Child>

          {/* Container */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border-2 border-black bg-white shadow-2xl transition-all">
                  {/* Header */}
                  <div className="relative flex items-center justify-between px-6 py-5 border-b-2 border-black bg-gradient-to-r from-purple-50 to-blue-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Dialog.Title className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                          Profile Settings
                        </Dialog.Title>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Manage your account information
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-all"
                      aria-label="Close modal"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Body */}
                  <form onSubmit={handleSubmit}>
                    <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto profile-modal-scroll">
                      {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                          <div className="flex-shrink-0 mt-0.5">
                            <Info className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-1">
                              Error
                            </h3>
                            <p className="text-sm text-red-800 leading-relaxed">
                              {error}
                            </p>
                          </div>
                        </div>
                      )}

                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                      ) : (
                        <>
                          {/* Basic Information */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-4 h-4 text-gray-600" />
                              <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                                Basic Information
                              </label>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium uppercase tracking-wider text-gray-700 mb-2">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  value={profile.name}
                                  onChange={handleChange}
                                  placeholder="Enter your name"
                                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium uppercase tracking-wider text-gray-700 mb-2">
                                  Bio
                                </label>
                                <textarea
                                  name="bio"
                                  value={profile.bio}
                                  onChange={handleChange}
                                  placeholder="Tell us about yourself..."
                                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                                  rows={4}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Audience Score */}
                          {profile.audience_score !== null && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <Award className="w-4 h-4 text-gray-600" />
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                                  Audience Score
                                </label>
                              </div>
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl">
                                <div className="flex justify-between text-sm mb-3">
                                  <span className="font-medium text-gray-700">
                                    Current Score
                                  </span>
                                  <span className="font-bold text-purple-900">
                                    {profile.audience_score.toFixed(1)}/100
                                  </span>
                                </div>
                                <div className="w-full bg-white border-2 border-gray-300 rounded-full h-3 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        Math.min(
                                          profile.audience_score ?? 0,
                                          100,
                                        ),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Categories */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-gray-600" />
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                                  Categories
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setIsEditingCategories(!isEditingCategories)
                                }
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                              >
                                <Edit2 className="w-3 h-3" />
                                {isEditingCategories ? "Cancel" : "Edit"}
                              </button>
                            </div>

                            {!isEditingCategories ? (
                              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                                {profile.categories.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {profile.categories.map((cat) => (
                                      <span
                                        key={cat}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white rounded-lg"
                                      >
                                        {cat.charAt(0).toUpperCase() +
                                          cat.slice(1)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No categories selected
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  name="categories"
                                  multiple
                                  value={profile.categories}
                                  onChange={handleCategoriesChange}
                                  required
                                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  size={4}
                                >
                                  {CATEGORIES.map((category) => (
                                    <option
                                      key={category}
                                      value={category.toLowerCase()}
                                    >
                                      {category}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 font-medium">
                                  Hold Ctrl/Cmd to select multiple
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Content Type */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-gray-600" />
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                                  Content Type
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setIsEditingContentType(!isEditingContentType)
                                }
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                              >
                                <Edit2 className="w-3 h-3" />
                                {isEditingContentType ? "Cancel" : "Edit"}
                              </button>
                            </div>

                            {!isEditingContentType ? (
                              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                                {profile.content_type ? (
                                  <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white rounded-lg">
                                    {profile.content_type
                                      .charAt(0)
                                      .toUpperCase() +
                                      profile.content_type.slice(1)}
                                  </span>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No content type selected
                                  </p>
                                )}
                              </div>
                            ) : (
                              <select
                                name="content_type"
                                value={profile.content_type}
                                onChange={handleChange}
                                required
                                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                              >
                                <option value="">Select type...</option>
                                {contentTypes.length > 0 ? (
                                  contentTypes.map((type) => (
                                    <option key={type} value={type}>
                                      {type.charAt(0).toUpperCase() +
                                        type.slice(1)}
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>Loading types...</option>
                                )}
                              </select>
                            )}
                          </div>

                          {/* Interests */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-gray-600" />
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                                  Interests
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setIsEditingInterests(!isEditingInterests)
                                }
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                              >
                                <Edit2 className="w-3 h-3" />
                                {isEditingInterests ? "Cancel" : "Edit"}
                              </button>
                            </div>

                            {!isEditingInterests ? (
                              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                                {profile.interests.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {profile.interests.map((interest) => (
                                      <span
                                        key={interest}
                                        className="inline-flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-black text-white rounded-lg"
                                      >
                                        {interest}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No interests selected
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  name="interests"
                                  multiple
                                  value={profile.interests}
                                  onChange={handleInterestsChange}
                                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  size={3}
                                >
                                  {INTERESTS.map((interest) => (
                                    <option key={interest} value={interest}>
                                      {interest}
                                    </option>
                                  ))}
                                </select>
                                <p className="text-xs text-gray-500 font-medium">
                                  Hold Ctrl/Cmd to select multiple
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Social Links */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-gray-600" />
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                                  Social Media Links
                                </label>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setIsEditingSocialLinks(!isEditingSocialLinks)
                                }
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
                              >
                                <Edit2 className="w-3 h-3" />
                                {isEditingSocialLinks ? "Cancel" : "Edit"}
                              </button>
                            </div>

                            {!isEditingSocialLinks ? (
                              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                                {Object.keys(profile.social_links || {})
                                  .length > 0 ? (
                                  <div className="space-y-2">
                                    {Object.entries(profile.social_links).map(
                                      ([platform, url]) => {
                                        if (!url) return null;
                                        const platformInfo =
                                          SOCIAL_PLATFORMS.find(
                                            (p) => p.key === platform,
                                          );
                                        return (
                                          <a
                                            key={platform}
                                            href={
                                              url.startsWith("http")
                                                ? url
                                                : `https://${url}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-all"
                                          >
                                            <span className="text-base">
                                              {platformInfo?.icon || "🔗"}
                                            </span>
                                            <span>
                                              {platformInfo?.label || platform}
                                            </span>
                                          </a>
                                        );
                                      },
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    No social links added
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                                {SOCIAL_PLATFORMS.map((platform) => (
                                  <div key={platform.key}>
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                                      <span className="text-base">
                                        {platform.icon}
                                      </span>
                                      {platform.label}
                                    </label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={
                                          profile.social_links?.[
                                            platform.key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          handleSocialLinkChange(
                                            platform.key,
                                            e.target.value,
                                          )
                                        }
                                        placeholder={platform.placeholder}
                                        className="flex-1 border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                      />
                                      {profile.social_links?.[platform.key] && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeSocialLink(platform.key)
                                          }
                                          className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-600 bg-white border-2 border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 transition-all"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                <p className="text-xs text-gray-500 font-medium mt-2">
                                  Enter full URLs or just the platform-specific
                                  part
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Save Button */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full group relative px-4 py-3 text-sm font-bold uppercase tracking-wider text-white bg-purple-600 border-2 border-purple-600 rounded-xl hover:bg-purple-700 hover:border-purple-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" />
                                {loading ? "Saving..." : "Save Profile"}
                              </span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </form>

                  {/* Footer - Quick Actions */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4 text-gray-600" />
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-900">
                        Quick Actions
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsChangePasswordOpen(true)}
                        className="group relative px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEmailPreferencesOpen(true)}
                        className="group relative px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-900 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Prefs
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Note */}
                  <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Your data is secure and private
                      </span>
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>

          {/* Child Modals */}
          <ChangePasswordModal
            isOpen={isChangePasswordOpen}
            onClose={() => setIsChangePasswordOpen(false)}
          />
          <EmailPreferencesModal
            isOpen={isEmailPreferencesOpen}
            onClose={() => setIsEmailPreferencesOpen(false)}
          />
        </Dialog>
      </Transition.Root>
    </>
  );
}

ProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userId: PropTypes.number.isRequired,
};
