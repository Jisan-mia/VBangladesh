// The map maths, with no React: which part of the world a trip shows, the curved flight from Dhaka, and the plane's
// frames along it. The plane's frames are made once per flight, so no frame of the flight runs any of our code.
import { WORLD, project } from "./art";
import { DHAKA, countryOf } from "./countries";

export type View = { x: number; y: number; w: number; h: number };
export const ASPECT = 1.6;

/** The part of the world a trip shows: Dhaka and its countries, padded, 16:10, kept inside the map. */
export function viewOf(ids: readonly string[]): View {
  const points = [DHAKA, ...ids.map(id => countryOf(id)!)].map(point => project(point.lon, point.lat));
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
export function flightOf(id: string) {
  const country = countryOf(id)!;
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
export const routePath = (f: Flight) => `M${f.ax.toFixed(2)} ${f.ay.toFixed(2)}Q${f.cx.toFixed(2)} ${f.cy.toFixed(2)} ${f.bx.toFixed(2)} ${f.by.toFixed(2)}`;

/** A flight's length in ms: short hops are quick, the ocean takes a little longer, never over 1.8 s (a child flies it many times a day). */
export const flightMs = (f: Flight) => Math.round(Math.max(1100, Math.min(1800, 900 + f.length * 8)));

/** Plane and trail frames along the flight, eased in and out. `scale` is the plane's size in map units. */
export const FRAME_COUNT = 36;
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
export function planeFrames(f: Flight, scale: number) {
  return Array.from({ length: FRAME_COUNT + 1 }, (_, i) => {
    const k = i / FRAME_COUNT, t = ease(k), p = pointAt(f, t);
    return { offset: k, transform: `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${angleAt(f, Math.min(t, 0.999)).toFixed(1)}deg) scale(${scale})`, reveal: 1 - t };
  });
}
