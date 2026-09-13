// src/pages/SearchRide.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './SearchRide.css';

/* ------------------------------------------------------------------ *
 *  Config
 * ------------------------------------------------------------------ */

const API_BASE = 'https://api.wenyfour.com.ng';
const SEARCH_ENDPOINT = `${API_BASE}/rides/search`;

// Only include sort values that are reasonable against the API surface.
// If your backend doc changes, adjust here — everything else derives from this.
const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'price', label: 'Lowest price' },
  { value: 'pickup_time', label: 'Earliest departure' },
];

const AMENITY_FILTERS = [
  { key: 'has_wifi', label: 'Wi-Fi' },
  { key: 'has_air_conditioning', label: 'Air conditioning' },
  { key: 'has_power_outlets', label: 'Power outlets' },
  { key: 'smoking_allowed', label: 'Smoking allowed' },
  { key: 'pets_allowed', label: 'Pets allowed' },
  { key: 'wheelchair_accessible', label: 'Wheelchair accessible' },
];

const AMENITY_LABELS = {
  has_wifi: 'Wi-Fi',
  has_air_conditioning: 'A/C',
  has_power_outlets: 'Power',
  smoking_allowed: 'Smoking',
  pets_allowed: 'Pets',
  wheelchair_accessible: 'Accessible',
};

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

/** YYYY-MM-DD for today, in local time. */
function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format YYYY-MM-DD -> "Sun, Sep 20" */
function formatDateFriendly(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Format "13:42:58.081000" or "13:42" -> "1:42 PM" */
function formatTimeFriendly(time) {
  if (!time) return '';
  const [hStr, mStr] = String(time).split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** "10000.00" -> "₦10,000" (drops decimals when .00) */
function formatNaira(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return '₦—';
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

function seatsLabel(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  if (num <= 0) return 'Full';
  return `${num} seat${num === 1 ? '' : 's'} left`;
}

function carLabel(car) {
  if (!car) return '';
  const parts = [car.make, car.model].filter(Boolean);
  const label = parts.join(' ');
  return car.year ? `${label} · ${car.year}` : label;
}

function activeAmenities(car) {
  if (!car) return [];
  return AMENITY_FILTERS
    .filter((f) => car[f.key] === true)
    .map((f) => AMENITY_LABELS[f.key]);
}

function stopoverLabel(stopovers) {
  if (!Array.isArray(stopovers) || stopovers.length === 0) return null;
  if (stopovers.length === 1) {
    return stopovers[0].location ? `Via ${stopovers[0].location}` : '1 stop';
  }
  return `${stopovers.length} stops`;
}

/* ------------------------------------------------------------------ *
 *  Inline icons
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
      <path d="M6 21V4M6 4h10l-1.4 3.5L16 11H6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  Calendar: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  User: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c.9-3.4 3.6-5.2 7-5.2s6.1 1.8 7 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Swap: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M7 4v16M7 20l-3.5-3.5M7 20l3.5-3.5M17 20V4M17 4l-3.5 3.5M17 4l3.5 3.5"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Search: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  Sliders: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  Arrow: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
  Seat: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 4v10a3 3 0 0 0 3 3h6M18 20v-4a2 2 0 0 0-2-2H9"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Car: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 15v-2.2l1.4-3.9A2 2 0 0 1 7.3 7.5h9.4a2 2 0 0 1 1.9 1.4L20 12.8V15"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3.5 15h17v3.2a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V18H7.1v.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1V15Z"
        stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="7.5" cy="15" r=".9" fill="currentColor" />
      <circle cx="16.5" cy="15" r=".9" fill="currentColor" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  Passenger stepper
 * ------------------------------------------------------------------ */

function PassengerStepper({ value, onChange, min = 1, max = 8 }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="rs_stepper" role="group" aria-label="Passengers">
      <button
        type="button"
        className="rs_stepper_btn"
        onClick={dec}
        disabled={value <= min}
        aria-label="Decrease passengers"
      >−</button>
      <span className="rs_stepper_value" aria-live="polite">
        {value}
        <small>{value === 1 ? 'passenger' : 'passengers'}</small>
      </span>
      <button
        type="button"
        className="rs_stepper_btn"
        onClick={inc}
        disabled={value >= max}
        aria-label="Increase passengers"
      >+</button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Skeleton
 * ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="rs_card rs_skeleton" aria-hidden="true">
      <div className="rs_sk_row">
        <div className="rs_sk_block rs_sk_time" />
        <div className="rs_sk_block rs_sk_price" />
      </div>
      <div className="rs_sk_block rs_sk_route" />
      <div className="rs_sk_block rs_sk_meta" />
      <div className="rs_sk_block rs_sk_meta short" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Ride card
 * ------------------------------------------------------------------ */

function RideCard({ ride, onSelect }) {
  const price = formatNaira(ride.price_per_seat);
  const time = formatTimeFriendly(ride.pickup_time);
  const dateISO = ride.searched_date;
  const dateLabel = formatDateFriendly(dateISO);
  const seats = ride.seats_remaining_for_date;
  const car = ride.car || {};
  const amenities = activeAmenities(car);
  const stopLabel = stopoverLabel(ride.stopovers);
  const isFull = Number(seats) <= 0;

  return (
    <article className="rs_card" aria-label={`Ride from ${ride.pickup_location} to ${ride.dropoff_location}`}>
      <header className="rs_card_top">
        <div className="rs_time_block">
          <span className="rs_time">{time}</span>
          <span className="rs_date">{dateLabel}</span>
        </div>
        <div className="rs_price_block">
          <span className="rs_price">{price}</span>
          <span className="rs_price_unit">per seat</span>
        </div>
      </header>

      <div className="rs_route">
        <div className="rs_route_rail" aria-hidden="true">
          <span className="rs_route_dot start" />
          <span className="rs_route_line" />
          <span className="rs_route_dot end" />
        </div>
        <div className="rs_route_locations">
          <div className="rs_route_point">
            <span className="rs_route_label">{ride.pickup_location}</span>
            <span className="rs_route_sub">Pickup</span>
          </div>
          {stopLabel && (
            <div className="rs_route_stop">{stopLabel}</div>
          )}
          <div className="rs_route_point">
            <span className="rs_route_label">{ride.dropoff_location}</span>
            <span className="rs_route_sub">Drop-off</span>
          </div>
        </div>
      </div>

      <div className="rs_card_meta">
        <span className="rs_car">
          <Icon.Car aria-hidden="true" />
          {carLabel(car)}
        </span>
        {ride.is_recurring && (
          <span className="rs_badge subtle">Recurring</span>
        )}
        {ride.instant_booking && (
          <span className="rs_badge instant">
            <Icon.Bolt aria-hidden="true" />
            Instant booking
          </span>
        )}
      </div>

      <div className="rs_card_footer">
        <div className="rs_footer_left">
          <span className={`rs_seats ${isFull ? 'full' : ''}`}>
            <Icon.Seat aria-hidden="true" />
            {seatsLabel(seats)}
          </span>
          {amenities.length > 0 && (
            <span className="rs_amenities">
              {amenities.map((a) => (
                <span key={a} className="rs_amenity">{a}</span>
              ))}
            </span>
          )}
        </div>
        <button
          type="button"
          className="rs_view_btn"
          onClick={() => onSelect && onSelect(ride)}
          disabled={isFull}
          aria-label={`View ride from ${ride.pickup_location} to ${ride.dropoff_location}`}
        >
          {isFull ? 'Full' : 'View ride'}
          {!isFull && <Icon.Arrow aria-hidden="true" />}
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 *  Filters drawer
 * ------------------------------------------------------------------ */

function FiltersDrawer({ open, value, onClose, onApply, onClear }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const setAmenity = (key) => (e) =>
    setDraft((d) => ({ ...d, [key]: e.target.checked }));

  return (
    <div className="rs_drawer_root" role="dialog" aria-modal="true" aria-label="Ride filters">
      <div className="rs_drawer_scrim" onClick={onClose} />
      <aside className="rs_drawer">
        <header className="rs_drawer_head">
          <h2>Filters</h2>
          <button type="button" className="rs_icon_btn" onClick={onClose} aria-label="Close filters">
            <Icon.Close />
          </button>
        </header>

        <div className="rs_drawer_body">
          <div className="rs_field">
            <label className="rs_field_label" htmlFor="rs_max_price">Maximum price (₦)</label>
            <input
              id="rs_max_price"
              className="rs_input"
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
              placeholder="e.g. 15000"
              value={draft.max_price}
              onChange={(e) => setDraft((d) => ({ ...d, max_price: e.target.value }))}
            />
          </div>

          <div className="rs_field_row">
            <div className="rs_field">
              <label className="rs_field_label" htmlFor="rs_time_from">Pickup from</label>
              <input
                id="rs_time_from"
                className="rs_input"
                type="time"
                value={draft.pickup_time_from}
                onChange={(e) => setDraft((d) => ({ ...d, pickup_time_from: e.target.value }))}
              />
            </div>
            <div className="rs_field">
              <label className="rs_field_label" htmlFor="rs_time_to">Pickup until</label>
              <input
                id="rs_time_to"
                className="rs_input"
                type="time"
                value={draft.pickup_time_to}
                onChange={(e) => setDraft((d) => ({ ...d, pickup_time_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="rs_field">
            <label className="rs_field_label" htmlFor="rs_car_make">Car make</label>
            <input
              id="rs_car_make"
              className="rs_input"
              type="text"
              placeholder="e.g. Toyota"
              value={draft.car_make}
              onChange={(e) => setDraft((d) => ({ ...d, car_make: e.target.value }))}
            />
          </div>

          <fieldset className="rs_fieldset">
            <legend className="rs_field_label">Amenities</legend>
            <div className="rs_checks">
              {AMENITY_FILTERS.map((f) => (
                <label key={f.key} className="rs_check">
                  <input
                    type="checkbox"
                    checked={!!draft[f.key]}
                    onChange={setAmenity(f.key)}
                  />
                  <span>{f.label}</span>
                </label>
              ))}
              <label className="rs_check">
                <input
                  type="checkbox"
                  checked={!!draft.instant_booking}
                  onChange={(e) => setDraft((d) => ({ ...d, instant_booking: e.target.checked }))}
                />
                <span>Instant booking only</span>
              </label>
            </div>
          </fieldset>
        </div>

        <footer className="rs_drawer_foot">
          <button type="button" className="rs_btn ghost" onClick={() => onClear()}>
            Clear all
          </button>
          <button type="button" className="rs_btn primary" onClick={() => onApply(draft)}>
            Apply filters
          </button>
        </footer>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Main page
 * ------------------------------------------------------------------ */

const EMPTY_FILTERS = {
  max_price: '',
  pickup_time_from: '',
  pickup_time_to: '',
  car_make: '',
  instant_booking: false,
  has_wifi: false,
  has_air_conditioning: false,
  has_power_outlets: false,
  smoking_allowed: false,
  pets_allowed: false,
  wheelchair_accessible: false,
};

const SearchRide = () => {
  // Search form. `date` starts EMPTY on purpose — the API treats a missing
  // departure_date as "every occurrence from today onward", which is the
  // behaviour most users want on first load.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  // Filters + sort
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Results
  const [rides, setRides] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(null);

  const abortRef = useRef(null);

  const buildParams = useCallback((query, f, sort) => {
    const params = new URLSearchParams();

    // Only send from/to when the user actually provided a value.
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);

    // CRITICAL: only send departure_date if the user picked one. Sending
    // today's date silently excludes rides that only exist on future dates.
    if (query.date) params.set('departure_date', query.date);

    params.set('passengers', String(query.passengers));

    if (f.max_price !== '' && f.max_price != null) params.set('max_price', String(f.max_price));
    if (f.pickup_time_from) params.set('pickup_time_from', f.pickup_time_from);
    if (f.pickup_time_to) params.set('pickup_time_to', f.pickup_time_to);
    if (f.car_make) params.set('car_make', f.car_make);
    if (f.instant_booking) params.set('instant_booking', 'true');

    AMENITY_FILTERS.forEach(({ key }) => {
      if (f[key]) params.set(key, 'true');
    });

    if (sort) params.set('sort_by', sort);

    return params;
  }, []);

  const runSearch = useCallback(async (query, f, sort) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');
    setErrorMsg('');

    try {
      const params = buildParams(query, f, sort);
      const url = `${SEARCH_ENDPOINT}?${params.toString()}`;

      // Helpful while debugging:
      // eslint-disable-next-line no-console
      console.log('[ride search] GET', url);

      const res = await fetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: controller.signal,
      });

      if (!res.ok) {
        let detail = '';
        try {
          const body = await res.json();
          if (body && Array.isArray(body.detail)) {
            detail = body.detail.map((d) => `${d.loc?.join('.')}: ${d.msg}`).join('; ');
          } else if (body && typeof body.detail === 'string') {
            detail = body.detail;
          }
        } catch { /* ignore */ }
        throw new Error(detail || `Request failed with ${res.status}`);
      }

      const data = await res.json();
      setRides(Array.isArray(data) ? data : []);
      setStatus('success');
    } catch (err) {
      if (err.name === 'AbortError') return;
      // eslint-disable-next-line no-console
      console.error('[ride search] failed:', err);
      setStatus('error');
      setErrorMsg('Something went wrong while searching. Please try again.');
    }
  }, [buildParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = {
      from: from.trim(),
      to: to.trim(),
      date,           // may be '' — that's fine, we simply skip the param
      passengers,
    };
    setSubmitted(query);
    runSearch(query, filters, sortBy);
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleApplyFilters = (next) => {
    setFilters(next);
    setFiltersOpen(false);
    if (submitted) runSearch(submitted, next, sortBy);
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSortBy('');
    setFiltersOpen(false);
    if (submitted) runSearch(submitted, EMPTY_FILTERS, '');
  };

  const handleSortChange = (e) => {
    const next = e.target.value;
    setSortBy(next);
    if (submitted) runSearch(submitted, filters, next);
  };

  const handleAdjustSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const el = document.getElementById('rs_from_input');
    if (el) setTimeout(() => el.focus(), 250);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.max_price) n++;
    if (filters.pickup_time_from) n++;
    if (filters.pickup_time_to) n++;
    if (filters.car_make) n++;
    if (filters.instant_booking) n++;
    AMENITY_FILTERS.forEach(({ key }) => { if (filters[key]) n++; });
    return n;
  }, [filters]);

  const isSearching = status === 'loading';
  const today = todayISO();

  const datePart = submitted?.date
    ? formatDateFriendly(submitted.date)
    : 'Any date';

  const summary = submitted
    ? `${submitted.from || 'Anywhere'} → ${submitted.to || 'Anywhere'} · ${datePart} · ${submitted.passengers} ${submitted.passengers === 1 ? 'passenger' : 'passengers'}`
    : '';

  return (
    <div className="ride_search_page">
      {/* ---------- HERO / SEARCH ---------- */}
      <section className="rs_hero">
        <div className="rs_hero_inner">
          <p className="rs_eyebrow">Find a ride</p>
          <h1 className="rs_title">Where are you headed?</h1>
          <p className="rs_subtitle">
            Search seats on rides leaving across Nigeria. Book a seat in seconds.
          </p>

          <form className="rs_search" onSubmit={handleSubmit} aria-label="Ride search">
            <div className="rs_search_grid">
              {/* From */}
              <div className="rs_search_field">
                <span className="rs_search_icon" aria-hidden="true"><Icon.Pin /></span>
                <label className="rs_search_label" htmlFor="rs_from_input">From</label>
                <input
                  id="rs_from_input"
                  className="rs_search_input"
                  type="text"
                  autoComplete="off"
                  placeholder="Where are you leaving from?"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>

              {/* Swap */}
              <button
                type="button"
                className="rs_swap_btn"
                onClick={handleSwap}
                aria-label="Swap origin and destination"
                title="Swap origin and destination"
              >
                <Icon.Swap />
              </button>

              {/* To */}
              <div className="rs_search_field">
                <span className="rs_search_icon" aria-hidden="true"><Icon.Flag /></span>
                <label className="rs_search_label" htmlFor="rs_to_input">To</label>
                <input
                  id="rs_to_input"
                  className="rs_search_input"
                  type="text"
                  autoComplete="off"
                  placeholder="Where are you going?"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              {/* Date — empty by default = "any date" */}
              <div className="rs_search_field">
                <span className="rs_search_icon" aria-hidden="true"><Icon.Calendar /></span>
                <label className="rs_search_label" htmlFor="rs_date_input">Departure</label>
                <input
                  id="rs_date_input"
                  className="rs_search_input"
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="Any date"
                />
              </div>

              {/* Passengers */}
              <div className="rs_search_field rs_search_passengers">
                <span className="rs_search_icon" aria-hidden="true"><Icon.User /></span>
                <span className="rs_search_label">Passengers</span>
                <PassengerStepper value={passengers} onChange={setPassengers} min={1} max={8} />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="rs_search_submit"
                disabled={isSearching}
                aria-busy={isSearching}
              >
                {isSearching ? (
                  <>
                    <span className="rs_spinner" aria-hidden="true" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Icon.Search aria-hidden="true" />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ---------- RESULTS ---------- */}
      {submitted && (
        <section className="rs_results" aria-live="polite">
          <div className="rs_results_inner">
            <header className="rs_results_head">
              <div className="rs_summary">
                <h2 className="rs_summary_title">
                  {submitted.from || 'Anywhere'} → {submitted.to || 'Anywhere'}
                </h2>
                <p className="rs_summary_meta">
                  {datePart} · {submitted.passengers} {submitted.passengers === 1 ? 'passenger' : 'passengers'}
                  {status === 'success' && rides ? ` · ${rides.length} ${rides.length === 1 ? 'ride' : 'rides'}` : ''}
                </p>
              </div>

              <div className="rs_results_actions">
                <button
                  type="button"
                  className="rs_btn ghost with_count"
                  onClick={() => setFiltersOpen(true)}
                  aria-haspopup="dialog"
                >
                  <Icon.Sliders aria-hidden="true" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="rs_count" aria-label={`${activeFilterCount} active filters`}>
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="rs_sort">
                  <label htmlFor="rs_sort_select" className="rs_sort_label">Sort</label>
                  <select
                    id="rs_sort_select"
                    className="rs_sort_select"
                    value={sortBy}
                    onChange={handleSortChange}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <button type="button" className="rs_btn ghost" onClick={handleAdjustSearch}>
                  Edit search
                </button>
              </div>
            </header>

            {status === 'loading' && (
              <div className="rs_list" aria-busy="true">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {status === 'error' && (
              <div className="rs_state" role="alert">
                <div className="rs_state_icon error"><Icon.Alert /></div>
                <h3 className="rs_state_title">We couldn&apos;t load those rides</h3>
                <p className="rs_state_copy">{errorMsg}</p>
                <button
                  type="button"
                  className="rs_btn primary"
                  onClick={() => runSearch(submitted, filters, sortBy)}
                >
                  Try again
                </button>
              </div>
            )}

            {status === 'success' && rides && rides.length === 0 && (
              <div className="rs_state">
                <div className="rs_state_icon"><Icon.Search /></div>
                <h3 className="rs_state_title">No rides found</h3>
                <p className="rs_state_copy">
                  We couldn&apos;t find a ride matching your search. Try changing your date, route, or filters.
                </p>
                <div className="rs_state_actions">
                  <button type="button" className="rs_btn primary" onClick={handleAdjustSearch}>
                    Adjust search
                  </button>
                  {(activeFilterCount > 0 || submitted?.date) && (
                    <button
                      type="button"
                      className="rs_btn ghost"
                      onClick={() => {
                        // Clear both the date filter and the filter drawer
                        setDate('');
                        setFilters(EMPTY_FILTERS);
                        setSortBy('');
                        const next = { ...submitted, date: '' };
                        setSubmitted(next);
                        runSearch(next, EMPTY_FILTERS, '');
                      }}
                    >
                      Any date, no filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {status === 'success' && rides && rides.length > 0 && (
              <div className="rs_list">
                {rides.map((ride, idx) => (
                  <RideCard
                    key={`${ride.id}-${ride.searched_date}-${idx}`}
                    ride={ride}
                    onSelect={(r) => {
                      // Wire this to your existing booking/ride-detail route.
                      // Example: navigate(`/rides/${r.id}?date=${r.searched_date}`);
                      // eslint-disable-next-line no-console
                      console.info('Selected ride:', r.id, 'on', r.searched_date);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <FiltersDrawer
        open={filtersOpen}
        value={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
    </div>
  );
};

export default SearchRide;