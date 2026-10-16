// src/services/carsApi.js
import { request, getAuthToken, resolveMediaUrl } from "./http";

export { getAuthToken };

// Keep uploads under 4MB to avoid 413s from the proxy in front of the API.
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

/** Resolve a photo_url into a fully-qualified URL the browser can load. */
export function resolvePhotoUrl(path) {
  return resolveMediaUrl(path);
}

/** Pick the best photo URL from a photo object (handles several shapes). */
export function photoUrl(photo) {
  if (!photo) return "";
  if (typeof photo === "string") return resolveMediaUrl(photo);
  return resolveMediaUrl(photo.photo_url || photo.url || photo.path || photo.filename || "");
}

const CAR_BOOL_FIELDS = [
  "is_tinted",
  "has_wifi",
  "has_air_conditioning",
  "has_power_outlets",
  "smoking_allowed",
  "pets_allowed",
  "wheelchair_accessible",
];

/** POST /cars/ is multipart/form-data per the API spec. */
export function buildCarFormData(fields, file) {
  const fd = new FormData();
  fd.append("make", String(fields.make ?? "").trim());
  fd.append("model", String(fields.model ?? "").trim());
  fd.append("year", String(Number(fields.year)));
  fd.append("color", String(fields.color ?? "").trim());
  if (fields.plate_number) fd.append("plate_number", String(fields.plate_number).trim());
  if (fields.capacity) fd.append("capacity", String(Number(fields.capacity)));
  CAR_BOOL_FIELDS.forEach((k) => fd.append(k, String(!!fields[k])));
  if (file) fd.append("file", file);
  return fd;
}

export const carsApi = {
  async list() {
    const data = await request("/cars/my-cars", { auth: "required" });
    return Array.isArray(data) ? data : [];
  },

  create(fields, file) {
    return request("/cars/", {
      method: "POST",
      form: buildCarFormData(fields, file),
      auth: "required",
    });
  },

  update(carId, payload) {
    return request(`/cars/${carId}`, { method: "PATCH", body: payload, auth: "required" });
  },

  async remove(carId) {
    await request(`/cars/${carId}`, { method: "DELETE", auth: "required" });
    return true;
  },

  uploadPhoto(carId, file, isPrimary = false) {
    const fd = new FormData();
    fd.append("file", file);
    return request(`/cars/${carId}/photos`, {
      method: "POST",
      form: fd,
      query: { is_primary: isPrimary ? "true" : "false" },
      auth: "required",
    });
  },
};
