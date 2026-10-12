"use client";
// IP: what we avoided — no brand's toy look (no black-and-white plastic squares in a wooden or plastic frame, no logo or box art); ours is a red enamelled tin plate with a printed dotted rim, corner rivets, pressed-tin ঘুঁটি with raised Bangla digits, our own seeded levels and our own drawn pictures.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, sfx, tone, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawPicture, pictureFor, PICTURE_NAMES } from "../lib/art";
import { lineTo, rowsDone, type Dir } from "../lib/board";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { hint, parOf, play, shortBy, startGame, startLevel, starsOf, tap, threeStar, LEVEL_COUNT, type Game } from "../lib/game";
import { bn, caption, clearLine, compareLine, feat, fromGame, humanLine, parseShared, sharedHash, sizeLabel, type Shared } from "../lib/link";

const TOOL = "ponero-ghor";
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
/** The signature sound: a pressed-tin ঘুঁটি clinking into place, one per ঘুঁটি in a line. */
const clink = (count: number) => {
  for (let i = 0; i < Math.min(count, 4); i++) { tone(2350 - i * 60, 0.05, 0.05, "triangle", i * 0.035); tone(3650, 0.03, 0.022, "sine", i * 0.035 + 0.004); }
};
/** A dull tin "টং" for a ঘুঁটি that can't move. */
const tonk = () => { tone(190, 0.1, 0.07, "square", 0, 150); buzz(12); };
/** A rising chord each time another row falls into place; higher with every row. */
const chord = (rows: number) => [0, 4, 7].forEach((semi, i) => tone(440 * 2 ** ((semi + rows * 2) / 12), 0.24, 0.07, "triangle", i * 0.06));
/** When each won star pops in, in seconds (the CSS delay and the sound share it). */
const starAt = (index: number) => 0.45 + index * 0.28;
/** Swipe direction of the ঘুঁটি → the way the gap steps (the opposite). */
const GAP_FOR: Record<"up" | "down" | "left" | "right", Dir> = { up: 1, down: 0, left: 3, right: 2 };
const KEYS: Record<string, keyof typeof GAP_FOR> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

type Press = { id: number; x: number; y: number; cell: number };

export function PoneroGame() {
  const [game, setGame] = useState<Game>(() => startGame(1));
  const [paused, setPaused] = useState(false);
  const [note, setNote] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [record, setRecord] = useState<number | null>(null);
  const [picture, setPicture] = useState(false);
  const [art, setArt] = useState<Record<number, string>>({});
  const [slow, setSlow] = useSlowMode();
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const plate = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const press = useRef<Press | null>(null);
  const finished = useRef<Game | null>(null);
  const opened = useRef(false);
  const timers = useRef<number[]>([]);
  const gameRef = useRef(game);
  gameRef.current = game;
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const plateInView = useInView(plate);

  const { level, board, won } = game;
  const { size, cells, gap } = board;
  const [best, submitBest] = useBest(`${TOOL}-${level}`, false);
  const count = game.moves.length;
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const total = totalStars(levels.stars);
  const earned = won ? starsOf(count, level, game.helped) : 0;
  const phase = won ? "over" : paused ? "paused" : count ? "playing" : "ready";
  const rival = friend && friend.level === level ? friend : null;
  const shared = fromGame(game, name);
  const state = shared ? sharedHash(shared) : "";
  const result: CardData | null = won ? { level, count, helped: game.helped, name } : null;
  const where = cells.reduce<number[]>((at, tile, cell) => { at[tile] = cell; return at; }, []);
  const doneRows = Array.from({ length: size }, (_, row) => cells.slice(row * size, row * size + size).every((tile, col) => tile === (row * size + col + 1) % (size * size)));
  const image = picture ? art[size] : undefined;

  // ---- moves ----
  function commit(next: Game | null, help = false) {
    if (!next) return false;
    const before = gameRef.current;
    clink(Math.max(1, Math.abs(next.moves.length - before.moves.length)));
    const rows = rowsDone(next.board);
    if (!next.won && rows > rowsDone(before.board)) timers.current.push(window.setTimeout(() => chord(rows), 90));
    setGame(next);
    if (!help) setNote("");
    return true;
  }

  /** A gentle shake on a ঘুঁটি that can't move (none in slow mode). */
  function bump(cell: number) {
    tonk();
    const face = plate.current?.querySelector<HTMLElement>(`[data-cell="${cell}"] .pg-face`);
    if (!slow && face) face.animate([{ transform: "translateX(0)" }, { transform: "translateX(-6%)" }, { transform: "translateX(6%)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
  }

  function tapCell(cell: number) {
    if (won || paused || cell === gap) return;
    if (!commit(tap(game, cell))) { bump(cell); setNote("শুধু ফাঁকা ঘরের সারি বা কলামের ঘুঁটি সরে।"); }
  }

  function slideToward(direction: keyof typeof GAP_FOR) {
    if (won || paused) return;
    commit(play(game, [GAP_FOR[direction]]));
  }

  function showHint() {
    if (won || paused) return;
    const dir = hint(game);
    if (dir === null) return;
    sfx.pop();
    commit(play(game, [dir], true), true);
    setNote("একটা ঘুঁটি সরিয়ে দিলাম। সাহায্য নিলে এই খেলায় ১ তারা।");
  }

  function goTo(next: number) {
    if (next < 1 || next > LEVEL_COUNT) return;
    timers.current.forEach(clearTimeout); timers.current = [];
    setGame(startGame(next));
    setPaused(false);
    setNote("");
    setRecord(null);
  }

  // ---- the end of a level: save once, then the stars one by one ----
  useEffect(() => {
    if (!won || finished.current === game) return;
    finished.current = game;
    const beaten = !game.helped && best !== null && count < best;
    if (!game.helped) submitBest(count);
    setRecord(beaten ? best : null);
    levels.record(level, earned);
    const later = (seconds: number, sound: () => void) => timers.current.push(window.setTimeout(sound, seconds * 1000));
    chord(size);
    for (let star = 0; star < earned; star++) later(starAt(star), () => sfx.star(star));
    later(starAt(earned), earned === 3 || beaten ? () => { sfx.win(); confetti({ colors: ["#c23b22", "#f2c230", "#1d3f8f", "#f5f7f6", "#2a9d8f"] }); } : sfx.good);
  }, [game]);

  // After useLevels has read this phone's stars: open a friend's plate, or where the player left off.
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    setSite(window.location.host);
    const readFriend = () => {
      const read = parseShared(window.location.hash);
      if (!read) return false;
      setFriend(read);
      goTo(read.level);
      return true;
    };
    if (!readFriend()) goTo(startLevel(levels.stars, levels.unlocked));
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, [levels.loaded]);

  useEffect(() => {
    const hide = () => { const current = gameRef.current; if (document.hidden && current.moves.length && !current.won) setPaused(true); };
    document.addEventListener("visibilitychange", hide);
    return () => { document.removeEventListener("visibilitychange", hide); timers.current.forEach(clearTimeout); };
  }, []);

  // ছবির ধাঁধা: draw each size's picture once, the first time it's needed.
  useEffect(() => {
    if (!picture || art[size]) return;
    const sheet = document.createElement("canvas");
    sheet.width = sheet.height = 480;
    const c = sheet.getContext("2d");
    if (!c) return;
    drawPicture(c, pictureFor(size), 480);
    setArt(current => ({ ...current, [size]: sheet.toDataURL() }));
  }, [picture, size]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("১৫ ঘরের ধাঁধা রাফি ১২৩ চালে মেলালাম").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` and `name` cover everything the card draws.
  }, [state, name, format, site, friend, won]);

  // ---- keyboard: arrows slide the ঘুঁটি next to the gap that way, H shows a move ----
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const element = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !plateInView || element?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (KEYS[event.key]) { event.preventDefault(); slideToward(KEYS[event.key]); return; }
    if (event.key === "h" || event.key === "H") { event.preventDefault(); showHint(); return; }
    if ((event.key !== " " && event.key !== "Enter") || element?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (phase === "paused") setPaused(false);
    else if (won) goTo(level < LEVEL_COUNT ? level + 1 : level);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  // ---- pointer: tap a ঘুঁটি to slide its line, or swipe ----
  function cellAt(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const col = Math.floor(((event.clientX - box.left) / box.width) * size), row = Math.floor(((event.clientY - box.top) / box.height) * size);
    return col < 0 || col >= size || row < 0 || row >= size ? -1 : row * size + col;
  }
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || won || paused) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a pointer that already ended */ }
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, cell: cellAt(event) };
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const held = press.current;
    if (!held || event.pointerId !== held.id) return;
    press.current = null;
    const dx = event.clientX - held.x, dy = event.clientY - held.y;
    if (Math.hypot(dx, dy) < 12) { if (held.cell >= 0) tapCell(held.cell); return; }
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    // Swiping a ঘুঁটি in the gap's line toward the gap slides the whole line; any other swipe moves the one next to the gap.
    const line = held.cell >= 0 ? lineTo(board, held.cell) : null;
    if (line && line[0] === GAP_FOR[direction]) tapCell(held.cell);
    else slideToward(direction);
  }

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFrom(next: number) {
    goTo(next);
    plate.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function status() {
    if (note) return note;
    if (phase === "ready") return `ফাঁকা ঘরের পাশের ঘুঁটি চাপো। ১ থেকে ${bn(size * size - 1)} সাজাও।`;
    const rows = doneRows.filter(Boolean).length;
    return rows ? `${bn(rows)}টা সারি জায়গামতো। দূরের ঘুঁটি চাপলে পুরো লাইন সরে।` : "একই সারি বা কলামের দূরের ঘুঁটি চাপলে পুরো লাইন সরে।";
  }

  const near = shortBy(count, level, game.helped);

  return (
    <div className="pg" data-calm={slow}>
      {friend && (
        <section className="pg-friend" aria-labelledby="pg-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${feat(friend)}। বন্ধুর কার্ড।`} />
          <div>
            <h2 id="pg-friend-title">{feat(friend)}।</h2>
            <p>একই এলোমেলো প্লেট, এবার তোমার পালা। চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।</p>
          </div>
        </section>
      )}

      <div className="pg-bar">
        <button type="button" className="pg-step" onClick={() => goTo(level - 1)} disabled={level <= 1} aria-label="আগের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <p className="pg-level"><b>লেভেল {bn(level)} · {sizeLabel(level)}</b><span>{bn(threeStar(level))} চালের মধ্যে ৩ তারা</span></p>
        <button type="button" className="pg-step" onClick={() => goTo(level + 1)} disabled={level >= open || level >= LEVEL_COUNT} aria-label="পরের লেভেল">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </button>
        <p className="pg-moves"><span>চাল</span><b>{bn(count)}</b></p>
      </div>

      <div className="pg-plate" data-phase={phase} data-picture={!!image}>
        <div
          className="pg-grid" ref={plate} role="group" style={{ "--n": size } as CSSProperties}
          aria-label={`লেভেল ${bn(level)}, ${sizeLabel(level)} প্লেট। ফাঁকা ঘরের সারি বা কলামের ঘুঁটি চাপলে সরে। কিবোর্ডে তীর চাপলে ফাঁকা ঘরের পাশের ঘুঁটি সরে, H চাপলে একটা চাল দেখায়।`}
          onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { press.current = null; }}
        >
          {cells.map((_, index) => {
            const tile = index + 1;
            if (tile === size * size) return null;
            const cell = where[tile], row = Math.floor(cell / size), col = cell % size, home = tile - 1;
            const movable = !won && lineTo(board, cell) !== null;
            return (
              <button
                key={`${level}-${tile}`} type="button" className="pg-tile" data-cell={cell} data-done={doneRows[row] || undefined}
                style={{ transform: `translate(${col * 100}%, ${row * 100}%)` }}
                aria-label={`${bn(tile)}${movable ? ", সরানো যায়" : ""}`} aria-disabled={!movable}
                onClick={event => { if (event.detail === 0) tapCell(cell); }}
              >
                <span className="pg-face" style={image ? { backgroundImage: `url(${image})`, backgroundPosition: `${(home % size) / (size - 1) * 100}% ${Math.floor(home / size) / (size - 1) * 100}%` } : undefined}>
                  {image ? <small>{bn(tile)}</small> : bn(tile)}
                </span>
              </button>
            );
          })}
          {won && image && (
            <span className="pg-tile pg-last" aria-hidden="true" style={{ transform: `translate(${(size - 1) * 100}%, ${(size - 1) * 100}%)` }}>
              <span className="pg-face" style={{ backgroundImage: `url(${image})`, backgroundPosition: "100% 100%" }} />
            </span>
          )}
        </div>
        {phase === "paused" && (
          <div className="pg-overlay">
            <div className="pg-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {won ? (
        <div className="pg-over" role="status">
          <p className="pg-over-score">মিলেছে! <em>{bn(count)} চালে</em></p>
          <p className="gx-stars pg-over-stars" role="img" aria-label={`৩টার মধ্যে ${bn(earned)}টা তারা`}>
            {[0, 1, 2].map(star => <span key={star} className={star < earned ? "on gx-pop" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
          </p>
          <p className="pg-over-line">
            {rival ? compareLine(count, rival.count, rival.name)
              : record ? `নতুন রেকর্ড! আগে লেগেছিল ${bn(record)} চাল।`
              : `${image ? `${PICTURE_NAMES[pictureFor(size)]} জোড়া লেগেছে। ` : ""}${clearLine(level)}${size === 3 ? count <= parOf(level) ? " এর চেয়ে কম চালে হয় না।" : ` সবচেয়ে কম লাগে ${bn(parOf(level))} চাল।` : ""}`}
            {best !== null && best < count && !rival && <> এই ফোনে তোমার সেরা {bn(best)} চাল।</>}
          </p>
          {earned < 3 && <p className="pg-over-near">{game.helped ? "নিজে নিজে মেলালে ৩ তারা পর্যন্ত পাবে।" : `আর ${bn(near)} চাল কম হলে ${bn(earned + 1)} তারা।`}</p>}
          <div className="pg-over-actions">
            <button type="button" className="kit-secondary" onClick={() => goTo(level)}>আরেকবার</button>
            {level < LEVEL_COUNT
              ? <button type="button" className="kit-primary" onClick={() => goTo(level + 1)}>পরের লেভেল</button>
              : <p className="pg-all">৩০টা লেভেলই শেষ!</p>}
          </div>
          <button type="button" className="kit-link pg-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="pg-status" role="status" aria-live="polite">{status()}</p>
          <div className="pg-tools">
            <button type="button" className="pg-tool pg-help" onClick={showHint} disabled={phase === "paused"}>একটা চাল দেখাও</button>
            <button type="button" className="pg-tool" onClick={() => goTo(level)} disabled={!count}>আবার শুরু</button>
            <button type="button" className="pg-tool" aria-pressed={picture} onClick={() => { sfx.tap(); setPicture(!picture); }}>ছবি</button>
            <button type="button" className="pg-tool" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
            <SoundToggle compact className="pg-sound" />
          </div>
        </>
      )}

      <details className="pg-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>১–১০: ৩×৩, ১১–২৫: ৪×৪, ২৬–৩০: ৫×৫। যত কম চালে, তত বেশি তারা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={playFrom} />
      </details>

      {result && (
        <section className="pg-result" id="result" ref={resultBox} aria-labelledby="pg-result-title">
          <h2 id="pg-result-title"><em>লেভেল {bn(level)}</em> {bn(count)} চালে মিলেছে</h2>
          <p>{rival ? compareLine(count, rival.count, rival.name) : humanLine(count, level, game.helped)}</p>
          <div className="pg-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pg-card-summary" />
              <figcaption id="pg-card-summary" className="pg-sr">কার্ড: লেভেল {bn(level)}, {sizeLabel(level)}, {bn(count)} চালে, {bn(earned)} তারা। {humanLine(count, level, game.helped)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="pg-share">
              <label className="pg-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar
                tool={TOOL} fileName={`ponero-ghor-${level}.png`} makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${name}|${format}|${count}`}
                caption={caption(result)} state={state || undefined}
                hint={state ? "বন্ধু লিংক খুললে এই এলোমেলো প্লেটটাই পাবে। চালগুলো মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" : "চাল অনেক বেশি হয়ে গেছে, লিংকে ধরছে না। কম চালে মিলিয়ে আবার শেয়ার করো।"}
              />
              <button type="button" className="kit-link pg-again-link" onClick={() => playFrom(level < LEVEL_COUNT ? level + 1 : level)}>{level < LEVEL_COUNT ? "পরের লেভেল খেলো" : "আবার খেলো"}</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
