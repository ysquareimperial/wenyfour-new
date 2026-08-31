// src/Components/SignUpp.jsx
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, ModalBody, ModalHeader } from "reactstrap";
import { useNavigate } from "react-router-dom";

import {
  login,
  loginFailure,
  signup,
  verifyOtp,
  resendVerification,
  clearAuthError,
  clearAuthMessage,
} from "../redux/actions/authentication";
import {
  IconMail,
  IconPhone,
  IconLock,
  IconEye,
  IconEyeOff,
  IconAlert,
  IconPerson,
  IconWheel,
  IconMessage,
  IconEnvelopeLarge,
  IconClose,
} from "../icons";
import "./Register.css"; // Import the CSS file

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

function getIdentifierType(value) {
  if (!value) return null;
  return value.includes("@") ? "email" : "phone";
}

// RouteArt component with fixed SVG height
const RouteArt = () => (
  <svg
    viewBox="0 0 320 220"
    width="100%"
    height="220"
    className="route_art"
    aria-hidden="true"
  >
    <circle cx="46" cy="168" r="7" className="route_pin_fill" />
    <circle cx="46" cy="168" r="12" className="route_pin_ring" />
    <text
      x="12"
      y="210"
      className="route_label_start_sub"
      fontSize="8"
      opacity="0.6"
      fill="currentColor"
    >
      Pickup
    </text>
    <circle cx="272" cy="54" r="7" className="route_pin_fill" />
    <circle cx="272" cy="54" r="12" className="route_pin_ring" />
    <text
      x="242"
      y="32"
      className="route_label_dest_sub"
      fontSize="8"
      opacity="0.6"
      fill="currentColor"
    >
      Drop-off
    </text>
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
    <g className="route_car">
      <animateMotion
        dur="3.2s"
        repeatCount="indefinite"
        path="M46 168 C 110 168, 90 60, 272 54"
      />
      <rect
        x="-8"
        y="-4"
        width="16"
        height="8"
        rx="2"
        fill="currentColor"
        opacity="0.8"
      />
      <rect
        x="-5"
        y="-6"
        width="6"
        height="2"
        rx="1"
        fill="currentColor"
        opacity="0.8"
      />
    </g>
  </svg>
);

// OTP Input Component
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
  const navigate = useNavigate();
  const loggedInUser = useSelector((state) => state?.auth?.user);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState(true);
  const [role, setRole] = useState("passenger");
  const dispatch = useDispatch();
  const [otpVerified, setOtpVerified] = useState(false);

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

  useEffect(() => {
    if (modalOpen && verificationType === "phone") {
      setTimeout(() => {
        if (otpInputsRef.current && otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 100);
    }
  }, [modalOpen, verificationType]);

  // In SignUpp.jsx - Update the handleLogin function
  // In SignUpp.jsx, update the handleLogin function
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setAuthSuccess(false);
  try {
    const response = await dispatch(login({ identifier: loginIdentifier, password, role }));
    setLoading(false);
    setAuthSuccess(true);
    setAuthMessage(`✅ Successfully logged in as ${role}!`);
    setLoginIdentifier("");
    setPassword("");
    
    // The user data is in response.user
    if (response && response.user) {
      const user = response.user;
      
      // Check if profile is complete
      if (!user.profile_complete) {
        // Redirect to profile completion based on role
        if (user.role === 'passenger') {
          navigate('/passenger/complete-profile');
        } else if (user.role === 'driver') {
          navigate('/driver/complete-profile');
        }
      } else {
        // Redirect to appropriate dashboard
        if (user.role === 'passenger') {
          navigate('/passenger/dashboard');
        } else if (user.role === 'driver') {
          navigate('/driver/dashboard');
        }
      }
    }
  } catch (error) {
    setLoading(false);
    console.error("Login failed:", error);
    // Error message is handled by the reducer
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
      await dispatch(verifyOtp({ identifier: signupIdentifier, otp }));
      setVerifying(false);
      // Set verification success state
      setOtpVerified(true);
      // Keep modal open to show success message
      setOtpError(null);
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

  const handleVerificationSuccess = () => {
    setModalOpen(false);
    setOtpVerified(false);
    setOtp("");
    setAuthSuccess(true);
    setAuthMessage(`✅ Phone number verified successfully! Please log in.`);
    // Switch to login tab
    setTab(true);
    // Pre-fill the login identifier with the phone number
    setLoginIdentifier(signupIdentifier);
    // Clear signup fields
    setSignupIdentifier("");
    setSignupPassword("");
  };

  useEffect(() => {
    return () => {
      dispatch(loginFailure(null));
      dispatch(clearAuthError());
      dispatch(clearAuthMessage());
    };
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

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

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
              <div
                className="auth_alert"
                style={{
                  background: "#e6f4ea",
                  borderColor: "#b7e1cd",
                  color: "#1e7e34",
                }}
              >
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
                    onClick={handleForgotPassword}
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
        toggle={() => {
          if (!otpVerified) {
            setModalOpen(false);
            setOtpError(null);
          }
        }}
        className="otp_modal"
        backdrop="static"
      >
        <ModalBody className="verify_modal_body">
          {/* Close button - only show if not verified */}
          {!otpVerified && (
            <button
              className="modal_close_btn"
              onClick={() => {
                setModalOpen(false);
                setOtpError(null);
              }}
              aria-label="Close modal"
            >
              <IconClose />
            </button>
          )}

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
            <>
              {!otpVerified ? (
                // OTP verification form
                <form onSubmit={handleVerifyOtp} className="otp_form">
                  <div className="verify_icon_circle">
                    <IconMessage />
                  </div>
                  <h5 className="auth_heading verify_title">
                    Enter verification code
                  </h5>
                  <p className="verify_copy">
                    We've sent a 6-digit code to{" "}
                    <strong>{signupIdentifier}</strong>.
                  </p>

                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    inputRefs={otpInputsRef}
                  />

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
              ) : (
                // Success message with login button
                <div className="verification_success">
                  <div className="verify_icon_circle success">
                    <svg
                      width="40"
                      height="40"
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
                  <h5 className="auth_heading verify_title">
                    Phone Number Verified!
                  </h5>
                  <p className="verify_copy">
                    Your phone number <strong>{signupIdentifier}</strong> has
                    been successfully verified. You can now log in to your
                    account.
                  </p>
                  <button
                    className="auth_submit verify_submit"
                    onClick={handleVerificationSuccess}
                  >
                    Login Now
                  </button>
                </div>
              )}
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}
