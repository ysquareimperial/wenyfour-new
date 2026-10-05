// src/services/ridesApi.js
const API_BASE = "https://api.wenyfour.com.ng";

export function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

async function request(path, { method = "GET", query, body } = {}) {
  const token = getAuthToken();
  if (!token) throw new Error("You need to be signed in.");

  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, v);
    });
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    let detail = "";
    try {
      const data = await res.json();
      if (Array.isArray(data?.detail)) {
        detail = data.detail.map((d) => d.msg || d).join("; ");
      } else if (typeof data?.detail === "string") {
        detail = data.detail;
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || `Request failed with ${res.status}`);
  }

  return res.json();
}

export const ridesApi = {
  listMine: (filters = {}) => request("/rides/my-rides", { query: filters }),
  remove: (id) => request(`/rides/${id}`, { method: "DELETE" }),
};