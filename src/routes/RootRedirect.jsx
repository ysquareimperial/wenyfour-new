// src/routes/RootRedirect.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/authRedirect";

// Used for unknown paths ("*"). Sends logged-out users to /login and
// logged-in users to wherever they belong (complete-profile or home).
export default function RootRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getHomePath(user)} replace />;
}