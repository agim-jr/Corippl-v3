// frontend/src/lib/decodeJWT.js

/**
 * Decodes a JWT token without verifying its signature.
 * @param {string} token - The JWT token to decode.
 * @returns {object|null} The decoded payload or null if decoding fails.
 */
export const decodeJWT = (token) => {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) {
      throw new Error("Invalid JWT token: Payload missing");
    }

    // Replace URL-specific characters for base64 decoding
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");

    // Decode base64 string
    const decodedPayload = atob(base64);

    // Parse JSON
    const payload = JSON.parse(decodedPayload);

    return payload;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};
