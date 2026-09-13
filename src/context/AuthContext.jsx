// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import api from "../services/apis";

const AuthContext = createContext(null);

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isEmail(value) {
  return !!value && value.includes("@");
}

function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join(", ");
  return data.detail || data.message || data.error || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [errorMessage, setErrorMessage] = useState(null);

  const clearError = useCallback(() => setErrorMessage(null), []);

  // Either argument can be omitted to leave that piece untouched — e.g.
  // persistToken(token) alone, or persistUser(user) alone.
  const persistToken = (nextToken) => {
    localStorage.setItem("access_token", nextToken);
    setToken(nextToken);
  };

  const persistUser = (nextUser) => {
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");
    setUser(nextUser);
  };

  // ---- Login -------------------------------------------------------------
  // Roles are gone, so /auth/login no longer carries per-role
  // profile_complete data — it just proves who you are. Once we have the
  // token, we fetch the actual profile (same flat shape PUT /profile/me
  // returns: profile_complete, is_passenger, is_driver, can_book_rides,
  // can_offer_rides, driver_profile, etc.) from GET /profile/me.
  //
  // NOTE: this assumes GET /profile/me exists alongside the PUT you shared.
  // If login already returns the full profile itself, this extra request is
  // unnecessary — say so and I'll simplify it back to a single call.
  const login = useCallback(async ({ identifier, password }) => {
    setErrorMessage(null);
    try {
      const formData = new URLSearchParams();
      formData.append("grant_type", "password");
      formData.append("username", identifier);
      formData.append("password", password);
      formData.append("scope", "");
      formData.append("client_id", "string");
      formData.append("client_secret", "string");

      const { data } = await api.post("/auth/login", formData.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Store the token first so the request interceptor can attach it to
      // the profile fetch below.
      persistToken(data.access_token);

      const { data: profile } = await api.get("/profile/me");
      const nextUser = {
        ...profile,
        nin_verified: profile.nin_verification_status === "verified",
      };

      persistUser(nextUser);
      return nextUser;
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      throw error;
    }
  }, []);

  // ---- Signup (sends OTP / verification email) ---------------------------
  // NOTE: this still sends `role` to POST /users, left over from before
  // roles were discarded. If that endpoint no longer takes/needs a role,
  // tell me and I'll drop it (and the role picker in SignUpp) too.
  const signup = useCallback(async ({ identifier, password, role }) => {
    setErrorMessage(null);
    try {
      const body = { password, role };
      if (isEmail(identifier)) body.email = identifier;
      else body.phone_number = identifier;

      const { data } = await api.post("/users", body);
      return data;
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      throw error;
    }
  }, []);

  const verifyOtp = useCallback(async ({ identifier, otp }) => {
    setErrorMessage(null);
    try {
      const { data } = await api.post("/verify-otp", {
        phone_number: identifier,
        otp,
      });
      return data;
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      throw error;
    }
  }, []);

  const resendVerification = useCallback(async (identifier) => {
    const body = {};
    if (isEmail(identifier)) body.email = identifier;
    else body.phone_number = identifier;
    const { data } = await api.post("/resend-verification", body);
    return data;
  }, []);

  const verifyEmail = useCallback(async (emailToken) => {
    const { data } = await api.post(`/verify-email?token=${emailToken}`);
    return data;
  }, []);

  const forgotPassword = useCallback(async (identifier) => {
    setErrorMessage(null);
    try {
      const body = {};
      if (isEmail(identifier)) body.email = identifier;
      else body.phone_number = identifier;
      const { data } = await api.post("/forgot-password", body);
      return data;
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async ({ token: resetToken, newPassword }) => {
    setErrorMessage(null);
    try {
      const { data } = await api.post("/reset-password", {
        token: resetToken,
        new_password: newPassword,
      });
      return data;
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      throw error;
    }
  }, []);

  // Merge a patch (e.g. the response from PUT /profile/me) into the current user
  const updateProfile = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("verification_identifier");
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    errorMessage,
    clearError,
    login,
    signup,
    verifyOtp,
    resendVerification,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}