// Minimal inline SVG icon set (stroke-based, inherits currentColor).
type P = { className?: string }
const base = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8,
  strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
}

export const IcDashboard = (p: P) => (
  <svg {...base} className={p.className}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)
export const IcUsers = (p: P) => (
  <svg {...base} className={p.className}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3 3 0 0 1 0 5.6" />
    <path d="M18 20a5 5 0 0 0-2.5-4.3" />
  </svg>
)
export const IcMatch = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M7 4v5a5 5 0 0 0 10 0V4" />
    <path d="M12 14v6" />
    <path d="M8 20h8" />
  </svg>
)
export const IcSport = (p: P) => (
  <svg {...base} className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3a9 9 0 0 0 0 18M3 12h18" />
  </svg>
)
export const IcClub = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M3 21V9l9-6 9 6v12" />
    <path d="M9 21v-6h6v6" />
  </svg>
)
export const IcSearch = (p: P) => (
  <svg {...base} className={p.className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
)
export const IcBell = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)
export const IcPlus = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)
export const IcTrend = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M21 11V7h-4" />
  </svg>
)
export const IcCalendar = (p: P) => (
  <svg {...base} className={p.className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)
export const IcSettings = (p: P) => (
  <svg {...base} className={p.className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </svg>
)
export const IcDownload = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 21h16" />
  </svg>
)
export const IcSun = (p: P) => (
  <svg {...base} className={p.className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
  </svg>
)
export const IcMoon = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
)
export const IcArrowLeft = (p: P) => (
  <svg {...base} className={p.className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
export const IcBlock = (p: P) => (
  <svg {...base} className={p.className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M5.6 5.6l12.8 12.8" />
  </svg>
)
export const IcUnlock = (p: P) => (
  <svg {...base} className={p.className}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 7.5-1.9" />
  </svg>
)
