import { groups, type GroupId } from "./van";

// The rickshaw-van, side view, as one SVG string: the page shows it inline and the card draws it as an image.
// Only numbers from groupLevels() go in, never user text.
export const VIEW = { width: 360, height: 216 } as const;
/** Where the painted words sit on the side board, in SVG units, so the card can letter them with the page font. */
export const BOARD_TEXT = { x: 133, y: 171.5, size: 10, text: "মায়ের দোয়া" } as const;

const INK = "#22314f";
const line = `stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"`;
const W = 40, H = 15, STEP = 14, BED_TOP = 150, LOAD_LEFT = 20, LOAD_WIDTH = 226;
// Tallest stack in the middle, the next ones either side, so any mix of picks reads as one heap.
const SLOTS = [2, 1, 3, 0, 4];

type Shape = (x: number, y: number) => string;

const outline = (x: number, y: number, radius: number) => `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="${radius}" fill="none" ${line}/>`;

/** One parcel per bought item; each group has its own kind, like a real loaded van. */
export const parcels: Record<GroupId, Shape> = {
  // a brass ডেকচি with its lid
  khawa: (x, y) => `<path d="M${x + 3} ${y + 4}h${W - 6}v${H - 9}q0 5-5 5H${x + 8}q-5 0-5-5Z" fill="#e39a32" ${line}/>`
    + `<path d="M${x} ${y + 7}h3M${x + W - 3} ${y + 7}h3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`
    + `<ellipse cx="${x + W / 2}" cy="${y + 3.5}" rx="${W / 2 - 4}" ry="2.6" fill="#f6c85c" ${line}/>`
    + `<circle cx="${x + W / 2}" cy="${y + 0.8}" r="1.8" fill="${INK}"/>`,
  // a taped cardboard carton
  shokh: (x, y) => `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="1.5" fill="#c99560"/>`
    + `<rect x="${x + W / 2 - 4}" y="${y}" width="8" height="${H}" fill="#ecd09c"/>`
    + `<path d="M${x + 4} ${y + H - 4}h7" stroke="#7a4f27" stroke-width="1.2" stroke-linecap="round"/>` + outline(x, y, 1.5),
  // a red suitcase with straps and handle
  ghora: (x, y) => `<path d="M${x + W / 2 - 6} ${y + 1}v-3.5h12v3.5" fill="none" stroke="${INK}" stroke-width="1.8"/>`
    + `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="3" fill="#d9483f"/>`
    + `<rect x="${x + 8}" y="${y}" width="3.5" height="${H}" fill="#9d2c25"/><rect x="${x + W - 11.5}" y="${y}" width="3.5" height="${H}" fill="#9d2c25"/>` + outline(x, y, 3),
  // a gift box with a yellow ribbon
  poribar: (x, y) => `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="1.5" fill="#e2558f"/>`
    + `<rect x="${x + W / 2 - 2.5}" y="${y}" width="5" height="${H}" fill="#ffd34d"/><rect x="${x}" y="${y + H / 2 - 1.5}" width="${W}" height="3" fill="#ffd34d"/>`
    + outline(x, y, 1.5)
    + `<path d="M${x + W / 2} ${y}c-4-5-9-2-6 0.5zM${x + W / 2} ${y}c4-5 9-2 6 0.5z" fill="#ffd34d" ${line}/>`,
  // a rolled blanket tied with rope
  sobar: (x, y) => `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="7" fill="#2f9463"/>`
    + `<path d="M${x + 7} ${y + 3.5}h${W - 14}M${x + 7} ${y + H - 3.5}h${W - 14}" stroke="#bfe7cf" stroke-width="1.2"/>`
    + `<rect x="${x + 10}" y="${y}" width="2.6" height="${H}" fill="#f3e3b3"/><rect x="${x + W - 12.6}" y="${y}" width="2.6" height="${H}" fill="#f3e3b3"/>` + outline(x, y, 7),
};

/** A small picture of a group's parcel, for the group buttons. */
export const parcelIcon = (group: GroupId) => `<svg viewBox="-3 -6 46 23" aria-hidden="true">${parcels[group](0, 0)}</svg>`;

function wheel(cx: number) {
  const cy = 188;
  const spokes = Array.from({ length: 12 }, (_, index) => {
    const angle = (index * Math.PI) / 6;
    return `M${cx} ${cy}l${(Math.cos(angle) * 18).toFixed(1)} ${(Math.sin(angle) * 18).toFixed(1)}`;
  }).join("");
  return `<circle cx="${cx}" cy="${cy}" r="18" fill="#ffffff66" stroke="#9aa3b5" stroke-width="1"/>`
    + `<path d="${spokes}" stroke="#9aa3b5" stroke-width=".8"/>`
    + `<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="#262b36" stroke-width="5"/>`
    + `<circle cx="${cx}" cy="${cy}" r="3" fill="${INK}"/>`;
}

function flower(cx: number, cy: number) {
  const petals = [[0, -3], [3, 0], [0, 3], [-3, 0]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${cy + dy}" r="2.4" fill="#ffd34d"/>`).join("");
  return petals + `<circle cx="${cx}" cy="${cy}" r="1.7" fill="#e0393e"/>`;
}

/**
 * The van with one stack per group; `levels` is how many different items of each group are bought (0–8).
 * `fresh` marks the group whose top parcel just landed, so the page can animate only that one.
 * `crop` trims the empty sky above the load: in a fixed-height box the van then zooms out as the heap grows,
 * instead of pushing the list down under a finger.
 */
export function vanSvg(levels: readonly number[], { paint = true, fresh = -1, crop = false }: { paint?: boolean; fresh?: number; crop?: boolean } = {}) {
  const ranked = groups.map((group, index) => ({ group: group.id, index, level: Math.min(8, Math.max(0, levels[index] ?? 0)) }))
    .sort((a, b) => b.level - a.level || a.index - b.index);
  const column = LOAD_WIDTH / groups.length;
  let load = "";
  ranked.forEach(({ group, index, level }, rank) => {
    const slot = SLOTS[rank];
    for (let tier = 0; tier < level; tier++) {
      // A small, fixed wobble per tier so the heap looks hand-piled, never random between renders.
      const x = LOAD_LEFT + slot * column + (column - W) / 2 + (((tier * 5 + slot * 3) % 5) - 2);
      const y = BED_TOP - H - tier * STEP;
      const parcel = parcels[group](x, y);
      load += index === fresh && tier === level - 1 ? `<g class="ek-drop">${parcel}</g>` : parcel;
    }
  });
  if (!load) load = `<rect x="26" y="104" width="214" height="40" rx="6" fill="none" stroke="${INK}55" stroke-width="1.4" stroke-dasharray="4 4"/>`;

  const body = `<ellipse cx="176" cy="211" rx="168" ry="4" fill="${INK}22"/>`
    + wheel(128) + wheel(318)
    + `<path d="M128 185L282 180M128 191L282 185" stroke="#5b6478" stroke-width="1" stroke-dasharray="2 2"/>`
    // chassis, wooden bed and the painted side board
    + `<rect x="36" y="176" width="200" height="5" fill="${INK}"/>`
    + `<rect x="14" y="${BED_TOP}" width="238" height="8" rx="1.5" fill="#a8743f" ${line}/>`
    + `<path d="M74 ${BED_TOP}v8M134 ${BED_TOP}v8M194 ${BED_TOP}v8" stroke="#7a4f27" stroke-width="1"/>`
    + `<rect x="14" y="158" width="238" height="19" fill="#1f5fbf" ${line}/>`
    + `<rect x="15" y="159" width="236" height="3" fill="#e0393e"/><rect x="15" y="173" width="236" height="3" fill="#ffd34d"/>`
    + flower(27, 167.5) + flower(239, 167.5)
    + (paint ? `<text x="${BOARD_TEXT.x}" y="${BOARD_TEXT.y}" text-anchor="middle" class="ek-paint" font-size="${BOARD_TEXT.size}" font-weight="700" fill="#ffffff">${BOARD_TEXT.text}</text>` : "")
    // frame, saddle, pedals and handlebar of the cycle in front
    + `<path d="M246 172L307 148M284 177L246 177M282 181L279 134M318 188L308 140" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    + `<circle cx="282" cy="182" r="5" fill="none" stroke="${INK}" stroke-width="2"/><path d="M282 182l6 7h5" stroke="${INK}" stroke-width="2" stroke-linecap="round" fill="none"/>`
    + `<path d="M267 133q4-6 17-5q8 1 8 4q-12 4-25 1Z" fill="#5a3420" ${line}/>`
    + `<path d="M308 140l-3-19M297 121q9-3 23-2" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    + `<path d="M316 119h8" stroke="#d9483f" stroke-width="4" stroke-linecap="round"/>`
    + `<circle cx="303" cy="125" r="2.6" fill="#ffd34d" stroke="${INK}" stroke-width="1"/>`;

  const tallest = Math.max(1, ...ranked.map(stack => stack.level));
  // 112 keeps the handlebar in view; 8 more leaves room for the top parcel's handle or bow.
  const top = crop ? Math.min(112, BED_TOP - H - (tallest - 1) * STEP - 8) : 0;
  const box = crop ? ` preserveAspectRatio="xMidYMax meet" width="100%" height="100%"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} ${VIEW.width} ${VIEW.height - top}"${box}>${body}${load}</svg>`;
}
