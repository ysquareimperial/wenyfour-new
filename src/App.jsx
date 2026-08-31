// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import SignUpp from './Components/SignUpp';
import ResetPassword from './Components/ResetPassword';
import ForgotPassword from './Components/ForgotPassword';
import VerifyEmail from './Components/VerifyEmail';
import SearchRide from './pages/SearchRide';
import { ProfileGuard } from './Components/ProfileGuard';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import CompletePassengerProfile from './pages/CompletePassengerProfile';
import CompleteDriverProfile from './pages/CompleteDriverProfile';

function App() {
  const user = useSelector((state) => state.auth.user);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const loading = useSelector((state) => state.auth.loading);

  // Protected Route wrapper with profile check
  const ProtectedRoute = ({ children, roles = [] }) => {
    if (loading) {
      return <div>Loading...</div>; // Or your loading component
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
      return <Navigate to="/" />;
    }

    // Check if profile needs completion
    if (user && !user.profile_complete) {
      const profilePath = user.role === 'passenger' 
        ? '/passenger/complete-profile' 
        : '/driver/complete-profile';
      
      // Don't redirect if already on the profile completion page
      const currentPath = window.location.pathname;
      if (currentPath !== profilePath) {
        return <Navigate to={profilePath} />;
      }
    }

    return children;
  };

  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/" element={<SignUpp />} />
      <Route path="/login" element={<SignUpp />} />
      <Route path="/signup" element={<SignUpp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Passenger Routes */}
      <Route
        path="/passenger/complete-profile"
        element={
          <ProtectedRoute roles={['passenger']}>
            <CompletePassengerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/passenger/search-ride"
        element={
          <ProtectedRoute roles={['passenger']}>
            <ProfileGuard>
              <SearchRide />
            </ProfileGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/passenger/dashboard"
        element={
          <ProtectedRoute roles={['passenger']}>
            <ProfileGuard>
              <PassengerDashboard />
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Driver Routes */}
      <Route
        path="/driver/complete-profile"
        element={
          <ProtectedRoute roles={['driver']}>
            <CompleteDriverProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute roles={['driver']}>
            <ProfileGuard>
              <DriverDashboard />
            </ProfileGuard>
          </ProtectedRoute>
        }
      />

      {/* Catch all redirect */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            user?.role === 'passenger' ? (
              <Navigate to="/passenger/dashboard" />
            ) : user?.role === 'driver' ? (
              <Navigate to="/driver/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;