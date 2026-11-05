"use client";
// The start action, the biggest thing on the start card: a brass-cornered wooden cash box drawn in SVG, its drawer
// painted শুরু করো. Pressing it slides the drawer out (CSS, driven by data-open); the clock starts once it is open.
// Paused, the same box covers the sum and says চালিয়ে যাও.
export function CashBox({ label, sub, open, onPress }: { label: string; sub: string; open: boolean; onPress: () => void }) {
  return (
    <button type="button" className="mh-box" data-open={open || undefined} tabIndex={open ? -1 : 0} aria-hidden={open || undefined}
      onPointerDown={event => { if (event.button === 0) { event.preventDefault(); event.currentTarget.blur(); onPress(); } }}
      onClick={event => { if (event.detail === 0) onPress(); }}>
      <span className="mh-box-body">
        <svg className="mh-box-art" viewBox="0 0 320 210" aria-hidden="true">
          <defs>
            <linearGradient id="mh-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9b6234" /><stop offset="1" stopColor="#6e4122" /></linearGradient>
            <linearGradient id="mh-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f6d27a" /><stop offset="1" stopColor="#b88a2c" /></linearGradient>
          </defs>
          <ellipse cx="160" cy="200" rx="140" ry="9" fill="#00000030" />
          <rect x="14" y="14" width="292" height="176" rx="16" fill="url(#mh-wood)" stroke="#4a2a14" strokeWidth="4" />
          <path d="M30 34h260M30 52h260" stroke="#7d4b27" strokeWidth="2" opacity=".6" />
          {[[14, 14], [278, 14], [14, 162], [278, 162]].map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="28" height="28" rx="6" fill="url(#mh-brass)" stroke="#8a6420" strokeWidth="2" />)}
          <rect x="132" y="22" width="56" height="18" rx="9" fill="#2b1a0e" />
          <circle cx="160" cy="31" r="4" fill="url(#mh-brass)" />
        </svg>
        <span className="mh-drawer">
          <b>{label}</b>
          <small>{sub}</small>
          <i className="mh-drawer-pull" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
