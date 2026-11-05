"use client";
// IP: what we avoided — no Inside Out or any film's emotion characters, colours-as-characters or look, no Sisimpur/Meena faces, no emoji; the faces, children, scenes and icons are our own code art.
// Thin React over the pure game: lib/round.ts plays a round, lib/session.ts decides which screen shows and what a tap may do.
// A kids' page: nothing the child does leaves the phone, and nothing speaks. The card and the tool's link sit behind the parent gate.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, shake, totalStars, useSlowMode, type LevelStars } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from "../../../shared/kids-kit";
import { FEELINGS } from "../lib/faces";
import { cardBlob, cardFontSample, drawCard, type CardData } from "../lib/draw-card";
import { levelOf, nextUp, placeInWorld, recommended, worldLevels, worldOf, type WorldId } from "../lib/levels";
import { againLine, alsoLine, bn, kindQuestion, mirrorLine, question, sayLine, type Today } from "../lib/lines";
import { MOVED_KEY, STARS_KEY, WORLD_KEY, moveOldStars, readStars, readWorld } from "../lib/progress";
import { advance, chooseKind, createRound, fitting, glows, isLast, nameFeeling, sceneOf, type Round } from "../lib/round";
import {
  back, begin as sessionBegin, choosingAllowed, closeList, createSession, endLive, home, leave, openList, pause, restShows, resume, stepped, tapCounts, toEnd, won, type Screen,
} from "../lib/session";
import { finishRound } from "../lib/finish";
import { boing, fill, swish, warm, worldTune } from "../lib/sound";
import { Child, Face, Ghost, KindIcon, NextIcon, SceneArt } from "./art";
import { EndScreen, type Result } from "./end-screen";
import { LevelList } from "./level-list";
import { Title } from "./title";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const CONFETTI = ["#f2a900", "#e24b3b", "#2e9e44", "#1e63d6", "#f48fb1", "#7151a3"];
const IDLE_MS = 7000;

export function MonerGame() {
  const [session] = useState(createSession);
  const [screen, setScreen] = useState<Screen>("title");
  const [, setPaused] = useState(false);
  const [world, setWorld] = useState<WorldId>("rod");
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const worldRef = useRef<WorldId>("rod");
  const [firstRound] = useState(() => createRound(1, 1));
  const round = useRef<Round>(firstRound);
  const [version, setVersion] = useState(0);
  const [nudge, setNudge] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<Today>({ scenes: 0, feelings: [] });
  const todayRef = useRef(today);
  const [showing, setShowing] = useState(false);
  const showingRef = useRef(false);
  showingRef.current = showing;
  const [touched, setTouched] = useState(false);
  const [idle, setIdle] = useState(false);
  const [slow] = useSlowMode();
  const [stars, setStars] = useState<LevelStars>({});
  const [loaded, setLoaded] = useState(false);
  const starsRef = useRef(stars);
  starsRef.current = stars;
  const { resting, atBreak, extend } = useKidsSession();
  session.resting = resting;
  const chosen = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  /** The game's keys work only while the stage is on screen, so Space still scrolls the page below it. */
  const inView = useRef(true);
  const cardData = useRef<CardData | null>(null);

  const sync = () => { setScreen(session.screen); setPaused(session.paused); };
  const redraw = () => setVersion(value => value + 1);

  /** A level ready on the title (nothing starts until খেলো). */
  function prepare(next: number) {
    const spec = levelOf(next);
    levelRef.current = spec.id; worldRef.current = spec.world;
    setLevel(spec.id); setWorld(spec.world);
  }

  /** খেলো or আবার খেলো: a fresh round of the chosen level. Past today's limit the rest screen comes instead. */
  function begin() {
    const now = performance.now();
    if (!sessionBegin(session, atBreak(), now)) { sync(); return; }
    chosen.current = true;
    // The quiet ease carries over to the next round until five first-try fits lift it.
    const before = round.current;
    round.current = createRound(levelRef.current, newSeed(), before.eased && before.rightRun < 5, before.rightRun);
    setResult(null); setShowing(false); setIdle(false);
    swish();
    sync(); redraw();
  }

  /** The last picture's kind thing is chosen: the stars and today's limit are settled at this tap, never in a timer. */
  function finish(r: Round) {
    const spec = levelOf(r.level);
    const done = finishRound(session, starsRef.current, todayRef.current, r, atBreak());
    if (!done) return;
    starsRef.current = done.stars; setStars(done.stars);
    write(STARS_KEY, JSON.stringify(done.stars));
    todayRef.current = done.today; setToday(done.today);
    setResult({
      level: r.level, stars: done.earned, found: done.found, colors: done.colors,
      title: spec.finale ? "পুরো পাতা রঙিন হলো" : "ছবিগুলোয় রং ভরল", away: mirrorLine(r.level), finale: spec.finale ? `★ ${spec.name}` : null,
    });
    if (spec.finale) { worldTune(worldOf(spec.world).root); confetti({ colors: CONFETTI, count: 60 }); }
  }

  /** A face is tapped. */
  function pickFace(feeling: keyof typeof FEELINGS, element: Element | null) {
    const now = performance.now();
    if (tapCounts(session, now) !== "counts") return;
    const r = round.current, outcome = nameFeeling(r, feeling);
    if (outcome === "ignore") return;
    setTouched(true); setIdle(false);
    if (outcome === "again") { boing(); shake(element); setNudge(value => value + 1); redraw(); return; }
    stepped(session, now);
    fill(feeling);
    redraw();
  }

  /** One of the two kind pictures. On the last picture this wins the round. */
  function pickKind(choice: number) {
    const now = performance.now();
    if (tapCounts(session, now) !== "counts") return;
    const r = round.current;
    if (chooseKind(r, choice) === "ignore") return;
    setTouched(true); setIdle(false);
    stepped(session, now);
    warm(choice);
    if (r.full) finish(r);
    redraw();
  }

  /** → : the next picture, or the end screen once the last one is done. */
  function next() {
    const now = performance.now(), r = round.current;
    if (r.step !== "after" || tapCounts(session, now) !== "counts") return;
    setTouched(true); setIdle(false);
    if (r.full) { if (toEnd(session, now)) { sfx.pop(); sync(); } return; }
    if (advance(r)) { stepped(session, now); swish(); redraw(); }
  }

  /** শেষ: back to the title with the next level ready. */
  function finishUp() {
    if (!endLive(session, performance.now())) return;
    sfx.tap();
    home(session); setResult(null); setShowing(false);
    prepare(nextUp(levelRef.current));
    sync();
  }

  /** নতুন করে শুরু: this level's title. */
  function toTitle(next: number) {
    home(session); setResult(null); setShowing(false);
    prepare(next);
    sync();
  }

  function pickWorld(id: WorldId) {
    if (!choosingAllowed(session)) return;
    sfx.tap();
    chosen.current = true;
    write(WORLD_KEY, id);
    prepare(recommended(id, starsRef.current));
  }
  const showList = () => { if (openList(session)) { sfx.tap(); chosen.current = true; sync(); } };
  const pickLevel = (id: number) => { if (session.screen !== "list") return; sfx.tap(); chosen.current = true; closeList(session, true); setResult(null); prepare(id); sync(); };
  const hideList = () => { closeList(session, false); sync(); };

  // Saved stars: the first version's six sets move once to the new level ids, then every level is read. The world last played opens.
  useEffect(() => {
    const moved = moveOldStars(read);
    if (moved) { write(STARS_KEY, JSON.stringify(moved)); write(MOVED_KEY, "1"); }
    const saved = moved ?? readStars(read(STARS_KEY));
    setStars(saved); setLoaded(true);
    if (!chosen.current && session.screen === "title") prepare(recommended(readWorld(read(WORLD_KEY)), saved));
  }, []);

  // Between rounds is a break: if today's time runs out on the title or the end screen, rest comes now, never mid-round.
  useEffect(() => {
    if (screen === "play" || resting) return;
    const check = setInterval(() => { atBreak(); }, 1000);
    return () => clearInterval(check);
  }, [screen, resting, atBreak]);

  // The ghost finger comes back after a wait (a hint, not progress). It stops while the pause menu is open.
  const player = useGamePlayer({
    onPause: () => { pause(session); sync(); },
    onResume: () => { resume(session); sync(); },
    onRestart: () => { resume(session); toTitle(levelRef.current); atBreak(); },
    // সব লেভেল in the pause menu: the round is left unfinished (nothing recorded), and leaving it is a break.
    onLevels: () => { if (openList(session)) { sfx.tap(); chosen.current = true; atBreak(); sync(); } },
  });
  const playerPaused = useRef(false);
  playerPaused.current = player.paused;
  useEffect(() => {
    setIdle(false);
    if (screen !== "play" || player.paused) return;
    const timer = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(timer);
  }, [version, screen, player.paused]);

  // The card, drawn only when a grown-up opens আব্বু-আম্মুকে দেখাও.
  const data: CardData | null = result ? { today, level: result.level, stars: result.stars } : null;
  cardData.current = data;
  useEffect(() => {
    if (!showing || !data) return;
    let live = true;
    void loadCardFonts(cardFontSample(data)).then(() => { if (live && preview.current) drawCard(preview.current, data, location.host); }).catch(() => {});
    return () => { live = false; };
  }, [showing, result, today]);

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Away and back: blur and a hidden tab mean the next tap mid-round only wakes the game.
  useEffect(() => {
    const away = () => { leave(session); };
    const here = () => { back(session); };
    const seen = () => { if (document.hidden) away(); else here(); };
    window.addEventListener("blur", away);
    window.addEventListener("focus", here);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", away); window.removeEventListener("focus", here); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- keys, at the window: the game's own keys never fall through to a button clicked earlier ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], .kk-show, .kk-rest, .kk-gate, .kk-gate-open, .kk-note")) return;
    if (!inView.current || playerPaused.current || restShows(session) || showingRef.current) return;
    const key = event.key, onButton = Boolean(target?.closest?.("button, a, summary")), go = key === " " || key === "Enter";
    const digit = /^[1-9]$/.test(key) ? Number(key) : 0;
    if ((key === "p" || key === "P") && session.screen === "play") { event.preventDefault(); player.requestPause(); return; }
    if (session.screen === "title") {
      if (go && !event.repeat && !onButton) { event.preventDefault(); begin(); }
      return;
    }
    if (session.screen === "list") {
      const spec = worldLevels(worldRef.current)[digit - 1];
      if (spec && !event.repeat) { event.preventDefault(); pickLevel(spec.id); }
      return;
    }
    if (session.screen === "end") {
      // A fresh press only: a key held through the last picture never starts the next round.
      if (go && !event.repeat && !onButton && event.timeStamp >= session.endAt) { event.preventDefault(); begin(); }
      return;
    }
    const r = round.current;
    if (go && !onButton && r.step === "after") { event.preventDefault(); if (!event.repeat) next(); return; }
    if (digit && !event.repeat) {
      if (r.step === "name") { const feeling = r.faces[digit - 1]; if (feeling) { event.preventDefault(); pickFace(feeling, root.current?.querySelector(`[data-feel="${feeling}"]`) ?? null); } }
      else if (r.step === "kind" && digit <= 2) { event.preventDefault(); pickKind(digit - 1); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  const blurAfter = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  /** Acts on the first finger's touch, not on the lift; Enter or Space on a focused button clicks it (detail 0). */
  const press = (action: (element: HTMLElement) => void) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (!event.isPrimary || event.button > 0) return;
      const element = event.currentTarget;
      action(element);
      requestAnimationFrame(() => element.blur());
    },
    onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
  });

  const spec = levelOf(level), palette = worldOf(world).palette;
  const r = round.current, playing = screen === "play";
  const scene = sceneOf(r), playSpec = levelOf(r.level);
  const picked = r.picked ? FEELINGS[r.picked] : null;
  // The ghost finger: on the very first picture before any tap, on the fitting face; then after a wait on whatever comes next.
  const firstEver = r.index === 0 && r.level === 1 && !touched && !stars[1] && loaded;
  const showGhost = (firstEver || idle) && playing;
  const glowOn = glows(r), fits = new Set(fitting(r));
  const style = { "--mr-paper": palette.paper, "--mr-edge": palette.edge, "--mr-deep": palette.deep, "--mr-glow": palette.glow } as CSSProperties;
  const worldStars = totalStars(Object.fromEntries(worldLevels(world).map(item => [item.id, stars[item.id] ?? 0])));
  const showRest = resting && screen !== "play" && player.stage.width > 0;
  const said = r.picked ? `${sayLine(scene, r.picked)} ${alsoLine(scene, r.picked)}`.trim() : "";

  return (
    <div className="mr" ref={root} style={style} data-world={playing ? playSpec.world : world} data-screen={screen} data-slow={slow || undefined}>
      <div className="mr-top">
        <p className="mr-badge">
          <b>{worldOf(playing ? playSpec.world : world).name}</b>
          <span>{bn(placeInWorld(playing ? r.level : level))} · {(playing ? playSpec : spec).finale ? `★ ${(playing ? playSpec : spec).name}` : (playing ? playSpec : spec).name}</span>
        </p>
        {playing
          ? <ol className="mr-strip" aria-label={`${bn(r.scenes.length)}টা ছবির ${bn(r.index + 1)} নম্বর`}>
              {r.scenes.map((item, index) => {
                const found = r.found[index];
                return <li key={item.id} className={found ? "on" : index === r.index ? "now" : ""} style={found ? { background: FEELINGS[found].light, borderColor: FEELINGS[found].color } : undefined} />;
              })}
            </ol>
          : <p className="mr-total" aria-label={`${worldOf(world).name}: মোট ${bn(worldStars)} তারা`}>★ {bn(worldStars)}</p>}
      </div>

      <div className="mr-stage">
        {screen === "title" && <Title world={world} level={level} onStart={begin} onWorld={pickWorld} onList={showList} blurAfter={blurAfter} />}

        {screen === "list" && <LevelList world={world} level={level} stars={stars} onPick={pickLevel} onClose={hideList} />}

        {playing && <div className="mr-play" data-step={r.step} data-n={r.faces.length}>
          <div className="mr-scene">
            {picked && <span className="mr-wash" key={`${scene.id}-${r.picked}`} style={{ background: picked.light }} />}
            <span className="mr-prop" key={`${scene.id}-${nudge}`} data-nudge={nudge ? "1" : undefined}><SceneArt prop={scene.prop} /></span>
            <figure className="mr-child" key={`${scene.id}-${r.step}`}>
              <Child face={r.step === "name" ? null : r.step === "after" ? "calm" : r.picked} fill={picked?.light ?? ""} hair={scene.hair} glasses={scene.glasses} draw={r.step !== "name"} />
              <figcaption>{scene.who}</figcaption>
            </figure>
          </div>
          <p className="mr-text">{scene.text}</p>

          <div className="mr-do" key={`${r.index}-${r.step}`}>
            {r.step === "name" && <>
              <h3 className="mr-q">{question(scene)}</h3>
              <div className="mr-faces" data-n={r.faces.length}>
                {r.faces.map((feeling, index) => {
                  const glow = glowOn && fits.has(feeling);
                  return <button type="button" key={feeling} data-feel={feeling} data-fits={scene.feels.includes(feeling) ? "1" : undefined} className={`mr-face${glow ? " is-glow" : ""}`}
                    style={{ "--feel": FEELINGS[feeling].color } as CSSProperties} aria-label={FEELINGS[feeling].word} {...press(element => pickFace(feeling, element))}>
                    <i className="mr-key" aria-hidden="true">{bn(index + 1)}</i>
                    <Face feeling={feeling} fill={FEELINGS[feeling].light} /><span>{FEELINGS[feeling].word}</span>
                    {showGhost && (glow || (!glowOn && fits.has(feeling) && feeling === [...fits][0])) && <Ghost />}
                  </button>;
                })}
              </div>
              <p className="mr-msg" role="status" aria-live="polite">{r.tries > 0 ? againLine(scene) : ""}</p>
            </>}

            {r.step === "kind" && <>
              <p className="mr-said" role="status" aria-live="polite">{said}</p>
              <h3 className="mr-q">{kindQuestion(scene)}</h3>
              <div className="mr-kinds">
                {scene.kind.map((kind, index) => <button type="button" key={kind.text} className="mr-kind" {...press(() => pickKind(index))}>
                  <i className="mr-key" aria-hidden="true">{bn(index + 1)}</i>
                  <KindIcon icon={kind.icon} /><span>{kind.text}</span>{showGhost && index === 0 && <Ghost />}
                </button>)}
              </div>
            </>}

            {r.step === "after" && r.kind !== null && <>
              <p className="mr-said" role="status" aria-live="polite">{scene.kind[r.kind].after}</p>
              <div className="mr-ask"><small>একসাথে কথা বলো</small><p>{scene.ask}</p></div>
              <button type="button" className="mr-next" aria-label={isLast(r) ? "ছবি শেষ, দেখো" : "পরের ছবি"} {...press(() => next())}>
                <NextIcon />{showGhost && <Ghost />}
              </button>
            </>}
          </div>
        </div>}

        {screen === "end" && result && <EndScreen result={result} onAgain={begin} onDone={finishUp} onShow={() => setShowing(true)} />}
      </div>

      {data && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `moner-rong-${data.level}.png`, make: () => cardBlob(data, location.host) }}>
        <figure className="kit-card"><canvas ref={preview} width={1080} height={1350} role="img" aria-label={`আজ ${bn(data.today.scenes)}টা ছবিতে মনের রং চেনা হলো।`} /></figure>
        <ParentGate label="খেলাটার লিংক"><ShareToolLink title="মনের রং" text="ছবি দেখে অনুভূতির নাম চেনার খেলা, ছোটদের জন্য। ফ্রি, অ্যাকাউন্ট লাগে না।" /></ParentGate>
      </ShowParent>}
      {showRest && <RestScreen onExtend={extend} />}
    </div>
  );
}
