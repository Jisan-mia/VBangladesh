"use client";
// IP: what we avoided — no app or brand name, no copied tiger-game board look (wooden boards, photo-real tigers, glossy marbles, the four-tiger Nepali layout); ours is a fresh clay courtyard with scratched lines, striped pebbles and tamarind seeds, on the folk rules with our own choices labelled "আমাদের নিয়ম".

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, hiss, newSeed, sfx, shake, tone, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  botMove, canUndo, createGame, findMove, humanSide, isBotTurn, ladderSlug, legalMoves, migrateBest, openingLevel, play, pointAt, threatened, undo, winStars,
  BOARD, BOT_LEVELS, GOAT, LEGACY_LEVEL, GOATS, MAX_MOVES, SIZE, TIGER, TIGER_GOAL, type Game, type Mode, type Side,
} from "../lib/game";
import { bannerNote, bn, caption, compareLine, detail, feat, headline, humanLine, nearMiss, parseShared, playNames, sharedHash, sideWord, type Shared } from "../lib/link";
import { Seed, Tiger, YardBoard } from "./yard-board";

const TOOL = "baghbandi";
const MODES: Array<{ mode: Mode; label: string }> = [{ mode: 2, label: "ছাগল হবো" }, { mode: 1, label: "বাঘ হবো" }, { mode: 0, label: "দুজনে" }];
const KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: SIZE, ArrowUp: -SIZE };
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
const LEVELS = BOT_LEVELS.length;
const modeFor = (side: Side): Mode => side === TIGER ? 1 : 2;

/** A stone set down on the clay: a bright tick for a goat seed, a deeper knock for a tiger stone. */
function click(side: Side, soft = false) {
  const volume = soft ? 0.05 : 0.08;
  if (side === GOAT) { tone(1700, 0.03, volume, "square"); tone(820, 0.05, volume * 0.8, "triangle"); }
  else { tone(900, 0.03, volume, "square"); tone(330, 0.07, volume, "triangle", 0, 260); }
}
/** The tiger's capture: a short, cartoonish growl. */
function growl() {
  tone(210, 0.34, 0.08, "sawtooth", 0, 120);
  tone(150, 0.3, 0.06, "square", 0.04, 95);
  hiss(0.28, 0.07, 480);
  buzz(18);
}
/** Plays whatever the last move was. */
function voice(game: Game, soft = false) {
  const last = game.log[game.log.length - 1];
  if (!last) return;
  if (last.over >= 0) growl(); else click(game.log.length % 2 === 1 ? GOAT : TIGER, soft);
}
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

export function BaghbandiGame() {
  const [game, setGame] = useState<Game>(() => createGame(1, 2));
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [viewing, setViewing] = useState(false);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [selected, setSelected] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [slow, setSlow] = useSlowMode();
  const [bestTiger, submitTiger] = useBest(`${TOOL}-bagh`);
  const [bestGoat, submitGoat] = useBest(`${TOOL}-chhagol`);
  // Must run before useLevels reads its keys (effects run in order): an old best that proves a win becomes a star, once.
  useEffect(() => {
    for (const side of [TIGER, GOAT] as const) {
      const key = `ektukhani-levels-${ladderSlug(side)}`, moved = migrateBest(side, read(`ektukhani-best-${ladderSlug(side)}`), read(key));
      if (moved) try { localStorage.setItem(key, moved); } catch { /* private mode: nothing to keep */ }
    }
  }, []);
  const tigerLevels = useLevels(ladderSlug(TIGER), LEVELS);
  const goatLevels = useLevels(ladderSlug(GOAT), LEVELS);
  const ladderOf = (side: Side) => side === TIGER ? tigerLevels : goatLevels;
  const [earned, setEarned] = useState(0);
  const [record, setRecord] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const pressed = useRef(-1);
  const finished = useRef<Game | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const boardInView = useInView(board);

  const shown = viewing && friend ? friend.game : game;
  const { mode } = game;
  const me = humanSide(mode);
  const phase = viewing && friend ? "friend" : game.over ? "over" : paused ? "paused" : game.moves.length ? "playing" : "ready";
  const botTurn = isBotTurn(game);
  const canPlay = phase !== "friend" && !game.over && !paused && !botTurn;
  const who = phase === "friend" && friend ? playNames(friend.mode, [friend.name, friend.other], "বন্ধু") : playNames(mode, names);
  const moves = canPlay ? legalMoves(game) : [];
  const targets = selected >= 0 ? moves.filter(move => move.from === selected) : [];
  // Teaching marks: goats a tiger could jump right now (on the goats' turn), and tigers that can make a jump (on the tigers' turn).
  const threats = canPlay && game.turn === GOAT && selected < 0 ? threatened(game.goats, game.tigers) : [];
  const leapers = canPlay && game.turn === TIGER && selected < 0 ? [...new Set(moves.filter(move => move.over >= 0).map(move => move.from))] : [];
  const firstHint = phase === "ready" && canPlay && selected < 0 && !slow ? [legalMoves(game)[botMove({ ...game, level: LEGACY_LEVEL })].from] : [];
  const rival = friend && !viewing && friend.game.seed === game.seed && game.mode !== 0 ? friend : null;
  const result: Shared | null = game.over ? { mode, name: names[0], other: names[1], game } : null;
  const state = result ? sharedHash(result) : "";
  const best = mode === 1 ? bestTiger : mode === 2 ? bestGoat : null;
  const ladder = me === null ? null : ladderOf(me);
  const total = totalStars(tigerLevels.stars) + totalStars(goatLevels.stars);

  /** A new game. Against the bot: the level asked for, else a friend's bot, else where this side's ladder left off. */
  function fresh(next: Mode, level?: number) {
    const side = humanSide(next), theirs = friend && friend.mode !== 0 ? friend.game.level : undefined;
    const own = side === null ? undefined : openingLevel(ladderOf(side).stars, ladderOf(side).unlocked);
    const chosen = level ?? theirs ?? own;
    // A friend's game stays on their seed while you play their bot, so the comparison is fair.
    setGame(createGame(friend && (level === undefined || chosen === theirs) ? friend.game.seed : newSeed(), next, chosen));
    setViewing(false);
    setPaused(false);
    setSelected(-1);
    setRecord(false);
    setEarned(0);
  }

  function move(index: number) {
    const next = play(game, index);
    if (!next) return;
    voice(next);
    setGame(next);
    setSelected(-1);
  }

  /** One tap on a point: pick a piece, move it to a lit point, or let go. On the first screen, tapping a tiger means "I'll be the tiger". */
  function tap(at: number) {
    if (at < 0) return;
    if (phase === "ready" && mode !== 0 && game.turn === GOAT && me === GOAT && game.tigers.includes(at)) { sfx.pick(); fresh(1); return; }
    if (!canPlay) return;
    const to = selected >= 0 ? findMove(game, selected, at) : -1;
    if (to >= 0) { move(to); return; }
    const mine = game.turn === GOAT ? game.goats[at] > 0 : game.tigers.includes(at);
    if (mine && at !== selected) sfx.pick(); else sfx.tap();
    setSelected(mine && at !== selected ? at : -1);
  }

  function takeBack() {
    if (!canUndo(game)) return;
    sfx.drop();
    setGame(undo(game));
    setSelected(-1);
    setPaused(false);
  }

  // The bot answers after a short beat, so each of its moves can be seen. Paused or hidden: it waits.
  useEffect(() => {
    if (!botTurn || paused || viewing) return;
    const timer = window.setTimeout(() => {
      if (!isBotTurn(gameRef.current)) return;
      const next = play(gameRef.current, botMove(gameRef.current));
      if (!next) return;
      voice(next, true);
      // The bot's tiger took one of your goats: a gentle shake, never a scold.
      if (next.log[next.log.length - 1].over >= 0) shake(board.current);
      setGame(next);
    }, slow ? 1200 : 650);
    return () => window.clearTimeout(timer);
  }, [game, botTurn, paused, viewing, slow]);

  useEffect(() => {
    if (!game.over || finished.current === game || viewing) return;
    finished.current = game;
    if (me === null) { sfx.win(); return; }
    // This phone's best: most goats taken as the tiger, most goats kept as the goats.
    const score = me === TIGER ? game.taken : GOATS - game.taken;
    const before = me === TIGER ? bestTiger : bestGoat;
    const beaten = before !== null && score > before;
    setRecord(beaten);
    (me === TIGER ? submitTiger : submitGoat)(score);
    const stars = winStars(game);
    setEarned(stars);
    if (!stars) { sfx.lose(); return; }
    ladderOf(me).record(game.level, stars);
    // Confetti only for a real feat: three stars, a new best, or the last level beaten. StarReveal chimes each star.
    if (stars === 3 || beaten || game.level === LEVELS) { sfx.win(); confetti(); } else sfx.good();
  }, [game]);

  // Once this phone's levels are read, a game nobody has touched yet starts where the ladder left off.
  useEffect(() => {
    if (!tigerLevels.loaded || !goatLevels.loaded) return;
    setGame(current => {
      const side = humanSide(current.mode);
      if (current.moves.length || side === null || (friend && friend.mode !== 0)) return current;
      return createGame(current.seed, current.mode, openingLevel(ladderOf(side).stars, ladderOf(side).unlocked));
    });
  }, [tigerLevels.loaded, goatLevels.loaded]);

  useEffect(() => {
    // Only a real challenge link counts; in-page jumps never touch the hash.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared);
      setViewing(true);
      setGame(createGame(shared.game.seed, 1, shared.mode !== 0 ? shared.game.level : undefined));
      setPaused(false);
      setSelected(-1);
      return true;
    };
    setSite(window.location.host);
    if (!readFriend()) setGame(createGame(newSeed(), 2));
    const onHash = () => { readFriend(); };
    const hide = () => { if (document.hidden && gameRef.current.moves.length && !gameRef.current.over) setPaused(true); };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", onHash); document.removeEventListener("visibilitychange", hide); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("বাঘবন্দি রাফি ছাগল ১২৩").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || !boardInView || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const step = KEY_STEPS[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setCursor(current => {
        if (current < 0) return selected >= 0 ? selected : 12;
        const col = current % SIZE + (step === 1 ? 1 : step === -1 ? -1 : 0), next = current + step;
        return col < 0 || col >= SIZE || next < 0 || next >= SIZE * SIZE ? current : next;
      });
      return;
    }
    if (event.key === "Escape") { setSelected(-1); return; }
    if (event.key === "Backspace" || event.key === "z" || event.key === "Z") { if (canUndo(game)) { event.preventDefault(); takeBack(); } return; }
    if (event.key !== " " && event.key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (phase === "paused") setPaused(false);
    else if (phase === "over") primary();
    else if (phase === "friend") fresh(1);
    else if (cursor >= 0) tap(cursor);
    else setCursor(12);
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  function pointUnder(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return pointAt((event.clientX - box.left) / box.width * BOARD, (event.clientY - box.top) / box.height * BOARD);
  }
  // A tap is a press and a release on the same point; a slide off it does nothing, so a scroll attempt never moves a piece.
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.target as Element).closest("button")) return;
    pressed.current = pointUnder(event);
    setCursor(-1);
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || pressed.current < 0) return;
    const at = pointUnder(event);
    if (at === pressed.current) tap(at);
    pressed.current = -1;
  }
  const won = game.over && me !== null && earned > 0;
  const nextLevel = won && game.level < LEVELS ? game.level + 1 : 0;
  /** After a game: the next level when you've cleared one, else the same level again. */
  function primary() { if (nextLevel) fresh(mode, nextLevel); else fresh(mode, me === null ? undefined : game.level); }
  function pickLevel(side: Side, level: number) {
    fresh(modeFor(side), level);
    board.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFromCard() {
    primary();
    board.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function status() {
    if (phase === "friend" && friend) return `${friend.name ? possessive(friend.name) : friend.mode === 0 ? "ওদের" : "বন্ধুর"} খেলা এভাবে শেষ হয়েছিল। এবার তুমি বাঘ হয়ে দেখো, ছাগল চালাবে বট।`;
    const left = MAX_MOVES - game.moves.length;
    const clock = left <= 20 ? ` আর ${bn(left)} চাল বাকি।` : "";
    const last = game.log[game.log.length - 1];
    if (botTurn) return game.turn === TIGER ? "বাঘ ভাবছে…" : "ছাগল ভাবছে…";
    if (!game.moves.length && mode !== 1) return "বাঘ লাফ দিয়ে ছাগল ধরে, ছাগল ঘিরে বাঘকে আটকায়। ছাগল আগে চালে, একটা গাদায় চাপো।";
    if (selected >= 0) {
      if (!targets.length) return "এই গুটির এখন যাওয়ার জায়গা নেই। অন্যটা বেছে নাও।";
      return targets.some(target => target.over >= 0) ? "সবুজ বিন্দুতে চাপো। লাল দাগের ছাগলটা ধরা পড়বে!" : "সবুজ বিন্দুতে চাপো।";
    }
    const turnName = mode === 0 ? (who[game.turn] ? `${possessive(who[game.turn])} পালা, ${sideWord(game.turn)} চালো।` : `${possessive(sideWord(game.turn))} পালা।`) : "তোমার পালা।";
    if (game.turn === TIGER && leapers.length) return `লাফ দেওয়ার সুযোগ! আলো জ্বলা বাঘে চাপো।${clock}`;
    if (game.turn === GOAT && threats.length) return `সাবধান! লাল দাগের ছাগলের পেছনটা ফাঁকা, বাঘ লাফ দিতে পারে।${clock}`;
    if (mode !== 0 && last?.over >= 0) return `বাঘ একটা ছাগল ধরল! পেছনে ফাঁকা থাকলেই লাফ। ${turnName}${clock}`;
    if (game.turn === TIGER) return `${turnName} বাঘে চাপো, তারপর সবুজ বিন্দুতে।${clock}`;
    return `${turnName} একটা ছাগলে চাপো, তারপর সবুজ বিন্দুতে।${clock}`;
  }

  function verdict() {
    if (me === null) return `${sideWord(game.winner ?? GOAT)} জিতল!`;
    return game.winner === me ? "জিতে গেছ!" : "এবার বটের জিত।";
  }

  function bestLine() {
    if (rival) return compareLine(game, rival);
    if (record) return "এই ফোনে নতুন রেকর্ড!";
    if (best === null || me === null) return "";
    return me === TIGER ? `বাঘ হয়ে এই ফোনে সেরা: ${bn(best)}টা ছাগল ধরা।` : `ছাগল হয়ে এই ফোনে সেরা: ${bn(best)}টা ছাগল বাঁচানো।`;
  }

  const friendTitle = friend ? feat(friend) : "";
  const pill = (side: 0 | 1) => {
    const name = who[side];
    const active = phase !== "friend" && !game.over && game.turn === side;
    return (
      <p className="bb-pill" data-side={side} data-active={active}>
        <svg viewBox="-40 -40 80 80" aria-hidden="true">{side === GOAT ? <Seed /> : <Tiger />}</svg>
        <span className="bb-pill-name">{sideWord(side)}{name && <small>{name}</small>}</span>
        <b>{side === GOAT ? bn(GOATS - shown.taken) : <>{bn(shown.taken)}<small>/{bn(TIGER_GOAL)}</small></>}</b>
        <span className="bb-sr">{side === GOAT ? "টা ছাগল বাকি" : "টা ছাগল ধরেছে"}{active ? `, ${possessive(sideWord(side))} পালা` : ""}</span>
      </p>
    );
  };

  return (
    <div className="bb" data-calm={slow}>
      {friend && (
        <section className="bb-friend" aria-labelledby="bb-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendTitle}। শেষ চালের পরের উঠোনের ছবি।`} />
          <div>
            <h2 id="bb-friend-title">{friendTitle}।</h2>
            <p>{bannerNote}</p>
          </div>
        </section>
      )}

      <fieldset className="bb-modes">
        <legend className="bb-sr">কী হয়ে খেলবে?</legend>
        {MODES.map(choice => <button key={choice.mode} type="button" aria-pressed={phase !== "friend" && mode === choice.mode} onClick={() => fresh(choice.mode)}>{choice.label}</button>)}
      </fieldset>

      {me !== null && phase !== "friend" && ladder && (
        <p className="bb-level"><b>{sideWord(me)} হয়ে লেভেল {bn(game.level)}</b> <span aria-label={`মোট ${bn(total)}টা তারা, ${bn(LEVELS * 6)}টার মধ্যে`}>★ {bn(total)}/{bn(LEVELS * 6)}</span></p>
      )}

      <div className="bb-hud">
        {pill(GOAT)}
        <p className="bb-clock"><small>চাল</small><b>{bn(shown.moves.length)}</b></p>
        {pill(TIGER)}
      </div>

      <div
        className="bb-board" ref={board} data-phase={phase} data-bot={botTurn}
        role="application" aria-label="বাঘবন্দির ছক, ৫ × ৫ বিন্দু। গুটিতে চাপো, তারপর সবুজ বিন্দুতে। কিবোর্ডে তীর-চিহ্ন দিয়ে ঘুরে এন্টার চাপো।"
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { pressed.current = -1; }}
      >
        <YardBoard game={shown} selected={canPlay ? selected : -1} targets={targets} threats={threats} hints={selected < 0 ? [...leapers, ...firstHint] : []} cursor={cursor} />
        {phase === "paused" && (
          <div className="bb-overlay">
            <div className="bb-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {phase === "over" ? (
        <div className="bb-over" role="status">
          {won && <StarReveal count={earned} />}
          <p className="bb-over-score">{headline(game)}</p>
          <p className="bb-over-verdict">{verdict()} <span>{detail(game)}।</span> <span>{bestLine()}</span></p>
          {me !== null && nearMiss(game) && <p className="bb-near">{nearMiss(game)}</p>}
        </div>
      ) : (
        <p className="bb-status" role="status" aria-live="polite">{status()}</p>
      )}

      <div className="bb-controls" data-phase={phase}>
        {phase === "friend" ? (
          <>
            <button type="button" className="kit-primary bb-big" onClick={() => fresh(1)}>এবার তুমি বাঘ হও</button>
            <button type="button" className="bb-tool" onClick={() => fresh(2)}>ছাগল হয়ে খেলো</button>
          </>
        ) : phase === "over" ? (
          <>
            <button type="button" className="kit-primary bb-big" onClick={primary}>{nextLevel ? "পরের লেভেল" : "আরেকবার"}</button>
            {nextLevel ? <button type="button" className="bb-tool" onClick={() => fresh(mode, game.level)}>আবার খেলো</button>
              : <button type="button" className="kit-link bb-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
          </>
        ) : (
          <>
            <button type="button" className="bb-tool" onClick={takeBack} disabled={!canUndo(game)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
            </button>
            <button type="button" className="bb-tool" onClick={() => fresh(mode)} disabled={phase === "ready"}>নতুন খেলা</button>
            <button type="button" className="bb-tool bb-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
            <SoundToggle compact className="bb-sound" />
          </>
        )}
      </div>
      <p className="bb-rules-link"><a href="#guide">আমাদের নিয়ম</a> · বাঘ {bn(TIGER_GOAL)}টা ছাগল ধরলে বাঘের জিত। বাঘ আটকা পড়লে, বা {bn(MAX_MOVES)} চাল টিকে গেলে ছাগলের জিত।</p>

      <details className="bb-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVELS * 6)}</span></summary>
        <p>বাঘ হয়ে কম চালে ৮টা ধরলে বেশি তারা। ছাগল হয়ে বাঘ বন্দি করলে ৩ তারা, ৩টার বেশি না হারিয়ে টিকে গেলে ২।</p>
        {([GOAT, TIGER] as const).map(side => (
          <div key={side} className="bb-ladder">
            <h3>{sideWord(side)} হয়ে</h3>
            <LevelGrid count={LEVELS} stars={ladderOf(side).stars} unlocked={ladderOf(side).unlocked} current={me === side ? game.level : undefined} onPick={level => pickLevel(side, level)} />
          </div>
        ))}
      </details>

      <section className="bb-result" id="result" ref={resultBox} aria-labelledby="bb-result-title">
        <div className="bb-result-head">
          <h2 id="bb-result-title">{result ? <><em>{headline(game)}</em>, উঠোনের ছবি তৈরি</> : "খেলা শেষে তোমার উঠোনের কার্ড"}</h2>
          <p>{result ? rival ? compareLine(game, rival) : humanLine(game) : "শেষ চালের পর উঠোনটা যেমন থাকবে, সেটাই কার্ড হয়ে এখানে আসবে। বন্ধুকে পাঠালে সে একই শুরু থেকে বাঘ হয়ে খেলবে।"}</p>
        </div>
        {result && (
          <div className="bb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bb-card-summary" />
              <figcaption id="bb-card-summary" className="bb-sr">বাঘবন্দির কার্ড: {headline(game)}। {detail(game)}। {humanLine(game)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bb-share">
              {mode ? (
                <label className="bb-name">
                  <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={names[0]} maxLength={MAX_NAME} onChange={event => setNames([event.target.value, names[1]])} placeholder="যেমন: রাফি" autoComplete="nickname" />
                </label>
              ) : (
                <div className="bb-names">
                  {([0, 1] as const).map(side => (
                    <label key={side} className="bb-name" data-side={side}>
                      <span>{side ? "বাঘ চালিয়েছে যে" : "ছাগল চালিয়েছে যে"}</span>
                      <input value={names[side]} maxLength={MAX_NAME} onChange={event => setNames(side ? [names[0], event.target.value] : [event.target.value, names[1]])} placeholder={side ? "যেমন: মিম" : "যেমন: রাফি"} autoComplete="off" />
                    </label>
                  ))}
                </div>
              )}
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="baghbandi.png" makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`} caption={caption(result)} state={state} hint="বন্ধু লিংক খুললে তোমার শেষ উঠোনটা দেখবে, তারপর একই শুরু থেকে খেলবে। চালগুলো মিলিয়ে দেখা হয়, তাই ফলটা সত্যি।" />
              <button type="button" className="kit-link bb-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
