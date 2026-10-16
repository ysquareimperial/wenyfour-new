// src/pages/Earnings.jsx — driver wallet, transactions, payouts, statements
import { useCallback, useEffect, useState } from "react";
import { Modal, ModalBody } from "reactstrap";
import "../styles/kit.css";
import { Ic } from "../Components/UiIcons";
import { PAYMENT_PROVIDERS, nairaToKobo, paymentsApi } from "../services/paymentsApi";
import { formatDate, formatDateTime, formatKobo, todayISO } from "../utils/format";

// CBN bank codes. "Other" lets the driver type one we don't list.
const BANKS = [
  ["044", "Access Bank"],
  ["023", "Citibank"],
  ["050", "Ecobank"],
  ["070", "Fidelity Bank"],
  ["011", "First Bank"],
  ["214", "FCMB"],
  ["058", "GTBank"],
  ["030", "Heritage Bank"],
  ["301", "Jaiz Bank"],
  ["082", "Keystone Bank"],
  ["076", "Polaris Bank"],
  ["101", "Providus Bank"],
  ["221", "Stanbic IBTC"],
  ["068", "Standard Chartered"],
  ["232", "Sterling Bank"],
  ["032", "Union Bank"],
  ["033", "UBA"],
  ["215", "Unity Bank"],
  ["035", "Wema Bank"],
  ["057", "Zenith Bank"],
];

const TX_TYPES = [
  { value: "", label: "All types" },
  { value: "payment", label: "Payments" },
  { value: "payout", label: "Payouts" },
  { value: "refund", label: "Refunds" },
  { value: "commission", label: "Commission" },
  { value: "tax", label: "Tax" },
  { value: "adjustment", label: "Adjustments" },
];

const PAYOUT_TONE = {
  pending: "warn",
  processing: "info",
  success: "success",
  failed: "danger",
  reversed: "danger",
};

const EMPTY_PAYOUT = {
  amount: "",
  provider: "paystack",
  bank_code: "",
  other_code: "",
  account_number: "",
  account_name: "",
};

function firstOfMonth() {
  const t = todayISO();
  return `${t.slice(0, 8)}01`;
}

export default function Earnings() {
  const [wallet, setWallet] = useState(null);
  const [walletErr, setWalletErr] = useState("");
  const [txs, setTxs] = useState(null);
  const [txErr, setTxErr] = useState("");
  const [txFilter, setTxFilter] = useState({ transaction_type: "", date_from: "", date_to: "" });
  const [payouts, setPayouts] = useState([]);
  const [statements, setStatements] = useState([]);
  const [toast, setToast] = useState(null);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payout, setPayout] = useState(EMPTY_PAYOUT);
  const [stmtOpen, setStmtOpen] = useState(false);
  const [stmt, setStmt] = useState({ start: firstOfMonth(), end: todayISO() });
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadWallet = useCallback(async () => {
    setWalletErr("");
    try {
      setWallet(await paymentsApi.wallet());
    } catch (err) {
      setWalletErr(err.message || "Couldn't load your wallet.");
    }
  }, []);

  const loadTxs = useCallback(async (filter) => {
    setTxs(null);
    setTxErr("");
    try {
      setTxs(await paymentsApi.transactions(filter));
    } catch (err) {
      setTxs([]);
      setTxErr(err.message || "Couldn't load transactions.");
    }
  }, []);

  useEffect(() => {
    loadWallet();
    loadTxs({});
    paymentsApi.myPayouts().then(setPayouts).catch(() => {});
    paymentsApi.myStatements().then(setStatements).catch(() => {});
  }, [loadWallet, loadTxs]);

  const setTx = (key) => (e) => {
    const next = { ...txFilter, [key]: e.target.value };
    setTxFilter(next);
    loadTxs(next);
  };

  const available = Number(wallet?.available_balance_kobo) || 0;

  /* ---------- payout ---------- */

  const setP = (key) => (e) => setPayout((p) => ({ ...p, [key]: e.target.value }));

  const submitPayout = async (e) => {
    e.preventDefault();
    setModalError("");
    const amountKobo = nairaToKobo(payout.amount);
    const bankCode = payout.bank_code === "other" ? payout.other_code.trim() : payout.bank_code;
    if (amountKobo <= 0) return setModalError("Enter an amount to withdraw.");
    if (amountKobo > available) return setModalError("That's more than your available balance.");
    if (!bankCode) return setModalError("Choose your bank.");
    if (!/^\d{10}$/.test(payout.account_number.trim()))
      return setModalError("Account number should be 10 digits.");
    if (!payout.account_name.trim()) return setModalError("Enter the account name.");

    setBusy(true);
    try {
      const created = await paymentsApi.requestPayout({
        amount_kobo: amountKobo,
        provider: payout.provider,
        bank_code: bankCode,
        account_number: payout.account_number.trim(),
        account_name: payout.account_name.trim(),
      });
      setPayouts((list) => [created, ...list]);
      setPayoutOpen(false);
      setPayout(EMPTY_PAYOUT);
      showToast("Withdrawal requested");
      loadWallet();
    } catch (err) {
      setModalError(err.message || "Couldn't request the withdrawal.");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- statement ---------- */

  const submitStatement = async (e) => {
    e.preventDefault();
    setModalError("");
    if (!stmt.start || !stmt.end) return setModalError("Choose a start and end date.");
    if (stmt.end < stmt.start) return setModalError("End date can't be before start date.");
    setBusy(true);
    try {
      const created = await paymentsApi.generateStatement({
        periodStart: stmt.start,
        periodEnd: stmt.end,
      });
      setStatements((list) => [created, ...list]);
      setStmtOpen(false);
      showToast("Statement generated");
    } catch (err) {
      setModalError(err.message || "Couldn't generate the statement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wf_page">
      <div className="wf_inner wide">
        <header className="wf_header">
          <div>
            <p className="wf_eyebrow">Driver</p>
            <h1 className="wf_title">Earnings</h1>
            <p className="wf_subtitle">
              What you&apos;ve earned from completed trips, and withdrawals to your bank.
            </p>
          </div>
          <button
            type="button"
            className="wf_btn primary"
            onClick={() => {
              setModalError("");
              setPayoutOpen(true);
            }}
            disabled={!wallet || available <= 0}
          >
            <Ic.Wallet size={18} />
            Withdraw
          </button>
        </header>

        {walletErr && (
          <div className="wf_alert" role="alert">
            <Ic.Alert />
            <span>{walletErr}</span>
          </div>
        )}

        <div className="wf_stats">
          <div className="wf_stat accent">
            <p className="wf_stat_label">Available to withdraw</p>
            <p className="wf_stat_value">{wallet ? formatKobo(wallet.available_balance_kobo) : "—"}</p>
          </div>
          <div className="wf_stat">
            <p className="wf_stat_label">Pending (trips not yet complete)</p>
            <p className="wf_stat_value">{wallet ? formatKobo(wallet.pending_balance_kobo) : "—"}</p>
          </div>
          <div className="wf_stat">
            <p className="wf_stat_label">Total earned</p>
            <p className="wf_stat_value">{wallet ? formatKobo(wallet.lifetime_credits_kobo) : "—"}</p>
          </div>
          <div className="wf_stat">
            <p className="wf_stat_label">Fees &amp; tax paid</p>
            <p className="wf_stat_value">
              {wallet
                ? formatKobo(
                    (Number(wallet.lifetime_commission_kobo) || 0) +
                      (Number(wallet.lifetime_tax_kobo) || 0),
                  )
                : "—"}
            </p>
          </div>
        </div>

        {/* Transactions */}
        <h2 className="wf_section_title">Transactions</h2>
        <div className="wf_row three" style={{ marginBottom: 12 }}>
          <select className="wf_input" value={txFilter.transaction_type} onChange={setTx("transaction_type")} aria-label="Transaction type">
            {TX_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input className="wf_input" type="date" value={txFilter.date_from} onChange={setTx("date_from")} aria-label="From date" />
          <input className="wf_input" type="date" value={txFilter.date_to} onChange={setTx("date_to")} aria-label="To date" />
        </div>

        {txErr && <div className="wf_alert">{txErr}</div>}
        {txs === null ? (
          <div className="wf_sk" />
        ) : txs.length === 0 ? (
          <div className="wf_state" style={{ padding: "32px 20px" }}>
            <p className="wf_state_copy" style={{ margin: "0 auto" }}>
              No transactions{txFilter.transaction_type || txFilter.date_from || txFilter.date_to ? " match these filters" : " yet"}.
            </p>
          </div>
        ) : (
          <div className="wf_table_wrap">
            <table className="wf_table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => {
                  const credit = String(t.direction).toLowerCase() === "credit";
                  return (
                    <tr key={t.id}>
                      <td className="muted">{formatDate(t.transaction_date, { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td>{t.description || (t.booking_id ? `Booking #${t.booking_id}` : "—")}</td>
                      <td style={{ textTransform: "capitalize" }}>{t.transaction_type}</td>
                      <td className={`num${credit ? " credit" : ""}`}>
                        {credit ? "+" : "−"}
                        {formatKobo(t.amount_kobo)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Payouts */}
        <h2 className="wf_section_title">Withdrawals</h2>
        {payouts.length === 0 ? (
          <div className="wf_state" style={{ padding: "32px 20px" }}>
            <p className="wf_state_copy" style={{ margin: "0 auto" }}>No withdrawals yet.</p>
          </div>
        ) : (
          <div className="wf_table_wrap">
            <table className="wf_table">
              <thead>
                <tr>
                  <th>Requested</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th className="num">Fees</th>
                  <th className="num">You receive</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="muted">{formatDateTime(p.created_at)}</td>
                    <td>
                      {p.bank_name || p.bank_code} · ****{String(p.account_number).slice(-4)}
                    </td>
                    <td>
                      <span className={`wf_badge ${PAYOUT_TONE[p.status] || ""}`} style={{ textTransform: "capitalize" }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="num muted">
                      {formatKobo((Number(p.commission_kobo) || 0) + (Number(p.tax_kobo) || 0))}
                    </td>
                    <td className="num">{formatKobo(p.net_amount_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Statements */}
        <div className="wf_card_row" style={{ marginTop: 32, marginBottom: 12 }}>
          <h2 className="wf_section_title" style={{ margin: 0 }}>Statements</h2>
          <button
            type="button"
            className="wf_btn small"
            onClick={() => {
              setModalError("");
              setStmtOpen(true);
            }}
          >
            Generate statement
          </button>
        </div>
        {statements.length === 0 ? (
          <div className="wf_state" style={{ padding: "32px 20px" }}>
            <p className="wf_state_copy" style={{ margin: "0 auto" }}>No statements yet.</p>
          </div>
        ) : (
          <div className="wf_table_wrap">
            <table className="wf_table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th className="num">Opening</th>
                  <th className="num">In</th>
                  <th className="num">Out</th>
                  <th className="num">Closing</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {formatDate(s.period_start, { day: "numeric", month: "short" })} –{" "}
                      {formatDate(s.period_end, { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="num muted">{formatKobo(s.opening_balance_kobo)}</td>
                    <td className="num credit">{formatKobo(s.total_credits_kobo)}</td>
                    <td className="num">{formatKobo(s.total_debits_kobo)}</td>
                    <td className="num">{formatKobo(s.closing_balance_kobo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      <Modal isOpen={payoutOpen} centered toggle={() => !busy && setPayoutOpen(false)} className="wf_modal">
        <ModalBody className="wf_modal_body">
          <form onSubmit={submitPayout} noValidate>
            <h3 className="wf_modal_title">Withdraw to your bank</h3>
            <p className="wf_modal_copy">
              Available: <strong>{formatKobo(available)}</strong>. Fees and tax are deducted before
              the transfer.
            </p>

            <div className="wf_field">
              <label className="wf_label" htmlFor="po_amount">Amount (₦)</label>
              <input id="po_amount" className="wf_input" type="number" min="1" step="1" inputMode="numeric" value={payout.amount} onChange={setP("amount")} />
            </div>

            <div className="wf_field">
              <span className="wf_label">Send via</span>
              <div className="wf_choice_grid">
                {PAYMENT_PROVIDERS.map((p) => (
                  <label key={p.value} className={`wf_choice${payout.provider === p.value ? " active" : ""}`}>
                    <input type="radio" name="po_provider" checked={payout.provider === p.value} onChange={() => setPayout((x) => ({ ...x, provider: p.value }))} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="wf_field">
              <label className="wf_label" htmlFor="po_bank">Bank</label>
              <select id="po_bank" className="wf_input" value={payout.bank_code} onChange={setP("bank_code")}>
                <option value="">Choose your bank</option>
                {BANKS.map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
                <option value="other">Other (enter bank code)</option>
              </select>
            </div>

            {payout.bank_code === "other" && (
              <div className="wf_field">
                <label className="wf_label" htmlFor="po_code">Bank code</label>
                <input id="po_code" className="wf_input" value={payout.other_code} onChange={setP("other_code")} />
              </div>
            )}

            <div className="wf_row">
              <div className="wf_field">
                <label className="wf_label" htmlFor="po_acct">Account number</label>
                <input id="po_acct" className="wf_input" inputMode="numeric" maxLength={10} value={payout.account_number} onChange={setP("account_number")} />
              </div>
              <div className="wf_field">
                <label className="wf_label" htmlFor="po_name">Account name</label>
                <input id="po_name" className="wf_input" value={payout.account_name} onChange={setP("account_name")} />
              </div>
            </div>

            {modalError && <div className="wf_alert">{modalError}</div>}
            <div className="wf_modal_actions">
              <button type="button" className="wf_btn" onClick={() => setPayoutOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="wf_btn primary" disabled={busy}>
                {busy ? <span className="wf_spinner" /> : "Request withdrawal"}
              </button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {/* Statement modal */}
      <Modal isOpen={stmtOpen} centered toggle={() => !busy && setStmtOpen(false)} className="wf_modal">
        <ModalBody className="wf_modal_body">
          <form onSubmit={submitStatement} noValidate>
            <h3 className="wf_modal_title">Generate a statement</h3>
            <p className="wf_modal_copy">Pick the period you need a statement for.</p>
            <div className="wf_row">
              <div className="wf_field">
                <label className="wf_label" htmlFor="st_from">From</label>
                <input id="st_from" className="wf_input" type="date" value={stmt.start} max={todayISO()} onChange={(e) => setStmt((s) => ({ ...s, start: e.target.value }))} />
              </div>
              <div className="wf_field">
                <label className="wf_label" htmlFor="st_to">To</label>
                <input id="st_to" className="wf_input" type="date" value={stmt.end} max={todayISO()} onChange={(e) => setStmt((s) => ({ ...s, end: e.target.value }))} />
              </div>
            </div>
            {modalError && <div className="wf_alert">{modalError}</div>}
            <div className="wf_modal_actions">
              <button type="button" className="wf_btn" onClick={() => setStmtOpen(false)} disabled={busy}>Cancel</button>
              <button type="submit" className="wf_btn primary" disabled={busy}>
                {busy ? <span className="wf_spinner" /> : "Generate"}
              </button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {toast && <div className={`wf_toast${toast.type === "error" ? " error" : ""}`}>{toast.message}</div>}
    </div>
  );
}
