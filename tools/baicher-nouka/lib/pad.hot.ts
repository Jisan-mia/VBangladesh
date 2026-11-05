// The big ঢোল under your thumb: the closing ring, the gold window, the flash of a catch and one word. Per-frame, so it allocates nothing.
import type { PadArt } from "./view";

export const PAD_WORDS = ["", "চাপো", "তালে", "দারুণ", "বড় টান", "আগে", "পরে", "৩", "২", "১", "চলো", "ছন্দ"] as const;
export const W_NONE = 0, W_TAP = 1, W_GOOD = 2, W_PERFECT = 3, W_BIG = 4, W_EARLY = 5, W_LATE = 6, W_THREE = 7, W_TWO = 8, W_ONE = 9, W_GO = 10, W_RHYTHM = 11;

export type PadLook = {
  /** Seconds (real) until the beat the ring is closing on, or Infinity; and the half-window in real seconds. */
  delta: number; window: number; accent: boolean; calm: boolean;
  /** 1 just after a catch, fading to 0; and what it was: 0 none, 1 good, 2 perfect, 3 off the beat. */
  hit: number; hitKind: number; word: number;
  /** How far the beat's last stroke has bumped the drum (1 to 0). */
  bump: number;
};
const APPROACH = 1.1;
const TWO_PI = Math.PI * 2;

export function drawPad(c: CanvasRenderingContext2D, art: PadArt, look: PadLook) {
  const { w, h, r, cx, cy } = art;
  c.setTransform(art.ratio, 0, 0, art.ratio, 0, 0);
  c.clearRect(0, 0, w, h);
  const bump = look.calm ? 0 : look.bump * 0.04;
  c.save();
  c.translate(cx, cy); c.scale(1 + bump, 1 + bump); c.translate(-cx, -cy);
  c.drawImage(art.canvas, 0, 0, w, h);
  if (look.hit > 0 && look.hitKind > 0) {
    const grow = look.calm ? 0.2 : 1 - look.hit;
    c.globalAlpha = look.hit;
    if (look.hitKind === 3) {
      c.strokeStyle = "#d62828"; c.lineWidth = 7; c.lineCap = "round";
      c.beginPath(); c.moveTo(cx - r * 0.5, cy - r * 0.5); c.lineTo(cx + r * 0.5, cy + r * 0.5); c.moveTo(cx + r * 0.5, cy - r * 0.5); c.lineTo(cx - r * 0.5, cy + r * 0.5); c.stroke();
    } else {
      c.strokeStyle = look.hitKind === 2 ? "#ffd166" : "#fff6dc"; c.lineWidth = look.hitKind === 2 ? 8 : 5;
      c.beginPath(); c.arc(cx, cy, r * (1.02 + 0.5 * grow), 0, TWO_PI); c.stroke();
      if (look.hitKind === 2) {
        c.lineCap = "round"; c.lineWidth = 4;
        c.beginPath();
        for (let ray = 0; ray < 8; ray++) { const a = ray * TWO_PI / 8 + 0.3; c.moveTo(cx + Math.cos(a) * r * (1.15 + 0.3 * grow), cy + Math.sin(a) * r * (1.15 + 0.3 * grow)); c.lineTo(cx + Math.cos(a) * r * (1.4 + 0.5 * grow), cy + Math.sin(a) * r * (1.4 + 0.5 * grow)); }
        c.stroke();
      }
    }
    c.globalAlpha = 1;
  }
  if (look.delta !== Infinity) {
    if (Math.abs(look.delta) <= look.window) {
      c.fillStyle = "rgba(255,209,102,0.28)"; c.beginPath(); c.arc(cx, cy, r * 0.76, 0, TWO_PI); c.fill();
      c.lineWidth = look.accent ? 9 : 6; c.strokeStyle = "#ffd166"; c.beginPath(); c.arc(cx, cy, r * 1.02, 0, TWO_PI); c.stroke();
    } else if (look.delta > 0 && look.delta < APPROACH) {
      const left = look.delta / APPROACH;
      c.globalAlpha = 0.4 + 0.6 * (1 - left);
      c.lineWidth = look.accent ? 7 : 4.5; c.strokeStyle = look.accent ? "#ffd166" : "#ffffff";
      c.beginPath(); c.arc(cx, cy, r * (1.02 + 0.7 * left), 0, TWO_PI); c.stroke();
      c.globalAlpha = 1;
    }
  }
  c.restore();
  if (look.word > 0) {
    c.font = '800 18px "Display", "Bangla"'; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.lineJoin = "round";
    c.lineWidth = 5; c.strokeStyle = "rgba(255,250,235,0.95)"; c.strokeText(PAD_WORDS[look.word], cx, h - 10);
    c.fillStyle = look.hitKind === 3 ? "#b3302a" : "#6a3f1d"; c.fillText(PAD_WORDS[look.word], cx, h - 10);
  }
}
