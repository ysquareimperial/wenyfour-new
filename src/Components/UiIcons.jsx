// src/Components/UiIcons.jsx — small inline icon set shared by newer pages
const base = { fill: "none", viewBox: "0 0 24 24" };
const stroke = { stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const Ic = {
  Arrow: ({ size = 16, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path d="M5 12h13M13 6l6 6-6 6" {...stroke} strokeWidth="2" />
    </svg>
  ),
  Calendar: ({ size = 14, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" {...stroke} />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" {...stroke} />
    </svg>
  ),
  Clock: ({ size = 14, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <circle cx="12" cy="12" r="8.5" {...stroke} />
      <path d="M12 7.5V12l3 2" {...stroke} />
    </svg>
  ),
  Seat: ({ size = 14, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path d="M6 4v10a3 3 0 0 0 3 3h6M18 20v-4a2 2 0 0 0-2-2H9" {...stroke} />
    </svg>
  ),
  Pin: ({ size = 14, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path d="M12 21s-6.5-5.4-6.5-10.5A6.5 6.5 0 0 1 18.5 10.5C18.5 15.6 12 21 12 21Z" {...stroke} />
      <circle cx="12" cy="10.5" r="2.4" {...stroke} />
    </svg>
  ),
  Check: ({ size = 22, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path d="M5 12.5 10 17.5 19 7.5" {...stroke} strokeWidth="2.2" />
    </svg>
  ),
  Alert: ({ size = 18, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M12 7.5v6M12 16.6v.2" {...stroke} strokeWidth="2" />
    </svg>
  ),
  Ticket: ({ size = 22, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path
        d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V7Z"
        {...stroke}
      />
      <path d="M14 5v12" {...stroke} strokeDasharray="2 2.5" />
    </svg>
  ),
  Wallet: ({ size = 22, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4" {...stroke} />
      <rect x="4" y="7.5" width="16" height="11.5" rx="2.5" {...stroke} />
      <circle cx="16" cy="13.2" r="1.1" fill="currentColor" />
    </svg>
  ),
  Clockwise: ({ size = 22, ...p }) => (
    <svg width={size} height={size} {...base} {...p}>
      <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" {...stroke} />
    </svg>
  ),
};
