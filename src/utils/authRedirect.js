// src/utils/authRedirect.js

// Single source of truth for "where should this user go right now".
//
// Rule (from the API):
//  - profile_complete === false  -> always the complete-profile page for their role
//  - profile_complete === true   -> the app home for their role, regardless of nin_verified
//    (nin_verified only controls a "pending verification" badge somewhere in the UI,
//    it never blocks navigation)
export function getHomePath(user) {
  if (!user) return "/login";

  if (!user.profile_complete) {
    return user.role === "driver"
      ? "/driver/complete-profile"
      : "/passenger/complete-profile";
  }

  return user.role === "driver" ? "/driver/dashboard" : "/passenger/search-ride";
}