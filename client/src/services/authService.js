import { apiRequest } from "./api.js";

const AUTH_BASE = "auth";

export const authService = {
  // Phase 14: Register a new account.
  register(userData) {
    return apiRequest(`${AUTH_BASE}/register`, {
      method: "POST",
      body: userData,
    });
  },

  // Phase 15: Log in and establish a session.
  login(credentials) {
    return apiRequest(`${AUTH_BASE}/login`, {
      method: "POST",
      body: credentials,
    });
  },

  // Read the currently authenticated user.
  getCurrentUser() {
    return apiRequest(`${AUTH_BASE}/me`);
  },

  // End the current session.
  logout() {
    return apiRequest(`${AUTH_BASE}/logout`, {
      method: "POST",
    });
  },

  // Request a password-reset email.
  forgotPassword(email) {
    return apiRequest(`${AUTH_BASE}/forgot-password`, {
      method: "POST",
      body: { email },
    });
  },

  // Submit a new password and reset token.
  resetPassword(token, newPassword) {
    return apiRequest(`${AUTH_BASE}/reset-password`, {
      method: "POST",
      body: { token, newPassword },
    });
  },

  // Change password for the currently authenticated user.
  changePassword(currentPassword, newPassword) {
    return apiRequest(`${AUTH_BASE}/change-password`, {
      method: "POST",
      body: { currentPassword, newPassword },
    });
  },

  verifyEmail(token) {
    return apiRequest("auth/verify-email", {
      method: "POST",
      body: { token },
    });
  },

  resendVerificationEmail(email) {
    return apiRequest("auth/resend-verification", {
      method: "POST",
      body: { email },
    });
  },
};
