"use client";
// IP: what we avoided — no brand name for the nonogram genre, none of any app's frames, fonts, colours, mascots or puzzles; ours is a কাঁথা patch with a running stitch, our own 30 hand-drawn Bangladeshi pictures and our own sounds.

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  applyHint, boardLayout, doneLines, isSolved, lineStates, markFor, mistakes, newGame, paint, puzzleOf, startLevel, starsFor, strokeCells, undo,
  LEVEL_COUNT, type Game, type Mark, type Mode,
} from "../lib/game";
import { bannerNote, bn, caption, cardLine, clearLine, compareLine, feat, levelLabel, nearMiss, parseShared, pictureName, sharedHash, timeText, type Shared } from "../lib/link";
import { PICTURES } from "../lib/pictures";
import { lineDone, reveal, stitch } from "../lib/sound";

const TOOL = "chhobi-photao";
const ARROWS: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
const MARK_WORD = ["ফাঁকা", "ভরাট", "খালি দাগ"] as const;
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

type Stroke = { id: number; start: number; from: Mark; to: Mark; axis: "row" | "col" | null; snapshot: Mark[] };
type Result = { seconds: number; mistakes: number; hinted: boolean };

function Thumb({ level }: { level: number }) {
  const { picture, size } = puzzleOf(level);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true" shapeRendering="crispEdges">
      <rect width={size} height={size} fill={picture.bg} />
      {picture.art.flatMap((row, r) => [...row].map((letter, c) => letter === "." ? null : <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill={picture.colors[letter]} />))}
    </svg>
  );
}

export function PictureGame() {
  const [level, setLevel] = useState(1);
  const [game, setGame] = useState<Game>(() => newGame(1));
  const [mode, setMode] = useState<Mode>("fill");
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [hintCell, setHintCell] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [focus, setFocus] = useState(0);
  const [width, setWidth] = useState(358);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [record, setRecord] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);
  const gameRef = useRef(game);
  gameRef.current = game;
  const stroke = useRef<Stroke | null>(null);
  const streak = useRef(0);
  const clock = useRef<{ since: number | null; spent: number; started: boolean }>({ since: null, spent: 0, started: false });
  const timers = useRef<number[]>([]);
  const chosen = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const cellsBox = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const puzzle = puzzleOf(level), { size, rows, cols, picture } = puzzle;
  const solved = isSolved(game);
  const states = lineStates(game);
  const done = doneLines(game);
  const tutorial = level === 1 && !levels.stars[1] && !solved && states.rows[0] !== "done";
  const earned = result ? starsFor(result.mistakes, result.hinted) : 0;
  const rival = friend && friend.level === level ? friend : null;
  const shared: Shared | null = result ? { level, ...result, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const layout = boardLayout(width - 24, size, Math.max(1, ...rows.map(clue => clue.length)), Math.max(1, ...cols.map(clue => clue.length)));
  const cursorRow = cursor >= 0 ? Math.floor(cursor / size) : -1, cursorCol = cursor >= 0 ? cursor % size : -1;

  function clearTimers() { timers.current.forEach(window.clearTimeout); timers.current = []; }
  function stopClock() { const c = clock.current; if (c.since !== null) { c.spent += performance.now() - c.since; c.since = null; } }

  function goLevel(next: number, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    clearTimers();
    stroke.current = null; streak.current = 0;
    clock.current = { since: null, spent: 0, started: false };
    setLevel(next);
    setGame(newGame(next));
    gameRef.current = newGame(next);
    setResult(null); setHintCell(-1); setCursor(-1); setFocus(0); setPaused(false); setRecord(false); setMode("fill");
  }

  function celebrate(finished: Game) {
    stopClock();
    const seconds = Math.max(1, Math.round(clock.current.spent / 1000)), wrongCount = mistakes(finished), hinted = finished.hints > 0;
    const stars = starsFor(wrongCount, hinted), firstClear = !levels.stars[level];
    levels.record(level, stars);
    const hadBest = best !== null, beaten = submitBest(seconds);
    setRecord(hadBest && beaten);
    setResult({ seconds, mistakes: wrongCount, hinted });
    setHintCell(-1); setCursor(-1);
    reveal(size);
    const ripple = slow ? 0 : (size * 2 - 2) * 35 + 350;
    timers.current.push(window.setTimeout(() => sfx.win(), ripple));
    for (let index = 0; index < stars; index++) timers.current.push(window.setTimeout(() => sfx.star(index), ripple + 500 + index * 250));
    if (stars === 3 || (hadBest && beaten) || (firstClear && level % 10 === 0)) {
      timers.current.push(window.setTimeout(() => confetti({ colors: Object.values(picture.colors).concat("#b5452b", "#f2a900") }), ripple + 500 + stars * 250));
    }
  }

  // Reads and writes gameRef, so moves landing before a re-render all count.
  function apply(next: Game, to: Mark) {
    const before = gameRef.current;
    gameRef.current = next;
    setGame(next);
    if (!clock.current.started) { clock.current.started = true; clock.current.since = performance.now(); }
    if (to === 1) stitch(); else if (to === 2) sfx.tick(); else sfx.tap();
    if (to === 0) streak.current = 0;
    const gained = doneLines(next) - doneLines(before);
    if (gained > 0 && !isSolved(next)) { lineDone(streak.current); streak.current += gained; }
    if (isSolved(next)) celebrate(next);
  }

  function tapCell(index: number, how: Mode) {
    if (paused) return;
    const current = gameRef.current, to = markFor(current.cells[index], how), next = paint(current, [index], to);
    if (next) { setHintCell(-1); apply(next, to); }
  }

  function cellAt(event: ReactPointerEvent) {
    const box = cellsBox.current!.getBoundingClientRect();
    const col = Math.min(size - 1, Math.max(0, Math.floor((event.clientX - box.left) / (box.width / size))));
    const row = Math.min(size - 1, Math.max(0, Math.floor((event.clientY - box.top) / (box.height / size))));
    return row * size + col;
  }

  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (paused || solved || (event.button !== 0 && event.button !== 2)) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or already gone: the stroke still works */ }
    const index = cellAt(event), current = gameRef.current, from = current.cells[index];
    const to = markFor(from, event.button === 2 ? "cross" : mode);
    stroke.current = { id: event.pointerId, start: index, from, to, axis: null, snapshot: current.cells };
    setCursor(index); setFocus(index);
    const next = paint(current, [index], to);
    if (next) { setHintCell(-1); apply(next, to); }
  }

  function onMove(event: ReactPointerEvent<HTMLDivElement>) {
    const s = stroke.current;
    if (!s || event.pointerId !== s.id) return;
    const index = cellAt(event);
    setCursor(index);
    if (index === s.start && !s.axis) return;
    if (!s.axis) {
      const same = Math.floor(index / size) === Math.floor(s.start / size);
      s.axis = same ? "row" : index % size === s.start % size ? "col" : Math.abs(index % size - s.start % size) >= Math.abs(Math.floor(index / size) - Math.floor(s.start / size)) ? "row" : "col";
    }
    const reach = strokeCells(size, s.start, index, s.axis).filter(cell => s.snapshot[cell] === s.from);
    const next = paint(gameRef.current, reach, s.to, false);
    if (next) apply(next, s.to);
  }

  function onUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (stroke.current?.id !== event.pointerId) return;
    stroke.current = null;
    if (event.pointerType !== "mouse") setCursor(-1);
  }

  function takeBack() {
    const current = gameRef.current;
    if (!current.history.length || isSolved(current) || paused) return;
    sfx.drop();
    streak.current = 0;
    const back = undo(current);
    gameRef.current = back; setGame(back); setHintCell(-1);
  }

  function showOne() {
    const current = gameRef.current;
    if (paused || isSolved(current)) return;
    const helped = applyHint(current);
    if (!helped) return;
    sfx.pick();
    setHintCell(helped.index);
    apply(helped.game, helped.game.cells[helped.index]);
  }

  function restart() {
    goLevel(level);
  }

  function resume() {
    if (clock.current.started && !isSolved(gameRef.current)) clock.current.since = performance.now();
    setPaused(false);
  }

  // Open where you left off once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    const next = startLevel(levels.stars, levels.unlocked);
    if (next !== level) goLevel(next, false);
  }, [levels.loaded]);

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
      stroke.current = null;
      if (clock.current.started && !isSolved(gameRef.current) && clock.current.since !== null) { stopClock(); setPaused(true); }
    };
    const box = wrap.current;
    const watch = box ? new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width))) : null;
    if (box) { watch!.observe(box); setWidth(Math.round(box.getBoundingClientRect().width)); }
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      watch?.disconnect();
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (hintCell < 0) return;
    const timer = window.setTimeout(() => setHintCell(-1), 2400);
    return () => window.clearTimeout(timer);
  }, [hintCell, game]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ছবি ফোটাও লেভেল ১২৩ ${pictureName(level)} রাফি`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key === "z" || event.key === "Z") { event.preventDefault(); takeBack(); return; }
    if (event.key === "h" || event.key === "H") { showOne(); return; }
    if ((event.key === "Enter" || event.key === " ") && !target?.closest?.("button, a, summary")) {
      if (paused) { event.preventDefault(); resume(); }
      else if (solved && level < LEVEL_COUNT) { event.preventDefault(); goLevel(level + 1); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // Arrows walk the grid; Space or Enter fills, X marks ✕, Backspace wipes.
  function onGridKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = ARROWS[event.key];
    if (step) {
      event.preventDefault();
      const row = Math.min(size - 1, Math.max(0, Math.floor(focus / size) + step[0])), col = Math.min(size - 1, Math.max(0, focus % size + step[1]));
      const next = row * size + col;
      setFocus(next); setCursor(next);
      cellsBox.current?.querySelector<HTMLButtonElement>(`[data-index="${next}"]`)?.focus();
      return;
    }
    if (event.key === " " || event.key === "Enter") { event.preventDefault(); tapCell(focus, "fill"); }
    else if (event.key === "x" || event.key === "X") { event.preventDefault(); tapCell(focus, "cross"); }
    else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      const current = gameRef.current, next = paint(current, [focus], 0);
      if (next) apply(next, 0);
    }
  }

  function status() {
    if (hintCell >= 0) return "দাগ দেওয়া ঘরটা হিন্ট থেকে এল। হিন্ট নিলে বড়জোর ২ তারা।";
    if (tutorial) return "ওপরের সারির পাশে ৫, মানে পাঁচটা ঘরই ভরা। আঙুল টেনে পুরো সারি ভরো।";
    if (level === 1 && !levels.stars[1] && done < 4) return "মিলে গেলে সংখ্যা ফিকে হয়। এবার বাকি সারি আর কলাম।";
    if ([...states.rows, ...states.cols].includes("over")) return "লাল সংখ্যার লাইনে দরকারের চেয়ে বেশি ঘর ভরা।";
    return `${bn(done)}/${bn(size * 2)}টা লাইন মিলেছে`;
  }

  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const total = totalStars(levels.stars), revealed = Object.keys(levels.stars).length;
  const boardStyle = { "--cell": `${layout.cell}px`, "--clue-w": `${layout.clueW}px`, "--clue-h": `${layout.clueH}px`, "--font": `${layout.font}px`, "--pic-bg": picture.bg } as CSSProperties;

  return (
    <div className="cp" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="cp-friend" aria-labelledby="cp-friend-title">
          <h2 id="cp-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="cp-hud">
        <p className="cp-level">{levelLabel(level)}</p>
        <p className="cp-goal">★ {bn(total)}/{bn(LEVEL_COUNT * 3)} <span>· {bn(revealed)}/{bn(LEVEL_COUNT)} ছবি</span></p>
      </div>
      <p className="cp-how">সংখ্যা বলে দেয়, সারি আর কলামে পরপর কয়টা ঘর ভরা। মিলিয়ে ভরলেই ছবি ফুটবে।</p>

      <div className="cp-board-wrap">
        <div className="cp-board" style={boardStyle} data-solved={solved}>
          <div className="cp-corner" aria-hidden="true" />
          <div className="cp-colclues" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${size}, var(--cell))` }}>
            {cols.map((clue, col) => (
              <div key={col} className="cp-clue" data-state={states.cols[col]} data-cursor={col === cursorCol || undefined}>
                {(clue.length ? clue : [0]).map((run, index) => <span key={index}>{bn(run)}</span>)}
              </div>
            ))}
          </div>
          <div className="cp-rowclues" aria-hidden="true" style={{ gridTemplateRows: `repeat(${size}, var(--cell))` }}>
            {rows.map((clue, row) => (
              <div key={row} className="cp-clue" data-state={states.rows[row]} data-cursor={row === cursorRow || undefined} data-teach={tutorial && row === 0 ? (slow ? "still" : "pulse") : undefined}>
                {(clue.length ? clue : [0]).map((run, index) => <span key={index}>{bn(run)}</span>)}
              </div>
            ))}
          </div>
          <div className="cp-cells" ref={cellsBox} role="group" aria-label={`ছবির ঘর, ${bn(size)}×${bn(size)}`} style={{ gridTemplateColumns: `repeat(${size}, var(--cell))` }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp} onContextMenu={event => event.preventDefault()} onKeyDown={onGridKey}>
            {game.cells.map((mark, index) => {
              const row = Math.floor(index / size), col = index % size, letter = picture.art[row][col];
              return (
                <button key={`${level}-${index}`} type="button" tabIndex={index === focus ? 0 : -1} data-index={index} className="cp-cell" data-mark={mark}
                  data-edge={`${col % 5 === 4 && col < size - 1 ? "r" : ""}${row % 5 === 4 && row < size - 1 ? "b" : ""}` || undefined}
                  data-hint={index === hintCell || undefined}
                  data-teach={tutorial && row === 0 || undefined}
                  style={solved ? { "--c": letter === "." ? picture.bg : picture.colors[letter], "--d": slow ? "0ms" : `${(row + col) * 35}ms` } as CSSProperties : undefined}
                  aria-label={`সারি ${bn(row + 1)}, কলাম ${bn(col + 1)}: ${MARK_WORD[mark]}`} disabled={paused}
                  onFocus={() => setFocus(index)} />
              );
            })}
          </div>
        </div>
        {paused && (
          <div className="cp-overlay">
            <p>থেমে আছে। ঘড়িও থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {solved && result ? (
        <div className="cp-clear" role="status">
          <p className="cp-bigstars" role="img" aria-label={`৩টার মধ্যে ${bn(earned)}টা তারা`}>
            {[0, 1, 2].map(index => <span key={index} aria-hidden="true" className={index < earned ? "on gx-pop" : ""} style={{ animationDelay: `${(slow ? 0 : (size * 2 - 2) * 35 + 350) + 500 + index * 250}ms` }}>★</span>)}
          </p>
          <p className="cp-clear-name">{picture.name}</p>
          <p className="cp-clear-line">{clearLine(level)}</p>
          <p className="cp-clear-note">
            {timeText(result.seconds)}, {result.mistakes ? `ভুল ঘর ${bn(result.mistakes)}টা` : "একটাও ভুল ঘর নেই"}।{" "}
            {rival ? compareLine(result.seconds, rival.seconds, rival.name) : record ? "এই ছবিতে তোমার নতুন রেকর্ড!" : nearMiss(result.mistakes, result.hinted)}
          </p>
          <div className="cp-clear-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => goLevel(level + 1)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={restart}>আবার খেলো</button>
          </div>
          <button type="button" className="kit-link cp-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="cp-status" role="status" aria-live="polite">{status()}</p>
          <div className="cp-modes" role="group" aria-label="কী বসাবে">
            <button type="button" aria-pressed={mode === "fill"} onClick={() => { setMode("fill"); sfx.tap(); }}><span className="cp-swatch" aria-hidden="true" />ভরাট</button>
            <button type="button" aria-pressed={mode === "cross"} onClick={() => { setMode("cross"); sfx.tap(); }}><span className="cp-x" aria-hidden="true" />খালি দাগ</button>
          </div>
          <div className="cp-tools">
            <button type="button" className="cp-tool" onClick={takeBack} disabled={!game.history.length || paused}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
            </button>
            <button type="button" className="cp-tool" onClick={showOne} disabled={paused}>হিন্ট</button>
            <button type="button" className="cp-tool" onClick={restart} disabled={!game.history.length}>শুরু থেকে</button>
          </div>
        </>
      )}

      <div className="cp-prefs">
        <button type="button" className="cp-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle />
      </div>

      <details className="cp-drawer" onToggle={event => setAlbumOpen(event.currentTarget.open)}>
        <summary>অ্যালবাম <span>{bn(revealed)}/{bn(LEVEL_COUNT)} ছবি</span></summary>
        {albumOpen && (
          <ul className="cp-album">
            {PICTURES.map((item, index) => {
              const at = index + 1, open = Boolean(levels.stars[at]);
              return (
                <li key={at}>
                  <button type="button" disabled={!open} aria-current={at === level ? "true" : undefined} aria-label={open ? `${item.name}, লেভেল ${bn(at)}` : `লেভেল ${bn(at)}-এর ছবি এখনো ফোটেনি`}
                    onClick={() => { sfx.tap(); goLevel(at); wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }}>
                    {open ? <Thumb level={at} /> : <span className="cp-q" aria-hidden="true">?</span>}
                    <small>{open ? item.name : bn(at)}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </details>

      <details className="cp-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={next => { goLevel(next); wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }} />
      </details>

      <section className="cp-result" id="result" ref={resultBox} aria-labelledby="cp-result-title">
        <h2 id="cp-result-title">{shared ? <><em>{picture.name}</em> ফুটল</> : "ছবি ফুটলে তোমার কার্ড"}</h2>
        <p>{shared ? cardLine(shared) : "সব ঘর মিললে কার্ডটা এখানে আসবে। বন্ধুকে পাঠালে সে একই ছবির ধাঁধা পাবে।"}</p>
        {shared && (
          <div className="cp-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`ছবি ফোটাও-এর কার্ড: ${levelLabel(level)}, ${picture.name}, ${timeText(shared.seconds)}, ${bn(earned)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cp-share">
              <label className="cp-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="chhobi-photao.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই ছবির ধাঁধা পাবে। সময় আর ভুলের হিসাবটা তোমার ফোনের।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
