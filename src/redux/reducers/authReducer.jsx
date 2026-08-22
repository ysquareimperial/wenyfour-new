// src/redux/reducers/authReducer.js
import { AUTH_ACTION_TYPES } from '../actions/authentication';

const initialState = {
  user: null,
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

    case AUTH_ACTION_TYPES.LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        errorMessage: null,
        successMessage: null,
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
        successMessage: action.payload, // Now it's a string
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
        errorMessage: action.payload, // Now it's a string
      };

    case AUTH_ACTION_TYPES.LOGOUT:
      return {
        ...state,
        user: null,
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