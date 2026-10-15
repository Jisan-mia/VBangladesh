// All the pictures, as SVG markup strings (our own flat drawings, nothing fetched): hands for each washing step,
// a mouth for each brushing zone, silly germs, and the moments for the "কখন ধোব" quiz. Stage pictures use a 200×200 box.
import type { Face, Pose, Zone } from "./routines";

const SKIN = "#d99a6c", LINE = "#7a4526", NAIL = "#f7dccb", GLOW = "#ffd84d", FOAM_EDGE = "#8ccbd9";

type Part = "palm" | "between" | "thumb" | "tips" | "wrist";
type Place = { x: number; y: number; r?: number; s?: number; flip?: boolean; cls?: string };

const FINGERS: [number, number][] = [[-18, -54], [-6, -64], [6, -62], [18, -50]];

/** One hand pointing up, thumb to the left: an outline pass, then the skin. */
function handShapes(color: string, grow: number) {
  const w = 12 + grow * 2;
  return `<rect x="${-17 - grow}" y="${36 - grow}" width="${34 + grow * 2}" height="${60 + grow * 2}" rx="${12 + grow}" fill="${color}"/>`
    + `<rect x="${-26 - grow}" y="${-22 - grow}" width="${52 + grow * 2}" height="${66 + grow * 2}" rx="${22 + grow}" fill="${color}"/>`
    + FINGERS.map(([x, tip]) => `<line x1="${x}" y1="-14" x2="${x}" y2="${tip}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`).join("")
    + `<line x1="-22" y1="14" x2="-42" y2="-10" stroke="${color}" stroke-width="${w + 1}" stroke-linecap="round"/>`;
}

const GLOWS: Record<Part, string> = {
  palm: `<rect x="-35" y="-31" width="70" height="84" rx="31" fill="${GLOW}"/>`,
  between: FINGERS.map(([x, tip]) => `<line x1="${x}" y1="-8" x2="${x}" y2="${tip}" stroke="${GLOW}" stroke-width="26" stroke-linecap="round"/>`).join(""),
  thumb: `<line x1="-22" y1="14" x2="-42" y2="-10" stroke="${GLOW}" stroke-width="32" stroke-linecap="round"/>`,
  tips: [...FINGERS, [-42, -10] as [number, number]].map(([x, tip]) => `<circle cx="${x}" cy="${tip}" r="13" fill="${GLOW}"/>`).join(""),
  wrist: `<rect x="-27" y="32" width="54" height="40" rx="16" fill="${GLOW}"/>`,
};

const PALM_LINES = `<g fill="none" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round" opacity=".45"><path d="M-15 4 Q0 14 15 2"/><path d="M-13 20 Q0 28 13 16"/></g>`;
const NAILS = FINGERS.map(([x, tip]) => `<ellipse cx="${x}" cy="${tip + 3}" rx="3.6" ry="4.6" fill="${NAIL}"/>`).join("") + `<ellipse cx="-39" cy="-7" rx="3.8" ry="4.6" fill="${NAIL}" transform="rotate(-50 -39 -7)"/>`;

const place = ({ x, y, r = 0, s = 1, flip = false, cls = "" }: Place, inner: string) =>
  `<g class="${cls}"><g transform="translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})">${inner}</g></g>`;

export function hand(at: Place & { view?: "palm" | "back"; glow?: Part }) {
  const glow = at.glow ? `<g class="hd-glow">${GLOWS[at.glow]}</g>` : "";
  return place(at, glow + handShapes(LINE, 2.5) + handShapes(SKIN, 0) + (at.view === "back" ? NAILS : PALM_LINES));
}

/** A hand curled round something (a thumb, a wrist). */
function fist(at: Place, wide = 44) {
  const body = (color: string, grow: number) => `<rect x="${-wide / 2 - grow}" y="${-16 - grow}" width="${wide + grow * 2}" height="${32 + grow * 2}" rx="${15 + grow}" fill="${color}"/>`;
  const creases = [-0.3, 0, 0.3].map(f => `<line x1="${f * wide}" y1="-14" x2="${f * wide}" y2="-3" stroke="${LINE}" stroke-width="2.2" stroke-linecap="round" opacity=".5"/>`).join("");
  return place(at, body(LINE, 2.5) + body(SKIN, 0) + creases);
}

const bubbles = (list: [number, number, number][]) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${FOAM_EDGE}" stroke-width="1.6"/>`).join("");

const GERM_COLORS = [["#8ccf4d", "#4f8f22"], ["#b685e6", "#7149a6"], ["#ffad5c", "#c46a17"], ["#5cc6d0", "#24828c"]];

/** A round, goofy germ with big eyes: funny, never scary (no teeth, no frown). */
export function germ(x: number, y: number, s: number, n: number, cls = "") {
  const [fill, edge] = GERM_COLORS[n % GERM_COLORS.length];
  const bumps = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * Math.PI * 2 + n; return `<circle cx="${(Math.cos(a) * 13).toFixed(1)}" cy="${(Math.sin(a) * 13).toFixed(1)}" r="4.5" fill="${fill}" stroke="${edge}" stroke-width="2"/>`; }).join("");
  const mouth = n % 2 ? `<path d="M-5 5 Q0 11 5 5" fill="none" stroke="#3a2030" stroke-width="2" stroke-linecap="round"/>` : `<path d="M-5 5 Q0 12 5 5 Z" fill="#7a2c3c"/><path d="M-2 8 Q0 11 2 8" fill="#f28fa0"/>`;
  return `<g class="hd-germ ${cls}"><g transform="translate(${x} ${y}) scale(${s})">${bumps}<circle r="13" fill="${fill}" stroke="${edge}" stroke-width="2"/><circle cx="-5" cy="-3" r="4.4" fill="#fff"/><circle cx="5" cy="-4" r="5" fill="#fff"/><circle cx="-4" cy="-2" r="2.1" fill="#222"/><circle cx="6" cy="-3" r="2.3" fill="#222"/>${mouth}</g></g>`;
}

/** Each washing step: two hands showing the move, the part to wash glowing, and where its germs sit. */
export const POSES: Record<Pose, { art: string; germs: [number, number][] }> = {
  palms: {
    art: hand({ x: 76, y: 112, r: 12, s: 0.85, view: "palm", glow: "palm", cls: "hd-a" }) + hand({ x: 124, y: 112, r: -12, s: 0.85, flip: true, view: "palm", glow: "palm", cls: "hd-b" }) + bubbles([[100, 60, 6], [94, 150, 5], [108, 140, 4]]),
    germs: [[72, 120], [128, 104]],
  },
  backs: {
    art: hand({ x: 100, y: 118, s: 0.95, view: "back", glow: "palm" }) + hand({ x: 112, y: 92, r: -72, s: 0.72, flip: true, view: "palm", cls: "hd-side" }) + bubbles([[60, 120, 5], [140, 150, 6]]),
    germs: [[84, 142], [120, 146]],
  },
  between: {
    art: hand({ x: 84, y: 120, r: 26, s: 0.85, view: "back", glow: "between", cls: "hd-a" }) + hand({ x: 116, y: 120, r: -26, s: 0.85, flip: true, view: "back", glow: "between", cls: "hd-b" }) + bubbles([[100, 44, 5], [70, 150, 5]]),
    germs: [[86, 70], [116, 66]],
  },
  thumbs: {
    art: hand({ x: 104, y: 112, s: 0.95, view: "back", glow: "thumb" }) + fist({ x: 66, y: 106, r: -40, cls: "hd-twist" }) + bubbles([[140, 60, 5], [130, 160, 6]]),
    germs: [[50, 84], [86, 134]],
  },
  nails: {
    art: hand({ x: 96, y: 130, r: -6, s: 0.9, view: "palm", glow: "palm" }) + hand({ x: 104, y: 68, r: 180, s: 0.66, flip: true, view: "back", glow: "tips", cls: "hd-circle" }) + bubbles([[60, 90, 5], [146, 120, 5]]),
    germs: [[80, 128], [122, 132]],
  },
  wrists: {
    art: hand({ x: 100, y: 86, s: 0.9, view: "back", glow: "wrist" }) + fist({ x: 100, y: 134, s: 1.05, cls: "hd-twist" }, 52) + bubbles([[60, 60, 5], [146, 90, 6]]),
    germs: [[66, 138], [134, 136]],
  },
};

const TAP = `<rect x="34" y="20" width="86" height="13" rx="6" fill="#aab6c2" stroke="#5f6b78" stroke-width="2"/><rect x="106" y="22" width="16" height="26" rx="6" fill="#aab6c2" stroke="#5f6b78" stroke-width="2"/>`;
const STREAM = `<rect class="hd-flow" x="109" y="48" width="10" height="60" rx="5" fill="#8fd3f4" opacity=".85"/>`;
const SOAP = `<g transform="rotate(-12 50 82)"><rect x="32" y="72" width="38" height="22" rx="9" fill="#f6a5c0" stroke="#b5567a" stroke-width="2"/></g>`;
const GAMCHHA = `<g><rect x="40" y="128" width="120" height="56" rx="8" fill="#d64545" stroke="#8f2626" stroke-width="2"/>${[58, 82, 106, 130].map(x => `<rect x="${x}" y="128" width="8" height="56" fill="#2f8f4e" opacity=".8"/>`).join("")}${[142, 162].map(y => `<rect x="40" y="${y}" width="120" height="6" fill="#fff" opacity=".7"/>`).join("")}</g>`;

/** Before, after and the done pictures. */
export const SCENES = {
  wet: TAP + STREAM + hand({ x: 90, y: 136, r: 22, s: 0.78, view: "palm" }) + hand({ x: 128, y: 136, r: -22, s: 0.78, flip: true, view: "palm" }) + SOAP + bubbles([[48, 60, 4], [60, 52, 3], [70, 62, 5]]),
  rinse: TAP + STREAM + hand({ x: 98, y: 132, r: 14, s: 0.8, view: "palm", cls: "hd-a" }) + hand({ x: 130, y: 132, r: -14, s: 0.8, flip: true, view: "palm", cls: "hd-b" }) + `<g fill="#8fd3f4">${[[84, 100], [140, 98], [100, 168], [130, 172]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3.5" ry="5"/>`).join("")}</g>`,
  dry: hand({ x: 80, y: 104, r: 10, s: 0.8, view: "back" }) + hand({ x: 120, y: 104, r: -10, s: 0.8, flip: true, view: "back" }) + GAMCHHA,
} as const;

// The mouth: lips, inside, tongue, then six teeth on each row following the curve.
const LIP = "#e56b6f", LIP_LINE = "#a63d4a", INSIDE = "#6b2233", TONGUE = "#f08ca0";
function teeth(row: "up" | "low") {
  return Array.from({ length: 6 }, (_, i) => {
    const x = 47 + i * 18, bend = ((i - 2.5) / 2.5) ** 2 * 16, y = row === "up" ? 54 + bend : 130 - bend;
    return `<rect x="${x}" y="${y.toFixed(1)}" width="17" height="22" rx="6" fill="#fff" stroke="#c7d2dc" stroke-width="1.5"/>`;
  }).join("");
}

/** A toothbrush lying along x: head (bristles up) at the origin, handle to the right. */
export function brush(at: Place, paste = false) {
  return place(at, `<rect x="0" y="-5" width="84" height="10" rx="5" fill="#2a9d8f" stroke="#1d6f66" stroke-width="2"/><rect x="-30" y="-6" width="34" height="12" rx="5" fill="#e8f6f4" stroke="#1d6f66" stroke-width="2"/>`
    + `<g stroke="#7fb8c4" stroke-width="2">${[-26, -20, -14, -8, -2].map(x => `<line x1="${x}" y1="-6" x2="${x}" y2="-16"/>`).join("")}</g>`
    + (paste ? `<ellipse cx="-14" cy="-20" rx="7" ry="5" fill="#fff" stroke="#7fb8c4" stroke-width="1.5"/><path d="M-19 -21 Q-14 -24 -9 -20" stroke="#4aa3df" stroke-width="2" fill="none"/>` : ""));
}

const BRUSH_AT: Record<string, Place> = {
  "up-out": { x: 92, y: 68, cls: "hd-side" },
  "up-in": { x: 100, y: 86, r: 90, s: 0.85, cls: "hd-updown" },
  "up-top": { x: 92, y: 92, cls: "hd-side" },
  "low-out": { x: 92, y: 140, cls: "hd-side" },
  "low-in": { x: 100, y: 116, r: -90, s: 0.85, cls: "hd-updown" },
  "low-top": { x: 92, y: 112, r: 180, s: 1, flip: true, cls: "hd-side" },
  tongue: { x: 92, y: 120, s: 0.9, cls: "hd-side" },
};

export const ZONE_GERMS: Record<string, [number, number][]> = {
  up: [[66, 66], [134, 64]],
  low: [[68, 140], [132, 140]],
  tongue: [[82, 118], [118, 120]],
};

/** The mouth with one zone glowing and the brush on it; `null` for the done picture with sparkles. */
export function mouth(zone: Zone | null) {
  const glow = !zone ? "" : zone.row === "tongue"
    ? `<ellipse class="hd-glow" cx="100" cy="122" rx="48" ry="26" fill="${GLOW}"/>`
    : `<rect class="hd-glow" x="40" y="${zone.row === "up" ? 48 : 106}" width="121" height="${zone.row === "up" ? 42 : 50}" rx="16" fill="${GLOW}"/>`;
  const face = `<ellipse cx="100" cy="103" rx="84" ry="66" fill="${LIP}" stroke="${LIP_LINE}" stroke-width="4"/><ellipse cx="100" cy="103" rx="70" ry="54" fill="${INSIDE}"/>`;
  const tongue = `<ellipse cx="100" cy="126" rx="40" ry="20" fill="${TONGUE}"/><path d="M100 112 V128" stroke="#d66c82" stroke-width="2" stroke-linecap="round"/>`;
  const sparkle = (x: number, y: number, s: number) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10Z" fill="${GLOW}"/>`;
  return face + (zone?.row === "tongue" ? glow : "") + tongue + (zone && zone.row !== "tongue" ? glow : "") + teeth("up") + teeth("low")
    + (zone ? brush(BRUSH_AT[zone.id]) : sparkle(60, 60, 1) + sparkle(146, 72, 0.8) + sparkle(120, 150, 0.9));
}

/** A big brush with a pea-sized blob of paste, and the tube. */
export const BRUSH_READY = brush({ x: 74, y: 128, r: -24, s: 1.5 }, true)
  + `<g transform="rotate(18 128 62)"><rect x="96" y="50" width="64" height="26" rx="8" fill="#fff" stroke="#5f6b78" stroke-width="2"/><rect x="112" y="50" width="22" height="26" fill="#4aa3df"/><rect x="160" y="54" width="14" height="18" rx="3" fill="#e56b6f" stroke="#5f6b78" stroke-width="2"/></g>`;

/** Which side of the tooth the brush is on: a tooth seen from the side, outside on the left, the tongue side on the right. */
export function toothSide(face: Face) {
  if (face === "tongue") return `<ellipse cx="32" cy="34" rx="22" ry="16" fill="${GLOW}"/><ellipse cx="32" cy="34" rx="17" ry="11" fill="${TONGUE}"/><path d="M32 26 V38" stroke="#d66c82" stroke-width="2" stroke-linecap="round"/>`;
  const mark = { out: "M14 18 L16 40", in: "M50 18 L48 40", top: "M18 11 Q32 4 46 11" }[face];
  return `<path d="${mark}" stroke="${GLOW}" stroke-width="10" stroke-linecap="round" fill="none"/>`
    + `<path d="M14 20 Q14 8 26 8 Q32 12 38 8 Q50 8 50 20 L48 40 Q46 56 40 58 Q36 50 32 50 Q28 50 24 58 Q18 56 16 40 Z" fill="#fff" stroke="#7d8a96" stroke-width="2.5" stroke-linejoin="round"/>`;
}

const ink = `stroke="#3a3040" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const note = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="4" fill="#7149a6"/><path d="M${x + 4} ${y} V${y - 14} l6 3" stroke="#7149a6" stroke-width="2.4" fill="none"/>`;

/** Small pictures (64×64): quiz moments, mode tabs and end-screen tips. */
export const ICONS: Record<string, string> = {
  bhat: `<ellipse cx="32" cy="42" rx="27" ry="12" fill="#fff" ${ink}/><path d="M12 40 Q18 24 30 27 Q44 22 50 40 Z" fill="#fffdf2" ${ink}/><circle cx="50" cy="30" r="8" fill="#f2c14e" ${ink}/><path d="M16 22 l6 -10" stroke="#3fae49" stroke-width="4" stroke-linecap="round"/>`,
  toilet: `<rect x="16" y="8" width="26" height="14" rx="3" fill="#fff" ${ink}/><path d="M10 25 H48 Q48 40 29 42 Q10 40 10 25Z" fill="#fff" ${ink}/><rect x="22" y="41" width="14" height="13" rx="2" fill="#fff" ${ink}/><ellipse cx="52" cy="50" rx="8" ry="7" fill="#3fb07a" ${ink}/><path d="M58 46 l5 -5" ${ink}/>`,
  khela: `<rect x="2" y="46" width="60" height="14" rx="6" fill="#6cbf5a"/><ellipse cx="18" cy="50" rx="9" ry="4" fill="#9a6a3d"/><circle cx="34" cy="30" r="16" fill="#fff" ${ink}/><path d="M34 22 l7 5 -3 8 h-8 l-3 -8Z" fill="#3a3040"/>`,
  hanchi: `<circle cx="26" cy="32" r="18" fill="${SKIN}" ${ink}/><path d="M16 27 q4 -3 8 0 M30 27 q4 -3 8 0" ${ink} fill="none"/><ellipse cx="27" cy="40" rx="4" ry="5" fill="#7a2c3c"/><g fill="#dff3fb" stroke="#8ccbd9" stroke-width="1.6"><circle cx="50" cy="26" r="7"/><circle cx="56" cy="36" r="6"/><circle cx="48" cy="42" r="5"/></g>`,
  tiffin: `<path d="M22 22 V12 Q32 2 42 12 V22" fill="none" stroke="#7d8a96" stroke-width="3"/>${[22, 33, 44].map(y => `<rect x="16" y="${y}" width="32" height="11" rx="3" fill="#cfd8e0" ${ink}/>`).join("")}`,
  murgi: `<path d="M12 36 Q8 22 18 24 Q14 30 20 30Z" fill="#8a4a1f" ${ink}/><ellipse cx="30" cy="38" rx="16" ry="13" fill="#c8793f" ${ink}/><circle cx="44" cy="24" r="8" fill="#c8793f" ${ink}/><path d="M40 16 q2 -6 5 -1 q3 -5 5 1" fill="#e04a3a"/><path d="M51 24 l7 2 -7 3Z" fill="#f2c14e"/><circle cx="46" cy="23" r="1.6" fill="#222"/><path d="M26 50 v8 M34 50 v8" stroke="#e0a030" stroke-width="2.5"/>`,
  gan: `<circle cx="26" cy="34" r="17" fill="${SKIN}" ${ink}/><circle cx="20" cy="30" r="2" fill="#222"/><circle cx="32" cy="30" r="2" fill="#222"/><ellipse cx="26" cy="41" rx="4" ry="4.5" fill="#7a2c3c"/>${note(46, 26)}${note(52, 46)}`,
  chand: `<path d="M36 6 A26 26 0 1 0 60 38 A20 20 0 1 1 36 6Z" fill="${GLOW}" ${ink}/><circle cx="50" cy="16" r="2.5" fill="${GLOW}"/><circle cx="54" cy="32" r="2" fill="${GLOW}"/>`,
  golpo: `<path d="M32 16 Q20 10 6 14 V50 Q20 46 32 52Z" fill="#fff" ${ink}/><path d="M32 16 Q44 10 58 14 V50 Q44 46 32 52Z" fill="#fff" ${ink}/><path d="M12 24 h12 M12 32 h12 M40 24 h12 M40 32 h12" stroke="#9aa6b2" stroke-width="2"/>`,
  rongdhonu: ["#e04a3a", "#f2a33a", "#f2d23a", "#5cb85c", "#4aa3df"].map((c, i) => `<path d="M${8 + i * 4} 46 A${24 - i * 4} ${24 - i * 4} 0 0 1 ${56 - i * 4} 46" stroke="${c}" stroke-width="4" fill="none"/>`).join("") + `<g fill="#fff" stroke="#9aa6b2" stroke-width="1.5"><circle cx="12" cy="48" r="7"/><circle cx="52" cy="48" r="7"/></g>`,
  "tab-hat": `<rect x="10" y="30" width="40" height="22" rx="9" fill="#f6a5c0" stroke="#b5567a" stroke-width="2.4"/>${bubbles([[40, 20, 7], [52, 12, 4.5], [24, 18, 5]])}`,
  "tab-dat": `<path d="M14 20 Q14 6 26 6 Q32 10 38 6 Q50 6 50 20 L48 40 Q46 58 40 60 Q36 50 32 50 Q28 50 24 60 Q18 58 16 40 Z" fill="#fff" stroke="#3a3040" stroke-width="2.5" stroke-linejoin="round"/><path transform="translate(50 12) scale(.8)" d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10Z" fill="${GLOW}" stroke="#c49a00" stroke-width="1.5"/>`,
  "tab-kokhon": `<circle cx="32" cy="34" r="24" fill="#fff" ${ink}/><path d="M32 34 V18 M32 34 L44 40" stroke="#3a3040" stroke-width="3.4" stroke-linecap="round"/><circle cx="32" cy="34" r="3" fill="#3a3040"/>`,
  mishti: `<ellipse cx="26" cy="44" rx="22" ry="10" fill="#f2efe6" ${ink}/><circle cx="18" cy="36" r="8" fill="#fffaf0" ${ink}/><circle cx="33" cy="35" r="8" fill="#fffaf0" ${ink}/><path d="M46 20 h12 l-2 36 h-8Z" fill="#cfeefc" ${ink}/>`,
  raat: `<path d="M34 6 A26 26 0 1 0 58 40 A20 20 0 1 1 34 6Z" fill="${GLOW}" stroke="#c49a00" stroke-width="2"/><path transform="translate(48 16) scale(.7)" d="M0 -12 L3 -4 L12 -4 L5 2 L8 11 L0 6 L-8 11 L-5 2 L-12 -4 L-3 -4Z" fill="${GLOW}" stroke="#c49a00" stroke-width="2"/>`,
};

/** A standalone SVG document (for the card's pictures, drawn through an <img>). */
export const svgDocument = (markup: string, box = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" width="440" height="440">${markup}</svg>`;
