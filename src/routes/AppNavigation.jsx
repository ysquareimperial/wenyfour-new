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
import CompleteProfile from "../pages/CompleteProfile";
import AddCar from "../pages/AddCar";
import PublishRide from "../pages/PublishRide";
import MyCars from "../pages/MyCars";

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
          path: "/complete-profile",
          element: (
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "/search-ride",
          element: (
            <ProtectedRoute>
              <SearchRide />
            </ProtectedRoute>
          ),
        },
        {
          path: "/cars/new",
          element: (
            <ProtectedRoute>
              <AddCar />
            </ProtectedRoute>
          ),
        },
        {
          path: "/rides/publish",
          element: (  
            <ProtectedRoute>
              <PublishRide />
            </ProtectedRoute>
          ),
        },
        {
  path: "/my-cars",
  element: (
    <ProtectedRoute>
      <MyCars />
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