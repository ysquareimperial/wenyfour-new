// src/redux/actions/profile.js
import api from "../../services/apis";

export const UPDATE_PROFILE_REQUEST = 'UPDATE_PROFILE_REQUEST';
export const UPDATE_PROFILE_SUCCESS = 'UPDATE_PROFILE_SUCCESS';
export const UPDATE_PROFILE_FAILURE = 'UPDATE_PROFILE_FAILURE';
export const UPDATE_DRIVER_PROFILE_REQUEST = 'UPDATE_DRIVER_PROFILE_REQUEST';
export const UPDATE_DRIVER_PROFILE_SUCCESS = 'UPDATE_DRIVER_PROFILE_SUCCESS';
export const UPDATE_DRIVER_PROFILE_FAILURE = 'UPDATE_DRIVER_PROFILE_FAILURE';

export const updatePassengerProfile = (profileData) => async (dispatch, getState) => {
  try {
    dispatch({ type: UPDATE_PROFILE_REQUEST });
    
    const token = getState().auth.token;
    const response = await api.put('/profile/me', profileData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Update user profile in auth state
    dispatch({
      type: UPDATE_PROFILE_SUCCESS,
      payload: response.data
    });
    
    // Update user in localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...user, profile_complete: true };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
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
    
    // First, update the driver profile
    const driverResponse = await api.put('/profile/driver', {
      license_number: profileData.licenseNumber,
      license_expiry_date: profileData.licenseExpiryDate
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Then update the user profile if needed
    if (profileData.full_name || profileData.address) {
      await api.put('/profile/me', {
        full_name: profileData.full_name,
        address: profileData.address,
        date_of_birth: profileData.date_of_birth,
        next_of_kin_name: profileData.next_of_kin_name,
        next_of_kin_relationship: profileData.next_of_kin_relationship,
        emergency_contact: profileData.emergency_contact,
        blood_group: profileData.blood_group,
        health_conditions: profileData.health_conditions,
        nin: profileData.nin
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
    
    dispatch({
      type: UPDATE_DRIVER_PROFILE_SUCCESS,
      payload: driverResponse.data
    });
    
    // Update user in localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = { ...user, profile_complete: true };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return driverResponse.data;
  } catch (error) {
    dispatch({
      type: UPDATE_DRIVER_PROFILE_FAILURE,
      payload: error.response?.data?.detail || 'Failed to update driver profile'
    });
    throw error;
  }
};