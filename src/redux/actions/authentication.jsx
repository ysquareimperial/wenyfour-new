// src/redux/actions/authentication.js
import api from "../../services/apis";

// Action Types
export const AUTH_ACTION_TYPES = {
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SIGNUP_REQUEST: 'SIGNUP_REQUEST',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE: 'SIGNUP_FAILURE',
  VERIFY_EMAIL_REQUEST: 'VERIFY_EMAIL_REQUEST',
  VERIFY_EMAIL_SUCCESS: 'VERIFY_EMAIL_SUCCESS',
  VERIFY_EMAIL_FAILURE: 'VERIFY_EMAIL_FAILURE',
  FORGOT_PASSWORD_REQUEST: 'FORGOT_PASSWORD_REQUEST',
  FORGOT_PASSWORD_SUCCESS: 'FORGOT_PASSWORD_SUCCESS',
  FORGOT_PASSWORD_FAILURE: 'FORGOT_PASSWORD_FAILURE',
  RESET_PASSWORD_REQUEST: 'RESET_PASSWORD_REQUEST',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  RESET_PASSWORD_FAILURE: 'RESET_PASSWORD_FAILURE',
  RESEND_VERIFICATION_REQUEST: 'RESEND_VERIFICATION_REQUEST',
  RESEND_VERIFICATION_SUCCESS: 'RESEND_VERIFICATION_SUCCESS',
  RESEND_VERIFICATION_FAILURE: 'RESEND_VERIFICATION_FAILURE',
  CLEAR_AUTH_ERROR: 'CLEAR_AUTH_ERROR',
  CLEAR_AUTH_MESSAGE: 'CLEAR_AUTH_MESSAGE',
};

// Helper function to check if identifier is email
const isEmail = (identifier) => {
  if (!identifier) return false;
  return identifier.includes('@');
};

// Action Creators
export const login = (credentials) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.LOGIN_REQUEST });
  try {
    // Prepare the request body based on identifier type
    const requestBody = {
      password: credentials.password,
    };

    // Check if identifier is email or phone
    if (isEmail(credentials.identifier)) {
      requestBody.email = credentials.identifier;
    } else {
      requestBody.phone_number = credentials.identifier;
    }

    // Make the API call with the properly formatted body
    const response = await api.post('/auth/login', requestBody);
    
    const { access_token, user } = response.data;
    
    if (access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    dispatch({
      type: AUTH_ACTION_TYPES.LOGIN_SUCCESS,
      payload: { user },
    });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data);
    const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.';
    dispatch({
      type: AUTH_ACTION_TYPES.LOGIN_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const signup = (userData) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.SIGNUP_REQUEST });
  try {
    const requestBody = {
      password: userData.password,
      role: userData.role,
    };

    if (isEmail(userData.identifier)) {
      requestBody.email = userData.identifier;
    } else {
      requestBody.phone_number = userData.identifier;
    }

    const response = await api.post('/users', requestBody);
    
    dispatch({
      type: AUTH_ACTION_TYPES.SIGNUP_SUCCESS,
      payload: { message: 'Verification code sent', user: response.data },
    });
    return response.data;
  } catch (error) {
    console.error('Signup error:', error.response?.data);
    const errorMessage = error.response?.data?.detail || 'Signup failed';
    dispatch({
      type: AUTH_ACTION_TYPES.SIGNUP_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

// src/redux/actions/authentication.js

export const verifyOtp = (data) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.VERIFY_EMAIL_REQUEST });
  try {
    // Use the correct endpoint - /verify-otp
    const response = await api.post('/verify-otp', {
      phone_number: data.identifier,
      otp: data.otp,
    });
    
    dispatch({
      type: AUTH_ACTION_TYPES.VERIFY_EMAIL_SUCCESS,
      payload: { 
        message: response.data.message || 'Phone number verified successfully',
        verified: true 
      },
    });
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error.response?.data);
    const errorMessage = error.response?.data?.detail || 'Verification failed. Please check your code.';
    dispatch({
      type: AUTH_ACTION_TYPES.VERIFY_EMAIL_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const verifyEmail = (token) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.VERIFY_EMAIL_REQUEST });
  try {
    const response = await api.post(`/verify-email?token=${token}`);
    dispatch({
      type: AUTH_ACTION_TYPES.VERIFY_EMAIL_SUCCESS,
      payload: { message: response.data.message || 'Email verified successfully' },
    });
    return response.data;
  } catch (error) {
    console.error('Verify email error:', error.response?.data);
    const errorMessage = error.response?.data?.detail || 'Verification failed';
    dispatch({
      type: AUTH_ACTION_TYPES.VERIFY_EMAIL_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const forgotPassword = (data) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.FORGOT_PASSWORD_REQUEST });
  try {
    const requestBody = {};
    
    if (isEmail(data.identifier)) {
      requestBody.email = data.identifier;
    } else {
      requestBody.phone_number = data.identifier;
    }

    console.log('Forgot password request:', requestBody);

    const response = await api.post('/forgot-password', requestBody);
    
    console.log('Forgot password response:', response.data);
    
    // Extract the message from the response
    let message = 'Reset link sent successfully';
    if (typeof response.data === 'string') {
      message = response.data;
    } else if (response.data && typeof response.data === 'object') {
      message = response.data.message || response.data.detail || 'Reset link sent successfully';
    }
    
    dispatch({
      type: AUTH_ACTION_TYPES.FORGOT_PASSWORD_SUCCESS,
      payload: message,
    });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error response:', error.response?.data);
    
    let errorMessage = 'Failed to send reset link';
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.response.data.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      }
    }
    
    dispatch({
      type: AUTH_ACTION_TYPES.FORGOT_PASSWORD_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const resetPassword = (data) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.RESET_PASSWORD_REQUEST });
  try {
    const response = await api.post('/reset-password', {
      token: data.token,
      new_password: data.newPassword,
    });
    
    let message = 'Password reset successfully';
    if (typeof response.data === 'string') {
      message = response.data;
    } else if (response.data && typeof response.data === 'object') {
      message = response.data.message || response.data.detail || 'Password reset successfully';
    }
    
    dispatch({
      type: AUTH_ACTION_TYPES.RESET_PASSWORD_SUCCESS,
      payload: message,
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error.response?.data);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to reset password';
    dispatch({
      type: AUTH_ACTION_TYPES.RESET_PASSWORD_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const resendVerification = (data) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.RESEND_VERIFICATION_REQUEST });
  try {
    const requestBody = {};
    
    if (isEmail(data.identifier)) {
      requestBody.email = data.identifier;
    } else {
      requestBody.phone_number = data.identifier;
    }

    const response = await api.post('/resend-verification', requestBody);
    
    let message = 'Verification code resent successfully';
    if (typeof response.data === 'string') {
      message = response.data;
    } else if (response.data && typeof response.data === 'object') {
      message = response.data.message || response.data.detail || 'Verification code resent successfully';
    }
    
    dispatch({
      type: AUTH_ACTION_TYPES.RESEND_VERIFICATION_SUCCESS,
      payload: message,
    });
    return response.data;
  } catch (error) {
    console.error('Resend verification error:', error.response?.data);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to resend verification';
    dispatch({
      type: AUTH_ACTION_TYPES.RESEND_VERIFICATION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const logout = () => (dispatch) => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
};

export const loginFailure = (error) => ({
  type: AUTH_ACTION_TYPES.LOGIN_FAILURE,
  payload: error,
});

export const clearAuthError = () => ({
  type: AUTH_ACTION_TYPES.CLEAR_AUTH_ERROR,
});

export const clearAuthMessage = () => ({
  type: AUTH_ACTION_TYPES.CLEAR_AUTH_MESSAGE,
});