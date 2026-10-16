// src/services/ridesApi.js
import { request, getAuthToken } from "./http";

export { getAuthToken };

export const ridesApi = {
  search: (query, { signal } = {}) =>
    request("/rides/search", { query, signal, auth: false }),
  get: (id) => request(`/rides/${id}`),
  listMine: (filters = {}) =>
    request("/rides/my-rides", { query: filters, auth: "required" }),
  publish: (payload) =>
    request("/rides/", { method: "POST", body: payload, auth: "required" }),
};
