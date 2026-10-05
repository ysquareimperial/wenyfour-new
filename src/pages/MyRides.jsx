// src/pages/MyRides.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal, ModalBody, ModalHeader, ModalFooter } from "reactstrap";
import { ridesApi } from "../services/ridesApi";
import "./MyRides.css";
import "./AddCar.css"; // 👈 reuse AddCar form styles inside the filter modal


/* ------------------------------------------------------------------ *
 *  Helpers  (unchanged)
 * ------------------------------------------------------------------ */

function formatTime(hhmmss) {
  if (!hhmmss) return "";
  const [hStr, mStr] = String(hhmmss).split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmmss;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatNaira(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `₦${num.toLocaleString("en-NG")}`;
}

function rideStatus(ride) {
  if (ride.is_active === false) return { key: "inactive", label: "Inactive" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = ride.start_date ? new Date(ride.start_date) : null;
  const end = ride.end_date ? new Date(ride.end_date) : null;

  if (end && end < today) return { key: "past", label: "Past" };
  if (start && start > today) return { key: "upcoming", label: "Upcoming" };
  return { key: "active", label: "Active" };
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "inactive", label: "Inactive" },
];

const EMPTY_FILTER_DRAFT = {
  pickup_location: "",
  dropoff_location: "",
  date_from: "",
  date_to: "",
};

/* ------------------------------------------------------------------ *
 *  Icons  (Filter + Reset added, Search/Refresh kept for reuse)
 * ------------------------------------------------------------------ */

const Icon = {
  Plus: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Route: (p) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="18" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M6 8.4v5.1a3.5 3.5 0 0 0 3.5 3.5H18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Pin: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0 1 18.5 10.5C18.5 15.6 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  ),
  Flag: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M6 21V4M6 4h10l-1.4 3.5L16 11H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  ),
  Clock: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Users: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M3 20c.8-3.1 3.2-4.7 6-4.7s5.2 1.6 6 4.7M16 5.5a3 3 0 0 1 0 6M21 20c-.5-2.2-1.9-3.6-3.6-4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  Car: (p) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}>
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
  Alert: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5v6M12 16.6v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
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
  Trash: (p) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  // 🎛️ Filter (funnel)
  Filter: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  ),
  // ♻️ Reset (rotate ccw arrow)
  Reset: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M3.5 11a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5V11h6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Close: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  Ride card  (unchanged)
 * ------------------------------------------------------------------ */

function RideCard({ ride, onDelete, deleting }) {
  const status = rideStatus(ride);
  const stopovers = Array.isArray(ride.stopovers) ? ride.stopovers : [];
  const car = ride.car || {};

  return (
    <article className="my_ride_card">
      <header className="my_ride_head">
        <div className="my_ride_route">
          <span className="my_ride_city">{ride.origin_city}</span>
          <Icon.Arrow />
          <span className="my_ride_city">{ride.destination_city}</span>
        </div>
        <span className={`my_ride_status ${status.key}`}>{status.label}</span>
      </header>

      <div className="my_ride_locations">
        <div className="my_ride_loc">
          <span className="my_ride_loc_icon" aria-hidden="true">
            <Icon.Pin />
          </span>
          <span className="my_ride_loc_text">{ride.pickup_location}</span>
        </div>
        <div className="my_ride_loc_connector" aria-hidden="true" />
        <div className="my_ride_loc">
          <span className="my_ride_loc_icon" aria-hidden="true">
            <Icon.Flag />
          </span>
          <span className="my_ride_loc_text">{ride.dropoff_location}</span>
        </div>
      </div>

      {stopovers.length > 0 && (
        <div className="my_ride_stopovers">
          <span className="my_ride_stopovers_label">
            {stopovers.length} {stopovers.length === 1 ? "stopover" : "stopovers"}
          </span>
          <span className="my_ride_stopovers_list">
            {stopovers.map((s) => s.location || s.city_name).filter(Boolean).join(" · ")}
          </span>
        </div>
      )}

      <div className="my_ride_meta">
        <span className="my_ride_meta_item">
          <Icon.Clock />
          {formatTime(ride.pickup_time)}
        </span>
        <span className="my_ride_meta_dot" aria-hidden="true" />
        <span className="my_ride_meta_item">
          {formatDate(ride.start_date)}
          {ride.end_date && ride.end_date !== ride.start_date
            ? ` → ${formatDate(ride.end_date)}`
            : ""}
        </span>
        <span className="my_ride_meta_dot" aria-hidden="true" />
        <span className="my_ride_meta_item">
          <Icon.Users />
          {ride.max_passengers} seats
        </span>
      </div>

      <div className="my_ride_footer">
        <div className="my_ride_price">
          <span className="my_ride_price_value">{formatNaira(ride.price_per_seat)}</span>
          <span className="my_ride_price_label">per seat</span>
        </div>

        {car.make && (
          <span className="my_ride_car">
            <Icon.Car />
            {car.make} {car.model}
          </span>
        )}

        <button
          type="button"
          className="my_ride_action_btn danger"
          onClick={() => onDelete(ride)}
          disabled={deleting}
        >
          <Icon.Trash />
          Delete
        </button>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="my_ride_card my_ride_sk" aria-hidden="true">
      <div className="my_ride_sk_line w60" />
      <div className="my_ride_sk_line w80" />
      <div className="my_ride_sk_line w40" />
      <div className="my_ride_sk_line w80" />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Filter modal
 * ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ *
 *  Filter modal — reuses AddCar form styles for visual parity
 * ------------------------------------------------------------------ */

function FilterModal({ open, initial, onClose, onApply }) {
  const [draft, setDraft] = useState(initial || EMPTY_FILTER_DRAFT);

  // Re-seed whenever the modal is (re)opened
  useEffect(() => {
    if (open) setDraft(initial || EMPTY_FILTER_DRAFT);
  }, [open, initial]);

  const set = (key) => (e) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  const handleApply = (e) => {
    e.preventDefault();
    onApply(draft);
  };

  const handleClearInside = () => setDraft(EMPTY_FILTER_DRAFT);

  return (
    <Modal
      isOpen={open}
      centered
      toggle={onClose}
      className="myr_filter_modal"
    >
      <form onSubmit={handleApply} noValidate>
        {/* Header */}
        <div className="myr_filter_modal_head">
          <div>
            <p className="ac_eyebrow" style={{ marginBottom: 4 }}>
              Filters
            </p>
            <h3 className="myr_filter_modal_title">Filter rides</h3>
          </div>
          <button
            type="button"
            className="myr_filter_close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon.Close />
          </button>
        </div>

        {/* Body — wrapped so AddCar.css styles apply cleanly */}
        <ModalBody className="myr_filter_modal_body">
          <div className="add_car_page myr_filter_addcar_scope">
            <div className="ac_inner">
              <div className="ac_form">
                <section className="ac_section">
                  <h2 className="ac_section_title">Route</h2>

                  <div className="ac_field" style={{ marginBottom: 14 }}>
                    <label className="ac_label" htmlFor="mf_pickup">
                      Pickup location
                    </label>
                    <div className="ac_input_wrap">
                      <span className="ac_input_icon" aria-hidden="true">
                        <Icon.Pin />
                      </span>
                      <input
                        id="mf_pickup"
                        className="ac_input"
                        type="text"
                        autoComplete="off"
                        placeholder="e.g. Shoprite"
                        value={draft.pickup_location}
                        onChange={set("pickup_location")}
                      />
                    </div>
                  </div>

                  <div className="ac_field">
                    <label className="ac_label" htmlFor="mf_dropoff">
                      Drop-off location
                    </label>
                    <div className="ac_input_wrap">
                      <span className="ac_input_icon" aria-hidden="true">
                        <Icon.Flag />
                      </span>
                      <input
                        id="mf_dropoff"
                        className="ac_input"
                        type="text"
                        autoComplete="off"
                        placeholder="e.g. Lagos"
                        value={draft.dropoff_location}
                        onChange={set("dropoff_location")}
                      />
                    </div>
                  </div>
                </section>

                <section className="ac_section" style={{ marginBottom: 0 }}>
                  <h2 className="ac_section_title">Date range</h2>

                  <div className="ac_row">
                    <div className="ac_field">
                      <label className="ac_label" htmlFor="mf_date_from">
                        Date from
                      </label>
                      <input
                        id="mf_date_from"
                        className="ac_input no_icon"
                        type="date"
                        value={draft.date_from}
                        onChange={set("date_from")}
                      />
                    </div>

                    <div className="ac_field">
                      <label className="ac_label" htmlFor="mf_date_to">
                        Date to
                      </label>
                      <input
                        id="mf_date_to"
                        className="ac_input no_icon"
                        type="date"
                        value={draft.date_to}
                        onChange={set("date_to")}
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </ModalBody>

        {/* Footer */}
        <div className="myr_filter_modal_foot">
          <button
            type="button"
            className="myr_btn ghost small"
            onClick={handleClearInside}
          >
            Clear fields
          </button>
          <button type="submit" className="myr_btn primary small">
            Apply filters
          </button>
        </div>
      </form>
    </Modal>
  );
}
/* ------------------------------------------------------------------ *
 *  Page
 * ------------------------------------------------------------------ */

export default function MyRides() {
  const [rides, setRides] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Applied filters (what gets sent to the API)
  const [filters, setFilters] = useState(EMPTY_FILTER_DRAFT);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const [deletingRide, setDeletingRide] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const hasActiveFilters =
    !!filters.pickup_location ||
    !!filters.dropoff_location ||
    !!filters.date_from ||
    !!filters.date_to;

  const buildQuery = useCallback(
    (f = filters) => {
      const q = {};
      if (f.pickup_location?.trim()) q.pickup_location = f.pickup_location.trim();
      if (f.dropoff_location?.trim()) q.dropoff_location = f.dropoff_location.trim();
      if (f.date_from) q.date_from = f.date_from;
      if (f.date_to) q.date_to = f.date_to;
      if (activeFilter === "active") q.is_active = true;
      if (activeFilter === "inactive") q.is_active = false;
      return q;
    },
    [filters, activeFilter],
  );

  const fetchRides = useCallback(
    async (overrideFilters) => {
      setStatus("loading");
      setErrorMsg("");
      try {
        const data = await ridesApi.listMine(
          buildQuery(overrideFilters ?? filters),
        );
        setRides(Array.isArray(data) ? data : []);
        setStatus("success");
      } catch (err) {
        console.error("[my rides] failed:", err);
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong while loading your rides.");
      }
    },
    [buildQuery, filters],
  );

  // Initial load
  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when the status tab changes
  useEffect(() => {
    fetchRides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const visibleRides = useMemo(() => {
    if (!rides) return [];
    // The API handles is_active; the rest is client-side
    if (activeFilter === "all") return rides;
    return rides.filter((r) => rideStatus(r).key === activeFilter);
  }, [rides, activeFilter]);

  const handleApplyFilters = (draft) => {
    setFilters(draft);
    setFilterModalOpen(false);
    fetchRides(draft);
  };

  const handleResetFilters = () => {
    setFilters(EMPTY_FILTER_DRAFT);
    setActiveFilter("all");
    fetchRides(EMPTY_FILTER_DRAFT);
  };

  const confirmDelete = async () => {
    if (!deletingRide) return;
    setDeleteLoading(true);
    try {
      await ridesApi.remove(deletingRide.id);
      setRides((prev) => (prev ? prev.filter((r) => r.id !== deletingRide.id) : prev));
      showToast("Ride deleted");
      setDeletingRide(null);
    } catch (err) {
      console.error("[delete ride] failed:", err);
      showToast(err.message || "Failed to delete ride", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="my_rides_page">
      <div className="myr_inner">
        <header className="myr_header">
          <div>
            <p className="myr_eyebrow">Driver</p>
            <h1 className="myr_title">My rides</h1>
            <p className="myr_subtitle">
              Rides you've published. Filter by route or date to find one.
            </p>
          </div>
          <Link to="/rides/publish" className="myr_add_btn">
            <Icon.Plus />
            Publish a ride
          </Link>
        </header>

        {toast && (
          <div className={`myr_toast ${toast.type === "error" ? "error" : ""}`}>
            {toast.message}
          </div>
        )}

        {/* ---- Toolbar: tabs + icon buttons ---- */}
        <div className="myr_toolbar">
          <div className="myr_tabs" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={activeFilter === f.key}
                className={`myr_tab${activeFilter === f.key ? " active" : ""}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="myr_toolbar_actions">
            <button
              type="button"
              className={`myr_icon_btn${hasActiveFilters ? " has_filters" : ""}`}
              onClick={() => setFilterModalOpen(true)}
              aria-label="Filter rides"
              title="Filter"
            >
              <Icon.Filter />
              {hasActiveFilters && <span className="myr_icon_dot" />}
            </button>

            <button
              type="button"
              className="myr_icon_btn"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters && activeFilter === "all"}
              aria-label="Reset filters"
              title="Reset"
            >
              <Icon.Reset />
            </button>
          </div>
        </div>

        {status === "loading" && (
          <div className="myr_list" aria-busy="true">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {status === "error" && (
          <div className="myr_state" role="alert">
            <div className="myr_state_icon error">
              <Icon.Alert />
            </div>
            <h3 className="myr_state_title">We couldn&apos;t load your rides</h3>
            <p className="myr_state_copy">{errorMsg}</p>
            <button type="button" className="myr_btn primary" onClick={() => fetchRides()}>
              Try again
            </button>
          </div>
        )}

        {status === "success" && visibleRides.length === 0 && (
          <div className="myr_state">
            <div className="myr_state_icon">
              <Icon.Route />
            </div>
            <h3 className="myr_state_title">
              {rides && rides.length > 0
                ? "No rides match these filters"
                : "No rides yet"}
            </h3>
            <p className="myr_state_copy">
              {rides && rides.length > 0
                ? "Try clearing your filters or adjusting the date range."
                : "Publish your first ride to start accepting passengers."}
            </p>
            {rides && rides.length > 0 ? (
              <button
                type="button"
                className="myr_btn primary"
                onClick={handleResetFilters}
              >
                Reset filters
              </button>
            ) : (
              <Link to="/rides/publish" className="myr_btn primary">
                Publish a ride
                <Icon.Arrow />
              </Link>
            )}
          </div>
        )}

        {status === "success" && visibleRides.length > 0 && (
          <div className="myr_list">
            {visibleRides.map((ride) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onDelete={setDeletingRide}
                deleting={deleteLoading && deletingRide?.id === ride.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---- Filter modal ---- */}
      <FilterModal
        open={filterModalOpen}
        initial={filters}
        onClose={() => setFilterModalOpen(false)}
        onApply={handleApplyFilters}
      />

      {/* ---- Delete confirm ---- */}
      <Modal
        isOpen={!!deletingRide}
        centered
        toggle={() => !deleteLoading && setDeletingRide(null)}
        className="myr_confirm_modal"
        backdrop="static"
      >
        <ModalBody className="myr_confirm_body">
          <div className="myr_confirm_icon">
            <Icon.Trash />
          </div>
          <h3 className="myr_confirm_title">Delete this ride?</h3>
          <p className="myr_confirm_copy">
            Your ride from <strong>{deletingRide?.origin_city}</strong> to{" "}
            <strong>{deletingRide?.destination_city}</strong> will be permanently
            removed. This cannot be undone.
          </p>
          <div className="myr_confirm_actions">
            <button
              type="button"
              className="myr_btn"
              onClick={() => setDeletingRide(null)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="myr_btn danger"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? <span className="myr_spinner" /> : "Delete ride"}
            </button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}