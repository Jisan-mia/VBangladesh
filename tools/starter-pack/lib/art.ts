import type { ItemId, Mood } from "./pack";

// Original flat drawings of generic everyday things (no shop, no brand, no text), 64×64. One source feeds the page (inline SVG) and the card (as an image).
const INK = "#2b2135";
const ln = (width = 2) => `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
const thin = `fill="none" stroke="${INK}" stroke-width="1.4" stroke-linecap="round"`;
const shadow = (cx = 32, cy = 57, rx = 20) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="3.5" fill="${INK}" opacity=".14"/>`;
const glint = (x: number, y: number, rx = 5, ry = 2.2) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".7" transform="rotate(-30 ${x} ${y})"/>`;
const steam = (xs: number[], y = 18) => xs.map(x => `<path d="M${x} ${y}c-3-3 3-5 0-9" ${thin} opacity=".55"/>`).join("");
const dots = (points: Array<[number, number]>, fill: string, r = 1.3) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
const drop = (x: number, y: number) => `<path d="M${x} ${y}c-2 3-2 5 0 5s2-2 0-5Z" fill="#5fb6dc"/>`;
const round = (value: number) => Math.round(value * 10) / 10;

function cup(tea: string, hot: boolean, extra = "") {
  return shadow(31, 57, 22)
    + `<ellipse cx="31" cy="50" rx="22" ry="5.5" fill="#fff" ${ln()}/>`
    + `<path d="M44 31c8-1 8 10 0 10" fill="none" ${ln(2.4)}/>`
    + `<path d="M15 27h32l-3 18c-.5 3-2.5 5-5.5 5h-15c-3 0-5-2-5.5-5Z" fill="#fff" ${ln()}/>`
    + `<path d="M16.5 36h29" stroke="#e07a5f" stroke-width="2.4"/>`
    + `<ellipse cx="31" cy="27" rx="16" ry="3.6" fill="${tea}" ${ln()}/>`
    + (hot ? steam([24, 31, 38], 20) : "") + extra;
}

function clock(hour: number, minute: number, color: string, extra: string) {
  const hand = (degrees: number, length: number) => { const a = degrees * Math.PI / 180; return `${round(32 + length * Math.sin(a))} ${round(35 - length * Math.cos(a))}`; };
  return shadow(32, 57, 20)
    + `<path d="M21 49l-5 7M43 49l5 7" ${ln(2.6)}/>`
    + `<circle cx="18" cy="17" r="7" fill="${color}" ${ln()}/><circle cx="46" cy="17" r="7" fill="${color}" ${ln()}/>`
    + `<path d="M32 12V7M28 7h8" ${ln()}/>`
    + `<circle cx="32" cy="35" r="18" fill="${color}" ${ln()}/><circle cx="32" cy="35" r="13.5" fill="#fff" ${ln(1.5)}/>`
    + `<path d="M32 23.5v2.5M43.5 35H41M32 46.5V44M20.5 35H23" ${thin}/>`
    + `<path d="M32 35L${hand(((hour % 12) + minute / 60) * 30, 7)}" ${ln(2.8)}/><path d="M32 35L${hand(minute * 6, 10.5)}" ${ln(1.8)}/><circle cx="32" cy="35" r="1.6" fill="${INK}"/>`
    + glint(23, 25, 4, 1.8) + extra;
}

function phone(screen: string, body = INK) {
  return shadow(32, 58, 14)
    + `<rect x="19" y="6" width="26" height="50" rx="5" fill="${body}" ${ln()}/>`
    + `<rect x="22" y="11" width="20" height="38" rx="1.5" fill="#eaf3ff"/>${screen}`
    + `<circle cx="32" cy="52.5" r="1.6" fill="#fff" opacity=".6"/>`;
}

function ticket(color: string, icon: string) {
  return shadow(32, 55, 24)
    + `<g transform="rotate(-8 32 32)"><path d="M7 20h50v8a4 4 0 0 0 0 8v8H7v-8a4 4 0 0 0 0-8Z" fill="${color}" ${ln()}/>`
    + `<path d="M43 21v22" stroke="${INK}" stroke-width="1.5" stroke-dasharray="2 3"/>`
    + `<path d="M47 26v12M50 26v12M53 26v12" stroke="${INK}" stroke-width="1.4"/>` + icon + `</g>`;
}

const busIcon = `<rect x="13" y="25" width="24" height="12" rx="3" fill="#fff" ${ln(1.5)}/><path d="M16 29h5M24 29h5M32 29h3" stroke="${INK}" stroke-width="2.4"/><circle cx="19" cy="38" r="2.2" fill="${INK}"/><circle cx="31" cy="38" r="2.2" fill="${INK}"/>`;
const trainIcon = `<path d="M13 37V28c0-2 2-4 5-4h14c3 0 6 3 6 7v6Z" fill="#fff" ${ln(1.5)}/><path d="M17 28h5M25 28h5" stroke="${INK}" stroke-width="2.4"/><path d="M11 40h29" ${ln(1.5)}/><circle cx="19" cy="38" r="1.8" fill="${INK}"/><circle cx="31" cy="38" r="1.8" fill="${INK}"/>`;
const planeIcon = `<path d="M12 33l9-1 6-9h4l-3 9 7-1 2-3h3l-2 5 2 5h-3l-2-3-7-1 3 9h-4l-6-9-9-1Z" fill="#2f5bd3" ${ln(1.2)}/>`;

function smallClock(cx: number, cy: number, hour: number, color: string) {
  const a = hour * 30 * Math.PI / 180;
  return `<circle cx="${cx}" cy="${cy}" r="12" fill="${color}" ${ln()}/><circle cx="${cx}" cy="${cy}" r="8.6" fill="#fff" ${ln(1.3)}/>`
    + `<path d="M${cx} ${cy}L${round(cx + 4.6 * Math.sin(a))} ${round(cy - 4.6 * Math.cos(a))}" ${ln(2.2)}/><path d="M${cx} ${cy}V${cy - 6.6}" ${ln(1.4)}/>`;
}

function sack(x: number, y: number, fill: string, tie: string) {
  return `<path d="M${x - 9} ${y + 27}c-2-10 0-18 4-22l-2-5h14l-2 5c4 4 6 12 4 22Z" fill="#fff" ${ln()}/>`
    + `<path d="M${x - 8} ${y + 25}c-1-7 1-12 4-15h8c3 3 5 8 4 15Z" fill="${fill}"/>`
    + `<path d="M${x - 5} ${y}h10" stroke="${tie}" stroke-width="2.6" stroke-linecap="round"/>`;
}

function sim(x: number, y: number, rotate: number, color: string) {
  return `<g transform="rotate(${rotate} ${x + 11} ${y + 15})"><path d="M${x} ${y}h16l6 6v24H${x}Z" fill="${color}" ${ln()}/>`
    + `<rect x="${x + 5}" y="${y + 12}" width="12" height="10" rx="2" fill="#e9c46a" ${ln(1.3)}/><path d="M${x + 11} ${y + 12}v10M${x + 5} ${y + 17}h12" stroke="${INK}" stroke-width="1"/></g>`;
}

function sock(x: number, rotate: number, fill: string) {
  return `<g transform="rotate(${rotate} ${x} 30)"><path d="M${x - 6} 12h12v22c0 4 2 6 6 8 4 2 4 10-2 10-4 0-8-2-12-5-4-3-4-7-4-11Z" fill="${fill}" ${ln()}/><path d="M${x - 6} 18h12" stroke="#fff" stroke-width="2.6"/></g>`;
}

function sandal(x: number, rotate: number) {
  return `<g transform="rotate(${rotate} ${x} 32)"><path d="M${x} 8c7 0 10 6 10 14 0 6-2 10-2 18 0 8-3 14-8 14s-8-6-8-14c0-8-2-12-2-18 0-8 3-14 10-14Z" fill="#2f6fd3" ${ln()}/>`
    + `<path d="M${x - 7} 27c2-6 5-8 7-10 2 2 5 4 7 10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="17" r="1.6" fill="#fff"/></g>`;
}

function singara(x: number, rotate: number, fill: string) {
  return `<g transform="rotate(${rotate} ${x} 36)"><path d="M${x - 13} 48c4-14 9-28 13-34 4 6 9 20 13 34-8 3-18 3-26 0Z" fill="${fill}" ${ln()}/>`
    + `<path d="M${x - 9} 44c6 1.6 12 1.6 18 0" fill="none" stroke="#b5741f" stroke-width="1.6" stroke-linecap="round"/>` + dots([[x - 3, 30], [x + 3, 36], [x - 5, 40]], "#f6d28c", 1.2) + `</g>`;
}

function note(rotate: number, fill: string) {
  return `<g transform="rotate(${rotate} 32 34)"><rect x="12" y="23" width="40" height="22" rx="2" fill="${fill}" ${ln(1.6)}/>`
    + `<rect x="15" y="26" width="34" height="16" rx="1" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="1.2"/><circle cx="32" cy="34" r="5" fill="#fff" fill-opacity=".55" ${ln(1.2)}/></g>`;
}

const kadamThreads = Array.from({ length: 22 }, (_, index) => {
  const a = index / 22 * Math.PI * 2;
  const [x1, y1, x2, y2] = [32 + 14 * Math.cos(a), 27 + 14 * Math.sin(a), 32 + 19 * Math.cos(a), 27 + 19 * Math.sin(a)].map(round);
  return `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="#fff6dc" stroke-width="2" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="1.3" fill="#fff6dc"/>`;
}).join("");

/** A fried hilsa steak seen from above: dark crisp rim, turmeric-gold flesh, backbone in the middle. */
function steak(cx: number, cy: number, rotate: number) {
  return `<g transform="rotate(${rotate} ${cx} ${cy})"><path d="M${cx - 12} ${cy + 2}c0-7 5-11 12-11s12 4 12 11c0 4-5 6-12 6s-12-2-12-6Z" fill="#b8661c" ${ln()}/>`
    + `<path d="M${cx - 9} ${cy + 2}c0-5 4-8 9-8s9 3 9 8c0 2.6-4 4-9 4s-9-1.4-9-4Z" fill="#eaa648"/>`
    + `<path d="M${cx} ${cy - 5}v10M${cx} ${cy}l-6-3M${cx} ${cy}l6-3M${cx} ${cy + 3}l-5 2M${cx} ${cy + 3}l5 2" stroke="#fff3d6" stroke-width="1.2" stroke-linecap="round"/><path d="M${cx - 8} ${cy - 5}q8-6 16 0" fill="none" stroke="#dfe6ee" stroke-width="2" stroke-linecap="round"/></g>`;
}

/** The frilled edge of a small round baby pillow: little outward arcs around an ellipse. */
const frill = (() => {
  const points = Array.from({ length: 18 }, (_, index) => { const a = index / 18 * Math.PI * 2; return `${round(32 + 26 * Math.cos(a))} ${round(33 + 17 * Math.sin(a))}`; });
  return `M${points[0]}` + points.map((_, index) => `A5 5 0 0 1 ${points[(index + 1) % points.length]}`).join("") + "Z";
})();

const moon = (x: number, y: number) => `<path d="M${x} ${y}a6 6 0 1 0 4 10 5 5 0 0 1-4-10Z" fill="#ffd34d" ${ln(1.3)}/>`;
const sun = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#ffd34d" ${ln(1.3)}/><path d="M${x} ${y - 7}v-1.5M${x + 7} ${y}h1.5M${x - 7} ${y}h-1.5M${x + 5} ${y - 5}l1 -1M${x - 5} ${y - 5}l-1 -1" ${thin}/>`;

export const art: Record<ItemId, string> = {
  // ভার্সিটি
  khata: shadow(32, 57, 20) + `<g transform="rotate(-8 32 32)"><rect x="39" y="5" width="7" height="11" fill="#ffd34d" ${ln(1.4)}/><rect x="15" y="9" width="34" height="45" rx="3" fill="#4f7fd9" ${ln()}/><path d="M21 9v45" ${ln()}/><rect x="25" y="17" width="19" height="11" rx="2" fill="#fff" ${ln(1.5)}/><path d="M28 21h13M28 24.5h9" ${thin}/><path d="M38 54l11-11v8a3 3 0 0 1-3 3Z" fill="#fff" ${ln(1.5)}/></g>`,
  "canteen-cha": cup("#c98a52", true),
  photocopy: shadow(32, 57, 18) + `<rect x="19" y="10" width="30" height="42" rx="1.5" fill="#ecebe4" ${ln(1.6)} transform="rotate(7 34 31)"/><rect x="16" y="9" width="30" height="42" rx="1.5" fill="#fff" ${ln()}/><rect x="40" y="10" width="5" height="40" fill="${INK}" opacity=".07"/><path d="M21 19h20M21 24h20M21 29h15M21 34h20M21 39h11M21 44h17" stroke="#9aa0b4" stroke-width="1.6" stroke-linecap="round"/><path d="M18 15l6-4" stroke="#7d8597" stroke-width="2.6" stroke-linecap="round"/>`,
  "alarm-3am": clock(3, 0, "#e8574a", moon(55, 2)),
  "one-strap-bag": shadow(32, 57, 20) + `<path d="M19 22c-9 6-9 22-3 31" fill="none" stroke="${INK}" stroke-width="5.4" stroke-linecap="round"/><path d="M19 22c-9 6-9 22-3 31" fill="none" stroke="#c0601a" stroke-width="2.6" stroke-linecap="round"/><path d="M27 15c0-7 12-7 12 0" fill="none" ${ln(2.4)}/><rect x="17" y="15" width="32" height="40" rx="10" fill="#f39a33" ${ln()}/><path d="M17 29c4-5 28-5 32 0" fill="none" ${ln()}/><rect x="23" y="36" width="20" height="13" rx="4" fill="#e07f1f" ${ln(1.6)}/><path d="M29 42h8" ${thin}/>` + glint(24, 21),
  singara: shadow(32, 55, 25) + singara(23, -10, "#e9a94b") + singara(42, 12, "#dd9a3a"),
  calculator: shadow(32, 58, 16) + `<rect x="17" y="7" width="30" height="48" rx="4" fill="#4a5568" ${ln()}/><rect x="21" y="12" width="22" height="9" rx="1.5" fill="#cfe3c4" ${ln(1.4)}/><path d="M33 17h7" stroke="${INK}" stroke-width="1.8"/>` + Array.from({ length: 16 }, (_, index) => `<rect x="${round(21 + (index % 4) * 5.8)}" y="${round(26 + Math.floor(index / 4) * 6.8)}" width="4.2" height="4.8" rx="1" fill="${index % 4 === 3 ? "#f39a33" : "#e8ecf2"}"/>`).join(""),
  "tuition-taka": shadow(32, 56, 22) + note(-14, "#9bcf7a") + note(0, "#7fbf62") + note(12, "#a8d98a"),
  pendrive: shadow(32, 56, 16) + `<g transform="rotate(-30 32 32)"><rect x="26" y="8" width="12" height="9" fill="#cfd6df" ${ln(1.6)}/><path d="M29 11h2M33 11h2" stroke="${INK}" stroke-width="1.4"/><rect x="22" y="16" width="20" height="34" rx="5" fill="#2f5bd3" ${ln()}/><circle cx="32" cy="43" r="3" fill="#fff" ${ln(1.4)}/></g>` + glint(26, 34, 3, 1.5),
  "varsity-bus": shadow(32, 55, 27) + `<rect x="6" y="11" width="52" height="38" rx="5" fill="#d8352a" ${ln()}/><path d="M6 28h52" stroke="#fff" stroke-width="2.4"/>` + [10, 21, 32, 43].map(x => `<rect x="${x}" y="15" width="9" height="8" rx="1.5" fill="#cfe8ff" ${ln(1.3)}/>`).join("") + [10, 21, 32].map(x => `<rect x="${x}" y="32" width="9" height="8" rx="1.5" fill="#cfe8ff" ${ln(1.3)}/>`).join("") + `<rect x="45" y="32" width="9" height="15" rx="1.5" fill="#f6d1cd" ${ln(1.3)}/><circle cx="17" cy="49" r="5" fill="${INK}"/><circle cx="17" cy="49" r="2" fill="#cfd6df"/><circle cx="47" cy="49" r="5" fill="${INK}"/><circle cx="47" cy="49" r="2" fill="#cfd6df"/>`,
  "clear-file": shadow(32, 58, 22) + `<rect x="13" y="11" width="38" height="42" rx="2" fill="#fff" ${ln(1.5)}/><path d="M18 18h24M18 23h28M18 28h20M18 33h26" stroke="#9aa0b4" stroke-width="1.6" stroke-linecap="round"/><rect x="9" y="16" width="46" height="40" rx="4" fill="#7ec8e3" fill-opacity=".45" ${ln()}/><path d="M9 23h46" ${ln(1.5)}/><circle cx="32" cy="23" r="3" fill="#fff" ${ln(1.4)}/>` + glint(17, 34, 6, 2),
  charger: shadow(32, 57, 18) + `<path d="M21 30c0 8 10 6 10 14s-12 6-12 0 14-6 18 2 4 10 12 8" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/><rect x="12" y="14" width="18" height="16" rx="3" fill="#f4f4f4" ${ln()}/><path d="M17 14V8M25 14V8" ${ln(2.6)}/><rect x="44" y="46" width="11" height="6" rx="1.5" fill="#cfd6df" ${ln(1.4)} transform="rotate(-10 49 49)"/>`,
  // নতুন চাকরি
  tiffin: shadow(32, 58, 18) + `<path d="M18 22V10c0-4 28-4 28 0v12" fill="none" ${ln(2.6)}/>` + [20, 32, 44].map(y => `<rect x="15" y="${y}" width="34" height="12" rx="3" fill="#cdd5df" ${ln()}/><path d="M19 ${y + 4}h10" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`).join("") + `<path d="M15 21c0-5 34-5 34 0" fill="#dfe5ec" ${ln()}/><path d="M15 26h-3v22h3M49 26h3v22h-3" fill="none" ${ln(1.8)}/>`,
  "office-id": shadow(32, 59, 16) + `<path d="M18 4l14 22 14-22" fill="none" stroke="${INK}" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 4l14 22 14-22" fill="none" stroke="#e85d9b" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/><rect x="29" y="23" width="6" height="6" rx="1" fill="#cfd6df" ${ln(1.4)}/><rect x="17" y="28" width="30" height="28" rx="3" fill="#fff" ${ln()}/><path d="M17.5 31a3 3 0 0 1 3-2.5h23a3 3 0 0 1 3 2.5v3h-29Z" fill="#c2307a"/><rect x="21" y="37" width="10" height="13" rx="1.5" fill="#dfe7f4" ${ln(1.3)}/><circle cx="26" cy="42" r="2.4" fill="#9aa6c2"/><path d="M22.5 49.5c0-3.5 7-3.5 7 0Z" fill="#9aa6c2"/><path d="M34 40h9M34 44h7M34 48h9" ${thin}/>`,
  iron: shadow(32, 56, 25) + `<path d="M26 26c0-8 4-12 10-12h10c4 0 6 3 6 7v5" fill="none" ${ln(2.8)}/><path d="M6 46c2-12 12-20 26-20h18c3 0 5 2 5 5v15Z" fill="#7cc5d9" ${ln()}/><path d="M5 46h51v4H8Z" fill="#cfd6df" ${ln()}/><circle cx="40" cy="37" r="4" fill="#fff" ${ln(1.4)}/><path d="M40 37l2-2" ${ln(1.2)}/>` + glint(22, 34, 5, 2) + steam([8, 14], 40),
  "sweets-box": shadow(32, 56, 25) + `<rect x="9" y="22" width="46" height="30" rx="3" fill="#fff" ${ln()}/><rect x="13" y="30" width="38" height="18" rx="2" fill="none" stroke="#e0457b" stroke-width="1.6" stroke-dasharray="3 2"/><path d="M7 17h50v8H7Z" fill="#fff" ${ln()}/><path d="M32 17v35M9 38h46" stroke="#d63a3a" stroke-width="2.4"/><path d="M32 17c-7-7-14-2-6 1ZM32 17c7-7 14-2 6 1Z" fill="#d63a3a" ${ln(1.2)}/>` + dots([[18, 42], [46, 33], [20, 33], [44, 44]], "#f19cb8", 1.8),
  "tea-flask": shadow(32, 58, 14) + `<path d="M43 22c7 0 7 14 0 14" fill="none" ${ln(2.6)}/><rect x="21" y="16" width="22" height="40" rx="5" fill="#3d7dd8" ${ln()}/><path d="M21 25h22M21 47h22" stroke="#fff" stroke-width="2" opacity=".75"/><path d="M22 16v-6c0-2 2-3 4-3h12c2 0 4 1 4 3v6Z" fill="#e8574a" ${ln()}/><circle cx="32" cy="36" r="4.2" fill="#ffd34d" ${ln(1.2)}/>` + glint(25, 30, 2, 5),
  "laptop-bag": shadow(32, 57, 25) + `<path d="M12 30C12 8 52 8 52 30" fill="none" ${ln(2.6)}/><path d="M24 26c0-7 16-7 16 0" fill="none" ${ln(2.6)}/><rect x="8" y="26" width="48" height="28" rx="4" fill="#4a5568" ${ln()}/><path d="M12 31h40" stroke="#cfd6df" stroke-width="1.4" stroke-dasharray="2 2"/><rect x="16" y="36" width="32" height="12" rx="3" fill="#5c6a80" ${ln(1.5)}/>`,
  inbox: shadow(32, 57, 22) + `<rect x="14" y="13" width="38" height="26" rx="3" fill="#e9eef7" ${ln(1.6)}/><rect x="8" y="22" width="42" height="30" rx="3" fill="#fff" ${ln()}/><path d="M8.5 24l20.5 15 20.5-15" fill="none" ${ln()}/><circle cx="49" cy="19" r="9" fill="#e8574a" ${ln()}/><path d="M45 19h8M49 15v8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
  "holiday-calendar": shadow(32, 58, 23) + `<rect x="10" y="12" width="44" height="42" rx="4" fill="#fff" ${ln()}/><path d="M10 16a4 4 0 0 1 4-4h36a4 4 0 0 1 4 4v8H10Z" fill="#c2307a" ${ln()}/><path d="M22 8v8M42 8v8" ${ln(2.6)}/>` + Array.from({ length: 12 }, (_, index) => `<rect x="${15 + (index % 4) * 9.4}" y="${29 + Math.floor(index / 4) * 8}" width="6" height="5" rx="1" fill="#e2e8f2"/>`).join("") + `<circle cx="27.4" cy="31.5" r="4.6" fill="none" stroke="#e8574a" stroke-width="2"/><circle cx="46.2" cy="47.5" r="4.6" fill="none" stroke="#e8574a" stroke-width="2"/>`,
  "diary-pen": shadow(30, 57, 22) + `<rect x="12" y="10" width="32" height="44" rx="3" fill="#7a4b2a" ${ln()}/><path d="M38 10v44" stroke="${INK}" stroke-width="2.4"/><path d="M22 54v6l3-2 3 2v-6" fill="#e8574a" ${ln(1.2)}/>` + glint(18, 16, 3, 1.4) + `<g transform="rotate(28 47 32)"><rect x="44" y="9" width="7" height="38" rx="2" fill="#2f5bd3" ${ln(1.6)}/><path d="M44 47l3.5 7 3.5-7Z" fill="#f4e3c3" ${ln(1.4)}/><path d="M51 13h2v12" fill="none" ${ln(1.4)}/></g>`,
  "alarm-7am": clock(7, 0, "#2e9a8f", sun(56, 8)),
  "salary-sms": phone(`<rect x="24" y="15" width="16" height="9" rx="3" fill="#fff" ${ln(1.1)}/><path d="M27 18.5h10M27 21h6" stroke="#9aa0b4" stroke-width="1.2" stroke-linecap="round"/><rect x="24" y="29" width="16" height="9" rx="1.5" fill="#7fbf62" ${ln(1.1)}/><circle cx="32" cy="33.5" r="2.2" fill="#fff" opacity=".7"/><circle cx="37" cy="43" r="4" fill="#21915a"/><path d="M35 43l1.5 1.5 3-3" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`),
  shoes: shadow(31, 54, 27) + `<path d="M6 44c0-6 4-10 10-10l8-8c3-3 7-2 9 1 3 5 9 7 17 8 6 1 9 4 9 9v2H6Z" fill="#5a3420" ${ln()}/><path d="M6.5 46h52v3a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2Z" fill="${INK}"/><path d="M24 30l4 4M27.5 27l4 4" stroke="#e8d2b0" stroke-width="1.6"/>` + glint(42, 38, 6, 2) + `<path d="M50 14v8M46 18h8" stroke="#f0b400" stroke-width="2" stroke-linecap="round"/>`,
  // প্রবাসী
  "achar-jar": shadow(32, 58, 18) + `<path d="M18 22h28v28c0 4-3 6-6 6H24c-3 0-6-2-6-6Z" fill="#fdf6e8"/><path d="M19 32h26v18c0 3-2 5-5 5H24c-3 0-5-2-5-5Z" fill="#d9632b"/>` + dots([[25, 40], [31, 50], [39, 39]], "#f2a33a", 3.4) + dots([[35, 46], [24, 49]], "#a83d16", 2.6) + `<path d="M19 32h26" stroke="#f3c247" stroke-width="2"/><path d="M18 22h28v28c0 4-3 6-6 6H24c-3 0-6-2-6-6Z" fill="none" ${ln()}/><path d="M22.5 26v18" stroke="#fff" stroke-width="2.4" opacity=".6" stroke-linecap="round"/><path d="M15 15c4-5 30-5 34 0l-2 8H17Z" fill="#e8574a" ${ln()}/><path d="M17 21h30" stroke="#fff" stroke-width="2"/>` + dots([[23, 16], [30, 14.5], [37, 15], [43, 17]], "#fff", 1.2),
  "video-call": phone(`<rect x="22" y="11" width="20" height="38" rx="1.5" fill="#cfe3f5"/><path d="M23 49c0-8 4-12 9-12s9 4 9 12Z" fill="#7fbf62" ${ln(1.2)}/><circle cx="32" cy="27" r="7" fill="#ffd27a" ${ln(1.2)}/><circle cx="29.5" cy="26" r="1" fill="${INK}"/><circle cx="34.5" cy="26" r="1" fill="${INK}"/><path d="M29.5 29.5q2.5 2 5 0" ${thin}/><rect x="34" y="13" width="6.5" height="9" rx="1.2" fill="#fff" ${ln(1)}/><circle cx="37.2" cy="16.6" r="1.8" fill="#9ad0f5"/>`) + `<path d="M52 6c2-3 6-1 4 2l-4 4-4-4c-2-3 2-5 4-2Z" fill="#e8574a" ${ln(1.2)}/>`,
  passport: shadow(32, 58, 18) + `<rect x="36" y="5" width="17" height="9" rx="1.5" fill="#ffd34d" ${ln(1.4)} transform="rotate(14 44 10)"/><g transform="rotate(-6 32 32)"><rect x="16" y="9" width="32" height="44" rx="3" fill="#1f6b4f" ${ln()}/><circle cx="32" cy="27" r="8" fill="none" stroke="#e9c46a" stroke-width="1.8"/><path d="M24 27h16M32 19c-4 5-4 11 0 16M32 19c4 5 4 11 0 16" fill="none" stroke="#e9c46a" stroke-width="1.4"/><path d="M24 42h16M27 46h10" stroke="#e9c46a" stroke-width="1.8" stroke-linecap="round"/></g>`,
  suitcase: shadow(32, 59, 22) + `<path d="M24 16v-6h16v6" fill="none" ${ln(2.8)}/><path d="M38 10l5 8M39 10l-3 8" stroke="#e8574a" stroke-width="2.4" stroke-linecap="round"/><path d="M12 22c0-4 2-6 6-6h28c4 0 6 2 6 6l2 14-2 14c0 3-2 5-6 5H18c-4 0-6-2-6-5l-2-14Z" fill="#2f5bd3" ${ln()}/><path d="M10.5 30h43M10.5 42h43" stroke="#f2a33a" stroke-width="3.4"/><rect x="29" y="27" width="6" height="6" rx="1" fill="#e9c46a" ${ln(1.2)}/><rect x="29" y="39" width="6" height="6" rx="1" fill="#e9c46a" ${ln(1.2)}/><circle cx="18" cy="57" r="2.6" fill="${INK}"/><circle cx="46" cy="57" r="2.6" fill="${INK}"/>` + glint(17, 22, 3, 1.4),
  "rice-cooker": shadow(32, 58, 25) + steam([26, 32, 38], 12) + `<path d="M8 36H4M56 36h4" ${ln(2.8)}/><path d="M10 30h44v18c0 5-4 8-9 8H19c-5 0-9-3-9-8Z" fill="#fff" ${ln()}/><path d="M8 30c0-10 10-16 24-16s24 6 24 16Z" fill="#f2f2f2" ${ln()}/><rect x="27" y="11" width="10" height="5" rx="2" fill="${INK}"/><rect x="24" y="38" width="16" height="9" rx="2" fill="#e9eef7" ${ln(1.3)}/><circle cx="28.5" cy="42.5" r="1.6" fill="#e8574a"/><circle cx="35.5" cy="42.5" r="1.6" fill="#21915a"/>` + dots([[15, 44], [18, 41], [18, 47]], "#f19cb8", 1.8),
  "two-clocks": shadow(32, 56, 27) + smallClock(18, 34, 10, "#21915a") + smallClock(46, 34, 6, "#2f5bd3") + sun(18, 14) + moon(43, 9),
  adapter: shadow(32, 58, 18) + `<path d="M25 44v10M31 47v10" ${ln(2.6)}/><path d="M18 22l14-7 14 7v20l-14 7-14-7Z" fill="#f4f4f4" ${ln()}/><path d="M18 22l14 7 14-7M32 29v20" fill="none" ${ln(1.6)}/><path d="M32 29l14-7v6l-14 7Z" fill="#f2a33a"/><circle cx="24" cy="34" r="1.5" fill="${INK}"/><circle cx="28" cy="36" r="1.5" fill="${INK}"/><path d="M38 38l4-2" ${thin}/>`,
  "two-sims": shadow(32, 56, 23) + sim(9, 14, -12, "#21915a") + sim(31, 15, 10, "#2f5bd3"),
  // Proportions from the Bangladesh flag rules: 10:6, red disc radius 1/5 of the length, centred 9/20 of the length from the hoist.
  flag: shadow(26, 59, 12) + `<path d="M14 8v50" ${ln(2.8)}/><circle cx="14" cy="7" r="2.4" fill="#e9c46a" ${ln(1.2)}/><rect x="15" y="10" width="36" height="21.6" fill="#006a4e" ${ln()}/><circle cx="31.2" cy="20.8" r="7.2" fill="#f42a41"/>`,
  spices: shadow(32, 58, 25) + sack(32, 20, "#8a5a33", "#f2a33a") + sack(19, 26, "#e8b923", "#e8574a") + sack(45, 26, "#c0392b", "#21915a"),
  jacket: shadow(32, 59, 25) + `<path d="M20 12l12 6 12-6 10 6 4 30h-8l-2-16v26H16V32l-2 16H6l4-30Z" fill="#2f5bd3" ${ln()}/><path d="M16 28h32M16 38h32M16 48h32M10 30l4 2M54 30l-4 2" stroke="#1c3a91" stroke-width="1.6"/><path d="M32 18v40" ${ln(1.6)}/><path d="M20 12c2 6 22 6 24 0" fill="#e8574a" ${ln(1.6)}/>`,
  "boarding-pass": ticket("#e9eef7", planeIcon),
  // নতুন বাবা-মা
  feeder: shadow(32, 58, 14) + `<path d="M22 34h20v16c0 3-2 5-5 5H27c-3 0-5-2-5-5Z" fill="#fff7e0"/><rect x="21" y="22" width="22" height="34" rx="6" fill="none" ${ln()}/><path d="M37 30h4M37 36h4M37 42h4M37 48h4" ${thin}/><path d="M28 44c1-2 3-1 3 0 0-1 2-2 3 0 0 2-3 4-3 4s-3-2-3-4Z" fill="#f19cb8"/><rect x="19" y="16" width="26" height="7" rx="2" fill="#7ec8e3" ${ln()}/><path d="M25 16c0-4 3-5 4-9 1-2 5-2 6 0 1 4 4 5 4 9Z" fill="#f6c87a" ${ln()}/>` + glint(25, 28, 2, 4),
  "sleepy-eyes": shadow(32, 55, 24) + [20, 44].map(cx => `<ellipse cx="${cx}" cy="32" rx="11" ry="9" fill="#fff" ${ln()}/><circle cx="${cx}" cy="35" r="4" fill="${INK}"/><path d="M${cx - 11} 32a11 9 0 0 1 22 0Z" fill="#cdb8ea" ${ln()}/><path d="M${cx - 8} 45q8 4 16 0" fill="none" stroke="#8d7bb0" stroke-width="2.4" stroke-linecap="round"/>`).join("") + `<path d="M50 5h6l-6 6h6M42 11h4l-4 4h4" fill="none" ${ln(1.8)}/>`,
  diaper: shadow(32, 56, 24) + `<path d="M8 20h48l-6 14c-4 9-10 16-18 16s-14-7-18-16Z" fill="#fff" ${ln()}/><path d="M10 26h44" stroke="#f19cb8" stroke-width="2" stroke-dasharray="3 3"/><rect x="5" y="17" width="11" height="7" rx="2" fill="#7ec8e3" ${ln(1.4)}/><rect x="48" y="17" width="11" height="7" rx="2" fill="#7ec8e3" ${ln(1.4)}/>` + dots([[24, 33], [32, 38], [40, 33], [32, 30]], "#9ad0f5", 1.6),
  jhunjhuni: shadow(32, 59, 14) + `<rect x="29" y="30" width="6" height="25" rx="3" fill="#f2a33a" ${ln()}/><circle cx="32" cy="56" r="3.4" fill="#7ec8e3" ${ln(1.6)}/><circle cx="32" cy="20" r="14" fill="#e8574a" ${ln()}/><path d="M18.5 20h27" stroke="#ffd34d" stroke-width="4.4"/><path d="M22 12h20M22 28h20" stroke="#fff" stroke-width="2"/><circle cx="32" cy="20" r="14" fill="none" ${ln()}/><path d="M11 10l-4-3M53 10l4-3M9 22H4M55 22h5" ${thin}/>` + glint(25, 13, 3, 1.4),
  kantha: shadow(32, 58, 27) + [["#7ec8e3", 44, "#fff"], ["#f6efe0", 34, "#2f5bd3"], ["#e8574a", 24, "#fff"], ["#f6efe0", 14, "#21915a"]].map(([fill, y, stitch]) => `<rect x="8" y="${y}" width="48" height="10" rx="4" fill="${fill}" ${ln()}/><path d="M12 ${Number(y) + 5}h40" stroke="${stitch}" stroke-width="1.4" stroke-dasharray="2.5 2"/>`).join("") + `<circle cx="44" cy="19" r="2" fill="#e8574a"/>` + dots([[41, 19], [47, 19], [44, 16], [44, 22]], "#f2a33a", 1.3),
  "cold-tea": cup("#b98a62", false, `<path d="M22 27q4-2 8 0t8 0" ${thin}/><path d="M51 6v12M45 12h12M47 8l8 8M55 8l-8 8" stroke="#5fb6dc" stroke-width="1.8" stroke-linecap="round"/>`),
  "photo-phone": phone(Array.from({ length: 15 }, (_, index) => `<rect x="${23.5 + (index % 3) * 6}" y="${13 + Math.floor(index / 3) * 6.5}" width="5" height="5" rx=".8" fill="${["#f19cb8", "#ffd27a", "#9ad0f5", "#a8d98a"][index % 4]}"/>`).join(""), "#e8574a") + `<circle cx="46" cy="8" r="6" fill="#2f5bd3" ${ln(1.4)}/><path d="M43 8h6M46 5v6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>`,
  dolna: shadow(32, 59, 25) + moon(47, 3) + `<path d="M16 44l-3 9M48 44l3 9" ${ln(2.4)}/><path d="M7 50q25 12 50 0" fill="none" ${ln(2.8)}/><path d="M10 26h44l-4 16c-1 3-3 4-6 4H20c-3 0-5-1-6-4Z" fill="#d9a066" ${ln()}/><path d="M13 32h38M14.5 38h35M22 27v18M32 27v19M42 27v18" stroke="#a9733f" stroke-width="1.4"/><path d="M14 26c4-6 14-8 22-6 6 1 12 3 16 6Z" fill="#9ad0f5" ${ln(1.6)}/>`,
  "baby-bag": shadow(32, 58, 22) + `<rect x="38" y="10" width="8" height="14" rx="3" fill="#fff" ${ln(1.5)}/><path d="M40 10c0-3 4-3 4 0" fill="#f6c87a" ${ln(1.2)}/><path d="M20 22c0-11 24-11 24 0" fill="none" ${ln(2.6)}/><rect x="12" y="20" width="40" height="34" rx="8" fill="#a8d98a" ${ln()}/><path d="M18 36h28v10c0 3-2 4-4 4H22c-2 0-4-1-4-4Z" fill="#8cc06b" ${ln(1.5)}/><path d="M32 25l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6Z" fill="#ffd34d" ${ln(1)}/>`,
  "chhora-boi": shadow(32, 57, 26) + `<path d="M8 50c8-2 16-2 24 2 8-4 16-4 24-2v4c-8-2-16-2-24 2-8-4-16-4-24-2Z" fill="#f0a020" ${ln(1.6)}/><path d="M32 16c-8-4-16-4-24-2v36c8-2 16-2 24 2Z" fill="#fff" ${ln()}/><path d="M32 16c8-4 16-4 24-2v36c-8-2-16-2-24 2Z" fill="#fff" ${ln()}/>` + moon(20, 23) + `<path d="M15 39l1 2 2 .4-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.4Z" fill="#ffd34d"/><path d="M37 24h13M37 29h11M37 34h13M37 39h9" stroke="#9aa0b4" stroke-width="1.5" stroke-linecap="round"/>`,
  socks: shadow(32, 57, 24) + sock(20, -8, "#9ad0f5") + sock(40, 8, "#ffd27a"),
  "sorshe-balish": shadow(32, 55, 26) + `<path d="${frill}" fill="#fffaf0" ${ln(1.5)}/><ellipse cx="32" cy="33" rx="21" ry="12.5" fill="#f8de86" ${ln()}/><ellipse cx="32" cy="33" rx="15" ry="8.6" fill="none" stroke="#c99a1e" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="32" cy="33" r="2.4" fill="#c99a1e" ${ln(1)}/>` + dots([[21, 29], [43, 29], [24, 39], [40, 39], [32, 25.5], [32, 41]], "#f19cb8", 1.6) + dots([[18, 34], [46, 34], [27, 27], [37, 27]], "#7fbf62", 1.1),
  // ঈদের ছুটিতে বাড়ি
  "bus-ticket": ticket("#ffd34d", busIcon),
  "salami-khaam": shadow(32, 56, 25) + `<rect x="9" y="20" width="46" height="32" rx="3" fill="#0f5c36" ${ln()}/><g transform="rotate(-6 31 20)"><rect x="16" y="9" width="30" height="20" rx="2" fill="#9bcf7a" ${ln(1.5)}/><circle cx="31" cy="19" r="4.4" fill="#fff" fill-opacity=".55" ${ln(1.1)}/></g><path d="M9 24l23 14 23-14v25a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3Z" fill="#2aa866" ${ln()}/><path d="M16 47h32" stroke="#e9c46a" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/><circle cx="32" cy="42" r="3" fill="#e9c46a"/>` + dots([[28, 42], [36, 42], [32, 38], [32, 46]], "#f6dfa0", 1.4),
  "power-bank": shadow(32, 58, 16) + `<path d="M32 10c0-6 10-7 15-4" fill="none" ${ln(2.4)}/><rect x="18" y="10" width="28" height="44" rx="6" fill="#4a5568" ${ln()}/><path d="M34 17l-8 12h6l-3 10 9-13h-6l3-9Z" fill="#ffd34d" ${ln(1.2)}/>` + dots([[25, 47], [30, 47], [35, 47]], "#7fe08a", 1.7) + dots([[40, 47]], "#8a94a6", 1.7),
  "gift-bag": shadow(32, 58, 22) + `<rect x="17" y="12" width="13" height="15" fill="#e8574a" ${ln(1.5)}/><path d="M23.5 12v15" stroke="#ffd34d" stroke-width="2"/><rect x="31" y="7" width="15" height="20" fill="#2f5bd3" ${ln(1.5)}/><path d="M31 16h15" stroke="#fff" stroke-width="2"/><path d="M22 26c0-9 20-9 20 0" fill="none" ${ln(2)}/><path d="M12 24h40l-3 32H15Z" fill="#f2a33a" ${ln()}/><circle cx="32" cy="40" r="6" fill="#fff" fill-opacity=".55"/><path d="M29 40l2 2 4-4" fill="none" stroke="#e8574a" stroke-width="1.8" stroke-linecap="round"/>`,
  "neck-pillow": shadow(32, 57, 24) + `<path d="M14 18c-6 8-6 24 4 32 8 6 20 6 28 0 10-8 10-24 4-32-3-3-8-2-9 2-1 6 2 10 1 16-1 6-6 9-9 9s-8-3-9-9c-1-6 2-10 1-16-1-4-6-5-9-2Z" fill="#9ad0f5" ${ln()}/><path d="M17 22c-4 8-3 18 4 24 6 5 16 5 22 0 7-6 8-16 4-24" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 3"/>` + glint(18, 28, 2, 4),
  ludu: shadow(32, 58, 24) + `<rect x="8" y="8" width="44" height="44" rx="3" fill="#fff" ${ln()}/>` + [["8", "8", "#e8574a"], ["36", "8", "#21915a"], ["36", "36", "#f2c230"], ["8", "36", "#2f5bd3"]].map(([x, y, fill]) => `<rect x="${x}" y="${y}" width="16" height="16" rx="2" fill="${fill}" ${ln(1.4)}/><circle cx="${Number(x) + 8}" cy="${Number(y) + 8}" r="4" fill="#fff"/>`).join("") + `<path d="M24 24h12L30 30ZM36 24v12L30 30ZM36 36H24L30 30ZM24 36V24L30 30Z" fill="#fff"/><path d="M24 24l6 6 6-6Z" fill="#21915a"/><path d="M36 36l-6-6-6 6Z" fill="#2f5bd3"/><path d="M24 24l6 6-6 6Z" fill="#e8574a"/><path d="M36 24l-6 6 6 6Z" fill="#f2c230"/><g transform="rotate(14 48 48)"><rect x="40" y="40" width="16" height="16" rx="3" fill="#fff" ${ln()}/>` + dots([[44, 44], [48, 48], [52, 52]], INK, 1.6) + `</g>`,
  "train-ticket": ticket("#9ad0f5", trainIcon),
  "new-clothes": shadow(32, 56, 24) + `<path d="M16 22h32v26H16Z" fill="#e8574a"/><path d="M26 22l6 7 6-7Z" fill="#fff" ${ln(1.4)}/><circle cx="32" cy="34" r="1.3" fill="#fff"/><circle cx="32" cy="40" r="1.3" fill="#fff"/><path d="M16 45h32" stroke="#ffd34d" stroke-width="2" stroke-dasharray="2 2"/><rect x="10" y="14" width="44" height="38" rx="3" fill="#e9f4ff" fill-opacity=".35" ${ln()}/><path d="M45 9l9 4-3 6-9-4Z" fill="#ffd34d" ${ln(1.3)}/><path d="M44 12c-3-2-6 0-6 3" ${thin}/>` + glint(17, 20, 5, 1.8),
  "water-biscuit": shadow(32, 58, 25) + `<rect x="15" y="10" width="10" height="8" rx="2" fill="#2f5bd3" ${ln(1.6)}/><rect x="12" y="18" width="16" height="38" rx="5" fill="#cfe9fb"/><rect x="12" y="30" width="16" height="10" fill="#7ec8e3"/><rect x="12" y="18" width="16" height="38" rx="5" fill="none" ${ln()}/><rect x="30" y="26" width="26" height="30" rx="3" fill="#f2a33a" ${ln()}/><path d="M30 30h26" stroke="${INK}" stroke-width="1.2" stroke-dasharray="1.5 1.5"/><circle cx="40" cy="43" r="6" fill="#e8c27a" ${ln(1.4)}/><circle cx="48" cy="38" r="5" fill="#e8c27a" ${ln(1.4)}/>` + dots([[38, 42], [42, 45], [47, 37], [49, 40]], "#b8833a", 1),
  "house-lock": shadow(30, 58, 18) + `<path d="M22 28V18a10 10 0 0 1 20 0v10" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M22 28V18a10 10 0 0 1 20 0v10" fill="none" stroke="#cfd6df" stroke-width="2.8" stroke-linecap="round"/><rect x="16" y="28" width="32" height="26" rx="4" fill="#e9b949" ${ln()}/><circle cx="32" cy="38" r="3" fill="${INK}"/><path d="M32 40v7" ${ln(2.6)}/>` + glint(21, 33, 3, 1.4) + `<g transform="rotate(-25 50 50)"><circle cx="51" cy="44" r="5" fill="none" ${ln(2.2)}/><path d="M51 49v10M51 55h3M51 58h2" ${ln(2)}/></g>`,
  semai: shadow(30, 56, 25) + `<path d="M44 27l11-15" ${ln(2.6)}/><ellipse cx="56" cy="10" rx="3" ry="4.6" fill="#cfd6df" ${ln(1.4)} transform="rotate(35 56 10)"/><path d="M8 32h48c0 12-10 20-24 20S8 44 8 32Z" fill="#fff" ${ln()}/><path d="M14 42c10 5 26 5 36 0" stroke="#21915a" stroke-width="1.8" fill="none"/><ellipse cx="32" cy="32" rx="24" ry="7" fill="#f7e2b2" ${ln()}/><path d="M13 32c3-3 5 2 8-1s5 2 8-1 5 2 8-1 5 2 8-1 4 2 6 0M17 35c3-2 5 1 8-1s5 1 8-1 5 1 8-1 4 1 6 0" fill="none" stroke="#d9a35a" stroke-width="1.5"/>` + `<ellipse cx="25" cy="30" rx="2" ry="1.3" fill="#7a3b2a"/><ellipse cx="38" cy="33" rx="2" ry="1.3" fill="#7a3b2a"/><ellipse cx="31" cy="29" rx="2" ry="1.2" fill="#f4ecd8" ${ln(.8)}/>`,
  ghuri: `<path d="M32 30c8 10 16 14 26 18" fill="none" stroke="${INK}" stroke-width="1" opacity=".6"/><path d="M32 46c-4 4 4 6 0 9s4 5 0 8" fill="none" ${ln(1.6)}/><path d="M29 52l-3-2v4ZM35 58l3-2v4Z" fill="#2f5bd3"/><path d="M32 6l16 18-16 22-16-22Z" fill="#e8574a"/><path d="M32 6l16 18H32Z" fill="#ffd34d"/><path d="M32 46l-16-22H32Z" fill="#ffd34d"/><path d="M32 6l16 18-16 22-16-22Z" fill="none" ${ln()}/><path d="M32 6v40M16 24h32" ${ln(1.4)}/>`,
  // বৃষ্টির দিন
  khichuri: shadow(32, 59, 26) + steam([24, 32, 40], 21) + `<path d="M44 28l12-18" ${ln(2.6)}/><path d="M7 34H3M57 34h4" ${ln(2.8)}/><path d="M8 30c0 16 10 26 24 26s24-10 24-26Z" fill="#b8bfc9" ${ln()}/><ellipse cx="32" cy="30" rx="25" ry="7" fill="#cfd6df" ${ln()}/><ellipse cx="32" cy="30" rx="21" ry="5" fill="#f2c14e" ${ln(1.4)}/>` + dots([[22, 30], [28, 28], [35, 31], [41, 29], [30, 32]], "#d9932a", 1.3) + dots([[25, 31], [38, 28]], "#6fb34f", 1.4) + glint(16, 40, 2, 5),
  umbrella: shadow(30, 59, 14) + `<path d="M32 26v24c0 5-7 5-7 0" fill="none" ${ln(2.8)}/><path d="M8 10c4 10 12 16 24 16s20-6 24-16c-6 4-10 4-12 0-4 4-8 4-12 0-4 4-8 4-12 0-2 4-6 4-12 0Z" fill="#2f5bd3" ${ln()}/><path d="M20 12c2 7 6 12 12 14M44 12c-2 7-6 12-12 14" fill="none" stroke="#7ea6f2" stroke-width="1.6"/><path d="M32 26L5 7M32 26L59 7" stroke="#8a94a6" stroke-width="1.4" stroke-linecap="round"/><path d="M3 36h10M50 38h10M8 44h6" ${thin}/>` + drop(50, 46) + drop(14, 50),
  ilish: shadow(32, 56, 27) + `<ellipse cx="32" cy="40" rx="27" ry="12.5" fill="#fff" ${ln()}/><ellipse cx="32" cy="39.5" rx="20" ry="8" fill="none" stroke="#9ad0f5" stroke-width="1.4"/>` + steak(21, 36, -12) + steak(41, 35, 14) + `<path d="M40 48c6 0 11-2 14-7" fill="none" stroke="#3f9a3a" stroke-width="3.2" stroke-linecap="round"/><path d="M54 41l3-2" ${ln(1.4)}/>`,
  raincoat: shadow(32, 59, 23) + `<path d="M32 6c-8 0-12 6-12 12v4l-8 30c0 3 2 4 4 4h32c2 0 4-1 4-4l-8-30v-4c0-6-4-12-12-12Z" fill="#ffd34d" ${ln()}/><ellipse cx="32" cy="18" rx="7" ry="8" fill="#fff8d6" ${ln(1.6)}/><circle cx="32" cy="34" r="1.6" fill="${INK}"/><circle cx="32" cy="42" r="1.6" fill="${INK}"/><path d="M20 46h7M37 46h7" ${ln(1.6)}/>` + glint(23, 30, 2, 5) + drop(50, 16) + drop(12, 30),
  sandal: shadow(32, 58, 27) + sandal(21, -10) + sandal(43, 10),
  "polythene-phone": shadow(32, 59, 18) + `<rect x="22" y="16" width="20" height="36" rx="4" fill="${INK}"/><rect x="24.5" y="20" width="15" height="26" rx="1" fill="#eaf3ff"/><path d="M14 14c0-2 2-4 4-4h28c2 0 4 2 4 4l2 40c0 2-2 4-4 4H16c-2 0-4-2-4-4Z" fill="#e9f4ff" fill-opacity=".4" ${ln(1.6)}/><path d="M27 10c-2-6 2-8 5-4 3-4 7-2 5 4" fill="#e9f4ff" ${ln(1.4)}/><path d="M17 24l4 6M45 40l-4 6M46 18l-3 4" stroke="#fff" stroke-width="1.8" opacity=".9" stroke-linecap="round"/>` + drop(8, 20) + drop(55, 30) + drop(10, 42),
  kadam: `<path d="M32 42v8" ${ln(2.4)}/><path d="M32 46c-10 0-18 5-22 12 10 0 18-4 22-12ZM32 46c10 0 18 5 22 12-10 0-18-4-22-12Z" fill="#3f9a3a" ${ln()}/>` + kadamThreads + `<circle cx="32" cy="27" r="14.5" fill="#f2a33a" ${ln()}/>` + dots([[26, 22], [32, 19], [38, 23], [24, 29], [31, 26], [38, 30], [28, 34], [35, 35], [42, 27], [22, 25]], "#d97b0c", 1.5) + glint(26, 20, 4, 2),
  "paper-boat": `<path d="M4 50c5-4 9 4 14 0s9 4 14 0 9 4 14 0 9 4 14 0" fill="none" stroke="#5fb6dc" stroke-width="2.8" stroke-linecap="round"/><path d="M20 36l12-22 12 22Z" fill="#f1f1ec" ${ln()}/><path d="M32 14v22" ${ln(1.4)}/><path d="M8 36h48l-8 12H16Z" fill="#fff" ${ln()}/><path d="M22 41h20M25 44h14" stroke="#9aa0b4" stroke-width="1.3" stroke-linecap="round"/>` + drop(10, 12) + drop(52, 8) + drop(48, 22),
  "ada-cha": shadow(32, 58, 15) + steam([28, 36], 12) + `<path d="M21.3 24h21.4l-2.3 29c-.1 1.6-1.4 2.6-3 2.6H26.6c-1.6 0-2.9-1-3-2.6Z" fill="#b5651d"/><ellipse cx="36" cy="25" rx="4.4" ry="2" fill="#f2d48a" ${ln(1.2)}/><path d="M20 14h24l-3 40c-.2 2-2 3.5-4 3.5H27c-2 0-3.8-1.5-4-3.5Z" fill="#fff" fill-opacity=".25" ${ln()}/><path d="M24.5 18l2 33" stroke="#fff" stroke-width="2" opacity=".6" stroke-linecap="round"/>`,
  muri: shadow(32, 58, 25) + `<path d="M10 34c2-10 10-16 22-16s20 6 22 16Z" fill="#f7ecd2" ${ln(1.6)}/>` + dots([[18, 30], [24, 25], [31, 22], [38, 25], [45, 30], [27, 30], [35, 29], [22, 32], [42, 33]], "#fffaf0", 2) + `<path d="M20 27l4 1M33 25l3 2M40 29l2 3M28 33l4-1" stroke="#c96b2a" stroke-width="2" stroke-linecap="round"/><path d="M36 21l3 1M24 30l2-2" stroke="#3f9a3a" stroke-width="2" stroke-linecap="round"/>` + dots([[30, 27], [43, 27]], "#c2307a", 1.3) + `<path d="M8 34h48c0 12-10 20-24 20S8 46 8 34Z" fill="#cfd6df" ${ln()}/>` + glint(16, 41, 2, 4),
  candle: shadow(32, 58, 16) + `<circle cx="32" cy="15" r="11" fill="#ffd34d" opacity=".28"/><ellipse cx="32" cy="52" rx="14" ry="4.6" fill="#cfd6df" ${ln()}/><rect x="26" y="24" width="12" height="28" rx="2" fill="#fff" ${ln()}/><path d="M26 29c0 5 3.4 5 3.4 0" fill="#fff" ${ln(1.2)}/><path d="M32 21v3.5" ${ln(1.4)}/><path d="M32 7c-5 6-5 11 0 14 5-3 5-8 0-14Z" fill="#ffb72e" ${ln(1.4)}/><path d="M32 13c-2 3-2 5 0 6 2-1 2-3 0-6Z" fill="#fff3b0"/>`,
  "golper-boi": shadow(31, 57, 22) + `<rect x="14" y="10" width="34" height="44" rx="3" fill="#21915a" ${ln()}/><path d="M19 10v44" stroke="#0f5c36" stroke-width="2"/><path d="M25 34l7-7 7 7v8H25Z" fill="#fff" fill-opacity=".9"/><rect x="30" y="37" width="4" height="5" fill="#21915a"/><path d="M24 17l-2 4M32 15l-2 4M40 17l-2 4M28 22l-1.5 3M36 22l-1.5 3" stroke="#bfe3ff" stroke-width="1.6" stroke-linecap="round"/><path d="M24 48h16" stroke="#ffd34d" stroke-width="2.4" stroke-linecap="round"/><path d="M40 54v6l2.5-2 2.5 2v-6" fill="#e8574a" ${ln(1.2)}/>`,
};

export const artSvg = (id: ItemId, size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${art[id]}</svg>`;

/** Mixes a #rrggbb colour toward white by `amount` (0–1). */
function tint(hex: string, amount: number) {
  const value = parseInt(hex.slice(1), 16);
  return "#" + [16, 8, 0].map(shift => Math.round(((value >> shift) & 255) * (1 - amount) + 255 * amount).toString(16).padStart(2, "0")).join("");
}

const faces: Record<Mood, string> = {
  smile: `<circle cx="41" cy="35" r="3" fill="${INK}"/><circle cx="59" cy="35" r="3" fill="${INK}"/><circle cx="42" cy="34" r="1" fill="#fff"/><circle cx="60" cy="34" r="1" fill="#fff"/><path d="M43 44q7 6 14 0" fill="none" ${ln(2.4)}/>`,
  sleepy: `<path d="M36 35q5 3 10 0M54 35q5 3 10 0" fill="none" ${ln(2.4)}/><path d="M37 40q4 2 8 0M55 40q4 2 8 0" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/><ellipse cx="50" cy="47" rx="3" ry="2.4" fill="${INK}"/><path d="M74 12h6l-6 6h6M82 4h4l-4 4h4" fill="none" ${ln(2)}/>`,
  grin: `<path d="M37 37l4-4 4 4M55 37l4-4 4 4" fill="none" ${ln(2.6)}/><path d="M41 43q9 11 18 0Z" fill="#7a2f3a" ${ln(2)}/>`,
  calm: `<path d="M37 34q4 4 8 0M55 34q4 4 8 0" fill="none" ${ln(2.4)}/><path d="M44 44q6 4 12 0" fill="none" ${ln(2.4)}/>`,
};

/** A friendly one-colour plastic toy, like a figure pressed into a fair-stall blister pack. No gender, no skin tone: just the pack's colour and a face. 100×150. */
export function figureSvg(color: string, deep: string, mood: Mood, size = 150) {
  // Head and body both stay close to the pack colour, so the toy reads as one-colour plastic and never as a skin tone.
  const head = tint(color, 0.22);
  const body = tint(color, 0.1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 150" width="${size * 2 / 3}" height="${size}">`
    + `<ellipse cx="50" cy="143" rx="28" ry="5" fill="${INK}" opacity=".16"/>`
    + `<rect x="35" y="108" width="13" height="33" rx="6.5" fill="${deep}" ${ln(2.4)}/><rect x="52" y="108" width="13" height="33" rx="6.5" fill="${deep}" ${ln(2.4)}/>`
    + `<rect x="16" y="66" width="12" height="36" rx="6" fill="${body}" ${ln(2.4)} transform="rotate(14 22 68)"/>`
    + `<rect x="73" y="44" width="12" height="34" rx="6" fill="${body}" ${ln(2.4)} transform="rotate(-28 79 76)"/>`
    + `<path d="M29 76c0-12 9-20 21-20s21 8 21 20v36c0 4-3 6-6 6H35c-3 0-6-2-6-6Z" fill="${body}" ${ln(2.4)}/>`
    + `<rect x="39" y="82" width="22" height="15" rx="5" fill="#fff" opacity=".35"/><path d="M50 60v14" stroke="${INK}" stroke-opacity=".25" stroke-width="2"/>`
    + `<circle cx="50" cy="36" r="25" fill="${head}" ${ln(2.4)}/>`
    + `<ellipse cx="38" cy="22" rx="7" ry="3.5" fill="#fff" opacity=".7" transform="rotate(-30 38 22)"/>`
    + `<circle cx="36" cy="43" r="4" fill="#fff" opacity=".3"/><circle cx="64" cy="43" r="4" fill="#fff" opacity=".3"/>`
    + faces[mood] + `</svg>`;
}
