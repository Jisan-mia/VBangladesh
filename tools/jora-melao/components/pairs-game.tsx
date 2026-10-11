"use client";
// IP: what we avoided — no cartoon characters, mascots or licensed toys, no card-back or layout from any boxed memory game or app, no famous game's name; ten fair-stall toys drawn fresh as plain shapes, on a jute stall with paper bunting.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { MAX_NAME, newSeed, useBest, useSlowMode } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { ART } from "../lib/art";
import { cardBlob, drawCard, PLAYER_COLORS } from "../lib/draw-card";
import { COLS, TOYS, flip, isUp, newGame, pairsOf, rowsOf, settle, type Game, type Players, type Size, type ToyId } from "../lib/game";
import { DEFAULT_NAMES, bn, caption, cardHash, cardOf, duoScore, friendBanner, friendNote, humanLine, parseCard, playerName, sameGame, sizeLabel, versusLine, winnerTitle, type Card } from "../lib/result";

const TOOL = "jora-melao";
// How long a missed pair stays up before turning back (a tap on another card turns it back sooner).
const MISS_MS = 1000, MISS_SLOW_MS = 1800;
// The last pair gets a moment to show before the "সব জোড়া মিলেছে" cover.
const OVER_DELAY_MS = 650;
// A tap already on its way when the cover appears must not hit "আরেকবার".
const AGAIN_GUARD_MS = 400;
const STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS };

function Toy({ id }: { id: ToyId }) {
  return <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    {ART[id].parts.map((part, index) => <path key={index} d={part.d} fill={part.fill ?? "none"} stroke={part.stroke} strokeWidth={part.stroke ? part.width ?? 1.5 : undefined} strokeLinecap="round" strokeLinejoin="round" />)}
  </svg>;
}

export function PairsGame() {
  const [slow, setSlow] = useSlowMode();
  const best16 = useBest(`${TOOL}-16`, false), best12 = useBest(`${TOOL}-12`, false);
  const [game, setGame] = useState<Game>(() => newGame(1, 16, 1));
  const [paused, setPaused] = useState(false);
  const [showOver, setShowOver] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  // After a solo game: "first" game at this size on this phone, a "new" record, or nothing.
  const [record, setRecord] = useState<"first" | "new" | "">("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const live = useRef(game);
  live.current = game;
  const overAt = useRef(0);
  const board = useRef<HTMLDivElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);

  const { size, players, phase, turn } = game;
  const [best, submitBest] = size === 12 ? best12 : best16;
  const two = players === 2, done = phase === "over", all = pairsOf(size);
  const card = done ? cardOf(game, names) : null;
  const state = card ? cardHash(card) : "";
  const versus = card && friend && !two && sameGame(card, friend) ? versusLine(card.moves, friend.moves, friend.names[0]) : "";
  const turnName = playerName(names, turn);

  const start = useCallback((seed: number, nextSize: Size, nextPlayers: Players) => {
    setGame(newGame(seed, nextSize, nextPlayers));
    setPaused(false); setShowOver(false); setRecord("");
  }, []);

  const dropFriend = () => {
    setFriend(null);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  };

  useEffect(() => {
    const read = () => {
      const shared = parseCard(window.location.hash);
      if (shared) { setFriend(shared); start(shared.seed, shared.size, shared.players); }
      return Boolean(shared);
    };
    if (!read()) start(newSeed(), 16, 1);
    setSite(window.location.host);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [start]);

  // A missed pair turns back by itself after a moment.
  useEffect(() => {
    if (game.open.length !== 2 || paused) return;
    const timer = setTimeout(() => setGame(settle), slow ? MISS_SLOW_MS : MISS_MS);
    return () => clearTimeout(timer);
  }, [game.open, slow, paused]);

  useEffect(() => {
    if (!done) return;
    if (!two) { const beaten = submitBest(game.moves); setRecord(best === null ? "first" : beaten ? "new" : ""); }
    const timer = setTimeout(() => { overAt.current = performance.now(); setShowOver(true); }, slow ? 250 : OVER_DELAY_MS);
    return () => clearTimeout(timer);
    // Once per finished game: the best changing right after must not run it again.
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
    loadCardFonts("জোড়া মেলাও ২৩ চালে").then(() => {
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
    if (next.last === "match" && next.moves > game.moves && !slow) navigator.vibrate?.(12);
    setGame(next);
  }

  function again() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    // A memory board can't be replayed fairly (you'd remember it), so আরেকবার always deals a new one.
    dropFriend();
    start(newSeed(), size, players);
    if ((board.current?.getBoundingClientRect().top ?? 0) < 0) board.current?.scrollIntoView({ block: "start" });
  }

  function choose(nextSize: Size, nextPlayers: Players) {
    if (nextSize === size && nextPlayers === players) return;
    // Before the first tap nothing is seen, so the same board stays (a friend's too); mid-game a fresh one is dealt.
    const keep = phase === "ready";
    if (!keep) dropFriend();
    start(keep ? game.seed : newSeed(), nextSize, nextPlayers);
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
    : card ? (two ? `${winnerTitle(card)} ${duoScore(card)}` : `সব জোড়া মিলেছে, ${bn(card.moves)} চালে।`)
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
        {phase === "ready" ? <p className="jm-hint"><b>দুটো মিললে থাকবে</b><span>{two ? `শুরু করবে ${playerName(names, 0)}` : "যেকোনো কার্ড চাপো"}</span></p>
          : two ? <p className="jm-turn" key={`${turn}-${game.moves}`} style={{ "--who": PLAYER_COLORS[turn] } as CSSProperties}>{done ? "খেলা শেষ!" : game.last === "match" ? `মিলেছে! আবার ${possessive(turnName)} পালা` : `এবার ${possessive(turnName)} পালা`}</p>
          : <p className="jm-count"><span>চাল <b>{bn(game.moves)}</b></span><span>জোড়া <b>{bn(game.pairs[0])}/{bn(all)}</b></span>{best !== null && <span>সেরা <b>{bn(best)}</b></span>}</p>}
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
            <p className="jm-pop" key={game.moves} aria-hidden="true" style={{ left: `${((lastFlip % COLS) + 0.5) * (100 / COLS)}%`, top: `${Math.floor(lastFlip / COLS) * (100 / rowsOf(size))}%` }}>মিলেছে!</p>
          )}
        </div>

        {paused && (
          <div className="jm-cover">
            <p>খেলা থেমে আছে। কার্ডগুলো যেখানে ছিল, সেখানেই আছে।</p>
            <button type="button" className="jm-big" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
          </div>
        )}
        {card && showOver && (
          <div className="jm-cover jm-over">
            <p className="jm-kicker">{two ? "খেলা শেষ!" : "সব জোড়া মিলেছে!"}</p>
            {two ? <strong className="jm-winner">{winnerTitle(card)}</strong> : <strong>{bn(card.moves)}<small> চালে</small></strong>}
            <p>{two ? `${duoScore(card)} জোড়া` : record === "new" ? "এই ফোনে নতুন রেকর্ড!" : record === "first" || best === null ? "প্রথম খেলা, এটাই এখন এই ফোনের সেরা" : `এই ফোনে ${sizeLabel(size)}-এ সেরা ${bn(best)} চাল`}</p>
            {versus && <p className="jm-vs">{versus}</p>}
            <button type="button" className="jm-big" onClick={again}>আরেকবার</button>
          </div>
        )}
      </div>
      <p className="jm-sr" aria-live="polite">{said}</p>

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
          <button type="button" aria-pressed={!two} onClick={() => choose(size, 1)}>একা</button>
          <button type="button" aria-pressed={two} onClick={() => choose(size, 2)}>দুজন</button>
        </div>
        <div className="jm-seg" role="group" aria-label="কয়টা কার্ড">
          <button type="button" aria-pressed={size === 16} onClick={() => choose(16, players)}>৪×৪</button>
          <button type="button" aria-pressed={size === 12} onClick={() => choose(12, players)}>৩×৪ সহজ</button>
        </div>
        <button type="button" className="jm-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
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

      {card && (
        <section className="jm-result" id="result" aria-labelledby="jm-result-title">
          <h2 id="jm-result-title">{versus || humanLine(card)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="jm-card-summary" />
            <figcaption id="jm-card-summary" className="jm-sr">জোড়া মেলাও, {sizeLabel(size)}। {two ? duoScore(card) : `${card.names[0] ? `${card.names[0]}, ` : ""}${bn(card.moves)} চালে`}। {humanLine(card)}</figcaption>
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
