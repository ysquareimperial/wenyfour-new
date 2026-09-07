// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Protected Route wrapper with profile check
  const ProtectedRoute = ({ children, roles = [] }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated || !user) {
      return <Navigate to="/login" state={{ from: location }} />;
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
      return <Navigate to="/" />;
    }

    // Check if profile needs completion
    // For passengers, they need to complete profile before accessing other pages
    const profilePath = user?.role === 'passenger' 
      ? '/passenger/complete-profile' 
      : '/driver/complete-profile';
    
    const currentPath = location.pathname;
    
    // Don't redirect if already on the profile completion page
    if (currentPath === profilePath) {
      return children;
    }

    // Check if profile is complete - if not, redirect to profile completion
    if (user && !user.profile_complete) {
      return <Navigate to={profilePath} replace />;
    }

    return children;
  };

  // Route guard for passenger - redirect to search-ride instead of dashboard
  const PassengerRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated || !user) {
      return <Navigate to="/login" />;
    }

    if (user?.role !== 'passenger') {
      return <Navigate to="/" />;
    }

    // Check if profile is complete
    if (!user.profile_complete) {
      return <Navigate to="/passenger/complete-profile" replace />;
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
          <PassengerRoute>
            <ProfileGuard>
              <SearchRide />
            </ProfileGuard>
          </PassengerRoute>
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
          isAuthenticated && user ? (
            user?.role === 'passenger' ? (
              user.profile_complete ? (
                <Navigate to="/passenger/search-ride" />
              ) : (
                <Navigate to="/passenger/complete-profile" />
              )
            ) : user?.role === 'driver' ? (
              user.profile_complete ? (
                <Navigate to="/driver/dashboard" />
              ) : (
                <Navigate to="/driver/complete-profile" />
              )
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