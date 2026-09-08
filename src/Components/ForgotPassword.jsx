// src/Components/ForgotPassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IconMail, IconPhone, IconAlert } from '../icons';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword, errorMessage, clearError } = useAuth();

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier) return;

    setLoading(true);
    try {
      await forgotPassword(identifier);
      setSubmitted(true);
    } catch (error) {
      // Error is already surfaced via errorMessage from context
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate('/login');

  const identifierIcon = identifier?.includes('@') ? <IconMail /> : <IconPhone />;

  // Get message as string
  const getMessage = (msg) => {
    if (!msg) return '';
    if (typeof msg === 'string') return msg;
    return msg.message || msg.detail || String(msg);
  };

  const showError = errorMessage && !submitted;

  return (
    <div className="forgot_password_container">
      <div className="forgot_password_card">
        <button className="back_btn" onClick={handleBack}>← Back</button>

        <h2 className="forgot_title">Reset password</h2>
        <p className="forgot_subtitle">
          Enter your email or phone to receive a reset link.
        </p>

        {showError && (
          <div className="auth_alert error">
            <IconAlert />
            <span>{getMessage(errorMessage)}</span>
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div className="field_group">
              <label className="field_label">Email or phone</label>
              <div className="input_wrap">
                <span className="input_icon">{identifierIcon}</span>
                <input
                  className="input_field with_icon"
                  required
                  type="text"
                  placeholder="you@example.com or +234..."
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <button className="auth_submit" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="success_state">
            {/* <div className="success_icon">📧</div> */}
            <p>Check your <strong>{identifier}</strong> for the reset link.</p>
            <button
              className="link_btn"
              onClick={() => {
                setSubmitted(false);
                setIdentifier('');
              }}
            >
              Try another email/phone
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;