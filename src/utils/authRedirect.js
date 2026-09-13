// src/utils/authRedirect.js

// Single source of truth for "where should this user go right now".
//
// Roles are gone. The only thing that matters for routing now is whether
// the profile is complete.
export function getHomePath(user) {
  if (!user) return "/login";
  if (!user.profile_complete) return "/complete-profile";
  return "/search-ride";
}