// src/pages/RideDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./RideDetail.css";
import { getAuthToken } from "../services/http";
import { bookingsApi } from "../services/bookingsApi";
import {
  PAYMENT_PROVIDERS,
  paymentsApi,
  rememberPendingPayment,
} from "../services/paymentsApi";
import { ridesApi } from "../services/ridesApi";
import { useAuth } from "../context/AuthContext";

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

  const { user } = useAuth();
  const presetDate = location.state?.date || "";
  const presetPassengers = Number(location.state?.passengers) || 1;
  // Seats left on the searched date (from /rides/search). The ride itself
  // only carries max_passengers, so this is the best number we have.
  const seatsLeftHint =
    location.state?.seatsLeft != null && presetDate
      ? Number(location.state.seatsLeft)
      : null;

  const [ride, setRide] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedDate, setSelectedDate] = useState(presetDate);

  // Booking state
  const [seats, setSeats] = useState(presetPassengers);
  const [bookingStatus, setBookingStatus] = useState("idle"); // idle | submitting | success | error
  const [bookingError, setBookingError] = useState("");
  const [provider, setProvider] = useState("paystack");
  const [bookingStep, setBookingStep] = useState(""); // "" | booking | payment | redirect

  /* -------- fetch ride -------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMsg("");
      try {
        const data = await ridesApi.get(id);
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
        setErrorMsg(
          err.status === 404
            ? "This ride no longer exists."
            : err.message || "Could not load this ride.",
        );
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

  const seatCap =
    selectedDate && selectedDate === presetDate && seatsLeftHint != null
      ? seatsLeftHint
      : ride?.max_passengers || 1;
  const maxSeats = Math.max(1, seatCap);
  const totalPrice = ride ? Number(ride.price_per_seat) * seats : 0;
  const isOwnRide = !!(user?.id && ride?.driver_id && user.id === ride.driver_id);

  // Keep the seat count inside the allowed range when the date changes.
  useEffect(() => {
    setSeats((s) => Math.min(Math.max(1, s), maxSeats));
  }, [maxSeats]);

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

    // Pay-to-book: reserve the seat(s), then send the passenger straight to
    // the payment page. The booking only counts once the payment verifies.
    let created = null;
    try {
      setBookingStep("booking");
      created = await bookingsApi.create({
        rideId: ride.id,
        travelDate: selectedDate,
        seats,
      });

      setBookingStep("payment");
      const init = await paymentsApi.initialize({
        bookingId: created.id,
        provider,
      });

      rememberPendingPayment({
        bookingId: created.id,
        paymentId: init.payment_id,
        transactionRef: init.transaction_ref,
        provider: init.provider || provider,
        rideId: ride.id,
        amountNaira: init.amount_naira,
      });

      if (init.auth_url) {
        setBookingStep("redirect");
        window.location.assign(init.auth_url);
        return;
      }
      // No hosted page returned — go straight to verification.
      navigate(
        `/payments/callback?reference=${encodeURIComponent(init.transaction_ref)}`,
        { replace: true },
      );
    } catch (err) {
      console.error("[booking] failed:", err);
      // Don't leave an unpaid booking holding seats if payment never started.
      if (created?.id) {
        bookingsApi.cancel(created.id).catch(() => {});
      }
      setBookingStatus("error");
      setBookingStep("");
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
            {isOwnRide ? (
              <div className="rd_book_card">
                <div className="rd_price_head">
                  <span className="rd_price_value">
                    {formatNaira(ride.price_per_seat)}
                  </span>
                  <span className="rd_price_unit">per seat</span>
                </div>
                <p className="rd_book_note" style={{ marginTop: 0 }}>
                  This is your ride. Passengers will see a booking panel here.
                </p>
              </div>
            ) : (
            <form className="rd_book_card" onSubmit={handleBook}>
              <div className="rd_price_head">
                <span className="rd_price_value">
                  {formatNaira(ride.price_per_seat)}
                </span>
                <span className="rd_price_unit">per seat</span>
              </div>

              {seatsLeftHint != null && selectedDate === presetDate && (
                <p className="rd_book_note" style={{ marginTop: -6 }}>
                  {seatsLeftHint} seat{seatsLeftHint === 1 ? "" : "s"} left on{" "}
                  {formatDateShort(presetDate)}
                </p>
              )}

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

              {/* Payment method */}
              <fieldset className="rd_field rd_pay_field">
                <legend className="rd_label">Pay with</legend>
                <div className="rd_pay_options">
                  {PAYMENT_PROVIDERS.map((p) => (
                    <label
                      key={p.value}
                      className={`rd_pay_option${provider === p.value ? " active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="rd_provider"
                        value={p.value}
                        checked={provider === p.value}
                        onChange={() => setProvider(p.value)}
                      />
                      <span className="rd_pay_radio" aria-hidden="true" />
                      <span className="rd_pay_text">
                        <span className="rd_pay_name">{p.label}</span>
                        <span className="rd_pay_hint">{p.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

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
                    {bookingStep === "redirect"
                      ? "Opening payment…"
                      : bookingStep === "payment"
                        ? "Preparing payment…"
                        : "Reserving seat…"}
                  </>
                ) : (
                  <>
                    Pay {formatNaira(totalPrice)} &amp; book
                    <Icon.Arrow />
                  </>
                )}
              </button>

              <p className="rd_book_note">
                You&apos;ll pay securely on {provider === "squad" ? "Squad" : "Paystack"}.
                {ride.instant_booking
                  ? " This ride books instantly once payment clears."
                  : " The driver confirms your seat after payment."}
              </p>
            </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RideDetail;