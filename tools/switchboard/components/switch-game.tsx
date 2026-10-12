"use client";
// IP: what we avoided — no name, grid colours, square rubber buttons or beeps of the 1990s handheld lights-out toy or any app; ours is a Bangladeshi wooden switchboard with round brass switches and pear-shaped bulbs, our own level numbers and our own sounds.

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, loop, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { BULB, cardBlob, drawCard } from "../lib/draw-card";
import { hint, isLit, isSolved, litCount, makePuzzle, newGame, play, starsFor, undo, LEVEL_COUNT, type Game } from "../lib/game";
import { bannerNote, bn, caption, cardLine, clearLine, compareLine, feat, levelLabel, nearMiss, parseShared, sharedHash, type Shared } from "../lib/link";
import { fanChord, tok } from "../lib/sound";

const TOOL = "switchboard";
const TUTORIAL_MS = 20_000;
const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

/** The furthest open level you haven't three-starred, so nobody replays what they've already mastered. */
function startLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = unlocked; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}

export function SwitchGame() {
  const [level, setLevel] = useState(1);
  const [game, setGame] = useState<Game>(() => newGame(makePuzzle(1)));
  const [paused, setPaused] = useState(false);
  const [hintAt, setHintAt] = useState(-1);
  const [tutorial, setTutorial] = useState(true);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [record, setRecord] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);
  const hum = useRef<{ set: (level: number) => void; stop: () => void } | null>(null);
  const timers = useRef<number[]>([]);
  const chosen = useRef(false);
  const gameRef = useRef(game);
  gameRef.current = game;
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const { size, par } = game.puzzle, cells = size * size, moves = game.moves.length;
  const solved = isSolved(game);
  const earned = solved ? starsFor(moves, par, game.hinted) : 0;
  const rival = friend && friend.level === level ? friend : null;
  const shared: Shared | null = solved ? { level, moves: game.moves, hinted: game.hinted, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const showHint = !solved && !paused ? hintAt >= 0 ? hintAt : tutorial && level === 1 && !moves ? 4 : -1 : -1;

  function stopHum() { hum.current?.stop(); hum.current = null; }
  function clearTimers() { timers.current.forEach(window.clearTimeout); timers.current = []; }

  function goLevel(next: number) {
    chosen.current = true;
    stopHum(); clearTimers();
    setLevel(next);
    setGame(newGame(makePuzzle(next)));
    setHintAt(-1);
    setPaused(false);
    setRecord(false);
    setTutorial(next === 1);
  }

  function celebrate(done: Game) {
    const stars = starsFor(done.moves.length, done.puzzle.par, done.hinted);
    const firstClear = !levels.stars[level];
    levels.record(level, stars);
    const hadBest = best !== null;
    const beaten = submitBest(done.moves.length);
    setRecord(hadBest && beaten);
    stopHum();
    fanChord();
    for (let index = 0; index < stars; index++) timers.current.push(window.setTimeout(() => sfx.star(index), 500 + index * 250));
    const big = stars === 3 || (hadBest && beaten) || (firstClear && level % 10 === 0);
    timers.current.push(window.setTimeout(() => {
      if (stars === 3) sfx.levelUp(); else sfx.good();
      if (big) confetti({ colors: ["#ffd54a", "#f2a900", "#c99a3e", "#ffe9a0", "#9a4b12"] });
    }, 500 + stars * 250));
  }

  // Reads and writes gameRef, not `game`, so two taps landing before a re-render both count.
  function apply(next: Game) { gameRef.current = next; setGame(next); }

  function press(index: number) {
    if (paused) return;
    const next = play(gameRef.current, index);
    if (!next) return;
    chosen.current = true;
    tok();
    const done = isSolved(next);
    if (!done) {
      hum.current ??= loop("hum", 100);
      hum.current.set(0.06 + 0.4 * litCount(next.lit) / cells);
    }
    apply(next);
    setHintAt(-1);
    setTutorial(false);
    if (done) celebrate(next);
  }

  function takeBack() {
    const current = gameRef.current;
    if (!current.moves.length || isSolved(current)) return;
    sfx.drop();
    apply(undo(current));
    setHintAt(-1);
  }

  function showOne() {
    const current = gameRef.current;
    if (paused || isSolved(current)) return;
    const index = hint(current);
    if (index < 0) return;
    sfx.pick();
    apply({ ...current, hinted: true });
    setHintAt(index);
  }

  function restart() {
    stopHum(); clearTimers();
    setGame(newGame(game.puzzle));
    setHintAt(-1);
    setPaused(false);
    setRecord(false);
  }

  // Open where you left off once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (chosen.current) return;
    const next = startLevel(levels.stars, levels.unlocked);
    if (next !== level) { setLevel(next); setGame(newGame(makePuzzle(next))); setTutorial(next === 1); }
  }, [levels.stars, levels.unlocked]);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      setFriend(found);
      goLevel(found.level);
    };
    setSite(window.location.host);
    readFriend();
    const hide = () => {
      if (!document.hidden) return;
      stopHum();
      const current = gameRef.current;
      if (current.moves.length && !isSolved(current)) setPaused(true);
    };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopHum(); clearTimers();
    };
  }, []);

  useEffect(() => {
    if (!tutorial) return;
    const timer = window.setTimeout(() => setTutorial(false), TUTORIAL_MS);
    return () => window.clearTimeout(timer);
  }, [tutorial]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts("সুইচবোর্ড লেভেল ১২৩ রাফি").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, earned, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key === "z" || event.key === "Z" || (event.key === "Backspace" && moves)) { event.preventDefault(); takeBack(); return; }
    if (event.key === "h" || event.key === "H") { showOne(); return; }
    if ((event.key === "Enter" || event.key === " ") && !target?.closest?.("button, a, summary")) {
      if (paused) { event.preventDefault(); setPaused(false); }
      else if (solved) { event.preventDefault(); goLevel(Math.min(LEVEL_COUNT, level + 1)); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // Arrow keys walk between switches; Enter or Space presses the one in focus (a plain button does that already).
  function onGridKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = ARROWS[event.key];
    const from = Number((event.target as HTMLElement).dataset.index);
    if (!step || !Number.isInteger(from)) return;
    event.preventDefault();
    const row = Math.min(size - 1, Math.max(0, Math.floor(from / size) + step[0])), col = Math.min(size - 1, Math.max(0, from % size + step[1]));
    board.current?.querySelector<HTMLButtonElement>(`[data-index="${row * size + col}"]`)?.focus();
  }

  function status() {
    if (hintAt >= 0) return "দাগ দেওয়া সুইচটা চাপো। হিন্ট নিলে বড়জোর ২ তারা।";
    if (level === 1 && !moves) return "মাঝের সুইচটা চাপো।";
    return `${bn(litCount(game.lit))}/${bn(cells)}টা বাতি জ্বলছে`;
  }

  const pressed = (index: number) => game.moves.reduce((odd, move) => move === index ? !odd : odd, false);
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const total = totalStars(levels.stars);

  return (
    <div className="sb" data-slow={slow}>
      {friend && (
        <section className="sb-friend" aria-labelledby="sb-friend-title">
          <h2 id="sb-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote}</p>
        </section>
      )}

      <div className="sb-hud">
        <p className="sb-level">{levelLabel(level)}</p>
        <p className="sb-count">চাল <b>{bn(moves)}</b> <span>· সেরা: {bn(par)} চাল</span></p>
      </div>
      <p className="sb-how">একটা সুইচ চাপলে ওর বাতি আর পাশের বাতিগুলো উল্টে যায়।</p>

      <div className="sb-board-wrap">
        <div className="sb-board" ref={board} data-size={size} data-solved={solved} role="group" aria-label={`কাঠের সুইচবোর্ড, ${bn(size)}×${bn(size)}। সব বাতি জ্বালাও।`} onKeyDown={onGridKey} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
          {Array.from({ length: cells }, (_, index) => {
            const lit = isLit(game.lit, index);
            return (
              <button key={`${level}-${index}`} type="button" className="sb-cell" data-index={index} data-lit={lit} data-on={pressed(index)}
                data-hint={showHint === index ? (hintAt >= 0 || slow ? "still" : "pulse") : undefined}
                aria-label={`সুইচ ${bn(Math.floor(index / size) + 1)}-${bn(index % size + 1)}, বাতি ${lit ? "জ্বলছে" : "নিভে আছে"}${showHint === index ? ", এটা চাপো" : ""}`}
                disabled={paused} onClick={() => press(index)}>
                <svg className="sb-bulb" viewBox="0 0 40 48" aria-hidden="true">
                  <g className="sb-rays"><path d={BULB.rays} /></g>
                  <path className="sb-glass" d={BULB.glass} />
                  <path className="sb-filament" d={BULB.filament} />
                  <path className="sb-base" d={BULB.base} />
                </svg>
                <span className="sb-switch" aria-hidden="true"><span className="sb-lever" /></span>
              </button>
            );
          })}
        </div>
        {paused && (
          <div className="sb-overlay">
            <p>থেমে আছে। বোর্ড যেমন ছিল তেমনই আছে।</p>
            <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {solved ? (
        <div className="sb-clear" role="status">
          <p className="sb-bigstars" role="img" aria-label={`৩টার মধ্যে ${bn(earned)}টা তারা`}>
            {[0, 1, 2].map(index => <span key={index} aria-hidden="true" className={index < earned ? "on gx-pop" : ""} style={{ animationDelay: `${500 + index * 250}ms` }}>★</span>)}
          </p>
          <p className="sb-clear-line">{clearLine(level)}</p>
          <p className="sb-clear-note">
            {bn(moves)} চাল, সেরা {bn(par)}।{" "}
            {rival ? compareLine(moves, rival.moves.length, rival.name) : record ? "এই লেভেলে তোমার নতুন রেকর্ড!" : nearMiss(moves, par, game.hinted) || (best !== null && best < moves ? `এই লেভেলে তোমার সেরা ${bn(best)} চাল।` : "")}
          </p>
          <div className="sb-clear-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => goLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={restart}>আবার খেলো</button>
          </div>
          <button type="button" className="kit-link sb-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="sb-status" role="status" aria-live="polite">{status()}</p>
          <div className="sb-controls">
            <button type="button" className="sb-tool" onClick={takeBack} disabled={!moves || paused}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
            </button>
            <button type="button" className="sb-tool" onClick={showOne} disabled={paused}>হিন্ট</button>
            <button type="button" className="sb-tool" onClick={restart} disabled={!moves}>শুরু থেকে</button>
          </div>
        </>
      )}

      <div className="sb-prefs">
        <button type="button" className="sb-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <span onClickCapture={stopHum}><SoundToggle /></span>
      </div>

      <details className="sb-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={next => { goLevel(next); board.current?.scrollIntoView({ behavior: smooth(), block: "center" }); }} />
      </details>

      <section className="sb-result" id="result" ref={resultBox} aria-labelledby="sb-result-title">
        <h2 id="sb-result-title">{shared ? <><em>{bn(moves)} চালে</em> সব বাতি জ্বলল</> : "লেভেল পার হলে তোমার বোর্ডের কার্ড"}</h2>
        <p>{shared ? cardLine(moves, par, game.hinted) : "সব বাতি জ্বললে কার্ডটা এখানে আসবে। বন্ধুকে পাঠালে সে একই বোর্ড পাবে।"}</p>
        {shared && (
          <div className="sb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`সুইচবোর্ডের কার্ড: ${levelLabel(level)}, ${bn(moves)} চালে সব বাতি জ্বলল, ${bn(earned)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sb-share">
              <label className="sb-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="switchboard.png" makeImage={() => cardBlob(shared, earned, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই বোর্ড পাবে। তোমার চালগুলো মিলিয়ে দেখা হয়, তাই সংখ্যাটা সত্যি।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
