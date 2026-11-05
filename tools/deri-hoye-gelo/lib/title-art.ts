// The title's start badge and the first-run story's three panels, drawn once per size (not per frame).
import { DISPLAY_FONT } from "../../../shared/card-canvas";
import {
  drawBell, drawGateFrame, drawGateLeaf, drawKid, drawMud, drawPuddle, drawSatchel, drawTiffin, drawTire, jumpUpPose, paintBrickTile, paintPavement,
  paintTown, paintVillageLane, paintWetDirt, paintWorldSky, runPose, STRIP_H, TILE, WORLD_ART,
} from "./art";

export const TITLE_W = 320, TITLE_H = 300;

function prepare(canvas: HTMLCanvasElement, width: number, ratio: number, w: number, h: number) {
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(width * h / w * ratio);
  const c = canvas.getContext("2d")!;
  c.setTransform(width / w * ratio, 0, 0, width / w * ratio, 0, 0);
  c.clearRect(0, 0, w, h);
  return c;
}

/** A strip of the world's road: its far side and its ground, `y` the road line. */
function lane(c: CanvasRenderingContext2D, world: number, y: number, width: number, font: string) {
  c.save(); c.translate(-30, y - 14 - STRIP_H);
  if (world === 1) paintTown(c, 720, STRIP_H, font); else paintVillageLane(c);
  if (WORLD_ART[world].wash) { c.globalCompositeOperation = "source-atop"; c.fillStyle = WORLD_ART[world].wash; c.fillRect(0, 0, 720, STRIP_H); c.globalCompositeOperation = "source-over"; }
  c.restore();
  for (let x = 0; x < width; x += TILE) {
    c.save(); c.translate(x, y - 18);
    if (world === 1) paintPavement(c, TILE); else if (world === 2) paintWetDirt(c, TILE); else paintBrickTile(c);
    c.restore();
  }
  c.fillStyle = WORLD_ART[world].verge; c.fillRect(0, y + 43, width, 200);
}

/** The start button: a round badge with the world's road and the kid mid-leap, and চলো! on a ribbon. */
export function drawTitle(canvas: HTMLCanvasElement, width: number, ratio: number, world: number, label: string, girl: boolean) {
  const c = prepare(canvas, width, ratio, TITLE_W, TITLE_H);
  const cx = 160, cy = 138, r = 128;
  c.save();
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
  c.save(); c.translate(cx - 180, cy - r); paintWorldSky(c, 360, 190, world); c.restore();
  c.save(); c.translate(cx - 180, cy - r); c.scale(1, 1); lane(c, world, 205, 400, `700 7.5px ${DISPLAY_FONT}`); c.restore();
  // The world's thing on the road, the kid leaping over it, speed lines behind.
  c.save(); c.translate(cx + 6, cy - r + 205);
  c.scale(1.6, 1.6);
  if (world === 1) { c.translate(0, -10); drawTire(c); } else if (world === 2) drawMud(c, 70); else drawPuddle(c, 60);
  c.restore();
  c.strokeStyle = "#ffffffcc"; c.lineCap = "round"; c.lineWidth = 3.4;
  for (const [x, y, w] of [[46, cy + 4, 34], [36, cy + 22, 44]] as const) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); }
  c.fillStyle = "#3a2a1a33"; c.beginPath(); c.ellipse(cx - 6, cy - r + 207, 26, 4, 0, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(cx - 6, cy + 40); c.scale(2.5, 2.5); drawKid(c, jumpUpPose, girl); c.restore();
  if (world === 2) {
    c.strokeStyle = "#dfe8f3aa"; c.lineWidth = 1;
    c.beginPath(); for (let i = 0; i < 40; i++) { const x = (i * 53) % 320, y = (i * 37) % 280; c.moveTo(x, y); c.lineTo(x - 5, y + 14); } c.stroke();
  }
  c.restore();
  // The rim, then the bell hanging off it (the game's signature).
  c.lineWidth = 9; c.strokeStyle = "#fff7e6"; c.beginPath(); c.arc(cx, cy, r - 3, 0, Math.PI * 2); c.stroke();
  c.lineWidth = 3; c.strokeStyle = "#1f2a44"; c.beginPath(); c.arc(cx, cy, r + 1, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "#5a4a3a"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx + 92, cy - 90); c.lineTo(cx + 100, cy - 70); c.stroke();
  drawBell(c, cx + 102, cy - 60, 13);
  // The ribbon with the label.
  const ry = cy + r - 26;
  c.fillStyle = "#86281f";
  for (const side of [-1, 1]) { c.beginPath(); c.moveTo(cx + side * 108, ry + 4); c.lineTo(cx + side * 140, ry + 10); c.lineTo(cx + side * 128, ry + 26); c.lineTo(cx + side * 140, ry + 42); c.lineTo(cx + side * 108, ry + 40); c.closePath(); c.fill(); }
  c.fillStyle = "#b23a2e"; c.beginPath(); c.roundRect(cx - 116, ry, 232, 46, 10); c.fill();
  c.fillStyle = "#ffffff22"; c.fillRect(cx - 112, ry + 4, 224, 6);
  c.font = `800 34px ${DISPLAY_FONT}`; c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(label, cx, ry + 25);
  c.textBaseline = "alphabetic";
}

export const STORY_W = 300, STORY_H = 200;

function clock(c: CanvasRenderingContext2D, x: number, y: number) {
  for (const side of [-1, 1]) { c.fillStyle = "#c8452f"; c.beginPath(); c.arc(x + side * 22, y - 30, 11, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = "#c8452f"; c.beginPath(); c.arc(x, y, 38, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#fffaf0"; c.beginPath(); c.arc(x, y, 31, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#1f2a44"; c.lineCap = "round";
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.lineWidth = i % 3 ? 1.2 : 2.4; c.beginPath(); c.moveTo(x + Math.cos(a) * 26, y + Math.sin(a) * 26); c.lineTo(x + Math.cos(a) * 29, y + Math.sin(a) * 29); c.stroke(); }
  // সাতটা চল্লিশ: the hour hand past seven, the minute hand on eight.
  const hour = (7 + 40 / 60) / 12 * Math.PI * 2 - Math.PI / 2, minute = 40 / 60 * Math.PI * 2 - Math.PI / 2;
  c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(hour) * 15, y + Math.sin(hour) * 15); c.stroke();
  c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(minute) * 23, y + Math.sin(minute) * 23); c.stroke();
  c.fillStyle = "#1f2a44"; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
  // It's ringing.
  c.strokeStyle = "#1f2a44"; c.lineWidth = 2.2;
  for (const side of [-1, 1]) for (const d of [48, 58]) { c.beginPath(); c.arc(x, y, d, side < 0 ? Math.PI * 0.85 : -Math.PI * 0.15, side < 0 ? Math.PI * 1.15 : Math.PI * 0.15); c.stroke(); }
}

/** Panel `at` of the first-run story: the alarm clock, the dash out of the door, the road to the gate. */
export function drawStory(canvas: HTMLCanvasElement, width: number, ratio: number, at: number, girl: boolean) {
  const c = prepare(canvas, width, ratio, STORY_W, STORY_H);
  if (at === 0) {
    c.fillStyle = "#f3dfc0"; c.fillRect(0, 0, STORY_W, STORY_H);
    c.fillStyle = "#ffd98a"; c.fillRect(196, 26, 70, 62);
    c.strokeStyle = "#8a5a36"; c.lineWidth = 4; c.strokeRect(196, 26, 70, 62);
    c.lineWidth = 2; c.beginPath(); c.moveTo(231, 26); c.lineTo(231, 88); c.moveTo(196, 57); c.lineTo(266, 57); c.stroke();
    c.fillStyle = "#c9d9e8"; c.fillRect(0, 150, STORY_W, 50);
    c.fillStyle = "#e86f5a"; c.beginPath(); c.roundRect(10, 132, 180, 40, 10); c.fill();
    c.fillStyle = "#fff7e6"; c.beginPath(); c.ellipse(46, 136, 30, 12, 0, 0, Math.PI * 2); c.fill();
    clock(c, 110, 78);
    return;
  }
  if (at === 1) {
    c.fillStyle = "#cfe8f0"; c.fillRect(0, 0, STORY_W, STORY_H);
    c.fillStyle = "#f1ead8"; c.fillRect(0, 20, 120, 160);
    c.fillStyle = "#3d6470"; c.fillRect(30, 70, 60, 110);
    c.fillStyle = "#2b4f58"; c.fillRect(30, 70, 16, 110);
    c.fillStyle = "#b9614a"; c.fillRect(0, 176, STORY_W, 24);
    c.save(); c.translate(160, 172); c.scale(2.6, 2.6); drawKid(c, runPose(0.25), girl); c.restore();
    c.save(); c.translate(236, 102); c.scale(2.2, 2.2); c.rotate(0.3); drawTiffin(c, false); c.restore();
    c.save(); c.translate(106, 120); c.scale(2.2, 2.2); drawSatchel(c, 0, 0); c.restore();
    c.strokeStyle = "#1f2a4488"; c.lineWidth = 3; c.lineCap = "round";
    for (const [x, y] of [[120, 120], [112, 140], [122, 158]] as const) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 26, y); c.stroke(); }
    return;
  }
  paintWorldSky(c, STORY_W, 150, 0);
  lane(c, 0, 168, STORY_W, `700 7.5px ${DISPLAY_FONT}`);
  c.save(); c.translate(250, 154); c.scale(0.8, 0.8); drawGateFrame(c, "স্কুল", `700 9px ${DISPLAY_FONT}`);
  c.save(); c.translate(-48, 0); c.scale(0.3, 1); drawGateLeaf(c); c.restore(); c.save(); c.translate(48, 0); c.scale(-0.3, 1); drawGateLeaf(c); c.restore();
  drawBell(c, 0, -114, 6); c.restore();
  c.save(); c.translate(130, 168); c.scale(1.4, 1.4); drawPuddle(c, 56); c.restore();
  c.save(); c.translate(70, 168 - 46); c.scale(1.9, 1.9); drawKid(c, jumpUpPose, girl); c.restore();
}
