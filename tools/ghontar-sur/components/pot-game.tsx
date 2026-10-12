"use client";
// IP: what we avoided — no name, round four-quadrant toy, its red-green-yellow-blue set or its tones; ours is four clay pots of different sizes on a bamboo shelf, numbered ১–৪, in teal, marigold, magenta and indigo, with our own clay notes.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard, POT, POT_COLORS, POT_SCALE } from "../lib/draw-card";
import { beat, levelOf, levelsCleared, listen, newGame, tap, yourTurn, LEVEL_COUNT, MAX_MISTAKES, POTS, STAGE, type Game } from "../lib/game";
import { bannerNote, bn, caption, cardLine, clearLine, compareLine, dayLabel, dhakaDate, feat, isDailySeed, levelLabel, nearMiss, parseShared, sharedHash, type Shared } from "../lib/link";
import { fairBell, potNote } from "../lib/sound";

const TOOL = "ghontar-sur";
type Mode = "free" | "daily" | "friend";
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
/** A fresh tune that can't be mistaken for a daily one (those seeds are dates). */
function freshSeed() {
  let seed = newSeed();
  while (isDailySeed(seed)) seed = newSeed();
  return seed;
}

export function PotGame() {
  const [mode, setMode] = useState<Mode>("free");
  const [game, setGame] = useState<Game>(() => newGame(1));
  const [lit, setLit] = useState(-1);
  const [tapped, setTapped] = useState(-1);
  const [wrong, setWrong] = useState(-1);
  const [answer, setAnswer] = useState(-1);
  const [cleared, setCleared] = useState<{ level: number; stars: number } | null>(null);
  const [runStars, setRunStars] = useState(0);
  const [paused, setPaused] = useState(false);
  const [missed, setMissed] = useState(false);
  const [record, setRecord] = useState(false);
  const [shown, setShown] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [today, setToday] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(TOOL);
  const [dayBest, submitDayBest] = useBest(`${TOOL}-day-${today}`);
  const gameRef = useRef(game);
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const timers = useRef<number[]>([]);
  const flash = useRef(0);
  const shelf = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const over = game.phase === "over";
  const rival = friend && friend.seed === game.seed ? friend : null;
  const shared: Shared | null = over ? { seed: game.seed, score: game.score, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const level = levelOf(game.round);

  // Reads and writes gameRef, not `game`, so fast taps landing before a re-render all count.
  function commit(next: Game) { gameRef.current = next; setGame(next); }
  function later(run: () => void, ms: number) { timers.current.push(window.setTimeout(run, ms)); }
  function clearTimers() { timers.current.forEach(window.clearTimeout); timers.current = []; setLit(-1); }

  /** Lights and sounds the round's tune, then hands over. One note per beat: at most 2.5 flashes a second. */
  function playTune(current: Game) {
    clearTimers();
    const { on, off } = beat(current.round, slowRef.current), step = on + off, lead = slowRef.current ? 1000 : 650;
    for (let index = 0; index < current.round; index++) {
      const pot = current.tune[index];
      later(() => { setLit(pot); potNote(pot); }, lead + index * step);
      later(() => setLit(-1), lead + index * step + on);
    }
    later(() => { setMissed(false); setAnswer(-1); commit(yourTurn(gameRef.current)); }, lead + current.round * step);
  }

  function reset() {
    clearTimers();
    setCleared(null); setPaused(false); setMissed(false); setRecord(false); setWrong(-1); setAnswer(-1); setRunStars(0); setShown(0);
  }

  /** Starts a run. Always from a tap, so the browser lets the first note play. */
  function begin(seed = gameRef.current.seed, from = gameRef.current.from) {
    reset();
    const next = listen(newGame(seed, from));
    commit(next);
    sfx.tap();
    playTune(next);
  }

  function setUp(seed: number, from = 1) {
    reset();
    commit(newGame(seed, from));
  }

  function finish(done: Game, expected?: number) {
    if (expected !== undefined) setAnswer(expected);
    const hadBest = best !== null, beaten = submitBest(done.score);
    if (isDailySeed(done.seed)) submitDayBest(done.score);
    const newRecord = hadBest && beaten && done.score > 0;
    setRecord(newRecord);
    later(() => {
      if (newRecord || done.score >= 99) { sfx.win(); confetti({ colors: [...POT_COLORS, "#f2a900"] }); } else sfx.lose();
    }, 350);
    if (slowRef.current) { setShown(done.score); return; }
    for (let step = 1; step <= 12; step++) later(() => setShown(Math.round(done.score * step / 12)), 300 + step * 45);
  }

  function hitPot(pot: number) {
    if (paused || cleared) return;
    const current = gameRef.current;
    if (current.phase === "ready") { begin(); return; }
    if (current.phase !== "play") return;
    potNote(pot);
    setTapped(pot);
    window.clearTimeout(flash.current);
    flash.current = window.setTimeout(() => setTapped(-1), 170);
    const { game: next, outcome } = tap(current, pot);
    commit(next);
    switch (outcome.kind) {
      case "round":
        later(() => sfx.combo((next.score - 1) % STAGE), 220);
        later(() => playTune(next), 900);
        break;
      case "level": {
        const better = levels.record(outcome.level, outcome.stars);
        setRunStars(outcome.stars);
        later(() => {
          setCleared({ level: outcome.level, stars: outcome.stars });
          fairBell();
          for (let index = 0; index < outcome.stars; index++) later(() => sfx.star(index), 550 + index * 250);
          if (better && outcome.stars === 3) later(() => confetti({ colors: [...POT_COLORS, "#f2a900"] }), 550 + 3 * 250);
        }, 300);
        break;
      }
      case "miss":
        sfx.wrong();
        setWrong(pot); setAnswer(outcome.expected); setMissed(true);
        later(() => setWrong(-1), 260);
        later(() => playTune(next), 1700);
        break;
      case "over":
        sfx.wrong();
        setWrong(pot);
        later(() => setWrong(-1), 260);
        finish(next, outcome.expected);
        break;
      case "done":
        finish(next);
        break;
    }
  }

  function nextLevel() {
    setCleared(null);
    playTune(gameRef.current);
  }

  function resume() {
    setPaused(false); setCleared(null);
    const next = listen(gameRef.current);
    commit(next);
    playTune(next);
  }

  /** আরেকবার: a new tune in free play; the same tune for the daily or a friend's link. */
  function again() {
    begin(mode === "free" ? freshSeed() : gameRef.current.seed, gameRef.current.from);
    shelf.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function toggleDaily() {
    if (mode === "daily") { setMode("free"); setUp(freshSeed()); return; }
    setMode("daily");
    setUp(today || dhakaDate());
  }

  useEffect(() => {
    setSite(window.location.host);
    setToday(dhakaDate());
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return false;
      setFriend(found);
      setMode("friend");
      setUp(found.seed);
      return true;
    };
    if (!readFriend()) setUp(freshSeed());
    const onHash = () => { readFriend(); };
    const hide = () => {
      if (!document.hidden) return;
      const phase = gameRef.current.phase;
      if (phase === "listen" || phase === "play") { clearTimers(); setPaused(true); }
    };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("visibilitychange", hide);
      clearTimers(); window.clearTimeout(flash.current);
    };
  }, []);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts("ঘণ্টার সুর ১২৩টা সুর রাফি").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, runStars, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` and `runStars` hold everything the card draws.
  }, [state, runStars, format, site]);

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const pot = "1234".indexOf(event.key);
    if (pot >= 0) { event.preventDefault(); hitPot(pot); return; }
    if ((event.key === "Enter" || event.key === " ") && !target?.closest?.("button, a, summary")) {
      event.preventDefault();
      if (paused) resume();
      else if (cleared) nextLevel();
      else if (game.phase === "ready") begin();
      else if (over) again();
    }
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pointer-down answers at once; a click without a pointer (keyboard Enter/Space on a focused pot) still counts.
  const onDown = (pot: number) => (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.button === 0) { event.preventDefault(); hitPot(pot); } };
  const onClick = (pot: number) => (event: ReactMouseEvent<HTMLButtonElement>) => { if (event.detail === 0) hitPot(pot); };

  function status() {
    if (cleared) return "";
    if (game.phase === "ready") return "কলসিগুলো যে ক্রমে বাজে, সেই ক্রমে চাপো।";
    if (game.phase === "listen") return missed && answer >= 0 ? `${bn(answer + 1)} নম্বর কলসি ছিল। আবার শোনো।` : "শোনো আর দেখো";
    if (game.phase === "play") return `এবার তুমি বাজাও · ${bn(game.at)}/${bn(game.round)}`;
    return "";
  }

  const total = totalStars(levels.stars);
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const goal = level * STAGE;

  return (
    <div className="gs" data-slow={slow}>
      {friend && mode === "friend" && (
        <section className="gs-friend" aria-labelledby="gs-friend-title">
          <h2 id="gs-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="gs-hud">
        <p className="gs-level">{mode === "daily" ? `রোজের সুর · ${dayLabel(game.seed)}` : levelLabel(level)}</p>
        <p className="gs-stars-total" aria-label={`মোট তারা ${bn(total)}/${bn(LEVEL_COUNT * 3)}`}>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</p>
        <p className="gs-goal">সুর <b>{bn(game.round)}</b>টা <span>· {bn(goal)}টায় লেভেল {bn(level)} পার</span></p>
        <p className="gs-misses" aria-label={`ভুল ${bn(game.mistakes)}/${bn(MAX_MISTAKES)}`}>
          ভুল {Array.from({ length: MAX_MISTAKES }, (_, index) => <i key={index} aria-hidden="true" className={index < game.mistakes ? "on" : ""} />)}
        </p>
      </div>

      <div className="gs-stage">
        <div className="gs-shelf" ref={shelf} role="group" aria-label="চারটা মাটির কলসি, ১ থেকে ৪। কলসি যে ক্রমে বাজে, সেই ক্রমে চাপো।">
          {Array.from({ length: POTS }, (_, pot) => (
            <button key={pot} type="button" className="gs-pot" style={{ "--c": POT_COLORS[pot] } as CSSProperties}
              data-lit={lit === pot || tapped === pot} data-wrong={wrong === pot && !slow} data-answer={answer === pot && game.phase !== "play"}
              aria-label={`কলসি ${bn(pot + 1)}`} onPointerDown={onDown(pot)} onClick={onClick(pot)}>
              <svg viewBox="0 0 100 116" aria-hidden="true" style={{ width: `${POT_SCALE[pot] * 92}%` }}>
                <path className="gs-body" d={POT.body} />
                <path className="gs-bands" d={POT.bands} />
                <path className="gs-shine" d={POT.shine} />
                <g className="gs-badge"><circle cx="50" cy="68" r="15" /><text x="50" y="69">{bn(pot + 1)}</text></g>
              </svg>
            </button>
          ))}
        </div>
        {paused && (
          <div className="gs-overlay">
            <p>থেমে আছে। চালিয়ে গেলে সুরটা আবার শুনবে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        {cleared && (
          <div className="gs-overlay gs-cleared" role="status">
            <p className="gs-bigstars" role="img" aria-label={`৩টার মধ্যে ${bn(cleared.stars)}টা তারা`}>
              {[0, 1, 2].map(index => <span key={index} aria-hidden="true" className={index < cleared.stars ? "on gx-pop" : ""} style={{ animationDelay: `${250 + index * 250}ms` }}>★</span>)}
            </p>
            <p className="gs-clear-title">লেভেল {bn(cleared.level)} পার</p>
            <p className="gs-clear-line">{clearLine(cleared.level)}</p>
            {cleared.stars < 3 && <p className="gs-clear-note">একটাও ভুল ছাড়া পার হলে ৩ তারা।</p>}
            <button type="button" className="kit-primary" onClick={nextLevel}>পরের লেভেল</button>
          </div>
        )}
      </div>

      {over ? (
        <div className="gs-over" role="status">
          <p className="gs-score"><b>{bn(shown)}</b>টা সুর{levelsCleared(game.score) > 0 && <span> · লেভেল {bn(levelsCleared(game.score))} পার</span>}</p>
          <p className="gs-over-line">{game.score >= 99 ? "পুরো গানটাই বাজালে।" : answer >= 0 ? `ভুল তিনটা হলো। ঠিকটা ছিল ${bn(answer + 1)} নম্বর কলসি।` : ""}</p>
          <p className="gs-over-note">
            {rival ? compareLine(game.score, rival.score, rival.name)
              : record ? "তোমার নতুন সেরা!"
              : nearMiss(game.score, best) || (best !== null ? `তোমার সেরা ${bn(best)}টা।` : "")}
            {mode === "daily" && dayBest !== null ? ` আজকের সেরা ${bn(dayBest)}টা।` : ""}
          </p>
          <button type="button" className="kit-primary gs-again" onClick={again}>আরেকবার</button>
          <button type="button" className="kit-link gs-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : game.phase === "ready" ? (
        <div className="gs-ready">
          <p className="gs-status">{status()}</p>
          <button type="button" className="kit-primary gs-start" onClick={() => begin()}>শুরু করো</button>
        </div>
      ) : (
        <p className="gs-status" role="status" aria-live="polite">{status()}</p>
      )}

      <div className="gs-prefs">
        <button type="button" className="gs-chip" aria-pressed={mode === "daily"} onClick={toggleDaily}>রোজের সুর</button>
        <button type="button" className="gs-chip" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
      </div>

      <details className="gs-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="gs-levels-note">খোলা যেকোনো লেভেল থেকে শুরু করতে পারো। প্রতি লেভেলে ৫টা করে সুর।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={game.phase === "ready" ? game.from : level} onPick={next => {
          setUp(gameRef.current.seed, next);
          shelf.current?.scrollIntoView({ behavior: smooth(), block: "center" });
        }} />
      </details>

      <section className="gs-result" id="result" ref={resultBox} aria-labelledby="gs-result-title">
        <h2 id="gs-result-title">{shared ? <><em>{bn(shared.score)}টা সুর</em> মনে রেখে বাজালে</> : "খেলা শেষে তোমার কার্ড"}</h2>
        <p>{shared ? cardLine(shared.score) : "খেলা শেষ হলে কার্ডটা এখানে আসবে। বন্ধুকে পাঠালে সে একই সুর পাবে।"}</p>
        {shared && (
          <div className="gs-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`ঘণ্টার সুরের কার্ড: ${bn(shared.score)}টা সুর মনে রেখে বাজালাম।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="gs-share">
              <label className="gs-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="ghontar-sur.png" makeImage={() => cardBlob(shared, runStars, format, site)} imageKey={`${state}|${runStars}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই সুর পাবে। স্কোরটা তোমার নিজের ফোনে খেলা, সেটা লেখা থাকবে।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
