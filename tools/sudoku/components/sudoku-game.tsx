"use client";
// IP: what we avoided — no publisher's or app's name, logo, colours or grid styling; ours is plain newsprint with black print, ballpoint-blue entries, a yellow highlighter for the chosen cell, Bangla digits, and our own generated puzzles.

import { useEffect, useRef, useState } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, hiss, sfx, tone, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, Stars } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  dailyPuzzle, digitsDone, erase, giveHint, isSolved, isWrong, levelPuzzle, nextStar, newlyDone, place, startGame, startLevel,
  starsEarned, tierOf, todayKey, toggleNote, undo, LEVEL_COUNT, TIERS, type Game, type Puzzle,
} from "../lib/game";
import { layout } from "../lib/sudoku";
import { bn, caption, clock, compareLine, dayLabel, duration, feat, fromPuzzle, humanLine, nearMissLine, parseShared, puzzleLabel, sharedHash, type Shared } from "../lib/link";

const TOOL = "sudoku";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

// Our sounds: a ballpoint tick on paper (the signature), a lighter pencil tick, an eraser rub, and a small bell per finished line.
const sound = {
  pen: () => { hiss(0.04, 0.12, 3800, "bandpass"); tone(2400, 0.02, 0.025, "triangle"); },
  pencil: () => hiss(0.025, 0.07, 5200, "bandpass"),
  rub: () => hiss(0.14, 0.09, 1100, "bandpass"),
  bell: (step: number) => { const f = [1047, 1319, 1568][Math.min(step, 2)]; tone(f, 0.5, 0.07, "sine"); tone(f * 2, 0.3, 0.025, "sine", 0.01); },
};

type Phase = "ready" | "playing" | "paused" | "over";
type Finish = { seconds: number; stars: number; previousBest: number | null; improved: boolean; tierDone: boolean };

export function SudokuGame() {
  const [game, setGame] = useState<Game>(() => startGame(levelPuzzle(1)!));
  const [selected, setSelected] = useState(-1);
  const [pencil, setPencil] = useState(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [seconds, setSeconds] = useState(0);
  const [finish, setFinish] = useState<Finish | null>(null);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState({ cell: -1, key: 0 });
  const [flash, setFlash] = useState<number[]>([]);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [mounted, setMounted] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const puzzle = game.puzzle, { n, rows, cols } = puzzle.shape;
  const level = "level" in puzzle ? puzzle.level : 0, day = "day" in puzzle ? puzzle.day : 0;
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(level ? `${TOOL}-l${level}` : `${TOOL}-d${day}`, false);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const rival = friend && friend.level === level && friend.day === day ? friend : null;

  const boardRef = useRef<HTMLDivElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const timer = useRef({ base: 0, since: 0 });
  const boardInView = useInView(boardRef);

  const elapsed = () => timer.current.base + (timer.current.since ? (performance.now() - timer.current.since) / 1000 : 0);
  const shared: Shared | null = finish ? fromPuzzle(puzzle, finish.seconds, game.hints, name) : null;
  const state = shared ? sharedHash(shared) : "";

  // ---- the clock: runs only while playing and the tab is visible ----
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setSeconds(Math.floor(elapsed())), 250);
    return () => clearInterval(id);
  }, [phase]);

  function stopClock() { timer.current = { base: elapsed(), since: 0 }; }
  function begin() {
    if (phase !== "ready") return;
    timer.current = { base: 0, since: performance.now() };
    setPhase("playing");
  }
  function resume() {
    timer.current.since = performance.now();
    setPhase("playing");
  }

  function load(next: Puzzle | null) {
    if (!next) return;
    const fresh = startGame(next);
    setGame(fresh);
    setPhase("ready");
    setSeconds(0);
    setFinish(null);
    setNote("");
    setFlash([]);
    setPencil(false);
    timer.current = { base: 0, since: 0 };
    // Level 1 starts with a blank cell already chosen, so the very first tap on a digit counts.
    setSelected(fresh.values.indexOf(0));
  }
  const goTo = (next: number) => { if (next >= 1 && next <= LEVEL_COUNT) load(levelPuzzle(next)); };
  // The player's menu stops the clock and starts it again; নতুন করে শুরু clears this same puzzle.
  useGamePlayer({
    onPause: () => setPhase(current => { if (current !== "playing") return current; stopClock(); return "paused"; }),
    onResume: () => { if (phase === "paused") resume(); },
    onRestart: () => load(puzzle),
  });

  useEffect(() => {
    setMounted(true);
    setSite(window.location.host);
    const hide = () => { if (document.hidden) setPhase(current => { if (current !== "playing") return current; stopClock(); return "paused"; }); };
    const onHash = () => { const read = parseShared(window.location.hash); if (read) { setFriend(read); load(read.level ? levelPuzzle(read.level) : dailyPuzzle(read.day)); } };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", onHash); document.removeEventListener("visibilitychange", hide); };
  }, []);

  // After the first render useLevels has read this phone's stars; open a friend's puzzle, or where the player left off.
  useEffect(() => {
    if (!mounted) return;
    const read = parseShared(window.location.hash);
    if (read) { setFriend(read); load(read.level ? levelPuzzle(read.level) : dailyPuzzle(read.day)); }
    else goTo(startLevel(levels.stars, levels.unlocked));
  }, [mounted]);

  // ---- moves ----
  function solved(next: Game) {
    stopClock();
    const time = Math.max(1, Math.round(elapsed()));
    setSeconds(time);
    const stars = starsEarned(time, next.hints, puzzle.par);
    const firstClear = level > 0 && !levels.stars[level];
    const improved = level ? levels.record(level, stars) : false;
    const previousBest = best;
    const beaten = submitBest(time) && previousBest !== null;
    const tierDone = firstClear && level % 10 === 0;
    setFinish({ seconds: time, stars, previousBest, improved, tierDone });
    setPhase("over");
    setSelected(-1);
    if (stars === 3 || beaten || tierDone) {
      sfx.levelUp();
      if (!slow) confetti();
    } else sfx.good();
    for (let i = 0; i < stars; i++) setTimeout(() => sfx.star(i), 450 + i * 260);
  }

  function apply(next: Game | null, cell: number, kind: "pen" | "pencil" | "rub" | "hint") {
    if (!next) return;
    begin();
    setGame(next);
    setNote("");
    if (kind === "pencil") { sound.pencil(); return; }
    if (kind === "rub") { sound.rub(); return; }
    if (isSolved(next)) { solved(next); return; }
    if (isWrong(next, cell)) {
      sfx.wrong();
      setShake(current => ({ cell, key: current.key + 1 }));
      return;
    }
    const done = newlyDone(game, next, cell);
    if (kind === "hint") sfx.pop(); else sound.pen();
    if (done.length) {
      done.forEach((_, step) => setTimeout(() => sound.bell(step), 90 + step * 140));
      setFlash(done.flat());
      setTimeout(() => setFlash([]), 700);
    }
  }

  const locked = phase === "paused" || phase === "over";

  function choose(cell: number) {
    if (locked) return;
    begin();
    setSelected(cell);
    if (puzzle.puzzle[cell]) setNote("");
  }

  function press(digit: number) {
    if (locked) return;
    if (selected < 0) { setNote("আগে একটা ফাঁকা ঘর চাপো।"); return; }
    if (puzzle.puzzle[selected]) { setNote("ছাপা সংখ্যা বদলানো যায় না। একটা ফাঁকা ঘর চাপো।"); return; }
    if (pencil) apply(toggleNote(game, selected, digit), selected, "pencil");
    else apply(place(game, selected, digit), selected, "pen");
  }

  function rubOut() { if (!locked && selected >= 0) apply(erase(game, selected), selected, "rub"); }
  function takeBack() { if (!locked) apply(undo(game), selected, "rub"); }
  function help() {
    if (locked) return;
    const given = giveHint(game, selected);
    if (!given) return;
    setSelected(given.cell);
    apply(given.game, given.cell, "hint");
  }

  function move(dr: number, dc: number) {
    const from = selected < 0 ? 0 : selected, r = Math.floor(from / n), c = from % n;
    choose(((r + dr + n) % n) * n + ((c + dc + n) % n));
  }

  // ---- keyboard: arrows move, 1–9 (or ১–৯) write, Backspace clears, P pencil, Z undo, H hint ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    const key = event.key, bangla = BN_DIGITS.indexOf(key), digit = bangla >= 0 ? bangla : /^\d$/.test(key) ? Number(key) : -1;
    if (phase === "paused" && (key === " " || key === "Enter")) { event.preventDefault(); resume(); return; }
    if (phase === "over") {
      if ((key === " " || key === "Enter") && !element?.closest?.("button, a, summary")) { event.preventDefault(); if (level && level < LEVEL_COUNT) goTo(level + 1); }
      return;
    }
    const arrows: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (arrows[key]) { event.preventDefault(); move(...arrows[key]); return; }
    if (digit >= 1 && digit <= n) { event.preventDefault(); press(digit); return; }
    if (digit === 0 || key === "Backspace" || key === "Delete") { event.preventDefault(); rubOut(); return; }
    if (key === "p" || key === "P" || key === "n" || key === "N") { event.preventDefault(); setPencil(on => !on); return; }
    if (key === "z" || key === "Z") { event.preventDefault(); takeBack(); return; }
    if (key === "h" || key === "H") { event.preventDefault(); help(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- cards ----
  useEffect(() => {
    let cancelled = false;
    loadCardFonts("সুডোকু রাফি ৪ মিনিট ১২ সেকেন্ডে").then(() => {
      if (cancelled) return;
      if (shared && preview.current) drawCard(preview.current, shared, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` covers everything the result card draws.
  }, [state, format, site, friend]);

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFrom(next: () => void) {
    next();
    boardRef.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  // ---- what each cell looks like ----
  const { peers } = layout(puzzle.shape);
  const near = new Set(selected >= 0 ? peers[selected] : []);
  const sameDigit = selected >= 0 ? game.values[selected] : 0;
  const flashing = new Set(flash);
  const finished = digitsDone(game);
  const total = Object.values(levels.stars).reduce((sum, earned) => sum + earned, 0);
  const tier = level ? tierOf(level) : null;

  function cellLabel(cell: number) {
    const value = game.values[cell], where = `সারি ${bn(Math.floor(cell / n) + 1)}, কলাম ${bn(cell % n + 1)}`;
    if (puzzle.puzzle[cell]) return `${where}: ছাপা ${bn(value)}`;
    if (value) return `${where}: ${bn(value)}${isWrong(game, cell) ? ", ভুল" : ""}`;
    const marks = [...Array(n).keys()].map(d => d + 1).filter(d => game.notes[cell] & (1 << d));
    return `${where}: ফাঁকা${marks.length ? `, খসড়ায় ${marks.map(bn).join(" ")}` : ""}`;
  }

  function status() {
    if (note) return note;
    if (phase === "ready") return "একটা ফাঁকা ঘর চাপো, তারপর নিচে সংখ্যা চাপো।";
    if (pencil) return "খসড়া চালু: সংখ্যা চাপলে ছোট করে লেখা হবে।";
    return `৩ তারা: ${duration(puzzle.par)}ের মধ্যে`;
  }

  const result = finish && shared;
  const next = finish ? nextStar(finish.seconds, game.hints, puzzle.par) : null;

  return (
    <div className="sd" data-calm={slow} data-size={n}>
      {friend && (
        <section className="sd-friend" aria-labelledby="sd-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="sd-friend-title">{feat(friend)}।</h2>
            <p>একই ছক, এবার তোমার পালা। সময়টা {friend.name ? possessive(friend.name) : "বন্ধুর"} নিজের ফোনের হিসাব।</p>
          </div>
        </section>
      )}

      <div className="sd-bar">
        {level ? (
          <>
            <button type="button" className="sd-step" onClick={() => goTo(level - 1)} disabled={level <= 1} aria-label="আগের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
            </button>
            <p className="sd-level"><b>লেভেল {bn(level)}</b><span>{tier?.name} · {bn(n)}×{bn(n)}</span></p>
            <button type="button" className="sd-step" onClick={() => goTo(level + 1)} disabled={level >= open || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        ) : (
          <>
            <button type="button" className="sd-step sd-back" onClick={() => goTo(startLevel(levels.stars, levels.unlocked))}>লেভেলে ফেরো</button>
            <p className="sd-level"><b>রোজের ধাঁধা</b><span>{dayLabel(day)} · ৯×৯</span></p>
          </>
        )}
        <p className="sd-clock" aria-label={`সময় ${duration(seconds)}`}><b>{clock(seconds)}</b></p>
      </div>

      <div className="sd-line">
        <p className="sd-status" role="status" aria-live="polite">{status()}</p>
        {level > 0 && <button type="button" className="sd-daily" onClick={() => playFrom(() => load(dailyPuzzle(todayKey())))}>আজকের ধাঁধা</button>}
      </div>

      <div className="sd-board" ref={boardRef} data-phase={phase}>
        <div className="sd-grid" role="group" aria-label={`${bn(n)}×${bn(n)} সুডোকু ছক`} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {game.values.map((value, cell) => {
            const r = Math.floor(cell / n), c = cell % n;
            const classes = [
              puzzle.puzzle[cell] ? "given" : value ? "pen" : "",
              cell === selected ? "picked" : near.has(cell) ? "near" : "",
              sameDigit && value === sameDigit && cell !== selected ? "same" : "",
              isWrong(game, cell) ? "wrong" : "",
              flashing.has(cell) && !slow ? "done" : "",
              c % cols === 0 && c ? "edge-left" : "",
              r % rows === 0 && r ? "edge-top" : "",
            ].filter(Boolean).join(" ");
            return (
              <button key={cell} type="button" className={`sd-cell ${classes}${shake.cell === cell && !slow ? (shake.key % 2 ? " shake-a" : " shake-b") : ""}`}
                onClick={() => choose(cell)} aria-label={cellLabel(cell)} aria-pressed={cell === selected} disabled={phase === "over"}>
                {value ? bn(value) : game.notes[cell] ? (
                  <span className="sd-notes" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} aria-hidden="true">
                    {[...Array(n).keys()].map(d => <i key={d}>{game.notes[cell] & (1 << (d + 1)) ? bn(d + 1) : ""}</i>)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {phase === "paused" && (
          <div className="sd-overlay">
            <div className="sd-note">
              <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {finish ? (
        <div className="sd-over" role="status">
          <p className="sd-over-title">ছক মিলেছে, <em>{duration(finish.seconds)}ে</em></p>
          <p className="sd-over-stars">
            {[0, 1, 2].map(i => <span key={i} className={i < finish.stars ? "on gx-pop" : ""} style={{ animationDelay: `${450 + i * 260}ms` }} aria-hidden="true">★</span>)}
            <span className="sd-sr">৩টার মধ্যে {bn(finish.stars)}টা তারা</span>
          </p>
          <p className="sd-over-line">
            {rival ? compareLine(finish.seconds, rival.seconds, rival.name)
              : finish.tierDone ? `${tier?.name} ধাপের ১০টা লেভেল শেষ!`
              : humanLine(finish.stars, game.hints, puzzle.empty)}
          </p>
          <p className="sd-over-note">
            {nearMissLine(next) || (finish.previousBest !== null && finish.seconds < finish.previousBest ? `নতুন রেকর্ড। আগে লেগেছিল ${duration(finish.previousBest)}।` : "")}
            {best !== null && <span> এই ফোনে সেরা {clock(best)}।</span>}
          </p>
          <div className="sd-over-actions">
            <button type="button" className="kit-secondary" onClick={() => load(puzzle)}>আবার খেলো</button>
            {level && level < LEVEL_COUNT
              ? <button type="button" className="kit-primary" onClick={() => goTo(level + 1)}>পরের লেভেল</button>
              : <button type="button" className="kit-primary" onClick={() => goTo(startLevel(levels.stars, levels.unlocked))}>{level ? "অন্য লেভেল খেলো" : "লেভেলে ফেরো"}</button>}
          </div>
          <button type="button" className="kit-link sd-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <div className="sd-pad" data-size={n}>
            {[...Array(n).keys()].map(d => (
              <button key={d} type="button" className="sd-digit" onClick={() => press(d + 1)} disabled={locked || finished[d + 1]}
                aria-label={`${bn(d + 1)}${pencil ? " খসড়ায়" : ""}${finished[d + 1] ? ", সব বসানো হয়ে গেছে" : ""}`}>{bn(d + 1)}</button>
            ))}
          </div>
          <div className="sd-tools">
            <button type="button" className="sd-tool" aria-pressed={pencil} onClick={() => setPencil(!pencil)} disabled={locked}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1-5L16 4l4 4L9 19z" /><path d="M14 6l4 4" /></svg>খসড়া
            </button>
            <button type="button" className="sd-tool" onClick={rubOut} disabled={locked || selected < 0}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20h12" /><path d="M5 14l8-8 6 6-6 6H9z" /></svg>মুছে দাও
            </button>
            <button type="button" className="sd-tool" onClick={takeBack} disabled={locked || !game.history.length}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
            </button>
            <button type="button" className="sd-tool" onClick={help} disabled={locked}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.7.3-1 1-1 1.7V14" /><path d="M12 18h.01" /></svg>বলে দাও
            </button>
          </div>
        </>
      )}

      <div className="sd-switches">
        <SoundToggle />
        <button type="button" className="sd-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
      </div>

      <details className="sd-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="sd-tiers">{TIERS.map(t => `${bn(t.from)}–${bn(t.from + 9)} ${t.name}`).join(" · ")}</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level || undefined} onPick={pick => playFrom(() => goTo(pick))} />
      </details>

      {result && (
        <section className="sd-result" id="result" ref={resultBox} aria-labelledby="sd-result-title">
          <h2 id="sd-result-title"><em>{level ? `লেভেল ${bn(level)}` : puzzleLabel(result)}</em> মিলল {duration(result.seconds)}ে</h2>
          <p><Stars count={finish.stars} /> {rival ? compareLine(result.seconds, rival.seconds, rival.name) : humanLine(finish.stars, game.hints, puzzle.empty)}</p>
          <div className="sd-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sd-card-summary" />
              <figcaption id="sd-card-summary" className="sd-sr">কার্ড: {puzzleLabel(result)}, {duration(result.seconds)}, {bn(finish.stars)} তারা। {humanLine(finish.stars, game.hints, puzzle.empty)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sd-share">
              <label className="sd-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`sudoku-${level ? `level-${level}` : day}.png`} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`}
                caption={caption(result)} state={state}
                hint="বন্ধু লিংক খুললে একই ছক পাবে, পাশে তোমার সময়।"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
