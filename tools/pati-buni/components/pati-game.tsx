"use client";
// IP: what we avoided — no "-tris" or look-alike name; no seven-tetromino set (ours is six cane strips: one 2-cell, two 3-cells and three 4-cells with no mirror pairs, dealt eight to a bundle with the short ones doubled); no 10×20 well (ours is 8×14); no ghost piece; no next-piece box (the next strip lies as a tied bundle on the floor); none of the familiar seven colours (four natural cane dyes in a basket weave); no flashing line clear (rows weave and roll away); our own score numbers (10/25/45/70); no music at all.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, newSeed, useBest, useGameLoop, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawBamboo, drawRoll, paintSprites, paintWeft, palette, spriteIndex } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { banner, bn, caption, parseShared, sharedHash, ROW_POINTS, type Shared } from "../lib/link";
import {
  across, clearMs, compareLine, createGame, hardDrop, humanLine, level, move, rotate, tick as advance,
  COLS, PIECES, ROWS, TURNS, type Event, type Game,
} from "../lib/weave";

const TOOL = "pati-buni";
type Phase = "ready" | "playing" | "paused" | "over";
type Action = "left" | "right" | "rotate" | "drop";
type Result = Shared & { record: boolean };

const MAX_WIDTH = 440;
/** Holding ◀ or ▶ repeats after this long; a quick press-and-release of নামাও drops straight down. */
const REPEAT_DELAY = 210;
const TAP_MS = 180;
/** The first part of a weave threads the row; the rest rolls it away. */
const SWEEP = 0.55;
const TOGETHER = ["", "", "দুই সারি একসাথে!", "তিন সারি একসাথে!", "চার সারি একসাথে!"];
const KEYS: Record<string, Action> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "rotate", ArrowDown: "drop", a: "left", d: "right", w: "rotate", s: "drop", x: "rotate", A: "left", D: "right", W: "rotate", S: "drop", X: "rotate" };
const smooth = (t: number) => t * t * (3 - 2 * t);
const motionBehavior = (): ScrollBehavior => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, height: 0, cell: 0, frame: 0, sideX: 0, sideW: 0,
    background: null as HTMLCanvasElement | null,
    sprites: null as HTMLCanvasElement | null,
    weft: null as HTMLCanvasElement | null,
    spriteSize: 0,
    labelFont: "", bigFont: "", floatFont: "", subFont: "",
    // No falling before this time: a breath after resuming or restarting.
    hold: 0,
    soft: false, softAt: 0, softPiece: -1,
    repeatDir: 0 as -1 | 0 | 1, repeatFor: 0,
    floatAt: -1, floatText: "", floatSub: "", floatY: 0,
    rowsText: "০", speedText: "গতি ১",
  };
}

export function PatiGame() {
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [restartReady, setRestartReady] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [live] = useState(makeLive);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const phaseRef = useRef<Phase>("ready");
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const [firstGame] = useState(() => createGame(1));
  const game = useRef<Game>(firstGame);
  const seed = useRef(1);
  const boardInView = useInView(board);

  const card = result ? { ...result, name: cleanName(name) } : null;
  const state = card ? sharedHash(card) : "";

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }
  function letGo() { live.soft = false; live.repeatDir = 0; }

  function reset(nextSeed: number) {
    game.current = createGame(nextSeed, slowRef.current);
    seed.current = nextSeed;
    letGo();
    live.floatAt = -1;
    live.rowsText = bn(0);
    live.speedText = `গতি ${bn(1)}`;
    setScore(0);
    draw();
  }

  function start() { if (phaseRef.current === "ready") { live.hold = 0; go("playing"); } }
  function pause() { if (phaseRef.current === "playing") { letGo(); go("paused"); } }
  // A breath after resuming, to see where the strip is before it falls again.
  function resume() { if (phaseRef.current === "paused") { live.hold = performance.now() + 600; go("playing"); } }
  function restart() {
    if (phaseRef.current !== "over" || !restartReady) return;
    reset(friend ? friend.seed : newSeed());
    live.hold = performance.now() + 350;
    go("playing");
  }

  function feedback() {
    const g = game.current, count = g.clearing.length;
    let sum = 0;
    for (const row of g.clearing) sum += row;
    setScore(g.score);
    live.rowsText = bn(g.rows);
    live.speedText = `গতি ${bn(level(g.rows) + 1)}`;
    live.floatAt = performance.now();
    live.floatText = `+${bn(ROW_POINTS[count])}`;
    live.floatSub = count > 1 ? TOGETHER[count] : level(g.rows) > level(g.rows - count) ? "গতি বাড়ল" : "";
    live.floatY = live.frame + (sum / count - 0.4) * live.cell;
    if (!slowRef.current && typeof navigator.vibrate === "function") navigator.vibrate(count > 1 ? 18 : 10);
  }

  function finish() {
    const g = game.current;
    letGo();
    go("over");
    setScore(g.score);
    setResult({ seed: seed.current, score: g.score, rows: g.rows, pattern: g.woven.slice(), name: "", record: best !== null && g.score > best });
    submitBest(g.score);
    // Thumbs are still on the buttons when the frame fills; don't let those taps skip the result.
    setRestartReady(false);
    window.setTimeout(() => setRestartReady(true), 700);
  }

  function handle(event: Event) {
    if (event === "clear") feedback();
    else if (event === "over") finish();
  }

  /** A control press: the first one also starts the game, and while paused it only resumes. */
  function press(action: Action) {
    const now = phaseRef.current;
    if (now === "ready") start();
    else if (now === "paused") { resume(); return; }
    else if (now !== "playing") return;
    const g = game.current;
    if (action === "rotate") rotate(g);
    else if (action === "drop") { live.soft = true; live.softAt = performance.now(); live.softPiece = g.pieces; }
    else {
      const dx = action === "left" ? -1 : 1;
      move(g, dx);
      live.repeatDir = dx; live.repeatFor = 0;
    }
  }
  function release(action: Action) {
    if (action === "left" || action === "right") { if (live.repeatDir === (action === "left" ? -1 : 1)) live.repeatDir = 0; return; }
    if (action !== "drop" || !live.soft) return;
    live.soft = false;
    // A quick tap puts the same strip straight down; a long hold was a soft drop and just stops.
    if (phaseRef.current === "playing" && performance.now() - live.softAt < TAP_MS && game.current.pieces === live.softPiece) handle(hardDrop(game.current));
  }

  function tick(dt: number) {
    if (phaseRef.current !== "playing" || performance.now() < live.hold) return;
    const g = game.current, ms = dt * 1000;
    if (live.repeatDir) {
      live.repeatFor += ms;
      if (live.repeatFor >= REPEAT_DELAY) { move(g, live.repeatDir); live.repeatFor -= slowRef.current ? 140 : 80; }
    }
    handle(advance(g, ms, live.soft));
  }

  function drawRow(c: CanvasRenderingContext2D, row: number, y: number, h: number) {
    const { cell, frame, sprites, spriteSize } = live, cells = game.current.board;
    for (let col = 0; col < COLS; col++) {
      const value = cells[row * COLS + col];
      if (value) c.drawImage(sprites!, spriteIndex(value & 7, (value & 8) !== 0) * spriteSize, 0, spriteSize, spriteSize, frame + col * cell, y, cell, h);
    }
  }

  function draw() {
    const c = live.context, sprites = live.sprites, weft = live.weft;
    if (!c || !live.background || !sprites || !weft) return;
    const { width, height, cell, frame, spriteSize, sideX, sideW } = live, g = game.current, now = performance.now(), calm = slowRef.current;
    c.drawImage(live.background, 0, 0, width, height);
    const bottom = frame + cell * ROWS;

    if (g.clearing.length) {
      const progress = Math.min(1, 1 - g.clearLeft / clearMs(g.slow));
      const reach = Math.min(1, progress / SWEEP), roll = progress < SWEEP ? 0 : smooth((progress - SWEEP) / (1 - SWEEP));
      let y = bottom;
      for (let row = ROWS - 1; row >= 0; row--) {
        const woven = g.clearing.includes(row), h = woven ? cell * (1 - roll) : cell;
        y -= h;
        if (h < 0.5) continue;
        drawRow(c, row, y, h);
        if (!woven) continue;
        // The weft threads across the row, then the finished band squashes flat as it rolls away.
        const band = h * 0.44;
        c.drawImage(weft, 0, 0, Math.max(1, weft.width * reach), weft.height, frame, y + (h - band) / 2, cell * COLS * reach, band);
        if (reach < 1) {
          c.fillStyle = palette.glow;
          c.beginPath(); c.arc(frame + cell * COLS * reach, y + h / 2, band * 0.7, 0, Math.PI * 2); c.fill();
        }
      }
    } else {
      for (let row = 0; row < ROWS; row++) drawRow(c, row, frame + row * cell, cell);
    }

    const piece = g.piece;
    if (piece && !g.clearing.length) {
      const cells = TURNS[piece.kind][piece.turn], colour = PIECES[piece.kind].colour;
      const bob = phaseRef.current === "ready" && !calm ? Math.sin(now / 320) * cell * 0.08 : 0;
      c.strokeStyle = palette.glow;
      c.lineWidth = 2;
      for (let i = 0; i < cells.length / 2; i++) {
        const x = frame + (piece.x + cells[i * 2]) * cell, y = frame + (piece.y + cells[i * 2 + 1]) * cell + bob;
        c.drawImage(sprites, spriteIndex(colour, across(piece.kind, piece.turn, i)) * spriteSize, 0, spriteSize, spriteSize, x, y, cell, cell);
        c.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }

    // The floor beside the frame: the next strip as a tied bundle, the rows count, and the woven mat rolling up.
    const cx = sideX + sideW / 2, label = Math.round(cell * 0.5);
    c.textAlign = "center";
    c.font = live.labelFont;
    c.fillStyle = palette.muted;
    c.fillText("এরপর", cx, frame + label);
    const next = TURNS[g.next][0], unit = Math.min(cell * 0.6, (sideW - 18) / 4);
    let maxX = 0, minY = 9, maxY = 0;
    for (let i = 0; i < next.length; i += 2) { maxX = Math.max(maxX, next[i]); minY = Math.min(minY, next[i + 1]); maxY = Math.max(maxY, next[i + 1]); }
    c.save();
    c.translate(cx, frame + label * 1.6 + unit * 1.3);
    c.rotate(-0.14);
    const ox = -((maxX + 1) * unit) / 2, oy = -((minY + maxY + 1) * unit) / 2;
    for (let i = 0; i < next.length / 2; i++) {
      c.drawImage(sprites, spriteIndex(PIECES[g.next].colour, across(g.next, 0, i)) * spriteSize, 0, spriteSize, spriteSize, ox + next[i * 2] * unit, oy + next[i * 2 + 1] * unit, unit, unit);
    }
    c.fillStyle = palette.twine;
    c.fillRect(-unit * 0.12, oy + minY * unit - unit * 0.15, unit * 0.24, (maxY - minY + 1) * unit + unit * 0.3);
    c.restore();
    const rowsY = Math.max(frame + label * 2.4 + unit * 3.2, height * 0.42);
    c.font = live.labelFont;
    c.fillStyle = palette.muted;
    c.fillText("সারি বোনা", cx, rowsY);
    c.font = live.bigFont;
    c.fillStyle = palette.ink;
    c.fillText(live.rowsText, cx, rowsY + cell * 1.25);
    c.font = live.labelFont;
    c.fillStyle = palette.muted;
    c.fillText(live.speedText, cx, rowsY + cell * 2.05);
    const diameter = Math.min(sideW * 0.42, cell * 0.55 + g.rows * cell * 0.03);
    drawRoll(c, sideX + 8, height - frame - diameter / 2 - 4, sideW - 16, diameter);

    if (live.floatAt >= 0 && now - live.floatAt < 900) {
      const p = (now - live.floatAt) / 900, fy = live.floatY - (calm ? 0 : p * cell * 1.2), mid = frame + (cell * COLS) / 2;
      c.globalAlpha = p < 0.7 ? 1 : (1 - p) / 0.3;
      c.lineWidth = 4;
      c.strokeStyle = palette.ink;
      c.fillStyle = palette.gold;
      c.font = live.floatFont;
      c.strokeText(live.floatText, mid, fy); c.fillText(live.floatText, mid, fy);
      if (live.floatSub) {
        c.font = live.subFont;
        c.fillStyle = palette.glow;
        c.strokeText(live.floatSub, mid, fy + cell * 0.75); c.fillText(live.floatSub, mid, fy + cell * 0.75);
      }
      c.globalAlpha = 1;
    }
  }

  function paintBoard() {
    const { width, height, cell, frame } = live, ratio = Math.min(2, window.devicePixelRatio || 1);
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(width * ratio); background.height = Math.round(height * ratio);
    const b = background.getContext("2d")!;
    b.setTransform(ratio, 0, 0, ratio, 0, 0);
    b.fillStyle = palette.floor;
    b.fillRect(0, 0, width, height);
    const wellW = cell * COLS, wellH = cell * ROWS;
    b.fillStyle = "#0000001a";
    b.fillRect(frame + 4, frame + 6, wellW + frame, wellH + frame);
    b.fillStyle = palette.well;
    b.fillRect(frame, frame, wellW, wellH);
    // Warp threads, two to a column, waiting for the weft.
    b.fillStyle = palette.warp;
    for (let i = 0; i < COLS * 2; i++) b.fillRect(frame + ((i + 0.5) * cell) / 2 - 1, frame, 2, wellH);
    drawBamboo(b, 0, 0, wellW + frame * 2, frame);
    drawBamboo(b, 0, frame + wellH, wellW + frame * 2, frame);
    drawBamboo(b, 0, frame, frame, wellH);
    drawBamboo(b, frame + wellW, frame, frame, wellH);

    live.spriteSize = Math.ceil(cell * ratio);
    paintSprites(live.sprites ??= document.createElement("canvas"), live.spriteSize);
    paintWeft(live.weft ??= document.createElement("canvas"), cell, ratio);
    live.labelFont = `600 ${Math.round(cell * 0.46)}px Bangla, sans-serif`;
    live.bigFont = `800 ${Math.round(cell * 1.15)}px Display, Bangla, sans-serif`;
    live.floatFont = `800 ${Math.round(cell * 0.9)}px Display, Bangla, sans-serif`;
    live.subFont = `700 ${Math.round(cell * 0.5)}px Bangla, sans-serif`;
  }

  useGameLoop(tick, draw, phase === "playing" || (boardInView && !slow && phase === "ready"));

  useEffect(() => { game.current.slow = slow; }, [slow]);

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      // The frame fits the phone's height too, so the board and its buttons share one screen.
      const side = Math.min(130, Math.max(72, width * 0.25));
      const cell = Math.floor(Math.max(18, Math.min((width - side - 6) / (COLS + 0.6), (window.innerHeight - 360) / (ROWS + 0.6), 40)));
      const frame = Math.round(cell * 0.3), height = cell * ROWS + frame * 2, sideX = cell * COLS + frame * 2 + 6;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      Object.assign(live, { width, height, cell, frame, sideX, sideW: width - sideX, context: fitCanvas(element, width, height) });
      paintBoard();
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    // Canvas labels need the Bangla font; redraw once it has loaded.
    document.fonts?.ready.then(() => draw());
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // In-page jumps don't touch the hash, so only a real challenge link counts.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      reset(shared.seed);
      go("ready");
    };
    setSite(window.location.host);
    if (!parseShared(window.location.hash)) reset(newSeed());
    readFriend();
    const hide = () => { if (document.hidden) pause(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);

  // Scrolling the board away mid-game pauses it, so nobody tops out off-screen.
  useEffect(() => { if (!boardInView) pause(); }, [boardInView]);

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const now = phaseRef.current, action = KEYS[event.key];
    if (event.type === "keyup") { if (action === "drop") live.soft = false; return; }
    if (action) {
      if (now === "over") return;
      event.preventDefault();
      // Arrow keys repeat by themselves; turning and soft drop only react to the first press.
      if (event.repeat && action !== "left" && action !== "right") return;
      press(action);
      if (action === "left" || action === "right") live.repeatDir = 0;
      return;
    }
    if (event.key === "Escape" || event.key === "p" || event.key === "P") { if (now === "playing") pause(); else resume(); return; }
    if (event.key !== " " && event.key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (event.repeat) return;
    if (now === "ready") start();
    else if (now === "paused") resume();
    else if (now === "over") restart();
    else if (event.key === " ") handle(hardDrop(game.current));
    else pause();
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", listen);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", listen); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("পাটি বুনি ১২৩৪ সারি").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // Buttons react on touch-down, keep working while another thumb holds a different one, and a keyboard "click" (detail 0) still works.
  const control = (action: Action) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      // Capture keeps the release coming if the thumb slides off; a pointer that's already gone just can't be captured.
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* fine */ }
      press(action);
    },
    onPointerUp: () => release(action),
    onPointerCancel: () => release(action),
    onLostPointerCapture: () => release(action),
    onClick: (event: { detail: number }) => { if (event.detail === 0) { press(action); release(action); } },
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
  });
  function onBoardDown() {
    if (phaseRef.current === "ready") start();
    else if (phaseRef.current === "paused") resume();
  }
  function seeCard() { resultBox.current?.scrollIntoView({ behavior: motionBehavior(), block: "start" }); }
  function playFromCard() {
    reset(friend ? friend.seed : newSeed());
    go("ready");
    board.current?.scrollIntoView({ behavior: motionBehavior(), block: "center" });
  }

  const rival = friend ? possessive(friend.name || "বন্ধু") : "";
  const over = phase === "over" && result;

  return (
    <div className="pb">
      {friend && (
        <section className="pb-friend" aria-labelledby="pb-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${rival} পাটির কার্ড: ${bn(friend.rows)} সারি, ${bn(friend.score)} পয়েন্ট`} />
          <div>
            <h2 id="pb-friend-title">{banner(friend)}</h2>
            <p>{rival} নিজের ফোনের স্কোর</p>
          </div>
        </section>
      )}

      <div className="pb-hud">
        <p className="pb-score"><span>পয়েন্ট</span><b>{bn(score)}</b></p>
        {best !== null && <p className="pb-best"><span>সেরা</span><b>{bn(best)}</b></p>}
        <button type="button" className="pb-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="12" r="5.5" /><path d="M10 12a2 2 0 1 0 2-2M2.5 18h15a3 3 0 0 0 3-3v-4m0 0-1.2-3m1.2 3 1.8-2.4" /></svg>ধীরে খেলো
        </button>
        <button type="button" className="pb-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"} aria-label={phase === "paused" ? "চালিয়ে যাও" : "একটু থামাও"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{phase === "paused" ? <path d="M8 5v14l11-7z" className="pb-fill" /> : <path d="M9 5v14M15 5v14" />}</svg>
        </button>
      </div>

      <div className="pb-board" ref={board} data-phase={phase} onPointerDown={onBoardDown}>
        <canvas ref={canvas} role="img" aria-label={`পাটির ফ্রেম। ${bn(score)} পয়েন্ট।`} />
        {phase === "ready" && (
          <div className="pb-overlay" data-at="top">
            <div className="pb-note">
              <p className="pb-howto">ফাঁকে বেত বসাও, <b>সারি ভরলেই বোনা!</b></p>
              <button type="button" className="kit-primary" onClick={start}>শুরু করো</button>
            </div>
          </div>
        )}
        {phase === "paused" && (
          <div className="pb-overlay" data-at="top">
            <div className="pb-note">
              <p className="pb-howto">থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{over && result ? `খেলা শেষ। ${bn(result.score)} পয়েন্ট, ${bn(result.rows)} সারি বোনা হলো। ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
        {over && (
          <div className="pb-overlay">
            <div className="pb-note pb-slip">
              <h2>আর জায়গা নেই!</h2>
              <p className="pb-final"><b>{bn(result.score)}</b> পয়েন্ট</p>
              <p className="pb-rows">{bn(result.rows)} সারি বোনা হলো</p>
              <p className="pb-record">{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && best > result.score ? `এই ফোনে সেরা ${bn(best)}` : humanLine(result.rows)}</p>
              {friend && <p className="pb-versus">{compareLine(result.score, friend.score, friend.name)}</p>}
              <button type="button" className="kit-link pb-see" onClick={seeCard}>পাটির কার্ড দেখো ↓</button>
            </div>
          </div>
        )}
      </div>

      <div className="pb-controls">
        {phase === "over" ? (
          <button type="button" className="kit-primary pb-again" onClick={restart} disabled={!restartReady}>আরেকবার</button>
        ) : (
          <>
            <button type="button" className="pb-key" aria-label="বাঁয়ে সরাও" {...control("left")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
            </button>
            <button type="button" className="pb-key" {...control("rotate")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.6-5.4" /><path d="M19 4v4h-4" /></svg>ঘোরাও
            </button>
            <button type="button" className="pb-key" aria-label="ডানে সরাও" {...control("right")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </button>
            <button type="button" className="pb-key" {...control("drop")}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14M6 12l6 6 6-6" /></svg>নামাও
            </button>
          </>
        )}
      </div>

      <section className="pb-result" id="result" ref={resultBox} aria-labelledby="pb-result-title">
        <div className="pb-result-head">
          <h2 id="pb-result-title">{result ? <><em>{bn(result.rows)} সারি</em> বোনা পাটির কার্ড</> : "খেলা শেষে তোমার পাটির কার্ড"}</h2>
          <p>{result ? friend ? compareLine(result.score, friend.score, friend.name) : humanLine(result.rows) : "যে সারিগুলো বুনবে, সেগুলো দিয়েই কার্ডে একটা পাটি আঁকা হবে। বন্ধুকে পাঠালে সে ঠিক একই বেতের গোছা পাবে।"}</p>
        </div>
        {card && (
          <div className="pb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pb-card-summary" />
              <figcaption id="pb-card-summary" className="pb-sr">পাটি বুনির কার্ড: {card.name && `${card.name}, `}{bn(card.rows)} সারি, {bn(card.score)} পয়েন্ট। {humanLine(card.rows)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pb-share">
              <label className="pb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="pati-buni.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক একই বেতের গোছা পাবে, একই ফালি একই ক্রমে।" />
              <button type="button" className="kit-link pb-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
