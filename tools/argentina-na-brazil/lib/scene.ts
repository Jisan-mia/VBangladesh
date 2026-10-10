// The dusk rooftop scene as one SVG string: shown live on the page and drawn into the canvas card, so both always match.
// It holds no text (Bangla is drawn by the canvas, where the browser shapes it).
import type { TeamId } from "./roof";

export type SceneHouse = { team: TeamId | null };
export type SceneOptions = { width: number; height: number; ground: number; poleTop: number; houses: SceneHouse[]; id: string };
export type HouseSpot = { cx: number; scale: number; wallTop: number; wallWidth: number; flagX: number; flagWidth: number };

const WALL_W = 430, WALL_H = 210, ROOF_H = 118, FLAG_W = 300;
const wallTints = ["#3f8c86", "#b85a3b"];

/** Where each house stands; the canvas uses it to hang name plates on the walls. */
export function houseSpots(width: number, ground: number, count: number): HouseSpot[] {
  const scale = count > 1 ? 0.8 : 1;
  const centres = count > 1 ? [width * 0.27, width * 0.73] : [width * 0.5];
  return centres.map(cx => {
    const wallWidth = WALL_W * scale;
    const flagX = cx - wallWidth * 0.2;
    return { cx, scale, wallTop: ground - WALL_H * scale, wallWidth, flagX, flagWidth: FLAG_W * scale };
  });
}

const r = (n: number) => Math.round(n * 10) / 10;

function flagArt(team: TeamId, w: number, h: number) {
  switch (team) {
    case "arg": return `<rect width="${w}" height="${h}" fill="#74acdf"/><rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#fff"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.11}" fill="#f6b40e" stroke="#85340a" stroke-width="${h * 0.01}"/>`;
    case "bra": return `<rect width="${w}" height="${h}" fill="#009c3b"/><path d="M${w * 0.08} ${h / 2}L${w / 2} ${h * 0.1}L${w * 0.92} ${h / 2}L${w / 2} ${h * 0.9}Z" fill="#ffdf00"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.25}" fill="#002776"/><path d="M${w / 2 - h * 0.25} ${h * 0.47}Q${w / 2} ${h * 0.4} ${w / 2 + h * 0.25} ${h * 0.55}" stroke="#fff" stroke-width="${h * 0.045}" fill="none"/>`;
    case "esp": return `<rect width="${w}" height="${h}" fill="#c60b1e"/><rect y="${h / 4}" width="${w}" height="${h / 2}" fill="#ffc400"/>`;
    case "ger": return `<rect width="${w}" height="${h / 3}" fill="#000"/><rect y="${h / 3}" width="${w}" height="${h / 3}" fill="#dd0000"/><rect y="${(h * 2) / 3}" width="${w}" height="${h / 3 + 1}" fill="#ffce00"/>`;
    case "por": return `<rect width="${w}" height="${h}" fill="#da291c"/><rect width="${w * 0.4}" height="${h}" fill="#046a38"/><circle cx="${w * 0.4}" cy="${h / 2}" r="${h * 0.17}" fill="none" stroke="#ffe000" stroke-width="${h * 0.05}"/>`;
    case "fra": return `<rect width="${w}" height="${h}" fill="#fff"/><rect width="${w / 3}" height="${h}" fill="#002654"/><rect x="${(w * 2) / 3}" width="${w / 3}" height="${h}" fill="#ed2939"/>`;
    case "eng": return `<rect width="${w}" height="${h}" fill="#fff"/><rect x="${w / 2 - h * 0.1}" width="${h * 0.2}" height="${h}" fill="#ce1124"/><rect y="${h * 0.4}" width="${w}" height="${h * 0.2}" fill="#ce1124"/>`;
  }
}

/** A waving cloth: straight at the pole, a soft sine along the fly, with fold shading on top. */
function flag(team: TeamId, x: number, y: number, w: number, id: string) {
  const h = w * 0.64, amp = w * 0.045;
  const edge = (y0: number) => Array.from({ length: 9 }, (_, i) => { const px = (w * i) / 8; return `${r(px)} ${r(y0 + Math.sin((i / 8) * Math.PI * 1.6) * amp * (i / 8))}`; });
  const top = edge(0), bottom = edge(h).reverse();
  const outline = `M${top.join("L")}L${bottom.join("L")}Z`;
  return `<g class="abn-rise" transform="translate(${r(x)} ${r(y)})"><g class="abn-wave">
<clipPath id="${id}-cloth"><path d="${outline}"/></clipPath>
<g clip-path="url(#${id}-cloth)"><g transform="translate(0 ${r(-amp)})">${flagArt(team, w, h + amp * 3)}</g><rect y="${r(-amp)}" width="${w}" height="${r(h + amp * 3)}" fill="url(#${id}-fold)"/></g>
<path d="${outline}" fill="none" stroke="#0b1530" stroke-opacity=".35" stroke-width="2"/>
</g></g>`;
}

function house(spot: HouseSpot, ground: number, poleTop: number, team: TeamId | null, index: number, id: string) {
  const { cx, scale: s, wallTop, wallWidth: w } = spot;
  const x0 = cx - w / 2, ridge = wallTop - ROOF_H * s, over = 38 * s;
  const roof = `M${r(x0 - over)} ${r(wallTop)}L${r(x0 + w + over)} ${r(wallTop)}L${r(cx + w * 0.32)} ${r(ridge)}L${r(cx - w * 0.32)} ${r(ridge)}Z`;
  // corrugated tin: lines fan from the eave to the ridge
  const ribs = Array.from({ length: 15 }, (_, i) => { const t = (i + 0.5) / 15; return `M${r(x0 - over + (w + over * 2) * t)} ${r(wallTop)}L${r(cx - w * 0.32 + w * 0.64 * t)} ${r(ridge)}`; }).join("");
  const wallRibs = Array.from({ length: 22 }, (_, i) => `M${r(x0 + (w * (i + 0.5)) / 22)} ${r(wallTop)}V${ground}`).join("");
  const door = { x: cx + w * 0.08, w: w * 0.2, h: WALL_H * s * 0.72 };
  const win = { x: cx - w * 0.36, y: wallTop + WALL_H * s * 0.22, w: w * 0.26, h: WALL_H * s * 0.4 };
  const bars = Array.from({ length: 4 }, (_, i) => `M${r(win.x + (win.w * (i + 1)) / 5)} ${r(win.y)}v${r(win.h)}`).join("");
  const poleX = spot.flagX, poleW = 11 * s;
  const nodes = Array.from({ length: Math.floor((ridge - poleTop) / (70 * s)) }, (_, i) => `M${r(poleX - poleW / 2)} ${r(ridge - 40 * s - i * 70 * s)}h${r(poleW)}`).join("");
  return `<g>
<rect x="${r(x0)}" y="${r(wallTop)}" width="${r(w)}" height="${r(ground - wallTop)}" fill="${wallTints[index % 2]}"/>
<path d="${wallRibs}" stroke="#000" stroke-opacity=".12" stroke-width="${r(3 * s)}"/>
<rect x="${r(x0)}" y="${r(wallTop)}" width="${r(w)}" height="${r(ground - wallTop)}" fill="url(#${id}-dusk)"/>
<rect x="${r(door.x)}" y="${r(ground - door.h)}" width="${r(door.w)}" height="${r(door.h)}" fill="#5a3320"/><path d="M${r(door.x + door.w / 2)} ${r(ground - door.h)}V${ground}" stroke="#2e190e" stroke-width="${r(3 * s)}"/>
<rect x="${r(win.x)}" y="${r(win.y)}" width="${r(win.w)}" height="${r(win.h)}" fill="#ffcf6e"/><path d="${bars}" stroke="#2e190e" stroke-width="${r(4 * s)}"/><rect x="${r(win.x)}" y="${r(win.y)}" width="${r(win.w)}" height="${r(win.h)}" fill="none" stroke="#2e190e" stroke-width="${r(5 * s)}"/>
<rect x="${r(poleX - poleW / 2)}" y="${r(poleTop - 8 * s)}" width="${r(poleW)}" height="${r(ridge - poleTop + 30 * s)}" rx="${r(poleW / 2)}" fill="#c9a259"/><path d="${nodes}" stroke="#8a6a2f" stroke-width="${r(3 * s)}"/>
<path d="${roof}" fill="#9aa6b2"/><path d="${ribs}" stroke="#5f6b78" stroke-width="${r(3 * s)}"/>
<path d="${roof}" fill="url(#${id}-dusk)"/>
<path d="M${r(x0 - over)} ${r(wallTop)}H${r(x0 + w + over)}" stroke="#4a545f" stroke-width="${r(6 * s)}"/>
${team ? flag(team, poleX + poleW / 2 - 2, poleTop, spot.flagWidth, `${id}-f${index}`) : `<path d="M${r(poleX + poleW / 2)} ${r(poleTop)}q${r(14 * s)} ${r(40 * s)} 0 ${r(80 * s)}" stroke="#f1e6cf" stroke-width="${r(2.5 * s)}" fill="none"/>`}
</g>`;
}

// Distant rooftops along the horizon; a few carry tiny flags, so it's a whole neighbourhood, not one house.
function skyline(width: number, horizon: number) {
  const tiny = ["#74acdf", "#ffdf00", "#74acdf", "#009c3b", "#ffffff", "#74acdf", "#ffdf00"];
  let x = -20, i = 0, shapes = "", flags = "";
  while (x < width) {
    const w = 90 + ((i * 37) % 70), h = 50 + ((i * 53) % 90);
    shapes += `M${x} ${horizon}V${horizon - h}h${w}V${horizon}Z`;
    if (i % 2 === 0) { const px = x + w * 0.7, top = horizon - h - 52; flags += `<path d="M${px} ${horizon - h}V${top}" stroke="#141a33" stroke-width="3"/><rect x="${px}" y="${top}" width="30" height="19" fill="${tiny[i % tiny.length]}" opacity=".9"/>`; }
    x += w + 6; i++;
  }
  return `<path d="${shapes}" fill="#1c2546"/>${flags}`;
}

export function sceneSvg({ width, height, ground, poleTop, houses, id }: SceneOptions) {
  const spots = houseSpots(width, ground, houses.length);
  const horizon = ground - 60;
  // Power lines hang low behind the roofs, well away from the flags.
  const wire = (y: number) => `M-10 ${y}Q${width / 2} ${y + 60} ${width + 10} ${y - 10}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
<defs>
<linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101d42"/><stop offset=".5" stop-color="#2c4a80"/><stop offset=".82" stop-color="#d9814c"/><stop offset="1" stop-color="#f5bb62"/></linearGradient>
<linearGradient id="${id}-dusk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b1530" stop-opacity=".05"/><stop offset="1" stop-color="#0b1530" stop-opacity=".38"/></linearGradient>
<linearGradient id="${id}-fold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".22" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#000" stop-opacity=".14"/><stop offset=".7" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>
<radialGradient id="${id}-sun"><stop offset="0" stop-color="#ffe2a0"/><stop offset=".45" stop-color="#ffc56b" stop-opacity=".9"/><stop offset="1" stop-color="#ffc56b" stop-opacity="0"/></radialGradient>
</defs>
<rect width="${width}" height="${height}" fill="url(#${id}-sky)"/>
<circle cx="${width * 0.82}" cy="${horizon - 10}" r="150" fill="url(#${id}-sun)"/><circle cx="${width * 0.82}" cy="${horizon - 10}" r="46" fill="#ffe7b0"/>
${skyline(width, horizon)}
<path d="M${width * 0.06} ${ground}V${horizon - 230}M${width * 0.06 - 40} ${horizon - 212}h80" stroke="#141a33" stroke-width="10"/>
<path d="${wire(horizon - 212)}${wire(horizon - 190)}" stroke="#141a33" stroke-width="3" fill="none"/>
<rect y="${horizon}" width="${width}" height="${height - horizon}" fill="#22351f"/>
<path d="M0 ${horizon + 8}H${width}" stroke="#2f4a2a" stroke-width="16"/>
${houses.map((h, i) => house(spots[i], ground, poleTop, h.team, i, id)).join("")}
</svg>`;
}
