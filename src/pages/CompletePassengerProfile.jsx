// src/pages/CompletePassengerProfile.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updatePassengerProfile } from "../redux/actions/profile";
import { Modal, ModalBody } from "reactstrap";
import {
  IconClose,
  IconAlert,
  IconPerson,
  IconMail,
  IconPhone,
  IconLock,
} from "../icons";
import "./CompleteProfile.css";

const CompletePassengerProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    address: user?.address || "",
    date_of_birth: user?.date_of_birth || "",
    gender: user?.gender || "",
    phone_number: user?.phone_number || "",
    next_of_kin_name: user?.next_of_kin_name || "",
    next_of_kin_relationship: user?.next_of_kin_relationship || "",
    emergency_contact: user?.emergency_contact || "",
    blood_group: user?.blood_group || "",
    health_conditions: user?.health_conditions || "",
    nin: user?.nin || "",
  });

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const relationships = [
    "Father",
    "Mother",
    "Spouse",
    "Brother",
    "Sister",
    "Son",
    "Daughter",
    "Uncle",
    "Aunt",
    "Cousin",
    "Nephew",
    "Niece",
    "Grandfather",
    "Grandmother",
    "Friend",
    "Other",
  ];

  const genders = ["male", "female", "other"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // src/pages/CompletePassengerProfile.jsx - Update handleSubmit

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const response = await dispatch(updatePassengerProfile(formData));
    setShowSuccessModal(true);
    // Store the response if needed for user update
    if (response) {
      // The profile update was successful
      console.log('Profile updated successfully');
    }
  } catch (err) {
    setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleSearchRide = () => {
  setShowSuccessModal(false);
  // Navigate to search ride
  navigate('/passenger/search-ride');
};

  return (
    <div className="complete_profile_page">
      <div className="complete_profile_container">
        <div className="profile_header">
          <h1>Complete Your Profile</h1>
          <p>
            Help us get to know you better. This information helps us provide a
            safer ride-sharing experience.
          </p>
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
                <span className="input_icon">
                  <IconPerson />
                </span>
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
              <label className="field_label">Gender *</label>
              <div className="input_wrap">
                <select
                  className="input_field"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select gender</option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </option>
                  ))}
                </select>
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
              <label className="field_label">Phone Number</label>
              <div className="input_wrap">
                <span className="input_icon">
                  <IconPhone />
                </span>
                <input
                  className="input_field with_icon"
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
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
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
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
                  placeholder="Any health conditions we should know about? (e.g., allergies, medical conditions)"
                  rows="3"
                />
              </div>
            </div>
          </div>

          <div className="form_section">
            <h3>Emergency Contact</h3>

            <div className="field_group">
              <label className="field_label">Next of Kin Name *</label>
              <div className="input_wrap">
                <input
                  className="input_field"
                  type="text"
                  name="next_of_kin_name"
                  value={formData.next_of_kin_name}
                  onChange={handleChange}
                  required
                  placeholder="Full name of next of kin"
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Relationship *</label>
              <div className="input_wrap">
                <select
                  className="input_field"
                  name="next_of_kin_relationship"
                  value={formData.next_of_kin_relationship}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select relationship</option>
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Emergency Contact Number *</label>
              <div className="input_wrap">
                <span className="input_icon">
                  <IconPhone />
                </span>
                <input
                  className="input_field with_icon"
                  type="tel"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  required
                  placeholder="Phone number for emergency contact"
                />
              </div>
            </div>
          </div>

          <div className="form_section">
            <h3>Identification</h3>
            <div className="field_group">
              <label className="field_label">
                NIN (National Identification Number)
              </label>
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
              <small className="field_hint">
                NIN cannot be changed after submission. We'll verify it for
                security purposes.
              </small>
            </div>
          </div>

          <button className="auth_submit" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Complete Profile"}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        centered
        className="success_modal"
        size="md"
        backdrop="static"
      >
        <ModalBody className="success_modal_body">
          <div className="success_icon">
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M20 6L9 17L4 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3>Profile Submitted! 🎉</h3>
          <p>
            Your profile has been successfully submitted. Our team will review
            and verify your information. You'll be notified once your account is
            approved.
          </p>
          {/* <div className="verification_notice">
            <strong>📋 Next Steps:</strong>
            <ul>
              <li>We'll verify your NIN and provided information</li>
              <li>You'll receive a notification upon approval</li>
              <li>This process usually takes 1-2 business days</li>
            </ul>
          </div> */}
          <button className="auth_submit" onClick={handleSearchRide}>
            Go to Dashboard
          </button>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default CompletePassengerProfile;
