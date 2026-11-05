"use client";
// IP: what we avoided — no লুডু/সাপলুডু board, no Snakes-and-Ladders or any app's look, no TV characters; the straight numbered track is the public research design (Siegler & Ramani 2008), and the river, ghats, নৌকা and চরকি are our own code art.
// The game inside the shared player. The rules live in lib/ (sim.ts plays a race, clock.hot.ts moves it, session.ts decides
// screens, pause and the rest screen); this file feeds taps and keys in, reads the race's events, draws and plays the sounds.
// The one clock is the fixed-step loop: when the player pauses or the window is blurred, both boats simply stop.
import { useEffect, useReducer, useRef, useState, type CSSProperties } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, newSeed, shake, silenceScheduled, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from "../../../shared/kids-kit";
import { landAngle } from "../lib/art";
import { advance } from "../lib/clock.hot";
import { cardBlob, type Today } from "../lib/card";
import { LEVEL_COUNT, bn, ghatAt, isLevel, levelOf, nextInOrder, nextToPlay, placeOf, worldOf } from "../lib/levels";
import { drawSky, farTile } from "../lib/scene";
import * as S from "../lib/session";
import { EV, IGNORE, MISS, canSpin, expected, newRace, resultOf, spinNow, tap, type Race, type Result } from "../lib/sim";
import { sound } from "../lib/sound";
import { EndScreen } from "./end-screen";
import { LevelList } from "./level-list";
import { RoundCard } from "./round-card";
import { River, type Pop } from "./river";
import { Face, Pips, Spinner } from "./spinner";
import { Title } from "./title";

const SLUG = "dosh-ghater-nouka";
const MODE_KEY = "ektukhani-mode-dosh-ghater-nouka";
const readMode = () => { try { return localStorage.getItem(MODE_KEY) === "duo"; } catch { return false; } };
const writeMode = (duo: boolean) => { try { localStorage.setItem(MODE_KEY, duo ? "duo" : "phone"); } catch { /* private mode: fine */ } };

export function NoukaGame() {
  const levels = useLevels(SLUG, LEVEL_COUNT);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const race = useRef<Race>(newRace(6, 1));
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const [screen, setScreen] = useState<S.Screen>("title");
  const [level, setLevel] = useState(6);
  const [duo, setDuo] = useState(false);
  const [today, setToday] = useState<Today>({ games: 0, counted: 0, n: 5, back: false });
  const [result, setResult] = useState<Result | null>(null);
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const [view, setView] = useState(340);
  const root = useRef<HTMLDivElement>(null), sky = useRef<HTMLCanvasElement>(null);
  const ghats = useRef<(HTMLButtonElement | null)[]>([]);
  const angles = useRef<[number, number]>([0, 0]);
  const pops = useRef<[Pop | null, Pop | null]>([null, null]);
  const popKey = useRef(0);
  const lastKey = useRef(0);
  const byKeyboard = useRef(false);
  const live = useRef({ slow, level, stars: levels.stars });
  live.current = { slow, level, stars: levels.stars };

  const sync = () => setScreen(session.current.screen);

  // ---- first load: this phone's progress picks the level that's ready; the last mode is remembered ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setLevel(nextToPlay(levels.stars));
    const saved = readMode();
    session.current.duo = saved; setDuo(saved);
  }, [levels.loaded, levels.stars]);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the race; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __dg: { race: () => race.current, session: () => session.current, tap: (k: number) => onGhat(k, ghats.current[k] ?? null), spin: () => onSpin() } });
  });

  // ---- the player: the clock is the loop, which the player's pause stops; the session just refuses taps ----
  const player = useGamePlayer({
    onPause: () => S.pause(session.current),
    onResume: () => { S.resume(session.current); setIdle(false); },
    onRestart: () => { silenceScheduled(); S.toTitle(session.current); setShowing(false); sync(); },
    onLevels: () => { silenceScheduled(); S.toTitle(session.current); S.openLevels(session.current); setShowing(false); sync(); },
  });

  // ---- away and back: the first tap back only wakes the game ----
  useEffect(() => {
    const onBlur = () => S.blur(session.current);
    const onFocus = () => S.focus(session.current);
    const onVisibility = () => { if (document.hidden) S.blur(session.current); else S.focus(session.current); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); silenceScheduled(); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector(".dg-grown .kk-gate-open, .dg-grown .kk-gate");
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener("pointerdown", down, true);
    return () => node.removeEventListener("pointerdown", down, true);
  }, []);

  // ---- the stage's width, so the ghats keep their size ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const measure = () => setView(Math.max(240, node.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ---- the world's sky, drawn once per world and size ----
  const worldId = levelOf(screen === "play" || screen === "end" ? race.current.level : level).world;
  useEffect(() => {
    const canvas = sky.current, box = canvas?.parentElement;
    if (!canvas || !box) return;
    const paint = () => { const w = box.clientWidth, h = box.clientHeight; if (w > 40 && h > 40) drawSky(canvas, worldId, w, h); };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(box);
    return () => observer.disconnect();
  }, [worldId, screen === "play"]);

  // ---- the race's events, read after every step and after every press ----
  function drain() {
    const r = race.current;
    if (!r.nev) return;
    const spec = levelOf(r.level), s = session.current;
    for (let at = 0; at < r.nev; at++) {
      switch (r.evs[at]) {
        case EV.SPIN_START: {
          const wobble = ((r.spins * 7 + r.n) % 9) / 9 - 0.5;
          angles.current[0] = Math.floor(angles.current[0] / 360) * 360 + 720 + landAngle(r.face, r.faces, wobble);
          sound.spin(live.current.slow);
          setIdle(false);
          break;
        }
        case EV.RIVAL_SPIN: {
          const wobble = ((r.rSpins * 5 + r.n) % 9) / 9 - 0.5;
          angles.current[1] = Math.floor(angles.current[1] / 360) * 360 + 720 + landAngle(r.rFace, r.faces, wobble);
          break;
        }
        case EV.SPIN_LAND: {
          sound.land();
          if (byKeyboard.current) ghats.current[expected(r)]?.focus({ preventScroll: true });
          break;
        }
        case EV.STEP: pops.current[0] = { ghat: ghatAt(spec, r.pos[0]), who: 0, key: ++popKey.current }; sound.ghat(ghatAt(spec, r.pos[0]), spec.dir); break;
        case EV.STEP_OTHER: pops.current[1] = { ghat: ghatAt(spec, r.pos[1]), who: 1, key: ++popKey.current }; sound.ghat(ghatAt(spec, r.pos[1]), spec.dir); break;
        case EV.RIVAL_STEP: pops.current[1] = { ghat: ghatAt(spec, r.pos[1]), who: 1, key: ++popKey.current }; sound.rival(ghatAt(spec, r.pos[1]), spec.dir); break;
        case EV.IDLE: setIdle(true); break;
        case EV.ARRIVED: {
          // The race is finished at this moment: stars saved and the limit checked now, whatever the hand does next.
          if (S.arrived(s, kids.atBreak())) {
            const done = resultOf(r);
            levels.record(done.level, done.stars);
            setResult(done);
            setToday(before => ({ games: before.games + 1, counted: before.counted + r.counted, n: Math.max(before.n, r.n), back: before.back || spec.dir < 0 }));
            sound.arrive(spec.world);
          }
          break;
        }
        case EV.CARD: {
          S.cardShows(s, performance.now());
          // Under the rest screen the race ends quietly.
          if (!s.resting) {
            sound.stars(resultOf(r).stars);
            if (spec.finale) { sound.tune(spec.world); if (!live.current.slow) confetti({ count: 80, y: 0.3 }); }
          }
          sync();
          break;
        }
        default: break;
      }
    }
    r.nev = 0;
    bump();
  }

  // A window focus restarts the loop even while the pause menu is still open, so the clock also checks the session.
  useGameLoop(dt => { if (S.clockMayRun(session.current)) advance(race.current, dt * 1000); }, drain, screen === "play");

  // ---- races ----
  function begin(id: number) {
    const s = session.current;
    silenceScheduled();
    if (!isLevel(id)) return;
    setLevel(id);
    // Opening a race is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    race.current = newRace(id, newSeed(), { duo: s.duo, slow: live.current.slow });
    angles.current = [0, 0]; pops.current = [null, null];
    setResult(null); setShowing(false); setIdle(false);
    sound.tap();
    sync();
  }

  /** A ghat, by finger or key. */
  function onGhat(k: number, element: HTMLElement | null) {
    if (S.touch(session.current) !== "counts") return;
    const out = tap(race.current, k);
    if (out === IGNORE) { sound.tap(); return; }
    setIdle(false);
    if (out === MISS) { sound.miss(); shake(element); }
    drain();
  }

  function onSpin() {
    if (S.touch(session.current) !== "counts") return;
    if (!spinNow(race.current)) { sound.tap(); return; }
    setIdle(false);
    drain();
  }

  // ---- screens ----
  const toTitle = () => { silenceScheduled(); S.toTitle(session.current); sync(); };
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    const after = nextInOrder(race.current.level) || nextToPlay(live.current.stars);
    setLevel(after);
    toTitle();
  };
  const openLevels = () => { S.openLevels(session.current); sound.tap(); sync(); };
  const closeLevels = () => { S.closeLevels(session.current); sync(); };
  const pickLevel = (id: number) => { S.closeLevels(session.current); session.current.screen = "title"; begin(id); };
  const chooseMode = (next: boolean) => {
    if (!S.chooseMode(session.current, next)) return;
    setDuo(next); writeMode(next); sound.tap();
  };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show")) return;
      const s = session.current, key = event.key;
      byKeyboard.current = true;
      if (kids.resting && s.screen !== "play") return;
      if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title" && (key === "Enter" || key === " ")) { event.preventDefault(); if (!event.repeat) begin(live.current.level); return; }
      if (s.screen === "play") {
        const items = ghats.current;
        if (key === "ArrowRight" || key === "ArrowLeft") {
          event.preventDefault();
          const at = items.findIndex(node => node && node === document.activeElement), r = race.current;
          const cols = items.map((node, k) => node ? { node, col: ghatAt(levelOf(r.level), k) } : null).filter(Boolean).sort((a, b) => a!.col - b!.col);
          const index = cols.findIndex(entry => entry!.node === items[at]);
          const next = cols[Math.max(0, Math.min(cols.length - 1, (index < 0 ? 0 : index) + (key === "ArrowRight" ? 1 : -1)))];
          next?.node.focus({ preventScroll: true });
          return;
        }
        if (key === "Enter" || key === " ") {
          event.preventDefault();
          if (event.repeat) return;
          lastKey.current = performance.now();
          const focused = items.findIndex(node => node && node === document.activeElement);
          if (focused > 0 && race.current.spin > 0) onGhat(focused, items[focused]); else onSpin();
        }
        return;
      }
      if (s.screen === "end" && (key === "Enter" || key === " ")) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(race.current.level); }
    };
    const pointer = () => { byKeyboard.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("pointerdown", pointer, true);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("pointerdown", pointer, true); };
  });

  // ---- what the screen shows ----
  const r = race.current, playing = screen === "play" || screen === "end";
  const spec = levelOf(playing ? r.level : level);
  const G = Math.round(Math.min(120, Math.max(104, view / 3.5)));
  const focusAt = (r.pos[r.over ? 0 : r.turn] ? ghatAt(spec, r.pos[r.over ? 0 : r.turn]) : ghatAt(spec, 0)) + 0.5;
  const total = (spec.n + 2) * G;
  const cam = Math.max(0, Math.min(Math.max(0, total - view), focusAt * G - view * (spec.dir > 0 ? 0.32 : 0.68)));
  const firstRun = levels.loaded && Object.keys(levels.stars).length === 0 && r.turns === 0 && r.level === 6;
  const spinnable = canSpin(r);
  const mine = r.turn === 0;
  const ghostSpin = screen === "play" && spinnable && mine && (firstRun || idle);
  const ghostK = screen === "play" && r.spin > 0 && !r.auto && mine && (firstRun || idle) ? expected(r) : 0;
  const rivalName = duo ? "আব্বু-আম্মুর নৌকা" : "আব্বুর নৌকা";
  const restUp = kids.resting && screen !== "play";
  const strip = (player: 0 | 1) => r.pos[player] / r.n;

  return <div ref={root} className="dg" data-world={worldId} data-screen={screen} data-over={(screen === "play" && r.over) || undefined} data-slow={slow || undefined}>
    {screen === "title" && <Title level={level} duo={duo} onStart={() => begin(level)} onLevels={openLevels} onMode={chooseMode}>
      <div className="dg-grown">
        <ParentGate key={gateKey} label="বড়দের জন্য">
          <ShareToolLink title="দশ ঘাটের নৌকা" text="১ থেকে ২০ গোনার নৌকাবাইচ, ছোটদের জন্য। ফ্রি, অ্যাকাউন্ট লাগে না।" />
        </ParentGate>
      </div>
    </Title>}

    {screen === "levels" && <LevelList stars={levels.stars} current={level} onPick={pickLevel} onClose={closeLevels} />}

    {(screen === "play" || screen === "end") && <div className="dg-hud">
      <p className="dg-badge"><span className="dg-badge-n" aria-hidden="true">{bn(spec.n)}</span>
        <span><b>{spec.finale ? spec.title : worldOf(r.level).name}</b><small>লেভেল {bn(placeOf(r.level))}{spec.finale ? " · ফিনালে" : ""}</small></span></p>
      <div className="dg-strip" role="img" aria-label={`${bn(r.pos[0])} ঘাট গোনা হয়েছে, ${bn(spec.n)}টার মধ্যে`}>
        <span className="dg-strip-bar" />
        <span className="dg-strip-flag" />
        {spec.rival && <em className="dg-strip-1" style={{ "--p": strip(1) } as CSSProperties} />}
        <em className="dg-strip-0" style={{ "--p": strip(0) } as CSSProperties} />
      </div>
    </div>}

    {screen === "play" && <>
      <River race={r} level={spec} view={view} G={G} cam={cam} slow={slow} pops={pops.current} ghostK={ghostK} rivalName={rivalName} ghats={ghats} onGhat={onGhat} far={farTile(worldId)} sky={sky} />
      <div className="dg-controls">
        <div className="dg-yours">
          <Spinner faces={spec.faces} angle={angles.current[0]} ms={r.spinMs} slow={slow} active={spinnable} ghost={ghostSpin} onSpin={onSpin} turn={r.turn} />
          <Pips value={mine && r.spin > 0 ? r.target - r.pos[0] : !mine && r.spin > 0 ? r.target - r.pos[1] : 0} who={r.turn} />
        </div>
        {spec.rival && !duo && <div className="dg-his">
          <span className="dg-spin dg-spin-small" aria-hidden="true"><Face faces={spec.faces} angle={angles.current[1]} ms={r.spinMs} slow={slow} /></span>
          <Pips value={r.rOwed} who={1} />
        </div>}
      </div>
    </>}

    {screen === "end" && result && <EndScreen result={result} slow={slow} onAgain={() => begin(race.current.level)} onDone={finishRound} onShow={() => setShowing(true)} />}

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${SLUG}.png`, make: () => cardBlob(today, location.host) }}>
      <RoundCard today={today} />
    </ShowParent>
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}

