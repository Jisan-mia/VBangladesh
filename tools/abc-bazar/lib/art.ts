// One original flat SVG per letter, in a 64×64 box. Every shape is outlined, so the ?print sheet can blank the fills into a
// colouring page; `class="k"` marks ink details (eyes, stripes, seeds) that stay dark. One source for the page and the card.

const INK = "#2b2433";
const SKIN = "#b9784c";
const WAVE = `<path d="M6 59c4-3 8-3 12 0s8 3 12 0 8-3 12 0 8 3 12 0" fill="none" stroke="#3a86c8"/>`;
const eye = (x: number, y: number, r = 2) => `<circle class="k" cx="${x}" cy="${y}" r="${r}"/>`;
const dots = (points: readonly [number, number][], r = 1.1) => points.map(([x, y]) => eye(x, y, r)).join("");

export const ART: Readonly<Record<string, string>> = {
  A: `<path d="M32 21c-6-5-21-4-22 11-1 13 9 25 16 25 2 0 4-1 6-1s4 1 6 1c7 0 17-12 16-25-1-15-16-16-22-11z" fill="#e5383b"/>
    <path d="M32 21c0-5 1-9 4-12" fill="none"/><path d="M35 14c4-5 10-5 13-3-3 5-9 6-13 3z" fill="#4caf50"/>
    <path d="M19 30c1-3 3-5 5-6" fill="none" stroke="#fff" stroke-width="2.6"/>`,
  B: `<path d="M33 9c9 5 15 15 16 26H33z" fill="#f4d35e"/><path d="M32 41V7" fill="none"/>
    <path d="M3 33c7 5 15 7 29 7s22-2 29-7c-2 9-9 16-16 16H19C12 49 5 42 3 33z" fill="#a0592e"/>
    <path d="M12 42h40" fill="none"/>${WAVE}`,
  C: `<path d="M17 28l-2-16 12 9zM47 28l2-16-12 9z" fill="#f4a259"/><circle cx="32" cy="36" r="18" fill="#f4a259"/>
    <path d="M20 17l3 5M44 17l-3 5" fill="none"/>${eye(25, 33, 2.6)}${eye(39, 33, 2.6)}
    <path class="k" d="M29.5 39h5L32 42z"/><path d="M32 42c0 3-4 4-6 2M32 42c0 3 4 4 6 2" fill="none"/>
    <path d="M10 37l9 1M10 43l9-2M54 37l-9 1M54 43l-9-2" fill="none"/>`,
  D: `<path d="M35 42c0-6-3-10-3-17a9 9 0 0 1 18 0c0 6-3 10-3 17z" fill="#fffaf0"/>
    <ellipse cx="29" cy="43" rx="21" ry="12" fill="#fffaf0"/><path d="M15 41c6-3 15-3 19 3-6 5-15 4-19-3z" fill="#efe2c2"/>
    <path d="M49 22l10 2-9 4z" fill="#f4a020"/>${eye(43, 22)}${WAVE}`,
  E: `<ellipse cx="32" cy="57" rx="16" ry="3" fill="#e2cfae"/><path d="M32 12c10 0 17 15 17 26 0 10-8 18-17 18s-17-8-17-18c0-11 7-26 17-26z" fill="#f3dcc0"/>
    <path d="M23 30c1-5 4-9 7-11" fill="none" stroke="#fff" stroke-width="2.6"/>`,
  F: `<path d="M6 32c8-12 30-15 42-4l11-9v26l-11-9C36 47 14 44 6 32z" fill="#9fb7c9"/>
    <path d="M21 23c4 5 4 13 0 18" fill="none"/><path d="M28 24c5-4 12-4 16-1" fill="none"/>${eye(15, 30, 2.2)}`,
  G: `<path d="M32 14c6 0 9 6 12 10 6 4 9 10 9 16 0 10-9 17-21 17S11 50 11 40c0-6 3-12 9-16 3-4 6-10 12-10z" fill="#9ccc65"/>
    <path d="M32 14V8" fill="none"/><path d="M33 10c4-5 11-5 14-2-4 5-10 5-14 2z" fill="#3f8f2a"/>
    ${dots([[22, 36], [28, 44], [40, 34], [36, 48], [44, 44], [25, 50]])}`,
  H: `<rect x="14" y="30" width="36" height="25" fill="#f2c57c"/><path d="M7 33 32 11l25 22z" fill="#c0392b"/>
    <rect x="28" y="40" width="9" height="15" fill="#8a5530"/><rect x="18" y="36" width="7" height="7" fill="#9ad0f5"/>
    <rect x="41" y="36" width="5" height="7" fill="#9ad0f5"/><path d="M4 55h56" fill="none"/>`,
  I: `<circle cx="32" cy="22" r="12" fill="#f7a6c2"/><path d="M23 28c0 5 2 7 3 3" fill="#f7a6c2"/>
    <path d="M20 28h24L32 59z" fill="#e2a65a"/><path d="M25 34l12 11M23 30l17 15M39 34L27 45" fill="none"/>
    ${dots([[28, 17], [36, 15], [34, 23]], 1.2)}`,
  J: `<path d="M32 15V7" fill="none"/><ellipse cx="32" cy="37" rx="18" ry="22" fill="#b8c23c"/>
    ${dots([[24, 24], [32, 22], [40, 24], [20, 33], [28, 31], [36, 31], [44, 33], [22, 42], [30, 40], [38, 40], [44, 43], [26, 50], [34, 49], [40, 51]], 1.3)}`,
  K: `<path d="M32 5 51 26 32 50 13 26z" fill="#e94f37"/><path d="M32 5 51 26H32z" fill="#f6c84c"/><path d="M13 26 32 50V26z" fill="#f6c84c"/>
    <path d="M32 5v45M13 26h38" fill="none"/><path d="M32 50c-5 3 5 5 0 8s5 4 1 5" fill="none"/>
    <path d="M27 55l5-3v6zM37 59l-5-3v6z" fill="#3a86c8"/>`,
  L: `<path d="M11 34c0-10 9-16 21-16s21 6 21 16-9 16-21 16-21-6-21-16z" fill="#b7d84a"/>
    <path d="M11 34H6M53 34h5" fill="none"/><path d="M30 18c-2-6 2-10 8-11 0 6-3 10-8 11z" fill="#3f8f2a"/>
    <path d="M18 30c2-4 6-6 10-7" fill="none" stroke="#fff" stroke-width="2.6"/>`,
  M: `<path d="M25 15c14-4 29 9 27 27-2 13-14 17-22 15C18 55 10 45 12 33c1-10 7-16 13-18z" fill="#f6b82e"/>
    <path d="M25 15c10-3 22 4 26 15-8-6-17-8-26-15z" fill="#8cc34a"/>
    <path d="M25 15c0-4 1-7 3-9" fill="none"/><path d="M28 8c5-4 12-3 15 0-5 4-11 4-15 0z" fill="#3f8f2a"/>`,
  N: `<ellipse cx="24" cy="31" rx="6.5" ry="8" fill="#bfe3f2"/><ellipse cx="38" cy="30" rx="6.5" ry="8" fill="#bfe3f2"/>
    <path d="M7 34h50c0 12-11 20-25 20S7 46 7 34z" fill="#a0703a"/>
    <path d="M10 41c11 3 33 3 44 0M14 47c10 3 26 3 36 0M5 33l8 3M59 33l-8 3" fill="none"/>`,
  O: `<path d="M16 18l-3-11 10 6zM48 18l3-11-10 6z" fill="#a47148"/>
    <path d="M14 26c0-9 7-15 18-15s18 6 18 15v17c0 9-8 16-18 16S14 52 14 43z" fill="#a47148"/>
    <path d="M22 41c3 8 17 8 20 0-3-3-17-3-20 0z" fill="#e8cfa6"/>
    <circle cx="25" cy="27" r="7" fill="#fff"/><circle cx="39" cy="27" r="7" fill="#fff"/>${eye(25, 27, 3)}${eye(39, 27, 3)}
    <path d="M30 33l2 5 2-5z" fill="#f4a020"/>`,
  P: `<path d="M32 6c12 0 19 16 19 29s-8 23-19 23-19-10-19-23S20 6 32 6z" fill="#f9a03f"/>
    <path d="M32 18c6 0 9 9 9 17s-4 13-9 13-9-5-9-13 3-17 9-17z" fill="#e85d2a"/>
    ${dots([[29, 26], [34, 25], [31, 31], [36, 32], [28, 36], [33, 38], [30, 42], [35, 43]], 1.6)}`,
  Q: `<path d="M14 46c-3-18 3-30 18-30s21 12 18 30z" fill="#2b1d14"/><path d="M12 63c2-8 10-12 20-12s18 4 20 12z" fill="#7b3fa0"/>
    <path d="M28 46h8v6h-8z" fill="${SKIN}"/><circle cx="32" cy="34" r="13" fill="${SKIN}"/>
    <path d="M19 21l3-13 6 7 4-10 4 10 6-7 3 13z" fill="#f2c230"/>${eye(27, 33)}${eye(37, 33)}
    <path d="M27 39c3 3 7 3 10 0" fill="none"/><circle cx="32" cy="15" r="2" fill="#e5383b"/>`,
  R: `<path d="M33 31c0-14 10-22 23-21v21z" fill="#e84393"/><path d="M38 18c4-4 11-5 15-4M36 25c5-3 12-4 18-3" fill="none"/>
    <path d="M33 31h17v11H33z" fill="#2e86de"/><path d="M12 52 26 42h18M12 52V35h-5M22 39h7" fill="none"/>
    <circle cx="45" cy="49" r="10" fill="#fff"/><path d="M45 39v20M35 49h20M38 42l14 14M52 42 38 56" fill="none" stroke-width="1.2"/>
    <circle cx="12" cy="53" r="6" fill="#fff"/><path d="M12 47v12M6 53h12" fill="none" stroke-width="1.2"/>`,
  S: `<path d="M32 4v8M32 52v8M4 32h8M52 32h8M12 12l6 6M46 46l6 6M52 12l-6 6M12 52l6-6" fill="none" stroke="#f29f05" stroke-width="3.2"/>
    <circle cx="32" cy="32" r="14" fill="#ffcc33"/>`,
  T: `<circle cx="17" cy="18" r="7" fill="#f08a24"/><circle cx="47" cy="18" r="7" fill="#f08a24"/>
    <path d="M14 18a3 3 0 0 1 6 0zM44 18a3 3 0 0 1 6 0z" fill="#fff"/>
    <ellipse cx="32" cy="35" rx="21" ry="19" fill="#f08a24"/><ellipse cx="32" cy="44" rx="10" ry="8" fill="#fff"/>
    ${eye(24, 31, 2.4)}${eye(40, 31, 2.4)}<path class="k" d="M29 39h6l-3 3z"/><path d="M32 42v3" fill="none"/>
    <path class="k" d="M28 17l4 7 4-7zM11 31l8 2-8 3zM53 31l-8 2 8 3zM13 40l7 1-6 3zM51 40l-7 1 6 3z"/>`,
  U: `<path d="M6 32C6 18 18 8 32 8s26 10 26 24c-3-3-6-3-9 0-3-3-7-3-10 0-2-3-5-3-7-3s-5 0-7 3c-3-3-7-3-10 0-3-3-6-3-9 0z" fill="#3a86ff"/>
    <path d="M32 8c-6 6-7 16-7 21M32 8c6 6 7 16 7 21" fill="none"/><path d="M32 29v20c0 6-9 6-9 0" fill="none" stroke-width="3"/>`,
  V: `<path d="M5 46V26c0-4 3-7 7-7h30c6 0 10 6 14 12l3 5v10z" fill="#4cb5ae"/>
    <path d="M11 24h10v9H11zM25 24h10v9H25zM39 24h3c3 0 6 4 8 9H39z" fill="#d6f1fb"/><path d="M5 38h54" fill="none"/>
    <circle cx="18" cy="47" r="6" fill="#4a4a4a"/><circle cx="46" cy="47" r="6" fill="#4a4a4a"/>
    <circle cx="18" cy="47" r="2" fill="#ddd"/><circle cx="46" cy="47" r="2" fill="#ddd"/><path d="M2 55h60" fill="none"/>`,
  W: `<path d="M17 10h30l-4 46H21z" fill="#f2f9fd"/><path d="M18.4 24h27.2l-2.8 32H21.2z" fill="#7cc4ef"/>
    <path d="M24 30v18" fill="none" stroke="#fff" stroke-width="2.6"/>`,
  X: `<path d="M10 28l12-9h33l-12 9z" fill="#e8b97e"/><path d="M10 28h33v28H10z" fill="#d9a066"/><path d="M43 28l12-9v28l-12 9z" fill="#b97f45"/>
    <path d="M26 28v9M20 20l2 8" fill="none"/>`,
  Y: `<path d="M24 23c6-5 14-6 22-5 9 1 13 6 13 14v12l-3-2-3 4-3-4-3 4-3-4-3 4-3-4-3 4-3-4-3 3z" fill="#5b3a29"/>
    <path d="M28 46v12M35 46v12M47 46v12M54 44v14" fill="none" stroke-width="4"/>
    <path d="M10 18c-5-1-6-7-3-10M24 18c5-1 6-7 3-10" fill="none" stroke="#ece0c8" stroke-width="3.4"/>
    <path d="M7 27c0-7 4-11 10-11s10 4 10 11-4 13-10 13S7 34 7 27z" fill="#4a2e20"/>
    <path d="M12 34c3 3 7 3 10 0" fill="none" stroke="#ece0c8"/><circle cx="12.5" cy="25" r="2" fill="#fff"/><circle cx="21.5" cy="25" r="2" fill="#fff"/>`,
  Z: `<path d="M22 16l-4-11 9 5zM42 16l4-11-9 5z" fill="#fff"/>
    <path d="M21 17c0-6 5-9 11-9s11 3 11 9l-1 27c0 8-5 13-10 13s-10-5-10-13z" fill="#fff"/><path class="k" d="M26 11l6-7 6 7-6 3z"/>
    <path class="k" d="M21.2 21l8 2-8 3zM42.8 21l-8 2 8 3zM21.6 32l7 2-7 3zM42.4 32l-7 2 7 3zM29 15l3 5 3-5z"/>
    <path d="M24 43c0-5 4-6 8-6s8 1 8 6v2c0 6-4 10-8 10s-8-4-8-10z" fill="#8a8a8a"/>${eye(29, 48, 1.4)}${eye(35, 48, 1.4)}
    <circle cx="26" cy="28" r="2.8" fill="#fff"/><circle cx="38" cy="28" r="2.8" fill="#fff"/>${eye(26, 28, 1.6)}${eye(38, 28, 1.6)}`,
};

/** The <g> every picture sits in: ink outline, rounded joins. */
export const artGroup = (letter: string) =>
  `<g stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" fill="${INK}">${ART[letter] ?? ""}</g>`;

/** A standalone SVG file for the card (a data: URL, so nothing is fetched). */
export const svgDocument = (letter: string, size = 256) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${artGroup(letter).replace(/class="k"/g, `stroke="none" fill="${INK}"`)}</svg>`;
