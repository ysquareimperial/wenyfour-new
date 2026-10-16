// src/services/paymentsApi.js
import { request } from "./http";

export const PAYMENT_PROVIDERS = [
  {
    value: "paystack",
    label: "Paystack",
    hint: "Card, bank transfer, USSD",
  },
  {
    value: "squad",
    label: "Squad",
    hint: "Card, bank transfer, USSD",
  },
];

const PENDING_KEY = "wf:pending-payment";

/** Remember the payment we're redirecting for, so the callback page can verify it. */
export function rememberPendingPayment(info) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...info, at: Date.now() }));
  } catch {
    /* non-critical */
  }
}

export function readPendingPayment() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingPayment() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function koboToNaira(kobo) {
  const n = Number(kobo);
  return Number.isFinite(n) ? n / 100 : 0;
}

export function nairaToKobo(naira) {
  const n = Number(naira);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function paymentCallbackUrl() {
  return `${window.location.origin}/payments/callback`;
}

export const paymentsApi = {
  initialize: ({ bookingId, provider }) =>
    request("/payments/initialize", {
      method: "POST",
      auth: "required",
      body: {
        booking_id: Number(bookingId),
        provider,
        callback_url: paymentCallbackUrl(),
      },
    }),
  verify: (transactionRef) =>
    request("/payments/verify", {
      method: "POST",
      auth: "required",
      body: { transaction_ref: transactionRef },
    }),
  mine: async (status) => {
    const data = await request("/payments/my-payments", {
      auth: "required",
      query: { status_filter: status },
    });
    return Array.isArray(data) ? data : [];
  },
  get: (id) => request(`/payments/${id}`, { auth: "required" }),

  // Refunds
  requestRefund: ({ paymentId, reason }) =>
    request("/payments/refunds", {
      method: "POST",
      auth: "required",
      body: { payment_id: Number(paymentId), reason, is_partial: false },
    }),
  myRefunds: async () => {
    const data = await request("/payments/refunds/me", { auth: "required" });
    return Array.isArray(data) ? data : [];
  },

  // Wallet / earnings
  wallet: () => request("/payments/wallet/me", { auth: "required" }),
  transactions: async (query = {}) => {
    const data = await request("/payments/transactions/me", { auth: "required", query });
    return Array.isArray(data) ? data : [];
  },
  requestPayout: (body) =>
    request("/payments/payouts", { method: "POST", auth: "required", body }),
  myPayouts: async () => {
    const data = await request("/payments/payouts/me", { auth: "required" });
    return Array.isArray(data) ? data : [];
  },
  generateStatement: ({ periodStart, periodEnd }) =>
    request("/payments/statements/generate", {
      method: "POST",
      auth: "required",
      body: { period_start: periodStart, period_end: periodEnd },
    }),
  myStatements: async () => {
    const data = await request("/payments/statements/me", { auth: "required" });
    return Array.isArray(data) ? data : [];
  },
};

/**
 * Start (or retry) checkout for an existing booking and leave the app for the
 * provider's hosted page. Resolves only if there's no redirect URL.
 */
export async function startCheckout({ bookingId, provider, rideId, navigate }) {
  const init = await paymentsApi.initialize({ bookingId, provider });
  rememberPendingPayment({
    bookingId,
    paymentId: init.payment_id,
    transactionRef: init.transaction_ref,
    provider: init.provider || provider,
    rideId,
    amountNaira: init.amount_naira,
  });
  if (init.auth_url) {
    window.location.assign(init.auth_url);
    return init;
  }
  const to = `/payments/callback?reference=${encodeURIComponent(init.transaction_ref)}`;
  if (navigate) navigate(to, { replace: true });
  else window.location.assign(to);
  return init;
}
