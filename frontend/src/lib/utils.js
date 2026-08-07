import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Added fetchNotifications and markNotificationAsRead functions

export async function fetchNotifications() {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BASE_URL}/notifications/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  const data = await response.json();
  return data;
}

export async function markNotificationAsRead(notificationId) {
  const token = localStorage.getItem("token");
  const response = await fetch(
    `${BASE_URL}/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }

  const data = await response.json();
  return data;
}

export async function getProfile(userId) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/profiles/${userId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to fetch profile");
  }

  const data = await response.json();
  return data;
}

export async function updateProfile(userId, profileData) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}/profiles/${userId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(profileData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update profile");
  }

  const data = await response.json();
  return data;
}

// Add Contact API Functions
