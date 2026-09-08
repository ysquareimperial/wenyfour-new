// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/authRedirect";

// roles: which roles may access this route at all, e.g. ["passenger"]
export default function ProtectedRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  const isCompleteProfilePage = location.pathname.endsWith("/complete-profile");

  // Profile incomplete but trying to visit anything other than the
  // complete-profile page -> send them there.
  if (!user.profile_complete && !isCompleteProfilePage) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  // Profile already complete but they wandered back to complete-profile ->
  // send them to their home page instead.
  if (user.profile_complete && isCompleteProfilePage) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}