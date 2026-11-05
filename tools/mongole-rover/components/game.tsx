"use client";
// IP: what we avoided — no NASA logos, mission names or look-alikes of real rovers (our rover is a round box with one camera eye), and no ScratchJr, Code.org or Lightbot block art; arrows, rocks and craters are our own SVG.
// The game inside the shared player. The rules live in lib/ (rover.ts plays a plan, run.hot.ts is the run's clock, session.ts
// decides what a tap or key means, pause, away and the rest screen); this file feeds taps and keys in, draws, and plays the
// sounds. There is no voice and no timer the child races: the clock only drives the rover, and stops whenever the child is away.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { renderCard } from "../../../shared/card-canvas";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, silenceScheduled, sfx, useLevels, useSlowMode } from "../../../shared/game-kit";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from "../../../shared/kids-kit";
import { ARROW, CRATER, REPEAT, ROVER, SAMPLE, TURN } from "../lib/art";
import { drawCard, loadPictures } from "../lib/draw-card";
import { SOURCE } from "../lib/facts";
import { BEST, LEVEL_COUNT, badgeName, isFinale, levelOf, nextToPlay, worldOf } from "../lib/levels";
import { blockText, noteFor, tipFor, type Today } from "../lib/lines";
import { resultOf, type Result } from "../lib/play";
import { makeClock, type Clock } from "../lib/run";
import { giveBreath, tick } from "../lib/run.hot";
import { DIRS, MAX_BLOCKS, MAX_TIMES, addBlock, pathOf, removeBlock, repeatLast, runPlan, showHint, type Block, type Cell, type Dir, type Run } from "../lib/rover";
import * as S from "../lib/session";
import { bump, gotSample, motor, startChirp, stars as starChimes, tap, tune } from "../lib/sound";
import { CardCanvas } from "./card";
import { EndScreen } from "./end-screen";
import { LevelList } from "./level-list";
import { Art, Finger, ICONS } from "./pieces";
import { Story } from "./story";
import { Title } from "./title";

const SLUG = "mongole-rover";
const INTRO_KEY = `ektukhani-intro-${SLUG}`;
/** `#og` opens a finished demo of this level with the card showing, for the preview image. It saves nothing. */
const OG_LEVEL = 12;
const PAD: Dir[] = ["L", "U", "D", "R"];
const KEY_DIR: Record<string, Dir> = { ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R" };

type Active = { run: Run; plan: Block[]; clock: Clock; applied: number };

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const same = (a: Cell | null, b: Cell) => !!a && a.x === b.x && a.y === b.y;

export function RoverGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>("title");
  const [n, setN] = useState(1);
  const [plan, setPlan] = useState<Block[]>([]);
  const [at, setAt] = useState<Cell>(levelOf(1).start);
  const [face, setFace] = useState<1 | -1>(1);
  const [taken, setTaken] = useState<number[]>([]);
  const [trail, setTrail] = useState<Cell[]>([]);
  const [active, setActive] = useState<{ block: number; turn: number } | null>(null);
  const [fail, setFail] = useState<Run | null>(null);
  const [empty, setEmpty] = useState(false);
  const [misses, setMisses] = useState(0);
  const [spawn, setSpawn] = useState(0);
  const [fresh, setFresh] = useState(-1);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<Today>({ levels: 0, samples: 0, last: null });
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [storySeen, setStorySeen] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const queue = useRef<HTMLOListElement>(null);
  const runRef = useRef<Active | null>(null);
  const resultRef = useRef<Result | null>(null);
  const keyAct = useRef(0);
  const chosen = useRef(false);

  const level = levelOf(n), best = BEST[level.n - 1], world = worldOf(level.n);
  const running = screen === "run";
  const now = useRef({ plan, n, slow, levels, kids, level });
  now.current = { plan, n, slow, levels, kids, level };

  const sync = () => setScreen(session.current.screen);
  useEffect(() => () => { runRef.current = null; silenceScheduled(); }, []);

  function resetBoard(start = levelOf(now.current.n).start) {
    runRef.current = null;
    setAt(start); setFace(1); setTaken([]); setTrail([]); setActive(null); setFail(null); setEmpty(false); setSpawn(count => count + 1);
  }

  // ---- first load: this phone's progress picks the level that's ready; the story flag; #og ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setStorySeen(read(INTRO_KEY) === "1" || Object.keys(levels.stars).length > 0);
    if (chosen.current) return;
    const ready = nextToPlay(levels.stars);
    setN(ready); setAt(levelOf(ready).start);
  }, [levels.loaded, levels.stars]);

  useEffect(() => {
    if (location.hash !== "#og") return;
    chosen.current = true;
    const demo = levelOf(OG_LEVEL), demoPlan = BEST[OG_LEVEL - 1].plan;
    const done = resultOf(OG_LEVEL, demoPlan, 1);
    setN(OG_LEVEL); setPlan(demoPlan); setAt(pathOf(demo, demoPlan).at(-1)!);
    setResult(done); resultRef.current = done;
    setToday({ levels: 1, samples: demo.samples.length, last: { n: OG_LEVEL, plan: demoPlan, stars: 3 } });
    session.current.screen = "won"; session.current.endAt = performance.now();
    sync(); setShowing(true);
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the state; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __rover: { session: () => session.current, run: () => runRef.current, level: () => now.current.n } });
  }, []);

  // ---- the player: pause freezes the run's clock; resume hands the game back ----
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); },
    onResume: () => { S.resume(session.current); },
    onRestart: () => { S.toTitle(session.current); silenceScheduled(); resetBoard(); setPlan([]); setShowing(false); setMisses(0); sync(); },
    onLevels: () => { runRef.current = null; S.openLevels(session.current); silenceScheduled(); sync(); },
  });

  // ---- away and back: the run stops with the window; the first tap back only wakes the game ----
  useEffect(() => {
    const out = () => { S.blur(session.current); };
    const back = () => { S.focus(session.current); };
    const onVisibility = () => { if (document.hidden) out(); else back(); };
    window.addEventListener("blur", out);
    window.addEventListener("focus", back);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", out); window.removeEventListener("focus", back); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // The kit's own rest state (opening past the limit, a grown-up's more time) and the session's stay one.
  useEffect(() => { if (screen !== "run") session.current.resting = kids.resting; }, [kids.resting, screen]);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector(".mr-grown .kk-gate-open, .mr-grown .kk-gate");
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener("pointerdown", down, true);
    return () => node.removeEventListener("pointerdown", down, true);
  }, []);

  // ---- the run: one animation-frame loop that only moves the clock while the game is live ----
  useEffect(() => {
    if (screen !== "run") return;
    let raf = 0, last = 0, held = false;
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);
      const r = runRef.current;
      if (!r) return;
      if (!S.live(session.current)) { held = true; last = 0; return; }
      if (held) { giveBreath(r.clock); held = false; }
      const dt = last ? time - last : 0;
      last = time;
      if (!tick(r.clock, dt)) return;
      while (r.applied < r.clock.reached) step(r, r.applied++);
      if (r.clock.ended) finish(r);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  /** The rover arrives at its next square: the block lights, the wheels hum, a rock lifts. */
  function step(r: Active, i: number) {
    S.stepped(session.current);
    const arrival = r.run.steps[i], dir = r.plan[arrival.block].dir, before = i ? r.run.steps[i - 1].at : now.current.level.start;
    setActive({ block: arrival.block, turn: arrival.turn });
    setAt(arrival.at);
    setTrail(list => [...list, before]);
    if (dir === "L" || dir === "R") setFace(dir === "L" ? -1 : 1);
    if (arrival.got !== null) { gotSample(); setTaken(list => [...list, arrival.got!]); } else motor(i, worldOf(now.current.n).id);
    const box = queue.current, block = box?.children[arrival.block] as HTMLElement | undefined;
    if (box && block && (block.offsetTop < box.scrollTop || block.offsetTop + block.offsetHeight > box.scrollTop + box.clientHeight)) box.scrollTop = block.offsetTop - 4;
    if (r.run.end === "win" && i === r.run.steps.length - 1) lift(r);
  }

  /** The last rock: the stars are saved and the limit is checked right here, not in a later timer. */
  function lift(r: Active) {
    const s = session.current, { n: id, levels: store, kids: session2 } = now.current;
    if (!S.lifted(s, session2.atBreak())) return;
    const done = resultOf(id, r.plan, s.runs);
    store.record(id, done.stars);
    resultRef.current = done;
    setResult(done);
    setToday(day => ({ levels: day.levels + 1, samples: day.samples + levelOf(id).samples.length, last: { n: id, plan: r.plan, stars: done.stars } }));
  }

  function finish(r: Active) {
    const s = session.current;
    runRef.current = null;
    if (r.run.end === "win") {
      if (!S.showWon(s, performance.now())) return;
      const done = resultRef.current;
      // Under the rest screen the level ends quietly.
      if (done && !s.resting) {
        starChimes(done.stars);
        if (isFinale(done.level)) { tune(worldOf(done.level).id); if (!now.current.slow) confetti({ count: 70, y: 0.3, colors: ["#b8461f", "#ffd166", "#4f7fd0", "#7b5b8f", "#f6f2ea"] }); }
      }
      setActive(null);
      sync();
      return;
    }
    // A run that missed: the lit block, a soft bump, and a natural break.
    if (r.run.failBlock !== null) { setActive({ block: r.run.failBlock, turn: 0 }); bump(); } else { setActive(null); sfx.drop(); }
    setFail(r.run);
    setMisses(count => count + 1);
    S.missed(s, now.current.kids.atBreak());
    sync();
  }

  // ---- levels ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    chosen.current = true;
    const next = levelOf(id).n;
    const story = !storySeen && next === 1 && Object.keys(levels.stars).length === 0;
    // Opening a level is a break too: past today's limit the rest screen shows and nothing else changes (the end screen stays under it).
    if (!S.begin(s, kids.atBreak(), story)) {
      if (s.screen === "title") { setN(next); setAt(levelOf(next).start); }
      sync();
      return;
    }
    setN(next); setPlan([]); setMisses(0); setResult(null); resultRef.current = null; setShowing(false); setFresh(-1);
    resetBoard(levelOf(next).start);
    if (!story) tap();
    sync();
  }
  function endStory() {
    if (!S.storyDone(session.current)) return;
    setStorySeen(true); write(INTRO_KEY, "1");
    tap(); sync();
  }
  const toTitle = () => { S.toTitle(session.current); resetBoard(); setPlan([]); sync(); };
  const finishLevel = () => {
    // শেষ: back to the hill, with the next level ready. Nothing starts by itself.
    const after = n < LEVEL_COUNT ? n + 1 : nextToPlay(levels.stars);
    setN(after); setAt(levelOf(after).start); setResult(null); resultRef.current = null; setPlan([]);
    toTitle();
  };
  const openLevels = () => { S.openLevels(session.current); tap(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = "title"; begin(id); };

  // ---- the plan ----
  /** Any change to the plan puts the rover back at the start, so the next run is always fresh. */
  function edit(next: Block[], byFinger: boolean) {
    if (fail || at !== level.start || taken.length || trail.length) resetBoard();
    setEmpty(false);
    setPlan(next);
    setFresh(byFinger && next.length > plan.length ? next.length - 1 : -1);
    if (next.length > plan.length) requestAnimationFrame(() => { const box = queue.current; if (box) box.scrollTop = box.scrollHeight; });
  }
  const counts = () => S.tapEdit(session.current) === "counts";
  const tapArrow = (dir: Dir, byFinger = true) => { if (!counts()) return; sfx.pick(); edit(addBlock(plan, dir), byFinger); };
  const tapRepeat = (byFinger = true) => { if (!counts() || !plan.length || plan.at(-1)!.times >= MAX_TIMES) return; sfx.combo(plan.at(-1)!.times); edit(repeatLast(plan), byFinger); };
  const back = (byFinger = true) => { if (!counts() || !plan.length) return; sfx.drop(); edit(plan.slice(0, -1), byFinger); };
  const removeAt = (index: number) => { if (!counts()) return; sfx.drop(); edit(removeBlock(plan, index), true); };

  function go() {
    const s = session.current;
    const outcome = S.tapGo(s, performance.now(), plan.length === 0);
    if (outcome === "woke" || outcome === "ignored") return;
    if (outcome === "empty") { sfx.tap(); setEmpty(true); return; }
    (document.activeElement as HTMLElement | null)?.blur?.();
    resetBoard();
    startChirp();
    const run = runPlan(level, plan);
    runRef.current = { run, plan, clock: makeClock(run.steps.length, slow, run.end === "win"), applied: 0 };
    setFresh(-1);
    sync();
  }

  /** থামাও is its own button, and ignores taps right after চালাও. */
  function halt() {
    if (S.tapStop(session.current, performance.now()) !== "stopped") return;
    sfx.tap(); resetBoard(); sync();
  }

  /** A finger on a control answers in the pointer event itself (first finger, main button only). */
  const press = (action: () => void) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    keyAct.current = 0;
    action();
  };
  /** A key press on a focused button or a screen reader's activation (a click with no pointer). */
  const click = (action: () => void) => (event: { detail: number; currentTarget: HTMLButtonElement }) => {
    if (event.detail === 0 && performance.now() - keyAct.current > 400) action();
  };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show")) return;
      const s = session.current, key = event.key;
      if (kids.resting && s.screen !== "run") return;
      if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ")) { event.preventDefault(); if (!event.repeat) begin(n); return; }
      if (s.screen === "plan") {
        if (KEY_DIR[key]) { event.preventDefault(); if (!event.repeat) { keyAct.current = performance.now(); tapArrow(KEY_DIR[key], false); } return; }
        if (key === "r" || key === "R") { event.preventDefault(); if (!event.repeat && level.repeat) { keyAct.current = performance.now(); tapRepeat(false); } return; }
        if (key === "Backspace") { event.preventDefault(); if (!event.repeat) { keyAct.current = performance.now(); back(false); } return; }
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          if (event.repeat) return;
          keyAct.current = performance.now();
          // On a focused control, Enter does what that control does; anywhere else it is চালাও.
          const cmd = (target?.closest?.("[data-cmd]") as HTMLElement | null)?.dataset.cmd;
          if (cmd === "L" || cmd === "U" || cmd === "D" || cmd === "R") tapArrow(cmd, false);
          else if (cmd === "repeat") tapRepeat(false);
          else if (cmd === "back") back(false);
          else if (target?.closest?.(".mr-block")) removeAt(Array.from(queue.current?.children ?? []).indexOf(target.closest("li") as Element));
          else go();
        }
        return;
      }
      if (s.screen === "run") {
        if (key === "Backspace") { event.preventDefault(); if (!event.repeat) halt(); }
        else if (key === "Enter" || key === " ") event.preventDefault();
        return;
      }
      if (s.screen === "won" && (key === "Enter" || key === " ")) {
        event.preventDefault();
        if (S.freshKey(s, event.timeStamp, event.repeat)) { if (n < LEVEL_COUNT) begin(n + 1); else begin(n); }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  // ---- what the board shows ----
  const stars = levels.stars;
  const first = !stars[level.n];
  const ghost: string | null = screen === "plan" && first && !fail && !empty
    ? (level.n === 1 ? (plan.length ? "go" : best.arrows[0].dir) : level.n === 10 ? (!plan.length ? "U" : plan.length === 1 && plan[0].times === 1 ? "repeat" : null) : null)
    : null;
  const hint = showHint(misses) && screen === "plan" ? pathOf(level, best.plan).slice(1) : [];
  const note = empty ? noteFor(level, runPlan(level, []), 0) : fail && screen === "plan" ? noteFor(level, fail, plan.length) : null;
  const say = note ? `${note.title} ${note.why}` : tipFor(level, plan);
  const full = plan.length >= MAX_BLOCKS;
  const repeatOff = !plan.length || plan.at(-1)!.times >= MAX_TIMES;
  const bumpAt = fail?.bump ?? null;
  const restUp = kids.resting && screen !== "run";
  const playing = screen === "plan" || screen === "run";

  const cell = (c: Cell): CSSProperties => ({ left: `${(c.x * 100) / level.w}%`, top: `${(c.y * 100) / level.h}%` });
  const boardStyle = { "--cols": level.w, "--rows": level.h } as CSSProperties;
  const nudge = bumpAt ? ({ "--bx": bumpAt.x - at.x, "--by": bumpAt.y - at.y } as CSSProperties) : undefined;
  const shownWorld = screen === "title" || screen === "levels" || screen === "story" ? world.id : worldOf(n).id;

  return <div ref={root} className="mr" data-world={shownWorld} data-screen={screen} data-slow={slow || undefined}>
    {screen === "title" && <Title level={n} place={n} onStart={() => begin(n)} onLevels={openLevels}>
      <div className="mr-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="মঙ্গলে রোভার" text="তীর সাজিয়ে মঙ্গলে রোভার চালানোর খেলা। ছোটদের কোডিংয়ের প্রথম পাঠ, সাথে মঙ্গলের তথ্য।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === "story" && <Story onDone={endStory} />}

    {screen === "levels" && <LevelList stars={stars} current={n} onPick={pickLevel} onClose={closeLevels} />}

    {playing && <>
      <div className="mr-hud">
        <p className="mr-badge"><span className="mr-badge-n" aria-hidden="true">{bn(level.n)}</span>
          <span><b>{badgeName(level.n)}</b><small>{isFinale(level.n) ? `${world.name}: শেষ লেভেল` : world.name}</small></span></p>
        <p className="mr-count" aria-label={`${bn(level.samples.length)}টার মধ্যে ${bn(taken.length)}টা পাথর তোলা হয়েছে`}>
          <Art svg={SAMPLE} className="mr-count-icon" /><span>{bn(taken.length)}/{bn(level.samples.length)}</span>
        </p>
      </div>

      <div className="mr-board" style={boardStyle} role="img"
        aria-label={`মঙ্গলের ম্যাপ, ${bn(level.w)} ঘর চওড়া, ${bn(level.h)} ঘর লম্বা। ${bn(level.samples.length)}টা পাথর, ${bn(level.craters.length)}টা গর্ত।`}>
        {level.craters.map((c, i) => <span key={`c${i}`} className={`mr-thing mr-crater${same(bumpAt, c) && screen === "plan" ? " hit" : ""}`} style={cell(c)}><Art svg={CRATER} /></span>)}
        {hint.map((c, i) => <span key={`h${i}`} className="mr-thing mr-dot" style={cell(c)} />)}
        {trail.map((c, i) => <span key={`t${i}`} className="mr-thing mr-track" style={cell(c)} />)}
        <span className="mr-thing mr-start" style={cell(level.start)} />
        {level.samples.map((s, i) => <span key={`s${i}`} className={`mr-thing mr-sample${taken.includes(i) ? " taken" : ""}`} style={cell(s)}><Art svg={SAMPLE} /></span>)}
        <span className="mr-rover" key={spawn} data-moving={running || undefined} style={{ transform: `translate(${at.x * 100}%, ${at.y * 100}%)` }}>
          <span className={`mr-nudge${bumpAt && screen === "plan" ? " bump" : ""}`} style={nudge}><Art svg={ROVER} className={face < 0 ? "flip" : ""} /></span>
        </span>
      </div>

      <div className="mr-say" role="status" aria-live="polite">
        <p className={note ? "mr-oops" : ""}>{note ? <><b>{note.title}</b> {note.why}</> : say}</p>
      </div>

      <ol className="mr-plan" ref={queue} aria-label={`প্ল্যান: ${bn(plan.length)}টা ব্লক`}>
        {plan.length ? plan.map((block, i) => {
          const now2 = active?.block === i;
          return <li key={i}>
            <button type="button" className={`mr-block${now2 ? (fail && screen === "plan" ? " oops" : " now") : ""}${fresh === i ? " pop" : ""}`} disabled={running} onClick={() => removeAt(i)}
              aria-label={`${bn(i + 1)} নম্বর ব্লক: ${blockText(block)}। মুছতে চাপো`}>
              <i aria-hidden="true">{bn(i + 1)}</i>
              {block.times > 1 && <b>{now2 && running ? `${bn(active.turn + 1)}/${bn(block.times)}` : `${bn(block.times)} বার`}</b>}
              <Art svg={ARROW} turn={TURN[block.dir]} />
            </button>
          </li>;
        }) : <li className="mr-empty">তীরগুলো এখানে জমবে</li>}
      </ol>

      <div className="mr-controls">
        <div className="mr-pad" inert={running || undefined}>
          {PAD.map(dir => <button type="button" key={dir} data-cmd={dir} className="mr-arrow" disabled={running || full}
            onPointerDown={press(() => tapArrow(dir))} onClick={click(() => tapArrow(dir))} aria-label={`${DIRS[dir].bn} এক ঘর`}>
            <Art svg={ARROW} turn={TURN[dir]} />{ghost === dir && <Finger />}
          </button>)}
        </div>
        {running && <button type="button" key="stop" className="mr-stop" onClick={event => { event.currentTarget.blur(); halt(); }} aria-label="থামাও">
          {ICONS.stop}<span>থামাও</span>
        </button>}
      </div>
      <div className="mr-actions">
        {level.repeat && <button type="button" data-cmd="repeat" className="mr-repeat" disabled={running || repeatOff}
          onPointerDown={press(() => tapRepeat())} onClick={click(() => tapRepeat())} aria-label="শেষ ব্লকটা আরেক বার">
          <Art svg={REPEAT} /><span>আরেক বার</span>{ghost === "repeat" && <Finger />}
        </button>}
        <button type="button" data-cmd="back" className="mr-back" disabled={running || !plan.length}
          onPointerDown={press(() => back())} onClick={click(() => back())} aria-label="শেষ ব্লকটা মুছো">{ICONS.del}<span>মুছো</span></button>
        <button type="button" data-cmd="go" key="go" className="mr-go" aria-disabled={running || undefined}
          onPointerDown={press(go)} onClick={click(go)} aria-label="চালাও">
          <span>চালাও</span>{ICONS.play}{ghost === "go" && <Finger />}
        </button>
      </div>
    </>}

    {screen === "won" && result && <EndScreen result={result} slow={slow}
      onNext={() => begin(result.level < LEVEL_COUNT ? result.level + 1 : result.level)} onAgain={() => begin(result.level)} onDone={finishLevel} onShow={() => setShowing(true)} />}

    {today.last && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `mongole-rover-${today.last.n}.png`,
      make: async () => { const pictures = await loadPictures(); return renderCard(canvas => drawCard(canvas, today, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas today={today} /></div>
      <p className="mr-parent-line"><b>বড়দের জন্য:</b> প্ল্যান বানানো, চালিয়ে দেখা, ভুল ব্লক খুঁজে ঠিক করা: কোডিংয়ের গোড়ার কাজ এই তিনটাই। {today.last.plan.some(b => b.times > 1) ? "“৩ বার ↑” হলো লুপ, একই কাজ বার বার করানোর ছোট উপায়। " : ""}<small>মঙ্গলের তথ্য: {SOURCE}</small></p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
