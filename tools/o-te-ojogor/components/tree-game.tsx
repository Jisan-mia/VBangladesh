"use client";
// IP: what we avoided — no specific বর্ণ পরিচয় book's text, layout, illustrations or cover, and no falling-letter app's look; our picture words are the common primer pairs plus our own picks, every drawing is new code art (a round green অজগর with a smile, not a scary snake), and the tree, fruit and cane basket are our own.
// Thin React over the pure game: lib/session.ts decides when anything may move, lib/step.hot.ts moves the tree, lib/draw.hot.ts draws it.
// A kids' page: nothing the child does leaves the phone. The card and the tool's link sit behind the parent gate.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { StarReveal } from "../../../shared/game-ui";
import { useGamePlayer } from "../../../shared/game-player-client";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, useKidsSession } from "../../../shared/kids-kit";
import { drawPicture, drawScene, drawTitleArt, fruitFont, paintBasket } from "../lib/art";
import { cardBlob, cardFontSample, drawCard, type CardData } from "../lib/draw-card";
import { drawFrame } from "../lib/draw.hot";
import { makeView } from "../lib/view";
import { decoyPool, finaleName, levelOf, LEVEL_COUNT, LEVELS, WORLDS, worldIndex } from "../lib/levels";
import { badgeTitle, bn, cleanHash, clearLine, hintLine, levelLabel, lookLine, missLine, MODES, newsLine, nounOf, parseShared, shortTitle, tallyLine, wrongLine, type Shared } from "../lib/link";
import { afterClear, nextUp, playable, readMode, readOpened, readUnlock, recommended, withOpened, LINKS_KEY, MODE_KEY, UNLOCK_KEY } from "../lib/progress";
import {
  again as sessionAgain, back, closeList, createSession, endLive, finish as sessionFinish, grab, home as sessionHome, leave, letGo,
  moving, openList, pause as sessionPause, resume as sessionResume, start as sessionStart, tapCounts, type Phase,
} from "../lib/session";
import { boing, chime, rustle, thump } from "../lib/sound";
import { step } from "../lib/step.hot";
import {
  aim, firstTries, fruitAt, hinting, hold, makeGame, nudge, pickAbove, pickFruit, starsOf,
  EV_CATCH, EV_DONE, EV_MISS, EV_NEAR, EV_ROUND, EV_WRONG, H, LANES, PICK_RIGHT, PICK_WRONG, W, type Game, type Mode,
} from "../lib/tree";

const TOOL = "o-te-ojogor";
const MAX_WIDTH = 480;
/** ঝড়ো হাওয়া in ধীরে খেলো falls at this speed. */
const SLOW = 0.6;
const MODES_LIST: Mode[] = ["calm", "wind"];
const COLORS = ["#ffd447", "#ffb38a", "#c9ec8f", "#d9c8ff", "#2f7d32"];

type Result = { level: number; slips: number; first: number; stars: number; finale: boolean };
/** The line beside the picture: the last picture word, or what just went wrong. */
type Show = { kind: "pic"; pic: string; text: string } | { kind: "note"; text: string } | null;

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const calmPhone = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("ektukhani-slow") === "1"; } catch { return false; } };

/** A number that counts up from 0 over 0.7 s (at once in ধীরে খেলো). */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (calmPhone()) { setShown(value); return; }
    let frame = 0;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / 700);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{bn(shown)}</>;
}

/** The title's start art, drawn in code and redrawn when its box or world changes. */
function TitleArt({ world }: { world: Game["spec"]["world"] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const paint = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (width && height) drawTitleArt(fitCanvas(element, width, height), width, height, world);
    };
    paint();
    void loadCardFonts("অআইকখগ১২৩বম").then(paint).catch(() => {});
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    return () => observer.disconnect();
  }, [world]);
  return <canvas ref={ref} className="oj-start-art" data-tile aria-hidden="true" />;
}

/** The two end-screen pictures: a circling arrow (আবার খেলো) and the tree at rest (শেষ). */
const AgainIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><path d="M36 6v10H26" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const DoneIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="17" r="13" fill="currentColor" opacity=".9" /><rect x="21" y="26" width="6" height="16" rx="2" fill="currentColor" /><path d="M8 43h32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>;

export function OjogorGame() {
  const [session] = useState(createSession);
  const [view] = useState(makeView);
  const [firstGame] = useState(() => makeGame(1, 1));
  const game = useRef<Game>(firstGame);
  const [phase, setPhase] = useState<Phase>("title");
  const [paused, setPaused] = useState(false);
  const [picking, setPicking] = useState(false);
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const [mode, setModeState] = useState<Mode>("calm");
  const modeRef = useRef<Mode>("calm");
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState<Show>(null);
  const [showKey, setShowKey] = useState(0);
  const [danger, setDanger] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [unlock, setUnlock] = useState(1);
  const unlockRef = useRef(1);
  const [slow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const { resting, atBreak, extend } = useKidsSession();
  const link = useRef<Shared | null>(null);
  const [opened, setOpened] = useState<number[]>([]);
  const chosen = useRef(false);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  session.resting = resting;
  const root = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const picture = useRef<HTMLCanvasElement>(null);
  const chip = useRef<HTMLParagraphElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const dangerRef = useRef(false);
  const worldRef = useRef(-1);
  /** The game's keys work only while the stage is on screen, so Space still scrolls the page below it. */
  const inView = useRef(true);

  const spec = levelOf(level);
  const items = spec.items;
  const want = items[Math.min(index, items.length - 1)];
  const wordAt = items.slice(index).find(item => item.word)?.word ?? "";
  const done = phase === "done";
  const card: CardData | null = result ? { level: result.level, slips: result.slips } : null;

  const sync = () => { setPhase(session.phase); setPaused(session.paused); setPicking(session.picking); };
  function say(next: Show) { setShow(next); setShowKey(key => key + 1); }

  /** Every text a fruit of this level can carry gets its font once, so the frame never measures or builds strings. */
  function prepareFonts(levelNumber: number) {
    const c = context.current;
    if (!c) return;
    const world = levelOf(levelNumber).world;
    for (const text of [...levelOf(levelNumber).items.map(item => item.text), ...decoyPool(world)]) if (!view.fonts.has(text)) view.fonts.set(text, fruitFont(c, text));
  }

  /** The still layers for this board size and world: the tree scene and the basket. */
  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = view.scale * ratio;
    const background = view.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d");
    if (!b) return;
    b.setTransform(k, 0, 0, k, 0, 0);
    drawScene(b, game.current.spec.world);
    view.basket = paintBasket(k);
    worldRef.current = worldIndex(game.current.level);
  }

  function draw() {
    const c = context.current;
    if (c) drawFrame(c, game.current, view);
  }

  const seedFor = (next: number) => link.current?.level === next ? link.current.seed : newSeed();

  /** A fresh tree for `next`, on the title (nothing moves until খেলো). */
  function prepare(next: number) {
    levelRef.current = next;
    game.current = makeGame(next, seedFor(next), modeRef.current);
    view.finger = false; view.popT = 9; dangerRef.current = false;
    setLevel(next); setIndex(0); say(null); setDanger(false);
    if (worldIndex(next) !== worldRef.current) paint();
    prepareFonts(next);
    draw();
  }

  /** খেলো: a new round of the chosen level. Past today's limit the rest screen comes instead. */
  function begin() {
    if (!sessionStart(session, atBreak())) { sync(); return; }
    chosen.current = true;
    prepare(levelRef.current);
    setResult(null); setShowing(false);
    sfx.tap();
    sync();
  }

  function finish() {
    const g = game.current, stars = starsOf(g.level, g.slips);
    // The stars and today's limit are settled the moment the round is won, never in a timer a quick tap could cancel.
    levels.record(g.level, stars);
    const opened = afterClear(unlockRef.current, g.level, LEVEL_COUNT);
    if (opened !== unlockRef.current) { unlockRef.current = opened; setUnlock(opened); write(UNLOCK_KEY, String(opened)); }
    sessionFinish(session, performance.now(), atBreak());
    const finale = Boolean(g.spec.milestone);
    setResult({ level: g.level, slips: g.slips, first: firstTries(g), stars, finale });
    view.finger = false;
    if (finale) { sfx.levelUp(); confetti({ colors: COLORS }); } else sfx.good();
    sync();
  }

  /** আবার খেলো: the same level, a fresh tree (the link's tree when this is the link's level). */
  function playAgain() {
    if (!sessionAgain(session, performance.now(), atBreak())) { sync(); return; }
    prepare(levelRef.current);
    setResult(null); setShowing(false);
    sfx.tap();
    sync();
  }

  /** শেষ: back to the title with the next level ready. Nothing starts until খেলো. */
  function finishUp() {
    if (!endLive(session, performance.now())) return;
    sessionHome(session);
    setResult(null); setShowing(false);
    prepare(nextUp(levelRef.current, unlockRef.current, LEVEL_COUNT));
    sync();
  }

  /** নতুন করে শুরু, a picked level, a link: this level's title. */
  function toTitle(next: number) {
    sessionHome(session);
    setResult(null); setShowing(false);
    prepare(next);
    sync();
  }

  function chooseMode(next: Mode) {
    if (session.phase !== "title" || modeRef.current === next) return;
    modeRef.current = next; setModeState(next); write(MODE_KEY, next);
    chosen.current = true;
    sfx.tap();
    prepare(levelRef.current);
  }

  function tick(dt: number) {
    view.clock += dt;
    if (view.popT < 9) view.popT += dt;
    if (!moving(session)) return;
    const g = game.current;
    step(g, dt * (slowRef.current && g.mode === "wind" ? SLOW : 1));
    if (g.danger !== dangerRef.current) { dangerRef.current = g.danger; setDanger(g.danger); }
    const happened = g.events;
    if (!happened) return;
    const target = g.spec.items[Math.min(g.index, g.spec.items.length - 1)];
    if (happened & EV_ROUND) view.finger = g.mode === "calm" && g.level === 1 && g.index === 0;
    if (happened & EV_CATCH) {
      const item = g.spec.items[g.caught];
      if (g.streak >= 3) { sfx.combo(g.streak - 3); view.popText = `টানা ${bn(g.streak)}`; view.popT = 0; view.popX = g.basketX; }
      else sfx.pop();
      if (item.label) { chime(); say({ kind: "pic", pic: item.pic, text: item.label }); }
      else say(null);
      setIndex(g.index);
    }
    if (happened & EV_WRONG) {
      boing();
      shake(chip.current);
      say({ kind: "note", text: hinting(g) ? hintLine(target.text) : wrongLine(g.fruits[g.hit].text, target.text) });
    }
    if (happened & EV_MISS) {
      thump();
      say({ kind: "note", text: missLine(target.text, (happened & EV_NEAR) !== 0) });
    }
    if (happened & EV_DONE) finish();
  }

  const running = phase === "play" && !paused && !resting && !showing;
  useGameLoop(tick, draw, running);

  // The board: sized to its box (crisp at DPR 2), fonts measured once the display font is in.
  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const height = Math.round(H * width / W);
      element.style.width = `${width}px`; element.style.height = `${height}px`;
      view.scale = width / W;
      context.current = fitCanvas(element, width, height);
      paint();
      prepareFonts(levelRef.current);
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    const sample = LEVELS.flatMap(item => item.items.map(entry => entry.text)).join("") + "টানা০১২৩৪৫৬৭৮৯";
    void loadCardFonts(sample).then(() => { view.fonts.clear(); prepareFonts(levelRef.current); draw(); }).catch(() => {});
    return () => observer.disconnect();
  }, []);

  // Old links (#s=…&t=…&l=…, some with &n=…) open their level and tree. The name is never read, and it leaves the address bar.
  useEffect(() => {
    const readLink = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      const clean = cleanHash(window.location.hash);
      if (`#${clean}` !== window.location.hash) history.replaceState(history.state, "", `${location.pathname}${location.search}#${clean}`);
      link.current = found;
      const more = withOpened(readOpened(read(LINKS_KEY), LEVEL_COUNT), found.level);
      write(LINKS_KEY, JSON.stringify(more)); setOpened(more);
      chosen.current = true;
      toTitle(found.level);
    };
    modeRef.current = readMode(read(MODE_KEY)); setModeState(modeRef.current);
    setOpened(readOpened(read(LINKS_KEY), LEVEL_COUNT));
    prepare(levelRef.current);
    readLink();
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  // This game's own unlock, migrated once from the stars. Then open at the level to play next, unless a link or a tap chose.
  useEffect(() => {
    if (!levels.loaded) return;
    const { unlock: opened, migrated } = readUnlock(read(UNLOCK_KEY), levels.stars, LEVEL_COUNT);
    if (migrated) write(UNLOCK_KEY, String(opened));
    unlockRef.current = opened; setUnlock(opened);
    if (!chosen.current && session.phase === "title") prepare(recommended(opened, levels.stars));
  }, [levels.loaded]);

  useEffect(() => { view.calm = slow || calmPhone(); draw(); }, [slow]);

  // Between rounds is a break: if today's time runs out while the child sits on the title or the end screen, rest comes now,
  // not on the next tap. Never during a round.
  useEffect(() => {
    if (phase === "play" || resting) return;
    const check = setInterval(() => { atBreak(); }, 1000);
    return () => clearInterval(check);
  }, [phase, resting, atBreak]);

  // The small picture beside the word, redrawn only when it changes.
  useEffect(() => {
    const element = picture.current;
    if (!element) return;
    const c = fitCanvas(element, 56, 56);
    c.clearRect(0, 0, 56, 56);
    drawPicture(c, show?.kind === "pic" ? show.pic : "snake", 28, 30, 52);
  }, [show]);

  // The card, drawn only when a grown-up opens আব্বু-আম্মুকে দেখাও.
  useEffect(() => {
    if (!showing || !card) return;
    let cancelled = false;
    void loadCardFonts(cardFontSample(card)).then(() => { if (!cancelled && preview.current) drawCard(preview.current, card, "feed", location.host); }).catch(() => {});
    return () => { cancelled = true; };
  }, [showing, result]);

  /** Freeze the round and let go of whatever the hand held (the basket stops where it is). */
  function pauseNow() {
    sessionPause(session);
    hold(game.current);
    sync();
  }

  const player = useGamePlayer({
    onPause: pauseNow,
    onResume: () => { if (sessionResume(session)) { hold(game.current); sync(); } },
    onRestart: () => toTitle(levelRef.current),
  });
  const playerPaused = useRef(false);
  playerPaused.current = player.paused;

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Away and back: blur and a hidden tab release the hand and pause the round, even before the player is engaged.
  useEffect(() => {
    const away = () => { leave(session); hold(game.current); sync(); };
    const here = () => { back(session); };
    const seen = () => { if (document.hidden) away(); else here(); };
    window.addEventListener("blur", away);
    window.addEventListener("focus", here);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", away); window.removeEventListener("focus", here); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- keys, at the window: the game's own keys never fall through to a focused button ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], .kk-show, .kk-rest, .kk-gate, .kk-gate-open")) return;
    if (!inView.current) return;
    const key = event.key, g = game.current, down = event.type === "keydown";
    const arrow = key === "ArrowLeft" || key === "ArrowRight";
    // Letting go always counts, paused or not, so the basket never runs on by itself.
    if (!down) { if (arrow) { letGo(session); hold(g); } return; }
    if (playerPaused.current || session.resting || showing) return;
    if ((key === "p" || key === "P") && session.phase === "play") { event.preventDefault(); player.requestPause(); return; }
    const pick = key === " " || key === "Enter";
    if (session.phase === "title" && !session.picking) {
      if (pick && !event.repeat && !target?.closest?.("button, a, summary")) { event.preventDefault(); begin(); }
      return;
    }
    if (session.phase === "done") {
      if (pick && !event.repeat && !target?.closest?.("button, a, summary")) { event.preventDefault(); playAgain(); }
      return;
    }
    if (session.phase !== "play" || session.paused || session.away) return;
    if (arrow) {
      event.preventDefault();
      if (g.mode === "wind") { if (grab(session)) aim(g, key === "ArrowLeft" ? LANES[0] : LANES[4]); }
      else nudge(g, key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if ((pick || key === "ArrowDown") && g.mode === "calm") {
      event.preventDefault();
      if (!event.repeat) reactToPick(pickAbove(g));
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", listen);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", listen); };
  }, []);

  /** গাছতলা: what a pick sounds and looks like. The catch itself comes from the step a moment later. */
  function reactToPick(answer: number) {
    const g = game.current;
    if (answer === PICK_RIGHT) { rustle(); view.finger = false; return; }
    if (answer !== PICK_WRONG) return;
    const target = g.spec.items[g.index];
    boing();
    shake(chip.current);
    say({ kind: "note", text: hinting(g) ? hintLine(target.text) : wrongLine(g.fruits[g.hit].text, target.text) });
  }

  const capture = (event: ReactPointerEvent<HTMLElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ } };
  const boardX = (event: ReactPointerEvent<HTMLElement>) => (event.clientX - event.currentTarget.getBoundingClientRect().left) / view.scale;

  /** The board: in গাছতলা a tap picks the fruit in that column; in ঝড়ো হাওয়া the basket heads for the finger and follows it. */
  function onBoardDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.target as Element).closest("button, .oj-overlay")) return;
    // Coming back: the first tap only wakes the game (when no pause menu is up to take it). It is never a move.
    if (session.paused && !player.paused) { if (sessionResume(session)) { hold(game.current); sync(); } return; }
    if (!tapCounts(session)) return;
    const g = game.current;
    if (g.mode === "calm") { reactToPick(pickFruit(g, fruitAt(g, boardX(event)))); return; }
    if (!grab(session)) return;
    capture(event);
    aim(g, boardX(event));
  }
  function onBoardMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || game.current.mode !== "wind" || !session.held || !event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
    aim(game.current, boardX(event));
  }
  const release = () => { letGo(session); };
  const arrowDown = (event: ReactPointerEvent<HTMLButtonElement>, x: number) => { if (!grab(session)) return; capture(event); aim(game.current, x); };
  const arrowUp = () => { letGo(session); hold(game.current); };

  const pickLevel = (next: number) => { closeList(session); chosen.current = true; sfx.tap(); toTitle(next); };
  const showList = () => { if (openList(session)) { sfx.tap(); sync(); } };
  const hideList = () => { closeList(session); sync(); };

  const total = totalStars(levels.stars);
  const from = Math.max(0, Math.min(index - 2, items.length - 7));
  const strip = items.slice(from, from + 7);
  const label = show ? show.text : done ? "সব ঝুড়িতে উঠেছে" : phase === "title" ? levelLabel(level) : wordAt ? `${wordAt} বানাও` : lookLine(want.text);
  const suggest = recommended(unlock, levels.stars);
  const finale = finaleName(level);

  /** The word being spelled, with the caught part dark and the next unit marked. */
  function wordChip() {
    const end = items.findIndex((item, i) => i >= index && item.word);
    let first = end;
    while (first > 0 && !items[first - 1].word) first--;
    return items.slice(first, end + 1).map((item, i) => {
      const at = first + i;
      return <span key={at} className={at < index ? "got" : at === index ? "now" : ""}>{item.text}</span>;
    });
  }

  const blurAfter = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };

  return (
    <div className="oj" ref={root} data-mode={mode} data-phase={phase} data-slow={slow} data-world={spec.world}>
      <div className="oj-top">
        <p className="oj-badge"><b>{levelLabel(level)}</b><span>{finale ? <>★ {finale}</> : badgeTitle(level)}</span></p>
        <p className="oj-total" aria-label={`মোট ${bn(total)} তারা`}>★ {bn(total)}</p>
      </div>

      <div className="oj-hud">
        <canvas ref={picture} className="oj-pic" aria-hidden="true" />
        <p key={showKey} className={`oj-say ${show?.kind === "note" ? "oj-note" : ""} ${show ? "gx-pop" : ""}`} role="status" aria-live="polite">{label}</p>
        <div className="oj-next-wrap">
          <p ref={chip} className="oj-next" aria-label={done ? "লেভেল শেষ" : `এবার ধরো ${want.text}`}>
            <small>{done ? "শেষ" : "এবার"}</small>
            {done ? <b>✓</b> : wordAt ? <b className="oj-word">{wordChip()}</b> : <b>{want.text}</b>}
          </p>
        </div>
      </div>

      <ol className="oj-strip" aria-label={`${bn(items.length)}টার মধ্যে ${bn(index)}টা ঝুড়িতে`}>
        {strip.map((item, i) => {
          const at = from + i;
          return <li key={at} className={at < index ? "got" : at === index && !done ? "now" : ""}>{item.text}</li>;
        })}
      </ol>

      <div className="oj-board" ref={board} data-danger={danger && phase === "play"} onPointerDown={onBoardDown} onPointerMove={onBoardMove} onPointerUp={release} onPointerCancel={release}>
        <canvas ref={canvas} role="img" aria-label={`গাছে বর্ণ ঝুলছে, নিচে ঝুড়ি। এবার লাগবে ${want.text}। ${bn(items.length)}টার মধ্যে ${bn(index)}টা ঝুড়িতে।`} />

        {phase === "title" && !picking && (
          <div className="oj-overlay oj-title">
            <button type="button" className="oj-start" onClick={blurAfter(begin)} aria-label={`খেলো: ${levelLabel(level)}, ${shortTitle(level)}`}>
              <TitleArt world={spec.world} />
              <span className="oj-start-label">খেলো</span>
            </button>
            <div className="oj-modes" role="radiogroup" aria-label="কীভাবে খেলবে">
              {MODES_LIST.map(item => (
                <button key={item} type="button" role="radio" aria-checked={mode === item} className="oj-chip" onClick={blurAfter(() => chooseMode(item))}>{MODES[item].name}</button>
              ))}
            </div>
            <p className="oj-mode-line">{MODES[mode].line}</p>
            <button type="button" className="oj-level-chip" onClick={blurAfter(showList)}>
              <b>{levelLabel(level)}</b> · {badgeTitle(level)} <span>সব লেভেল</span>
            </button>
            <p className="oj-news">{newsLine(level)}</p>
          </div>
        )}

        {picking && (
          <div className="oj-overlay oj-list" role="dialog" aria-label="সব লেভেল">
            <div className="oj-list-head"><h2>সব লেভেল</h2><button type="button" className="kit-link" onClick={hideList}>ফিরে যাও</button></div>
            {WORLDS.map(world => (
              <section key={world.world} className="oj-world" data-world={world.world}>
                <h3>{world.name} <small>{bn(world.first)}–{bn(world.last)}</small></h3>
                <ol>
                  {Array.from({ length: world.last - world.first + 1 }, (_, i) => world.first + i).map(at => {
                    const open = playable(at, unlock, levels.stars, opened), earned = levels.stars[at] ?? 0;
                    return <li key={at}>
                      <button type="button" disabled={!open} aria-current={at === level ? "true" : undefined} className={at === suggest ? "next" : ""} onClick={() => pickLevel(at)}
                        aria-label={open ? `${levelLabel(at)}, ${badgeTitle(at)}${earned ? `, ${bn(earned)} তারা` : ""}${at === suggest ? ", এটা খেলো" : ""}` : `${levelLabel(at)}, বন্ধ`}>
                        <b>{open ? bn(at) : <span className="oj-lock" aria-hidden="true" />}</b>
                        {open && <span className="oj-stars" aria-hidden="true">{[0, 1, 2].map(k => <i key={k} className={k < earned ? "on" : ""}>★</i>)}</span>}
                        {at === suggest && <em>এটা খেলো</em>}
                      </button>
                    </li>;
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}

        {phase === "play" && paused && !player.paused && (
          <div className="oj-overlay oj-wake"><p>খেলা থেমে আছে। ছুঁয়ে দাও, আবার চলবে।</p></div>
        )}

        {done && result && (
          <div className="oj-overlay oj-end" role="status">
            <StarReveal count={result.stars} />
            <p className="oj-end-line">{clearLine(result.level)}</p>
            <p className="oj-counts">
              <span><CountUp value={levelOf(result.level).items.length} />টা {nounOf(result.level)} ঝুড়িতে</span>
              <span><CountUp value={result.first} />টা প্রথমবারেই</span>
            </p>
            <div className="oj-end-actions">
              <button type="button" className="oj-big" onClick={blurAfter(playAgain)}><AgainIcon /><span>আবার খেলো</span></button>
              <button type="button" className="oj-big" onClick={blurAfter(finishUp)}><DoneIcon /><span>শেষ</span></button>
            </div>
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
      </div>

      {mode === "wind" && (
        <div className="oj-controls" aria-hidden={phase !== "play"}>
          <button type="button" className="oj-arrow" aria-label="ঝুড়ি বামে" disabled={phase !== "play"}
            onPointerDown={event => arrowDown(event, LANES[0])} onPointerUp={arrowUp} onPointerCancel={arrowUp} onLostPointerCapture={arrowUp}
            onClick={event => { if (event.detail === 0 && grab(session)) { aim(game.current, game.current.basketX - 65); letGo(session); } }}>◀</button>
          <p className="oj-controls-hint">আঙুল টেনে ঝুড়ি সরাও</p>
          <button type="button" className="oj-arrow" aria-label="ঝুড়ি ডানে" disabled={phase !== "play"}
            onPointerDown={event => arrowDown(event, LANES[4])} onPointerUp={arrowUp} onPointerCancel={arrowUp} onLostPointerCapture={arrowUp}
            onClick={event => { if (event.detail === 0 && grab(session)) { aim(game.current, game.current.basketX + 65); letGo(session); } }}>▶</button>
        </div>
      )}

      {card && (
        <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `o-te-ojogor-${card.level}.png`, make: () => cardBlob(card, "feed", location.host) }}>
          <canvas ref={preview} width={1080} height={1350} role="img" aria-label={`অ-তে অজগরের কার্ড: ${levelLabel(card.level)}, ${tallyLine(card)}।`} />
          <p>{levelLabel(card.level)}: {shortTitle(card.level)}। {tallyLine(card)}।</p>
          <ParentGate label="খেলাটার লিংক"><ShareToolLink title="অ-তে অজগর" text="গাছ থেকে বর্ণ পেড়ে ঝুড়িতে তোলার খেলা, ৪–৮ বছরের জন্য।" /></ParentGate>
        </ShowParent>
      )}
      {resting && <RestScreen onExtend={extend} />}
    </div>
  );
}
