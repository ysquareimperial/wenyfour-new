// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomePath } from "../utils/authRedirect";

// No more role gating — every authenticated route just needs a completed
// profile. Incomplete profile -> bounced to /complete-profile. Complete
// profile wandering back to /complete-profile -> bounced to their home page.
export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isCompleteProfilePage = location.pathname === "/complete-profile";

  if (!user.profile_complete && !isCompleteProfilePage) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (user.profile_complete && isCompleteProfilePage) {
    return <Navigate to={getHomePath(user)} replace />;
  }

  return children;
}