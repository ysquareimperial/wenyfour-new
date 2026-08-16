import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, ModalBody } from "reactstrap";
import {
  login,
  loginFailure,
  signup,
  verifyOtp,
  resendVerification,
} from "../redux/actions";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function getIdentifierType(value) {
  if (!value) return null;
  return value.includes("@") ? "email" : "phone";
}

// ---- icons (inline, no new deps) -----------------------------------

const IconMail = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="m4 6.5 8 6 8-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconPhone = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.3 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.6 20.5 3.5 13.4 3.5 4.9c0-.6.4-1 1-1H8c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.3 1l-2 2Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);
const IconLock = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="4.5"
      y="10.5"
      width="15"
      height="9.5"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M8 10.5V7.5a4 4 0 1 1 8 0v3"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);
const IconEye = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);
const IconEyeOff = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M3.5 3.5l17 17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M10.6 5.6A9.9 9.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.4 15.4 0 0 1-3.2 4.1M6.6 6.9C4 8.7 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.2 0 2.3-.2 3.3-.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M9.9 10a3 3 0 0 0 4.1 4.1"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);
const IconPerson = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M5 20c1-3.5 4-5.4 7-5.4s6 1.9 7 5.4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconWheel = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    <path
      d="M12 4.5V9M12 15v4.5M5.3 8l3.6 2.4M15.1 13.6l3.6 2.4M18.7 8l-3.6 2.4M8.9 13.6 5.3 16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconAlert = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 3.5 21.5 20h-19L12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <path
      d="M12 9.5v4.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.7" r="0.9" fill="currentColor" />
  </svg>
);
const IconMessage = (props) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M4 5.5h16v10H8.5L4 19V5.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);
const IconEnvelopeLarge = (props) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="m4 6.5 8 6 8-6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

// Enhanced RouteArt with clear Start/Stop labels
const RouteArt = () => (
  <svg
    viewBox="0 0 320 220"
    width="100%"
    height="auto"
    className="route_art"
    aria-hidden="true"
  >
    {/* Start point with label */}
    <circle cx="46" cy="168" r="7" className="route_pin_fill" />
    <circle cx="46" cy="168" r="12" className="route_pin_ring" />
    {/* <text x="20" y="196" className="route_label_start" fontSize="11" fontWeight="600" fill="currentColor">START</text> */}
    <text x="12" y="210" className="route_label_start_sub" fontSize="8" opacity="0.6" fill="currentColor">Pickup</text>

    {/* Destination point with label */}
    <circle cx="272" cy="54" r="7" className="route_pin_fill" />
    <circle cx="272" cy="54" r="12" className="route_pin_ring" />
    {/* <text x="246" y="42" className="route_label_dest" fontSize="11" fontWeight="600" fill="currentColor">STOP</text> */}
    <text x="242" y="32" className="route_label_dest_sub" fontSize="8" opacity="0.6" fill="currentColor">Drop-off</text>

    {/* Route path with animated dot */}
    <path
      d="M46 168 C 110 168, 90 60, 272 54"
      className="route_path"
      fill="none"
      strokeWidth="2.5"
      strokeDasharray="7 8"
    />
    <circle r="5" className="route_dot">
      <animateMotion
        dur="3.2s"
        repeatCount="indefinite"
        path="M46 168 C 110 168, 90 60, 272 54"
      />
    </circle>

    {/* Small car icon at moving dot */}
    <g className="route_car">
      <animateMotion
        dur="3.2s"
        repeatCount="indefinite"
        path="M46 168 C 110 168, 90 60, 272 54"
      />
      <rect x="-8" y="-4" width="16" height="8" rx="2" fill="currentColor" opacity="0.8"/>
      <rect x="-5" y="-6" width="6" height="2" rx="1" fill="currentColor" opacity="0.8"/>
    </g>
  </svg>
);

function OtpInput({ value, onChange, inputRefs }) {
  const inputsRef = useRef([]);

  const handleChange = (index, digit) => {
    if (digit && !/^\d$/.test(digit)) return;
    const next = value.split("");
    next[index] = digit;
    onChange(next.join("").slice(0, OTP_LENGTH));
    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
      inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    }
  };

  return (
    <div className="otp_input_group" onPaste={handlePaste}>
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
            if (inputRefs) inputRefs.current = inputsRef.current;
          }}
          className="otp_digit"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function SignUpp() {
  const loggedInUser = useSelector((state) => state?.auth?.user);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState(true); // true = login, false = register
  const [role, setRole] = useState("passenger"); // "passenger" | "driver"
  const dispatch = useDispatch();

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [signupIdentifier, setSignupIdentifier] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [verificationType, setVerificationType] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const errorMessage = useSelector((state) => state.auth.errorMessage);
  const otpInputsRef = useRef([]);

  const handleTogglePassword = () => setShowPassword((s) => !s);

  useEffect(() => {
    if (!modalOpen || resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 500);
    return () => clearTimeout(t);
  }, [modalOpen, resendSeconds]);

  // Auto-focus first OTP input when modal opens
  useEffect(() => {
    if (modalOpen && verificationType === "phone") {
      setTimeout(() => {
        if (otpInputsRef.current && otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    }
  }, [modalOpen, verificationType]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthSuccess(false);
    try {
      await dispatch(login({ identifier: loginIdentifier, password, role }));
      setLoading(false);
      setAuthSuccess(true);
      setAuthMessage(`✅ Successfully logged in as ${role}!`);
      setLoginIdentifier("");
      setPassword("");
    } catch (error) {
      setLoading(false);
      console.error("Login failed:", error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const type = getIdentifierType(signupIdentifier);
    setLoading(true);
    setAuthSuccess(false);
    try {
      await dispatch(
        signup({
          identifier: signupIdentifier,
          password: signupPassword,
          role,
        }),
      );
      setLoading(false);
      setVerificationType(type);
      setOtp("");
      setOtpError(null);
      setResendSeconds(RESEND_SECONDS);
      setModalOpen(true);
    } catch (error) {
      setLoading(false);
      console.error("Signup failed:", error);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    setVerifying(true);
    setOtpError(null);
    try {
      const result = await dispatch(
        verifyOtp({ identifier: signupIdentifier, otp }),
      );
      setVerifying(false);
      setModalOpen(false);
      setAuthSuccess(true);
      setAuthMessage(`✅ Successfully verified and signed up as ${role}!`);
      setSignupIdentifier("");
      setSignupPassword("");
      setOtp("");
    } catch (error) {
      setVerifying(false);
      setOtpError("That code didn't work. Please try again.");
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) return;
    try {
      await dispatch(resendVerification({ identifier: signupIdentifier }));
      setResendSeconds(RESEND_SECONDS);
    } catch (error) {
      console.error("Resend failed:", error);
    }
  };

  useEffect(() => {
    return () => dispatch(loginFailure(null));
  }, [dispatch]);

  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        setAuthSuccess(false);
        setAuthMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authSuccess]);

  const identifierIcon =
    getIdentifierType(tab ? loginIdentifier : signupIdentifier) === "phone" ? (
      <IconPhone />
    ) : (
      <IconMail />
    );

  return (
    <div className="auth_page" data-role={role}>
      <div className="auth_grid">
        {/* Brand panel */}
        <aside className="auth_brand">
          <a href="https://wenyfour.com" className="auth_logo_link">
            <img
              src="https://res.cloudinary.com/dx5ilizca/image/upload/v1700895319/Galaxy__2_-removebg-preview_w1jyje.png"
              alt="wenyfour"
              className="auth_logo_img"
            />
          </a>
          <div className="auth_brand_copy">
            <span className="auth_eyebrow">Share the ride, share the cost</span>
            <h1 className="auth_heading">
              {role === "driver"
                ? "Got empty seats? Fill them."
                : "Find a ride to where you're going."}
            </h1>
            <p className="auth_subcopy">
              {role === "driver"
                ? "Publish your trip and let travelers heading your direction ride along."
                : "Connect with drivers already heading your way — split the cost, skip the wait."}
            </p>
          </div>
          <div className="auth_route_wrap">
            <RouteArt />
          </div>
        </aside>

        {/* Form panel */}
        <main className="auth_form_panel">
          <div className="auth_card">
            <div className="auth_logo_mobile">
              <img
                src="https://res.cloudinary.com/dx5ilizca/image/upload/v1700895319/Galaxy__2_-removebg-preview_w1jyje.png"
                alt="wenyfour"
              />
            </div>

            <div
              className="role_switch"
              role="tablist"
              aria-label="Choose account type"
            >
              <button
                type="button"
                role="tab"
                aria-selected={role === "passenger"}
                className={
                  role === "passenger" ? "role_pill active" : "role_pill"
                }
                onClick={() => setRole("passenger")}
              >
                <IconPerson /> Passenger
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={role === "driver"}
                className={role === "driver" ? "role_pill active" : "role_pill"}
                onClick={() => setRole("driver")}
              >
                <IconWheel /> Driver
              </button>
            </div>

            <div className="auth_tabs">
              <button
                type="button"
                className={tab ? "auth_tab active" : "auth_tab"}
                onClick={() => setTab(true)}
              >
                Log in
              </button>
              <button
                type="button"
                className={!tab ? "auth_tab active" : "auth_tab"}
                onClick={() => setTab(false)}
              >
                Create account
              </button>
            </div>

            {errorMessage && (
              <div className="auth_alert">
                <IconAlert />
                <span>{errorMessage}</span>
              </div>
            )}

            {authSuccess && (
              <div className="auth_alert" style={{ background: '#e6f4ea', borderColor: '#b7e1cd', color: '#1e7e34' }}>
                <span>{authMessage}</span>
              </div>
            )}

            {tab ? (
              <form onSubmit={handleLogin} className="auth_form">
                <div className="field_group">
                  <label className="field_label" htmlFor="loginIdentifier">
                    Email or phone number
                  </label>
                  <div className="input_wrap">
                    <span className="input_icon">{identifierIcon}</span>
                    <input
                      className="input_field with_icon"
                      id="loginIdentifier"
                      required
                      type="text"
                      placeholder="you@example.com"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field_group">
                  <label className="field_label" htmlFor="password">
                    Password
                  </label>
                  <div className="input_wrap">
                    <span className="input_icon">
                      <IconLock />
                    </span>
                    <input
                      className="input_field with_icon with_trailing"
                      id="password"
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input_trailing_btn"
                      onClick={handleTogglePassword}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <div className="auth_row_between">
                  <span />
                  <button
                    type="button"
                    className="link_btn"
                    onClick={() => alert("Forgot password flow would go here")}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  className="auth_submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : role === "driver" ? (
                    "Log in as driver"
                  ) : (
                    "Log in"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="auth_form">
                <div className="field_group">
                  <label className="field_label" htmlFor="signupIdentifier">
                    Email or phone number
                  </label>
                  <div className="input_wrap">
                    <span className="input_icon">{identifierIcon}</span>
                    <input
                      className="input_field with_icon"
                      id="signupIdentifier"
                      required
                      type="text"
                      placeholder="you@example.com or +234..."
                      value={signupIdentifier}
                      onChange={(e) => setSignupIdentifier(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field_group">
                  <label className="field_label" htmlFor="signupPassword">
                    Password
                  </label>
                  <div className="input_wrap">
                    <span className="input_icon">
                      <IconLock />
                    </span>
                    <input
                      className="input_field with_icon with_trailing"
                      id="signupPassword"
                      required
                      minLength={6}
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="input_trailing_btn"
                      onClick={handleTogglePassword}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>

                <p className="auth_fineprint">
                  By creating an account, you agree to our{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.wenyfour.com/terms-and-conditions"
                  >
                    Terms
                  </a>
                  ,{" "}
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.wenyfour.com/privacy-policy"
                  >
                    Privacy Policy
                  </a>{" "}
                  and SMS notifications. Unsubscribe anytime.
                </p>

                <button
                  className="auth_submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : role === "driver" ? (
                    "Sign up as driver"
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>

      <Modal 
        isOpen={modalOpen} 
        centered 
        toggle={() => setModalOpen(false)}
        className="otp_modal"
        backdrop="static"
      >
        <ModalBody className="verify_modal_body">
          {verificationType === "email" ? (
            <>
              <div className="verify_icon_circle">
                <IconEnvelopeLarge />
              </div>
              <h5 className="auth_heading verify_title">Check your email</h5>
              <p className="verify_copy">
                We've sent a verification link to{" "}
                <strong>{signupIdentifier}</strong>. Click the link to activate
                your account.
              </p>
              <button
                className="link_btn"
                disabled={resendSeconds > 0}
                onClick={handleResend}
              >
                {resendSeconds > 0
                  ? `Resend link in ${resendSeconds}s`
                  : "Resend link"}
              </button>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="otp_form">
              <div className="verify_icon_circle">
                <IconMessage />
              </div>
              <h5 className="auth_heading verify_title">Enter verification code</h5>
              <p className="verify_copy">
                We've sent a 6-digit code to <strong>{signupIdentifier}</strong>.
              </p>
              
              <OtpInput value={otp} onChange={setOtp} inputRefs={otpInputsRef} />
              
              {otpError && (
                <div className="auth_alert modal_alert">
                  <IconAlert />
                  <span>{otpError}</span>
                </div>
              )}
              
              <button
                className="auth_submit verify_submit"
                type="submit"
                disabled={otp.length !== OTP_LENGTH || verifying}
              >
                {verifying ? <span className="spinner" /> : "Verify Code"}
              </button>
              
              <button
                type="button"
                className="link_btn resend_btn"
                disabled={resendSeconds > 0}
                onClick={handleResend}
              >
                {resendSeconds > 0
                  ? `Resend code in ${resendSeconds}s`
                  : "Resend code"}
              </button>
            </form>
          )}
        </ModalBody>
      </Modal>

      <style jsx>{`
        /* Enhanced OTP Modal Styles */
        .otp_modal .modal-content {
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: none;
          background: white;
        }

        .verify_modal_body {
          padding: 40px 32px 32px 32px;
          background: white;
          border-radius: 20px;
        }

        .verify_icon_circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--accent-soft, #eff4ff);
          color: var(--accent, #0d6efd);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 28px;
        }

        .verify_title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #0b1220;
        }

        .verify_copy {
          font-size: 14px;
          color: #475467;
          margin-bottom: 20px;
        }

        .verify_copy strong {
          color: #0b1220;
          font-weight: 600;
        }

        .otp_input_group {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin: 24px 0 20px 0;
        }

        .otp_digit {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 22px;
          font-weight: 700;
          border-radius: 12px;
          border: 2px solid #e4e7ec;
          background-color: #f9fafb;
          color: #0b1220;
          transition: all 150ms ease;
        }

        .otp_digit:focus {
          outline: none;
          border-color: var(--accent, #0d6efd);
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
          background: #ffffff;
          transform: scale(1.05);
        }

        .otp_digit:hover {
          border-color: #b0b8c4;
        }

        .verify_submit {
          margin-top: 8px;
          width: 100%;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 12px;
          background: var(--accent, #0d6efd);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .verify_submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }

        .verify_submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .verify_submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .resend_btn {
          display: block;
          margin: 16px auto 0;
          font-size: 14px;
          color: var(--accent, #0d6efd);
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 150ms ease;
        }

        .resend_btn:hover:not(:disabled) {
          background: #f2f4f7;
        }

        .resend_btn:disabled {
          color: #98a2b3;
          cursor: not-allowed;
        }

        .modal_alert {
          margin: 12px 0 0 0;
          text-align: left;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
        }

        /* Enhanced Route Art Styles */
        .route_art {
          width: 100%;
          max-width: 320px;
        }

        .route_pin_fill {
          fill: var(--accent, #0d6efd);
        }

        .route_pin_ring {
          fill: none;
          stroke: var(--accent, #0d6efd);
          stroke-width: 1.5;
          opacity: 0.5;
        }

        .route_path {
          stroke: currentColor;
          opacity: 0.35;
        }

        .route_dot {
          fill: var(--accent, #0d6efd);
        }

        .route_car {
          opacity: 0.9;
        }

        .route_label_start {
          fill: currentColor;
        }

        .route_label_dest {
          fill: currentColor;
        }

        .route_label_start_sub,
        .route_label_dest_sub {
          fill: currentColor;
        }

        @media (max-width: 768px) {
          .otp_digit {
            width: 40px;
            height: 48px;
            font-size: 18px;
          }

          .verify_modal_body {
            padding: 24px 16px;
          }

          .otp_input_group {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
}