// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignUpp from './Components/SignUpp';
import ResetPassword from './Components/ResetPassword';
import ForgotPassword from './Components/ForgotPassword';
import VerifyEmail from './Components/VerifyEmail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<SignUpp />} />
      <Route path="/login" element={<SignUpp />} />
      <Route path="/signup" element={<SignUpp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;