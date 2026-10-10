import type { SweetId } from "./box";

// Original flat drawings of generic sweets (no shop, no brand), 64×64. One source feeds both the page (inline SVG) and the card (as an image).
const INK = "#5a3420";
const line = `stroke="${INK}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`;
const shadow = (cx = 32, cy = 54, rx = 20) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="4" fill="#5a342022"/>`;
const shine = (cx: number, cy: number, rx = 5, ry = 2.6, opacity = 0.75) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${opacity}" transform="rotate(-30 ${cx} ${cy})"/>`;
const syrup = (rx = 24) => `<ellipse cx="32" cy="50" rx="${rx}" ry="6" fill="#f3d27a" opacity=".55"/>`;

/** A ball with a darker underside crescent and a glint. */
function ball(fill: string, shade: string, cx = 32, cy = 34, r = 17, glint = 0.75) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${line}/>`
    + `<path d="M${cx - r + 1} ${cy}A${r - 1} ${r - 1} 0 0 0 ${cx + r - 1} ${cy}A${r - 1} ${r * 0.6} 0 0 1 ${cx - r + 1} ${cy}Z" fill="${shade}"/>`
    + shine(cx - r * 0.38, cy - r * 0.42, r * 0.3, r * 0.16, glint);
}

/** A sweet seen in a bowl: rim, milk surface, then whatever floats in it. */
function bowl(milk: string, inside: string, rim = "#ffffff") {
  return shadow(32, 55, 24)
    + `<path d="M8 32h48c0 12-10 21-24 21S8 44 8 32Z" fill="${rim}" ${line}/>`
    + `<ellipse cx="32" cy="32" rx="24" ry="8" fill="${milk}" ${line}/>` + inside
    + `<path d="M14 42c5 5 11 7 18 7" fill="none" stroke="#5a342033" stroke-width="2" stroke-linecap="round"/>`;
}

/** A clay pot of doi seen from slightly above; `top` is the set surface. */
function pot(top: string, body = "#b65a32", width = 22, crust = "") {
  const l = 32 - width, r = 32 + width;
  return shadow(32, 56, width + 2)
    + `<path d="M${l} 26c0 18 6 28 ${width} 28s${width}-10 ${width}-28" fill="${body}" ${line}/>`
    + `<path d="M${l + 2} 36c6 4 14 6 ${width - 2} 6" fill="none" stroke="#00000022" stroke-width="2.5" stroke-linecap="round"/>`
    + `<ellipse cx="32" cy="26" rx="${width + 2}" ry="8" fill="${body}" ${line}/>`
    + `<ellipse cx="32" cy="26" rx="${width - 2}" ry="5.6" fill="${top}" ${line}/>` + crust;
}

const dots = (points: Array<[number, number]>, fill: string, r = 1.3) => points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");

export const art: Record<SweetId, string> = {
  roshogolla: syrup() + ball("#fffaf0", "#eadcc0"),
  kalojam: syrup() + `<ellipse cx="32" cy="34" rx="20" ry="16" fill="#3b2016" ${line}/>` + `<path d="M13 36a19 15 0 0 0 38 0a19 9 0 0 1-38 0Z" fill="#24110b"/>` + shine(24, 27, 6, 3, 0.4),
  chomchom: shadow(32, 50, 25) + `<ellipse cx="32" cy="36" rx="25" ry="13" fill="#c98656" ${line}/>` + `<path d="M8 38a24 12 0 0 0 48 0a24 6 0 0 1-48 0Z" fill="#a8683d"/>` + dots([[20, 32], [27, 29], [34, 31], [41, 29], [46, 34], [24, 37], [38, 36], [31, 40], [17, 38]], "#f5e3c3", 1.6),
  balish: shadow(32, 52, 26) + `<path d="M8 22q24-8 48 0q5 13 0 26q-24 7-48 0q-5-13 0-26Z" fill="#d49a5e" ${line}/>` + `<path d="M10 23q22-7 44 0q2 6 1 9q-23-6-46 0q-1-3 1-9Z" fill="#fff3dc"/>` + `<path d="M12 44q20 5 40 0" fill="none" stroke="#a8683d" stroke-width="2" stroke-linecap="round"/>`,
  lalmohon: syrup() + ball("#8f3d1f", "#6a2914", 32, 34, 17, 0.45),
  pantua: syrup() + `<ellipse cx="32" cy="35" rx="22" ry="14" fill="#7c4522" ${line}/>` + `<path d="M11 37a21 13 0 0 0 42 0a21 7 0 0 1-42 0Z" fill="#5c3117"/>` + shine(24, 29, 6, 2.6, 0.45),
  rajbhog: syrup(26) + ball("#f6d270", "#e2b245", 32, 33, 20) + dots([[38, 26], [26, 38], [40, 39]], "#e0832a", 1.2),
  langcha: shadow(32, 52, 26) + `<g transform="rotate(-18 32 34)"><rect x="6" y="25" width="52" height="18" rx="9" fill="#3d2117" ${line}/><path d="M8 37q24 6 48 0" fill="none" stroke="#24110b" stroke-width="5" stroke-linecap="round"/></g>` + shine(22, 31, 7, 2, 0.35),
  golapjam: syrup() + ball("#a9552a", "#843f1d", 22, 36, 12, 0.5) + ball("#a9552a", "#843f1d", 41, 32, 13, 0.5),
  "chhanar-jilapi": shadow(32, 53, 22) + `<path d="M32 18c9 0 16 7 16 16s-7 16-16 16-16-7-16-16 6-14 14-15" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M32 18c9 0 16 7 16 16s-7 16-16 16-16-7-16-16 6-14 14-15" fill="none" stroke="#6e3818" stroke-width="7.5" stroke-linecap="round"/><path d="M24 26c2-2 4-3 6-3" stroke="#fff" stroke-width="1.6" opacity=".45" fill="none" stroke-linecap="round"/>`,
  kamalabhog: syrup() + ball("#f5a442", "#e07f26"),
  kachagolla: shadow(32, 52, 23) + `<path d="M9 50c-3-12 5-23 13-25c3-7 16-8 20-1c9 2 15 13 12 26Z" fill="#f4e4c4" ${line}/>` + dots([[18, 40], [25, 33], [33, 30], [41, 34], [46, 42], [28, 44], [37, 41], [21, 47], [43, 48], [33, 36]], "#d6bd8f", 1.7),
  monda: shadow(32, 50, 25) + `<path d="M8 32v8c0 6 11 10 24 10s24-4 24-10v-8" fill="#e6cd9e" ${line}/>` + `<ellipse cx="32" cy="32" rx="24" ry="10" fill="#f6e7c9" ${line}/>` + `<ellipse cx="32" cy="32" rx="9" ry="3.6" fill="#e3c894"/>`,
  chhanamukhi: shadow(32, 53, 24) + [[10, 30], [33, 30], [20, 16], [22, 38]].map(([x, y]) => `<path d="M${x} ${y + 4}l8-4 10 3v10l-8 4-10-3Z" fill="#fffdf6" ${line}/><path d="M${x} ${y + 4}l10 3 8-4M${x + 10} ${y + 7}v10" fill="none" ${line}/>`).join("") + dots([[16, 36], [38, 36], [26, 22], [28, 44]], "#e9dfc6", 1.1),
  jamurki: shadow(32, 51, 22) + `<circle cx="32" cy="33" r="19" fill="#f5e0b4" ${line}/>` + Array.from({ length: 8 }, (_, i) => `<ellipse cx="32" cy="22" rx="3.6" ry="7" fill="#ead096" transform="rotate(${i * 45} 32 33)"/>`).join("") + `<circle cx="32" cy="33" r="4" fill="#e0bd74" ${line}/>`,
  sabitri: shadow(32, 52, 24) + `<rect x="9" y="28" width="22" height="18" rx="5" fill="#8c4a26" ${line}/><rect x="31" y="22" width="24" height="20" rx="5" fill="#9b5530" ${line}/>` + dots([[16, 34], [23, 40], [38, 29], [47, 36], [42, 33]], "#c98b5e", 1.4),
  pera: shadow(32, 52, 25) + `<g transform="rotate(-12 32 34)"><rect x="8" y="22" width="40" height="13" rx="6.5" fill="#a96a3c" ${line}/><rect x="16" y="35" width="40" height="13" rx="6.5" fill="#9b5d31" ${line}/><path d="M18 25v7M26 25v7M34 25v7M26 38v7M34 38v7M42 38v7" stroke="#7a4421" stroke-width="1.5" stroke-linecap="round"/></g>`,
  "gurer-sondesh": shadow(32, 52, 22) + `<path d="M32 14c12 0 21 10 21 22 0 8-9 14-21 14s-21-6-21-14c0-12 9-22 21-22Z" fill="#c9965f" ${line}/>` + `<path d="M32 18v30M23 21c2 8 3 18 2 27M41 21c-2 8-3 18-2 27M15 30c3 6 5 12 5 18M49 30c-3 6-5 12-5 18" fill="none" stroke="#9e6a36" stroke-width="1.8" stroke-linecap="round"/>`,
  roshkodom: shadow(32, 52, 20) + ball("#f2e3cb", "#e2cfae", 32, 34, 18, 0.5) + dots([[22, 28], [28, 24], [36, 25], [42, 30], [25, 36], [33, 32], [41, 38], [29, 42], [37, 44], [20, 40], [44, 44]], "#ffffff", 1.6) + `<circle cx="34" cy="31" r="3" fill="#c0392b"/>`,
  laddu: shadow(32, 53, 20) + `<circle cx="32" cy="34" r="18" fill="#f39a1e" ${line}/>` + dots([[24, 26], [31, 22], [39, 25], [44, 32], [22, 34], [29, 30], [37, 31], [27, 39], [35, 38], [42, 40], [31, 46], [23, 43], [39, 46]], "#d97b0c", 2) + shine(25, 25, 4, 2, 0.6),
  bundia: shadow(32, 54, 25) + `<path d="M7 52c2-14 12-24 25-24s23 10 25 24Z" fill="#f6ae2d" ${line}/>` + dots([[14, 47], [20, 42], [27, 37], [34, 35], [41, 38], [47, 44], [52, 50], [22, 49], [30, 45], [38, 46], [45, 50], [33, 51], [26, 42], [16, 51], [40, 42]], "#e88c12", 2.2),
  "mishti-doi": pot("#e9b87e"),
  "bogura-doi": shadow(32, 54, 27) + `<path d="M5 30c2 14 12 22 27 22s25-8 27-22" fill="#a9512c" ${line}/><ellipse cx="32" cy="30" rx="27" ry="9" fill="#a9512c" ${line}/><ellipse cx="32" cy="30" rx="23" ry="6.6" fill="#d39457" ${line}/>` + `<path d="M18 30c4-2 9 1 14-1s9-2 13 0" fill="none" stroke="#b97735" stroke-width="1.6" stroke-linecap="round"/>`,
  "bhola-doi": pot("#fffbf2", "#9c4d2b", 17, `<path d="M22 26c4-2 7 1 10-1s6-1 9 1" fill="none" stroke="#e8dcc6" stroke-width="1.6" stroke-linecap="round"/>`),
  "gournadi-doi": pot("#f3dcb2", "#b65a32", 22, dots([[24, 25], [31, 27], [38, 24], [42, 27], [27, 28]], "#c99257", 1.4)),
  "tok-doi": shadow(32, 55, 20) + `<path d="M14 26l4 26h28l4-26" fill="#d9773f" ${line}/><ellipse cx="32" cy="26" rx="18" ry="6" fill="#d9773f" ${line}/><ellipse cx="32" cy="26" rx="14.5" ry="4.4" fill="#ffffff" ${line}/>`,
  roshmalai: bowl("#fbe8b8", `<ellipse cx="24" cy="31" rx="6" ry="3.4" fill="#fff8e8" ${line}/><ellipse cx="38" cy="30" rx="6" ry="3.4" fill="#fff8e8" ${line}/><ellipse cx="31" cy="35" rx="6" ry="3.4" fill="#fff8e8" ${line}/>`),
  "chhanar-payesh": bowl("#f7e2b2", dots([[18, 31], [23, 29], [28, 33], [33, 30], [38, 33], [43, 30], [47, 32], [25, 35], [35, 35], [41, 35], [30, 28], [20, 34]], "#fff6dd", 2.1)),
  patkshir: shadow(32, 54, 26) + `<path d="M4 34L32 18l28 16-28 16Z" fill="#5f9e3c" ${line}/><path d="M32 18v32M18 26l14 8M46 26l-14 8" stroke="#3f7a26" stroke-width="1.4" fill="none"/><ellipse cx="32" cy="34" rx="15" ry="8" fill="#fbe7c0" ${line}/><ellipse cx="29" cy="32" rx="6" ry="2.4" fill="#fff6e2"/>`,
  roshmonjori: bowl("#f8dfa6", dots([[20, 31], [27, 29], [34, 31], [41, 29], [45, 33], [24, 35], [31, 35], [38, 35]], "#fff3d6", 3)),
  malaikari: shadow(32, 54, 26) + `<ellipse cx="32" cy="44" rx="27" ry="9" fill="#ffffff" ${line}/><rect x="13" y="26" width="38" height="18" rx="9" fill="#f6d9a6" ${line}/><path d="M13 33c0-5 4-8 9-8h20c5 0 9 3 9 8-3 3-5-1-8 2s-5-1-9 2-6-1-9 1-7-2-12-5Z" fill="#fff7e6" ${line}/>`,
  jilapi: shadow(32, 54, 24) + `<path d="M32 33c0-3 4-4 6-1s0 8-6 8-10-5-9-10 7-11 14-10 13 8 12 15-7 15-17 15-19-9-18-18 7-17 15-18" fill="none" stroke="${INK}" stroke-width="8.5" stroke-linecap="round"/><path d="M32 33c0-3 4-4 6-1s0 8-6 8-10-5-9-10 7-11 14-10 13 8 12 15-7 15-17 15-19-9-18-18 7-17 15-18" fill="none" stroke="#ef8e1f" stroke-width="5" stroke-linecap="round"/>`,
  amriti: shadow(32, 54, 24) + `<circle cx="32" cy="33" r="13" fill="none" stroke="${INK}" stroke-width="8.5"/><circle cx="32" cy="33" r="13" fill="none" stroke="#d8501d" stroke-width="5"/>` + Array.from({ length: 10 }, (_, i) => `<circle cx="32" cy="14" r="4.4" fill="#d8501d" ${line} transform="rotate(${i * 36} 32 33)"/>`).join(""),
  "tiler-khaja": shadow(32, 54, 24) + [36, 28, 20].map((y, i) => `<path d="M${10 + i * 2} ${y + 6}l20-8 22 7-20 9Z" fill="#f1d69c" ${line}/><path d="M${10 + i * 2} ${y + 6}v5l22 9 20-9v-5" fill="#e1bd72" ${line}/>`).join("") + dots([[22, 25], [28, 22], [34, 24], [40, 23], [30, 27], [37, 27], [26, 26]], "#fffaf0", 1.1),
  kotkoti: shadow(32, 54, 25) + [[10, 40, -20], [18, 30, 15], [28, 42, -5], [30, 24, -30], [38, 34, 20], [42, 44, -12]].map(([x, y, a]) => `<rect x="${x}" y="${y}" width="16" height="7" rx="3" fill="#a5622b" ${line} transform="rotate(${a} ${x + 8} ${y + 3.5})"/>`).join(""),
  batasha: shadow(32, 54, 24) + [[19, 40, 10], [42, 40, 10], [31, 29, 11]].map(([x, y, r]) => `<path d="M${x - r} ${y + 4}c0-8 4-${r} ${r}-${r}s${r} ${r - 2} ${r} ${r}c-4 3-16 3-${r * 2} 0Z" fill="#fffdf8" ${line}/>`).join(""),
  sonpapri: shadow(32, 54, 22) + `<path d="M12 26l20-9 20 9-20 9Z" fill="#f6e2aa" ${line}/><path d="M12 26v20l20 9V35Z" fill="#ecc977" ${line}/><path d="M52 26v20l-20 9V35Z" fill="#dfb65e" ${line}/><path d="M14 31l16 7M14 36l16 7M14 41l16 7M50 31l-16 7M50 36l-16 7M50 41l-16 7" stroke="#c99a44" stroke-width="1.2"/>`,
  "narkel-naru": shadow(32, 54, 24) + ball("#fbf5e6", "#ebe0c6", 21, 37, 13, 0.4) + ball("#fbf5e6", "#ebe0c6", 42, 35, 13, 0.4) + `<path d="M15 33l4 2M22 30l2 3M18 40l3-1M37 30l3 2M44 29l1 3M40 38l3 1M46 39l2-2" stroke="#d9c9a5" stroke-width="1.4" stroke-linecap="round"/>`,
  malpoa: syrup(26) + `<ellipse cx="32" cy="38" rx="25" ry="12" fill="#d08a40" ${line}/><ellipse cx="32" cy="37" rx="18" ry="8" fill="#b06628"/>` + shine(26, 34, 7, 2.4, 0.45),
  "hawai-mithai": `<path d="M32 40v18" stroke="#c9a77a" stroke-width="3" stroke-linecap="round"/>` + `<path d="M18 36c-7 0-9-9-3-12-2-7 6-12 11-8 3-6 13-6 15 1 7-2 12 6 8 11 5 4 1 12-6 10-3 5-11 6-14 1-4 2-10 1-11-3Z" fill="#f6a3c6" ${line}/>` + `<path d="M22 26c3-2 6-2 8 0M34 22c3-1 5 0 6 2" stroke="#fff" stroke-width="2" opacity=".7" fill="none" stroke-linecap="round"/>`,
};

export const artSvg = (id: SweetId, size = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">${art[id]}</svg>`;
