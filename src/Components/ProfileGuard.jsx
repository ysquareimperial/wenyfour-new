// src/components/ProfileGuard.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const ProfileGuard = ({ children }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    if (!loading && user) {
      // Check if profile is complete
      if (!user.profile_complete) {
        // Redirect to appropriate profile completion page
        if (user.role === 'passenger') {
          navigate('/passenger/complete-profile');
        } else if (user.role === 'driver') {
          navigate('/driver/complete-profile');
        }
      }
    }
  }, [user, loading, navigate]);

  // If loading or profile is complete, render children
  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.profile_complete) {
    return children;
  }

  return null;
};