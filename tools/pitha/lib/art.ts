import type { PithaId } from "./pitha";

// Original flat drawings (no photos, no shop), each sitting on a bamboo ডালা. Box 200×130; a pitha rests around (100, 90).
// One source feeds the page (inline SVG) and the card (as an image).
const INK = "#4a2a14";
const L = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const thin = (color: string, width = 1.5) => `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"`;
const shadow = (cx: number, cy: number, rx: number, ry = 5) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#4a2a1424"/>`;
const shine = (cx: number, cy: number, rx: number, ry: number, opacity = 0.5, rotate = -18) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${opacity}" transform="rotate(${rotate} ${cx} ${cy})"/>`;
const dots = (points: ReadonlyArray<readonly [number, number]>, fill: string, r = 1.4) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
const round = (value: number) => Math.round(value * 10) / 10;

/** Deterministic scatter inside an ellipse, so the art is identical on server and client. */
function scatter(cx: number, cy: number, rx: number, ry: number, count: number, seed: number) {
  const points: Array<[number, number]> = [];
  let s = seed;
  const next = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  while (points.length < count) {
    const x = next() * 2 - 1, y = next() * 2 - 1;
    if (x * x + y * y < 0.82) points.push([round(cx + x * rx), round(cy + y * ry)]);
  }
  return points;
}

/** A small clay bowl seen from slightly above. */
function bowl(cx: number, cy: number, rx: number, inside: string, extra = "") {
  const ry = rx * 0.38;
  return shadow(cx, cy + ry + 6, rx + 2, 4)
    + `<path d="M${cx - rx} ${cy}c0 ${ry * 2.2} ${rx * 0.5} ${ry * 2.6} ${rx} ${ry * 2.6}s${rx}-${ry * 0.4} ${rx}-${ry * 2.6}" fill="#a24c27" ${L}/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#b65a32" ${L}/>`
    + `<ellipse cx="${cx}" cy="${cy + 0.5}" rx="${rx - 3}" ry="${ry - 2}" fill="${inside}"/>` + extra;
}

/** A thin round rice-flour disc at an angle: porous top, browned rim. */
function disc(cx: number, cy: number, rx: number, ry: number, top: string, holes: number, seed: number, rim = "#d9a86a") {
  return shadow(cx, cy + ry * 0.6, rx, ry * 0.5)
    + `<ellipse cx="${cx}" cy="${cy + 3}" rx="${rx}" ry="${ry}" fill="${rim}" ${L}/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 2}" ry="${ry - 2}" fill="${top}"/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 2}" ry="${ry - 2}" ${thin("#c08a4e", 1.2)}/>`
    + dots(scatter(cx, cy, rx - 8, ry - 5, holes, seed), "#cdb68d", 1.5);
}

function bhapaCake(cx: number, cy: number, r: number) {
  return shadow(cx, cy + 12, r + 4)
    + `<path d="M${cx - r} ${cy}Q${cx - r} ${cy - r * 0.8} ${cx} ${cy - r * 0.82}Q${cx + r} ${cy - r * 0.8} ${cx + r} ${cy}Q${cx + r} ${cy + 11} ${cx} ${cy + 12}Q${cx - r} ${cy + 11} ${cx - r} ${cy}Z" fill="#fbf8f0" ${L}/>`
    + `<path d="M${cx - r + 3} ${cy + 3}Q${cx} ${cy + 14} ${cx + r - 3} ${cy + 3}Q${cx} ${cy + 8} ${cx - r + 3} ${cy + 3}Z" fill="#e6dccb"/>`
    + dots(scatter(cx, cy - r * 0.2, r * 0.75, r * 0.35, 9, r), "#e4d9c4", 1.3)
    // The crumbly date-palm gur that shows through the top.
    + `<path d="M${cx - r * 0.42} ${cy - r * 0.56}c4-7 ${r * 0.3}-9 ${r * 0.46}-6s${r * 0.36} 1 ${r * 0.36} 7c-4 5-${r * 0.3} 6-${r * 0.46} 4s-${r * 0.36}-1-${r * 0.36}-5Z" fill="#8b4513" ${L}/>`
    + dots([[cx - r * 0.2, cy - r * 0.6], [cx + r * 0.1, cy - r * 0.66], [cx + r * 0.25, cy - r * 0.52], [cx - r * 0.05, cy - r * 0.5]], "#c97a3a", 1.6)
    + `<path d="M${cx - r * 0.12} ${cy - r * 0.62}l4-2M${cx + r * 0.14} ${cy - r * 0.56}l3 2M${cx - r * 0.3} ${cy - r * 0.52}l3-1" ${thin("#fff8ea", 1.6)}/>`;
}

function halfMoon(cx: number, cy: number, r: number, rotate: number, fill: string, shade: string) {
  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI + (i + 0.5) * (Math.PI / 11);
    const x = round(Math.cos(a) * (r - 5)), y = round(Math.sin(a) * (r - 5));
    const tx = round(Math.cos(a + 0.5) * 5), ty = round(Math.sin(a + 0.5) * 5);
    return `M${x - tx} ${y - ty}L${x + tx} ${y + ty}`;
  }).join("");
  return `<g transform="translate(${cx} ${cy}) rotate(${rotate})">` + shadow(0, 8, r, 5)
    + `<path d="M${-r} 0A${r} ${r} 0 0 1 ${r} 0Q0 9 ${-r} 0Z" fill="${fill}" ${L}/>`
    + `<path d="M${-r + 4} 1Q0 9 ${r - 4} 1Q0 4 ${-r + 4} 1Z" fill="${shade}"/>`
    + `<path d="${ticks}" ${thin(shade, 2)}/>` + shine(-r * 0.3, -r * 0.45, r * 0.22, r * 0.08, 0.5) + `</g>`;
}

function fritter(cx: number, cy: number, r: number) {
  return shadow(cx, cy + r * 0.7, r, 5)
    + `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.8}" fill="#8a4a1f" ${L}/>`
    + `<path d="M${cx - r + 2} ${cy + 2}a${r - 2} ${r * 0.7} 0 0 0 ${2 * r - 4} 0a${r - 2} ${r * 0.4} 0 0 1-${2 * r - 4} 0Z" fill="#663412"/>`
    + `<ellipse cx="${cx}" cy="${cy - r * 0.18}" rx="${r * 0.62}" ry="${r * 0.42}" fill="#9c5726"/>`
    + shine(cx - r * 0.42, cy - r * 0.42, r * 0.24, r * 0.1, 0.45);
}

function shell(cx: number, cy: number, s: number, rotate: number) {
  const ridges = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI * (1.12 + i * 0.127);
    return `M0 ${16 * s}L${round(Math.cos(a) * 26 * s)} ${round(Math.sin(a) * 22 * s + 2 * s)}`;
  }).join("");
  return `<g transform="translate(${cx} ${cy}) rotate(${rotate})">` + shadow(0, 18 * s, 24 * s, 4)
    + `<path d="M0 ${18 * s}L${-25 * s} ${-2 * s}Q${-22 * s} ${-24 * s} 0 ${-24 * s}Q${22 * s} ${-24 * s} ${25 * s} ${-2 * s}Z" fill="#e7a94e" ${L}/>`
    + `<path d="${ridges}" ${thin("#b0702a", 2.2)}/>`
    + `<path d="M${-6 * s} ${18 * s}h${12 * s}v${5 * s}h${-12 * s}Z" fill="#d18e3c" ${L}/>` + shine(-9 * s, -12 * s, 6 * s, 2.4 * s, 0.55) + `</g>`;
}

function flatGroup(cx: number, cy: number, squash: number, inner: string) {
  return `<g transform="translate(${cx} ${cy}) scale(1 ${squash})">${inner}</g>`;
}

function rose(cx: number, cy: number, s: number) {
  const ring = (count: number, radius: number, r: number, fill: string, offset = 0) => Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + offset;
    return `<circle cx="${round(Math.cos(a) * radius * s)}" cy="${round(Math.sin(a) * radius * s)}" r="${r * s}" fill="${fill}" ${L}/>`;
  }).join("");
  return shadow(cx, cy + 16 * s, 36 * s, 5) + flatGroup(cx, cy, 0.62, ring(6, 22, 16, "#eab25c") + ring(5, 11, 11, "#e1a04a", 0.5)
    + `<circle r="${8 * s}" fill="#d48e3a" ${L}/><path d="M${-3 * s} 0a${3 * s} ${3 * s} 0 1 1 ${4 * s} ${3 * s}" ${thin(INK, 2)}/>`) + shine(cx - 14 * s, cy - 8 * s, 6 * s, 2.4 * s, 0.5);
}

function flower(cx: number, cy: number, s: number) {
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return `<circle cx="${round(Math.cos(a) * 30 * s)}" cy="${round(Math.sin(a) * 30 * s)}" r="${14 * s}" fill="#d48c3a" ${L}/>`;
  }).join("");
  const hatch = Array.from({ length: 5 }, (_, i) => { const d = (i - 2) * 8 * s; return `M${d - 16 * s} ${-16 * s}L${d + 16 * s} ${16 * s}M${d + 16 * s} ${-16 * s}L${d - 16 * s} ${16 * s}`; }).join("");
  return shadow(cx, cy + 20 * s, 44 * s, 5) + flatGroup(cx, cy, 0.52, petals + `<circle r="${34 * s}" fill="#df9c48"/>`
    + `<circle r="${22 * s}" fill="#e8ae5c" ${L}/><path d="${hatch}" ${thin("#b26f28", 2.4)}/>`) + shine(cx - 18 * s, cy - 8 * s, 8 * s, 2.6 * s, 0.5);
}

function parcel(cx: number, cy: number, s: number) {
  const k = 30 * s;
  return shadow(cx, cy + 16 * s, 40 * s, 5)
    + flatGroup(cx, cy, 0.6, `<g transform="rotate(45)"><rect x="${-k}" y="${-k}" width="${2 * k}" height="${2 * k}" rx="${6 * s}" fill="#e2a24f" ${L}/>`
      + `<path d="M${-k} ${-k}L0 0L${k} ${-k}M${-k} ${k}L0 0L${k} ${k}" ${thin("#b26f28", 2)}/><path d="M${-k + 6} ${-k + 3}L0 -4L${k - 6} ${-k + 3}Z" fill="#edb866"/></g>`)
    // The clove pinned through the middle.
    + `<path d="M${cx} ${cy - 2}v${-14 * s}" ${thin("#3e1f0e", 3.2)}/>` + dots([[cx - 2.6 * s, cy - 17 * s], [cx + 2.6 * s, cy - 17 * s], [cx, cy - 19.5 * s], [cx, cy - 15 * s]], "#3e1f0e", 2.4 * s);
}

function dumpling(cx: number, cy: number, rx: number, rotate: number) {
  return `<g transform="translate(${cx} ${cy}) rotate(${rotate})">` + shadow(0, 10, rx, 4)
    + `<ellipse rx="${rx}" ry="${rx * 0.42}" fill="#fbf8f1" ${L}/><path d="M${-rx + 4} 3Q0 ${rx * 0.5} ${rx - 4} 3Q0 ${rx * 0.25} ${-rx + 4} 3Z" fill="#e8dfcf"/>`
    + [-0.45, -0.1, 0.25, 0.55].map(t => `<path d="M${round(t * rx)} ${round(-rx * 0.36)}q-3 ${round(rx * 0.36)} 0 ${round(rx * 0.68)}" ${thin("#d4c8b2", 2.2)}/>`).join("") + `</g>`;
}

const leaf = (d: string, fill = "#5e9a3a") => `<path d="${d}" fill="${fill}" ${L}/>`;

export const pithaArt: Record<PithaId, string> = {
  bhapa: bhapaCake(66, 82, 30) + bhapaCake(118, 92, 40),

  chitoi: bowl(32, 98, 16, "#e3b43a") + bowl(168, 70, 15, "#5f8f2e", dots([[164, 69], [170, 71], [167, 68]], "#87b24c", 1.6)) + bowl(172, 102, 16, "#b0532b", dots([[168, 101], [176, 102], [172, 100]], "#d07a45", 1.6))
    + disc(96, 92, 56, 20, "#f2e9d6", 0, 3) + disc(92, 82, 56, 20, "#f7f0e2", 26, 7),

  patishapta: `<g transform="rotate(-12 100 86)">` + [0, 1, 2].map(i => {
    const y = 50 + i * 20;
    const x = 34 + (i === 1 ? -8 : 0);
    return shadow(x + 66, y + 22, 66, 4) + `<rect x="${x}" y="${y}" width="132" height="19" rx="9.5" fill="#f1dcb2" ${L}/>`
      + dots([[x + 22, y + 7], [x + 44, y + 12], [x + 70, y + 6], [x + 92, y + 11], [x + 112, y + 7]], "#c8955a", 2.2)
      + `<ellipse cx="${x + 132}" cy="${y + 9.5}" rx="6" ry="9.5" fill="#fff8ea" ${L}/><path d="M${x + 132} ${y + 6}a3 3 0 1 1-2 4" ${thin("#d9b98a", 1.6)}/>`
      + `<path d="M${x + 136} ${y + 14}q6 2 4 6" fill="#fffdf4" ${L}/>`;
  }).join("") + `</g>`,

  "dudh-chitoi": shadow(100, 112, 76, 5) + `<path d="M24 76c0 26 32 38 76 38s76-12 76-38" fill="#a14e2a" ${L}/>`
    + `<ellipse cx="100" cy="76" rx="76" ry="26" fill="#b65a32" ${L}/><ellipse cx="100" cy="77" rx="68" ry="21" fill="#e6bf88"/>`
    + `<ellipse cx="78" cy="76" rx="30" ry="11" fill="#f6ecd8" ${L}/><ellipse cx="122" cy="81" rx="29" ry="10" fill="#f3e6cd" ${L}/>`
    + dots(scatter(78, 75, 22, 7, 8, 11), "#d9c49d", 1.3) + dots(scatter(122, 80, 21, 6, 8, 13), "#d9c49d", 1.3)
    + `<path d="M64 70l5 1M88 72l3 3M110 76l5-1M132 79l4 2M98 86l5 0M72 82l4-2M140 72l3 2" ${thin("#fffaf0", 2)}/>` + shine(54, 68, 10, 3, 0.4, 0),

  nakshi: shadow(100, 108, 64, 6) + `<path d="M38 82c0 16 28 26 62 26s62-10 62-26" fill="#b8772e" ${L}/>`
    + flatGroup(100, 82, 0.42, `<circle r="62" fill="#e0a24a" ${L}/><circle r="52" ${thin("#9a5a1e", 2.6)}/><circle r="16" fill="#d18a35" ${L}/>`
      + Array.from({ length: 8 }, (_, i) => `<ellipse cx="0" cy="-34" rx="8" ry="15" fill="#e9b264" stroke="#9a5a1e" stroke-width="2.4" transform="rotate(${i * 45})"/>`).join("")
      + Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<circle cx="${round(Math.cos(a) * 57)}" cy="${round(Math.sin(a) * 57)}" r="2.2" fill="#9a5a1e"/>`; }).join("")
      + Array.from({ length: 8 }, (_, i) => `<path d="M0 -20q6 -2 4 -8" stroke="#9a5a1e" stroke-width="2.4" fill="none" transform="rotate(${i * 45 + 22.5})"/>`).join(""))
    + shine(70, 72, 14, 3.5, 0.45, -6) + `<path d="M150 92q3 8 0 12" ${thin("#c9893a", 3)}/>`,

  puli: halfMoon(66, 90, 40, -14, "#e8b468", "#c98a3e") + halfMoon(134, 94, 38, 12, "#f0c47c", "#cf9548"),

  teler: fritter(140, 72, 24) + fritter(62, 84, 27) + fritter(108, 94, 29),

  chhita: bowl(156, 82, 32, "#b5481e", `<ellipse cx="146" cy="82" rx="8" ry="4.5" fill="#6b2f16" ${L}/><ellipse cx="165" cy="85" rx="7" ry="4" fill="#6b2f16" ${L}/>` + dots([[154, 78], [170, 79], [140, 86]], "#e88a3a", 2))
    // A folded quarter of the lacy net bread, lying flat on the tray.
    + `<g transform="translate(26 108) scale(1 .5)">`
    + `<path d="M8 -4L8 -96A96 96 0 0 1 104 -4Z" fill="#e8d8b4" ${L}/>`
    + `<path d="M0 0L0 -100A100 100 0 0 1 100 0Z" fill="#f8f0dd" ${L}/>`
    + dots((() => { const out: Array<[number, number]> = []; for (let x = 8; x < 96; x += 9) for (let y = -92; y < -4; y += 9) if (Math.hypot(x, y) < 92) out.push([x + ((-y / 9) % 2) * 4, y]); return out; })(), "#d7c193", 3.2)
    + `</g>`,

  chunga: shadow(100, 108, 80, 5) + `<g transform="rotate(-18 96 84)">`
    + `<rect x="14" y="70" width="128" height="30" rx="7" fill="#7f8b3c" ${L}/>`
    + `<path d="M40 72q8 12 2 26M86 72q8 12 2 26" ${thin("#4e5622", 3)}/>`
    + `<path d="M18 74h30v6h-30Z" fill="#3a2a1a" opacity=".45"/><path d="M96 92h28v5h-28Z" fill="#3a2a1a" opacity=".4"/>`
    + `<ellipse cx="142" cy="85" rx="7" ry="15" fill="#4a3a1a" ${L}/>`
    + `<rect x="138" y="73" width="46" height="24" rx="12" fill="#fbf7ee" ${L}/>`
    + dots([[150, 79], [158, 84], [166, 79], [172, 88], [152, 90], [176, 81], [162, 92]], "#e6dcc8", 1.8) + `</g>`,

  jhinuk: shell(58, 88, 1.15, -18) + shell(142, 90, 1.15, 16) + shell(100, 76, 1.25, 0),

  malpoa: [[72, 86], [126, 90]].map(([cx, cy]) => shadow(cx, cy + 16, 50, 5) + flatGroup(cx, cy, 0.45,
    Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<circle cx="${round(Math.cos(a) * 47)}" cy="${round(Math.sin(a) * 47)}" r="6" fill="#7a3e14"/>`; }).join("")
    + `<circle r="48" fill="#a95c22" ${L}/><circle r="38" fill="#c97a34"/><circle r="26" fill="#d48a3c"/>`) + shine(cx - 18, cy - 6, 12, 3, 0.5, -4)).join(""),

  lobongo: parcel(68, 86, 1.05) + parcel(134, 88, 1.05),

  golap: rose(68, 86, 1.05) + rose(134, 88, 1.05),

  mera: dumpling(140, 70, 28, -22) + dumpling(62, 84, 30, -12) + dumpling(112, 96, 31, 8),

  bibikhana: shadow(100, 108, 84, 6) + `<ellipse cx="100" cy="96" rx="84" ry="18" fill="#c4683a" ${L}/><ellipse cx="100" cy="94" rx="72" ry="13" fill="#d47a48"/>`
    + `<path d="M36 72v16c0 9 25 16 56 16s56-7 56-16v-16" fill="#b46a2a" ${L}/>`
    + `<ellipse cx="92" cy="72" rx="56" ry="17" fill="#a8541f" ${L}/>` + dots(scatter(92, 71, 44, 11, 14, 5), "#8a3f14", 2) + shine(70, 66, 14, 3, 0.35, -4)
    + `<path d="M140 98L178 90L176 100L140 108Z" fill="#f1d48e" ${L}/><path d="M140 98L178 90Q186 84 174 80L140 88Z" fill="#a8541f" ${L}/>`
    + dots([[150, 101], [160, 98], [168, 97], [156, 104]], "#fffaf0", 1.5),

  pata: leaf("M20 96Q60 64 110 84Q70 112 20 96Z", "#4f8a30") + `<path d="M22 96Q66 82 108 84" ${thin("#355f1f", 2)}/>`
    + `<g transform="rotate(-10 70 80)"><rect x="40" y="60" width="64" height="32" rx="6" fill="#6aa646" ${L}/>`
    + `<path d="M46 64l10 24M58 62l10 26M70 62l10 26M82 62l10 26M94 62l8 20" ${thin("#4b8030", 1.4)}/><path d="M40 76h64" ${thin("#355f1f", 2)}/></g>`
    + leaf("M98 104Q140 66 186 92Q146 120 98 104Z") + `<path d="M100 104Q142 90 184 92" ${thin("#355f1f", 2)}/>`
    + `<ellipse cx="142" cy="96" rx="26" ry="10" fill="#fbf8f0" ${L}/><path d="M126 94q16-5 32 0" ${thin("#8b4513", 4)}/>`,

  "dim-chitoi": `<path d="M150 98q12-22 26 0q-4 10-13 10t-13-10Z" fill="#fbf3e2" ${L}/><path d="M150 98l5-4 4 4 5-5 4 5 4-4 4 4" fill="none" ${L}/>`
    + disc(88, 86, 60, 22, "#f6e7c4", 10, 17)
    + `<path d="M58 84c6-12 26-14 38-8s24 2 30 8c-2 10-22 12-34 9s-30 4-34-9Z" fill="#f2b736" ${L}/>`
    + `<ellipse cx="80" cy="82" rx="8" ry="4" fill="#ee9c1a"/><ellipse cx="108" cy="85" rx="7" ry="3.5" fill="#ee9c1a"/>` + dots([[70, 88], [96, 80], [118, 88]], "#5f8f2e", 1.6),

  "dudh-puli": shadow(100, 112, 76, 5) + `<path d="M24 76c0 26 32 38 76 38s76-12 76-38" fill="#a14e2a" ${L}/>`
    + `<ellipse cx="100" cy="76" rx="76" ry="26" fill="#b65a32" ${L}/><ellipse cx="100" cy="77" rx="68" ry="21" fill="#fbf1dc"/>`
    + halfMoon(72, 78, 18, -8, "#fffaf0", "#e7dcc6") + halfMoon(110, 74, 17, 10, "#fffaf0", "#e7dcc6") + halfMoon(136, 86, 16, -4, "#fffaf0", "#e7dcc6") + halfMoon(96, 92, 16, 4, "#fffaf0", "#e7dcc6")
    + `<ellipse cx="58" cy="90" rx="4" ry="2.4" fill="#7fa04a" ${L}/><ellipse cx="150" cy="72" rx="4" ry="2.4" fill="#7fa04a" ${L}/>`,

  "mug-pakon": flower(66, 86, 0.82) + flower(136, 90, 0.82),

  kholajali: shadow(100, 112, 80, 5) + `<path d="M22 86c2 16 34 26 78 26s76-10 78-26" fill="#7d3a1d" ${L}/>`
    + `<ellipse cx="100" cy="86" rx="78" ry="24" fill="#9c4a26" ${L}/><ellipse cx="100" cy="86" rx="70" ry="20" fill="#7d3a1d"/>`
    + `<ellipse cx="100" cy="84" rx="62" ry="17" fill="#f6efe0" ${L}/>`
    + dots(scatter(100, 84, 56, 14, 80, 23), "#8a4a26", 1.4),
};

/** The bamboo ডালা every pitha sits on: woven rim and a criss-cross weave. */
function dala(cx: number, cy: number, rx: number, ry: number) {
  const weave = Array.from({ length: 13 }, (_, i) => {
    const t = (i + 1) / 14 * 2 - 1;
    const x = round(cx + t * rx * 0.86), h = round(ry * 0.86 * Math.sqrt(1 - t * t));
    return `M${x - 8} ${round(cy - h)}L${x + 8} ${round(cy + h)}M${x + 8} ${round(cy - h)}L${x - 8} ${round(cy + h)}`;
  }).join("");
  return `<ellipse cx="${cx}" cy="${cy + 5}" rx="${rx + 4}" ry="${ry + 3}" fill="#4a2a1430"/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#d7b169" ${L}/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 7}" ry="${ry - 4}" fill="#e4c47f"/>`
    + `<path d="${weave}" ${thin("#c49a50", 1.6)}/>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx - 3}" ry="${ry - 2}" ${thin("#a87f3a", 2.5)}/>`;
}

/** One pitha on its ডালা, for thumbnails (viewBox 200×130). */
export const pithaSvg = (id: PithaId) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130">${dala(100, 100, 94, 26)}${pithaArt[id]}</svg>`;

/** The stall: a clay চুলা with a pot steaming on the left, the ডালা with today's pitha on the right. viewBox 320×146 (from y 44). */
export function stallSvg(id: PithaId, steam = true) {
  const chula = `<path d="M10 178c0-28 6-58 34-62h20c28 4 34 34 34 62Z" fill="#b5653a" ${L}/>`
    + `<path d="M18 178c2-20 6-38 18-46" ${thin("#d68b5c", 3)}/>`
    + `<path d="M38 178v-20a16 16 0 0 1 32 0v20Z" fill="#2b160b" ${L}/>`
    + `<path d="M44 178c0-10 4-16 10-20c6 4 10 10 10 20Z" fill="#f28c28"/><path d="M50 178c0-6 2-9 4-11c2 2 4 5 4 11Z" fill="#ffd166"/>`
    + `<path d="M22 118c0-14 14-22 32-22s32 8 32 22c0 6-14 10-32 10s-32-4-32-10Z" fill="#2f2a26" ${L}/>`
    + `<ellipse cx="54" cy="100" rx="22" ry="5" fill="#45403b" ${L}/>`;
  const wisps = steam ? `<g class="pitha-steam" ${thin("#ffffff", 3)} opacity=".85"><path d="M46 92c-6-10 6-14 0-26"/><path d="M60 90c-6-10 6-16 0-30"/>`
    + `<path d="M190 84c-6-10 6-14 0-26"/><path d="M212 80c-6-10 6-16 0-30"/><path d="M234 84c-6-10 6-14 0-24"/></g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 44 320 146" aria-hidden="true">`
    + `<path d="M0 172h320v18H0Z" fill="#8a5a3a"/><path d="M0 172h320" ${thin("#6e4429", 2)}/>`
    + chula + dala(210, 152, 108, 30)
    + `<g transform="translate(210 152) scale(1.2) translate(-100 -98)">${pithaArt[id]}</g>` + wisps + `</svg>`;
}
