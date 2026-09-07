// src/redux/actions/profile.js
import api from "../../services/apis";
import { AUTH_ACTION_TYPES } from './authentication';

export const UPDATE_PROFILE_REQUEST = 'UPDATE_PROFILE_REQUEST';
export const UPDATE_PROFILE_SUCCESS = 'UPDATE_PROFILE_SUCCESS';
export const UPDATE_PROFILE_FAILURE = 'UPDATE_PROFILE_FAILURE';
export const UPDATE_DRIVER_PROFILE_REQUEST = 'UPDATE_DRIVER_PROFILE_REQUEST';
export const UPDATE_DRIVER_PROFILE_SUCCESS = 'UPDATE_DRIVER_PROFILE_SUCCESS';
export const UPDATE_DRIVER_PROFILE_FAILURE = 'UPDATE_DRIVER_PROFILE_FAILURE';

// Action to update user in auth state
const updateUserInAuth = (userData) => ({
  type: AUTH_ACTION_TYPES.UPDATE_USER,
  payload: userData
});

export const updatePassengerProfile = (profileData) => async (dispatch, getState) => {
  try {
    dispatch({ type: UPDATE_PROFILE_REQUEST });
    
    const token = getState().auth.token;
    const state = getState();
    const currentUser = state.auth.user;
    
    // Prepare the data for the API
    const updateData = {
      full_name: profileData.full_name,
      address: profileData.address,
      date_of_birth: profileData.date_of_birth,
      gender: profileData.gender,
      phone_number: profileData.phone_number,
      next_of_kin_name: profileData.next_of_kin_name,
      next_of_kin_relationship: profileData.next_of_kin_relationship,
      emergency_contact: profileData.emergency_contact,
      blood_group: profileData.blood_group,
      health_conditions: profileData.health_conditions,
      nin: profileData.nin
    };
    
    const response = await api.put('/profile/me', updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Update user profile in auth state with the response
    // The response contains the updated user profile with profile_complete: true
    const updatedUser = {
      ...currentUser,
      ...response.data,
      profile_complete: true // Ensure this is set
    };
    
    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.data
    });
    
    // Update user in auth state
    dispatch(updateUserInAuth(updatedUser));
    
    // Update user in localStorage
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedStoredUser = { 
        ...storedUser, 
        ...response.data,
        profile_complete: true 
      };
      localStorage.setItem('user', JSON.stringify(updatedStoredUser));
      
      // Also update the user object in the auth state stored in localStorage if needed
      const authState = JSON.parse(localStorage.getItem('auth') || '{}');
      if (authState.user) {
        authState.user = { ...authState.user, ...response.data, profile_complete: true };
        localStorage.setItem('auth', JSON.stringify(authState));
      }
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }
    
    return response.data;
  } catch (error) {
    dispatch({
      type: UPDATE_PROFILE_FAILURE,
      payload: error.response?.data?.detail || 'Failed to update profile'
    });
    throw error;
  }
};

export const updateDriverProfile = (profileData) => async (dispatch, getState) => {
  try {
    dispatch({ type: UPDATE_DRIVER_PROFILE_REQUEST });
    
    const token = getState().auth.token;
    const state = getState();
    const currentUser = state.auth.user;
    
    // First, update the driver profile
    const driverResponse = await api.put('/profile/driver', {
      license_number: profileData.licenseNumber,
      license_expiry_date: profileData.licenseExpiryDate
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Then update the user profile
    const userUpdateData = {
      full_name: profileData.full_name,
      address: profileData.address,
      date_of_birth: profileData.date_of_birth,
      gender: profileData.gender,
      phone_number: profileData.phone_number,
      next_of_kin_name: profileData.next_of_kin_name,
      next_of_kin_relationship: profileData.next_of_kin_relationship,
      emergency_contact: profileData.emergency_contact,
      blood_group: profileData.blood_group,
      health_conditions: profileData.health_conditions,
      nin: profileData.nin
    };
    
    const userResponse = await api.put('/profile/me', userUpdateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Combine responses
    const combinedData = {
      ...userResponse.data,
      ...driverResponse.data,
      profile_complete: true
    };
    
    dispatch({
      type: UPDATE_DRIVER_PROFILE_SUCCESS,
      payload: combinedData
    });
    
    // Update user in auth state
    const updatedUser = {
      ...currentUser,
      ...combinedData,
      profile_complete: true
    };
    dispatch(updateUserInAuth(updatedUser));
    
    // Update user in localStorage
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedStoredUser = { 
        ...storedUser, 
        ...combinedData,
        profile_complete: true 
      };
      localStorage.setItem('user', JSON.stringify(updatedStoredUser));
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }
    
    return combinedData;
  } catch (error) {
    dispatch({
      type: UPDATE_DRIVER_PROFILE_FAILURE,
      payload: error.response?.data?.detail || 'Failed to update driver profile'
    });
    throw error;
  }
};