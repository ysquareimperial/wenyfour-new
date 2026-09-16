// src/pages/PublishRide.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './PublishRide.css';
import { TimeField, DateField } from '../Components/DateTimeFields';

const API_BASE = 'https://api.wenyfour.com.ng';

// API requires coordinates; we send 0s from the UI (see note in the message).
const ZERO_COORDS = { lat: 0, lng: 0 };

/* ------------------------------------------------------------------ *
 *  Auth helper
 * ------------------------------------------------------------------ */
function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    ''
  );
}

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeFriendly(time) {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function carLabel(car) {
  const parts = [car.make, car.model].filter(Boolean).join(' ');
  const year = car.year ? ` · ${car.year}` : '';
  const plate = car.plate_number ? ` · ${car.plate_number}` : '';
  return `${parts}${year}${plate}`;
}

const EMPTY_STOPOVER = { location: '' };

/* ------------------------------------------------------------------ *
 *  Icons (subset — same set as before, kept inline)
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
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Car: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
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

  const presetCarId = location.state?.carId ?? location.state?.car?.id ?? '';

  // Cars list
  const [cars, setCars] = useState(null);
  const [carsStatus, setCarsStatus] = useState('idle'); // idle | loading | success | error
  const [carsError, setCarsError] = useState('');

  // Form state
  const [carId, setCarId] = useState(presetCarId ? String(presetCarId) : '');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [stopovers, setStopovers] = useState([]);
  const [dates, setDates] = useState([todayISO()]);
  const [pickupTime, setPickupTime] = useState('');
  const [maxPassengers, setMaxPassengers] = useState(4);
  const [maxBackSeatPassengers, setMaxBackSeatPassengers] = useState(3);
  const [instantBooking, setInstantBooking] = useState(false);
  const [pricePerSeat, setPricePerSeat] = useState('');

  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [eligibilityBlocked, setEligibilityBlocked] = useState(false);
  const [createdRide, setCreatedRide] = useState(null);

  const today = todayISO();

  /* ---------------- fetch cars ---------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = getAuthToken();
      if (!token) {
        setCarsStatus('error');
        setCarsError('You need to be signed in to publish a ride.');
        return;
      }

      setCarsStatus('loading');
      setCarsError('');

      try {
        const res = await fetch(`${API_BASE}/cars/my-cars`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error('Your session has expired. Please sign in again.');
          }
          throw new Error(`Request failed with ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setCars(list);
        setCarsStatus('success');

        // If the user arrived without a preset carId, and there's exactly
        // one car, preselect it. Otherwise leave the select empty.
        setCarId((current) => {
          if (current) return current;
          if (list.length === 1) return String(list[0].id);
          return '';
        });
      } catch (err) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[publish ride] cars fetch failed:', err);
        setCarsStatus('error');
        setCarsError('We couldn\u2019t load your cars. Please refresh and try again.');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ---------------- stopovers ---------------- */

  const addStopover = () => setStopovers((s) => [...s, { ...EMPTY_STOPOVER }]);
  const removeStopover = (i) => setStopovers((s) => s.filter((_, idx) => idx !== i));
  const updateStopover = (i, key, value) =>
    setStopovers((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));

  /* ---------------- dates ---------------- */

  const addDate = () => {
    const last = dates[dates.length - 1];
    let seed = today;
    if (last) {
      const d = new Date(last);
      if (!Number.isNaN(d.getTime())) {
        d.setDate(d.getDate() + 1);
        seed = d.toISOString().slice(0, 10);
      }
    }
    setDates((arr) => [...arr, seed]);
  };

  const removeDate = (i) => setDates((arr) => arr.filter((_, idx) => idx !== i));
  const updateDate = (i, value) =>
    setDates((arr) => arr.map((d, idx) => (idx === i ? value : d)));

  const uniqueDates = useMemo(() => {
    const cleaned = dates.map((d) => (d || '').trim()).filter(Boolean);
    return Array.from(new Set(cleaned)).sort();
  }, [dates]);

  /* ---------------- submit ---------------- */

  const validate = () => {
    if (!carId.trim()) return 'Please select the car you want to use.';
    if (!pickupLocation.trim()) return 'Please enter the pickup location.';
    if (!dropoffLocation.trim()) return 'Please enter the drop-off location.';
    if (uniqueDates.length === 0) return 'Please add at least one departure date.';
    if (!pickupTime) return 'Please choose a pickup time.';
    if (!maxPassengers || Number(maxPassengers) < 1) {
      return 'Maximum passengers must be at least 1.';
    }
    if (pricePerSeat === '' || Number(pricePerSeat) <= 0) {
      return 'Please enter a price per seat.';
    }
    for (const [i, s] of stopovers.entries()) {
      if (!s.location.trim()) return `Stopover ${i + 1} needs a location.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setEligibilityBlocked(false);

    const problem = validate();
    if (problem) { setErrorMsg(problem); return; }

    const token = getAuthToken();
    if (!token) {
      setStatus('error');
      setErrorMsg('You need to be signed in to publish a ride.');
      return;
    }

    setStatus('submitting');

    const cleanStopovers = stopovers
      .filter((s) => s.location.trim())
      .map((s) => ({
        location: s.location.trim(),
        lat: ZERO_COORDS.lat,
        lng: ZERO_COORDS.lng,
      }));

    const payload = {
      car_id: Number(carId),
      pickup_location: pickupLocation.trim(),
      pickup_lat: ZERO_COORDS.lat,
      pickup_lng: ZERO_COORDS.lng,
      dropoff_location: dropoffLocation.trim(),
      dropoff_lat: ZERO_COORDS.lat,
      dropoff_lng: ZERO_COORDS.lng,
      stopovers: cleanStopovers,
      dates: uniqueDates,
      pickup_time: `${pickupTime}:00`,
      max_passengers: Number(maxPassengers),
      max_back_seat_passengers: Number(maxBackSeatPassengers),
      instant_booking: !!instantBooking,
      price_per_seat: Number(pricePerSeat),
    };

    try {
      const res = await fetch(`${API_BASE}/rides/`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = '';
        try {
          const body = await res.json();
          if (Array.isArray(body?.detail)) {
            detail = body.detail.map((d) => `${d.loc?.join('.')}: ${d.msg}`).join('; ');
          } else if (typeof body?.detail === 'string') {
            detail = body.detail;
          }
        } catch { /* ignore */ }

        const lower = (detail || '').toLowerCase();
        const eligibleHint =
          res.status === 403 ||
          /eligib|verif|licence|license|nin|profile/.test(lower);

        if (res.status === 401) {
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (eligibleHint) {
          setEligibilityBlocked(true);
          throw new Error(
            detail ||
            'You need to complete your profile and verify your NIN and driver\u2019s licence before publishing rides.'
          );
        }
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      const ride = await res.json();
      setCreatedRide(ride);
      setStatus('success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[publish ride] failed:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    }
  };

  /* ---------------- success screen ---------------- */

  if (status === 'success' && createdRide) {
    return (
      <div className="publish_ride_page">
        <div className="pr_inner">
          <div className="pr_state">
            <div className="pr_state_icon success"><Icon.Check /></div>
            <h1 className="pr_state_title">Ride published</h1>
            <p className="pr_state_copy">
              Your ride from <strong>{createdRide.pickup_location}</strong> to{' '}
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
                  {uniqueDates.length} {uniqueDates.length === 1 ? 'date' : 'dates'}
                </span>
              </div>
              <div className="pr_success_row">
                <span className="pr_success_label">Price / seat</span>
                <span className="pr_success_value">
                  ₦{Number(createdRide.price_per_seat).toLocaleString('en-NG')}
                </span>
              </div>
            </div>

            <div className="pr_state_actions">
              <button
                type="button"
                className="pr_btn primary"
                onClick={() => navigate('/search-ride')}
              >
                See my ride in search
                <Icon.Arrow />
              </button>
              <button
                type="button"
                className="pr_btn ghost"
                onClick={() => {
                  setStatus('idle');
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

  const submitting = status === 'submitting';
  const carsLoading = carsStatus === 'loading';
  const noCars = carsStatus === 'success' && cars && cars.length === 0;

  return (
    <div className="publish_ride_page">
      <div className="pr_inner">
        <header className="pr_header">
          <p className="pr_eyebrow">Driver</p>
          <h1 className="pr_title">Publish a ride</h1>
          <p className="pr_subtitle">
            Set your route, pickup time, dates, and price. You can publish more rides anytime.
          </p>
        </header>

        {errorMsg && (
          <div className="pr_alert" role="alert">
            <Icon.Alert />
            <div>
              <span>{errorMsg}</span>
              {eligibilityBlocked && (
                <span className="pr_alert_hint">
                  Complete your driver profile and verification to unlock publishing.
                </span>
              )}
            </div>
          </div>
        )}

        {/* No-cars guard */}
        {noCars && (
          <div className="pr_alert" role="alert">
            <Icon.Alert />
            <div>
              <span>You need a car on your profile before you can publish a ride.</span>
              <button
                type="button"
                className="pr_alert_link"
                onClick={() => navigate('/cars/new')}
              >
                Add a car
              </button>
            </div>
          </div>
        )}

        <form className="pr_form" onSubmit={handleSubmit} noValidate>
          {/* ---- Car ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Vehicle</h2>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_car_select">Car</label>

              {carsLoading ? (
                <div className="pr_select_skeleton" aria-hidden="true" />
              ) : (
                <div className="pr_input_wrap">
                  <span className="pr_input_icon" aria-hidden="true"><Icon.Car /></span>
                  <select
                    id="pr_car_select"
                    className="pr_input pr_select"
                    value={carId}
                    onChange={(e) => setCarId(e.target.value)}
                    required
                    disabled={noCars}
                  >
                    <option value="" disabled>
                      {noCars ? 'No cars available' : 'Select a car'}
                    </option>
                    {(cars || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {carLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {carsStatus === 'error' && (
                <span className="pr_hint error">{carsError}</span>
              )}
              {!carsLoading && carsStatus === 'success' && cars.length > 0 && (
                <span className="pr_hint">
                  {cars.length} {cars.length === 1 ? 'car' : 'cars'} on your profile.
                </span>
              )}
            </div>
          </section>

          {/* ---- Route ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Route</h2>

            <div className="pr_field">
              <label className="pr_label" htmlFor="pr_pickup_location">Pickup location</label>
              <div className="pr_input_wrap">
                <span className="pr_input_icon" aria-hidden="true"><Icon.Pin /></span>
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
              <label className="pr_label" htmlFor="pr_dropoff_location">Drop-off location</label>
              <div className="pr_input_wrap">
                <span className="pr_input_icon" aria-hidden="true"><Icon.Flag /></span>
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
                        <label className="pr_label" htmlFor={`pr_stop_loc_${i}`}>Location</label>
                        <input
                          id={`pr_stop_loc_${i}`}
                          className="pr_input no_icon"
                          type="text"
                          placeholder="e.g. Zaria"
                          value={s.location}
                          onChange={(e) => updateStopover(i, 'location', e.target.value)}
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
              <label className="pr_label" htmlFor="pr_pickup_time">Pickup time</label>
              <TimeField
                id="pr_pickup_time"
                value={pickupTime}
                onChange={setPickupTime}
                placeholder="Select a time"
              />
              {pickupTime && (
                <span className="pr_hint">Will be published as {formatTimeFriendly(pickupTime)}.</span>
              )}
            </div>

            <div className="pr_field">
              <div className="pr_field_head">
                <label className="pr_label">Departure dates</label>
                <button type="button" className="pr_add_btn subtle" onClick={addDate}>
                  <Icon.Plus /> Add date
                </button>
              </div>

              <div className="pr_dates">
                {dates.map((d, i) => (
                  <div className="pr_date_row" key={i}>
                    <span className="pr_input_icon inline" aria-hidden="true"><Icon.Calendar /></span>
                    <DateField
                      value={d}
                      onChange={(next) => updateDate(i, next)}
                      min={today}
                      placeholder="Pick a date"
                    />
                    {dates.length > 1 && (
                      <button
                        type="button"
                        className="pr_remove_btn"
                        onClick={() => removeDate(i)}
                        aria-label={`Remove date ${i + 1}`}
                      >
                        <Icon.Close />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {uniqueDates.length > 1 && (
                <span className="pr_hint">
                  {uniqueDates.length} unique dates will be published (duplicates ignored).
                </span>
              )}
            </div>
          </section>

          {/* ---- Capacity & pricing ---- */}
          <section className="pr_section">
            <h2 className="pr_section_title">Seats &amp; pricing</h2>

            <div className="pr_row">
              <div className="pr_field">
                <label className="pr_label" htmlFor="pr_max_passengers">Max passengers</label>
                <div className="pr_input_wrap">
                  <span className="pr_input_icon" aria-hidden="true"><Icon.User /></span>
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
                <label className="pr_label" htmlFor="pr_max_back">Max back-seat passengers</label>
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
              <label className="pr_label" htmlFor="pr_price">Price per seat (₦)</label>
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
                  ₦{Number(pricePerSeat).toLocaleString('en-NG')} per seat.
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
                'Publish ride'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublishRide;