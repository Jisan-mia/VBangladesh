// The rules, with no React: six trips, what each visit shows, the stamp question, the quiet difficulty steps, stars,
// and the map maths (which part of the world a trip shows, and the curved flight line from Dhaka).
import { starsFor } from "../../../shared/game-core";
import { FLAGS, WORLD, project } from "./art";
import { COUNTRIES, DHAKA, TRIPS, countryOf, type Country, type Kind } from "./countries";

/** Base number of pictures in the stamp question, per trip: three to start, four for the far trips. */
export const LEVELS: readonly { level: number; choices: number }[] = [3, 3, 3, 4, 4, 4].map((choices, index) => ({ level: index + 1, choices }));
export const LEVEL_COUNT = TRIPS.length;
export const levelOf = (level: number) => LEVELS[Math.max(0, Math.min(LEVEL_COUNT, Math.round(level) || 1) - 1)];
export const tripOf = (level: number) => TRIPS[levelOf(level).level - 1];
export const tripCountries = (level: number) => tripOf(level).ids.map(id => countryOf(id)!);

/** What a visit shows, one postcard at a time. */
export const CARDS = ["hello", "food", "place", "animal", "like"] as const;
export type Card = (typeof CARDS)[number];

export function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pictures to offer: the trip's number; one fewer after three misses in a row (quietly easier, never under 2),
 * one more after five right in a row (never over 4). A "miss" is a question not answered on the first tap.
 */
export function choiceCount(base: number, missRun: number, rightRun: number) {
  const wanted = missRun >= 3 ? base - 1 : rightRun >= 5 ? base + 1 : base;
  return Math.max(2, Math.min(4, wanted));
}

export const hasFlag = (country: Country) => !!FLAGS[country.id];

/** The right country plus `count − 1` others; for a flag question, only countries whose flag we draw. */
export function choicesFor(target: Country, count: number, rng: () => number): Country[] {
  const pool = COUNTRIES.filter(country => country.id !== target.id && (target.ask !== "flag" || hasFlag(country)));
  return shuffle([target, ...shuffle(pool, rng).slice(0, count - 1)], rng);
}

/** "জাপানি ভাষায় হ্যালো", "মালয় ভাষায় শুভ সকাল". */
export const helloLine = (country: Country) => `${country.hello.language} ভাষায় ${country.hello.means ?? "হ্যালো"}`;

/** "ভারতে", "কানাডায়", "ইতালিতে": the country as a place. */
export function inside(name: string) {
  const last = name.at(-1);
  return name + (last === "া" ? "য়" : last === "ি" || last === "ী" ? "তে" : "ে");
}
/** "ভারতের", "কানাডার", "ইতালির". */
export function of(name: string) {
  const last = name.at(-1);
  return name + (last === "া" || last === "ি" || last === "ী" ? "র" : "ের");
}

/** The stamp question, as the child reads it (or hears it). */
export function questionOf(country: Country) {
  const asks: Record<Kind, string> = {
    food: `${inside(country.name)} কোন খাবারটা দেখলে?`,
    place: `${inside(country.name)} কোন জায়গাটা দেখলে?`,
    animal: `${inside(country.name)} কোন প্রাণীটা দেখলে?`,
    flag: `কোনটা ${of(country.name)} পতাকা?`,
  };
  return asks[country.ask];
}

/** After a wrong tap: what that picture really was, so a mistake teaches something. */
export function whyLine(picked: Country, kind: Kind) {
  if (kind === "flag") return `এটা ${of(picked.name)} পতাকা। আরেকবার ভাবো।`;
  const item = kind === "food" ? picked.food : kind === "place" ? picked.place : picked.animal;
  // "চীনের মহাপ্রাচীর" already names its country.
  const name = item.name.startsWith(of(picked.name)) ? item.name : `${of(picked.name)} ${item.name}`;
  return `এটা ${name}। আরেকবার ভাবো।`;
}

/** Stars are a record only: 3 for all three stamps on the first tap, 2 for two, 1 for finishing the trip. */
export const starsOf = (firstTry: number) => starsFor(firstTry, 3, 2);

export const cardTitle = (count: number, bn: (n: number) => string) => `আজ ${bn(count)}টা দেশ ঘুরলাম`;

/** The fixed result behind `#og`, for the site's preview image only: it saves nothing and skips the daily limit. */
export const OG_DEMO = { level: 3, stars: 3 };
export const isOgHash = (hash: string) => hash === "#og";

// ---- map maths ----
export type View = { x: number; y: number; w: number; h: number };
export const ASPECT = 1.6;

/** The part of the world a trip shows: Dhaka and its three countries, padded, 16:10, kept inside the map. */
export function tripView(level: number): View {
  const points = [DHAKA, ...tripCountries(level)].map(point => project(point.lon, point.lat));
  const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
  const pad = 9;
  let w = Math.max(...xs) - Math.min(...xs) + pad * 2, h = Math.max(...ys) - Math.min(...ys) + pad * 2;
  w = Math.max(w, h * ASPECT, 44); h = w / ASPECT;
  if (h > WORLD.height) { h = WORLD.height; w = h * ASPECT; }
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const x = Math.max(0, Math.min(WORLD.width - w, cx - w / 2)), y = Math.max(0, Math.min(WORLD.height - h, cy - h / 2));
  return { x, y, w, h };
}

/** A curved flight from Dhaka: a quadratic curve that bows north (up on the map). */
export function flightOf(country: Country) {
  const [ax, ay] = project(DHAKA.lon, DHAKA.lat), [bx, by] = project(country.lon, country.lat);
  const length = Math.hypot(bx - ax, by - ay);
  return { ax, ay, bx, by, cx: (ax + bx) / 2, cy: Math.min(ay, by) - length * 0.28, length };
}
export type Flight = ReturnType<typeof flightOf>;

export function pointAt(f: Flight, t: number) {
  const u = 1 - t;
  return { x: u * u * f.ax + 2 * u * t * f.cx + t * t * f.bx, y: u * u * f.ay + 2 * u * t * f.cy + t * t * f.by };
}
/** The plane's heading in degrees at t. */
export function angleAt(f: Flight, t: number) {
  const dx = 2 * (1 - t) * (f.cx - f.ax) + 2 * t * (f.bx - f.cx), dy = 2 * (1 - t) * (f.cy - f.ay) + 2 * t * (f.by - f.cy);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}
/** Evenly placed dots along the flight for the dotted line, spaced for the trip's zoom. */
export const dotCount = (f: Flight, view: View) => Math.max(6, Math.round(f.length / (view.w / 34)));
