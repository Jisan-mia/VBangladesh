"use client";
// IP: what we avoided — no app or brand name and no copy of a word-search app's look (glossy rounded tiles, neon capsules, coin counters); ours is a cheap printed puzzle booklet solved with ballpoint strokes, with hand-written Bangla packs.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { newSeed, useBest, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard, INKS, strokeEnds } from "../lib/draw-card";
import { demoWord, dragLine, generate, lineBetween, nextHint, totalTime, wordAt, HINT_SECONDS, SIZE, WORDS, type Level, type Puzzle } from "../lib/grid";
import { bannerNote, bn, caption, clock, compareLine, detail, feat, humanLine, levelName, parseShared, sharedHash, spokenIn, type Shared } from "../lib/link";
import { packById, PACKS, type PackId } from "../lib/packs";

const TOOL = "shobdo-khoja";
type Round = { seed: number; pack: PackId; level: Level; demo: boolean };
type Phase = "ready" | "playing" | "paused" | "over";
/** The first grid everyone sees: ফুল, সহজ, with শাপলা already struck to show how. */
const TUTORIAL: Round = { seed: 303, pack: "phul", level: 0, demo: true };
const KEY_STEPS: Record<string, [number, number]> = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
const U = 100; // one cell in the board's SVG units
const centre = (cell: number) => [(cell % SIZE + 0.5) * U, (Math.floor(cell / SIZE) + 0.5) * U] as const;
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
const startFound = (puzzle: Puzzle, demo: boolean) => demo ? [demoWord(puzzle)] : [];

function Stroke({ cells, ink }: { cells: readonly number[]; ink: string }) {
  const { x1, y1, x2, y2, bend } = strokeEnds(cells);
  const qx = (x1 + x2) / 2 - (y2 - y1) * bend, qy = (y1 + y2) / 2 + (x2 - x1) * bend;
  return <path className="sk-stroke" pathLength={1} stroke={ink} d={`M${x1 * U} ${y1 * U}Q${qx * U} ${qy * U} ${x2 * U} ${y2 * U}`} />;
}

function Capsule({ cells, className }: { cells: readonly number[]; className: string }) {
  if (!cells.length) return null;
  const [x1, y1] = centre(cells[0]), [x2, y2] = centre(cells[cells.length - 1]);
  return <line className={className} x1={x1} y1={y1} x2={x2} y2={y2} />;
}

export function WordSearch() {
  const [round, setRound] = useState<Round>(TUTORIAL);
  const puzzle = useMemo(() => generate(round.seed, round.pack, round.level), [round]);
  const [found, setFound] = useState<number[]>(() => startFound(generate(TUTORIAL.seed, TUTORIAL.pack, TUTORIAL.level), true));
  const [hinted, setHinted] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [firstTap, setFirstTap] = useState(-1);
  const [trail, setTrail] = useState<number[]>([]);
  const [miss, setMiss] = useState<number[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [note, setNote] = useState("");
  const [final, setFinal] = useState<number | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [noClock, setNoClock] = useState(false);
  const [best, submitBest] = useBest(`${TOOL}-${round.pack}-${round.level}`, false);
  const [record, setRecord] = useState<"" | "first" | "new">("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [, setTick] = useState(0);
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const press = useRef<{ from: number; moved: boolean } | null>(null);
  const trailRef = useRef<number[]>([]);
  const spent = useRef(0);
  const since = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const pack = packById(round.pack)!;
  const seconds = () => (spent.current + (since.current === null ? 0 : performance.now() - since.current)) / 1000;
  const shownTime = final ?? totalTime(seconds(), hinted.length);
  const result: Shared | null = final === null ? null : { ...round, hints: hinted.length, time: final, name };
  const state = result ? sharedHash(result) : "";
  const rival = friend && friend.seed === round.seed && friend.pack === round.pack && friend.level === round.level && friend.demo === round.demo ? friend : null;
  const owner = (cell: number) => found.find(index => puzzle.words[index].cells.includes(cell)) ?? -1;
  const hintCells = hinted.filter(index => !found.includes(index)).map(index => puzzle.words[index].cells[0]);

  function stopClock() { if (since.current !== null) { spent.current += performance.now() - since.current; since.current = null; } }
  function startClock() { if (since.current === null) since.current = performance.now(); }

  function begin(next: Round) {
    stopClock();
    spent.current = 0;
    setRound(next);
    setFound(startFound(generate(next.seed, next.pack, next.level), next.demo));
    setHinted([]);
    setPhase("ready");
    setFirstTap(-1);
    setTrail([]);
    setMiss([]);
    setNote("");
    setFinal(null);
    setRecord("");
  }
  const fresh = (changes: Partial<Round> = {}) => begin({ seed: newSeed(), pack: round.pack, level: round.level, ...changes, demo: false });

  function start() {
    if (phaseRef.current !== "ready") return;
    setPhase("playing");
    phaseRef.current = "playing";
    startClock();
  }
  function resume() { setPhase("playing"); startClock(); }

  function finish(hints: number) {
    stopClock();
    const time = totalTime(seconds(), hints);
    setFinal(time);
    setPhase("over");
    setRecord(best === null ? "first" : time < best ? "new" : "");
    submitBest(time);
  }

  function attempt(cells: number[]) {
    const index = wordAt(puzzle, cells);
    if (index < 0) {
      setMiss(cells);
      setNote("এটা লিস্টে নেই। আবার দেখো!");
      return;
    }
    const word = puzzle.words[index].word;
    if (found.includes(index)) { setNote(`${word} তো আগেই কাটা হয়েছে!`); return; }
    const next = [...found, index];
    setFound(next);
    setMiss([]);
    if (!slow && typeof navigator.vibrate === "function") navigator.vibrate(12);
    if (next.length === WORDS) { setNote(""); finish(hinted.length); }
    else setNote(`পেয়েছ: ${word}! আর ${bn(WORDS - next.length)}টা।`);
  }

  /** Tap the first letter, then the last. Tapping the first again lets go of it. */
  function tap(cell: number) {
    if (firstTap < 0) { setFirstTap(cell); setNote("এবার শব্দের শেষ অক্ষরে চাপো।"); return; }
    if (firstTap === cell) { setFirstTap(-1); setNote(""); return; }
    const line = lineBetween(firstTap, cell);
    if (!line) { setFirstTap(cell); setNote("একই লাইনে হতে হবে: পাশাপাশি, ওপর-নিচে বা কোনাকুনি। এই ঘর থেকে আবার ধরলাম।"); return; }
    setFirstTap(-1);
    attempt(line);
  }

  function hint() {
    const index = nextHint(puzzle, found, hinted);
    if (index < 0 || phase === "over" || phase === "paused") return;
    start();
    setHinted([...hinted, index]);
    setFirstTap(-1);
    setNote(`গোল দাগের ঘর থেকে একটা শব্দ শুরু। ঘড়িতে +${bn(HINT_SECONDS)} সেকেন্ড।`);
  }

  // The clock redraws twice a second while playing; nothing runs otherwise.
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setTick(tick => tick + 1), 500);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!miss.length) return;
    const timer = window.setTimeout(() => setMiss([]), 650);
    return () => window.clearTimeout(timer);
  }, [miss]);

  useEffect(() => {
    // Only a real challenge link counts; in-page jumps never touch the hash.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      begin({ seed: shared.seed, pack: shared.pack, level: shared.level, demo: shared.demo });
    };
    setSite(window.location.host);
    readFriend();
    const hide = () => {
      if (!document.hidden || phaseRef.current !== "playing") return;
      stopClock();
      setPhase("paused");
    };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("শব্দ খোঁজা রাফি ফুল ১২৩ ক্ষ").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, puzzle, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, generate(friend.seed, friend.pack, friend.level), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function spot(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - box.left) / box.width * SIZE, (event.clientY - box.top) / box.height * SIZE] as const;
  }
  const playable = phase === "ready" || phase === "playing";

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || !playable || (event.target as Element).closest("button")) return;
    const [fx, fy] = spot(event);
    if (fx < 0 || fy < 0 || fx >= SIZE || fy >= SIZE) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a synthetic or finished pointer: the drag still works inside the board */ }
    start();
    press.current = { from: Math.floor(fy) * SIZE + Math.floor(fx), moved: false };
    trailRef.current = [];
    setCursor(-1);
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held) return;
    const [fx, fy] = spot(event);
    const cells = dragLine(held.from, fx - (held.from % SIZE + 0.5), fy - (Math.floor(held.from / SIZE) + 0.5));
    if (cells.length > 1) held.moved = true;
    if (!held.moved || cells.join() === trailRef.current.join()) return;
    trailRef.current = cells;
    setTrail(cells);
    setFirstTap(-1);
  }
  function onPointerUp() {
    const held = press.current;
    press.current = null;
    if (!held) return;
    if (!held.moved) { tap(held.from); return; }
    const cells = trailRef.current;
    trailRef.current = [];
    setTrail([]);
    if (cells.length > 1) attempt(cells);
  }
  function onPointerCancel() { press.current = null; trailRef.current = []; setTrail([]); }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const step = KEY_STEPS[event.key];
    if (step) {
      event.preventDefault();
      setCursor(current => {
        if (current < 0) return firstTap >= 0 ? firstTap : 24;
        const row = Math.floor(current / SIZE) + step[0], col = current % SIZE + step[1];
        return row < 0 || col < 0 || row >= SIZE || col >= SIZE ? current : row * SIZE + col;
      });
      return;
    }
    if (event.key === "Escape") { setFirstTap(-1); setNote(""); return; }
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (phase === "paused") { resume(); return; }
    if (!playable) return;
    if (cursor < 0) { setCursor(24); return; }
    start();
    tap(cursor);
  }

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFromCard() {
    fresh();
    board.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function status() {
    if (note) return note;
    if (firstTap >= 0) return "এবার শব্দের শেষ অক্ষরে চাপো।";
    const left = WORDS - found.length;
    if (phase === "ready") {
      if (round.demo && found.length) return `একটা কেটে দেখালাম। বাকি ${bn(left)}টা খোঁজো: আঙুল টেনে, বা প্রথম আর শেষ অক্ষরে চেপে।`;
      return round.level ? "পাশাপাশি, ওপর-নিচে, কোনাকুনি, উল্টো দিকেও লুকানো। প্রথম থেকে শেষ অক্ষর পর্যন্ত টানো।" : "পাশাপাশি, ওপর-নিচে বা কোনাকুনি লুকানো। প্রথম থেকে শেষ অক্ষর পর্যন্ত টানো।";
    }
    return `আর ${bn(left)}টা বাকি।`;
  }

  function bestLine() {
    if (rival && final !== null) return compareLine(final, rival);
    if (record === "new") return "এই ফোনে নতুন রেকর্ড!";
    if (record === "first") return `এই ফোনে ${possessive(pack.name)} প্রথম গ্রিড, এটাই এখন সেরা।`;
    return best === null ? "" : `এই ফোনে ${possessive(pack.name)} সেরা (${levelName(round.level)}): ${clock(best)}`;
  }

  const friendTitle = friend ? feat(friend) : "";
  const canHint = playable && nextHint(puzzle, found, hinted) >= 0;

  return (
    <div className="sk" data-calm={slow}>
      {friend && (
        <section className="sk-friend" aria-labelledby="sk-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendTitle}। বন্ধুর কার্ডের ছবি।`} />
          <div>
            <h2 id="sk-friend-title">{friendTitle}।</h2>
            <p>{bannerNote(friend)}</p>
          </div>
        </section>
      )}

      <fieldset className="sk-packs">
        <legend className="sk-sr">কোন প্যাক খেলবে?</legend>
        {PACKS.map(choice => (
          <button key={choice.id} type="button" aria-pressed={round.pack === choice.id} style={{ "--paper": choice.paper } as CSSProperties} onClick={() => fresh({ pack: choice.id })}>{choice.name}</button>
        ))}
      </fieldset>

      <div className="sk-hud">
        <p className="sk-count"><b>{bn(found.length)}</b>/{bn(WORDS)}<span className="sk-sr">টা শব্দ পাওয়া গেছে</span></p>
        <p className="sk-clock" aria-live="off">
          {noClock && final === null ? <small>ঘড়ি লুকানো</small> : <><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="8" /><path d="M12 13.5 15 10M10 3h4" /></svg><b>{clock(shownTime)}</b></>}
        </p>
        <fieldset className="sk-level">
          <legend className="sk-sr">কতটা কঠিন?</legend>
          {([0, 1] as const).map(level => <button key={level} type="button" aria-pressed={round.level === level} onClick={() => fresh({ level })}>{levelName(level)}</button>)}
        </fieldset>
      </div>

      <div
        className="sk-board" ref={board} data-phase={phase} tabIndex={0} style={{ "--paper": pack.paper } as CSSProperties}
        role="application" aria-label={`${pack.name} প্যাকের ${bn(SIZE)} × ${bn(SIZE)} অক্ষরের গ্রিড। প্রথম অক্ষর থেকে শেষ অক্ষর পর্যন্ত আঙুল টানো, বা দুটোয় পরপর চাপো। কিবোর্ডে তীর-চিহ্ন দিয়ে ঘুরে এন্টার চাপো।`}
        aria-describedby="sk-status"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onKeyDown={onKeyDown}
      >
        <svg className="sk-marks" viewBox={`0 0 ${SIZE * U} ${SIZE * U}`} aria-hidden="true">
          {hintCells.map(cell => <circle key={cell} className="sk-hint" cx={centre(cell)[0]} cy={centre(cell)[1]} r={43} />)}
          <Capsule key={miss.join()} cells={miss} className="sk-miss" />
          <Capsule cells={trail} className="sk-trail" />
          {firstTap >= 0 && <circle className="sk-first" cx={centre(firstTap)[0]} cy={centre(firstTap)[1]} r={40} />}
          {cursor >= 0 && <rect className="sk-cursor" x={(cursor % SIZE) * U + 5} y={Math.floor(cursor / SIZE) * U + 5} width={U - 10} height={U - 10} rx={14} />}
        </svg>
        <div className="sk-cells" aria-hidden="true">
          {puzzle.grid.map((letter, at) => {
            const index = owner(at);
            return <span key={at} data-found={index >= 0} style={index >= 0 ? { color: INKS[index % INKS.length] } : undefined}>{letter}</span>;
          })}
        </div>
        <svg className="sk-ink" viewBox={`0 0 ${SIZE * U} ${SIZE * U}`} aria-hidden="true">
          {found.map(index => <Stroke key={`${round.seed}-${index}`} cells={puzzle.words[index].cells} ink={INKS[index % INKS.length]} />)}
        </svg>
        {phase === "paused" && (
          <div className="sk-overlay">
            <div className="sk-note">
              <p>থেমে আছে, ঘড়িও থেমে আছে।</p>
              <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      <ul className="sk-words" aria-label="যে শব্দগুলো খুঁজতে হবে">
        {puzzle.words.map((word, index) => (
          <li key={`${round.seed}-${index}`} data-found={found.includes(index)} data-hint={hinted.includes(index) && !found.includes(index)} style={{ "--pen": INKS[index % INKS.length] } as CSSProperties}>
            {word.word}{found.includes(index) && <span className="sk-sr"> (পাওয়া গেছে)</span>}
          </li>
        ))}
      </ul>

      {phase === "over" && final !== null ? (
        <div className="sk-over" role="status">
          <p className="sk-over-score">{pack.done} <span>{clock(final)}</span></p>
          <p className="sk-over-line">{detail({ level: round.level, hints: hinted.length })}। <span>{bestLine()}</span></p>
        </div>
      ) : (
        <p className="sk-status" id="sk-status" role="status" aria-live="polite">{status()}</p>
      )}

      <div className="sk-controls" data-phase={phase}>
        {phase === "over" ? (
          <>
            <button type="button" className="kit-primary sk-big" onClick={() => fresh()}>আরেকবার</button>
            <button type="button" className="kit-link sk-see" onClick={seeCard}>কার্ড দেখো ↓</button>
          </>
        ) : (
          <>
            <button type="button" className="sk-tool" onClick={hint} disabled={!canHint}>হিন্ট <small>+{bn(HINT_SECONDS)} সে.</small></button>
            <button type="button" className="sk-tool" onClick={() => fresh()}>নতুন গ্রিড</button>
            <button type="button" className="sk-tool sk-toggle" aria-pressed={noClock} onClick={() => setNoClock(!noClock)}>সময় ছাড়া</button>
            <button type="button" className="sk-tool sk-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          </>
        )}
      </div>

      <section className="sk-result" id="result" ref={resultBox} aria-labelledby="sk-result-title">
        <div className="sk-result-head">
          <h2 id="sk-result-title">{result ? <><em>{spokenIn(result.time)}</em> ছয়টা, কার্ড তৈরি</> : "ছয়টা কাটলেই তোমার কার্ড"}</h2>
          <p>{result ? rival ? compareLine(result.time, rival) : humanLine(result) : "ছয়টা শব্দ কাটা হলে সময় আর কলমের দাগসহ গ্রিডটা কার্ড হয়ে এখানে আসবে। বন্ধুকে পাঠালে সে একই গ্রিডে খেলবে।"}</p>
        </div>
        {result && (
          <div className="sk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sk-card-summary" />
              <figcaption id="sk-card-summary" className="sk-sr">শব্দ খোঁজার কার্ড: {pack.name}, {clock(result.time)}। {detail(result)}। {humanLine(result)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sk-share">
              <label className="sk-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="shobdo-khoja.png" makeImage={() => cardBlob(result, puzzle, format, site)} imageKey={`${state}|${format}`} caption={caption(result)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই গ্রিডটাই পাবে, তারপর দেখবে কত সময়ে পারে।" />
              <button type="button" className="kit-link sk-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
