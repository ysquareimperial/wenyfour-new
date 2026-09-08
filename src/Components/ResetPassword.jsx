// src/Components/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconLock, IconAlert, IconEye, IconEyeOff } from '../icons';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { resetPassword, errorMessage, clearError } = useAuth();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
    return () => {
      clearError();
    };
  }, [navigate, token, clearError]);

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setPasswordError('');

    const error = validatePassword(newPassword);
    if (error) {
      setPasswordError(error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      setResetSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      // Error is already surfaced via errorMessage from context
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (!token) {
    return null;
  }

  // Helper to get message as string
  const getMessage = (msg) => {
    if (!msg) return '';
    if (typeof msg === 'string') return msg;
    if (typeof msg === 'object' && msg.message) return msg.message;
    if (typeof msg === 'object' && msg.detail) return msg.detail;
    return String(msg);
  };

  return (
    <div className="reset_password_container">
      <div className="reset_password_card">
        <button className="back_btn" onClick={handleBackToLogin}>← Back</button>

        <h2 className="reset_title">Create new password</h2>
        <p className="reset_subtitle">
          Your new password must be at least 6 characters.
        </p>

        {errorMessage && !resetSuccess && (
          <div className="auth_alert error">
            <IconAlert />
            <span>{getMessage(errorMessage)}</span>
          </div>
        )}

        {resetSuccess && (
          <div className="auth_alert success">
            <span>✅ Password reset successful!</span>
          </div>
        )}

        {!resetSuccess ? (
          <form onSubmit={handleSubmit}>
            <div className="field_group">
              <label className="field_label">New password</label>
              <div className="input_wrap">
                <span className="input_icon"><IconLock /></span>
                <input
                  className="input_field with_icon with_trailing"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input_trailing_btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Confirm password</label>
              <div className="input_wrap">
                <span className="input_icon"><IconLock /></span>
                <input
                  className="input_field with_icon with_trailing"
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="input_trailing_btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {passwordError && (
                <div className="field_error">{passwordError}</div>
              )}
            </div>

            <div className="password_requirements">
              <p className="requirement_title">Password must:</p>
              <ul>
                <li className={newPassword.length >= 6 ? 'met' : ''}>
                  • Be at least 6 characters
                </li>
                <li className={newPassword && confirmPassword && newPassword === confirmPassword ? 'met' : ''}>
                  • Match confirmation
                </li>
              </ul>
            </div>

            <button className="auth_submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Reset password'}
            </button>
          </form>
        ) : (
          <div className="success_state">
            <p>Password reset successful!</p>
            <p className="redirect_text">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;