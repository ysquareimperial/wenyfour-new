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
  UPDATE_USER_PROFILE: 'UPDATE_USER_PROFILE',
};

// Helper function to check if identifier is email
const isEmail = (identifier) => {
  if (!identifier) return false;
  return identifier.includes('@');
};

// Helper function to extract error message
const extractErrorMessage = (error) => {
  if (!error.response?.data) return 'An error occurred. Please try again.';
  
  const data = error.response.data;
  
  if (typeof data === 'string') return data;
  if (data.detail) {
    if (Array.isArray(data.detail)) {
      return data.detail.map(err => err.msg).join(', ');
    }
    return data.detail;
  }
  if (data.message) return data.message;
  if (data.error) return data.error;
  
  return 'An error occurred. Please try again.';
};

// Action Creators
export const login = (credentials) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.LOGIN_REQUEST });
  try {
    // Create form data for OAuth2 password flow
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', credentials.identifier);
    formData.append('password', credentials.password);
    formData.append('scope', '');
    formData.append('client_id', 'string');
    formData.append('client_secret', 'string');

    const response = await api.post('/auth/login', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const { access_token, user_id, active_role, roles } = response.data;
    
    // Find the active role data
    const activeRoleData = roles.find(r => r.role === active_role);
    const profileComplete = activeRoleData?.profile_complete || false;
    const ninVerified = activeRoleData?.nin_verified || false;
    
    // Build user object with all necessary fields
    const user = {
      id: user_id,
      role: active_role,
      profile_complete: profileComplete,
      nin_verified: ninVerified,
      roles: roles,
      active_role: active_role,
      // These will be populated when profile is completed
      full_name: '',
      email: '',
      phone_number: '',
      gender: '',
      address: '',
      date_of_birth: '',
      next_of_kin_name: '',
      next_of_kin_relationship: '',
      emergency_contact: '',
      blood_group: '',
      health_conditions: '',
      nin: '',
      photo_url: '',
    };
    
    // Store token and user data
    if (access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    dispatch({
      type: AUTH_ACTION_TYPES.LOGIN_SUCCESS,
      payload: { user, token: access_token },
    });
    
    return { user, access_token };
  } catch (error) {
    console.error('Login error:', error.response?.data);
    const errorMessage = extractErrorMessage(error);
    
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
    
    // Store the identifier for OTP verification
    localStorage.setItem('verification_identifier', userData.identifier);
    
    dispatch({
      type: AUTH_ACTION_TYPES.SIGNUP_SUCCESS,
      payload: { 
        message: 'Verification code sent successfully',
        identifier: userData.identifier 
      },
    });
    return response.data;
  } catch (error) {
    console.error('Signup error:', error.response?.data);
    const errorMessage = extractErrorMessage(error);
    dispatch({
      type: AUTH_ACTION_TYPES.SIGNUP_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const verifyOtp = (data) => async (dispatch) => {
  dispatch({ type: AUTH_ACTION_TYPES.VERIFY_EMAIL_REQUEST });
  try {
    const response = await api.post('/verify-otp', {
      phone_number: data.identifier,
      otp: data.otp,
    });
    
    // Store that verification is complete
    localStorage.setItem('verification_complete', 'true');
    
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
    const errorMessage = extractErrorMessage(error);
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
    const errorMessage = extractErrorMessage(error);
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

    const response = await api.post('/forgot-password', requestBody);
    
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
    const errorMessage = extractErrorMessage(error);
    
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
    const errorMessage = extractErrorMessage(error);
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
    const errorMessage = extractErrorMessage(error);
    dispatch({
      type: AUTH_ACTION_TYPES.RESEND_VERIFICATION_FAILURE,
      payload: errorMessage,
    });
    throw error;
  }
};

export const logout = () => (dispatch) => {
  // Clear all auth-related localStorage items
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('verification_identifier');
  localStorage.removeItem('verification_complete');
  
  dispatch({ type: AUTH_ACTION_TYPES.LOGOUT });
};

// Action to update user profile in Redux store
export const updateUserProfile = (userData) => ({
  type: AUTH_ACTION_TYPES.UPDATE_USER_PROFILE,
  payload: userData,
});

// Action to set profile as complete
export const setProfileComplete = () => (dispatch, getState) => {
  const state = getState();
  const currentUser = state.auth.user;
  
  if (currentUser) {
    const updatedUser = {
      ...currentUser,
      profile_complete: true,
    };
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update Redux store
    dispatch({
      type: AUTH_ACTION_TYPES.UPDATE_USER_PROFILE,
      payload: updatedUser,
    });
  }
};

// Error handling actions
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