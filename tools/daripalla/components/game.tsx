"use client";
// IP: what we avoided — the pan balance is a public classroom model for "=", but no textbook (NCTB) pictures or sums, no Sisimpur/Meena or TV/app characters or look-alikes, no real-world weight claims (no কেজি/গ্রাম), and no "brain training" promises; all art is our own code.
// The game inside the shared player. The rules live in lib/ (puzzle.ts makes a pan, sim.ts plays a round, clock.hot.ts moves its
// timers, scale.hot.ts is the balance's physics, session.ts decides screens, pause and the rest screen); this file feeds taps and keys
// in, reads the round's events, draws and plays the sounds. The one clock is the fixed-step loop: when the player pauses or the
// window is blurred, the beam, the hold and the end screen's wait simply stop.
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, newSeed, shake, silenceScheduled, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob } from "../lib/card";
import { advance } from "../lib/clock.hot";
import { bn, isLevel, LEVEL_COUNT, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from "../lib/levels";
import { newPhys, type Phys } from "../lib/phys";
import { lifted, land, landIn, settleAt, stepPhys } from "../lib/scale.hot";
import * as S from "../lib/session";
import { choose, EV, FLY_MS, glows, hint, lift, newRun, next, put, resultOf, ST, totals, type Outcome, type Result, type Run } from "../lib/sim";
import { sound } from "../lib/sound";
import { addToday, EMPTY_TODAY, feedback, prompt, type Today } from "../lib/text";
import type { Piece } from "../lib/puzzle";
import { Backdrop, Ghost, Strings } from "./art";
import { EndScreen } from "./end-screen";
import { LevelList } from "./level-list";
import { OgCard } from "./og-card";
import { PieceView, pieceName } from "./pieces";
import { RoundCard } from "./round-card";
import { Title } from "./title";

const SLUG = "daripalla";
const PAN_H = 160;

/** Acts on the first finger at once (a 50 ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement, byKey: boolean) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget, false); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget, true); },
});

/** `#og` (the preview-image script only) shows a fixed finished card in place of the game: no stars, no play time. */
export function DaripallaGame() {
  const [og, setOg] = useState(false);
  useEffect(() => { if (location.hash === "#og") setOg(true); }, []);
  return og ? <OgCard onClose={() => { history.replaceState(null, "", location.pathname); setOg(false); }} /> : <Game />;
}

type Geo = { w: number; h: number; cx: number; pivot: number; arm: number; panW: number; dirty: boolean };

function Game() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const run = useRef<Run>(null as unknown as Run);
  if (!run.current) run.current = newRun(1, 1);
  const phys = useRef<Phys>(null as unknown as Phys);
  if (!phys.current) phys.current = newPhys();
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const [screen, setScreen] = useState<S.Screen>("title");
  const [level, setLevel] = useState(1);
  const [line, setLine] = useState("");
  const [today, setToday] = useState<Today>(EMPTY_TODAY);
  const [result, setResult] = useState<Result | null>(null);
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const root = useRef<HTMLDivElement>(null), scene = useRef<HTMLDivElement>(null), beam = useRef<HTMLDivElement>(null), needle = useRef<HTMLDivElement>(null);
  const panEls = useRef<(HTMLDivElement | null)[]>([null, null]), tray = useRef<HTMLDivElement>(null);
  const geo = useRef<Geo>({ w: 0, h: 0, cx: 0, pivot: 52, arm: 100, panW: 120, dirty: true });
  const flight = useRef<DOMRect | null>(null);
  const flying = useRef(new Set<Animation>());
  const readyAt = useRef(0);
  const live = useRef({ slow, stars: levels.stars });
  live.current = { slow, stars: levels.stars };

  const sync = () => setScreen(session.current.screen);

  // ---- first load: this phone's progress picks the level that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setLevel(nextToPlay(levels.stars));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the round; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __dp: { run: () => run.current, session: () => session.current, phys: () => phys.current, put: (index: number) => onPut(index, null), choose: (value: number) => onChoose(value, null), next: () => onNext(0), lift: () => onLift(null) } });
  });

  // ---- the player: the clock is the loop, which the player's pause stops; the session just refuses taps ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); for (const animation of flying.current) animation.finish(); },
    onResume: () => { S.resume(session.current); setIdle(false); },
    onRestart: () => { silenceScheduled(); S.toTitle(session.current); setShowing(false); sync(); },
    onLevels: () => { silenceScheduled(); S.openLevels(session.current); setShowing(false); sync(); },
  });

  // ---- away and back: the first tap back only wakes the game ----
  useEffect(() => {
    const onBlur = () => S.blur(session.current);
    const onFocus = () => S.focus(session.current);
    const onVisibility = () => { if (document.hidden) S.blur(session.current); else S.focus(session.current); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const animations = flying.current;
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); silenceScheduled(); for (const animation of animations) animation.cancel(); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: globalThis.PointerEvent) => {
      const open = node.querySelector(".dp-grown .kk-gate-open, .dp-grown .kk-gate");
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener("pointerdown", down, true);
    return () => node.removeEventListener("pointerdown", down, true);
  }, []);

  // ---- the balance's size: measured once per size, so the loop only moves numbers ----
  useLayoutEffect(() => {
    const box = scene.current;
    if (!box) return;
    const measure = () => {
      const w = box.clientWidth, h = box.clientHeight, g = geo.current;
      g.w = w; g.h = h; g.cx = w / 2;
      g.panW = Math.min(148, Math.max(104, w * 0.4));
      g.arm = Math.min(w / 2 - g.panW / 2 - 4, 124);
      g.pivot = Math.round(Math.min(110, Math.max(48, (h - PAN_H - 70) / 2)));
      if (beam.current) beam.current.style.width = `${2 * g.arm + 24}px`;
      for (const pan of panEls.current) if (pan) { pan.style.width = `${g.panW}px`; pan.style.height = `${PAN_H}px`; }
      box.style.setProperty("--pivot", `${g.pivot}px`);
      g.dirty = true;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [screen === "play"]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Writes the beam, the pans and the needle. Skipped once everything has stopped, until something changes. */
  function paint() {
    const g = geo.current, p = phys.current, bar = beam.current, hand = needle.current, left = panEls.current[0], right = panEls.current[1];
    if (!g.w || !bar || !hand || !left || !right) return;
    if (p.rest && !g.dirty) return;
    g.dirty = false;
    const radians = p.a * Math.PI / 180, dx = g.arm * Math.cos(radians), dy = g.arm * Math.sin(radians), half = g.panW / 2;
    bar.style.transform = `translate(${g.cx - g.arm - 12}px, ${g.pivot - 7}px) rotate(${p.a}deg)`;
    left.style.transform = `translate(${g.cx - dx - half}px, ${g.pivot - dy + p.dip[0]}px) rotate(${p.sway[0]}deg)`;
    right.style.transform = `translate(${g.cx + dx - half}px, ${g.pivot + dy + p.dip[1]}px) rotate(${p.sway[1]}deg)`;
    hand.style.transform = `rotate(${Math.max(-26, Math.min(26, p.a * 1.7))}deg)`;
  }

  // ---- the round's events, read after every step and every press ----
  function drain() {
    const r = run.current;
    if (!r.nev) return;
    const s = session.current, spec = levelOf(r.level);
    for (let at = 0; at < r.nev; at++) {
      switch (r.evs[at]) {
        case EV.DONE: setToday(before => addToday(before, r)); break;
        case EV.WON:
          // The round is won at this moment: stars saved and the limit checked now, whatever the hand does next.
          if (S.won(s, kids.atBreak())) { levels.record(r.level, r.stars); setResult(resultOf(r)); }
          break;
        case EV.READY: readyAt.current = performance.now(); sound.ready(); break;
        case EV.IDLE: setIdle(true); break;
        case EV.CARD:
          S.cardShows(s, performance.now());
          // Under the rest screen the round ends quietly.
          if (!s.resting) {
            sound.stars(r.stars);
            if (spec.finale) { sound.tune(spec.world); if (!live.current.slow) confetti({ count: 80, y: 0.3 }); }
          }
          sync();
          break;
        default: break;
      }
    }
    r.nev = 0;
    bump();
  }

  useGameLoop(dt => {
    if (!S.clockMayRun(session.current)) return;
    const r = run.current, p = phys.current;
    advance(r, dt * 1000);
    if (live.current.slow) { if (p.a !== r.tilt) { settleAt(p, r.tilt); geo.current.dirty = true; } } else stepPhys(p, r.tilt, dt);
  }, () => { drain(); paint(); }, screen === "play");

  // A piece that was just put on flies there from the tray (a short arc: up, then down onto the pan).
  useLayoutEffect(() => {
    geo.current.dirty = true;
    const from = flight.current;
    flight.current = null;
    if (!from || live.current.slow) return;
    const items = panEls.current[1]?.querySelectorAll<HTMLElement>(".dp-item.added");
    const item = items?.[items.length - 1];
    if (!item) return;
    const to = item.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2), dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const animation = item.animate([
      { transform: `translate(${dx}px, ${dy}px) scale(.8)`, easing: "cubic-bezier(.23,1,.32,1)" },
      { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 34}px) scale(1.1)`, offset: 0.5, easing: "cubic-bezier(.55,0,1,.45)" },
      { transform: "translate(0,0) scale(1.04, .94)", offset: 0.92 },
      { transform: "translate(0,0) scale(1)" },
    ], { duration: FLY_MS });
    flying.current.add(animation);
    animation.addEventListener("finish", () => flying.current.delete(animation));
    animation.addEventListener("cancel", () => flying.current.delete(animation));
  });

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    run.current = newRun(id, newSeed());
    settleAt(phys.current, run.current.tilt);
    geo.current.dirty = true;
    if (!live.current.slow) landIn(phys.current, 260, 0, 0.5);
    sound.drop();
    setResult(null); setShowing(false); setIdle(false); setLine("");
    sync();
  }

  const landed = (piece: Piece | undefined, outcome: Outcome, flies: boolean) => {
    const p = phys.current, force = Math.min(1, (piece?.value ?? 2) / 10 + 0.2);
    if (live.current.slow) { settleAt(p, run.current.tilt); geo.current.dirty = true; return; }
    if (outcome === "full") return;
    landIn(p, flies ? FLY_MS : 0, 1, force);
  };

  /** A weight, fruit or piece from the tray, by finger or key. A key never flies the piece: keyboard actions don't animate. */
  function onPut(index: number, element: HTMLElement | null, byKey = false) {
    const s = session.current;
    if (S.touch(s) !== "counts") return;
    const r = run.current, piece = r.puzzle.tray[index];
    const out = put(r, index);
    if (out === "ignore") return;
    S.moved(s); setIdle(false);
    const flies = Boolean(element) && !byKey && !live.current.slow;
    const lag = flies ? undefined : 0;
    if (element && flies && out !== "full") flight.current = element.getBoundingClientRect();
    if (out === "full") { sound.again(); if (!byKey) shake(element); shake(tray.current); }
    else {
      sound.take();
      if (out === "level") { sound.land(piece?.value ?? 2, lag); sound.level(lag); }
      else if (out === "over") sound.heavy(lag);
      else sound.land(piece?.value ?? 2, lag);
    }
    landed(piece, out, flies);
    setLine(feedback(r, out));
    drain();
  }

  /** The piece last put on the pan, tapped (the whole pan is the target) or Backspace: it comes off. */
  function onLift(element: HTMLElement | null) {
    const s = session.current;
    if (S.touch(s) !== "counts") return;
    const r = run.current, out = lift(r);
    if (out === "ignore") return;
    S.moved(s); setIdle(false);
    sound.lift();
    if (out === "level") sound.level();
    if (live.current.slow) { settleAt(phys.current, r.tilt); geo.current.dirty = true; } else lifted(phys.current, 1);
    setLine(feedback(r, out));
    shake(element);
    drain();
  }

  /** A number tapped: the fruit's weight, or a try for ★. */
  function onChoose(value: number, element: HTMLElement | null) {
    const s = session.current;
    if (S.touch(s) !== "counts") return;
    const r = run.current, out = choose(r, value);
    if (out === "ignore") return;
    S.moved(s); setIdle(false);
    if (out === "again") { sound.again(); shake(element); } else sound.right();
    if (live.current.slow) { settleAt(phys.current, r.tilt); geo.current.dirty = true; } else if (out === "right") land(phys.current, 1, 0.3);
    setLine(feedback(r, out, value));
    drain();
  }

  /** পরের পাল্লা. Never within 250 ms of its arrival, so a tap meant for something else can't press it. */
  function onNext(sinceEvent: number) {
    const s = session.current;
    if (S.touch(s) !== "counts") return;
    if (sinceEvent && sinceEvent - readyAt.current < 250) return;
    const r = run.current;
    if (!next(r)) return;
    setIdle(false); setLine("");
    sound.drop();
    if (live.current.slow) { settleAt(phys.current, r.tilt); geo.current.dirty = true; } else landIn(phys.current, 140, 0, 0.5);
    drain();
  }

  // ---- screens ----
  const toTitle = () => { silenceScheduled(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(run.current.level) || nextToPlay(live.current.stars);
    setLevel(after);
    toTitle();
  };
  const openLevels = () => { S.openLevels(session.current); sound.tap(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => {
    const s = session.current, answer = S.pick(s, id);
    if (answer === "ask") { sound.tap(); bump(); return; }
    if (answer === "ignored") return;
    s.back = "title"; s.screen = "title";
    begin(id);
  };
  const leave = () => { const s = session.current, id = S.leave(s); if (!id) return; s.back = "title"; s.screen = "title"; begin(id); };
  const stay = () => { S.stay(session.current); bump(); };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show")) return;
      const s = session.current, key = event.key, r = run.current;
      if (kids.resting && s.screen !== "play") return;
      if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ")) { event.preventDefault(); if (!event.repeat) begin(level); return; }
      if (s.screen === "play") {
        // A held Enter never repeats a press on the focused piece.
        if ((key === "Enter" || key === " ") && event.repeat) { event.preventDefault(); return; }
        if (/^[1-9]$/.test(key) && r.stage === ST.BALANCE) { event.preventDefault(); const buttons = tray.current?.querySelectorAll<HTMLElement>(".dp-take"); onPut(Number(key) - 1, buttons?.[Number(key) - 1] ?? null, true); return; }
        if (/^[1-3]$/.test(key) && r.stage === ST.ASK && r.askReady) { event.preventDefault(); const value = r.puzzle.choices[Number(key) - 1]; if (value !== undefined) onChoose(value, null); return; }
        if (key === "Backspace" && r.stage === ST.BALANCE) { event.preventDefault(); onLift(null); return; }
        if ((key === "Enter" || key === " ") && document.activeElement === document.body && r.stage === ST.DONE && r.ready && !r.over) { event.preventDefault(); onNext(0); }
        return;
      }
      if (s.screen === "end" && (key === "Enter" || key === " ")) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(r.level); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // ---- what the screen shows ----
  const r = run.current, playing = screen === "play";
  const spec = levelOf(playing || screen === "end" ? r.level : level), puzzle = r.puzzle;
  const worldId = spec.world, world = worldOf(spec.id);
  const first = levels.loaded && Object.keys(levels.stars).length === 0 && r.level === 1 && r.index === 0 && r.added.length === 0 && r.tries === 0;
  const help = hint(r);
  const ghostOn = playing && (idle || first || glows(r));
  const ghost = (where: "tray" | "pan" | "choice", at: number) => ghostOn && help && where in help && (help as Record<string, number>)[where] === at ? <Ghost /> : null;
  const { left, right } = totals(r);
  const sign = puzzle.kind === "guess" || left === right ? "=" : left > right ? ">" : "<";
  const balancedNow = r.stage === ST.DONE || (r.stage === ST.ASK && puzzle.kind === "find");
  const reveal = (piece: Piece): boolean | number => piece.kind === "star" ? (r.guess ?? false) : r.stage === ST.DONE;
  const rightPieces = [...puzzle.start, ...r.added];
  const term = (piece: Piece, key: string) => <span className="dp-term" key={key}>{piece.kind === "fruit" && piece.hidden ? <span className="dp-term-art"><PieceView piece={piece} reveal={r.stage === ST.DONE} /></span> : piece.kind === "star" ? "★" : bn(piece.value)}</span>;
  const side = (pieces: Piece[], prefix: string) => pieces.length ? pieces.flatMap((piece, index) => index ? [<span key={`${prefix}p${index}`} className="dp-op">+</span>, term(piece, `${prefix}${index}`)] : [term(piece, `${prefix}${index}`)]) : [<span key={`${prefix}e`} className="dp-term dp-empty">০</span>];
  const caption = line || prompt(r);
  const restUp = kids.resting && screen !== "play";
  const sizeOf = (count: number) => (count === 1 ? " big" : count === 2 ? " half" : "");
  const showChoices = r.stage === ST.ASK && r.askReady;

  return <div ref={root} className="dp" data-world={worldId} data-screen={screen} data-over={(playing && r.over) || undefined} data-slow={slow || undefined}>
    {screen === "title" && <Title level={level} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="dp-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="দাঁড়িপাল্লা" text="দোকানের দাঁড়িপাল্লায় বাটখারা চাপিয়ে দুই দিক সমান করার খেলা। ৬–১১ বছর, ফ্রি।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === "levels" && <LevelList stars={levels.stars} current={level} ask={session.current.ask} onPick={pickLevel} onClose={closeLevels} onLeave={leave} onStay={stay} />}

    {screen === "play" && <>
      <div className="dp-hud">
        <p className="dp-badge"><span className="dp-badge-n" aria-hidden="true">{bn(placeOf(r.level))}</span>
          <span><b>{spec.finale ? spec.title : world.name}</b><small>{spec.finale ? `${world.name} · ফিনালে` : spec.title}</small></span></p>
        <ol className="dp-dots" aria-label={`${bn(spec.puzzles)}টার ${bn(r.index + 1)} নম্বর পাল্লা`}>
          {Array.from({ length: spec.puzzles }, (_, index) => <li key={index} className={index < r.index || (index === r.index && r.stage === ST.DONE) ? "done" : index === r.index ? "now" : ""} />)}
        </ol>
      </div>

      <div className={`dp-scene${balancedNow ? " is-level" : ""}${spec.finale ? " finale" : ""}`} ref={scene}>
        <Backdrop world={worldId} />
        <div className="dp-post" aria-hidden="true" /><div className="dp-foot" aria-hidden="true" />
        <div className="dp-gauge" aria-hidden="true"><i className="dp-tick" /><div className="dp-needle" ref={needle} /><b className="dp-hub" /></div>
        <div className="dp-beam" ref={beam} aria-hidden="true"><i /><i /></div>
        <div className="dp-pan" ref={el => { panEls.current[0] = el; }} role="group" aria-label={`বাম পাল্লা: ${puzzle.left.map(piece => pieceName(piece, reveal(piece))).join(", ")}`}>
          <Strings />
          <div className="dp-load" key={`${r.level}-${r.index}`}>{puzzle.left.map((piece, index) => <span className={`dp-item fixed drop${sizeOf(puzzle.left.length)}`} key={index}><PieceView piece={piece} reveal={reveal(piece)} /></span>)}</div>
          <i className="dp-plate" />
        </div>
        <div className="dp-pan" ref={el => { panEls.current[1] = el; }} role="group" aria-label="ডান পাল্লা">
          <Strings />
          <div className="dp-load">
            {puzzle.start.map((piece, index) => <span className={`dp-item fixed${piece.kind === "weight" ? " big" : ""}`} key={`s${index}`} aria-label={pieceName(piece)}><PieceView piece={piece} /></span>)}
            {r.added.map((piece, index) => <span className="dp-item added" key={`a${index}`}><PieceView piece={piece} reveal /></span>)}
          </div>
          <i className="dp-plate" />
          {/* The whole pan is one big target (well over 72px) that lifts the piece put on last, so small pieces never steal each other's taps. */}
          {r.stage === ST.BALANCE && r.added.length > 0 && <button type="button" className="dp-lift" aria-label={`${pieceName(r.added[r.added.length - 1], true)}: তুলে নাও`} {...press(element => onLift(element))}>
            {ghost("pan", r.added.length - 1)}
          </button>}
        </div>
      </div>

      <p className={`dp-equation${balancedNow ? " is-level" : ""}`} aria-label={`সমীকরণ: ${puzzle.left.map(piece => pieceName(piece, reveal(piece))).join(" যোগ ")} ${sign === "=" ? "সমান" : sign === ">" ? "বড়" : "ছোট"} ${rightPieces.map(piece => pieceName(piece, true)).join(" যোগ ") || "শূন্য"}`}>
        {side(puzzle.left, "l")}<span className="dp-sign">{sign}</span>{side(rightPieces, "r")}
      </p>
      <p className="dp-line" aria-live="polite">{caption}</p>

      <div className="dp-tray" ref={tray} data-stage={r.stage} style={{ gridTemplateColumns: `repeat(${r.stage === ST.BALANCE ? puzzle.tray.length : showChoices ? puzzle.choices.length : 1}, minmax(0, 1fr))` }}>
        {r.stage === ST.BALANCE && puzzle.tray.map((piece, index) => <button type="button" key={index} className="dp-take" aria-label={`${pieceName(piece, true)}: ডান পাল্লায় দাও`} {...press((element, byKey) => onPut(index, element, byKey))}>
          <PieceView piece={piece} reveal />{ghost("tray", index)}
        </button>)}
        {showChoices && puzzle.choices.map(value => <button type="button" key={value} className={`dp-choice${glows(r) && value === puzzle.answer ? " is-glow" : ""}${r.guess === value && puzzle.kind === "guess" ? " is-tried" : ""}`} {...press(element => onChoose(value, element))}>
          {bn(value)}{ghost("choice", value)}
        </button>)}
        {r.stage === ST.DONE && r.ready && !r.over && <button type="button" className="dp-next" onClick={event => { event.currentTarget.blur(); onNext(event.timeStamp); }}>
          <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 24h28M26 13l11 11-11 11" /></svg><span>পরের পাল্লা</span>
        </button>}
      </div>
    </>}

    {screen === "end" && result && <EndScreen result={result} slow={slow} onAgain={() => begin(r.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: () => cardBlob(today, location.host) }}>
      <RoundCard today={today} />
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
