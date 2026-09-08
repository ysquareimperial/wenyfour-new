// src/routes/AppNavigation.jsx
import { useRoutes } from "react-router-dom";

import AppIndex from "./AppIndex";
import ProtectedRoute from "./ProtectedRoute";
import RootRedirect from "./RootRedirect";

import SignUpp from "../Components/SignUpp";
import ForgotPassword from "../Components/ForgotPassword";
import ResetPassword from "../Components/ResetPassword";
import VerifyEmail from "../Components/VerifyEmail";

import SearchRide from "../pages/SearchRide";
import PassengerDashboard from "../pages/PassengerDashboard";
import DriverDashboard from "../pages/DriverDashboard";
import CompletePassengerProfile from "../pages/CompletePassengerProfile";
import CompleteDriverProfile from "../pages/CompleteDriverProfile";

function AppNavigation() {
  return useRoutes([
    // Public auth pages — no layout shell
    { path: "/login", element: <SignUpp /> },
    { path: "/signup", element: <SignUpp /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/verify-email", element: <VerifyEmail /> },

    // Everything below shares the AppIndex layout (topbar + Outlet)
    {
      element: <AppIndex />,
      children: [
        {
          path: "/passenger/complete-profile",
          element: (
            <ProtectedRoute roles={["passenger"]}>
              <CompletePassengerProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/passenger/search-ride",
          element: (
            <ProtectedRoute roles={["passenger"]}>
              <SearchRide />
            </ProtectedRoute>
          ),
        },
        {
          path: "/passenger/dashboard",
          element: (
            <ProtectedRoute roles={["passenger"]}>
              <PassengerDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "/driver/complete-profile",
          element: (
            <ProtectedRoute roles={["driver"]}>
              <CompleteDriverProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/driver/dashboard",
          element: (
            <ProtectedRoute roles={["driver"]}>
              <DriverDashboard />
            </ProtectedRoute>
          ),
        },
      ],
    },

    { path: "/", element: <RootRedirect /> },
    { path: "*", element: <RootRedirect /> },
  ]);
}

export default AppNavigation;