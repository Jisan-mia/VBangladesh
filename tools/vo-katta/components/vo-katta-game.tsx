"use client";
// IP: what we avoided — no film or song title, no game-brand look, no glass-coated (মাঞ্জা) string anywhere; the kites are ঘুড়ি আর ফানুস's own drawings, the rooftops, people and the tension meter are drawn fresh.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, newSeed, useBest, useGameLoop, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawKite } from "../../ghuri/lib/draw-card";
import { FONT_HUD, FONT_POP, FONT_POP_SMALL, METER, POLE, meterX, paintFog, paintScene, palette, strokeString } from "../lib/art";
import { cardBlob, drawCard, type Card } from "../lib/draw-card";
import {
  controlX, controlY, createGame, plan, step, steerBy, steerTo, timeLeft, zone,
  BREAK_TIME, H, HI, LO, ROOFS, ROUND_TIME, W, type Game, type GameEvent, type Kite,
} from "../lib/game";
import { banner, bn, caption, compareLine, cutLine, humanLine, lookFromGhuri, parseShared, sharedHash, LOOKS, ROUNDS, type Look, type Shared } from "../lib/link";

const TOOL = "vo-katta";
type Phase = "ready" | "playing" | "paused" | "over";
type Result = { seed: number; cuts: number; record: boolean };
type Hint = "start" | "cross" | "attack" | "pull" | "good" | "tight" | "lost" | "next" | "gone" | "break";

const HINTS: Record<Hint, string> = {
  start: "আঙুল টেনে ওড়াও, ধরে রাখলে টান",
  cross: "তোমার সুতা ওর সুতার ওপর দিয়ে নিয়ে যাও",
  attack: "ও প্যাঁচ লাগাতে আসছে! তৈরি থাকো",
  pull: "প্যাঁচ লেগেছে! টান দাও",
  good: "ঠিক টান! কাঁটা সবুজেই রাখো",
  tight: "বেশি টান! একটু ছাড়ো",
  lost: "তোমার ঘুড়ি কেটে গেল! নতুনটা উঠছে…",
  next: "পরের ঘুড়ি উঠছে…",
  gone: "এই ছাদের সব ঘুড়ি শেষ!",
  break: "পরের ছাদ তৈরি হচ্ছে…",
};

const MAX_WIDTH = 440;
const TAP_SLOP = 10;
/** The kite travels a little further than the thumb, so a short slide covers the sky. */
const GAIN = 1.25;
const KEY_SPEED = 230;
const KITE_R = 17;
const POP_TIME = 1.3;
const TAU = Math.PI * 2;
// Pre-built strings, so the frame loop never builds one.
const ROUND_LABELS = Array.from({ length: ROUNDS }, (_, i) => `রাউন্ড ${bn(i + 1)}/${bn(ROUNDS)}`);
const SECONDS = Array.from({ length: ROUND_TIME + 1 }, (_, i) => bn(i));
const TOGGLE_KEY = "ektukhani-vo-katta-toggle";

const sameLook = (a: Look, b: Look) => a.pattern === b.pattern && a.color === b.color;

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, scale: 1,
    background: null as HTMLCanvasElement | null,
    fog: null as HTMLCanvasElement | null,
    /** One sprite per ready look, then yours last. */
    sprites: [] as HTMLCanvasElement[],
    sw: 0, sh: 0,
    clock: 0, calm: false, reduced: false,
    pop: { at: -10, x: 0, y: 0, cut: true },
    keys: { left: false, right: false, up: false, down: false },
    pull: { pointer: false, key: false, toggle: false },
    gesture: { id: -1, lastX: 0, lastY: 0, startX: 0, startY: 0, moved: false },
    hint: "start" as Hint,
  };
}

export function VoKattaGame() {
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [cuts, setCuts] = useState(0);
  const [round, setRound] = useState(0);
  const [breakRound, setBreakRound] = useState<number | null>(null);
  const [hint, setHint] = useState<Hint>("start");
  const [pulling, setPulling] = useState(false);
  const [toggleMode, setToggleMode] = useState(false);
  const [look, setLook] = useState<Look>(LOOKS[0]);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [restartReady, setRestartReady] = useState(true);
  const [settling, setSettling] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [live] = useState(makeLive);
  const play = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const phaseRef = useRef<Phase>("ready");
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const toggleRef = useRef(toggleMode);
  toggleRef.current = toggleMode;
  const lookRef = useRef(look);
  lookRef.current = look;
  live.calm = slow || live.reduced;
  const [firstGame] = useState(() => createGame(1));
  const game = useRef<Game>(firstGame);
  const seed = useRef(1);
  const boardInView = useInView(board);

  const card: Card | null = result ? { cuts: result.cuts, name: cleanName(name), look } : null;
  const state = result ? sharedHash({ seed: result.seed, cuts: result.cuts, name, look }) : "";

  function go(next: Phase) { phaseRef.current = next; setPhaseState(next); }

  function syncPulling() {
    const on = live.pull.pointer || live.pull.key || live.pull.toggle;
    game.current.pulling = on;
    setPulling(on);
  }
  function letGo() {
    live.pull.pointer = live.pull.key = live.pull.toggle = false;
    live.keys.left = live.keys.right = live.keys.up = live.keys.down = false;
    live.gesture.id = -1;
    syncPulling();
  }

  function reset(nextSeed: number) {
    game.current = createGame(nextSeed);
    seed.current = nextSeed;
    live.pop.at = -10;
    live.hint = "start";
    setCuts(0);
    setRound(0);
    setBreakRound(null);
    setHint("start");
    letGo();
    draw();
  }

  function start() {
    if (phaseRef.current !== "ready") return;
    go("playing");
    // On a short screen the টান button can sit below the fold; bring the whole sky into view once.
    const box = play.current;
    if (box && box.getBoundingClientRect().bottom > window.innerHeight) box.scrollIntoView({ block: "end", behavior: live.reduced ? "auto" : "smooth" });
  }
  function pause() { if (phaseRef.current === "playing") { letGo(); go("paused"); } }
  function resume() { if (phaseRef.current === "paused") go("playing"); }
  function restart() {
    if (phaseRef.current !== "over" || !restartReady) return;
    reset(friend ? friend.seed : newSeed());
    go("playing");
  }

  const buzz = (ms: number) => { if (!slowRef.current && typeof navigator.vibrate === "function") navigator.vibrate(ms); };

  function finish() {
    const g = game.current;
    go("over");
    letGo();
    setCuts(g.cuts);
    setBreakRound(null);
    setResult({ seed: seed.current, cuts: g.cuts, record: best !== null && g.cuts > best });
    submitBest(g.cuts);
    // Thumbs are still on টান when the clock runs out; don't let that tap skip the result.
    setRestartReady(false);
    window.setTimeout(() => setRestartReady(true), 700);
    // Let the last ভো-কাট্টা finish before the loop stops.
    setSettling(true);
    window.setTimeout(() => setSettling(false), POP_TIME * 1000);
  }

  function onEvent(event: GameEvent, x: number, y: number) {
    const g = game.current;
    if (event === "hook") buzz(6);
    else if (event === "cut" || event === "lost") {
      Object.assign(live.pop, { at: live.clock, x: Math.min(Math.max(x, 80), W - 80), y: Math.min(Math.max(y, 90), 300), cut: event === "cut" });
      if (event === "cut") { setCuts(g.cuts); buzz(12); }
    } else if (event === "round-end") setBreakRound(g.round + 1);
    else if (event === "round") { setBreakRound(null); setRound(g.round); }
    else if (event === "over") finish();
  }

  function hintFor(g: Game): Hint {
    if (g.phase === "break") return "break";
    if (g.you.state !== "fly") return "lost";
    if (g.hooked) { const z = zone(g.you.tension); return z === "slack" ? "pull" : z === "good" ? "good" : "tight"; }
    if (g.rival.state === "gone") return "gone";
    if (g.rival.state !== "fly") return "next";
    return g.attackLeft > 0 ? "attack" : "cross";
  }

  function tick(dt: number) {
    live.clock += dt;
    if (phaseRef.current !== "playing") return;
    const g = game.current, keys = live.keys;
    const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    if (kx || ky) steerBy(g, kx * KEY_SPEED * dt, ky * KEY_SPEED * dt);
    step(g, dt, slowRef.current, onEvent);
    if (phaseRef.current !== "playing") return;
    const next = hintFor(g);
    if (next !== live.hint) { live.hint = next; setHint(next); }
  }

  function sprite(c: CanvasRenderingContext2D, index: number, x: number, y: number, angle: number, size: number) {
    const s = live.sprites[index];
    if (!s) return;
    const w = live.sw * size, h = live.sh * size;
    c.save();
    c.translate(x, y); c.rotate(angle);
    c.drawImage(s, -w / 2, -KITE_R * size - 4 * size, w, h);
    c.restore();
  }

  /** A kite on its string: hand → (hook →) kite while flying, a dangling tail while it falls. */
  function drawKiteLine(c: CanvasRenderingContext2D, g: Game, k: Kite, index: number, color: string, alpha: number, phaseShift: number) {
    if (k.state === "gone" || alpha <= 0) return;
    c.globalAlpha = alpha;
    c.beginPath();
    if (k.state === "fall") {
      c.moveTo(k.x, k.y); c.quadraticCurveTo(k.x - k.vx * 0.25, k.y + 18, k.x - k.vx * 0.4 + 5, k.y + 34);
    } else {
      c.moveTo(k.hx, k.hy);
      if (g.hooked) { c.quadraticCurveTo((k.hx + g.hook.x) / 2, (k.hy + g.hook.y) / 2 + 6, g.hook.x, g.hook.y); c.lineTo(k.x, k.y); }
      else c.quadraticCurveTo(controlX(k, g.wind), controlY(k), k.x, k.y);
    }
    strokeString(c, color, 1.7);
    let angle = k.state === "fall" ? k.spin : 0.5 * Math.atan2(k.x - k.hx, k.hy - k.y);
    if (!live.calm && k.state !== "fall") angle += 0.07 * Math.sin(live.clock * 2.3 + phaseShift);
    sprite(c, index, k.x, k.y, angle, 1);
    c.globalAlpha = 1;
  }

  function draw() {
    const c = live.context, background = live.background;
    if (!c || !background) return;
    const g = game.current, calm = live.calm, t = live.clock, now = phaseRef.current;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, W, H);
    if (live.fog) {
      const off = calm ? 0 : (t * 5) % W;
      c.drawImage(live.fog, -off, 300, W, 60);
      c.drawImage(live.fog, W - off, 300, W, 60);
    }

    // The wind flag on your roof.
    const lean = Math.max(-1, Math.min(1, g.wind / 14)), flap = calm ? 0 : Math.sin(t * 8) * 2;
    c.fillStyle = "#e0563a";
    c.beginPath(); c.moveTo(POLE.x, POLE.top); c.lineTo(POLE.x + (lean >= 0 ? 1 : -1) * (8 + Math.abs(lean) * 10), POLE.top + 5 + flap); c.lineTo(POLE.x, POLE.top + 10); c.closePath(); c.fill();

    // The rival first, so your string is always on top.
    const r = g.rival;
    let rivalLook = plan(g).look;
    if (LOOKS[rivalLook].color === lookRef.current.color) rivalLook = (rivalLook + 1) % LOOKS.length;
    const fade = g.phase === "break" ? Math.max(0, g.breakLeft / BREAK_TIME) : 1;
    drawKiteLine(c, g, r, rivalLook, palette.rival, r.state === "fall" ? Math.min(1, r.timer / 0.5) * fade : fade, 1.7);
    const you = g.you;
    drawKiteLine(c, g, you, LOOKS.length, palette.you, you.state === "fall" ? Math.min(1, you.timer / 0.5) : 1, 0);

    if (g.hooked) {
      c.beginPath(); c.arc(g.hook.x, g.hook.y, calm ? 7 : 7 + Math.sin(t * 5) * 1.2, 0, TAU);
      strokeString(c, palette.cream, 2);
    }

    // ভো-কাট্টা! pops where the strings met, then rises and fades. No flashing.
    const since = t - live.pop.at;
    if (since >= 0 && since < POP_TIME) {
      const grow = !calm && since < 0.15 ? 1.35 - (since / 0.15) * 0.35 : 1;
      c.globalAlpha = since < 0.9 ? 1 : 1 - (since - 0.9) / (POP_TIME - 0.9);
      c.save();
      c.translate(live.pop.x, live.pop.y - (calm ? 0 : since * 12)); c.scale(grow, grow);
      c.font = live.pop.cut ? FONT_POP : FONT_POP_SMALL; c.textAlign = "center"; c.lineJoin = "round";
      c.lineWidth = 6; c.strokeStyle = palette.ink;
      const text = live.pop.cut ? "ভো-কাট্টা!" : "কেটে গেল!";
      c.strokeText(text, 0, 0);
      c.fillStyle = live.pop.cut ? palette.window : "#ffb2a6";
      c.fillText(text, 0, 0);
      c.restore();
      c.globalAlpha = 1;
    }

    // The round clock along the top, and the tug of a প্যাঁচ under it.
    c.fillStyle = palette.halo;
    c.beginPath(); c.roundRect(12, 8, W - 24, 5, 3); c.fill();
    const left = g.phase === "fly" ? timeLeft(g) : 0;
    if (left > 0) { c.fillStyle = palette.cream; c.beginPath(); c.roundRect(12, 8, (W - 24) * (left / ROUND_TIME), 5, 3); c.fill(); }
    c.font = FONT_HUD; c.fillStyle = palette.cream; c.textAlign = "left";
    c.fillText(ROUND_LABELS[g.round], 12, 29);
    c.textAlign = "right";
    c.fillText(SECONDS[Math.ceil(left)], W - 12, 29);
    if (g.hooked) {
      const x0 = 112, x1 = 248, split = (x0 + x1) / 2 + g.tug * (x1 - x0) / 2;
      c.fillStyle = palette.halo; c.beginPath(); c.roundRect(x0 - 2, 18, x1 - x0 + 4, 12, 6); c.fill();
      c.fillStyle = palette.you; c.fillRect(x0, 20, split - x0, 8);
      c.fillStyle = palette.rival; c.fillRect(split, 20, x1 - split, 8);
      c.fillStyle = palette.ink; c.fillRect(split - 1, 17, 2, 14);
      sprite(c, LOOKS.length, x0 - 14, 25, 0, 0.55);
      sprite(c, rivalLook, x1 + 14, 25, 0, 0.55);
    }

    // The needle on the tension meter, and a ring round the zone it is in.
    const tension = you.tension, nx = meterX(tension);
    const from = tension < LO ? 0 : tension <= HI ? LO : HI, to = tension < LO ? LO : tension <= HI ? HI : 1;
    c.strokeStyle = "#fff"; c.lineWidth = 2;
    c.beginPath(); c.roundRect(METER.x + from * METER.w, METER.y - 1, (to - from) * METER.w, METER.h + 2, 6); c.stroke();
    c.globalAlpha = you.state === "fly" || now === "ready" ? 1 : 0.45;
    c.fillStyle = palette.ink; c.beginPath(); c.roundRect(nx - 4, METER.y - 6, 8, METER.h + 12, 3); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.roundRect(nx - 2.5, METER.y - 4.5, 5, METER.h + 9, 2); c.fill();
    c.globalAlpha = 1;
    c.textAlign = "left";
    c.restore();
  }

  function paintSprites() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const sw = KITE_R * 2.2 + 4, sh = KITE_R * 2.4 + 8;
    [...LOOKS, lookRef.current].forEach((item, index) => {
      const s = live.sprites[index] ??= document.createElement("canvas");
      s.width = Math.ceil(sw * k); s.height = Math.ceil(sh * k);
      const sc = s.getContext("2d")!;
      sc.setTransform(k, 0, 0, k, 0, 0);
      sc.clearRect(0, 0, sw, sh);
      drawKite(sc, { ...item, text: "" }, sw / 2, KITE_R + 4, KITE_R, 0);
    });
    Object.assign(live, { sw, sh });
  }

  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d")!;
    b.setTransform(k, 0, 0, k, 0, 0);
    paintScene(b);
    const fog = live.fog ??= document.createElement("canvas");
    fog.width = Math.round(W * k); fog.height = Math.round(60 * k);
    const f = fog.getContext("2d")!;
    f.setTransform(k, 0, 0, k, 0, 0);
    paintFog(f);
    paintSprites();
  }

  useGameLoop(tick, draw, phase === "playing" || (phase === "ready" && boardInView) || settling);

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    live.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const scale = width / W, height = Math.round(H * scale);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      Object.assign(live, { width, scale, context: fitCanvas(element, width, height) });
      paint();
      draw();
    };
    layout();
    // The meter's labels are canvas text: paint again once the Bangla font is in.
    loadCardFonts("টান ঠিক বেশি ঢিল রাউন্ড ১/৩").then(() => { if (live.context) { paint(); draw(); } }).catch(() => {});
    const observer = new ResizeObserver(layout);
    observer.observe(box);
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
    try { if (localStorage.getItem(TOGGLE_KEY) === "1") setToggleMode(true); } catch { /* private mode: fine */ }
    // A kite made in ঘুড়ি আর ফানুস can arrive in the hash; fly that one.
    const made = lookFromGhuri(window.location.hash);
    if (made) setLook(made);
    if (!parseShared(window.location.hash)) reset(newSeed());
    readFriend();
    const hide = () => { if (document.hidden) pause(); };
    window.addEventListener("hashchange", readFriend);
    window.addEventListener("blur", letGo);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); window.removeEventListener("blur", letGo); document.removeEventListener("visibilitychange", hide); };
  }, []);

  // Scrolling the sky away mid-game pauses it.
  useEffect(() => { if (!boardInView) pause(); }, [boardInView]);
  useEffect(() => { draw(); }, [slow]);
  useEffect(() => { if (live.context) { paintSprites(); draw(); } }, [look]);

  const keyHandler = useRef<(event: KeyboardEvent, down: boolean) => void>(() => {});
  keyHandler.current = (event, down) => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key, now = phaseRef.current, active = now === "ready" || now === "playing";
    const dir = key === "ArrowLeft" ? "left" : key === "ArrowRight" ? "right" : key === "ArrowUp" ? "up" : key === "ArrowDown" ? "down" : null;
    if (dir) {
      if (!active || !boardInView) return;
      live.keys[dir] = down;
      event.preventDefault();
      if (down) start();
      return;
    }
    if (key === " " || key === "Enter") {
      const onPull = Boolean(target?.closest?.(".vk-pull"));
      if (!onPull && (target?.closest?.("button, a, summary") || !boardInView)) return;
      event.preventDefault();
      if (now === "paused") { if (down) resume(); return; }
      if (now === "over") { if (down && !onPull) restart(); return; }
      if (down) start();
      if (toggleRef.current) { if (down && !event.repeat) live.pull.toggle = !live.pull.toggle; }
      else live.pull.key = down;
      syncPulling();
      return;
    }
    if (!down || !boardInView) return;
    if (key === "Escape" || key === "p" || key === "P") { if (now === "playing") pause(); else resume(); }
  };
  useEffect(() => {
    const down = (event: KeyboardEvent) => keyHandler.current(event, true);
    const up = (event: KeyboardEvent) => keyHandler.current(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ভো-কাট্টা! ১২৩৪টা ঘুড়ি কাটল").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { cuts: friend.cuts, name: friend.name, look: friend.look ?? LOOKS[0] }, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  // Keep following a finger that slides off the element; a pointer that is already gone can't be captured, and that's fine.
  const capture = (event: ReactPointerEvent<HTMLElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* nothing to follow */ } };

  // Drag anywhere on the sky: the kite follows the slide, never under the thumb. A still tap sends it to that spot.
  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || (event.target as Element).closest("button") || live.gesture.id !== -1) return;
    const now = phaseRef.current;
    if (now !== "ready" && now !== "playing") return;
    Object.assign(live.gesture, { id: event.pointerId, lastX: event.clientX, lastY: event.clientY, startX: event.clientX, startY: event.clientY, moved: false });
    capture(event);
    start();
  }
  function onBoardMove(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.lastX, dy = event.clientY - gesture.lastY;
    gesture.lastX = event.clientX; gesture.lastY = event.clientY;
    if (!gesture.moved && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) > TAP_SLOP) gesture.moved = true;
    if (phaseRef.current === "playing") steerBy(game.current, (dx * GAIN) / live.scale, (dy * GAIN) / live.scale);
  }
  function onBoardUp(event: ReactPointerEvent<HTMLDivElement>) {
    const gesture = live.gesture;
    if (event.pointerId !== gesture.id) return;
    gesture.id = -1;
    const box = canvas.current?.getBoundingClientRect();
    if (!gesture.moved && box && phaseRef.current === "playing") steerTo(game.current, (event.clientX - box.left) / live.scale, (event.clientY - box.top) / live.scale);
  }

  // টান: held down by default; with "এক চাপে টান" each press switches it on or off.
  function onPullDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button > 0) return;
    capture(event);
    const now = phaseRef.current;
    if (now !== "ready" && now !== "playing") return;
    start();
    if (toggleRef.current) live.pull.toggle = !live.pull.toggle;
    else live.pull.pointer = true;
    syncPulling();
  }
  function onPullUp() { if (live.pull.pointer) { live.pull.pointer = false; syncPulling(); } }
  function switchMode() {
    const next = !toggleMode;
    setToggleMode(next);
    try { localStorage.setItem(TOGGLE_KEY, next ? "1" : "0"); } catch { /* private mode: fine */ }
    letGo();
  }
  function nextLook() {
    const index = LOOKS.findIndex(item => sameLook(item, look));
    setLook(LOOKS[(index + 1) % LOOKS.length]);
  }
  function seeCard() {
    resultBox.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }
  function playFromCard() {
    reset(friend ? friend.seed : newSeed());
    go("ready");
    play.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  const rival = friend ? possessive(friend.name || "বন্ধু") : "";
  const over = phase === "over" && result;
  const line = phase === "ready" ? HINTS.start : phase === "paused" ? "থেমে আছে। তৈরি হলে চালিয়ে যাও।" : phase === "over" ? "সন্ধ্যা নামল, নাটাই গোটাও!" : HINTS[hint];
  const tone = phase === "playing" && (hint === "good" || hint === "pull" || hint === "tight") ? hint : "plain";

  return (
    <div className="vk">
      {friend && (
        <section className="vk-friend" aria-labelledby="vk-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${rival} কার্ড: ${bn(friend.cuts)}টা ঘুড়ি কাটা`} />
          <div>
            <h2 id="vk-friend-title">{banner(friend)}</h2>
            <p>{rival} নিজের ফোনের স্কোর</p>
          </div>
        </section>
      )}

      <div className="vk-hud">
        <p className="vk-score"><span>কাটলে</span><b>{bn(cuts)}</b><span>টা</span></p>
        {best !== null && <p className="vk-best"><span>সেরা</span><b>{bn(best)}</b></p>}
        <button type="button" className="vk-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="12" r="5.5" /><path d="M10 12a2 2 0 1 0 2-2M2.5 18h15a3 3 0 0 0 3-3v-4m0 0-1.2-3m1.2 3 1.8-2.4" /></svg>ধীরে খেলো
        </button>
        <button type="button" className="vk-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"} aria-label={phase === "paused" ? "চালিয়ে যাও" : "একটু থামাও"}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{phase === "paused" ? <path d="M8 5v14l11-7z" className="vk-fill" /> : <path d="M9 5v14M15 5v14" />}</svg>
        </button>
      </div>

      <div className="vk-play" ref={play} data-phase={phase}>
        <div className="vk-board" ref={board} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={onBoardUp} onPointerCancel={() => { live.gesture.id = -1; }}>
          <canvas ref={canvas} role="img" aria-label={`সাকরাইনের সন্ধ্যার আকাশ, ছাদে ছাদে ঘুড়ি। রাউন্ড ${bn(round + 1)}, কাটলে ${bn(cuts)}টা।`} />
          {phase === "ready" && (
            <div className="vk-overlay" data-at="low">
              <div className="vk-note">
                <button type="button" className="kit-primary" onClick={start}>শুরু করো</button>
                <button type="button" className="kit-link vk-look" onClick={nextLook}>ঘুড়ি বদলাও</button>
              </div>
            </div>
          )}
          <p className="screen-reader-only" aria-live="polite">{over && result ? `খেলা শেষ। ${bn(result.cuts)}টা ঘুড়ি কাটলে। ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : phase === "playing" && breakRound !== null ? `রাউন্ড ${bn(breakRound + 1)} · ${ROOFS[breakRound].name}` : ""}</p>
          {phase === "playing" && breakRound !== null && (
            <div className="vk-overlay">
              <div className="vk-note vk-round">
                <p className="vk-round-no">রাউন্ড {bn(breakRound + 1)} · {ROOFS[breakRound].name}</p>
                <p>{ROOFS[breakRound].note}</p>
              </div>
            </div>
          )}
          {phase === "paused" && (
            <div className="vk-overlay vk-block">
              <div className="vk-note">
                <p className="vk-howto">থেমে আছে। তৈরি হলে চাপো।</p>
                <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
              </div>
            </div>
          )}
          {over && (
            <div className="vk-overlay vk-block">
              <div className="vk-note vk-slip">
                <h2>{result.cuts > 0 ? "ভো-কাট্টা!" : "সন্ধ্যা নামল!"}</h2>
                <p className="vk-final"><b>{bn(result.cuts)}</b>টা ঘুড়ি কাটলে</p>
                <p className="vk-record">{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && best > result.cuts ? `এই ফোনে সেরা ${bn(best)}টা` : humanLine(result.cuts)}</p>
                {friend && <p className="vk-versus">{compareLine(result.cuts, friend.cuts, friend.name)}</p>}
                <button type="button" className="kit-link vk-see" onClick={seeCard}>কার্ড বানাও, বন্ধুকে পাঠাও ↓</button>
              </div>
            </div>
          )}
        </div>

        {/* The tension hints flip several times a second during a প্যাঁচ; only the calmer lines are announced. */}
        <p className="vk-hint" data-tone={tone} aria-live={tone === "plain" ? "polite" : "off"}>{line}</p>

        <div className="vk-controls">
          {phase === "over" ? (
            <button type="button" className="kit-primary vk-again" onClick={restart} disabled={!restartReady}>আরেকবার</button>
          ) : (
            <>
              <button
                type="button" className="vk-pull" data-on={pulling}
                aria-pressed={toggleMode ? pulling : undefined}
                aria-label={toggleMode ? "টান: চাপলে চালু, আবার চাপলে বন্ধ" : "টান: চেপে ধরে রাখো"}
                onPointerDown={onPullDown} onPointerUp={onPullUp} onPointerCancel={onPullUp} onLostPointerCapture={onPullUp}
                onClick={event => { if (event.detail === 0 && toggleMode) { live.pull.toggle = !live.pull.toggle; syncPulling(); } }}
                onContextMenu={event => event.preventDefault()}
              >
                <b>টান</b>
                <span>{pulling ? "টান চলছে…" : toggleMode ? "চাপো: চালু-বন্ধ" : "চেপে ধরো"}</span>
              </button>
              <button type="button" className="vk-mode" aria-pressed={toggleMode} onClick={switchMode}>এক চাপে টান</button>
            </>
          )}
        </div>
        <p className="vk-safety">সত্যিকারের ঘুড়ি? খোলা মাঠে ওড়াও, বিদ্যুতের তারের কাছে না।</p>
      </div>

      <section className="vk-result" id="result" ref={resultBox} aria-labelledby="vk-result-title">
        <div className="vk-result-head">
          <h2 id="vk-result-title">{result ? <><em>{bn(result.cuts)}টা ঘুড়ি</em> কাটলে, কার্ড তৈরি</> : "খেলা শেষে তোমার ভো-কাট্টার কার্ড"}</h2>
          <p>{result ? friend ? compareLine(result.cuts, friend.cuts, friend.name) : humanLine(result.cuts) : "একবার খেললেই এখানে স্কোরসহ একটা কার্ড আসবে। বন্ধুকে পাঠালে সে একই বাতাস আর একই ছাদের ঘুড়ি পাবে।"}</p>
        </div>
        {card && (
          <div className="vk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="vk-card-summary" />
              <figcaption id="vk-card-summary" className="vk-sr">ভো-কাট্টার কার্ড: {cutLine(card.cuts, card.name)}। {humanLine(card.cuts)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="vk-share">
              <label className="vk-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="vo-katta.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে একই বাতাস পাবে, একই ছাদ থেকে একইভাবে ঘুড়ি উঠবে।" />
              <button type="button" className="kit-link vk-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
