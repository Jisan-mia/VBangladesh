"use client";
// IP: what we avoided — no NCTB textbook text or pictures, no TV or app characters, no NASA photos or logos; every scene is our own SVG.
// Thin React over the pure game: lib/round.ts plays a round, lib/session.ts decides which screen shows, what a tap may do and when
// the experiment may run. The experiment itself is CSS (components/art.tsx), paused whenever the child is away or a menu is up.
// A kids' page: nothing the child does leaves the phone, and nothing speaks. The card and the tool's link sit behind the parent gate.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, totalStars, useSlowMode, type LevelStars } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard, type CardData } from "../lib/card";
import { finishRound } from "../lib/finish";
import { itemById } from "../lib/items";
import { levelOf, nextUp, placeInWorld, recommended, worldLevels, worldOf, type WorldId } from "../lib/levels";
import { addToday, awayLine, bn, emptyToday, matchLine, type Today } from "../lib/lines";
import { MOVED_KEY, STARS_KEY, WORLD_KEY, moveOldStars, readStars, readWorld } from "../lib/progress";
import { advance, createRound, current, isLast, matchedNow, predict, replay, shownChoices, type Round } from "../lib/round";
import {
  back, begin as sessionBegin, choosingAllowed, closeList, createSession, endLive, experimentEnds, home, leave, openList, pause, restShows, resume,
  settleWaiting, stepped, tapCounts, toEnd, type Screen,
} from "../lib/session";
import { cue, guessed, matched, surprise, swish, worldTune } from "../lib/sound";
import { CheckBadge, Ghost, HandBadge, NextIcon, Pics, ReplayIcon, SceneView, WhyIcon } from "./art";
import { EndScreen, type Result } from "./end-screen";
import { LevelList } from "./level-list";
import { Title } from "./title";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const CONFETTI = ["#1c5f96", "#f2a900", "#4e6b1c", "#d64545", "#38418f", "#ffffff"];
const IDLE_MS = 7000;
const reducedMotion = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

export function KiHobeGame() {
  const [session] = useState(createSession);
  const [screen, setScreen] = useState<Screen>("title");
  const [world, setWorld] = useState<WorldId>("pukur");
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const worldRef = useRef<WorldId>("pukur");
  const [firstRound] = useState(() => createRound(1, 1));
  const round = useRef<Round>(firstRound);
  const [version, setVersion] = useState(0);
  const [away, setAway] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<Today>(emptyToday);
  const todayRef = useRef(today);
  const [showing, setShowing] = useState(false);
  const showingRef = useRef(false);
  showingRef.current = showing;
  const [og, setOg] = useState<CardData | null>(null);
  const [touched, setTouched] = useState(false);
  const [idle, setIdle] = useState(false);
  const [slow] = useSlowMode();
  const slowRef = useRef(slow);
  slowRef.current = slow;
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

  const sync = () => setScreen(session.screen);
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
    // The quiet ease carries over to the next round until five matched guesses in a row lift it.
    const before = round.current;
    round.current = createRound(levelRef.current, newSeed(), before.eased, before.rightRun);
    setResult(null); setShowing(false); setIdle(false);
    swish();
    sync(); redraw();
  }

  /** The last guess is made: the stars and today's limit are settled at this tap, never in a timer. */
  function finish(r: Round) {
    const spec = levelOf(r.level);
    const done = finishRound(session, starsRef.current, todayRef.current, r, atBreak());
    if (!done) return;
    starsRef.current = done.stars; setStars(done.stars);
    write(STARS_KEY, JSON.stringify(done.stars));
    todayRef.current = done.today; setToday(done.today);
    setResult({
      level: r.level, stars: done.earned, right: done.right, total: done.total,
      title: spec.finale ? "পুরো মেলা দেখা হলো" : "পরীক্ষাগুলো দেখা হলো", away: awayLine(done.right, done.total), finale: spec.finale ? `★ ${spec.name}` : null,
      rows: r.items.map((item, index) => ({ pics: item.choices[item.answer].pics, matched: r.matched[index] })),
    });
  }

  /** A guess is tapped. */
  function guess(choice: number) {
    const now = performance.now();
    if (tapCounts(session, now) !== "counts") return;
    const r = round.current;
    if (predict(r, choice) === "ignore") return;
    setTouched(true); setIdle(false);
    stepped(session, now);
    guessed();
    if (r.full) finish(r);
    redraw();
  }

  /** The answer shows: the experiment ran to its end with the child here. */
  function showAnswer() {
    const r = round.current;
    stepped(session, performance.now());
    if (r.replays === 0) { if (matchedNow(r)) { matched(); } else { surprise(); } }
    redraw();
  }
  /** The experiment's clock ended (or, after being away, the child is back). */
  const ended = () => { if (experimentEnds(session, round.current)) showAnswer(); };

  /** আবার দেখো: the experiment again, from its start. */
  function again() {
    const now = performance.now();
    if (tapCounts(session, now) !== "counts") return;
    if (!replay(round.current)) return;
    setTouched(true); setIdle(false);
    stepped(session, now);
    sfx.tap();
    redraw();
  }

  /** → : the next experiment, or the end screen once the last answer has been seen. */
  function next() {
    const now = performance.now(), r = round.current;
    if (r.step !== "answer" || tapCounts(session, now) !== "counts") return;
    setTouched(true); setIdle(false);
    if (isLast(r)) {
      if (toEnd(session, r, now)) {
        sfx.pop(); atBreak(); sync();
        const spec = levelOf(r.level);
        if (spec.finale) { worldTune(worldOf(spec.world).root); if (!slowRef.current) confetti({ colors: CONFETTI, count: 60 }); }
      }
      return;
    }
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

  // Saved stars: the first version's four sets move once to the new level ids, then every level is read. The world last played opens.
  useEffect(() => {
    const moved = moveOldStars(read);
    if (moved) { write(STARS_KEY, JSON.stringify(moved)); write(MOVED_KEY, "1"); }
    const saved = moved ?? readStars(read(STARS_KEY));
    setStars(saved); setLoaded(true);
    if (!chosen.current && session.screen === "title") prepare(recommended(readWorld(read(WORLD_KEY)), saved));
    // #og: a fixed card for the site's preview image. Opens ShowParent only; nothing is saved.
    if (location.hash === "#og") {
      const items = ["narkel-it", "pata-chamoch", "aloo-bol", "borof"].map(itemById);
      setOg({ today: { count: items.length, items }, level: 1, stars: 3 });
      setShowing(true);
    }
  }, []);

  // Between rounds is a break: if today's time runs out on the title or the end screen, rest comes now, never mid-round.
  useEffect(() => {
    if (screen === "play" || resting) return;
    const check = setInterval(() => { atBreak(); }, 1000);
    return () => clearInterval(check);
  }, [screen, resting, atBreak]);

  const player = useGamePlayer({
    onPause: () => { pause(session); redraw(); },
    onResume: () => { resume(session); if (settleWaiting(session, round.current)) showAnswer(); else redraw(); },
    onRestart: () => { resume(session); toTitle(levelRef.current); atBreak(); },
    // সব লেভেল in the pause menu: the round is left unfinished (nothing recorded), and leaving it is a break.
    onLevels: () => { if (openList(session)) { sfx.tap(); chosen.current = true; atBreak(); sync(); } },
  });
  const playerPaused = useRef(false);
  playerPaused.current = player.paused;
  useEffect(() => {
    setIdle(false);
    if (screen !== "play" || player.paused || away || round.current.step === "watch") return;
    const timer = setTimeout(() => setIdle(true), IDLE_MS);
    return () => clearTimeout(timer);
  }, [version, screen, player.paused, away]);

  // The card, drawn only when a grown-up opens আব্বু-আম্মুকে দেখাও.
  const data: CardData | null = result ? { today, level: result.level, stars: result.stars } : og;
  useEffect(() => {
    if (!showing || !data) return;
    let live = true;
    void loadCardFonts(cardFontSample(data)).then(() => { if (live && preview.current) drawCard(preview.current, data, location.host); }).catch(() => {});
    return () => { live = false; };
  }, [showing, result, today, og]);

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Away and back: blur and a hidden tab freeze the experiment (CSS paused, answer held) and mean the next tap mid-round only wakes the game.
  useEffect(() => {
    const gone = () => { leave(session); setAway(true); };
    const here = () => { back(session); setAway(false); if (settleWaiting(session, round.current)) showAnswer(); };
    const seen = () => { if (document.hidden) gone(); else here(); };
    window.addEventListener("blur", gone);
    window.addEventListener("focus", here);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", gone); window.removeEventListener("focus", here); document.removeEventListener("visibilitychange", seen); };
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
      // A fresh press only: a key held through the last answer never starts the next round.
      if (go && !event.repeat && !onButton && event.timeStamp >= session.endAt) { event.preventDefault(); begin(); }
      return;
    }
    const r = round.current;
    if (go && !onButton && r.step === "answer") { event.preventDefault(); if (!event.repeat) next(); return; }
    if ((key === "r" || key === "R") && !event.repeat && r.step === "answer") { event.preventDefault(); again(); return; }
    if (digit && !event.repeat && r.step === "guess") {
      const choice = shownChoices(current(r), r.eased)[digit - 1];
      if (choice !== undefined) { event.preventDefault(); guess(choice); }
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
  const item = current(r);
  const playSpec = levelOf(r.level);
  const style = { "--ki-paper": palette.paper, "--ki-edge": palette.edge, "--ki-deep": palette.deep, "--ki-glow": palette.glow } as CSSProperties;
  const worldStars = totalStars(Object.fromEntries(worldLevels(world).map(one => [one.id, stars[one.id] ?? 0])));
  const showRest = resting && screen !== "play" && player.stage.width > 0;
  const choices = shownChoices(item, r.eased);
  const quiet = reducedMotion();
  const firstEver = r.index === 0 && r.level === 1 && !touched && !stars[1] && loaded && r.step === "guess";
  const showGhost = playing && (firstEver || idle);
  const frozen = away || player.paused;
  const sceneKey = `${session.serial}-${r.index}-${r.replays}`;
  const hit = matchedNow(r);

  return (
    <div className="ki" ref={root} style={style} data-world={playing ? playSpec.world : world} data-screen={screen} data-slow={slow || undefined} data-run={frozen ? "paused" : "go"}>
      <div className="ki-top">
        <p className="ki-badge">
          <b>{worldOf(playing ? playSpec.world : world).name}</b>
          <span>{bn(placeInWorld(playing ? r.level : level))} · {(playing ? playSpec : spec).finale ? `★ ${(playing ? playSpec : spec).name}` : (playing ? playSpec : spec).name}</span>
        </p>
        {playing
          ? <ol className="ki-dots" aria-label={`${bn(r.items.length)}টা পরীক্ষার ${bn(r.index + 1)} নম্বর`}>
              {r.items.map((one, index) => <li key={one.id} className={index < r.index || (index === r.index && r.step === "answer") ? "on" : index === r.index ? "now" : ""} />)}
            </ol>
          : <p className="ki-total" aria-label={`${worldOf(world).name}: মোট ${bn(worldStars)} তারা`}>★ {bn(worldStars)}</p>}
      </div>

      <div className="ki-stage">
        {screen === "title" && <Title world={world} level={level} onStart={begin} onWorld={pickWorld} onList={showList} blurAfter={blurAfter} />}

        {screen === "list" && <LevelList world={world} level={level} stars={stars} onPick={pickLevel} onClose={hideList} />}

        {playing && <div className="ki-play" data-step={r.step} data-n={choices.length}>
          <div className="ki-ask" key={`${r.index}-${r.step === "answer" ? "a" : "q"}`}>
            {r.step === "answer"
              ? <>
                  {hit ? <CheckBadge /> : <Pics pics={["askWhy"]} height={44} />}
                  <div className="ki-said" role="status" aria-live="polite">
                    <small>{matchLine(hit)}</small>
                    <p>{item.result}</p>
                  </div>
                </>
              : <>
                  <Pics pics={[item.verb]} height={52} />
                  <p>{item.ask}</p>
                </>}
          </div>

          <SceneView key={sceneKey} item={item} playing={r.step !== "guess"} slow={slow} onEnd={ended} onSound={name => { if (!quiet) cue(name); }} />

          <div className="ki-do">
            <div className="ki-choices" role="group" aria-label="তোমার আন্দাজ" data-n={choices.length}>
              {choices.map((index, k) => {
                const choice = item.choices[index], isAnswer = index === item.answer, yours = r.picked === index;
                const state = r.step === "answer" ? (isAnswer ? "right" : yours ? "yours" : "other") : r.step === "watch" ? (yours ? "yours" : "other") : "open";
                return <button type="button" key={choice.label} className={`ki-choice is-${state}${yours ? " is-mine" : ""}`} disabled={r.step !== "guess"}
                  aria-label={choice.label} {...press(() => guess(index))}>
                  <i className="ki-key" aria-hidden="true">{bn(k + 1)}</i>
                  <Pics pics={choice.pics} /><span>{choice.label}</span>
                  {r.step === "answer" && isAnswer && <CheckBadge />}
                  {r.step !== "guess" && yours && !(r.step === "answer" && isAnswer) && <HandBadge />}
                  {showGhost && r.step === "guess" && k === 0 && <Ghost />}
                </button>;
              })}
            </div>

            {r.step === "watch" && <p className="ki-watching" role="status" aria-label="দেখো কী হয়"><i /><i /><i /></p>}

            {r.step === "answer" && <>
              <div className="ki-actions">
                <button type="button" className="ki-act ki-act-replay" aria-label="আবার দেখো" {...press(() => again())}><ReplayIcon /></button>
                <button type="button" className="ki-act ki-act-next" aria-label={isLast(r) ? "শেষ, দেখো" : "পরেরটা"} {...press(() => next())}><NextIcon />{showGhost && <Ghost />}</button>
              </div>
              <details className="ki-why">
                <summary><WhyIcon /> কেন?</summary>
                <p>{item.why}</p>
                <p className="ki-home"><b>বাসায় করে দেখো (বড়দের সাথে):</b> {item.home}</p>
              </details>
            </>}
          </div>
        </div>}

        {screen === "end" && result && <EndScreen result={result} onAgain={begin} onDone={finishUp} onShow={() => setShowing(true)} />}
      </div>

      {data && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `ki-hobe-${data.level}.png`, make: () => cardBlob(data, location.host) }}>
        <figure className="kit-card"><canvas ref={preview} width={1080} height={1350} role="img" aria-label={`আজ ${bn(data.today.count)}টা পরীক্ষা: ${data.today.items.map(one => one.card).join(", ")}`} /></figure>
        <ParentGate label="খেলাটার লিংক"><ShareToolLink title="কী হবে বলো তো?" text="আগে আন্দাজ, তারপর দেখা: নারকেল ভাসে কেন, আকাশ নীল কেন। ৫–১০ বছরের বিজ্ঞানের খেলা, ফ্রি।" /></ParentGate>
      </ShowParent>}
      {showRest && <RestScreen onExtend={extend} />}
    </div>
  );
}
