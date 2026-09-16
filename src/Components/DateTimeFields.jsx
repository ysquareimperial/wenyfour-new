// src/components/DateTimeFields.jsx
// Shared custom date + time pickers. No dependencies.
// Styled under .dtf_root so nothing leaks into other pages.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './DateTimeFields.css';

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad2(n) { return String(n).padStart(2, '0'); }

/** Local YYYY-MM-DD */
function toISO(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

/** "2026-09-15" -> Date at local midnight */
function fromISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatFriendly(iso) {
  const d = fromISO(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatTimeLabel(hhmm) {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad2(m)} ${period}`;
}

/* ------------------------------------------------------------------ *
 *  Popover shell — shared positioning + outside-click + Esc
 * ------------------------------------------------------------------ */

function Popover({ open, onClose, anchorRef, children, align = 'left' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target) &&
          anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`dtf_popover dtf_popover_${align}`}
      role="dialog"
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Icons
 * ------------------------------------------------------------------ */

const Icon = {
  Calendar: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5"
        stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  Clock: (p) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronLeft: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ChevronRight: (p) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ *
 *  DateField
 * ------------------------------------------------------------------ */

export function DateField({
  id,
  value,                 // "YYYY-MM-DD" or ""
  onChange,              // (nextISO) => void
  min,                   // "YYYY-MM-DD" or undefined
  placeholder = 'Select a date',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const selected = useMemo(() => fromISO(value), [value]);
  const minDate = useMemo(() => fromISO(min), [min]);

  const initialMonth = useMemo(() => {
    const base = selected || minDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [selected, minDate]);

  const [cursor, setCursor] = useState(initialMonth);

  useEffect(() => {
    if (open) {
      const base = selected || minDate || new Date();
      setCursor(new Date(base.getFullYear(), base.getMonth(), 1));
    }
  }, [open, selected, minDate]);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const isDisabled = (date) => {
    if (!date) return true;
    if (!minDate) return false;
    const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const b = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime();
    return a < b;
  };

  const pick = (date) => {
    if (!date || isDisabled(date)) return;
    onChange(toISO(date));
    setOpen(false);
  };

  const todayISO = toISO(new Date());

  return (
    <div className="dtf_root dtf_date">
      <button
        type="button"
        id={id}
        ref={anchorRef}
        className={`dtf_trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="dtf_icon" aria-hidden="true"><Icon.Calendar /></span>
        <span className={`dtf_value${value ? '' : ' placeholder'}`}>
          {value ? formatFriendly(value) : placeholder}
        </span>
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <div className="dtf_cal_head">
          <button
            type="button"
            className="dtf_nav_btn"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
            aria-label="Previous month"
          >
            <Icon.ChevronLeft />
          </button>
          <div className="dtf_cal_title">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button
            type="button"
            className="dtf_nav_btn"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            <Icon.ChevronRight />
          </button>
        </div>

        <div className="dtf_weekdays" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="dtf_weekday">{d}</span>
          ))}
        </div>

        <div className="dtf_grid" role="grid">
          {grid.map((date, i) => {
            if (!date) return <span key={i} className="dtf_cell empty" />;
            const iso = toISO(date);
            const disabled = isDisabled(date);
            const isSelected = value === iso;
            const isToday = iso === todayISO;
            return (
              <button
                key={i}
                type="button"
                className={[
                  'dtf_cell',
                  isSelected ? 'selected' : '',
                  isToday && !isSelected ? 'today' : '',
                  disabled ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => pick(date)}
                disabled={disabled}
                aria-pressed={isSelected}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        <div className="dtf_cal_foot">
          <button
            type="button"
            className="dtf_foot_btn"
            onClick={() => pick(new Date())}
            disabled={isDisabled(new Date())}
          >
            Today
          </button>
          <button
            type="button"
            className="dtf_foot_btn subtle"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
      </Popover>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  TimeField
 * ------------------------------------------------------------------ */

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export function TimeField({
  id,
  value,               // "HH:MM" or ""
  onChange,            // (nextHHMM) => void
  placeholder = 'Select a time',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const [hStr, mStr] = value ? value.split(':') : ['', ''];
  const hour = hStr === '' ? null : Number(hStr);
  const minute = mStr === '' ? null : Number(mStr);

  const setTime = (h, m) => {
    onChange(`${pad2(h)}:${pad2(m)}`);
  };

  return (
    <div className="dtf_root dtf_time">
      <button
        type="button"
        id={id}
        ref={anchorRef}
        className={`dtf_trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="dtf_icon" aria-hidden="true"><Icon.Clock /></span>
        <span className={`dtf_value${value ? '' : ' placeholder'}`}>
          {value ? formatTimeLabel(value) : placeholder}
        </span>
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <div className="dtf_time_wrap">
          <div className="dtf_time_col">
            <span className="dtf_time_col_label">Hour</span>
            <div className="dtf_time_scroll">
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`dtf_time_cell${hour === h ? ' selected' : ''}`}
                  onClick={() => setTime(h, minute ?? 0)}
                >
                  {pad2(h)}
                </button>
              ))}
            </div>
          </div>

          <div className="dtf_time_col">
            <span className="dtf_time_col_label">Minute</span>
            <div className="dtf_time_scroll">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`dtf_time_cell${minute === m ? ' selected' : ''}`}
                  onClick={() => setTime(hour ?? 9, m)}
                >
                  {pad2(m)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dtf_cal_foot">
          <span className="dtf_time_preview">
            {value ? formatTimeLabel(value) : '—'}
          </span>
          <button
            type="button"
            className="dtf_foot_btn"
            onClick={() => setOpen(false)}
          >
            Done
          </button>
        </div>
      </Popover>
    </div>
  );
}