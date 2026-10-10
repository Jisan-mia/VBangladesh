// The mehendi hand as SVG path strings, shared by the page (inline SVG) and the card (Path2D), so both always match.
// Every motif is one fill path drawn with the even-odd rule (inner cut-outs make the lace look).
import type { ItemId } from "./eid";

type Point = [number, number];
type Finger = { base: Point; length: number; width: number; angle: number };

const f = (n: number) => Math.round(n * 10) / 10;
const pt = ([x, y]: Point) => `${f(x)} ${f(y)}`;

const fingers = {
  thumb: { base: [108, 290], length: 100, width: 40, angle: -52 },
  index: { base: [124, 205], length: 138, width: 34, angle: -10 },
  middle: { base: [159, 198], length: 158, width: 35, angle: -2 },
  ring: { base: [194, 203], length: 142, width: 34, angle: 6 },
  pinky: { base: [224, 222], length: 108, width: 30, angle: 15 },
} satisfies Record<string, Finger>;
type FingerId = keyof typeof fingers;

/** Finger-local point (x across, t up from the base) to hand coordinates. */
function at(finger: Finger, x: number, t: number): Point {
  const a = (finger.angle * Math.PI) / 180;
  return [finger.base[0] + x * Math.cos(a) + t * Math.sin(a), finger.base[1] + x * Math.sin(a) - t * Math.cos(a)];
}

function circle([x, y]: Point, r: number) {
  return `M${f(x - r)} ${f(y)}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0Z`;
}

function capsule(finger: Finger) {
  const h = finger.width / 2, L = finger.length;
  return `M${pt(at(finger, -h, 0))}L${pt(at(finger, -h, L))}A${h} ${h} 0 0 1 ${pt(at(finger, h, L))}L${pt(at(finger, h, 0))}A${h} ${h} 0 0 1 ${pt(at(finger, -h, 0))}Z`;
}

function tip(finger: Finger) {
  const h = finger.width / 2 - 3, L = finger.length, t0 = L - finger.width * 0.55;
  return `M${pt(at(finger, -h, t0))}L${pt(at(finger, -h, L))}A${h} ${h} 0 0 1 ${pt(at(finger, h, L))}L${pt(at(finger, h, t0))}Q${pt(at(finger, 0, t0 - 8))} ${pt(at(finger, -h, t0))}Z`;
}

function band(finger: Finger) {
  const h = finger.width / 2 - 3, t = finger.length * 0.6;
  const strip = (from: number, to: number) => `M${pt(at(finger, -h, from))}L${pt(at(finger, h, from))}L${pt(at(finger, h, to))}L${pt(at(finger, -h, to))}Z`;
  const dots = [-0.55, 0, 0.55].map(k => circle(at(finger, h * k, t), 2.6)).join("");
  return strip(t + 5, t + 8) + strip(t - 8, t - 5) + dots;
}

function leaf(finger: Finger) {
  const h = finger.width / 2 - 3, L = finger.length, t1 = L * 0.13, t2 = L * 0.43, tm = (t1 + t2) / 2;
  const shape = (inset: number, bulge: number) => `M${pt(at(finger, 0, t1 + inset))}Q${pt(at(finger, h * bulge, tm))} ${pt(at(finger, 0, t2 - inset))}Q${pt(at(finger, -h * bulge, tm))} ${pt(at(finger, 0, t1 + inset))}Z`;
  return shape(0, 1.05) + shape(6, 0.45);
}

const center: Point = [164, 268];
const petalAngles = [-90, -30, 30, 90, 150, 210];

function petal(index: number) {
  const a = (petalAngles[index] * Math.PI) / 180;
  const d: Point = [Math.cos(a), Math.sin(a)], p: Point = [-d[1], d[0]];
  const go = (r: number, s: number): Point => [center[0] + d[0] * r + p[0] * s, center[1] + d[1] * r + p[1] * s];
  const shape = (from: number, mid: number, to: number, side: number) => `M${pt(go(from, 0))}Q${pt(go(mid, side))} ${pt(go(to, 0))}Q${pt(go(mid, -side))} ${pt(go(from, 0))}Z`;
  return shape(25, 36, 54, 17) + shape(31, 38, 47, 7);
}

const centerFlower = circle(center, 13) + circle(center, 21) + circle(center, 17.5);

function paisley([x, y]: Point, mirror: 1 | -1) {
  const s = 14, X = (dx: number) => f(x + dx * s * mirror), Y = (dy: number) => f(y + dy * s);
  const outline = `M${X(0)} ${Y(1)}C${X(-1.1)} ${Y(1)} ${X(-1.1)} ${Y(-0.4)} ${X(-0.1)} ${Y(-0.7)}C${X(0.4)} ${Y(-0.9)} ${X(0.2)} ${Y(-1.6)} ${X(0.9)} ${Y(-1.5)}C${X(0.7)} ${Y(-1)} ${X(1.1)} ${Y(-0.5)} ${X(1)} ${Y(0.2)}C${X(0.9)} ${Y(0.8)} ${X(0.5)} ${Y(1)} ${X(0)} ${Y(1)}Z`;
  const eye: Point = [x + 0.05 * s * mirror, y + 0.2 * s];
  return outline + circle(eye, s * 0.4) + circle(eye, s * 0.16);
}

function wristBand() {
  const strip = (y: number) => `M110 ${y}H218V${y + 4}H110Z`;
  const dots = Array.from({ length: 8 }, (_, i) => circle([119 + i * 13, 372], 3.2)).join("");
  return strip(361) + strip(380) + dots;
}

const F = (id: FingerId) => fingers[id];

/** One motif per Eid item; each part of the day decorates its own part of the hand. */
export const slots: Record<ItemId, string> = {
  // চাঁদরাত: the fingertips
  chand: tip(F("middle")), mehedi: tip(F("index")), shopping: tip(F("ring")), lukano: tip(F("thumb")), message: tip(F("pinky")),
  // ঈদের সকাল: the flower in the palm (the defaults sit on alternate petals so the first hand looks balanced)
  jama: centerFlower, semai: petal(0), salam: petal(1), kolakuli: petal(2), "salami-dewa": petal(3), salami: petal(4), ator: petal(5),
  // দুপুর: finger bands and the wrist
  polao: band(F("middle")), jorda: band(F("ring")), mehman: band(F("index")), natok: band(F("pinky")), video: band(F("thumb")), ghum: wristBand(),
  // বিকেল-সন্ধ্যা: leaves and the two paisleys
  ghoraghuri: leaf(F("middle")), nanabari: leaf(F("index")), adda: leaf(F("ring")), mela: leaf(F("pinky")), fuchka: leaf(F("thumb")),
  faka: paisley([116, 326], 1), chhobi: paisley([214, 326], -1),
};

/** The hand's silhouette: stroke it for the outline, then fill it (non-zero) so inner seams vanish. */
export const handPath = [
  ...Object.values(fingers).map(capsule),
  "M92 230A48 48 0 0 1 140 182H194A48 48 0 0 1 242 230V300Q242 330 224 345V430H110V345Q92 330 92 300Z",
].join("");

/** Hand drawing area; the wrist runs past the bottom edge like a forearm. */
export const HAND = { x: 0, y: 24, width: 272, height: 406 } as const;
export const viewBox = `${HAND.x} ${HAND.y} ${HAND.width} ${HAND.height}`;
