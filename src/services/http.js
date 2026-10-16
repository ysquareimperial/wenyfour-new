// src/services/http.js
//
// One fetch wrapper for the whole app. Every API module goes through here so
// that base URL, auth header, error parsing and session expiry behave the
// same everywhere.

export const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://api.wenyfour.com.ng"
).replace(/\/+$/, "");

export const SESSION_EXPIRED_EVENT = "wf:session-expired";

export function getAuthToken() {
  return localStorage.getItem("access_token") || "";
}

/** Turn a FastAPI error body into a readable sentence. */
export function parseErrorDetail(body) {
  if (!body) return "";
  if (typeof body === "string") return body;
  const d = body.detail ?? body.message ?? body.error;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((e) => {
        const field = Array.isArray(e?.loc) ? e.loc.filter((x) => x !== "body").join(".") : "";
        return field ? `${field}: ${e.msg}` : e?.msg || String(e);
      })
      .join("; ");
  }
  if (d && typeof d === "object") return d.message || JSON.stringify(d);
  return "";
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * request("/rides/search", { query: {...} })
 * request("/bookings/", { method: "POST", body: {...} })
 * request("/cars/", { method: "POST", form: formData })
 *
 * auth: true (default) attaches the bearer token if present.
 *       "required" throws when there's no token.
 *       false never sends it.
 */
export async function request(
  path,
  { method = "GET", query, body, form, auth = true, signal, token: overrideToken } = {},
) {
  const token = overrideToken ?? (auth ? getAuthToken() : "");
  if (auth === "required" && !token) {
    throw new ApiError("You need to be signed in.", 401);
  }

  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      params.append(k, String(v));
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form; // browser sets the multipart boundary
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, { method, headers, body: payload, signal });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0,
    );
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail = parseErrorDetail(data);
    if (res.status === 401 && token) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw new ApiError("Your session has expired. Please sign in again.", 401, data);
    }
    if (res.status === 413) {
      throw new ApiError("That file is too large. Please use one under 4MB.", 413, data);
    }
    if (res.status >= 500) {
      throw new ApiError(
        detail || "The server ran into a problem. Please try again shortly.",
        res.status,
        data,
      );
    }
    throw new ApiError(detail || `Request failed (${res.status}).`, res.status, data);
  }

  return data;
}

/** Resolve a stored photo path into a URL the browser can load. */
export function resolveMediaUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${API_BASE}/${String(path).replace(/^\/+/, "")}`;
}
