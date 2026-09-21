// src/pages/Profile.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import { useAuth } from "../context/AuthContext";
import { getDriverEligibility } from "../utils/driverEligibility";
import LicenseUploadModal from "./LicenseUploadModal";

const API_BASE = "https://api.wenyfour.com.ng";

function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

/* ------------------------------------------------------------------ *
 *  Small helpers
 * ------------------------------------------------------------------ */

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initialsFrom(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function avatarUrl(photoPath) {
  if (!photoPath) return "";
  if (/^https?:\/\//i.test(photoPath)) return photoPath;
  return `${API_BASE}/${photoPath.replace(/^\//, "")}`;
}

/* ------------------------------------------------------------------ *
 *  Icons
 * ------------------------------------------------------------------ */

const Icon = {
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle
        cx="12"
        cy="8.5"
        r="3.3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Mail: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Phone: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 4h3.5l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L16 14l4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Pin: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0 1 18.5 10.5C18.5 15.6 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10.5"
        r="2.4"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  ),
  Shield: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 3 5 6v5c0 4.5 3 8.3 7 9.5 4-1.2 7-5 7-9.5V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
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
    </svg>
  ),
  Check: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12.5 10 17.5 19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
  Pencil: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 20h4L19 9l-4-4L4 16v4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="m14.5 5.5 4 4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  Close: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
  Logout: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M15 12H4m0 0 4-4m-4 4 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 5V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  Editable field
 * ------------------------------------------------------------------ */

function Field({ label, children, hint }) {
  return (
    <div className="pf_field">
      <label className="pf_label">{label}</label>
      {children}
      {hint && <span className="pf_hint">{hint}</span>}
    </div>
  );
}

function ReadRow({ icon, label, value }) {
  return (
    <div className="pf_read_row">
      <span className="pf_read_icon" aria-hidden="true">
        {icon}
      </span>
      <div className="pf_read_text">
        <span className="pf_read_label">{label}</span>
        <span className="pf_read_value">{value || "—"}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Status pill
 * ------------------------------------------------------------------ */

const STATUS_MAP = {
  verified: { tone: "success", label: "Verified" },
  pending: { tone: "warn", label: "Pending" },
  unverified: { tone: "muted", label: "Unverified" },
  rejected: { tone: "danger", label: "Rejected" },
};

function StatusPill({ status }) {
  const meta = STATUS_MAP[status] || STATUS_MAP.unverified;
  return <span className={`pf_pill ${meta.tone}`}>{meta.label}</span>;
}

/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */

const DRIVER_PREF_OPTIONS = {
  chattiness: [
    "Quiet ride, please",
    "A little chat is fine",
    "Very talkative!",
  ],
  music: ["No music, thanks", "Music on request", "Always playing tunes!"],
  smoking: ["No smoking in the vehicle", "Smoking allowed in the vehicle"],
  pets: ["No pets, sorry", "Pet-friendly ride!"],
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, refreshProfile } = useAuth();

  const eligibility = useMemo(() => getDriverEligibility(user), [user]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  // Local form mirror (initialised from user, reset when user changes)
  const [form, setForm] = useState(() => buildFormState(user));

  useEffect(() => {
    if (!editing) setForm(buildFormState(user));
  }, [user, editing]);

  // Clear success message after a moment
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3200);
    return () => clearTimeout(t);
  }, [successMsg]);

  const set = (key) => (e) => {
    const value =
      e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const startEdit = () => {
    setForm(buildFormState(user));
    setErrorMsg("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(buildFormState(user));
    setErrorMsg("");
    setEditing(false);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setErrorMsg("");

    if (!form.full_name.trim())
      return setErrorMsg("Please enter your full name.");
    if (!form.phone_number.trim())
      return setErrorMsg("Please enter your phone number.");

    const token = getAuthToken();
    if (!token) return setErrorMsg("You need to be signed in.");

    setSaving(true);

    // Only send fields that PUT /profile/me accepts. Driver preferences
    // (about_me, chattiness, music, smoking, pets) are included per the
    // endpoint spec. Empty strings are kept as-is so users can clear fields.
    const payload = {
      full_name: form.full_name.trim(),
      address: form.address.trim(),
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      phone_number: form.phone_number.trim(),
      next_of_kin_name: form.next_of_kin_name.trim(),
      next_of_kin_relationship: form.next_of_kin_relationship.trim(),
      emergency_contact: form.emergency_contact.trim(),
      blood_group: form.blood_group || null,
      health_conditions: form.health_conditions.trim(),
      nin: form.nin.trim(),
      about_me: form.about_me.trim(),
      chattiness: form.chattiness || null,
      music: form.music || null,
      smoking: form.smoking || null,
      pets: form.pets || null,
    };

    try {
      const res = await fetch(`${API_BASE}/profile/me`, {
        method: "PUT",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

      const data = await res.json();
      updateProfile({
        ...data,
        nin_verified: data.nin_verification_status === "verified",
      });
      setEditing(false);
      setSuccessMsg("Profile updated.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[profile update] failed:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLicenseSuccess = async () => {
    setLicenseModalOpen(false);
    try {
      await refreshProfile();
      setSuccessMsg("Licence info saved. Verification is pending.");
    } catch {
      setSuccessMsg("Licence info saved.");
    }
  };

  const photo = avatarUrl(user?.photo_url);
  const ninStatus = user?.nin_verification_status || "unverified";
  const licenseStatus =
    user?.driver_profile?.license_verification_status || "unverified";

  return (
    <div className="profile_page">
      <div className="pf_inner">
        {/* ---------- Header card ---------- */}
        <header className="pf_header_card">
          <div className="pf_avatar_wrap">
            {photo ? (
              <img
                className="pf_avatar"
                src={photo}
                alt={user?.full_name || "Avatar"}
              />
            ) : (
              <div className="pf_avatar pf_avatar_fallback">
                {initialsFrom(user?.full_name)}
              </div>
            )}
          </div>

          <div className="pf_header_meta">
            <h1 className="pf_name">{user?.full_name || "Your profile"}</h1>
            <p className="pf_contact">
              {user?.phone_number || "—"}
              {user?.email ? ` · ${user.email}` : ""}
            </p>
            <div className="pf_badges">
              {user?.is_passenger && (
                <span className="pf_badge">Passenger</span>
              )}
              {user?.is_driver && (
                <span className="pf_badge driver">Driver</span>
              )}
              {user?.profile_complete && (
                <span className="pf_badge success">
                  <Icon.Check /> Profile complete
                </span>
              )}
            </div>
          </div>

          {!editing ? (
            <button type="button" className="pf_edit_btn" onClick={startEdit}>
              <Icon.Pencil /> Edit
            </button>
          ) : (
            <button
              type="button"
              className="pf_edit_btn ghost"
              onClick={cancelEdit}
            >
              <Icon.Close /> Cancel
            </button>
          )}
        </header>

        {/* ---------- Alerts ---------- */}
        {errorMsg && (
          <div className="pf_alert" role="alert">
            <Icon.Alert />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="pf_alert success" role="status">
            <Icon.Check />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------- Verification summary ---------- */}
        <section className="pf_card">
          <div className="pf_card_head">
            <h2 className="pf_card_title">Verification</h2>
          </div>

          <div className="pf_status_grid">
            <div className="pf_status_row">
              <div className="pf_status_left">
                <span className="pf_status_icon">
                  <Icon.Shield />
                </span>
                <div>
                  <span className="pf_status_label">NIN</span>
                  <span className="pf_status_sub">
                    {user?.nin
                      ? `•••• ${String(user.nin).slice(-4)}`
                      : "Not provided"}
                  </span>
                </div>
              </div>
              <StatusPill status={ninStatus} />
            </div>

            <div className="pf_status_row">
              <div className="pf_status_left">
                <span className="pf_status_icon">
                  <Icon.Car />
                </span>
                <div>
                  <span className="pf_status_label">Driver's licence</span>
                  <span className="pf_status_sub">
                    {user?.driver_profile?.license_number
                      ? `No. ${user.driver_profile.license_number}`
                      : "Not uploaded"}
                  </span>
                </div>
              </div>
              <StatusPill status={licenseStatus} />
            </div>
          </div>

          {!eligibility.eligible && (
            <div className="pf_gate_note">
              <Icon.Alert />
              <div>
                <p className="pf_gate_text">
                  You need to complete these to create a car or publish a ride:
                </p>
                <ul className="pf_gate_list">
                  {eligibility.missingNin && <li>Verify your NIN</li>}
                  {eligibility.missingLicense && (
                    <li>Upload your driver's licence</li>
                  )}
                  {eligibility.notDriver && (
                    <li>Activate your driver account</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <div className="pf_card_actions">
            {eligibility.missingLicense && (
              <button
                type="button"
                className="pf_btn primary"
                onClick={() => setLicenseModalOpen(true)}
              >
                {user?.driver_profile?.license_photo_url
                  ? "Update licence photo"
                  : "Upload licence info"}
                <Icon.Arrow />
              </button>
            )}
            {eligibility.missingNin && (
              <span className="pf_note">
                NIN verification is handled separately — watch for an in-app
                prompt.
              </span>
            )}
          </div>
        </section>

        {/* ---------- Passenger details ---------- */}
        <section className="pf_card">
          <div className="pf_card_head">
            <h2 className="pf_card_title">Personal details</h2>
          </div>

          {editing ? (
            <form className="pf_form" onSubmit={handleSave} noValidate>
              <div className="pf_row">
                <Field label="Full name">
                  <input
                    className="pf_input"
                    type="text"
                    value={form.full_name}
                    onChange={set("full_name")}
                    placeholder="e.g. Yasir Ado Hassan"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    className="pf_input"
                    type="tel"
                    value={form.phone_number}
                    onChange={set("phone_number")}
                    placeholder="e.g. 2349038967078"
                  />
                </Field>
              </div>

              <Field label="Address">
                <input
                  className="pf_input"
                  type="text"
                  value={form.address}
                  onChange={set("address")}
                  placeholder="e.g. No 896, Yaksai B, Kano"
                />
              </Field>

              <div className="pf_row">
                <Field label="Date of birth">
                  <input
                    className="pf_input"
                    type="date"
                    value={form.date_of_birth || ""}
                    onChange={set("date_of_birth")}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    className="pf_input"
                    value={form.gender || ""}
                    onChange={set("gender")}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>

              <div className="pf_row">
                <Field label="Blood group">
                  <select
                    className="pf_input"
                    value={form.blood_group || ""}
                    onChange={set("blood_group")}
                  >
                    <option value="">Select…</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="NIN">
                  <input
                    className="pf_input"
                    type="text"
                    inputMode="numeric"
                    value={form.nin}
                    onChange={set("nin")}
                    placeholder="e.g. 12345678901"
                  />
                </Field>
              </div>

              <Field
                label="Health conditions"
                hint="Anything drivers or responders should know."
              >
                <textarea
                  className="pf_input pf_textarea"
                  rows="2"
                  value={form.health_conditions}
                  onChange={set("health_conditions")}
                  placeholder="e.g. Asthma"
                />
              </Field>

              <div className="pf_row">
                <Field label="Next of kin name">
                  <input
                    className="pf_input"
                    type="text"
                    value={form.next_of_kin_name}
                    onChange={set("next_of_kin_name")}
                    placeholder="e.g. Aisha Hassan"
                  />
                </Field>
                <Field label="Next of kin relationship">
                  <input
                    className="pf_input"
                    type="text"
                    value={form.next_of_kin_relationship}
                    onChange={set("next_of_kin_relationship")}
                    placeholder="e.g. Sister"
                  />
                </Field>
              </div>

              <Field label="Emergency contact">
                <input
                  className="pf_input"
                  type="tel"
                  value={form.emergency_contact}
                  onChange={set("emergency_contact")}
                  placeholder="e.g. 1234567890"
                />
              </Field>

              <div className="pf_form_footer">
                <button
                  type="button"
                  className="pf_btn ghost"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pf_btn primary"
                  disabled={saving}
                  aria-busy={saving}
                >
                  {saving ? (
                    <>
                      <span className="pf_spinner" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="pf_read_grid">
              <ReadRow
                icon={<Icon.User />}
                label="Full name"
                value={user?.full_name}
              />
              <ReadRow
                icon={<Icon.Phone />}
                label="Phone number"
                value={user?.phone_number}
              />
              <ReadRow
                icon={<Icon.Mail />}
                label="Email"
                value={user?.email || "Not set"}
              />
              <ReadRow
                icon={<Icon.Pin />}
                label="Address"
                value={user?.address}
              />
              <ReadRow
                icon={<Icon.User />}
                label="Date of birth"
                value={formatDate(user?.date_of_birth)}
              />
              <ReadRow
                icon={<Icon.User />}
                label="Gender"
                value={user?.gender}
              />
              <ReadRow
                icon={<Icon.Shield />}
                label="Blood group"
                value={user?.blood_group}
              />
              <ReadRow icon={<Icon.Shield />} label="NIN" value={user?.nin} />
              <ReadRow
                icon={<Icon.User />}
                label="Next of kin"
                value={[user?.next_of_kin_name, user?.next_of_kin_relationship]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <ReadRow
                icon={<Icon.Phone />}
                label="Emergency contact"
                value={user?.emergency_contact}
              />
              <ReadRow
                icon={<Icon.Shield />}
                label="Health conditions"
                value={user?.health_conditions}
              />
            </div>
          )}
        </section>

        {/* ---------- Driver preferences ---------- */}
        {(user?.driver_profile || user?.has_driver_application) && (
          <section className="pf_card">
            <div className="pf_card_head">
              <h2 className="pf_card_title">Driver preferences</h2>
            </div>

            {editing ? (
              <div className="pf_form">
                <Field label="About me">
                  <textarea
                    className="pf_input pf_textarea"
                    rows="3"
                    value={form.about_me}
                    onChange={set("about_me")}
                    placeholder="Say a little about yourself as a driver."
                  />
                </Field>

                <div className="pf_row">
                  <Field label="Chattiness">
                    <select
                      className="pf_input"
                      value={form.chattiness || ""}
                      onChange={set("chattiness")}
                    >
                      <option value="">No preference</option>
                      {DRIVER_PREF_OPTIONS.chattiness.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Music">
                    <select
                      className="pf_input"
                      value={form.music || ""}
                      onChange={set("music")}
                    >
                      <option value="">No preference</option>
                      {DRIVER_PREF_OPTIONS.music.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="pf_row">
                  <Field label="Smoking">
                    <select
                      className="pf_input"
                      value={form.smoking || ""}
                      onChange={set("smoking")}
                    >
                      <option value="">No preference</option>
                      {DRIVER_PREF_OPTIONS.smoking.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Pets">
                    <select
                      className="pf_input"
                      value={form.pets || ""}
                      onChange={set("pets")}
                    >
                      <option value="">No preference</option>
                      {DRIVER_PREF_OPTIONS.pets.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            ) : (
              <div className="pf_read_grid">
                <ReadRow
                  icon={<Icon.User />}
                  label="About me"
                  value={user?.driver_profile?.about_me}
                />
                <ReadRow
                  icon={<Icon.User />}
                  label="Chattiness"
                  value={user?.driver_profile?.chattiness}
                />
                <ReadRow
                  icon={<Icon.User />}
                  label="Music"
                  value={user?.driver_profile?.music}
                />
                <ReadRow
                  icon={<Icon.User />}
                  label="Smoking"
                  value={user?.driver_profile?.smoking}
                />
                <ReadRow
                  icon={<Icon.User />}
                  label="Pets"
                  value={user?.driver_profile?.pets}
                />
                <ReadRow
                  icon={<Icon.Car />}
                  label="Licence number"
                  value={user?.driver_profile?.license_number}
                />
                <ReadRow
                  icon={<Icon.Car />}
                  label="Licence expiry"
                  value={formatDate(user?.driver_profile?.license_expiry_date)}
                />
              </div>
            )}
          </section>
        )}
      </div>

      <LicenseUploadModal
        open={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        onSuccess={handleLicenseSuccess}
        initialLicenseNumber={user?.driver_profile?.license_number || ""}
        initialExpiry={user?.driver_profile?.license_expiry_date || ""}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ *
 *  Form state builder
 * ------------------------------------------------------------------ */

function buildFormState(user) {
  return {
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
    about_me: user?.driver_profile?.about_me || "",
    chattiness: user?.driver_profile?.chattiness || "",
    music: user?.driver_profile?.music || "",
    smoking: user?.driver_profile?.smoking || "",
    pets: user?.driver_profile?.pets || "",
  };
}

export default Profile;
