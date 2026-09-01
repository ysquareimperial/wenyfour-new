// src/pages/CompleteDriverProfile.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateDriverProfile } from '../redux/actions/profile';
import { Modal, ModalBody } from 'reactstrap';
import { IconAlert, IconPerson, IconPhone, IconWheel } from '../icons';
import './CompleteProfile.css';

const CompleteDriverProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [formData, setFormData] = useState({
    // Passenger profile fields
    full_name: user?.full_name || '',
    address: user?.address || '',
    date_of_birth: user?.date_of_birth || '',
    next_of_kin_name: user?.next_of_kin_name || '',
    next_of_kin_relationship: user?.next_of_kin_relationship || '',
    emergency_contact: user?.emergency_contact || '',
    blood_group: user?.blood_group || '',
    health_conditions: user?.health_conditions || '',
    nin: user?.nin || '',
    // Driver specific fields
    license_number: '',
    license_expiry_date: '',
    license_photo: null
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const relationships = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, license_photo: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update both passenger and driver profiles
      await dispatch(updateDriverProfile({
        // Passenger profile data
        full_name: formData.full_name,
        address: formData.address,
        date_of_birth: formData.date_of_birth,
        next_of_kin_name: formData.next_of_kin_name,
        next_of_kin_relationship: formData.next_of_kin_relationship,
        emergency_contact: formData.emergency_contact,
        blood_group: formData.blood_group,
        health_conditions: formData.health_conditions,
        nin: formData.nin,
        // Driver profile data
        licenseNumber: formData.license_number,
        licenseExpiryDate: formData.license_expiry_date
      }));

      // If there's a license photo, upload it separately
      if (formData.license_photo) {
        // You'll need to implement this API call
        // await uploadLicensePhoto(formData.license_photo);
      }

      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete_profile_page driver_profile">
      <div className="complete_profile_container">
        <div className="profile_header">
          <h1>Complete Your Driver Profile</h1>
          <p>Provide your details to start driving and earning. We'll verify your information to ensure safety.</p>
        </div>

        {error && (
          <div className="auth_alert">
            <IconAlert />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth_form">
          <div className="form_section">
            <h3>Personal Information</h3>
            
            <div className="field_group">
              <label className="field_label">Full Name *</label>
              <div className="input_wrap">
                <span className="input_icon"><IconPerson /></span>
                <input
                  className="input_field with_icon"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Date of Birth</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Address</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your home address"
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Blood Group</label>
              <div className="input_wrap">
                <select
                  className="input_field"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                >
                  <option value="">Select blood group</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Health Conditions</label>
              <div className="input_wrap">
                <textarea
                  className="input_field"
                  name="health_conditions"
                  value={formData.health_conditions}
                  onChange={handleChange}
                  placeholder="Any health conditions we should know about?"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="form_section">
            <h3>Driver License Information</h3>
            
            <div className="field_group">
              <label className="field_label">License Number *</label>
              <div className="input_wrap">
                <span className="input_icon"><IconWheel /></span>
                <input
                  className="input_field with_icon"
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  required
                  placeholder="Enter your driver's license number"
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">License Expiry Date *</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="date"
                  name="license_expiry_date"
                  value={formData.license_expiry_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">License Photo</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="file"
                  name="license_photo"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
              <small className="field_hint">Upload a clear photo of your driver's license (optional for now)</small>
            </div>
          </div>

          <div className="form_section">
            <h3>Emergency Contact</h3>
            
            <div className="field_group">
              <label className="field_label">Next of Kin Name</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="text"
                  name="next_of_kin_name"
                  value={formData.next_of_kin_name}
                  onChange={handleChange}
                  placeholder="Full name of emergency contact"
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Relationship</label>
              <div className="input_wrap">
                <select
                  className="input_field"
                  name="next_of_kin_relationship"
                  value={formData.next_of_kin_relationship}
                  onChange={handleChange}
                >
                  <option value="">Select relationship</option>
                  {relationships.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Emergency Contact Number</label>
              <div className="input_wrap">
                <span className="input_icon"><IconPhone /></span>
                <input
                  className="input_field with_icon"
                  type="tel"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="Phone number for emergency contact"
                />
              </div>
            </div>
          </div>

          <div className="form_section">
            <h3>Identification</h3>
            <div className="field_group">
              <label className="field_label">NIN (National Identification Number)</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="text"
                  name="nin"
                  value={formData.nin}
                  onChange={handleChange}
                  placeholder="Enter your NIN"
                />
              </div>
              <small className="field_hint">We'll verify your NIN for security purposes.</small>
            </div>
          </div>

          <button
            className="auth_submit"
            type="submit"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Complete Driver Profile'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        centered
        className="success_modal"
        backdrop="static"
      >
        <ModalBody className="success_modal_body">
          <div className="success_icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>Driver Profile Submitted! 🚗</h3>
          <p>
            Thank you for completing your driver profile! Our team will review your information and verify your account within 24-48 hours.
          </p>
          <p className="verification_notice">
            You'll receive a notification once your account is verified. You can start accepting rides immediately after verification.
          </p>
          <button
            className="auth_submit"
            onClick={() => navigate('/driver/dashboard')}
          >
            Go to Dashboard
          </button>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default CompleteDriverProfile;