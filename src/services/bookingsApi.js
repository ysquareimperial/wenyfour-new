// src/services/bookingsApi.js
import { request } from "./http";

export const BOOKING_STATUS = {
  pending: { label: "Awaiting driver", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "success" },
  trip_started: { label: "On the road", tone: "info" },
  trip_completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const bookingsApi = {
  create: ({ rideId, travelDate, seats }) =>
    request("/bookings/", {
      method: "POST",
      auth: "required",
      body: {
        ride_id: Number(rideId),
        travel_date: travelDate,
        seats_booked: Number(seats) || 1,
      },
    }),
  mine: async () => {
    const data = await request("/bookings/my-bookings", { auth: "required" });
    return Array.isArray(data) ? data : [];
  },
  cancel: (id) => request(`/bookings/${id}/cancel`, { method: "POST", auth: "required" }),

  // Driver actions — wired up once the API exposes a driver booking list.
  confirm: (id) => request(`/bookings/${id}/confirm`, { method: "POST", body: {}, auth: "required" }),
  startTrip: (id) => request(`/bookings/${id}/start-trip`, { method: "POST", body: {}, auth: "required" }),
  completeTrip: (id) =>
    request(`/bookings/${id}/complete-trip`, { method: "POST", body: {}, auth: "required" }),
};
