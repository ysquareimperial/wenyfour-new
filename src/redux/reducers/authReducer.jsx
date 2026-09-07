// src/redux/reducers/authReducer.js
import { AUTH_ACTION_TYPES } from '../actions/authentication';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  errorMessage: null,
  successMessage: null,
  verificationSent: false,
};

export const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_ACTION_TYPES.LOGIN_REQUEST:
    case AUTH_ACTION_TYPES.SIGNUP_REQUEST:
    case AUTH_ACTION_TYPES.VERIFY_EMAIL_REQUEST:
    case AUTH_ACTION_TYPES.FORGOT_PASSWORD_REQUEST:
    case AUTH_ACTION_TYPES.RESET_PASSWORD_REQUEST:
    case AUTH_ACTION_TYPES.RESEND_VERIFICATION_REQUEST:
      return {
        ...state,
        loading: true,
        errorMessage: null,
      };

    case AUTH_ACTION_TYPES.LOGIN_SUCCESS: {
      // Handle the login response structure
      const { data } = action.payload;
      
      // Extract user information from the response
      let userData = null;
      let token = null;
      
      if (data) {
        // If the response has the structure with roles array
        if (data.roles && data.active_role) {
          const activeRole = data.active_role;
          const roleData = data.roles.find(r => r.role === activeRole);
          
          userData = {
            id: data.user_id,
            email: data.email,
            phone_number: data.phone_number,
            role: activeRole,
            profile_complete: roleData?.profile_complete || false,
            nin_verified: roleData?.nin_verified || false,
            // Add other user fields as they become available
          };
          token = data.access_token;
        } 
        // If the response is a flat user object
        else if (data.id || data.user_id) {
          userData = {
            ...data,
            id: data.id || data.user_id,
            role: data.role || data.active_role || 'passenger',
            profile_complete: data.profile_complete || false
          };
          token = data.access_token || data.token;
        }
      }
      
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: userData,
        token: token || state.token,
        errorMessage: null,
        successMessage: null,
      };
    }

    case AUTH_ACTION_TYPES.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };

    case AUTH_ACTION_TYPES.SIGNUP_SUCCESS:
      return {
        ...state,
        loading: false,
        verificationSent: true,
        errorMessage: null,
        successMessage: action.payload.message,
      };

    case AUTH_ACTION_TYPES.VERIFY_EMAIL_SUCCESS:
      return {
        ...state,
        loading: false,
        verificationSent: false,
        successMessage: action.payload.message,
        errorMessage: null,
      };

    case AUTH_ACTION_TYPES.FORGOT_PASSWORD_SUCCESS:
    case AUTH_ACTION_TYPES.RESET_PASSWORD_SUCCESS:
    case AUTH_ACTION_TYPES.RESEND_VERIFICATION_SUCCESS:
      return {
        ...state,
        loading: false,
        successMessage: action.payload,
        errorMessage: null,
      };

    case AUTH_ACTION_TYPES.LOGIN_FAILURE:
    case AUTH_ACTION_TYPES.SIGNUP_FAILURE:
    case AUTH_ACTION_TYPES.VERIFY_EMAIL_FAILURE:
    case AUTH_ACTION_TYPES.FORGOT_PASSWORD_FAILURE:
    case AUTH_ACTION_TYPES.RESET_PASSWORD_FAILURE:
    case AUTH_ACTION_TYPES.RESEND_VERIFICATION_FAILURE:
      return {
        ...state,
        loading: false,
        errorMessage: typeof action.payload === 'string' 
          ? action.payload 
          : action.payload?.detail || 'An error occurred',
      };

    case AUTH_ACTION_TYPES.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        errorMessage: null,
        successMessage: null,
        verificationSent: false,
      };

    case AUTH_ACTION_TYPES.CLEAR_AUTH_ERROR:
      return {
        ...state,
        errorMessage: null,
      };

    case AUTH_ACTION_TYPES.CLEAR_AUTH_MESSAGE:
      return {
        ...state,
        successMessage: null,
      };

    default:
      return state;
  }
};  