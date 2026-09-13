// src/pages/CompleteProfile.jsx
//
// Single profile form for everyone now that roles are gone. Personal info
// is required to complete the profile; the ride-preference fields
// (about_me / chattiness / music / smoking / pets) are optional — any user
// can fill them in, they just build out an (unverified) driver profile
// without gating anything here. License fields are intentionally excluded.
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalBody } from "reactstrap";
import api from "../services/apis";
import { useAuth } from "../context/AuthContext";
import AvatarCropper from "../Components/AvatarCropper";
import { IconAlert, IconPerson, IconPhone } from "../icons";
import "./CompleteProfile.css";

const CHATTINESS_OPTIONS = [
  "Very talkative!",
  "I chat once I warm up",
  "Quiet rider",
];

const MUSIC_OPTIONS = [
  "Always playing tunes!",
  "Music depends on the mood",
  "Prefer no music",
];

const SMOKING_OPTIONS = [
  "Smoking allowed in the vehicle",
  "Smoke breaks outside the car only",
  "Strictly smoke-free ride",
];

const PETS_OPTIONS = [
  "Pet-friendly ride!",
  "Open to pets depending on type/size",
  "No pets allowed",
];

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
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
    // Optional ride-preference fields, live under driver_profile in the API response
    about_me: user?.driver_profile?.about_me || "",
    chattiness: user?.driver_profile?.chattiness || "",
    music: user?.driver_profile?.music || "",
    smoking: user?.driver_profile?.smoking || "",
    pets: user?.driver_profile?.pets || "",
  });

  // ---- Profile photo state ----
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photo_url || null);
  const [cropSource, setCropSource] = useState(null);
  const fileInputRef = useRef(null);

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

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSource(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCropCancel = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  };

  const handleCropSave = (blob) => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
    setPhotoFile(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  };

  // The chattiness/music/smoking/pets fields are backed by enums server-side,
  // so an empty string isn't a valid value for them — only send the keys the
  // user actually set something for.
  const buildPayload = () => {
    const payload = { ...formData };
    ["about_me", "chattiness", "music", "smoking", "pets"].forEach((key) => {
      if (!payload[key]) delete payload[key];
    });
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!photoFile && !user?.photo_url) {
      setError("Please add a profile photo to finish your profile.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: save profile fields. The photo endpoint refuses uploads
      // until this information is already saved.
      const { data } = await api.put("/profile/me", buildPayload());
      let latestProfile = data;

      // Step 2: upload the photo, if the user picked a new one.
      if (photoFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", photoFile, "avatar.jpg");
        const { data: photoData } = await api.post("/profile/me/photo", uploadForm);
        latestProfile = photoData;
      }

      updateProfile({
        ...latestProfile,
        nin_verified: latestProfile.nin_verification_status === "verified",
      });

      setShowSuccessModal(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    navigate("/search-ride");
  };

  return (
    <div className="complete_profile_page">
      <div className="complete_profile_container">
        <div className="profile_header">
          <h1>Complete Your Profile</h1>
          <p>
            Help us get to know you better. This information helps us provide a safer ride-sharing
            experience.
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
            <h3>Profile Photo *</h3>
            <div className="avatar_uploader">
              <div className="avatar_preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" />
                ) : (
                  <span className="avatar_placeholder">
                    <IconPerson />
                  </span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="link_btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoPreview ? "Change photo" : "Add photo"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoPick}
                  style={{ display: "none" }}
                />
                <p className="field_hint">JPG or PNG. You'll be able to crop it to a square first.</p>
              </div>
            </div>
          </div>

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
                <select className="input_field" name="gender" value={formData.gender} onChange={handleChange} required>
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
                <select className="input_field" name="blood_group" value={formData.blood_group} onChange={handleChange}>
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
              <small className="field_hint">
                NIN cannot be changed after submission. We'll verify it for security purposes.
              </small>
            </div>
          </div>

          <div className="form_section">
            <h3>Ride Preferences (optional)</h3>
            <p className="field_hint" style={{ marginBottom: 12 }}>
              These help set expectations if you ever offer rides — you can fill them in any time.
            </p>

            <div className="field_group">
              <label className="field_label">About Me</label>
              <div className="input_wrap">
                <textarea
                  className="input_field"
                  name="about_me"
                  value={formData.about_me}
                  onChange={handleChange}
                  placeholder="A short bio other riders will see"
                  rows="3"
                />
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Chattiness</label>
              <div className="input_wrap">
                <select className="input_field" name="chattiness" value={formData.chattiness} onChange={handleChange}>
                  <option value="">No preference</option>
                  {CHATTINESS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Music</label>
              <div className="input_wrap">
                <select className="input_field" name="music" value={formData.music} onChange={handleChange}>
                  <option value="">No preference</option>
                  {MUSIC_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Smoking</label>
              <div className="input_wrap">
                <select className="input_field" name="smoking" value={formData.smoking} onChange={handleChange}>
                  <option value="">No preference</option>
                  {SMOKING_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field_group">
              <label className="field_label">Pets</label>
              <div className="input_wrap">
                <select className="input_field" name="pets" value={formData.pets} onChange={handleChange}>
                  <option value="">No preference</option>
                  {PETS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button className="auth_submit" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Complete Profile"}
          </button>
        </form>
      </div>

      {cropSource && (
        <AvatarCropper imageSrc={cropSource} onCancel={handleCropCancel} onSave={handleCropSave} />
      )}

      <Modal isOpen={showSuccessModal} centered className="success_modal" size="md" backdrop="static">
        <ModalBody className="success_modal_body">
          <div className="success_icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3>Profile Submitted! 🎉</h3>
          <p>
            Your profile has been successfully submitted. Our team will review and verify your
            information. You'll be notified once your account is approved.
          </p>
          <button className="auth_submit" onClick={handleContinue}>
            Go to Dashboard
          </button>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default CompleteProfile;