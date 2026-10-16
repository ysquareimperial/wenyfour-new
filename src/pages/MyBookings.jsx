// src/pages/MyBookings.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, ModalBody } from "reactstrap";
import "../styles/kit.css";
import { Ic } from "../Components/UiIcons";
import { BOOKING_STATUS, bookingsApi } from "../services/bookingsApi";
import { PAYMENT_PROVIDERS, paymentsApi, startCheckout } from "../services/paymentsApi";
import { ridesApi } from "../services/ridesApi";
import { formatDate, formatNaira, formatTime, todayISO } from "../utils/format";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

function tabFor(b) {
  if (b.status === "cancelled" || b.status === "refunded") return "cancelled";
  if (b.status === "trip_completed") return "past";
  if (b.status === "trip_started") return "upcoming";
  return b.travel_date < todayISO() ? "past" : "upcoming";
}

/** Latest payment per booking (by created_at). */
function indexPayments(payments) {
  const map = new Map();
  payments.forEach((p) => {
    if (p.booking_id == null) return;
    const prev = map.get(p.booking_id);
    if (!prev || new Date(p.created_at) > new Date(prev.created_at)) map.set(p.booking_id, p);
  });
  return map;
}

function paymentBadge(payment) {
  if (!payment) return { label: "Not paid", tone: "warn" };
  if (payment.status === "success") return { label: "Paid", tone: "success" };
  if (payment.status === "pending") return { label: "Payment pending", tone: "warn" };
  return { label: "Payment failed", tone: "danger" };
}

const REFUND_LABEL = {
  pending: { label: "Refund requested", tone: "warn" },
  approved: { label: "Refund approved", tone: "info" },
  processed: { label: "Refunded", tone: "success" },
  rejected: { label: "Refund declined", tone: "danger" },
  failed: { label: "Refund failed", tone: "danger" },
};

/* ------------------------------------------------------------------ */

function BookingCard({ booking, ride, payment, refund, onPay, onCancel, onRefund }) {
  const pay = paymentBadge(payment);
  const paid = payment?.status === "success";
  const unpaidPending = booking.status === "pending" && !paid;
  const status = unpaidPending
    ? { label: "Awaiting payment", tone: "warn" }
    : BOOKING_STATUS[booking.status] || { label: booking.status, tone: "neutral" };
  const canPay = booking.status === "pending" && !paid;
  const canCancel = ["pending", "confirmed"].includes(booking.status);
  const canRefund = paid && booking.status === "cancelled" && !refund;

  return (
    <article className="wf_card">
      <div className="wf_card_row">
        <div className="wf_route">
          {ride ? (
            <>
              <span>{ride.origin_city || ride.pickup_location}</span>
              <Ic.Arrow />
              <span>{ride.destination_city || ride.dropoff_location}</span>
            </>
          ) : (
            <span>Ride #{booking.ride_id}</span>
          )}
        </div>
        <div className="wf_badges">
          <span className={`wf_badge ${status.tone}`}>{status.label}</span>
          {booking.status !== "cancelled" && !(unpaidPending && !payment) && (
            <span className={`wf_badge ${pay.tone}`}>{pay.label}</span>
          )}
          {refund && REFUND_LABEL[refund.status] && (
            <span className={`wf_badge ${REFUND_LABEL[refund.status].tone}`}>
              {REFUND_LABEL[refund.status].label}
            </span>
          )}
        </div>
      </div>

      <div className="wf_meta">
        <span>
          <Ic.Calendar />
          {formatDate(booking.travel_date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
        {ride?.pickup_time && (
          <span>
            <Ic.Clock />
            {formatTime(ride.pickup_time)}
          </span>
        )}
        <span>
          <Ic.Seat />
          {booking.seats_booked} seat{booking.seats_booked === 1 ? "" : "s"}
        </span>
        {ride?.pickup_location && (
          <span>
            <Ic.Pin />
            {ride.pickup_location}
          </span>
        )}
      </div>

      {canPay && (
        <p className="wf_note">
          Your booking isn&apos;t secured until payment goes through.
        </p>
      )}

      <div className="wf_card_foot">
        <span className="wf_amount">
          {formatNaira(booking.fare)}
          <small>total</small>
        </span>
        <div className="wf_actions">
          <Link to={`/rides/${booking.ride_id}`} className="wf_btn small">
            Ride details
          </Link>
          {canRefund && (
            <button type="button" className="wf_btn small" onClick={() => onRefund(booking, payment)}>
              Request refund
            </button>
          )}
          {canCancel && (
            <button type="button" className="wf_btn small danger" onClick={() => onCancel(booking)}>
              Cancel
            </button>
          )}
          {canPay && (
            <button type="button" className="wf_btn small primary" onClick={() => onPay(booking)}>
              Pay now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */

export default function MyBookings() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState(new Map());
  const [refunds, setRefunds] = useState(new Map());
  const [rides, setRides] = useState({});
  const [tab, setTab] = useState("upcoming");
  const [toast, setToast] = useState(null);

  const [payFor, setPayFor] = useState(null);
  const [provider, setProvider] = useState("paystack");
  const [cancelFor, setCancelFor] = useState(null);
  const [refundFor, setRefundFor] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const [b, p, r] = await Promise.all([
        bookingsApi.mine(),
        paymentsApi.mine().catch(() => []),
        paymentsApi.myRefunds().catch(() => []),
      ]);
      b.sort((x, y) => (x.travel_date < y.travel_date ? 1 : -1));
      setBookings(b);
      setPayments(indexPayments(p));
      const rm = new Map();
      r.forEach((x) => x.booking_id != null && rm.set(x.booking_id, x));
      setRefunds(rm);
      setStatus("success");

      // Ride details are public; fetch each unique ride once.
      const ids = [...new Set(b.map((x) => x.ride_id))];
      const entries = await Promise.all(
        ids.map((id) => ridesApi.get(id).then((ride) => [id, ride]).catch(() => [id, null])),
      );
      setRides(Object.fromEntries(entries));
    } catch (err) {
      setStatus("error");
      setError(err.message || "Couldn't load your bookings.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const out = { upcoming: [], past: [], cancelled: [] };
    bookings.forEach((b) => out[tabFor(b)].push(b));
    out.upcoming.reverse(); // soonest first
    return out;
  }, [bookings]);

  const visible = grouped[tab];

  /* ---------- actions ---------- */

  const openModal = (setter, value) => {
    setModalError("");
    setBusy(false);
    setter(value);
  };

  const confirmPay = async () => {
    setBusy(true);
    setModalError("");
    try {
      await startCheckout({
        bookingId: payFor.id,
        provider,
        rideId: payFor.ride_id,
        navigate,
      });
    } catch (err) {
      setBusy(false);
      setModalError(err.message || "Couldn't start the payment.");
    }
  };

  const confirmCancel = async () => {
    setBusy(true);
    setModalError("");
    try {
      const updated = await bookingsApi.cancel(cancelFor.id);
      setBookings((list) => list.map((b) => (b.id === cancelFor.id ? { ...b, ...updated } : b)));
      setCancelFor(null);
      showToast("Booking cancelled");
    } catch (err) {
      setModalError(err.message || "Couldn't cancel this booking.");
    } finally {
      setBusy(false);
    }
  };

  const confirmRefund = async () => {
    if (refundReason.trim().length < 3) {
      setModalError("Tell us briefly why you're requesting a refund.");
      return;
    }
    setBusy(true);
    setModalError("");
    try {
      const refund = await paymentsApi.requestRefund({
        paymentId: refundFor.payment.id,
        reason: refundReason.trim(),
      });
      setRefunds((m) => new Map(m).set(refundFor.booking.id, refund));
      setRefundFor(null);
      setRefundReason("");
      showToast("Refund requested");
    } catch (err) {
      setModalError(err.message || "Couldn't request a refund.");
    } finally {
      setBusy(false);
    }
  };

  const cancelPaid = cancelFor && payments.get(cancelFor.id)?.status === "success";

  return (
    <div className="wf_page">
      <div className="wf_inner">
        <header className="wf_header">
          <div>
            <p className="wf_eyebrow">Passenger</p>
            <h1 className="wf_title">My bookings</h1>
            <p className="wf_subtitle">Seats you&apos;ve booked, their payment and trip status.</p>
          </div>
          <Link to="/search-ride" className="wf_btn primary">
            Find a ride
            <Ic.Arrow />
          </Link>
        </header>

        <div className="wf_tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`wf_tab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {status === "success" && grouped[t.key].length > 0 && (
                <span className="wf_tab_count">{grouped[t.key].length}</span>
              )}
            </button>
          ))}
        </div>

        {status === "loading" && (
          <div className="wf_list" aria-busy="true">
            <div className="wf_sk" />
            <div className="wf_sk" />
          </div>
        )}

        {status === "error" && (
          <div className="wf_state" role="alert">
            <div className="wf_state_icon error">
              <Ic.Alert size={22} />
            </div>
            <h2 className="wf_state_title">We couldn&apos;t load your bookings</h2>
            <p className="wf_state_copy">{error}</p>
            <button type="button" className="wf_btn primary" onClick={load}>
              Try again
            </button>
          </div>
        )}

        {status === "success" && visible.length === 0 && (
          <div className="wf_state">
            <div className="wf_state_icon">
              <Ic.Ticket />
            </div>
            <h2 className="wf_state_title">
              {tab === "upcoming" ? "No upcoming trips" : tab === "past" ? "No past trips yet" : "Nothing cancelled"}
            </h2>
            <p className="wf_state_copy">
              {tab === "upcoming"
                ? "When you book a seat it'll show up here."
                : "Your trip history will appear here."}
            </p>
            {tab === "upcoming" && (
              <Link to="/search-ride" className="wf_btn primary">
                Search rides
                <Ic.Arrow />
              </Link>
            )}
          </div>
        )}

        {status === "success" && visible.length > 0 && (
          <div className="wf_list">
            {visible.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                ride={rides[b.ride_id]}
                payment={payments.get(b.id)}
                refund={refunds.get(b.id)}
                onPay={(x) => openModal(setPayFor, x)}
                onCancel={(x) => openModal(setCancelFor, x)}
                onRefund={(booking, payment) => {
                  setRefundReason("");
                  openModal(setRefundFor, { booking, payment });
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pay now */}
      <Modal isOpen={!!payFor} centered toggle={() => !busy && setPayFor(null)} className="wf_modal">
        <ModalBody className="wf_modal_body">
          <h3 className="wf_modal_title">Pay for your seat</h3>
          <p className="wf_modal_copy">
            {payFor && `${formatNaira(payFor.fare)} for ${payFor.seats_booked} seat${payFor.seats_booked === 1 ? "" : "s"}. `}
            Choose how you&apos;d like to pay.
          </p>
          <div className="wf_choice_grid" style={{ marginBottom: 16 }}>
            {PAYMENT_PROVIDERS.map((p) => (
              <label key={p.value} className={`wf_choice${provider === p.value ? " active" : ""}`}>
                <input
                  type="radio"
                  name="pay_provider"
                  checked={provider === p.value}
                  onChange={() => setProvider(p.value)}
                />
                {p.label}
              </label>
            ))}
          </div>
          {modalError && <div className="wf_alert">{modalError}</div>}
          <div className="wf_modal_actions">
            <button type="button" className="wf_btn" onClick={() => setPayFor(null)} disabled={busy}>
              Not now
            </button>
            <button type="button" className="wf_btn primary" onClick={confirmPay} disabled={busy}>
              {busy ? <span className="wf_spinner" /> : "Continue to payment"}
            </button>
          </div>
        </ModalBody>
      </Modal>

      {/* Cancel */}
      <Modal isOpen={!!cancelFor} centered toggle={() => !busy && setCancelFor(null)} className="wf_modal">
        <ModalBody className="wf_modal_body">
          <h3 className="wf_modal_title">Cancel this booking?</h3>
          <p className="wf_modal_copy">
            {cancelFor && `Your ${cancelFor.seats_booked === 1 ? "seat" : "seats"} on ${formatDate(cancelFor.travel_date)} will be released.`}
            {cancelPaid && " Since you've paid, you can request a refund after cancelling."}
          </p>
          {modalError && <div className="wf_alert">{modalError}</div>}
          <div className="wf_modal_actions">
            <button type="button" className="wf_btn" onClick={() => setCancelFor(null)} disabled={busy}>
              Keep booking
            </button>
            <button type="button" className="wf_btn danger solid" onClick={confirmCancel} disabled={busy}>
              {busy ? <span className="wf_spinner" /> : "Cancel booking"}
            </button>
          </div>
        </ModalBody>
      </Modal>

      {/* Refund */}
      <Modal isOpen={!!refundFor} centered toggle={() => !busy && setRefundFor(null)} className="wf_modal">
        <ModalBody className="wf_modal_body">
          <h3 className="wf_modal_title">Request a refund</h3>
          <p className="wf_modal_copy">
            {refundFor && `${formatNaira(refundFor.payment.amount_naira)} paid with ${refundFor.payment.provider}. `}
            Our team reviews refund requests, usually within 1–2 working days.
          </p>
          <div className="wf_field">
            <label className="wf_label" htmlFor="refund_reason">Reason</label>
            <textarea
              id="refund_reason"
              className="wf_input"
              maxLength={500}
              placeholder="e.g. My plans changed"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
          </div>
          {modalError && <div className="wf_alert">{modalError}</div>}
          <div className="wf_modal_actions">
            <button type="button" className="wf_btn" onClick={() => setRefundFor(null)} disabled={busy}>
              Close
            </button>
            <button type="button" className="wf_btn primary" onClick={confirmRefund} disabled={busy}>
              {busy ? <span className="wf_spinner" /> : "Submit request"}
            </button>
          </div>
        </ModalBody>
      </Modal>

      {toast && <div className={`wf_toast${toast.type === "error" ? " error" : ""}`}>{toast.message}</div>}
    </div>
  );
}

