// src/utils/format.js — shared display formatters

/** "YYYY-MM-DD" → local Date (avoids the UTC-midnight off-by-one). */
export function parseLocalDate(iso) {
  if (!iso) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T00:00:00`);
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatDate(iso, opts = { weekday: "short", month: "short", day: "numeric" }) {
  const d = parseLocalDate(iso);
  if (!d) return iso || "";
  return d.toLocaleDateString("en-NG", opts);
}

export function formatDateTime(iso) {
  const d = parseLocalDate(iso);
  if (!d) return iso || "";
  return d.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(time) {
  if (!time) return "";
  const [hStr, mStr] = String(time).split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatNaira(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₦—";
  const hasFraction = Math.round(n * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatKobo(kobo) {
  const n = Number(kobo);
  return formatNaira(Number.isFinite(n) ? n / 100 : NaN);
}
