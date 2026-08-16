// ==========================================================================
// DUMMY / MOCK AUTH ACTIONS — no network calls.
// Swap the bodies of signup / verifyOtp / login / resendVerification back
// to real axios calls once the backend is ready. Action shapes and what
// gets dispatched/returned stay the same, so SignUpp.jsx won't need to
// change when you switch back.
// ==========================================================================

const isEmail = (identifier) => identifier.includes("@");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const signupSuccess = (user) => ({
  type: "SIGNUP_SUCCESS",
  payload: user,
});

export const loginSuccess = (user) => (dispatch) => {
  localStorage.setItem("user_data", JSON.stringify(user));
  localStorage.setItem("access_token", user.access_token);
  dispatch({
    type: "LOGIN_SUCCESS",
    payload: user,
  });
};

export const loginFailure = (errorMessage) => ({
  type: "LOGIN_FAILURE",
  payload: errorMessage,
});

// Simulates: POST /users -> triggers email link or SMS OTP send.
// No token yet — account isn't usable until verified.
export const signup = ({ identifier, password, role }) => async (dispatch) => {
  dispatch(loginFailure(null));
  await wait(700);

  if (!identifier || !password) {
    dispatch(loginFailure("Enter an email or phone number and a password."));
    throw new Error("missing_fields");
  }

  const verification_method = isEmail(identifier) ? "email" : "phone";
  dispatch(signupSuccess({ identifier, role }));
  return { verification_method };
};

// Simulates: POST /verify-otp -> issues a token, logs the user in.
// Dummy mode accepts any 6-digit code.
export const verifyOtp = ({ identifier, otp }) => async (dispatch) => {
  await wait(600);

  if (!/^\d{6}$/.test(otp)) {
    throw new Error("invalid_otp");
  }

  const user = {
    email: isEmail(identifier) ? identifier : "",
    phone_number: !isEmail(identifier) ? identifier : "",
    access_token: "dummy-access-token",
    token_type: "bearer",
    user_id: "dummy-user-id",
    is_active: true,
    is_verified: true,
    is_passenger: true,
    is_driver: false,
    profile_complete: false, // new signups land on /complete-profile
    created_at: new Date().toISOString(),
  };

  dispatch(loginSuccess(user));
  return user;
};

// Simulates: POST /resend-verification
export const resendVerification = ({ identifier }) => async () => {
  await wait(500);
  console.log("Dummy: resent verification to", identifier);
};

// Simulates: POST /login -> issues a token for an existing, verified user.
export const login = ({ identifier, password, role }) => async (dispatch) => {
  dispatch(loginFailure(null));
  await wait(700);

  if (!identifier || !password) {
    dispatch(loginFailure("Enter your email/phone and password."));
    throw new Error("missing_fields");
  }

  const user = {
    email: isEmail(identifier) ? identifier : "",
    phone_number: !isEmail(identifier) ? identifier : "",
    access_token: "dummy-access-token",
    token_type: "bearer",
    user_id: "dummy-user-id",
    is_active: true,
    is_verified: true,
    is_passenger: role === "passenger",
    is_driver: role === "driver",
    profile_complete: true, // existing users skip straight to the app
    created_at: new Date().toISOString(),
  };

  dispatch(loginSuccess(user));
  return user;
};

export const restoreUserFromLocalStorage = () => (dispatch) => {
  const access_token = localStorage.getItem("access_token");
  const userDataString = localStorage.getItem("user_data");

  if (access_token && userDataString) {
    try {
      const userData = JSON.parse(userDataString);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: userData,
      });
    } catch (error) {
      console.error("Failed to restore user data:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
    }
  }
};

export const logout = () => (dispatch) => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_data");
  dispatch({
    type: "LOGOUT",
  });
};