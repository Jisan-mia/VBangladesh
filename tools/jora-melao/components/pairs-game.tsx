"use client";
// IP: what we avoided — no cartoon characters, mascots or licensed toys, no card-back or layout from any boxed memory game or app, no famous game's name; ten fair-stall toys drawn fresh as plain shapes, on a jute stall with paper bunting.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { MAX_NAME, buzz, confetti, hiss, newSeed, sfx, shake, tone, totalStars, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { ART } from "../lib/art";
import { cardBlob, drawCard, PLAYER_COLORS } from "../lib/draw-card";
import { COLS, LEVELS, LEVEL_COUNT, TOYS, flip, isUp, migrateLevels, movesToNextStar, newGame, pairsOf, rowsOf, settle, starsOf, startLevel, type Game, type Players, type Size, type ToyId } from "../lib/game";
import { DEFAULT_NAMES, bn, caption, cardHash, cardOf, duoScore, friendBanner, friendNote, humanLine, parseCard, playerName, sameGame, sizeLabel, versusLine, winnerTitle, type Card } from "../lib/result";

const TOOL = "jora-melao";
const LEVELS_KEY = `ektukhani-levels-${TOOL}`;
// How long a missed pair stays up before turning back (a tap on another card turns it back sooner).
const MISS_MS = 1000, MISS_SLOW_MS = 1800;
// The last pair gets a moment to show before the "সব জোড়া মিলেছে" panel.
const OVER_DELAY_MS = 650;
// A tap already on its way when the panel appears must not hit "আরেকবার".
const AGAIN_GUARD_MS = 400;
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };
const COLORS = ["#e03131", "#f2a516", "#17707a", "#e64980", "#2f9e44", "#3b5bdb"];

/** A card turning over on the jute: a short papery swish with a tick. */
const flipSound = () => { hiss(0.06, 0.07, 3200, "bandpass"); tone(1250, 0.025, 0.03, "triangle"); };
/** A match: a fair-bell chime that climbs with the streak. */
const matchSound = (streak: number) => { sfx.combo(streak); tone(1568 + 90 * Math.min(streak, 6), 0.2, 0.05, "sine", 0.06); buzz(12); };
/** A miss: a soft wooden টুক, not a buzzer. */
const missSound = () => tone(240, 0.12, 0.08, "sine", 0, 170);

function Toy({ id }: { id: ToyId }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    {ART[id].parts.map((part, index) => <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.stroke ? part.width ?? 1.5 : undefined} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>;
}

export function PairsGame() {
  const [slow, setSlow] = useSlowMode();
  // Before the level store is read: this phone's old bests on ৩×৪ and ৪×৪ become stars (once).
  useEffect(() => {
    try {
      const moved = migrateLevels(localStorage.getItem(LEVELS_KEY), localStorage.getItem(`ektukhani-best-${TOOL}-12`), localStorage.getItem(`ektukhani-best-${TOOL}-16`));
      if (moved) localStorage.setItem(LEVELS_KEY, moved);
    } catch { /* storage blocked: nothing to move */ }
  }, []);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [game, setGame] = useState<Game>(() => newGame(1, LEVELS[0].size, 1));
  // The solo level being played; 0 for two players or an old friend's link from before levels.
  const [level, setLevel] = useState(1);
  const [earned, setEarned] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showOver, setShowOver] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const live = useRef(game);
  live.current = game;
  const overAt = useRef(0);
  const streak = useRef(0);
  const opened = useRef(false);
  const timers = useRef<number[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);

  const { size, players, phase, turn } = game;
  const two = players === 2, done = phase === "over", all = pairsOf(size);
  const card = done ? cardOf(game, names, level) : null;
  const state = card ? cardHash(card) : "";
  const versus = card && friend && !two && sameGame(card, friend) ? versusLine(card.moves, friend.moves, friend.names[0]) : "";
  const turnName = playerName(names, turn);
  const total = totalStars(levels.stars);
  const par = level ? LEVELS[level - 1] : null;
  const fewer = card && level ? movesToNextStar(level, card.moves) : 0;

  const later = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, ms)); };
  const start = useCallback((seed: number, nextSize: Size, nextPlayers: Players, nextLevel: number) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setGame(newGame(seed, nextSize, nextPlayers));
    setLevel(nextPlayers === 2 ? 0 : nextLevel);
    streak.current = 0;
    setPaused(false); setShowOver(false); setEarned(0);
  }, []);
  const playLevel = (next: number) => { const chosen = Math.max(1, Math.min(LEVEL_COUNT, next)); start(newSeed(), LEVELS[chosen - 1].size, 1, chosen); };

  const dropFriend = () => {
    setFriend(null);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  };

  // After the level store is read: a friend's board, or the level this phone left off at.
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    const readFriend = () => {
      const shared = parseCard(window.location.hash);
      if (shared) { setFriend(shared); start(shared.seed, shared.size, shared.players, shared.level); }
      return Boolean(shared);
    };
    if (!readFriend()) playLevel(startLevel(levels.stars, levels.unlocked));
    setSite(window.location.host);
    const onHash = () => { readFriend(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [levels.loaded]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // A missed pair turns back by itself after a moment.
  useEffect(() => {
    if (game.open.length !== 2 || paused) return;
    const timer = setTimeout(() => setGame(settle), slow ? MISS_SLOW_MS : MISS_MS);
    return () => clearTimeout(timer);
  }, [game.open, slow, paused]);

  // The end: save the level's stars once, show the panel, then the stars pop in (StarReveal) and a cheer that fits.
  useEffect(() => {
    if (!done) return;
    const wait = slow ? 250 : OVER_DELAY_MS;
    later(wait, () => { overAt.current = performance.now(); setShowOver(true); });
    if (two) { later(wait, () => { if (game.pairs[0] !== game.pairs[1]) { sfx.win(); confetti({ colors: COLORS }); } else sfx.good(); }); return; }
    if (!level) { later(wait, sfx.good); return; }
    const stars = starsOf(level, game.moves);
    setEarned(stars);
    levels.record(level, stars);
    const finishedAll = level === LEVEL_COUNT && !levels.stars[level];
    later(wait + 260 * (stars + 1), stars === 3 || finishedAll ? () => { sfx.levelUp(); confetti({ colors: COLORS }); } : sfx.good);
    // Once per finished game.
  }, [done, game.seed]);

  // A hidden tab pauses the game and turns a missed pair back, so nothing is left showing.
  useEffect(() => {
    const hidden = () => { if (document.hidden && live.current.phase === "playing") { setPaused(true); setGame(settle); } };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("জোড়া মেলাও লেভেল ২৩ চালে").then(() => {
      if (cancelled) return;
      if (card && cardCanvas.current) drawCard(cardCanvas.current, card, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function tap(index: number) {
    if (paused) return;
    const next = flip(game, index);
    if (next === game) return;
    flipSound();
    if (next.moves > game.moves) {
      if (next.last === "match") { matchSound(streak.current); streak.current++; }
      else {
        streak.current = 0;
        missSound();
        // The two cards shake once the player has seen both faces.
        const [first, second] = next.open;
        later(330, () => { const tiles = board.current?.querySelectorAll(".jm-tile"); shake(tiles?.[first]); shake(tiles?.[second]); });
      }
    }
    setGame(next);
  }

  function again() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    // A memory board can't be replayed fairly (you'd remember it), so আরেকবার always deals a new one.
    dropFriend();
    if (two) start(newSeed(), size, 2, 0);
    else playLevel(level || startLevel(levels.stars, levels.unlocked));
    if ((board.current?.getBoundingClientRect().top ?? 0) < 0) board.current?.scrollIntoView({ block: "start" });
  }

  function nextLevel() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    dropFriend();
    playLevel(level + 1);
    if ((board.current?.getBoundingClientRect().top ?? 0) < 0) board.current?.scrollIntoView({ block: "start" });
  }

  function choose(nextPlayers: Players, nextSize: Size = size === 12 ? 12 : 16) {
    if (nextPlayers === players && (nextPlayers === 1 || nextSize === size)) return;
    sfx.tap();
    if (nextPlayers === 1) { dropFriend(); playLevel(startLevel(levels.stars, levels.unlocked)); return; }
    // Before the first tap nothing is seen, so the same board stays (a friend's too); mid-game a fresh one is dealt.
    const keep = phase === "ready" && players === 2;
    if (!keep) dropFriend();
    start(keep ? game.seed : newSeed(), nextSize, 2, 0);
  }

  function pick(next: number) {
    dropFriend();
    playLevel(next);
    board.current?.scrollIntoView({ block: "center" });
  }

  function arrows(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = STEPS[event.key];
    if (!step) return;
    const tiles = [...event.currentTarget.querySelectorAll<HTMLButtonElement>(".jm-tile")];
    const from = tiles.indexOf(document.activeElement as HTMLButtonElement), to = from + step;
    if (from < 0 || to < 0 || to >= tiles.length || (Math.abs(step) === 1 && Math.floor(to / COLS) !== Math.floor(from / COLS))) return;
    event.preventDefault();
    tiles[to].focus();
  }

  const lastFlip = game.flips[game.flips.length - 1] ?? 0;
  const said = paused ? "খেলা থেমে আছে। চালিয়ে যাও চাপো।"
    : card ? (two ? `${winnerTitle(card)} ${duoScore(card)}` : `সব জোড়া মিলেছে, ${bn(card.moves)} চালে।${earned ? ` ${bn(earned)} তারা।` : ""}`)
    : game.last === "match" ? `মিলেছে! ${ART[TOYS[game.board[lastFlip]]].name}।${two ? ` আবার ${possessive(turnName)} পালা।` : ""}`
    : game.last === "miss" ? `মেলেনি।${two ? ` এবার ${possessive(turnName)} পালা।` : ""}` : "";

  return (
    <div className="jm" data-slow={slow}>
      {friend && (
        <section className="jm-friend" aria-labelledby="jm-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.names[0] ? possessive(friend.names[0]) : "বন্ধুর"} কার্ড: ${friend.players === 2 ? duoScore(friend) : `${bn(friend.moves)} চাল`}`} />
          <div>
            <h2 id="jm-friend-title">{friendBanner(friend)}</h2>
            <p>{friendNote(friend)}</p>
          </div>
        </section>
      )}

      <div className="jm-status" aria-hidden="true">
        {two ? (phase === "ready" ? <p className="jm-hint"><b>দুটো মিললে থাকবে</b><span>শুরু করবে {playerName(names, 0)}</span></p>
          : <p className="jm-turn" key={`${turn}-${game.moves}`} style={{ "--who": PLAYER_COLORS[turn] } as CSSProperties}>{done ? "খেলা শেষ!" : game.last === "match" ? `মিলেছে! আবার ${possessive(turnName)} পালা` : `এবার ${possessive(turnName)} পালা`}</p>)
          : <div className="jm-count">
            <p><b>{level ? `লেভেল ${bn(level)}` : "বন্ধুর খেলা"}</b><span>চাল <b>{bn(game.moves)}</b></span><span>জোড়া <b>{bn(game.pairs[0])}/{bn(all)}</b></span></p>
            <p className="jm-goal">{phase === "ready" && level === 1 ? "দুটো মিললে থাকবে। যেকোনো কার্ড চাপো।" : par ? `৩ তারা ${bn(par.three)} চালের মধ্যে · মোট ★ ${bn(total)}/${bn(LEVEL_COUNT * 3)}` : `${sizeLabel(size)} · বন্ধু ${bn(friend?.moves ?? 0)} চালে পেরেছিল`}</p>
          </div>}
      </div>

      <div className="jm-board" ref={board} data-size={size} data-phase={phase} style={two ? { "--who": PLAYER_COLORS[turn] } as CSSProperties : undefined}>
        <div className="jm-grid" key={`${game.seed}-${size}-${players}`} role="group" aria-label="খেলনার কার্ড, তীর চিহ্ন দিয়ে সরতে পারো" onKeyDown={arrows}>
          {game.board.map((toy, index) => {
            const id = TOYS[toy], up = isUp(game, index), owner = game.found[index];
            const label = owner >= 0 ? `${ART[id].name}, মিলেছে` : up ? `${bn(index + 1)}: ${ART[id].name}` : `${bn(index + 1)} নম্বর কার্ড`;
            return (
              <button key={index} type="button" className="jm-tile" data-up={up} data-owner={owner >= 0 ? (two ? owner : "solo") : phase === "ready" && up ? "demo" : undefined} aria-label={label} onClick={() => tap(index)}>
                <span className="jm-inner">
                  <span className="jm-back" />
                  <span className="jm-face" style={{ "--tint": ART[id].tint } as CSSProperties}><Toy id={id} /><small>{ART[id].name}</small></span>
                </span>
              </button>
            );
          })}
          {game.last === "match" && (
            <p className="jm-pop" key={game.moves} aria-hidden="true" style={{ left: `${Math.min(76, Math.max(24, ((lastFlip % COLS) + 0.5) * (100 / COLS)))}%`, top: `${Math.floor(lastFlip / COLS) * (100 / rowsOf(size))}%` }}>{streak.current > 1 ? `পরপর ${bn(streak.current)}টা!` : "মিলেছে!"}</p>
          )}
        </div>

        {paused && (
          <div className="jm-cover">
            <p>খেলা থেমে আছে। কার্ডগুলো যেখানে ছিল, সেখানেই আছে।</p>
            <button type="button" className="jm-big" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
          </div>
        )}
      </div>
      <p className="jm-sr" aria-live="polite">{said}</p>

      {card && showOver && (
        <div className="jm-over" role="status">
          <p className="jm-kicker">{two ? "খেলা শেষ!" : "সব জোড়া মিলেছে!"}</p>
          {two ? <strong className="jm-winner">{winnerTitle(card)}</strong> : <strong>{bn(card.moves)}<small> চালে</small></strong>}
          {level > 0 && <StarReveal count={earned} />}
          <p>{two ? `${duoScore(card)} জোড়া` : versus || (fewer ? `আর ${bn(fewer)} চাল কম হলে ${bn(earned + 1)} তারা।` : earned === 3 ? `${bn(par!.three)} চালের মধ্যে, পুরো ৩ তারা।` : humanLine(card))}</p>
          {versus && level > 0 && fewer > 0 && <p className="jm-near">আর {bn(fewer)} চাল কম হলে {bn(earned + 1)} তারা।</p>}
          <div className="jm-over-actions">
            {level > 0 && level < LEVEL_COUNT ? <>
              <button type="button" className="kit-secondary" onClick={again}>আবার খেলো</button>
              <button type="button" className="jm-big" onClick={nextLevel}>পরের লেভেল</button>
            </> : <button type="button" className="jm-big" onClick={again}>{level === LEVEL_COUNT ? "আবার খেলো" : "আরেকবার"}</button>}
          </div>
          {level > 0 && <p className="jm-next">{level < LEVEL_COUNT ? `লেভেল ${bn(level + 1)}: ${bn(LEVELS[level].size)}টা কার্ড, ৩ তারা ${bn(LEVELS[level].three)} চালে` : "সব লেভেল শেষ! তারা কম থাকলে নিচে থেকে আবার খেলো।"}</p>}
        </div>
      )}

      {two && (
        <div className="jm-scores">
          {([0, 1] as const).map(seat => (
            <p key={seat} data-on={!done && turn === seat} style={{ "--who": PLAYER_COLORS[seat] } as CSSProperties}>
              <i aria-hidden="true" /><span>{playerName(names, seat)}</span><b>{bn(game.pairs[seat])}<small> জোড়া</small></b>
            </p>
          ))}
        </div>
      )}

      <div className="jm-controls">
        <div className="jm-seg" role="group" aria-label="কে খেলবে">
          <button type="button" aria-pressed={!two} onClick={() => choose(1)}>একা</button>
          <button type="button" aria-pressed={two} onClick={() => choose(2)}>দুজন</button>
        </div>
        {two && (
          <div className="jm-seg" role="group" aria-label="কয়টা কার্ড">
            <button type="button" aria-pressed={size === 16} onClick={() => choose(2, 16)}>৪×৪</button>
            <button type="button" aria-pressed={size === 12} onClick={() => choose(2, 12)}>৩×৪ সহজ</button>
          </div>
        )}
        <button type="button" className="jm-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
        <SoundToggle compact className="jm-sound" />
      </div>

      {two && (
        <fieldset className="jm-names">
          <legend>দুজনের নাম <small>না দিলেও চলবে</small></legend>
          {([0, 1] as const).map(seat => (
            <label key={seat} style={{ "--who": PLAYER_COLORS[seat] } as CSSProperties}>
              <i aria-hidden="true" />
              <input value={names[seat]} maxLength={MAX_NAME} placeholder={DEFAULT_NAMES[seat]} aria-label={`${DEFAULT_NAMES[seat]} খেলোয়াড়ের নাম`} autoComplete="off"
                onChange={event => { const value = event.target.value; setNames(current => seat === 0 ? [value, current[1]] : [current[0], value]); }} />
            </label>
          ))}
        </fieldset>
      )}

      <details className="jm-levels">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>৮টা কার্ড দিয়ে শুরু, তারপর ১২, ১৬, শেষে ২০টা। কম চালে মেলালে বেশি তারা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, level)} current={level || undefined} onPick={pick} />
      </details>

      {card && (
        <section className="jm-result" id="result" aria-labelledby="jm-result-title">
          <h2 id="jm-result-title">{versus || humanLine(card)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="jm-card-summary" />
            <figcaption id="jm-card-summary" className="jm-sr">জোড়া মেলাও, {level ? `লেভেল ${bn(level)}, ` : ""}{sizeLabel(size)}। {two ? duoScore(card) : `${card.names[0] ? `${card.names[0]}, ` : ""}${bn(card.moves)} চালে`}{earned ? `, ${bn(earned)} তারা` : ""}। {humanLine(card)}</figcaption>
            {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="jm-share">
            {!two && (
              <label className="jm-name">
                <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={names[0]} maxLength={MAX_NAME} onChange={event => { const value = event.target.value; setNames(current => [value, current[1]]); }} placeholder="যেমন: রাফি" autoComplete="off" />
              </label>
            )}
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="jora-melao.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
              hint={two ? "লিংক খুললে ওরাও ঠিক এই খেলনাগুলো, এই জায়গাতেই পাবে।" : "বন্ধু লিংক খুললে ঠিক এই খেলনাগুলো, এই জায়গাতেই পাবে।"} />
          </div>
        </section>
      )}
    </div>
  );
}
