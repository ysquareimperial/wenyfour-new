// src/pages/RideDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./RideDetail.css";

const API_BASE = "https://api.wenyfour.com.ng";

function getAuthToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("auth_token") ||
    ""
  );
}

/* ------------------------------------------------------------------ *
 *  Helpers (mirror SearchRide.jsx so formatting is consistent)
 * ------------------------------------------------------------------ */

function formatDateFriendly(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTimeFriendly(time) {
  if (!time) return "";
  const [hStr, mStr] = String(time).split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatNaira(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "₦—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function carTitle(car) {
  if (!car) return "";
  const parts = [car.make, car.model].filter(Boolean).join(" ");
  return car.year ? `${parts} · ${car.year}` : parts;
}

const AMENITY_FIELDS = [
  { key: "has_wifi", label: "Wi-Fi" },
  { key: "has_air_conditioning", label: "Air conditioning" },
  { key: "has_power_outlets", label: "Power outlets" },
  { key: "smoking_allowed", label: "Smoking allowed" },
  { key: "pets_allowed", label: "Pets allowed" },
  { key: "wheelchair_accessible", label: "Wheelchair accessible" },
  { key: "is_tinted", label: "Tinted windows" },
];

/* ------------------------------------------------------------------ *
 *  Icons
 * ------------------------------------------------------------------ */

const Icon = {
  Pin: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0 1 18.5 10.5C18.5 15.6 12 21 12 21Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  Flag: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 21V4M6 4h10l-1.4 3.5L16 11H6" stroke="currentColor" strokeWidth="1.7"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Seat: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 4v10a3 3 0 0 0 3 3h6M18 20v-4a2 2 0 0 0-2-2H9"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Car: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="7.5" cy="15" r=".9" fill="currentColor" />
      <circle cx="16.5" cy="15" r=".9" fill="currentColor" />
    </svg>
  ),
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12.5 10 17.5 19 7.5" stroke="currentColor" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Back: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M19 12H6M12 6l-6 6 6 6" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  Bolt: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10H12l1-8Z" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  Skeleton
 * ------------------------------------------------------------------ */

function DetailSkeleton() {
  return (
    <div className="rd_inner">
      <div className="rd_sk_line w40" />
      <div className="rd_sk_line w80" />
      <div className="rd_sk_card" />
      <div className="rd_sk_card" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */

const RideDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const presetDate = location.state?.date || "";

  const [ride, setRide] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedDate, setSelectedDate] = useState(presetDate);

  // Booking state
  const [seats, setSeats] = useState(1);
  const [bookingStatus, setBookingStatus] = useState("idle"); // idle | submitting | success | error
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState(null);

  /* -------- fetch ride -------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMsg("");
      try {
        const res = await fetch(`${API_BASE}/rides/${id}`, {
          method: "GET",
          headers: { accept: "application/json" },
        });
        if (!res.ok) {
          if (res.status === 404) throw new Error("This ride no longer exists.");
          throw new Error(`Request failed with ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        setRide(data);

        // Choose the first available date if none was preset.
        const occurrences = Array.isArray(data?.occurrences) ? data.occurrences : [];
        const dates = occurrences.map((o) => o.date).filter(Boolean).sort();
        if (!presetDate && dates.length > 0) {
          setSelectedDate(dates[0]);
        } else if (presetDate && !dates.includes(presetDate) && dates.length > 0) {
          setSelectedDate(dates[0]);
        }
        setStatus("success");
      } catch (err) {
        if (cancelled) return;
        console.error("[ride detail] failed:", err);
        setStatus("error");
        setErrorMsg(err.message || "Could not load this ride.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, presetDate]);

  const occurrences = useMemo(() => {
    if (!ride || !Array.isArray(ride.occurrences)) return [];
    return ride.occurrences
      .map((o) => o.date)
      .filter(Boolean)
      .sort();
  }, [ride]);

  const maxSeats = ride?.max_passengers || 1;
  const totalPrice = ride ? Number(ride.price_per_seat) * seats : 0;

  /* -------- booking -------- */

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingError("");

    const token = getAuthToken();
    if (!token) {
      setBookingError("You need to be signed in to book a ride.");
      return;
    }
    if (!selectedDate) {
      setBookingError("Please choose a travel date.");
      return;
    }

    setBookingStatus("submitting");

    try {
      const res = await fetch(`${API_BASE}/bookings/`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ride_id: Number(ride.id),
          seats: Number(seats),
          travel_date: selectedDate,
        }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          if (Array.isArray(body?.detail)) {
            detail = body.detail
              .map((d) => `${d.loc?.join(".")}: ${d.msg}`)
              .join("; ");
          } else if (typeof body?.detail === "string") {
            detail = body.detail;
          }
        } catch {
          /* ignore */
        }
        if (res.status === 401 || res.status === 403) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      const data = await res.json();
      setBooking(data);
      setBookingStatus("success");
    } catch (err) {
      console.error("[booking] failed:", err);
      setBookingStatus("error");
      setBookingError(err.message || "Could not complete your booking.");
    }
  };

  /* -------- loading / error screens -------- */

  if (status === "loading") {
    return (
      <div className="ride_detail_page">
        <DetailSkeleton />
      </div>
    );
  }

  if (status === "error" || !ride) {
    return (
      <div className="ride_detail_page">
        <div className="rd_inner">
          <div className="rd_state" role="alert">
            <div className="rd_state_icon error">
              <Icon.Alert />
            </div>
            <h2 className="rd_state_title">We couldn&apos;t load this ride</h2>
            <p className="rd_state_copy">{errorMsg}</p>
            <div className="rd_state_actions">
              <button
                type="button"
                className="rd_btn ghost"
                onClick={() => navigate(-1)}
              >
                <Icon.Back />
                Go back
              </button>
              <button
                type="button"
                className="rd_btn primary"
                onClick={() => navigate("/search-ride")}
              >
                Search rides
                <Icon.Arrow />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------- booking success -------- */

  if (bookingStatus === "success" && booking) {
    return (
      <div className="ride_detail_page">
        <div className="rd_inner">
          <div className="rd_state">
            <div className="rd_state_icon success">
              <Icon.Check />
            </div>
            <h2 className="rd_state_title">Booking confirmed</h2>
            <p className="rd_state_copy">
              Your seat{seats === 1 ? "" : "s"} from{" "}
              <strong>{ride.pickup_location}</strong> to{" "}
              <strong>{ride.dropoff_location}</strong> on{" "}
              <strong>{formatDateFriendly(selectedDate)}</strong>{" "}
              {seats === 1 ? "is" : "are"} booked.
            </p>

            <div className="rd_success_summary">
              <div className="rd_success_row">
                <span className="rd_success_label">Seats</span>
                <span className="rd_success_value">{seats}</span>
              </div>
              <div className="rd_success_row">
                <span className="rd_success_label">Total</span>
                <span className="rd_success_value">
                  {formatNaira(totalPrice)}
                </span>
              </div>
              {booking?.id != null && (
                <div className="rd_success_row">
                  <span className="rd_success_label">Booking ID</span>
                  <span className="rd_success_value">#{booking.id}</span>
                </div>
              )}
            </div>

            <div className="rd_state_actions">
              <button
                type="button"
                className="rd_btn primary"
                onClick={() => navigate("/rides/my-bookings")}
              >
                View my bookings
                <Icon.Arrow />
              </button>
              <button
                type="button"
                className="rd_btn ghost"
                onClick={() => navigate("/search-ride")}
              >
                Search more rides
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------- main detail -------- */

  const car = ride.car || {};
  const amenities = AMENITY_FIELDS.filter((f) => car[f.key] === true);
  const stopovers = Array.isArray(ride.stopovers) ? ride.stopovers : [];
  const noDates = occurrences.length === 0;

  return (
    <div className="ride_detail_page">
      <div className="rd_inner">
        {/* Back */}
        <button
          type="button"
          className="rd_back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <Icon.Back />
          Back
        </button>

        {/* Header */}
        <header className="rd_header">
          <p className="rd_eyebrow">Ride details</p>
          <h1 className="rd_title">
            {ride.origin_city || ride.pickup_location}
            <span className="rd_title_sep" aria-hidden="true">→</span>
            {ride.destination_city || ride.dropoff_location}
          </h1>
          <div className="rd_header_meta">
            <span className="rd_header_meta_item">
              <Icon.Calendar />
              {formatDateFriendly(ride.start_date)}
              {ride.end_date && ride.end_date !== ride.start_date
                ? ` → ${formatDateShort(ride.end_date)}`
                : ""}
            </span>
            <span className="rd_meta_dot" aria-hidden="true" />
            <span className="rd_header_meta_item">
              <Icon.Clock />
              Departs {formatTimeFriendly(ride.pickup_time)}
            </span>
          </div>
        </header>

        {/* Two-column layout */}
        <div className="rd_grid">
          {/* Left column: route, car, amenities */}
          <div className="rd_col_main">
            {/* Route */}
            <section className="rd_card">
              <h2 className="rd_card_title">Route</h2>

              <div className="rd_route">
                <div className="rd_route_rail" aria-hidden="true">
                  <span className="rd_route_dot start" />
                  <span className="rd_route_line" />
                  <span className="rd_route_dot end" />
                </div>
                <div className="rd_route_locations">
                  <div className="rd_route_point">
                    <span className="rd_route_label">{ride.pickup_location}</span>
                    <span className="rd_route_sub">
                      Pickup · {ride.origin_city}
                    </span>
                  </div>

                  {stopovers.length > 0 && (
                    <div className="rd_route_stops">
                      {stopovers.map((s, i) => (
                        <div key={i} className="rd_route_stop">
                          <span className="rd_route_stop_dot" />
                          <span>{s.location || s.city_name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="rd_route_point">
                    <span className="rd_route_label">{ride.dropoff_location}</span>
                    <span className="rd_route_sub">
                      Drop-off · {ride.destination_city}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Car */}
            <section className="rd_card">
              <h2 className="rd_card_title">Vehicle</h2>
              <div className="rd_car">
                <span className="rd_car_icon" aria-hidden="true">
                  <Icon.Car />
                </span>
                <div className="rd_car_info">
                  <span className="rd_car_name">{carTitle(car)}</span>
                  {car.color && (
                    <span className="rd_car_sub">{car.color}</span>
                  )}
                </div>
                {ride.max_passengers && (
                  <span className="rd_car_seats">
                    <Icon.Seat />
                    {ride.max_passengers} seats
                  </span>
                )}
              </div>

              {amenities.length > 0 && (
                <div className="rd_amenities">
                  {amenities.map((a) => (
                    <span key={a.key} className="rd_amenity">
                      {a.label}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Badges */}
            {(ride.is_recurring || ride.instant_booking) && (
              <section className="rd_card">
                <h2 className="rd_card_title">Booking</h2>
                <div className="rd_badges">
                  {ride.instant_booking && (
                    <span className="rd_badge instant">
                      <Icon.Bolt />
                      Instant booking available
                    </span>
                  )}
                  {ride.is_recurring && (
                    <span className="rd_badge subtle">
                      Recurring ride
                    </span>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right column: booking panel */}
          <aside className="rd_col_side">
            <form className="rd_book_card" onSubmit={handleBook}>
              <div className="rd_price_head">
                <span className="rd_price_value">
                  {formatNaira(ride.price_per_seat)}
                </span>
                <span className="rd_price_unit">per seat</span>
              </div>

              {/* Date picker */}
              <div className="rd_field">
                <label className="rd_label" htmlFor="rd_date">
                  Travel date
                </label>
                {noDates ? (
                  <span className="rd_hint error">
                    No upcoming dates for this ride.
                  </span>
                ) : (
                  <select
                    id="rd_date"
                    className="rd_input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  >
                    {occurrences.map((d) => (
                      <option key={d} value={d}>
                        {formatDateFriendly(d)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Seats */}
              <div className="rd_field">
                <label className="rd_label" htmlFor="rd_seats">
                  Seats
                </label>
                <div className="rd_stepper">
                  <button
                    type="button"
                    className="rd_stepper_btn"
                    onClick={() => setSeats((s) => Math.max(1, s - 1))}
                    disabled={seats <= 1}
                    aria-label="Fewer seats"
                  >
                    −
                  </button>
                  <span className="rd_stepper_value">{seats}</span>
                  <button
                    type="button"
                    className="rd_stepper_btn"
                    onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                    disabled={seats >= maxSeats}
                    aria-label="More seats"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="rd_totals">
                <div className="rd_total_row">
                  <span>
                    {formatNaira(ride.price_per_seat)} × {seats}{" "}
                    {seats === 1 ? "seat" : "seats"}
                  </span>
                  <span className="rd_total_value">
                    {formatNaira(totalPrice)}
                  </span>
                </div>
                <div className="rd_total_row grand">
                  <span>Total</span>
                  <span className="rd_total_grand">
                    {formatNaira(totalPrice)}
                  </span>
                </div>
              </div>

              {bookingError && (
                <div className="rd_alert" role="alert">
                  <Icon.Alert />
                  <span>{bookingError}</span>
                </div>
              )}

              <button
                type="submit"
                className="rd_book_btn"
                disabled={bookingStatus === "submitting" || noDates}
                aria-busy={bookingStatus === "submitting"}
              >
                {bookingStatus === "submitting" ? (
                  <>
                    <span className="rd_spinner" aria-hidden="true" />
                    Booking…
                  </>
                ) : (
                  <>
                    Book {seats === 1 ? "seat" : `${seats} seats`}
                    <Icon.Arrow />
                  </>
                )}
              </button>

              <p className="rd_book_note">
                You&apos;ll only be charged once the driver confirms
                {ride.instant_booking ? " — this ride books instantly." : "."}
              </p>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RideDetail;