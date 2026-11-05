// Our own instrument pictures, drawn as inline SVG (64×64). No outside images.
export const BANSHI = `<g transform="rotate(-32 32 32)"><rect x="4" y="26" width="56" height="12" rx="6" fill="#d39a5c" stroke="#6b3d16" stroke-width="2.5"/><path d="M14 26v12" stroke="#6b3d16" stroke-width="2.5"/>${[24, 32, 40, 48].map(x => `<circle cx="${x}" cy="32" r="2.6" fill="#4a2a10"/>`).join("")}</g>`;
export const DHOL = `<path d="M12 20h40l-4 28H16z" fill="#d0553a" stroke="#6b2414" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 24l8 20 8-20 8 20 8-20 4 20" fill="none" stroke="#f8e3c0" stroke-width="2" stroke-linejoin="round"/><ellipse cx="32" cy="20" rx="20" ry="6" fill="#f6e6c8" stroke="#6b2414" stroke-width="2.5"/><ellipse cx="32" cy="48" rx="16" ry="4.5" fill="#f6e6c8" stroke="#6b2414" stroke-width="2.5"/>`;
export const TUNG = `<path d="M32 8v4" stroke="#7a5208" stroke-width="3" stroke-linecap="round"/><path d="M32 12c-10 0-15 8-15 18v10l-5 6h40l-5-6V30c0-10-5-18-15-18z" fill="#f2b632" stroke="#7a5208" stroke-width="2.5" stroke-linejoin="round"/><path d="M23 22c2-3 5-4 8-4" stroke="#fff3c4" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="32" cy="51" r="4.5" fill="#b07a12" stroke="#7a5208" stroke-width="2"/>`;
export const SOUND_ART = [BANSHI, DHOL, TUNG];
export const FINGER = `<path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2b2118" stroke-width="2.6" stroke-linejoin="round"/>`;

// Icons on a 48×48 box: strokes use currentColor (the page sets stroke width and caps); solid parts say fill="currentColor".
const dot = (x: number, y: number, r = 5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
export const ICONS = {
  ear: `<path d="M15 30c0-10 3-19 11-19 8 0 12 6 12 13 0 8-8 9-8 15a6 6 0 0 1-12 0"/><path d="M23 27c0-4 2-7 6-7"/>`,
  play: `<path d="M13 8v32l27-16z" fill="currentColor"/>`,
  stop: `<rect x="11" y="11" width="26" height="26" rx="3" fill="currentColor" stroke="none"/>`,
  tick: `<path d="M8 25l11 11 21-24"/>`,
  eraser: `<path d="M7 31l15-17 17 15-9 10H17z"/><path d="M15 39h25"/>`,
  heart: `<path d="M24 41C9 31 7 20 13 14c4-4 9-2 11 2 2-4 7-6 11-2 6 6 4 17-11 27z" fill="currentColor" stroke="none"/>`,
  grid: `${[8, 20, 32].flatMap(x => [8, 20, 32].map(y => `<rect x="${x}" y="${y}" width="8" height="8" rx="1.5" fill="currentColor" stroke="none"/>`)).join("")}`,
  list: `<path d="M7 12h34M7 24h34M7 36h34"/>`,
  home: `<path d="M6 24L24 9l18 15"/><path d="M12 21v19h24V21"/>`,
  again: `<path d="M38 24a14 14 0 1 1-4.1-9.9"/><path d="M35 6v9h-9"/>`,
  back: `<path d="M30 8L14 24l16 16"/>`,
  next: `<path d="M8 24h32M28 11l13 13-13 13"/>`,
  star: `<path d="M24 6l5.4 11 12.1 1.7-8.8 8.5 2.1 12L24 33.4 13.2 39.2l2.1-12-8.8-8.5L18.6 17z" fill="currentColor" stroke="none"/>`,
  slow: `<path d="M12 12l10 12-10 12"/>`,
  mid: `<path d="M8 12l10 12-10 12M24 12l10 12-10 12"/>`,
  fast: `<path d="M5 12l9 12-9 12M18 12l9 12-9 12M31 12l9 12-9 12"/>`,
  stairs: `<path d="M6 40h10V30h10V20h10V10h6"/>`,
  down: `<path d="M6 10h10v10h10v10h10v10h6"/>`,
  twice: `${dot(12, 32)}${dot(24, 32)}${dot(24, 16)}${dot(36, 16)}`,
  pair: `${dot(16, 14)}${dot(16, 34)}${dot(34, 24)}`,
  ends: `${dot(24, 9)}${dot(24, 39)}<path d="M24 18v12" stroke-dasharray="3 4"/>`,
  wave: `<path d="M4 26c5-14 10-14 14 0s9 14 14 0c3-8 6-9 12-3"/>`,
  gap: `${dot(9, 24)}${dot(39, 24)}<circle cx="24" cy="24" r="6" stroke-dasharray="4 4"/>`,
  mirror: `<path d="M24 5v38" stroke-dasharray="4 4"/>${dot(11, 34, 4)}${dot(18, 24, 4)}${dot(37, 34, 4)}${dot(30, 24, 4)}`,
  hill: `<path d="M4 40L18 14l8 14 6-8 12 20z"/>`,
  notes: `<path d="M19 35V10l20-4v26"/>${dot(13, 36, 6)}${dot(33, 32, 6)}`,
} as const;
export type IconId = keyof typeof ICONS;
