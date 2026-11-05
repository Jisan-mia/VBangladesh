// Canvas pictures outside the play loop: the title's big pot (the start button) and the three story panels, both drawn with the
// real kitchen renderer into a small offscreen frame.
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import { newCache, prepare, VH, VW } from "./art";
import { drawFrame } from "./draw.hot";
import { worldOf } from "./levels";
import { newRound, type Round } from "./round";
import { makeView } from "./view";

export const TITLE_ASPECT = 0.84;
export const STORY_ASPECT = VH / VW;
const STORY_SEED = 48213;

/** One frame of `round` into an offscreen canvas at `ratio`. */
function snapshot(round: Round, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(VW * ratio); canvas.height = Math.ceil(VH * ratio);
  const context = canvas.getContext("2d")!, cache = newCache(ratio), view = makeView();
  view.slow = true; view.clock = 1.2;
  prepare(cache, round.pots[round.index]);
  drawFrame(context, cache, round, view);
  return { canvas, context };
}

/** The title's start button: the kitchen of this world with a big pot steaming on the stove and খেলো on its belly. */
export function drawTitlePot(canvas: HTMLCanvasElement, width: number, ratio: number, word: string, level: number) {
  const height = Math.round(width * TITLE_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const round = newRound(STORY_SEED, level), pot = round.pots[round.index];
  pot.dark = false;
  round.phase = "rising"; round.t = 2.2; round.foam = 0.74;
  const { canvas: frame } = snapshot(round, Math.min(2, ratio * width / VW));
  const c = canvas.getContext("2d")!, k = width / VW, sy = 74;
  c.drawImage(frame, 0, sy * frame.height / VH, frame.width, (VH - sy - 6) * frame.height / VH, 0, 0, canvas.width, canvas.height);
  c.setTransform(ratio * k, 0, 0, ratio * k, 0, 0);
  const x = 168, y = 238 - sy;
  c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.roundRect(x - 62, y - 17, 130, 44, 22); c.fill();
  c.fillStyle = "#fffaf0"; c.strokeStyle = "#7d2c19"; c.lineWidth = 3;
  c.beginPath(); c.roundRect(x - 64, y - 22, 130, 44, 22); c.fill(); c.stroke();
  c.fillStyle = "#b6462b"; c.font = `800 30px ${DISPLAY_FONT}`; c.textAlign = "center"; c.textBaseline = "alphabetic";
  c.fillText(word, x + 1, y + 10);
  c.textAlign = "left";
}

const SAYS = ["দুধটা দেখিস!", "", ""];
const WHO = ["আম্মু, পাশের ঘর থেকে", "", ""];

/** Story panel `at`: আম্মু leaves the milk on; the foam climbs; a pot comes off the stove just in time. */
export function drawStoryPanel(canvas: HTMLCanvasElement, width: number, ratio: number, at: number) {
  const height = Math.round(width * STORY_ASPECT);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const round = newRound(STORY_SEED, 1), pot = round.pots[0];
  if (at === 1) { round.phase = "rising"; round.t = 2.3; round.foam = 0.8; }
  if (at === 2) { round.phase = "result"; round.wait = 0.5; round.foam = 0.96; round.scores[0] = 96; round.scored = 1; pot.dark = false; }
  const { canvas: frame } = snapshot(round, ratio * width / VW);
  const c = canvas.getContext("2d")!;
  c.drawImage(frame, 0, 0, canvas.width, canvas.height);
  c.setTransform(ratio * width / VW, 0, 0, ratio * width / VW, 0, 0);
  if (SAYS[at]) {
    c.fillStyle = "#fff"; c.strokeStyle = "#2a211c"; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(150, 24, 190, 58, 14); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(168, 82); c.lineTo(160, 98); c.lineTo(186, 82); c.fill();
    c.fillStyle = "#6b5b4e"; c.font = "600 11px Bangla, sans-serif"; c.fillText(WHO[at], 160, 44);
    c.fillStyle = "#2a211c"; c.font = `800 22px ${DISPLAY_FONT}`; c.fillText(SAYS[at], 160, 70);
  }
  if (at === 2) {
    c.fillStyle = "#fff"; c.strokeStyle = "#2a211c"; c.lineWidth = 2.5;
    c.beginPath(); c.roundRect(120, 24, 150, 50, 14); c.fill(); c.stroke();
    c.fillStyle = "#b6462b"; c.font = `800 26px ${DISPLAY_FONT}`; c.textAlign = "center"; c.fillText("৯৬%", 195, 59); c.textAlign = "left";
  }
}

