// src/components/DriverGateModal.jsx
import React, { useState } from "react";
import "./DriverGateModal.css";
import LicenseUploadModal from "./LicenseUploadModal";

const Icon = {
  Shield: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3 5 6v5c0 4.5 3 8.3 7 9.5 4-1.2 7-5 7-9.5V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 12.5 11 14.5 15 10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/**
 * Modal shown when a user tries to create a car or publish a ride but
 * isn't eligible. Offers a button to open the license upload modal.
 *
 * Props:
 *   open         – boolean
 *   onClose      – () => void
 *   eligibility  – result of getDriverEligibility(user)
 *   onRefresh    – () => Promise<void>  (re-fetch profile after upload)
 *   actionLabel  – "create a car" | "publish a ride"  (for copy)
 */
const DriverGateModal = ({ open, onClose, eligibility, onRefresh, actionLabel = "continue" }) => {
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  if (!open) return null;

  const handleUploadSuccess = async () => {
    setLicenseModalOpen(false);
    if (onRefresh) await onRefresh();
    // Parent decides what to do next; we just close.
    onClose?.();
  };

  return (
    <>
      <div className="dgm_overlay" role="dialog" aria-modal="true">
        <div className="dgm_card">
          <button className="dgm_close" onClick={onClose} aria-label="Close">
            <Icon.Close />
          </button>

          <div className="dgm_icon">
            <Icon.Shield />
          </div>

          <h2 className="dgm_title">Complete your driver profile</h2>
          <p className="dgm_copy">
            Before you can {actionLabel}, we need to verify a few things about your
            driver account.
          </p>

          <ul className="dgm_reasons">
            {eligibility?.missingNin && (
              <li>
                <span className="dgm_dot" />
                Your NIN is not verified. You'll be able to verify it from your
                profile once the option becomes available.
              </li>
            )}
            {eligibility?.missingLicense && (
              <li>
                <span className="dgm_dot" />
                Your driver's licence details are incomplete. Upload your licence
                number, expiry date, and photo.
              </li>
            )}
            {eligibility?.notDriver && (
              <li>
                <span className="dgm_dot" />
                Your driver account is not yet active. Once your licence is
                reviewed, you'll be able to drive.
              </li>
            )}
          </ul>

          <div className="dgm_actions">
            {eligibility?.missingLicense && (
              <button
                type="button"
                className="dgm_btn primary"
                onClick={() => setLicenseModalOpen(true)}
              >
                Upload licence info
                <Icon.Arrow />
              </button>
            )}
            <button type="button" className="dgm_btn ghost" onClick={onClose}>
              Not now
            </button>
          </div>
        </div>
      </div>

      <LicenseUploadModal
        open={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        onSuccess={handleUploadSuccess}
        initialLicenseNumber={eligibility?.user?.driver_profile?.license_number || ""}
        initialExpiry={eligibility?.user?.driver_profile?.license_expiry_date || ""}
      />
    </>
  );
};

export default DriverGateModal;