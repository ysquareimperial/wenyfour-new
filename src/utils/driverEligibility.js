// src/utils/driverEligibility.js

/**
 * Determines whether a user is allowed to create a car / publish a ride,
 * and returns a list of human-readable reasons when they aren't.
 *
 * Rules:
 *   - NIN must be verified (nin_verification_status === "verified")
 *   - is_driver must be true
 *   - driver_profile must have license_number, license_expiry_date, license_photo_url
 */

export function getDriverEligibility(user) {
  const reasons = [];

  if (!user) {
    return {
      eligible: false,
      reasons: ["You need to be signed in."],
      missingNin: true,
      missingLicense: true,
      notDriver: true,
    };
  }

  const ninVerified =
    user.nin_verification_status === "verified" || user.nin_verified === true;

  const driverProfile = user.driver_profile || null;

  const hasLicenseNumber = !!driverProfile?.license_number;
  const hasLicenseExpiry = !!driverProfile?.license_expiry_date;
  const hasLicensePhoto = !!driverProfile?.license_photo_url;
  const hasLicense = hasLicenseNumber && hasLicenseExpiry && hasLicensePhoto;

  const isDriver = user.is_driver === true;

  if (!ninVerified) {
    reasons.push("Your NIN needs to be verified.");
  }

  if (!hasLicense) {
    reasons.push("Your driver's licence information is incomplete.");
  }

  if (!isDriver) {
    reasons.push("Your driver account is not yet active.");
  }

  return {
    eligible: ninVerified && hasLicense && isDriver,
    reasons,
    ninVerified,
    hasLicense,
    isDriver,
    missingNin: !ninVerified,
    missingLicense: !hasLicense,
    notDriver: !isDriver,
  };
}