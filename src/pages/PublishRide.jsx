// src/pages/PublishRide.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PublishRide.css";
import { useAuth } from "../context/AuthContext";
import DriverGateModal from "./DriverGateModal";
import { getDriverEligibility } from "../utils/driverEligibility";
import { getAuthToken } from "../services/http";
import { carsApi } from "../services/carsApi";
import { ridesApi } from "../services/ridesApi";

// API requires coordinates; we send 0s from the UI.
const ZERO_COORDS = { lat: 0, lng: 0 };

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTimeFriendly(time) {
  if (!time) return "";
  // Accepts "HH:MM" or "HH:MM:SS"
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function carLabel(car) {
  const parts = [car.make, car.model].filter(Boolean).join(" ");
  const year = car.year ? ` · ${car.year}` : "";
  const plate = car.plate_number ? ` · ${car.plate_number}` : "";
  return `${parts}${year}${plate}`;
}

const EMPTY_STOPOVER = { location: "", city_name: "", price_from_origin: "" };

/* ------------------------------------------------------------------ *
 *  Icons
 * ------------------------------------------------------------------ */

const Icon = {
  Pin: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0 1 18.5 10.5C18.5 15.6 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  Flag: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 21V4M6 4h10l-1.4 3.5L16 11H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  ),
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Car: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Plus: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Close: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12.5 10 17.5 19 7.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bolt: (p) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10H12l1-8Z" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */

const PublishRide = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const presetCarId = location.state?.carId ?? location.state?.car?.id ?? "";

  // Cars list
  const [cars, setCars] = useState(null);
  const [carsStatus, setCarsStatus] = useState("idle");
  const [carsError, setCarsError] = useState("");

  // Form state
  const [carId, setCarId] = useState(presetCarId ? String(presetCarId) : "");
  const [originCity, setOriginCity] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [dropoffLocation, setDropoffLocation] = useState("");
  const [stopovers, setStopovers] = useState([]);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [maxPassengers, setMaxPassengers] = useState(4);
  const [maxBackSeatPassengers, setMaxBackSeatPassengers] = useState(3);
  const [instantBooking, setInstantBooking] = useState(false);
  const [pricePerSeat, setPricePerSeat] = useState("");

  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [eligibilityBlocked, setEligibilityBlocked] = useState(false);
  const [createdRide, setCreatedRide] = useState(null);

  const today = todayISO();

  const { user, refreshProfile } = useAuth();
  const eligibility = getDriverEligibility(user);
  const [gateOpen, setGateOpen] = useState(false);

  /* ---------------- fetch cars ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getAuthToken();
      if (!token) {
        setCarsStatus("error");
        setCarsError("You need to be signed in to publish a ride.");
        return;
      }

      setCarsStatus("loading");
      setCarsError("");

      try {
        const list = await carsApi.list();
        if (cancelled) return;
        setCars(list);
        setCarsStatus("success");

        setCarId((current) => {
          if (current) return current;
          if (list.length === 1) return String(list[0].id);
          return "";
        });
      } catch (err) {
        if (cancelled) return;
        console.error("[publish ride] cars fetch failed:", err);
        setCarsStatus("error");
        setCarsError(err.message || "We couldn't load your cars. Please refresh and try again.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------- stopovers ---------------- */

  const addStopover = () => setStopovers((s) => [...s, { ...EMPTY_STOPOVER }]);
  const removeStopover = (i) => setStopovers((s) => s.filter((_, idx) => idx !== i));
  const updateStopover = (i, key, value) =>
    setStopovers((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));

  /* ---------------- dates ---------------- */

  const uniqueDates = useMemo(() => {
    const list = [];
    if (startDate) list.push(startDate.trim());
    if (endDate) list.push(endDate.trim());
    // include all distinct dates between start and end
    // include all distinct dates between start and end (UTC math so the
    // user's timezone can't shift a day)
    if (startDate && endDate) {
      const s = new Date(`${startDate}T00:00:00Z`);
      const e = new Date(`${endDate}T00:00:00Z`);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && s <= e) {
        const cur = new Date(s);
        let guard = 0;
        while (cur <= e && guard < 366) {
          const iso = cur.toISOString().slice(0, 10);
          if (!list.includes(iso)) list.push(iso);
          cur.setUTCDate(cur.getUTCDate() + 1);
          guard += 1;
        }
      }
    }
    return Array.from(new Set(list.filter(Boolean))).sort();
  }, [startDate, endDate]);

  /* ---------------- submit ---------------- */

  const validate = () => {
    if (!carId.trim()) return "Please select the car you want to use.";
    if (!originCity.trim()) return "Please enter the origin city.";
    if (!destinationCity.trim()) return "Please enter the destination city.";
    if (!pickupLocation.trim()) return "Please enter the pickup location.";
    if (!dropoffLocation.trim()) return "Please enter the drop-off location.";
    if (!startDate) return "Please choose a start date.";
    if (endDate && endDate < startDate) return "End date cannot be before start date.";
    if (!pickupTime) return "Please choose a pickup time.";
    if (!maxPassengers || Number(maxPassengers) < 1) {
      return "Maximum passengers must be at least 1.";
    }
    if (Number(maxBackSeatPassengers) > Number(maxPassengers)) {
      return "Back-seat passengers can't be more than the total passengers.";
    }
    const chosenCar = (cars || []).find((c) => String(c.id) === String(carId));
    if (chosenCar?.capacity && Number(maxPassengers) > Number(chosenCar.capacity)) {
      return `This car only seats ${chosenCar.capacity} passengers.`;
    }
    if (endDate) {
      const span =
        (new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`)) / 86400000;
      if (span > 365) return "Rides can be scheduled at most a year ahead.";
    }
    if (pricePerSeat === "" || Number(pricePerSeat) <= 0) {
      return "Please enter a price per seat.";
    }
    for (const [i, s] of stopovers.entries()) {
      if (!s.location.trim()) return `Stopover ${i + 1} needs a location.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setEligibilityBlocked(false);

    const problem = validate();
    if (problem) {
      setErrorMsg(problem);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setStatus("error");
      setErrorMsg("You need to be signed in to publish a ride.");
      return;
    }

    if (!eligibility.eligible) {
      setGateOpen(true);
      return;
    }

    setStatus("submitting");

    const cleanStopovers = stopovers
      .filter((s) => s.location.trim())
      .map((s, i) => ({
        location: s.location.trim(),
        city_name: (s.city_name || "").trim(),
        address: "",
        lat: ZERO_COORDS.lat,
        lng: ZERO_COORDS.lng,
        order: i,
        price_from_origin:
          s.price_from_origin === "" ? 0 : Number(s.price_from_origin),
      }));

    // API wants HH:MM:SS
    const pickupTimeFull = pickupTime.length === 5 ? `${pickupTime}:00` : pickupTime;

    const payload = {
      car_id: Number(carId),
      origin_city: originCity.trim(),
      destination_city: destinationCity.trim(),
      pickup_location: pickupLocation.trim(),
      pickup_lat: ZERO_COORDS.lat,
      pickup_lng: ZERO_COORDS.lng,
      dropoff_location: dropoffLocation.trim(),
      dropoff_lat: ZERO_COORDS.lat,
      dropoff_lng: ZERO_COORDS.lng,
      stopovers: cleanStopovers,
      dates: uniqueDates,
      start_date: startDate,
      ...(endDate ? { end_date: endDate } : {}),
      pickup_time: pickupTimeFull,
      max_passengers: Number(maxPassengers),
      max_back_seat_passengers: Number(maxBackSeatPassengers),
      instant_booking: !!instantBooking,
      price_per_seat: Number(pricePerSeat),
    };

    try {
      const ride = await ridesApi.publish(payload);
      setCreatedRide(ride);
      setStatus("success");
    } catch (err) {
      console.error("[publish ride] failed:", err);
      const lower = (err.message || "").toLowerCase();
      if (err.status === 403 || /eligib|verif|licen[cs]e|nin|profile|suspend/.test(lower)) {
        setEligibilityBlocked(true);
      }
      setStatus("error");
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    }
  };

  /* ---------------- success screen ---------------- */

  if (status === "success" && createdRide) {
    return (
      <div className="publish_ride_page">
        <div className="pr_inner">
          <div className="pr_state">
            <div className="pr_state_icon success">
              <Icon.Check />
            </div>
            <h1 className="pr_state_title">Ride published</h1>
            <p className="pr_state_copy">
              Your ride from <strong>{createdRide.pickup_location}</strong> to{" "}
              <strong>{createdRide.dropoff_location}</strong> is now live.
            </p>

            <div className="pr_success_summary">
              <div className="pr_success_row">
                <span className="pr_success_label">Departure</span>
                <span className="pr_success_value">
                  {formatTimeFriendly(createdRide.pickup_time)}
                </span>
              </div>
              <div className="pr_success_row">
                <span className="pr_success_label">Dates</span>
                <span className="pr_success_value">
                  {uniqueDates.length} {uniqueDates.length === 1 ? "date" : "dates"}
                </span>
              </div>
              <div className="pr_success_row">
                <span className="pr_success_label">Price / seat</span>
                <span className="pr_success_value">
                  ₦{Number(createdRide.price_per_seat).toLocaleString("en-NG")}
                </span>
              </div>
            </div>

            <div className="pr_state_actions">
              <button
                type="button"
                className="pr_btn primary"
                onClick={() => navigate("/search-ride")}
              >
                See my ride in search
                <Icon.Arrow />
              </button>
              <button
                type="button"
                className="pr_btn ghost"
                onClick={() => {
                  setStatus("idle");
                  setCreatedRide(null);
                }}
              >
                Publish another ride
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- form ---------------- */

  const submitting = status === "submitting";
  const carsLoading = carsStatus === "loading";
  const noCars = carsStatus === "success" && cars && cars.length === 0;

  return (
    <div className="publish_ride_page">
      <div className="pr_inner">
        <header className="pr_header">
          <p className="pr_eyebrow">Driver</p>
          <h1 className="pr_title">Publish a ride</h1>
          <p className="pr_subtitle">
            Set your route, pickup time, dates, and price. You can publish more
            rides anytime.
          </p>
        </header>

        {errorMsg && (
          <div className="pr_alert" role="alert">
            <Icon.Alert />
            <div>
              <span>{errorMsg}</span>
              {eligibilityBlocked && (
                <span className="pr_alert_hint">
                  Complete your driver profile and verification to unlock
                  publishing.
                </span>
              )}
            </div>
          </div>
        )}

        {noCars && (
          <div className="pr_alert" role="alert">
            <Icon.Alert />
            <div>
              {eligibility.eligible ? (
                <>
                  <span>
                    You need a car on your profile before you can publish a ride.
                  </span>
                  <button
                    type="button"
                    className="pr_alert_link"
                    onClick={() => navigate("/cars/new")}
                  >
                    Add a car
                  </button>
                </>
              ) : (
                <>
                  <span>
                    You need to complete your driver verification before you can
                    publish a ride.
                  </span>
                  <button
                    type="button"
                    className="pr_alert_link"
                    onClick={() => setGateOpen(true)}
                  >
                    Complete verification
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <form className="pr_form" onSubmit={handleSubmit} noValidate>
          {/* ---- Car ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Vehicle</h2>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_car_select">
                Car
              </label>

              {carsLoading ? (
                <div className="pr_select_skeleton" aria-hidden="true" />
              ) : (
                <div className="pr_input_wrap">
                  <span className="pr_input_icon" aria-hidden="true">
                    <Icon.Car />
                  </span>
                  <select
                    id="pr_car_select"
                    className="pr_input pr_select"
                    value={carId}
                    onChange={(e) => setCarId(e.target.value)}
                    required
                    disabled={noCars}
                  >
                    <option value="" disabled>
                      {noCars ? "No cars available" : "Select a car"}
                    </option>
                    {(cars || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {carLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {carsStatus === "error" && (
                <span className="pr_hint error">{carsError}</span>
              )}
              {!carsLoading && carsStatus === "success" && cars.length > 0 && (
                <span className="pr_hint">
                  {cars.length} {cars.length === 1 ? "car" : "cars"} on your
                  profile.
                </span>
              )}
            </div>
          </section>

          {/* ---- Route ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Route</h2>

            <div className="pr_row">
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_origin_city">
                  From (origin city)
                </label>
                <div className="pr_input_wrap">
                  <span className="pr_input_icon" aria-hidden="true">
                    <Icon.Pin />
                  </span>
                  <input
                    id="pr_origin_city"
                    className="pr_input"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Kano"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_destination_city">
                  To (destination city)
                </label>
                <div className="pr_input_wrap">
                  <span className="pr_input_icon" aria-hidden="true">
                    <Icon.Flag />
                  </span>
                  <input
                    id="pr_destination_city"
                    className="pr_input"
                    type="text"
                    autoComplete="off"
                    placeholder="e.g. Abuja"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_pickup_location">
                Pickup location
              </label>
              <div className="pr_input_wrap">
                <span className="pr_input_icon" aria-hidden="true">
                  <Icon.Pin />
                </span>
                <input
                  id="pr_pickup_location"
                  className="pr_input"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Shoprite, Ikeja"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_dropoff_location">
                Drop-off location
              </label>
              <div className="pr_input_wrap">
                <span className="pr_input_icon" aria-hidden="true">
                  <Icon.Flag />
                </span>
                <input
                  id="pr_dropoff_location"
                  className="pr_input"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Challenge, Ibadan"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  required
                />
              </div>
            </div>
          </section>

          {/* ---- Stopovers ---- */}
          <section className="pr_section">
            <div className="pr_section_head">
              <h2 className="pr_section_title">Stopovers</h2>
              <button type="button" className="pr_add_btn" onClick={addStopover}>
                <Icon.Plus /> Add stopover
              </button>
            </div>

            {stopovers.length === 0 ? (
              <p className="pr_empty_copy">
                No stopovers. Your ride goes directly from pickup to drop-off.
              </p>
            ) : (
              <div className="pr_stopovers">
                {stopovers.map((s, i) => (
                  <div className="pr_stopover" key={i}>
                    <div className="pr_stopover_index">{i + 1}</div>
                    <div className="pr_stopover_fields">
                      <div className="pr_field">
                        <label className="pr_label" htmlFor={`pr_stop_loc_${i}`}>
                          Location
                        </label>
                        <input
                          id={`pr_stop_loc_${i}`}
                          className="pr_input no_icon"
                          type="text"
                          placeholder="e.g. Zaria"
                          value={s.location}
                          onChange={(e) =>
                            updateStopover(i, "location", e.target.value)
                          }
                        />
                      </div>
                      <div className="pr_field">
                        <label className="pr_label" htmlFor={`pr_stop_city_${i}`}>
                          City name
                        </label>
                        <input
                          id={`pr_stop_city_${i}`}
                          className="pr_input no_icon"
                          type="text"
                          placeholder="e.g. Zaria"
                          value={s.city_name}
                          onChange={(e) =>
                            updateStopover(i, "city_name", e.target.value)
                          }
                        />
                      </div>
                      <div className="pr_field">
                        <label className="pr_label" htmlFor={`pr_stop_price_${i}`}>
                          Price from origin (₦)
                        </label>
                        <input
                          id={`pr_stop_price_${i}`}
                          className="pr_input no_icon"
                          type="number"
                          min="0"
                          step="50"
                          inputMode="numeric"
                          placeholder="0"
                          value={s.price_from_origin}
                          onChange={(e) =>
                            updateStopover(i, "price_from_origin", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pr_remove_btn"
                      onClick={() => removeStopover(i)}
                      aria-label={`Remove stopover ${i + 1}`}
                    >
                      <Icon.Close />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- Schedule ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Schedule</h2>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_pickup_time">
                Pickup time
              </label>
              <input
                id="pr_pickup_time"
                className="pr_input no_icon"
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                required
              />
              {pickupTime && (
                <span className="pr_hint">
                  Will be published as {formatTimeFriendly(pickupTime)}.
                </span>
              )}
            </div>

            <div className="pr_row">
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_start_date">
                  Start date
                </label>
                <input
                  id="pr_start_date"
                  className="pr_input no_icon"
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_end_date">
                  End date (optional)
                </label>
                <input
                  id="pr_end_date"
                  className="pr_input no_icon"
                  type="date"
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {uniqueDates.length > 1 && (
              <span className="pr_hint">
                {uniqueDates.length} dates will be published (every day from
                start to end).
              </span>
            )}
          </section>

          {/* ---- Capacity & pricing ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Seats &amp; pricing</h2>

            <div className="pr_row">
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_max_passengers">
                  Max passengers
                </label>
                <div className="pr_input_wrap">
                  <span className="pr_input_icon" aria-hidden="true">
                    <Icon.User />
                  </span>
                  <input
                    id="pr_max_passengers"
                    className="pr_input"
                    type="number"
                    min="1"
                    max="20"
                    inputMode="numeric"
                    value={maxPassengers}
                    onChange={(e) => setMaxPassengers(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_max_back">
                  Max back-seat passengers
                </label>
                <input
                  id="pr_max_back"
                  className="pr_input no_icon"
                  type="number"
                  min="0"
                  max="20"
                  inputMode="numeric"
                  value={maxBackSeatPassengers}
                  onChange={(e) => setMaxBackSeatPassengers(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_price">
                Price per seat (₦)
              </label>
              <input
                id="pr_price"
                className="pr_input no_icon"
                type="number"
                min="1"
                step="50"
                inputMode="numeric"
                placeholder="e.g. 10000"
                value={pricePerSeat}
                onChange={(e) => setPricePerSeat(e.target.value)}
                required
              />
              {pricePerSeat && !Number.isNaN(Number(pricePerSeat)) && (
                <span className="pr_hint">
                  ₦{Number(pricePerSeat).toLocaleString("en-NG")} per seat.
                </span>
              )}
            </div>

            <label className="pr_check">
              <input
                type="checkbox"
                checked={instantBooking}
                onChange={(e) => setInstantBooking(e.target.checked)}
              />
              <span className="pr_check_text">
                <span className="pr_check_title">
                  <Icon.Bolt /> Instant booking
                </span>
                <span className="pr_check_sub">
                  Passengers can book without waiting for your confirmation.
                </span>
              </span>
            </label>
          </section>

          <div className="pr_form_footer">
            <button
              type="submit"
              className="pr_submit"
              disabled={submitting || noCars}
              aria-busy={submitting}
            >
              {submitting ? (
                <>
                  <span className="pr_spinner" aria-hidden="true" />
                  Publishing…
                </>
              ) : (
                "Publish ride"
              )}
            </button>
          </div>
        </form>
      </div>

      <DriverGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        eligibility={eligibility}
        onRefresh={refreshProfile}
        user={user}
        actionLabel="publish a ride"
      />
    </div>
  );
};

export default PublishRide;