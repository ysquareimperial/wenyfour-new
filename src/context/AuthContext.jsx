// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import api from "../services/apis";
import { SESSION_EXPIRED_EVENT, parseErrorDetail } from "../services/http";

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
  if (!error?.response) {
    return "Can't reach the server. Check your connection and try again.";
  }
  return parseErrorDetail(data) || "Something went wrong. Please try again.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() =>
    localStorage.getItem("access_token"),
  );
  const [errorMessage, setErrorMessage] = useState(null);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const persistToken = (nextToken) => {
    localStorage.setItem("access_token", nextToken);
    setToken(nextToken);
  };

  const persistUser = (nextUser) => {
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");
    setUser(nextUser);
  };

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

  // Only phone numbers have a resend endpoint (POST /resend-otp).
  const resendVerification = useCallback(async (identifier) => {
    if (isEmail(identifier)) {
      throw new Error(
        "Resending isn't available for email sign-ups yet. Check your inbox and spam folder.",
      );
    }
    const { data } = await api.post("/resend-otp", { phone_number: identifier });
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

  const resetPassword = useCallback(
    async ({ token: resetToken, newPassword }) => {
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
    },
    [],
  );

  const updateProfile = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  // Re-fetch the profile from the API and update local state + localStorage.
  // Useful after uploading a license photo, since the response shape matches
  // GET /profile/me.
  const refreshProfile = useCallback(async () => {
    const { data: profile } = await api.get("/profile/me");
    const nextUser = {
      ...profile,
      nin_verified: profile.nin_verification_status === "verified",
    };
    persistUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("verification_identifier");
    setUser(null);
    setToken(null);
  }, []);

  // Any 401 from the API (axios or fetch helper) signs the user out so the
  // router sends them to /login instead of leaving a broken session.
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  // The cached user can go stale (e.g. an admin verifies the NIN). Refresh
  // once on load so eligibility checks use current data.
  useEffect(() => {
    if (!localStorage.getItem("access_token")) return;
    refreshProfile().catch(() => {
      /* 401 is handled by the expiry listener; ignore network blips */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    refreshProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
