"use client";
// IP: what we avoided — no YouTube-rhyme-channel characters, tunes or look, no Sisimpur or textbook art, no Nazrul/Jasimuddin or any modern author's rhyme; only folk ছড়া, our own flat drawings and a synthesized ঢোল.
// The game inside the shared player. The rules live in lib/ (plan.ts lays out the beats, run.ts judges taps, tick.hot.ts steps
// the clock, session.ts decides screens, pause and the rest screen); this file feeds time, taps and keys in, draws the dots,
// the ball and the picture, and plays the sounds. Nothing here speaks, and nothing is on a timer: the round ends the moment its last beat does.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, silenceScheduled, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from "../../../shared/kids-kit";
import { OG_DEMO, cardBlob, isOgHash, type CardData } from "../lib/card";
import { drum, stepOf } from "../lib/drum";
import { LEVEL_COUNT, LEVEL_IDS, isLevel, levelOf, nextInOrder, nextToPlay, placeOf, rhymeForLevel, worldOf } from "../lib/levels";
import { MAX_DOTS, groupOf, wordsOf } from "../lib/poems";
import { COUNT_IN, lineStartOf } from "../lib/plan";
import { TAP_BIG, TAP_FREE, TAP_MINE, TAP_OFF, TAP_ON, TAP_OVER, TAP_REST, createRun, rewind, starsOf, tally, tap, type Run } from "../lib/run";
import * as S from "../lib/session";
import { EV_BEAT, EV_COUNT, EV_END, advance } from "../lib/tick.hot";
import { paintBall, type Geo } from "./ball.hot";
import { CardView } from "./card-view";
import { EndScreen, type Result } from "./end-screen";
import { LevelList } from "./level-list";
import { DhuliIcon, DrumArt, Finger, HandIcon, RestMark, StickArt } from "./pictures";
import { Scene, useBuilt } from "./scene";
import { Title } from "./title";

const SLUG = "chhorar-tal";
const OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
const BEAD_GAP = 20;

type View = { focus: number; phase: number; counted: number; tick: number };

const cardOf = (result: Result): CardData => ({ level: result.level, stars: result.stars, hits: result.hits });

export function ChhorarGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const run = useRef<Run>(createRun(1));
  const [screen, setScreenState] = useState<S.Screen>("title");
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [view, setView] = useState<View>({ focus: 0, phase: 0, counted: 0, tick: 0 });
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [touched, setTouched] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const drumBtn = useRef<HTMLButtonElement>(null);
  const drumArt = useRef<HTMLDivElement>(null);
  const sticks = useRef<(HTMLSpanElement | null)[]>([null, null]);
  const ring = useRef<HTMLSpanElement>(null);
  const finger = useRef<HTMLSpanElement>(null);
  const ball = useRef<HTMLSpanElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const geo = useRef<Geo>({ px: new Float32Array(MAX_DOTS), py: new Float32Array(MAX_DOTS), n: 0, base: -1 });
  const live = useRef({ slow, level, round, stars: levels.stars, loaded: levels.loaded });
  live.current = { slow, level, round, stars: levels.stars, loaded: levels.loaded };
  const swing = useRef(0);

  // ---- the motion in flight (WAAPI), cancelled on a pause, a restart and unmount ----
  const flights = useRef<Animation[]>([]);
  const clearAll = () => { for (const flight of flights.current) flight.cancel(); flights.current = []; };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);
  const play = (node: Element | null | undefined, frames: Keyframe[], options: KeyframeAnimationOptions, soft = false) => {
    // ধীরে খেলো: nothing moves. `soft` marks an animation that only fades, which still tells the child their tap landed.
    if (!node || (live.current.slow && !soft)) return;
    const flight = node.animate(frames, options);
    flights.current.push(flight);
    flight.finished.then(() => { flights.current = flights.current.filter(item => item !== flight); }, () => {});
  };

  const sync = () => setScreenState(session.current.screen);
  const bump = () => setView(v => ({ ...v, tick: v.tick + 1 }));

  // First load: start on the first ছড়া without stars; `#og` is the site's preview image only (a fixed result, the parent card open, nothing saved).
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !levels.loaded) return;
    started.current = true;
    if (isOgHash(location.hash)) {
      session.current.screen = "end";
      setLevel(OG_DEMO.level); setRound(OG_DEMO.level);
      setResult({ ...OG_DEMO, words: 30, clapped: 31, best: 12, whole: false });
      setShowing(true); sync();
      return;
    }
    setLevel(nextToPlay(levels.stars));
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the run; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __ct: { run: () => run.current, session: () => session.current } });
  }, []);

  // ---- the player ----
  const comeBack = () => { rewind(run.current); setView(v => ({ focus: run.current.focus, phase: 0, counted: 0, tick: v.tick + 1 })); };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); clearAll(); },
    onResume: () => { if (S.resume(session.current)) comeBack(); },
    onRestart: () => { clearAll(); S.toTitle(session.current); silenceScheduled(); setShowing(false); sync(); },
    onLevels: () => { clearAll(); if (session.current.screen === "play") S.toTitle(session.current); S.openLevels(session.current); sync(); },
  });

  // ---- away and back: the first tap back only wakes the game, and the beat is counted in again ----
  useEffect(() => {
    const onBlur = () => S.blur(session.current);
    const onFocus = () => { if (S.focus(session.current)) comeBack(); };
    const onVisibility = () => { if (document.hidden) S.blur(session.current); else onFocus(); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector(".ct-grown .kk-gate-open, .ct-grown .kk-gate");
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener("pointerdown", down, true);
    return () => node.removeEventListener("pointerdown", down, true);
  }, []);

  // ---- rounds ----
  function begin(id: number) {
    const s = session.current;
    clearAll(); silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    run.current = createRun(id);
    geo.current.n = 0; geo.current.base = -1;
    setRound(id); setResult(null); setShowing(false); setTouched(false);
    setView({ focus: 0, phase: 0, counted: 0, tick: 0 });
    drum.start(worldOf(id).id);
    sync();
  }

  /** The ছড়া's last beat ended: stars saved and the daily limit checked at this very moment, then the end screen. */
  function finishRun() {
    const r = run.current, s = session.current;
    if (!S.finished(s, kids.atBreak(), performance.now())) return;
    const got = tally(r), stars = starsOf(got.hits, got.words), id = r.level, before = live.current.stars;
    const wasComplete = LEVEL_IDS.every(item => before[item]);
    const whole = !wasComplete && LEVEL_IDS.every(item => item === id || before[item]);
    levels.record(id, stars);
    const done: Result = { level: id, stars, hits: got.hits, words: got.words, clapped: got.clapped, best: got.best, whole };
    setResult(done);
    const world = worldOf(id).id, big = !!levelOf(id).finale;
    drum.end(world, big);
    if (!live.current.slow && (whole || big)) confetti({ count: whole ? 110 : 60, y: 0.3 });
    sync();
  }

  // The steady beat: the clock runs only while the window has focus, and a beat starts a sound and a drawing the moment it comes.
  function onEvents(events: number) {
    const r = run.current, { beats } = r.plan;
    if (events & EV_COUNT) { tapFinger(); drum.count(r.counted >= COUNT_IN); setView(v => ({ ...v, phase: 0, counted: r.counted, focus: r.focus })); }
    if (events & EV_BEAT) {
      const beat = beats[r.index];
      if (beat.word >= 0) {
        tapFinger();
        if (beat.dhuli) { if (beat.guide !== "none") { drum.stick(r.index % 2 === 1, beat.big); hit(r.index % 2); } }
        else if (beat.guide === "full") drum.tick();
        if (beat.guide !== "none" || beat.dhuli) bobScene();
      }
      if (beat.last) {
        drum.bead();
        const rhyme = rhymeForLevel(r.level), group = groupOf(rhyme, beat.line);
        if (group >= 0 && rhyme.groups[group].some(line => line < beat.line)) drum.mil(worldOf(r.level).id, 0.12);
      }
      setView(v => ({ focus: r.index, phase: 1, counted: v.counted, tick: v.tick + 1 }));
    }
    if (events & EV_END) finishRun();
  }
  useGameLoop(dt => {
    const s = session.current;
    if (s.screen !== "play" || s.paused || s.away) return;
    const events = advance(run.current, dt * 1000);
    if (events) onEvents(events);
  }, () => paintBall(ball.current, geo.current, run.current, live.current.slow), screen === "play");

  // ---- motion ----
  /** A stick comes down: 0 left, 1 right. */
  function hit(side: number) {
    const stick = sticks.current[side];
    play(stick, [{ transform: `rotate(${side ? 40 : -40}deg)` }, { transform: `rotate(${side ? -96 : 96}deg)`, offset: 0.35 }, { transform: `rotate(${side ? 40 : -40}deg)` }], { duration: 200, easing: OUT });
    play(drumArt.current, [{ transform: "scale(1)" }, { transform: "scale(.96, 1.03)", offset: 0.35 }, { transform: "scale(1)" }], { duration: 180, easing: OUT });
  }
  /** The ghost finger presses the drum on the beat (the very first run only): down as the ball lands, then up. */
  function tapFinger() {
    if (live.current.slow) play(finger.current, [{ opacity: 1 }, { opacity: 0.55, offset: 0.5 }, { opacity: 1 }], { duration: 500, easing: "linear" }, true);
    else play(finger.current, [{ transform: "translate(0, 0)" }, { transform: "translate(8px, 12px)", offset: 0.55 }, { transform: "translate(8px, 12px)" }], { duration: 520, easing: OUT });
  }
  function bobScene() {
    svg.current?.querySelectorAll(".bob").forEach(node => play(node, [{ transform: "translateY(0)" }, { transform: "translateY(-6px)", offset: 0.4 }, { transform: "translateY(0)" }], { duration: 260, easing: OUT }));
  }
  function flash(near: boolean) {
    const node = ring.current;
    if (!node) return;
    node.dataset.near = near ? "1" : "0";
    if (live.current.slow) play(node, [{ opacity: near ? 1 : 0.55 }, { opacity: 0 }], { duration: 260, easing: "linear" }, true);
    else play(node, [{ opacity: near ? 1 : 0.55, transform: "scale(.82)" }, { opacity: 0, transform: `scale(${near ? 1.22 : 1.08})` }], { duration: near ? 300 : 240, easing: OUT });
  }

  // ---- a tap on the drum, by finger or key ----
  function onTap(viaKey: boolean) {
    const s = session.current;
    if (s.screen !== "play") return;
    if (S.tapCounts(s) !== "counts") return;
    const r = run.current, flags = tap(r);
    if (flags & TAP_OVER) return;
    setTouched(true);
    swing.current ^= 1;
    if (!viaKey) hit(swing.current);
    const spec = r.plan.beats[r.judged], world = worldOf(r.level).id;
    if (flags & TAP_ON) {
      const count = wordsOf(rhymeForLevel(r.level).lines[spec.line]).length;
      drum.clap(world, stepOf(spec.line, spec.word, count), !!(flags & TAP_BIG));
      flash(true);
      if (flags & TAP_MINE || spec.guide === "none" || !spec.mine) { bobScene(); bump(); }
    } else if (flags & TAP_FREE) { drum.clap(world, 0, false); flash(true); }
    else if (flags & (TAP_OFF | TAP_REST)) { drum.soft(); flash(false); }
  }
  const lastKeyAt = useRef(0);
  const onPointer = (event: ReactPointerEvent<HTMLButtonElement>) => {
    // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
    if (!event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    onTap(false);
  };

  // ---- screens ----
  const toTitle = () => { clearAll(); S.toTitle(session.current); sync(); };
  const finishScreen = () => {
    // শেষ: back to the title with the next ছড়া ready. Nothing starts by itself.
    const after = nextInOrder(round) || nextToPlay(live.current.stars);
    setLevel(after);
    toTitle();
  };
  const openLevels = () => { S.openLevels(session.current); drum.bead(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = "title"; begin(id); };
  const again = () => { if (S.endLive(session.current, performance.now())) begin(round); };
  const done = () => { if (S.endLive(session.current, performance.now())) finishScreen(); };

  // ---- keys at the window, so Space and Enter never press the last clicked button and never scroll the page ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show")) return;
      const s = session.current;
      if (kids.resting && s.screen !== "play") return;
      const route = S.routeKey(s, event.key, event.repeat, performance.now());
      if (route.prevent) event.preventDefault();
      switch (route.act) {
        case "pause": player.requestPause(); break;
        case "start": begin(live.current.level); break;
        case "tap": lastKeyAt.current = performance.now(); onTap(true); break;
        case "again": begin(live.current.round); break;
        case "done": finishScreen(); break;
      }
    };
    // Space is activated on keyup for a button: keep it from clicking whatever was last pressed.
    const up = (event: KeyboardEvent) => {
      const s = session.current;
      if ((event.key === " " || event.key === "Enter") && (s.screen === "title" || s.screen === "play" || s.screen === "end") && !(event.target as HTMLElement | null)?.closest?.(".kk-gate, .kk-gate-open, .kk-rest, .kk-show")) event.preventDefault();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // ---- what is on screen ----
  const r = run.current, plan = r.plan;
  const focus = Math.min(view.focus, plan.beats.length - 1), beat = plan.beats[focus];
  const rhyme = rhymeForLevel(screen === "play" || screen === "end" ? round : level), spec = levelOf(screen === "play" || screen === "end" ? round : level);
  const world = worldOf(screen === "play" || screen === "end" ? round : level);
  const lineStart = lineStartOf(plan, focus), words = wordsOf(rhyme.lines[beat.line] ?? "");
  const lineKey = `${round}-${beat.pass}-${beat.line}`;
  const playing = view.phase === 1;
  const built = beat.pass === 0 ? (playing ? beat.line + 1 : beat.line) : rhyme.lines.length;
  useBuilt(svg, rhyme.id, screen === "play" ? built : 0);

  // Measure the dots of the line on screen (and again when the stage is resized), so the ball can hop between them.
  useLayoutEffect(() => {
    const box = wrap.current;
    if (!box || screen !== "play") return;
    const measure = () => {
      const dots = box.querySelectorAll<HTMLElement>(".ct-dot, .ct-restdot"), g = geo.current;
      g.n = Math.min(dots.length, MAX_DOTS); g.base = lineStartOf(run.current.plan, Math.min(run.current.focus, run.current.plan.beats.length - 1));
      dots.forEach((dot, index) => { if (index < MAX_DOTS) { g.px[index] = dot.offsetLeft + dot.offsetWidth / 2 - 11; g.py[index] = dot.offsetTop + dot.offsetHeight / 2 - 22; } });
    };
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(box);
    return () => watch.disconnect();
  }, [lineKey, screen]);

  const fresh = levels.loaded && Object.keys(levels.stars).length === 0;
  const restUp = kids.resting && screen !== "play";
  const owner = beat.dhuli ? "dhuli" : "you";
  const guide = beat.guide;
  const lineCount = rhyme.lines.length, beadW = Math.max(lineCount, 4) * BEAD_GAP, beadX = (line: number) => (beadW - lineCount * BEAD_GAP) / 2 + line * BEAD_GAP + BEAD_GAP / 2;
  const lineDone = (line: number) => line < beat.line || (line === beat.line && beat.last && playing);

  return <div ref={root} className="ct" data-world={world.id} data-screen={screen} data-slow={slow || undefined} data-guide={screen === "play" ? guide : undefined} data-owner={owner} data-echo={spec.echo || undefined}
    style={{ "--beat": `${spec.beatMs}ms` } as CSSProperties}>
    {screen === "title" && <Title level={level} fresh={fresh} onStart={() => begin(level)} onLevels={openLevels}>
      <div className="ct-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="ছড়ার তালে" text="হাট্টিমা টিম টিম, আতা গাছে তোতা পাখি: ঢোলে তাল দিয়ে পুরোনো ছড়া বলার খেলা। ৩–৬ বছরের জন্য।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === "levels" && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {screen === "play" && <>
      <div className="ct-hud">
        <p className="ct-badge"><b>{bn(placeOf(round))}</b><span>{spec.finale ?? spec.title}</span></p>
        <ol className="ct-who" aria-label={owner === "dhuli" ? "ঢুলির পালা" : "তোমার পালা"}>
          <li data-on={owner === "dhuli" || undefined}><DhuliIcon /></li>
          <li data-on={owner === "you" || undefined}><HandIcon /></li>
        </ol>
        <ol className="ct-passes" aria-hidden="true">{Array.from({ length: spec.passes }, (_, n) => <li key={n} data-on={n === beat.pass || undefined} data-done={n < beat.pass || undefined} />)}</ol>
      </div>

      <div className="ct-scene" aria-hidden="true">
        <Scene id={rhyme.id} svgRef={svg} />
        {view.phase === 0 && <p className="ct-count" key={view.counted}><span data-on={view.counted >= 1 || undefined}>{bn(2)}</span><span data-on={view.counted >= 2 || undefined}>{bn(1)}</span></p>}
      </div>

      <svg className="ct-beads" viewBox={`0 0 ${beadW} 30`} aria-hidden="true">
        {rhyme.groups.map((group, g) => group.flatMap((line, at) => group.slice(0, at).map(earlier => ({ g, from: earlier, to: line })))).flat().map(thread => {
          const on = lineDone(thread.from) && lineDone(thread.to), a = beadX(thread.from), b = beadX(thread.to);
          return <path key={`${thread.from}-${thread.to}`} className="ct-thread" data-g={thread.g} data-on={on || undefined} pathLength={1} d={`M${a} 20 Q${(a + b) / 2} ${20 - Math.min(18, (b - a) / 3 + 4)} ${b} 20`} />;
        })}
        {rhyme.lines.map((_, line) => <circle key={line} className="ct-bead" data-g={groupOf(rhyme, line)} data-done={lineDone(line) || undefined} data-now={line === beat.line || undefined} cx={beadX(line)} cy={20} r={6.5} />)}
      </svg>

      <div className="ct-words" ref={wrap}>
        <p className="ct-line" key={lineKey}>
          {words.map((word, index) => {
            const at = lineStart + index, hitIt = r.hit[at] === 1;
            const state = guide === "none" ? (hitIt ? "said" : "") : playing && index === beat.word ? "now" : playing && (index < beat.word || beat.word < 0) ? "said" : "";
            return <span className="ct-w" key={index} data-state={state || undefined} data-hit={hitIt || undefined} data-big={plan.beats[at]?.big || undefined}>
              <i className="ct-dot" /><b>{word}</b>
            </span>;
          })}
          {spec.rests && <span className="ct-w ct-restw" data-state={playing && beat.word < 0 ? "now" : undefined}><i className="ct-restdot"><RestMark /></i></span>}
        </p>
        <span className="ct-ball" ref={ball} aria-hidden="true" />
      </div>

      <div className="ct-drumrow">
        <span className="ct-stick l" ref={node => { sticks.current[0] = node; }} aria-hidden="true"><StickArt /></span>
        <span className="ct-stick r" ref={node => { sticks.current[1] = node; }} aria-hidden="true"><StickArt /></span>
        <button type="button" ref={drumBtn} className="ct-drum" aria-label="ঢোল বাজাও" tabIndex={-1}
          onPointerDown={onPointer} onClick={event => { if (event.detail === 0 && performance.now() - lastKeyAt.current > 400) onTap(false); }}>
          <div className="ct-drum-box" ref={drumArt}><DrumArt /></div>
          <span className="ct-ring" ref={ring} aria-hidden="true" />
          {fresh && !touched && <Finger fingerRef={finger} />}
        </button>
      </div>
    </>}

    {screen === "end" && result && <EndScreen result={result} resting={kids.resting} onAgain={again} onDone={done} onShow={() => setShowing(true)} />}

    {result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `chhorar-tal-${rhymeForLevel(result.level).id}.png`, make: () => cardBlob(cardOf(result), location.host) }}>
      <div className="kit-card"><CardView data={cardOf(result)} /></div>
      <p className="ct-parent-line"><b>বড়দের জন্য:</b> তাল ধরা আর শেষের মিল শোনা, পড়তে শেখার আগের ধাপ। আজ রাতে ছড়াটা একসাথে বলো, প্রতি শব্দে একটা তালি। {rhymeForLevel(result.level).source}।</p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
