import { layoutPlate, SCENE, type ItemId } from "./plate";

// Original flat drawings of home iftar food, 64×64, seen from above (glasses from the side). No brand, no packaging.
// One source feeds the page (inline SVG) and the card (the same scene as an image).
const INK = "#4a2a17";
const line = (width = 1.6) => `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
const shadow = (cx = 32, cy = 36, rx = 24, ry = 22) => `<ellipse cx="${cx + 2}" cy="${cy + 3}" rx="${rx}" ry="${ry}" fill="#3b2a1a" opacity=".1"/>`;
const glint = (cx: number, cy: number, rx = 3.5, ry = 1.6, opacity = 0.6) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${opacity}" transform="rotate(-35 ${cx} ${cy})"/>`;
const round = (value: number) => Math.round(value * 10) / 10;

/** Deterministic scatter, so a drawing never changes between page and card. */
function scatter(seed: number, count: number, cx: number, cy: number, rx: number, ry: number) {
  const points: Array<[number, number, number]> = [];
  let state = seed;
  const next = () => { state = (state * 9301 + 49297) % 233280; return state / 233280; };
  for (let index = 0; index < count; index++) {
    const angle = next() * Math.PI * 2, distance = Math.sqrt(next());
    points.push([round(cx + Math.cos(angle) * rx * distance), round(cy + Math.sin(angle) * ry * distance), round(next() * 180)]);
  }
  return points;
}

/** A craggy fried edge: a circle (or oval) whose radius wobbles, like batter that spread in hot oil. */
function fried(cx: number, cy: number, rx: number, ry: number, fill: string, rotate = 0, bumps = 9) {
  const points = Array.from({ length: 36 }, (_, index) => {
    const angle = (index / 36) * Math.PI * 2;
    const wobble = 1 + 0.07 * Math.sin(angle * bumps) + 0.04 * Math.sin(angle * (bumps + 4) + 1);
    return `${round(cx + Math.cos(angle) * rx * wobble)} ${round(cy + Math.sin(angle) * ry * wobble)}`;
  });
  return `<path d="M${points.join("L")}Z" fill="${fill}" ${line()} transform="rotate(${rotate} ${cx} ${cy})"/>`;
}

const specks = (seed: number, count: number, cx: number, cy: number, rx: number, ry: number, colors: string[], r = 1.3) =>
  scatter(seed, count, cx, cy, rx, ry).map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${colors[index % colors.length]}"/>`).join("");

const chili = (x: number, y: number, rotate: number) => `<path d="M${x} ${y}q5-2 9 1" stroke="#2f7d32" stroke-width="2.4" fill="none" stroke-linecap="round" transform="rotate(${rotate} ${x} ${y})"/>`;
const onion = (x: number, y: number, rotate: number) => `<path d="M${x} ${y}a4 2.4 0 0 1 7 0" stroke="#a8325a" stroke-width="1.6" fill="none" stroke-linecap="round" transform="rotate(${rotate} ${x} ${y})"/>`;
const leaf = (x: number, y: number, rotate: number) => `<path d="M${x} ${y}c2-3 5-3 6 0c-2 2-4 2-6 0z" fill="#3f9142" transform="rotate(${rotate} ${x} ${y})"/>`;

/** A bati seen from above: rim, then whatever it holds. */
const bowl = (fill: string, inside: string, rim = "#f4efe6", shine = "#fff") => shadow(32, 32, 27, 27)
  + `<circle cx="32" cy="32" r="27" fill="${rim}" ${line()}/><circle cx="32" cy="32" r="21.5" fill="${fill}" ${line(1.1)}/>` + inside
  + `<path d="M12 22a22 22 0 0 1 14-12" stroke="${shine}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`;

/** A plain tumbler seen from the side, filled from y=24 down. */
function glass(liquid: string, top: string, extra = "") {
  const at = (y: number) => [16 + (y - 10) * (5 / 48), 48 - (y - 10) * (5 / 48)];
  const [l, r] = at(24);
  return `<ellipse cx="32" cy="59" rx="15" ry="3" fill="#3b2a1a" opacity=".18"/>`
    + `<path d="M16 10L21 58H43L48 10Z" fill="#eef7fb" opacity=".9"/>`
    + `<path d="M${round(l)} 24L21 58H43L${round(r)} 24Z" fill="${liquid}"/>`
    + `<ellipse cx="32" cy="24" rx="${round((r - l) / 2)}" ry="2.6" fill="${top}"/>` + extra
    + `<path d="M16 10L21 58H43L48 10" fill="none" ${line()}/><ellipse cx="32" cy="10" rx="16" ry="3" fill="#fbfdfe" fill-opacity=".6" ${line()}/>`
    + `<path d="M21 16l3 36" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>`;
}

function spiral(cx: number, cy: number, turns: number, step: number) {
  const points: string[] = [];
  for (let t = 0.6; t <= turns * Math.PI * 2; t += 0.3) points.push(`${round(cx + Math.cos(t) * step * t)} ${round(cy + Math.sin(t) * step * t)}`);
  return `M${points.join("L")}`;
}

export const art: Record<ItemId, string> = {
  khejur: shadow(32, 34, 22, 20)
    + [[22, 34, -25], [41, 28, 22], [37, 46, 78]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="9.5" ry="15" fill="#6d2a10" ${line()} transform="rotate(${a} ${x} ${y})"/>`
      + `<path d="M${x - 3} ${y - 7}q3 6 0 13M${x + 2} ${y - 9}q2 4 1 8" stroke="#3a1405" stroke-width="1.1" fill="none" transform="rotate(${a} ${x} ${y})"/>` + glint(x - 3, y - 6, 3, 1.4, 0.45)).join(""),
  pani: glass("#cfeaf6", "#e6f5fb"),
  sharbat: glass("#d0203f", "#ee5a72", specks(5, 9, 32, 44, 7, 10, ["#3a0c14"], 0.9) + `<circle cx="27" cy="36" r="1.6" fill="#fff" opacity=".6"/><circle cx="36" cy="46" r="1.2" fill="#fff" opacity=".5"/>`),
  lebu: glass("#efe7a6", "#f8f2c8", `<circle cx="44" cy="12" r="8" fill="#f5e04a" ${line(1.3)}/><circle cx="44" cy="12" r="5.6" fill="#fbf1a0"/><path d="M44 6.5v11M38.5 12h11M40 8l8 8M48 8l-8 8" stroke="#e8cf3a" stroke-width="1"/>` + leaf(26, 20, -20)),
  chola: shadow(32, 34, 24, 20)
    + `<path d="M9 36C7 23 21 13 33 14C48 15 58 25 55 39C53 50 40 55 30 54C18 53 10 47 9 36Z" fill="#b8742c" ${line()}/>`
    + [[20, 30], [28, 23], [37, 21], [45, 27], [24, 39], [33, 32], [42, 37], [50, 39], [17, 43], [29, 46], [38, 47], [46, 47]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.3" fill="#e9c27a" stroke="${INK}" stroke-width=".9"/><circle cx="${x + 1.4}" cy="${y - 1.2}" r="1" fill="#c9974a"/>`).join("")
    + onion(30, 37, 20) + onion(14, 34, -40) + chili(34, 26, 30) + chili(40, 43, -20) + leaf(23, 47, 10) + leaf(47, 32, -50),
  peyaju: shadow(32, 34, 24, 20)
    + [[22, 26, 13, 0], [42, 29, 13, 40], [30, 44, 13.5, 80]].map(([x, y, r, a]) => fried(x, y, r, r * 0.92, "#c47426", a, 8)
      + `<ellipse cx="${x - 1}" cy="${y - 1}" rx="${r * 0.62}" ry="${r * 0.5}" fill="#dc9640" opacity=".9"/>` + specks(x * 3 + y, 7, x, y, r * 0.6, r * 0.55, ["#7a3a10", "#2f7d32", "#8f2b4d"], 1.1)).join(""),
  beguni: shadow(32, 34, 26, 18)
    + [[30, 25, -18], [33, 42, 12]].map(([x, y, a]) => fried(x, y, 24, 9.5, "#e0a03e", a, 11)
      + `<path d="M${x - 19} ${y + 4}q19 7 38 0" stroke="#4d2356" stroke-width="2.6" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`
      + `<ellipse cx="${x}" cy="${y - 2}" rx="15" ry="4" fill="#efc06a" opacity=".85" transform="rotate(${a} ${x} ${y})"/>`).join(""),
  "alur-chop": shadow(32, 34, 24, 20)
    + [[23, 29, 14], [41, 38, 14]].map(([x, y, r]) => fried(x, y, r, r * 0.86, "#c9852f", x, 12) + specks(x + y, 14, x, y, r * 0.75, r * 0.65, ["#f2c97c", "#a2621f"], 1.2)).join(""),
  somucha: shadow(32, 34, 24, 20)
    + [["M10 44L26 12L42 44Z", 26, 34], ["M28 52L36 20L56 46Z", 40, 40]].map(([d, x, y]) => `<path d="${d}" fill="#dea24a" ${line()}/>` + specks(Number(x) * 7, 8, Number(x), Number(y), 7, 6, ["#f3cf86", "#b97a2c"], 1.3)).join("")
    + `<path d="M12 41l-1 2M17 44l0 2M23 44l0 2M29 44l0 2M35 44l0 2" stroke="${INK}" stroke-width="1"/>`,
  muri: shadow(32, 34, 26, 22)
    + `<path d="M6 36C5 21 19 10 33 11C49 12 60 23 58 37C56 50 43 57 31 56C17 55 7 49 6 36Z" fill="#ead9ad" ${line()}/>`
    + scatter(11, 46, 32, 34, 22, 18).map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3.2" ry="1.7" fill="#fbf4de" stroke="#c4a671" stroke-width=".5" transform="rotate(${a} ${x} ${y})"/>`).join("")
    + specks(23, 10, 32, 34, 18, 15, ["#a5652a", "#d9a441"], 1.5) + onion(20, 28, 10) + onion(38, 44, -30) + chili(36, 22, 40) + chili(15, 40, -10) + leaf(44, 30, 30),
  jilapi: shadow(32, 34, 24, 20)
    + [[24, 30, 2.6, 1.05], [40, 38, 2.4, 1.1]].map(([x, y, turns, step]) => {
      const d = spiral(x, y, turns, step);
      return `<path d="${d}" fill="none" stroke="#7d3306" stroke-width="7.6" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#f2861d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#ffd27a" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`;
    }).join(""),
  bundia: shadow(32, 34, 24, 20)
    + `<path d="M9 37C8 24 20 14 33 14C47 15 57 25 55 38C53 50 41 55 31 54C19 53 10 48 9 37Z" fill="#e9861a" ${line()}/>`
    + scatter(31, 60, 32, 34, 20, 17).map(([x, y], index) => `<circle cx="${x}" cy="${y}" r="2.5" fill="${["#f7b733", "#f0841a", "#ffd04d"][index % 3]}" stroke="#a5520c" stroke-width=".4"/>`).join(""),
  haleem: bowl("#8a4a22", `<path d="M17 30q7-6 14 0t14 0M19 39q6-5 12 0t12 0" stroke="#a9632f" stroke-width="2" fill="none" stroke-linecap="round"/>`
    + scatter(41, 9, 32, 32, 13, 13).map(([x, y, a]) => `<path d="M${x} ${y}q3-3 6 0" stroke="#4a2008" stroke-width="1.8" fill="none" stroke-linecap="round" transform="rotate(${a} ${x} ${y})"/>`).join("")
    + `<path d="M24 22l5 3M35 40l5-2M27 41l4 2" stroke="#f1d27a" stroke-width="1.6" stroke-linecap="round"/>`
    + `<path d="M38 20a8 8 0 0 1 11 9l-11-9z" fill="#f4d23f" ${line(1.1)}/>` + leaf(22, 34, -20) + leaf(33, 26, 40)),
  "doi-chira": bowl("#fbfaf3", scatter(51, 16, 32, 32, 15, 15).map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.8" fill="#eadbb6" stroke="#c4ad7f" stroke-width=".5" transform="rotate(${a} ${x} ${y})"/>`).join("")
    + [[25, 26], [38, 29], [30, 39]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.8" fill="#f6e7a6" stroke="#cdb766" stroke-width=".8"/>` + specks(x + y, 3, x, y, 1.6, 1.6, ["#9b8240"], 0.6)).join("")
    + `<path d="M18 36q6 4 12 1" stroke="#a65b1f" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`, "#c9814f", "#f0c09a"),
  "doi-bora": bowl("#fbf8ef", [[25, 27], [39, 28], [31, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.4" fill="#e6c27e" stroke="#b98a3e" stroke-width=".9"/><ellipse cx="${x - 1}" cy="${y - 2}" rx="4.5" ry="2.6" fill="#fbf8ef" opacity=".85"/>`).join("")
    + `<path d="M18 31q7 3 13-1t13 2M22 42q5-3 10 0" stroke="#7a3a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>`
    + specks(61, 18, 32, 32, 15, 15, ["#c0361b", "#a8401f"], 0.9) + leaf(35, 36, 20)),
  kabab: shadow(32, 34, 24, 20)
    + [[22, 26, 11], [42, 28, 11], [31, 44, 11]].map(([x, y, r]) => fried(x, y, r, r * 0.9, "#7a3a18", x * 2, 7) + specks(x * 5, 6, x, y, r * 0.6, r * 0.55, ["#4a1e08", "#9c5528"], 1.3)).join("")
    + `<ellipse cx="47" cy="45" rx="6" ry="4" fill="none" stroke="#a8325a" stroke-width="1.6"/><ellipse cx="47" cy="45" rx="3.4" ry="2.2" fill="none" stroke="#e9c3d2" stroke-width="1.2"/>` + chili(10, 40, -30),
  fol: shadow(32, 36, 24, 18)
    + `<path d="M8 22L44 14Q50 40 26 52Z" fill="#2f7d32" ${line()}/><path d="M11 23L42 16Q46 38 26 48Z" fill="#d9efc0"/><path d="M14 24L40 18Q43 36 26 45Z" fill="#e5414f"/>`
    + [[24, 26], [32, 25], [28, 33], [35, 31], [29, 39]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1" ry="1.8" fill="#1d1d1d"/>`).join("")
    + [[48, 38], [53, 48], [42, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.6" fill="#f7eab0" ${line(1.1)}/>` + specks(x * y, 3, x, y, 2, 2, ["#9b8240"], 0.6)).join(""),
};

const STEEL = `<defs><radialGradient id="ip-steel" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fbfcfc"/><stop offset=".55" stop-color="#dfe4e8"/><stop offset="1" stop-color="#aab3ba"/></radialGradient>`
  + `<radialGradient id="ip-well" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#f7f8f9"/><stop offset=".7" stop-color="#e3e7ea"/><stop offset="1" stop-color="#c6cdd3"/></radialGradient></defs>`;

/** The steel thala, seen from above, with its shadow on the cloth. */
export const plateBase = () => {
  const { cx, cy, rim, well } = SCENE;
  return STEEL
    + `<ellipse cx="${cx + 8}" cy="${cy + 12}" rx="${rim}" ry="${rim - 2}" fill="#06231a" opacity=".35"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${rim}" fill="url(#ip-steel)" stroke="#8c969e" stroke-width="2"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${rim - 6}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity=".7"/>`
    + `<circle cx="${cx}" cy="${cy}" r="${well}" fill="url(#ip-well)" stroke="#9aa4ac" stroke-width="2"/>`
    + `<path d="M${cx - well + 18} ${cy - 40}A${well - 14} ${well - 14} 0 0 1 ${cx - 30} ${cy - well + 16}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M${cx + rim - 20} ${cy + 50}A${rim - 12} ${rim - 12} 0 0 1 ${cx + 40} ${cy + rim - 16}" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>`;
};

export const spotTransform = (spot: { x: number; y: number; size: number }) => `translate(${round(spot.x - spot.size / 2)} ${round(spot.y - spot.size / 2)}) scale(${round(spot.size / 64 * 1000) / 1000})`;

/** The whole plate as one standalone SVG, for drawing onto the card canvas. */
export function sceneSvg(picks: readonly ItemId[], width: number) {
  const height = Math.round(width * SCENE.height / SCENE.width);
  const food = layoutPlate(picks).map(spot => `<g transform="${spotTransform(spot)}">${art[spot.id]}</g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SCENE.width} ${SCENE.height}" width="${width}" height="${height}">${plateBase()}${food}</svg>`;
}

export const itemSvg = (id: ItemId) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${art[id]}</svg>`;
