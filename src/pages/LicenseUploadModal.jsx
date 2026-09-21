// src/components/LicenseUploadModal.jsx
import React, { useRef, useState, useEffect } from "react";
import "./LicenseUploadModal.css";

const API_BASE = "https://api.wenyfour.com.ng";

function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

const Icon = {
  Close: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Image: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m21 15-5-5L5 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Check: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
};

const LicenseUploadModal = ({
  open,
  onClose,
  onSuccess,
  initialLicenseNumber = "",
  initialExpiry = "",
}) => {
  const fileInputRef = useRef(null);

  const [licenseNumber, setLicenseNumber] = useState(initialLicenseNumber);
  const [expiryDate, setExpiryDate] = useState(initialExpiry);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");

  // Reset form when the modal is (re)opened
  useEffect(() => {
    if (open) {
      setLicenseNumber(initialLicenseNumber || "");
      setExpiryDate(initialExpiry || "");
      setFile(null);
      setPreview("");
      setStatus("idle");
      setErrorMsg("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, initialLicenseNumber, initialExpiry]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrorMsg("Please choose an image file.");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErrorMsg("Image must be under 8MB.");
      return;
    }
    setErrorMsg("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!licenseNumber.trim()) return setErrorMsg("Please enter your licence number.");
    if (!expiryDate) return setErrorMsg("Please choose the licence expiry date.");
    if (!file) return setErrorMsg("Please upload a photo of your licence.");

    const token = getAuthToken();
    if (!token) {
      setStatus("error");
      setErrorMsg("You need to be signed in.");
      return;
    }

    setStatus("submitting");

    const fd = new FormData();
    fd.append("license_number", licenseNumber.trim());
    fd.append("license_expiry_date", expiryDate);
    fd.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/profile/driver/license-photo`, {
        method: "POST",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type — browser sets multipart boundary
        },
        body: fd,
      });

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          if (Array.isArray(body?.detail)) {
            detail = body.detail.map((d) => `${d.loc?.join(".")}: ${d.msg}`).join("; ");
          } else if (typeof body?.detail === "string") {
            detail = body.detail;
          }
        } catch { /* ignore */ }

        if (res.status === 401 || res.status === 403) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      const data = await res.json();
      setStatus("success");
      // Give the user a moment to see success, then close + notify parent
      setTimeout(() => {
        onSuccess?.(data);
      }, 900);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[license upload] failed:", err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  if (!open) return null;

  const submitting = status === "submitting";

  return (
    <div className="lum_overlay" role="dialog" aria-modal="true">
      <div className="lum_card">
        <button className="lum_close" onClick={onClose} aria-label="Close" disabled={submitting}>
          <Icon.Close />
        </button>

        {status === "success" ? (
          <div className="lum_success">
            <div className="lum_success_icon">
              <Icon.Check />
            </div>
            <h2 className="lum_title">Licence submitted</h2>
            <p className="lum_copy">
              We've received your licence details. You'll be able to drive once
              it's verified.
            </p>
          </div>
        ) : (
          <>
            <header className="lum_header">
              <h2 className="lum_title">Upload licence info</h2>
              <p className="lum_copy">
                Enter your driver's licence details and attach a clear photo.
              </p>
            </header>

            {errorMsg && (
              <div className="lum_alert" role="alert">
                <Icon.Alert />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="lum_form" onSubmit={handleSubmit} noValidate>
              <div className="lum_field">
                <label className="lum_label" htmlFor="lum_number">
                  Licence number
                </label>
                <input
                  id="lum_number"
                  className="lum_input"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. 123456789FGHJ"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
              </div>

              <div className="lum_field">
                <label className="lum_label" htmlFor="lum_expiry">
                  Expiry date
                </label>
                <input
                  id="lum_expiry"
                  className="lum_input"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="lum_field">
                <label className="lum_label">Licence photo</label>

                {preview ? (
                  <div className="lum_preview">
                    <img src={preview} alt="Licence preview" />
                    <button
                      type="button"
                      className="lum_preview_remove"
                      onClick={clearFile}
                      aria-label="Remove photo"
                    >
                      <Icon.Close />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="lum_drop"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Icon.Image />
                    <span>Add a photo</span>
                    <span className="lum_drop_hint">JPG or PNG, up to 8MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </div>

              <div className="lum_footer">
                <button
                  type="submit"
                  className="lum_submit"
                  disabled={submitting}
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="lum_spinner" aria-hidden="true" />
                      Uploading…
                    </>
                  ) : (
                    "Save licence info"
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LicenseUploadModal;