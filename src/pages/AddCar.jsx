// src/pages/AddCar.jsx
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddCar.css";
// src/pages/AddCar.jsx
import { useAuth } from "../context/AuthContext";
import { getDriverEligibility } from "../utils/driverEligibility";
import DriverGateModal from "./DriverGateModal";

const API_BASE = "https://api.wenyfour.com.ng";

function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

const AMENITY_FIELDS = [
  { key: "has_wifi", label: "Wi-Fi" },
  { key: "has_air_conditioning", label: "Air conditioning" },
  { key: "has_power_outlets", label: "Power outlets" },
  { key: "smoking_allowed", label: "Smoking allowed" },
  { key: "pets_allowed", label: "Pets allowed" },
  { key: "wheelchair_accessible", label: "Wheelchair accessible" },
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1990;

const INITIAL_FORM = {
  make: "",
  model: "",
  year: "",
  color: "",
  plate_number: "",
  capacity: 4,
  is_tinted: false,
  has_wifi: false,
  has_air_conditioning: false,
  has_power_outlets: false,
  smoking_allowed: false,
  pets_allowed: false,
  wheelchair_accessible: false,
};

const Icon = {
  Car: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="15" r=".9" fill="currentColor" />
      <circle cx="16.5" cy="15" r=".9" fill="currentColor" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7.5v6M12 16.6v.2"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  ),
  Check: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12.5 10 17.5 19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  Image: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m21 15-5-5L5 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const AddCar = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [createdCar, setCreatedCar] = useState(null);

  const { user, refreshProfile } = useAuth();
  const eligibility = getDriverEligibility(user);
  const [gateOpen, setGateOpen] = useState(false);

  const set = (key) => (e) => {
    const value =
      e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };
  const setDirect = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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

    if (!form.make.trim()) return setErrorMsg("Please enter the car make.");
    if (!form.model.trim()) return setErrorMsg("Please enter the car model.");
    if (!form.year) return setErrorMsg("Please enter the year of manufacture.");
    if (!form.color.trim()) return setErrorMsg("Please enter the car colour.");
    if (!form.plate_number.trim())
      return setErrorMsg("Please enter the plate number.");
    if (!form.capacity || Number(form.capacity) < 1) {
      return setErrorMsg("Capacity must be at least 1.");
    }

    const token = getAuthToken();
    if (!token) {
      setStatus("error");
      setErrorMsg("You need to be signed in to add a car.");
      return;
    }

    // Gate: block car creation if the user isn't eligible to drive
    if (!eligibility.eligible) {
      setGateOpen(true);
      setStatus("idle");
      return;
    }

    setStatus("submitting");

    // Build multipart form-data (per API spec)
    const fd = new FormData();
    fd.append("make", form.make.trim());
    fd.append("model", form.model.trim());
    fd.append("year", String(Number(form.year)));
    fd.append("color", form.color.trim());
    fd.append("plate_number", form.plate_number.trim());
    fd.append("capacity", String(Number(form.capacity)));
    fd.append("is_tinted", String(!!form.is_tinted));
    fd.append("has_wifi", String(!!form.has_wifi));
    fd.append("has_air_conditioning", String(!!form.has_air_conditioning));
    fd.append("has_power_outlets", String(!!form.has_power_outlets));
    fd.append("smoking_allowed", String(!!form.smoking_allowed));
    fd.append("pets_allowed", String(!!form.pets_allowed));
    fd.append("wheelchair_accessible", String(!!form.wheelchair_accessible));
    if (file) fd.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/cars/`, {
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
            detail = body.detail
              .map((d) => `${d.loc?.join(".")}: ${d.msg}`)
              .join("; ");
          } else if (typeof body?.detail === "string") {
            detail = body.detail;
          }
        } catch {
          /* ignore */
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      const car = await res.json();
      setCreatedCar(car);
      setStatus("success");
      setForm(INITIAL_FORM);
      clearFile();
    } catch (err) {
      console.error("[add car] failed:", err);
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  const goToPublish = () => {
    if (!createdCar) return;
    navigate("/rides/publish", {
      state: { carId: createdCar.id, car: createdCar },
    });
  };

  const resetToForm = () => {
    setStatus("idle");
    setCreatedCar(null);
    clearFile();
  };

  /* ---------------- success screen ---------------- */

  if (status === "success" && createdCar) {
    const photoCount = Array.isArray(createdCar.photos)
      ? createdCar.photos.length
      : 0;
    return (
      <div className="add_car_page">
        <div className="ac_inner">
          <div className="ac_state">
            <div className="ac_state_icon success">
              <Icon.Check />
            </div>
            <h1 className="ac_state_title">Car added</h1>
            <p className="ac_state_copy">
              <strong>
                {createdCar.make} {createdCar.model}
              </strong>
              {createdCar.year ? ` (${createdCar.year})` : ""} is now on your
              profile.
            </p>

            <div className="ac_success_summary">
              <div className="ac_success_row">
                <span className="ac_success_label">Plate</span>
                <span className="ac_success_value">
                  {createdCar.plate_number}
                </span>
              </div>
              <div className="ac_success_row">
                <span className="ac_success_label">Capacity</span>
                <span className="ac_success_value">
                  {createdCar.capacity} seats
                </span>
              </div>
              <div className="ac_success_row">
                <span className="ac_success_label">Colour</span>
                <span className="ac_success_value">{createdCar.color}</span>
              </div>
              <div className="ac_success_row">
                <span className="ac_success_label">Photos</span>
                <span className="ac_success_value">{photoCount}</span>
              </div>
            </div>

            <div className="ac_state_actions">
              <button
                type="button"
                className="ac_btn primary"
                onClick={goToPublish}
              >
                Publish a ride
                <Icon.Arrow />
              </button>
              <button
                type="button"
                className="ac_btn"
                onClick={() => navigate("/cars")}
              >
                View my cars
                <Icon.Arrow />
              </button>
              <button
                type="button"
                className="ac_btn ghost"
                onClick={resetToForm}
              >
                Add another car
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- form ---------------- */

  const submitting = status === "submitting";

  return (
    <div className="add_car_page">
      <div className="ac_inner">
        <header className="ac_header">
          <p className="ac_eyebrow">Driver profile</p>
          <h1 className="ac_title">Add your car</h1>
          <p className="ac_subtitle">
            Tell us about the car you&apos;ll be driving. You can add more cars
            later.
          </p>
        </header>

        {errorMsg && (
          <div className="ac_alert" role="alert">
            <Icon.Alert />
            <span>{errorMsg}</span>
          </div>
        )}

        <form className="ac_form" onSubmit={handleSubmit} noValidate>
          <section className="ac_section">
            <h2 className="ac_section_title">Vehicle</h2>

            <div className="ac_row">
              <div className="ac_field">
                <label className="ac_label" htmlFor="ac_make">
                  Make
                </label>
                <div className="ac_input_wrap">
                  <span className="ac_input_icon" aria-hidden="true">
                    <Icon.Car />
                  </span>
                  <input
                    id="ac_make"
                    className="ac_input"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Toyota"
                    value={form.make}
                    onChange={set("make")}
                    required
                  />
                </div>
              </div>
              <div className="ac_field">
                <label className="ac_label" htmlFor="ac_model">
                  Model
                </label>
                <div className="ac_input_wrap">
                  <span className="ac_input_icon" aria-hidden="true">
                    <Icon.Car />
                  </span>
                  <input
                    id="ac_model"
                    className="ac_input"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Camry"
                    value={form.model}
                    onChange={set("model")}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="ac_row">
              <div className="ac_field">
                <label className="ac_label" htmlFor="ac_year">
                  Year
                </label>
                <input
                  id="ac_year"
                  className="ac_input no_icon"
                  type="number"
                  inputMode="numeric"
                  min={MIN_YEAR}
                  max={CURRENT_YEAR + 1}
                  placeholder={String(CURRENT_YEAR)}
                  value={form.year}
                  onChange={set("year")}
                  required
                />
              </div>
              <div className="ac_field">
                <label className="ac_label" htmlFor="ac_color">
                  Colour
                </label>
                <input
                  id="ac_color"
                  className="ac_input no_icon"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Black"
                  value={form.color}
                  onChange={set("color")}
                  required
                />
              </div>
            </div>

            <div className="ac_row">
              <div className="ac_field">
                <label className="ac_label" htmlFor="ac_plate">
                  Plate number
                </label>
                <input
                  id="ac_plate"
                  className="ac_input no_icon"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. ABC-123-XY"
                  value={form.plate_number}
                  onChange={set("plate_number")}
                  required
                />
              </div>
              <div className="ac_field">
                <label className="ac_label" htmlFor="ac_capacity">
                  Capacity
                </label>
                <input
                  id="ac_capacity"
                  className="ac_input no_icon"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="20"
                  value={form.capacity}
                  onChange={set("capacity")}
                  required
                />
                <span className="ac_hint">
                  Total seats including the driver.
                </span>
              </div>
            </div>
          </section>

          <section className="ac_section">
            <h2 className="ac_section_title">Photo</h2>

            {preview ? (
              <div className="ac_photo_preview">
                <img src={preview} alt="Car preview" />
                <button
                  type="button"
                  className="ac_photo_remove"
                  onClick={clearFile}
                  aria-label="Remove photo"
                >
                  <Icon.Close />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ac_photo_drop"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon.Image />
                <span>Add a photo</span>
                <span className="ac_photo_drop_hint">
                  JPG or PNG, up to 8MB
                </span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </section>

          <section className="ac_section">
            <h2 className="ac_section_title">Features</h2>

            <label className="ac_check">
              <input
                type="checkbox"
                checked={form.is_tinted}
                onChange={(e) => setDirect("is_tinted", e.target.checked)}
              />
              <span>Tinted windows</span>
            </label>

            <div className="ac_check_grid">
              {AMENITY_FIELDS.map((f) => (
                <label key={f.key} className="ac_check">
                  <input
                    type="checkbox"
                    checked={!!form[f.key]}
                    onChange={(e) => setDirect(f.key, e.target.checked)}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="ac_form_footer">
            <button
              type="submit"
              className="ac_submit"
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className="ac_spinner" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save car"
              )}
            </button>
          </div>
        </form>
      </div>
      <DriverGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        eligibility={eligibility}
        onRefresh={refreshProfile}
        actionLabel="create a car"
      />
    </div>
  );
};

export default AddCar;
