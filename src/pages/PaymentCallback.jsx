// src/pages/PaymentCallback.jsx
//
// Paystack and Squad send the passenger back here after checkout
// (?reference=… / ?trxref=…). We verify with our API, which is the only
// source of truth for whether the booking is paid.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/kit.css";
import { Ic } from "../Components/UiIcons";
import {
  PAYMENT_PROVIDERS,
  clearPendingPayment,
  paymentsApi,
  readPendingPayment,
  startCheckout,
} from "../services/paymentsApi";
import { bookingsApi } from "../services/bookingsApi";
import { formatDateTime, formatNaira } from "../utils/format";

const MAX_PENDING_CHECKS = 5;
const PENDING_DELAY_MS = 3000;

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pending = useRef(readPendingPayment()).current;

  const reference =
    params.get("reference") ||
    params.get("trxref") ||
    params.get("transaction_ref") ||
    pending?.transactionRef ||
    "";

  const [state, setState] = useState("verifying"); // verifying | success | pending | failed | missing
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(pending?.provider || "paystack");
  const [busy, setBusy] = useState(false);
  const attempts = useRef(0);

  const verify = useCallback(async () => {
    if (!reference) {
      setState("missing");
      return;
    }
    setState("verifying");
    setError("");
    try {
      const res = await paymentsApi.verify(reference);
      setPayment(res);
      if (res.status === "success") {
        setState("success");
        clearPendingPayment();
      } else if (res.status === "pending" && attempts.current < MAX_PENDING_CHECKS) {
        attempts.current += 1;
        setState("pending");
        setTimeout(verify, PENDING_DELAY_MS);
      } else if (res.status === "pending") {
        setState("pending");
      } else {
        setState("failed");
        setError(res.failure_reason || "The payment didn't go through.");
      }
    } catch (err) {
      setState("failed");
      setError(err.message || "We couldn't confirm this payment.");
    }
  }, [reference]);

  useEffect(() => {
    verify();
  }, [verify]);

  const bookingId = payment?.booking_id ?? pending?.bookingId;

  const retry = async () => {
    if (!bookingId) return;
    setBusy(true);
    setError("");
    try {
      await startCheckout({ bookingId, provider, rideId: pending?.rideId, navigate });
    } catch (err) {
      setBusy(false);
      setError(err.message || "Couldn't restart the payment.");
    }
  };

  const cancelBooking = async () => {
    if (!bookingId) return;
    setBusy(true);
    try {
      await bookingsApi.cancel(bookingId);
      clearPendingPayment();
      navigate("/my-bookings", { replace: true });
    } catch (err) {
      setBusy(false);
      setError(err.message || "Couldn't cancel the booking.");
    }
  };

  const amount = payment?.amount_naira ?? pending?.amountNaira;

  return (
    <div className="wf_page">
      <div className="wf_inner" style={{ maxWidth: 560 }}>
        {(state === "verifying" || state === "pending") && (
          <div className="wf_state" aria-live="polite">
            <div className="wf_state_icon info">
              <span className="wf_spinner" />
            </div>
            <h1 className="wf_state_title">
              {state === "verifying" ? "Confirming your payment…" : "Payment still processing"}
            </h1>
            <p className="wf_state_copy">
              {state === "verifying"
                ? "Hold on while we check with the payment provider. Don't close this page."
                : "Your bank hasn't confirmed yet. This usually takes a few seconds."}
            </p>
            {state === "pending" && attempts.current >= MAX_PENDING_CHECKS && (
              <div className="wf_state_actions">
                <button type="button" className="wf_btn primary" onClick={() => {
                  attempts.current = 0;
                  verify();
                }}>
                  <Ic.Clockwise size={16} />
                  Check again
                </button>
                <Link to="/my-bookings" className="wf_btn">
                  Go to my bookings
                </Link>
              </div>
            )}
          </div>
        )}

        {state === "success" && (
          <div className="wf_state">
            <div className="wf_state_icon success">
              <Ic.Check />
            </div>
            <h1 className="wf_state_title">Payment received — you&apos;re booked</h1>
            <p className="wf_state_copy">
              We&apos;ve saved your seat. You&apos;ll see the driver&apos;s confirmation in My
              bookings.
            </p>
            <div className="wf_summary">
              {amount != null && (
                <div className="wf_summary_row">
                  <span>Amount paid</span>
                  <span>{formatNaira(amount)}</span>
                </div>
              )}
              {payment?.provider && (
                <div className="wf_summary_row">
                  <span>Paid with</span>
                  <span style={{ textTransform: "capitalize" }}>{payment.provider}</span>
                </div>
              )}
              {payment?.paid_at && (
                <div className="wf_summary_row">
                  <span>Date</span>
                  <span>{formatDateTime(payment.paid_at)}</span>
                </div>
              )}
              <div className="wf_summary_row">
                <span>Reference</span>
                <span>{reference}</span>
              </div>
            </div>
            <div className="wf_state_actions">
              <Link to="/my-bookings" className="wf_btn primary">
                View my bookings
                <Ic.Arrow />
              </Link>
              <Link to="/search-ride" className="wf_btn">
                Find another ride
              </Link>
            </div>
          </div>
        )}

        {state === "failed" && (
          <div className="wf_state">
            <div className="wf_state_icon error">
              <Ic.Alert size={22} />
            </div>
            <h1 className="wf_state_title">Payment not completed</h1>
            <p className="wf_state_copy">
              {error || "The payment didn't go through."} Your seat isn&apos;t booked until
              payment succeeds.
            </p>

            {bookingId ? (
              <>
                <div style={{ maxWidth: 360, margin: "0 auto 18px", textAlign: "left" }}>
                  <p className="wf_label" style={{ marginBottom: 8 }}>Try again with</p>
                  <div className="wf_choice_grid">
                    {PAYMENT_PROVIDERS.map((p) => (
                      <label
                        key={p.value}
                        className={`wf_choice${provider === p.value ? " active" : ""}`}
                      >
                        <input
                          type="radio"
                          name="retry_provider"
                          checked={provider === p.value}
                          onChange={() => setProvider(p.value)}
                        />
                        {p.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="wf_state_actions">
                  <button type="button" className="wf_btn primary" onClick={retry} disabled={busy}>
                    {busy ? <span className="wf_spinner" /> : "Try payment again"}
                  </button>
                  <button type="button" className="wf_btn danger" onClick={cancelBooking} disabled={busy}>
                    Cancel booking
                  </button>
                </div>
              </>
            ) : (
              <div className="wf_state_actions">
                <Link to="/my-bookings" className="wf_btn primary">
                  Go to my bookings
                </Link>
              </div>
            )}
          </div>
        )}

        {state === "missing" && (
          <div className="wf_state">
            <div className="wf_state_icon">
              <Ic.Ticket />
            </div>
            <h1 className="wf_state_title">No payment to confirm</h1>
            <p className="wf_state_copy">
              We couldn&apos;t find a payment reference. If you were charged, your booking will
              show up in My bookings.
            </p>
            <div className="wf_state_actions">
              <Link to="/my-bookings" className="wf_btn primary">
                Go to my bookings
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
