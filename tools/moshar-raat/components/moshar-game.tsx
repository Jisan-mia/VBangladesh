"use client";
// IP: what we avoided — no real mosquito-bat, coil or repellent brand, logo, packaging or ad jingle, and no whack-a-mole game's look; ours is an unbranded yellow-and-blue bat in a dark Bangladeshi bedroom (খাট, কাঁথা, ঘুলঘুলি) with round cartoon mosquitoes that turn into grey specks, never anything gory.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, DISPLAY_FONT, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawBat, drawBug, drawDanger, drawDawnBar, drawFallen, drawRoom, drawWindow } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  bannerNote, bn, caption, clearLine, compareLine, feat, guardLabel, hitWord, humanLine, levelLabel, lossLine, nearMissLine, newsLine, parseShared, sharedHash, tallyLine,
  type Shared,
} from "../lib/link";
import { closest, makeNight, starsOf, step, swing, toDawn, BIT, FLY, H, LEVEL_COUNT, MAX_BITES, PILLOW_X, PILLOW_Y, W, ZAPPED, type Night } from "../lib/night";
import { bite, crackle, lightSwitch, swish, whine } from "../lib/sound";

const TOOL = "moshar-raat";
const MAX_WIDTH = 480;
const SLOW = 0.6;
const SPARKS = 28, POPS = 6;
const SMALL_FONT = `800 15px ${DISPLAY_FONT}`, POP_FONT = `800 19px ${DISPLAY_FONT}`;
/** A mosquito this close to what it's after makes the "পিন-পিন" show and the ring pulse. */
const DANGER = 72;
/** The whine starts to be heard at this distance. */
const HEAR = 230;

type Phase = "ready" | "play" | "won" | "lost";
type Result = { zaps: number; bites: number; stars: number; improved: boolean; best: boolean; secondsLeft: number };

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null, scale: 1,
    background: null as HTMLCanvasElement | null, painted: "",
    night: makeNight(1, 1) as Night, phase: "ready" as Phase,
    paused: false, calm: false, reduced: false, clock: 0,
    facing: new Int8Array(64).fill(1),
    batX: W / 2, batY: H / 2, batT: 9, batGlow: 0,
    aimX: W / 2, aimY: 220, keys: false,
    sx: new Float32Array(SPARKS), sy: new Float32Array(SPARKS), svx: new Float32Array(SPARKS), svy: new Float32Array(SPARKS), slife: new Float32Array(SPARKS), spark: 0,
    popX: new Float32Array(POPS), popY: new Float32Array(POPS), popT: new Float32Array(POPS).fill(9), popText: Array<string>(POPS).fill(""), pop: 0,
    biteT: 9, biteX: 0, biteY: 0,
    danger: -1, whine: null as ReturnType<typeof whine> | null, whineTick: 0,
  };
}

export function MosharGame() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(1);
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [zaps, setZaps] = useState(0);
  const [bites, setBites] = useState(0);
  const [danger, setDanger] = useState(false);
  const [note, setNote] = useState("");
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`);
  const [live] = useState(makeLive);

  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const chosen = useRef(false);
  const demoRef = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const spec = live.night.spec;
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = result && phase === "won" ? { level, seed, zaps: result.zaps, bites: result.bites, name } : null;
  const state = shared ? sharedHash(shared) : "";

  function setPhase(next: Phase) { live.phase = next; setPhaseState(next); }
  function stopWhine() { live.whine?.stop(); live.whine = null; }

  /** The still room for this night's bed (with or without the মশারি), drawn once per layout or night type. */
  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio, n = live.night;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d");
    if (!b) return;
    b.setTransform(k, 0, 0, k, 0, 0);
    drawRoom(b, n.spec.guard, n.spec.holes);
    live.painted = `${n.spec.guard}${n.spec.holes.join()}|${k}`;
  }

  /** A fresh night. `play` skips the start screen (for আরেকবার); otherwise it waits on শুরু করো. */
  function startNight(next: number, nightSeed = newSeed(), play = false, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    stopWhine();
    live.night = makeNight(next, nightSeed);
    Object.assign(live, { paused: false, batT: 9, biteT: 9, danger: -1, spark: 0 });
    live.slife.fill(0); live.popT.fill(9); live.facing.fill(1);
    if (live.context && live.painted.split("|")[0] !== `${live.night.spec.guard}${live.night.spec.holes.join()}`) paint();
    setLevel(next); setSeed(nightSeed); setZaps(0); setBites(0); setDanger(false); setNote(""); setResult(null); setPaused(false);
    demoRef.current = false;
    setPhase(play ? "play" : "ready");
    if (play) lightSwitch();
    draw();
  }

  function begin() {
    if (live.phase !== "ready") return;
    chosen.current = true;
    lightSwitch();
    setPhase("play");
  }

  function finish() {
    stopWhine();
    const n = live.night, secondsLeft = toDawn(n);
    live.danger = -1;
    setDanger(false);
    if (n.over === "lost") {
      setResult({ zaps: n.zaps, bites: n.bites, stars: 0, improved: false, best: false, secondsLeft });
      setPhase("lost");
      sfx.lose();
      return;
    }
    const stars = starsOf(n.level, n.zaps, n.bites);
    const before = levels.stars[n.level] ?? 0;
    levels.record(n.level, stars);
    const beaten = submitBest(n.zaps);
    setResult({ zaps: n.zaps, bites: n.bites, stars, improved: before > 0 && stars > before, best: beaten && before > 0, secondsLeft });
    setPhase("won");
    const colors = ["#ffd166", "#f2c230", "#96d7ff", "#ffffff", "#e0443e"];
    if (n.level === LEVEL_COUNT) { sfx.levelUp(); confetti({ colors }); }
    else if (stars === 3) { sfx.win(); confetti({ colors }); }
    else sfx.good();
  }

  /** Preview images only (`&og=1` on a link): shows the friend's night as finished so the card draws. Saves nothing on the phone. */
  function demo(found: Shared) {
    demoRef.current = true;
    const n = live.night;
    n.t = n.spec.length; n.zaps = found.zaps; n.bites = found.bites; n.over = "won";
    setZaps(found.zaps); setBites(found.bites);
    setResult({ zaps: found.zaps, bites: found.bites, stars: starsOf(found.level, found.zaps, found.bites), improved: false, best: false, secondsLeft: 0 });
    setPhase("won");
    draw();
  }

  function burst(x: number, y: number, hits: number) {
    if (live.calm) return;
    for (let k = 0; k < 6 + hits * 3; k++) {
      const i = live.spark = (live.spark + 1) % SPARKS, a = (k / (6 + hits * 3)) * Math.PI * 2 + live.clock * 3, v = 70 + (k % 3) * 40;
      live.sx[i] = x; live.sy[i] = y; live.svx[i] = Math.cos(a) * v; live.svy[i] = Math.sin(a) * v; live.slife[i] = 0.32;
    }
  }

  function pop(x: number, y: number, text: string) {
    const i = live.pop = (live.pop + 1) % POPS;
    live.popX[i] = x; live.popY[i] = y; live.popT[i] = 0; live.popText[i] = text;
  }

  /** One swing of the bat at (x, y) in board units. */
  function swingAt(x: number, y: number) {
    if (live.phase !== "play" || live.paused) return;
    const n = live.night, hit = swing(n, x, y);
    Object.assign(live, { batX: x, batY: y, batT: 0, batGlow: hit.hits ? 1 : 0 });
    if (hit.hits) {
      crackle(hit.hits);
      if (n.combo >= 3) sfx.combo(n.combo - 3);
      burst(x, y, hit.hits);
      pop(x, y - 34, hitWord(hit.hits, n.combo));
      setZaps(n.zaps);
      setNote("");
    } else {
      swish();
      if (hit.near) { pop(x, y - 34, "একটুর জন্য"); setNote("একটুর জন্য! মশার ঠিক ওপরে চাপো।"); }
    }
  }

  function tick(dt: number) {
    live.clock += dt;
    live.batT += dt; live.biteT += dt;
    if (live.batGlow > 0) live.batGlow = Math.max(0, live.batGlow - dt * 3.5);
    for (let i = 0; i < SPARKS; i++) {
      if (live.slife[i] <= 0) continue;
      live.slife[i] -= dt; live.sx[i] += live.svx[i] * dt; live.sy[i] += live.svy[i] * dt;
    }
    for (let i = 0; i < POPS; i++) if (live.popT[i] < 9) { live.popT[i] += dt; live.popY[i] -= dt * 26; }
    if (live.paused || live.phase !== "play") return;
    const n = live.night, bit = step(n, dt * (slowRef.current ? SLOW : 1));
    for (let i = 0; i < n.bugs.length; i++) {
      const dx = n.x[i] - n.px[i];
      if (dx > 0.05) live.facing[i] = 1; else if (dx < -0.05) live.facing[i] = -1;
    }
    if (bit) {
      const last = n.bugs.findIndex((_, i) => n.state[i] === BIT && n.ended[i] === n.t);
      live.biteT = 0; live.biteX = last >= 0 ? n.bugs[last].tx : PILLOW_X; live.biteY = last >= 0 ? n.bugs[last].ty : PILLOW_Y;
      bite();
      shake(board.current);
      setBites(n.bites);
    }
    const near = closest(n);
    const close = near.index >= 0 && near.distance < DANGER ? near.index : -1;
    if ((close >= 0) !== (live.danger >= 0)) setDanger(close >= 0);
    live.danger = close;
    // The whine follows the nearest mosquito; retuning a few times a second is plenty.
    if (++live.whineTick % 4 === 0) {
      live.whine ??= whine();
      live.whine.set(near.index < 0 ? 0 : Math.max(0, 1 - near.distance / HEAR), Math.sin(live.clock * 9));
    }
    if (n.over) finish();
  }

  function draw() {
    const c = live.context, background = live.background;
    if (!c || !background) return;
    const n = live.night, calm = live.calm;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, W, H);
    const dawn = n.over === "won" ? 1 : n.t / n.spec.length;
    drawWindow(c, dawn * dawn, n.level >= 11 && n.level <= 15, calm ? 0 : live.clock);
    drawDawnBar(c, dawn);
    if (live.danger >= 0) drawDanger(c, n.bugs[live.danger].tx, n.bugs[live.danger].ty, calm ? 0.5 : 0.5 + 0.5 * Math.sin(live.clock * 8));
    for (let i = 0; i < n.bugs.length; i++) {
      const s = n.state[i];
      if (s === FLY) drawBug(c, n.x[i], n.y[i], live.facing[i], calm ? 0.5 : Math.abs(Math.sin(live.clock * 38 + i)));
      else if (s === ZAPPED && n.t - n.ended[i] < 0.6 && !calm) drawFallen(c, n.x[i], n.y[i], (n.t - n.ended[i]) / 0.6);
    }
    c.font = SMALL_FONT;
    c.textAlign = "center";
    if (live.danger >= 0) {
      c.fillStyle = "#ffd278";
      c.fillText("পিন-পিন", n.x[live.danger], n.y[live.danger] - 18);
    }
    if (live.biteT < 0.9) {
      c.fillStyle = "#ffe2e2";
      c.fillText("উঁহু!", live.biteX - 40, live.biteY - 20);
    }
    if (live.batT < 0.3) drawBat(c, live.batX, live.batY, live.batGlow, live.batT < 0.14 ? 1 : 1 - (live.batT - 0.14) / 0.16);
    if (live.keys && live.phase === "play") {
      c.strokeStyle = "#f2c230"; c.lineWidth = 2;
      c.beginPath(); c.arc(live.aimX, live.aimY, 30, 0, Math.PI * 2); c.stroke();
    }
    c.lineWidth = 2; c.lineCap = "round"; c.strokeStyle = "#d6f0ff";
    c.beginPath();
    for (let i = 0; i < SPARKS; i++) {
      if (live.slife[i] <= 0) continue;
      c.moveTo(live.sx[i], live.sy[i]); c.lineTo(live.sx[i] - live.svx[i] * 0.04, live.sy[i] - live.svy[i] * 0.04);
    }
    c.stroke();
    c.font = POP_FONT;
    for (let i = 0; i < POPS; i++) {
      if (live.popT[i] >= 0.7) continue;
      c.globalAlpha = 1 - live.popT[i] / 0.7;
      c.fillStyle = live.popText[i] === "একটুর জন্য" ? "#cfd8f0" : "#ffe27a";
      c.fillText(live.popText[i], live.popX[i], live.popY[i]);
    }
    c.globalAlpha = 1;
    if (n.over === "won") { c.fillStyle = "rgba(255,200,140,0.12)"; c.fillRect(0, 0, W, H); }
    c.restore();
  }

  const looping = !paused && phase === "play" && boardInView;
  useGameLoop(tick, draw, looping);
  useEffect(() => { if (!looping) stopWhine(); }, [looping]);

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
      Object.assign(live, { scale, context: fitCanvas(element, width, height) });
      paint();
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    void loadCardFonts("চট! উঁহু পিন-পিন একটুর জন্য টানা ১২৩").then(draw).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      setFriend(found);
      startNight(found.level, found.seed);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(found);
    };
    const hide = () => {
      if (!document.hidden) return;
      stopWhine();
      if (live.phase === "play") { live.paused = true; setPaused(true); }
    };
    setSite(window.location.host);
    if (!chosen.current) startNight(1, newSeed(), false, false);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopWhine();
    };
  }, []);

  // Open at the next night to win once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    startNight(levels.unlocked, newSeed(), false, false);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`মশার রাত ${levelLabel(level)} ${guardLabel(level)} রাফি ১২৩ ${humanLine(shared)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  function resume() {
    live.paused = false;
    setPaused(false);
  }

  const retry = () => startNight(level, rival ? seed : newSeed(), true);
  const nextNight = () => startNight(level < LEVEL_COUNT ? level + 1 : level);

  // ---- keys: arrows move the ring, Space/Enter swings (or starts, resumes, plays on) ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]") || !boardInView) return;
    const key = event.key;
    if (key.startsWith("Arrow") && live.phase === "play" && !live.paused) {
      event.preventDefault();
      live.keys = true;
      if (key === "ArrowLeft") live.aimX = Math.max(20, live.aimX - 12);
      if (key === "ArrowRight") live.aimX = Math.min(W - 20, live.aimX + 12);
      if (key === "ArrowUp") live.aimY = Math.max(20, live.aimY - 12);
      if (key === "ArrowDown") live.aimY = Math.min(H - 30, live.aimY + 12);
      return;
    }
    if (key !== " " && key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (live.paused) resume();
    else if (live.phase === "ready") begin();
    else if (live.phase === "play") { live.keys = true; swingAt(live.aimX, live.aimY); }
    else if (live.phase === "lost") retry();
    else if (live.phase === "won") nextNight();
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || live.phase !== "play" || live.paused || (event.target as Element).closest("button")) return;
    const rect = event.currentTarget.getBoundingClientRect();
    live.keys = false;
    swingAt((event.clientX - rect.left) / live.scale, (event.clientY - rect.top) / live.scale);
  }

  const total = totalStars(levels.stars);
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const newcomer = !levels.stars[1] && level === 1 && !friend;
  const net = spec.guard === "net";
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });

  function statusLine() {
    if (note) return note;
    if (danger) return net ? "পিন-পিন! ফুটোর কাছে মশা।" : "পিন-পিন! বালিশের কাছে মশা।";
    if (newcomer && zaps === 0) return "মশার ওপর চাপো।";
    return net ? "মশা ঢুকতে চায় মশারির ফুটো দিয়ে। ভোর পর্যন্ত পাহারা দাও।" : "ভোর পর্যন্ত বালিশ বাঁচাও। কামড় তিনটা হলে ঘুম ভাঙবে।";
  }

  return (
    <div className="mr" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="mr-friend" aria-labelledby="mr-friend-title">
          <h2 id="mr-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend.name)}</p>
        </section>
      )}

      <div className="mr-hud">
        <p className="mr-level"><b>{levelLabel(level)}</b><span>{guardLabel(level)} · ★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>
        <p className="mr-chips">
          <span className="mr-chip" aria-label={`${bn(spec.count)}টা মশার ${bn(zaps)}টা মারা হয়েছে`}>মশা {bn(zaps)}/{bn(spec.count)}</span>
          <span className="mr-chip mr-bites" data-hurt={bites > 0 || undefined} aria-label={`কামড় ${bn(bites)}টা, ${bn(MAX_BITES)}টা হলে ঘুম ভাঙবে`}>কামড় {bn(bites)}/{bn(MAX_BITES)}</span>
        </p>
      </div>

      <div className="mr-board" ref={board} data-phase={phase} onPointerDown={onPointerDown}>
        <canvas ref={canvas} role="img" aria-label={`বাতি নেভানো ঘর, খাটে ${net ? "মশারির ভেতরে " : ""}কেউ ঘুমাচ্ছে। মশার ওপর চাপলে ব্যাট নামবে। এ পর্যন্ত ${bn(zaps)}টা মশা মারা, কামড় ${bn(bites)}টা।`} />
        {phase === "ready" && (
          <div className="mr-overlay mr-lit">
            <p className="mr-night">{levelLabel(level)} · {guardLabel(level)}</p>
            <p className="mr-news">{newsLine(level)}</p>
            <button type="button" className="kit-primary" onClick={begin}>শুরু করো</button>
            {level === 1 && <p className="mr-small">ভোর পর্যন্ত বালিশ বাঁচাও। কামড় তিনটা হলে ঘুম ভাঙবে।</p>}
          </div>
        )}
        {paused && (
          <div className="mr-overlay">
            <p>খেলা থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {phase === "won" && result ? (
        <div className="mr-end" role="status">
          <StarReveal count={result.stars} />
          <p className="mr-end-line">{clearLine(level)}</p>
          <p className="mr-end-note">
            {tallyLine({ level, zaps: result.zaps, bites: result.bites })}।{" "}
            {rival ? compareLine(result, rival, rival.name)
              : result.improved ? `এই রাতে নতুন রেকর্ড, ${bn(result.stars)} তারা!`
              : result.best ? `এই রাতে তোমার সবচেয়ে বেশি, ${bn(result.zaps)}টা!`
              : nearMissLine(level, result.zaps, result.bites)}
          </p>
          {best !== null && !rival && <p className="mr-best">এই রাতে তোমার সেরা: {bn(best)}টা মশা</p>}
          <div className="mr-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={nextNight}>পরের রাত</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={retry}>আবার খেলো</button>
          </div>
          {shared && <button type="button" className="kit-link mr-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
        </div>
      ) : phase === "lost" && result ? (
        <div className="mr-end mr-lost" role="status">
          <p className="mr-lost-title">{bn(MAX_BITES)}টা কামড়, ঘুম ভেঙে গেল</p>
          <p className="mr-lost-line">{lossLine(level, result.secondsLeft)}</p>
          {rival && <p className="mr-end-note">{rival.name || "বন্ধু"} এই রাতে {bn(rival.zaps)}টা মশা মেরেছিল।</p>}
          <button type="button" className="kit-primary mr-again" onClick={retry}>আরেকবার</button>
        </div>
      ) : (
        <p className="mr-status" role="status" aria-live="polite">{phase === "ready" ? "শুরু করো চাপলে বাতি নিভবে, মশা আসবে।" : statusLine()}</p>
      )}

      <div className="mr-prefs">
        <button type="button" className="mr-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={() => stopWhine()} />
      </div>

      <details className="mr-drawer">
        <summary>সব রাত <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="mr-stages">মশারির রাত: ৫, ৮, ১৩, ১৫, ১৮। বাকি রাতে বালিশ পাহারা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} noun="রাত" onPick={pick => { startNight(pick); toTop(); }} />
      </details>

      <section className="mr-result" id="result" ref={resultBox} aria-labelledby="mr-result-title">
        <h2 id="mr-result-title">{shared ? <><em>{bn(shared.zaps)}টা মশা</em> তোমার ব্যাটে</> : "রাত পার হলে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared) : "ভোর পর্যন্ত টিকলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই রাত, একই মশা পাবে।"}</p>
        {shared && result && (
          <div className="mr-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`মশার রাতের কার্ড: ${levelLabel(level)}, ${tallyLine(shared)}, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="mr-share">
              <label className="mr-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`moshar-raat-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই রাত, একই মশা পাবে। স্কোরটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
