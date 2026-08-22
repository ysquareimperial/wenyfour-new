// src/Components/VerifyEmail.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, clearAuthError, clearAuthMessage } from '../redux/actions/authentication';
import { IconAlert, IconEnvelopeLarge } from '../icons';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = searchParams.get('token');
  
  const [verificationStatus, setVerificationStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('No verification token found. Please check your email link.');
      return;
    }

    const verify = async () => {
      try {
        await dispatch(verifyEmail(token));
        setVerificationStatus('success');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage(error.response?.data?.detail || 'Verification failed. Please try again.');
      }
    };

    verify();

    return () => {
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
  }, [dispatch, navigate, token]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="verify_email_container">
      <div className="verify_email_card">
        {verificationStatus === 'verifying' && (
          <>
            <div className="verify_icon_circle loading">
              <div className="spinner_large"></div>
            </div>
            <h2 className="verify_title">Verifying your email</h2>
            <p className="verify_subtitle">Please wait while we confirm your email address...</p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div className="verify_icon_circle success">
              <span className="success_icon">✓</span>
            </div>
            <h2 className="verify_title success_title">Email Verified!</h2>
            <p className="verify_subtitle">
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <div className="verify_actions">
              <button className="auth_submit" onClick={handleGoToLogin}>
                Go to Login
              </button>
            </div>
            <p className="redirect_note">Redirecting to login in a few seconds...</p>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className="verify_icon_circle error">
              <IconAlert />
            </div>
            <h2 className="verify_title error_title">Verification Failed</h2>
            <p className="verify_subtitle error_message">{errorMessage}</p>
            <div className="verify_actions">
              <button className="auth_submit" onClick={handleRetry}>
                Try Again
              </button>
              <button className="auth_submit secondary" onClick={handleGoToLogin}>
                Go to Login
              </button>
            </div>
            <p className="help_text">
              Need help? <a href="mailto:support@wenyfour.com">Contact Support</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;