"use client";
// IP: what we avoided — no boxed snakes-and-ladders brand name, art, characters or square numbers; our own layout and captions, bamboo ladders and round-eyed snakes drawn fresh, no casino-style dice or betting words.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, fitCanvas, hiss, newSeed, sfx, shake, tone, useBest, useGameLoop, useSlowMode } from "../../../shared/game-kit";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { JUMPS, LAST, cellOf, isLadder } from "../lib/board";
import { cardBlob, drawCard } from "../lib/draw-card";
import { alongJump, centerOf, drawBoard, drawGhost, drawPiece, SEATS, slotOffset, type Point } from "../lib/draw-board";
import { choose, landing, makeDice, newGame, options, piecesFor, roll, type Game, type Move, type Players } from "../lib/game";
import {
  biteText, bn, caption, cardHash, cardOf, friendBanner, friendNote, headline, humanLine, jumpNews, MAX_PLAYER_NAME, nearBest, parseCard, sameRace, seatName, SEAT_NAMES,
  versusLine, winnerMoves, type Result,
} from "../lib/result";

const TOOL = "sap-ludu";
// Animation timings (ms). ধীরে খেলো drops the walk and slide (the piece jumps) and holds each landing longer.
const HOP_MS = 150, PAUSE_MS = 300, LADDER_MS = 620, SNAKE_MS = 760, SLOW_HOLD_MS = 900, REST_MS = 80;
const OVER_DELAY_MS = 450;
// A tap already on its way when the cover appears must not hit "আরেকবার".
const AGAIN_GUARD_MS = 400;
/** The start row under the board, in squares. */
const STRIP = 0.9;
const LABELS = ["১", "২"];
const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
};

type News = { title: string; sub: string; tone: "up" | "down" | "stuck" | "plain"; jump?: number };
type Anim = { slot: number; seat: number; from: number; to: number; end: number; jump: number; t: number; walk: number; pause: number; slide: number; total: number; told: boolean; news: News | null; hop: number; sounded: boolean };

/** The die rattling in a cupped hand, then landing on the board. */
function rattle() { for (let i = 0; i < 3; i++) hiss(0.035, 0.1, 2400 + i * 400, "bandpass", i * 0.045); tone(260, 0.06, 0.09, "triangle", 0.15); }
/** One square hopped: a soft tick that climbs a little with each hop. */
const hopTick = (hop: number) => tone(620 + 40 * Math.min(8, hop), 0.03, 0.045, "triangle");
/** A ladder's ঝিং up, or a snake's long, silly slide down. */
function jumpSound(jump: number) {
  if (isLadder(jump)) { tone(523, 0.55, 0.08, "triangle", 0, 1568); tone(1047, 0.5, 0.05, "sine", 0.08, 2093); return; }
  tone(1100, 0.75, 0.08, "triangle", 0, 140);
  hiss(0.6, 0.07, 1400, "bandpass");
  tone(320, 0.14, 0.06, "sine", 0.74, 210);
}
/** Too far for 100: a short, dull "no". */
const stuckSound = () => tone(196, 0.14, 0.07, "square", 0, 165);

function Shape({ seat, size = 18 }: { seat: number; size?: number }) {
  const { color, deep, shape } = SEATS[seat];
  const body = shape === "circle" ? <circle cx="12" cy="12" r="8" /> : shape === "square" ? <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
    : shape === "triangle" ? <path d="M12 3.5 21 19.5H3Z" /> : <path d="M12 2.5 20.5 12 12 21.5 3.5 12Z" />;
  return <svg className="sl-shape" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill={color} stroke={deep} strokeWidth="2" strokeLinejoin="round">{body}</g></svg>;
}

/** A die with pips, or the কড়ি skin: six cowrie shells, as many mouth-up as the roll. */
function DieFace({ value, cowrie }: { value: number; cowrie: boolean }) {
  if (cowrie) return <svg className="sl-face sl-cowries" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
    {Array.from({ length: 6 }, (_, index) => {
      const x = 17 + (index % 2) * 26, y = 12 + Math.floor(index / 2) * 18, up = index < value;
      return <g key={index} transform={`translate(${x} ${y}) rotate(${index % 2 ? 18 : -18})`}>
        <ellipse rx="11" ry="7.5" fill={up ? "#fff8e6" : "#c9a36b"} stroke="#6b4a1f" strokeWidth="1.4" />
        {up ? <><path d="M-7 0h14" stroke="#4a2f17" strokeWidth="2.2" strokeLinecap="round" /><path d="M-4-2v4M0-2v4M4-2v4" stroke="#4a2f17" strokeWidth="0.9" /></>
          : <circle cx="-3" cy="-2" r="1.6" fill="#8a6234" />}
      </g>;
    })}
  </svg>;
  return <svg className="sl-face" viewBox="0 0 60 60" aria-hidden="true" focusable="false">
    <rect x="3" y="3" width="54" height="54" rx="12" fill="#fffdf6" stroke="#3a2412" strokeWidth="2.5" />
    {(PIPS[value] ?? PIPS[5]).map(([col, row], index) => <circle key={index} cx={col * 15} cy={row * 15} r="5.2" fill={value === 1 ? "#d6336c" : "#3a2412"} />)}
  </svg>;
}

const squareName = (square: number) => square === 0 ? "শুরু" : bn(square);

function moveNews(move: Move, who: string, game: Game): { plain: News; jump: News | null } {
  const lead = who ? `${who}: ` : "", again = move.again ? " · ছক্কা, আরেকবার!" : "";
  if (move.stuck) {
    const need = LAST - move.from;
    return { plain: { title: `${lead}${bn(move.die)} পড়েছে, গুটি নড়বে না`, sub: (game.pieces === 1 ? `ঠিক ১০০-তে পড়তে ${bn(need)} লাগবে` : "ঠিক ১০০-তে পড়তে হবে") + again, tone: "stuck" }, jump: null };
  }
  const plain: News = { title: `${lead}${bn(move.die)} পড়েছে${move.end === LAST ? ", ঠিক ১০০!" : ""}`, sub: `${squareName(move.from)} থেকে ${bn(move.to)}${again}`, tone: "plain" };
  if (move.jump < 0) return { plain, jump: null };
  const news = jumpNews(move.jump);
  return { plain, jump: { title: `${lead}${news.title}`, sub: news.sub + again, tone: news.up ? "up" : "down", jump: move.jump } };
}

export function SapLuduGame() {
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL, false);
  const [game, setGame] = useState<Game>(() => newGame(1, 2, 1));
  const [twoPieces, setTwoPieces] = useState(false);
  const [cowrie, setCowrie] = useState(false);
  const [fast, setFast] = useState(false);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [animating, setAnimating] = useState(false);
  const [news, setNews] = useState<News | null>(null);
  const [paused, setPaused] = useState(false);
  const [showOver, setShowOver] = useState(false);
  const [friend, setFriend] = useState<Result | null>(null);
  const [record, setRecord] = useState<"first" | "new" | "">("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);

  const live = useRef(game);
  live.current = game;
  const dice = useRef(makeDice(1));
  const anim = useRef<Anim | null>(null);
  const overAt = useRef(0);
  const wrap = useRef<HTMLDivElement>(null);
  const playRow = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const boardImage = useRef<HTMLCanvasElement | null>(null);
  const geo = useRef({ width: 0, height: 0, cell: 0 });
  const point = useRef<Point>({ x: 0, y: 0 });
  const slot = useRef({ x: 0, y: 0, r: 0 });
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const boardVisible = useInView(wrap, 0.3);

  const { players, phase } = game;
  const solo = players === 1, over = phase === "over", started = game.rolls > 0, inProgress = started && !over;
  const result: Result | null = over ? { card: cardOf(game, names), game } : null;
  const state = result ? cardHash(result.card, game) : "";
  const versus = result && friend && solo && sameRace(result.card, friend.card) ? versusLine(winnerMoves(game), winnerMoves(friend.game), friend.card.names[0]) : "";
  const turnSeat = animating && game.last ? game.last.player : game.turn;
  const nameOf = (seat: number) => solo ? "তুমি" : seatName(names, seat);
  const choices = phase === "choose" ? options(game, game.die) : [];

  // —— the canvas: a pre-rendered board, then pieces on top ——
  const startSpot = (index: number, cell: number, out: Point) => { out.x = cell * (1.75 + index * 0.8); out.y = cell * (10 + STRIP / 2); return out; };

  const draw = useCallback(() => {
    const c = context.current, image = boardImage.current, { width, height, cell } = geo.current;
    if (!c || !image || !cell) return;
    c.drawImage(image, 0, 0, width, height);
    const g = live.current, a = anim.current, count = g.pos.length, p = point.current, s = slot.current;
    if (g.phase === "choose" && !a) {
      for (const piece of options(g, g.die)) {
        const to = landing(g.pos[g.turn * g.pieces + piece], g.die)!.to;
        centerOf(to, cell, 0, 0, p);
        drawGhost(c, g.turn, p.x, p.y + cell * 0.05, cell * 0.24);
      }
    }
    for (let i = 0; i < count; i++) {
      if (a && i === a.slot) continue;
      const square = g.pos[i], seat = Math.floor(i / g.pieces), label = g.pieces === 2 ? LABELS[i % 2] : "";
      if (square === 0) { startSpot(i, cell, p); drawPiece(c, seat, p.x, p.y, cell * 0.22, label); continue; }
      let sharing = 0, rank = 0;
      for (let j = 0; j < count; j++) {
        if ((a && j === a.slot) || g.pos[j] !== square) continue;
        sharing++;
        if (j < i) rank++;
      }
      centerOf(square, cell, 0, 0, p); slotOffset(rank, sharing, s);
      drawPiece(c, seat, p.x + s.x * cell, p.y + s.y * cell, s.r * cell, label);
    }
    if (a) {
      const t = a.t;
      if (t < a.walk) {
        const hop = Math.floor(t / HOP_MS), u = (t - hop * HOP_MS) / HOP_MS, here = a.from + hop;
        if (here === 0) startSpot(a.slot, cell, p); else centerOf(here, cell, 0, 0, p);
        const x0 = p.x, y0 = p.y;
        centerOf(here + 1, cell, 0, 0, p);
        p.x = x0 + (p.x - x0) * u; p.y = y0 + (p.y - y0) * u - Math.sin(Math.PI * u) * cell * 0.28;
      } else if (a.jump >= 0 && t < a.walk + a.pause) centerOf(a.to, cell, 0, 0, p);
      else if (a.jump >= 0 && a.slide > 0 && t < a.walk + a.pause + a.slide) {
        const u = (t - a.walk - a.pause) / a.slide;
        alongJump(a.jump, u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u), cell, 0, 0, p);
      } else centerOf(a.end, cell, 0, 0, p);
      drawPiece(c, a.seat, p.x, p.y + cell * 0.04, cell * 0.27, g.pieces === 2 ? LABELS[a.slot % 2] : "");
    }
  }, []);

  const finishAnim = useCallback(() => {
    const a = anim.current;
    if (!a) return;
    if (!a.told && a.news) setNews(a.news);
    anim.current = null;
    setAnimating(false);
  }, []);

  const step = useCallback((dt: number) => {
    const a = anim.current;
    if (!a) return;
    a.t += dt * 1000;
    if (a.t < a.walk) { const hop = Math.floor(a.t / HOP_MS); if (hop !== a.hop) { a.hop = hop; hopTick(hop); } }
    // The ladder or snake sounds as the piece starts to slide (or as it lands, when ধীরে খেলো skips the slide).
    if (a.jump >= 0 && !a.sounded && a.t >= (a.slide ? a.walk + a.pause : a.walk)) { a.sounded = true; jumpSound(a.jump); }
    if (!a.told && a.t >= a.walk) { a.told = true; if (a.news) setNews(a.news); }
    if (a.t >= a.total) finishAnim();
  }, [finishAnim]);

  useGameLoop(step, draw, animating);

  const renderBoard = useCallback(() => {
    const element = wrap.current, target = canvas.current;
    if (!element || !target) return;
    const width = element.clientWidth, cell = width / 10, height = width + cell * STRIP;
    if (!width) return;
    geo.current = { width, height, cell };
    target.style.width = `${width}px`; target.style.height = `${height}px`;
    context.current = fitCanvas(target, width, height);
    const ratio = Math.min(2, window.devicePixelRatio || 1), image = boardImage.current ?? document.createElement("canvas");
    image.width = Math.round(width * ratio); image.height = Math.round(height * ratio);
    const c = image.getContext("2d");
    if (!c) return;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.fillStyle = "#f3dfb3"; c.fillRect(0, 0, width, height);
    c.fillStyle = "#e6c98f"; c.fillRect(0, cell * 10, width, Math.max(1, cell * 0.06));
    c.fillStyle = "#7a1f2b"; c.font = `700 ${Math.round(cell * 0.4)}px "Bangla"`; c.textBaseline = "middle"; c.textAlign = "left";
    c.fillText("শুরু", cell * 0.25, cell * (10 + STRIP / 2) + 1);
    c.textBaseline = "alphabetic";
    drawBoard(c, cell, 0, 0);
    boardImage.current = image;
    draw();
  }, [draw]);

  useEffect(() => {
    renderBoard();
    let cancelled = false;
    loadCardFonts("১২৩ শুরু").then(() => { if (!cancelled) renderBoard(); }).catch(() => {});
    const observer = new ResizeObserver(() => renderBoard());
    if (wrap.current) observer.observe(wrap.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, [renderBoard]);

  // Redraw whenever the game changes while nothing is moving (the loop draws while something is).
  useEffect(() => { if (!animating) draw(); }, [game, animating, draw]);

  // —— game flow ——
  const start = useCallback((seed: number, nextPlayers: Players, two: boolean) => {
    anim.current = null;
    setAnimating(false);
    dice.current = makeDice(seed);
    setGame(newGame(seed, nextPlayers, piecesFor(nextPlayers, two)));
    setNews(null); setPaused(false); setShowOver(false); setRecord("");
  }, []);

  const dropFriend = () => {
    setFriend(null);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
  };

  useEffect(() => {
    const read = () => {
      const shared = parseCard(window.location.hash);
      if (shared) {
        const sharedSolo = shared.card.players === 1, two = shared.card.pieces === 2 && !sharedSolo;
        setFriend(shared); setTwoPieces(two);
        // Solo: the same dice, to race. A group's link shows their result; your group gets fresh dice.
        start(sharedSolo ? shared.card.seed : newSeed(), shared.card.players, two);
      }
      return Boolean(shared);
    };
    if (!read()) start(newSeed(), 2, false);
    setSite(window.location.host);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [start]);

  function begin(next: Game) {
    const move = next.last;
    if (next.phase === "choose" || !move) { setNews(null); return; }
    const said = moveNews(move, next.players > 1 ? seatName(names, move.player) : "", next);
    if (move.stuck) { stuckSound(); shake(playRow.current); }
    if (move.stuck || fast) { if (move.jump >= 0) jumpSound(move.jump); else if (!move.stuck) hopTick(0); setNews(said.jump ?? said.plain); return; }
    const walk = slow ? 0 : (move.to - move.from) * HOP_MS;
    const pause = move.jump < 0 ? 0 : slow ? SLOW_HOLD_MS : PAUSE_MS;
    const slide = move.jump < 0 || slow ? 0 : isLadder(move.jump) ? LADDER_MS : SNAKE_MS;
    anim.current = {
      slot: move.player * next.pieces + move.piece, seat: move.player, from: move.from, to: move.to, end: move.end, jump: move.jump,
      t: 0, walk, pause, slide, total: walk + pause + slide + REST_MS, told: false, news: said.jump, hop: -1, sounded: false,
    };
    setNews(said.plain);
    setAnimating(true);
  }

  function tapDice() {
    if (paused || showOver) return;
    // A tap while a piece is still walking just finishes the move.
    if (anim.current) { finishAnim(); return; }
    const current = live.current;
    if (current.phase !== "play") return;
    const next = roll(current, dice.current(current.rolls));
    rattle();
    if (!slow) buzz(8);
    setGame(next);
    begin(next);
  }

  function pick(piece: number) {
    if (paused) return;
    const next = choose(live.current, piece);
    if (next === live.current) return;
    sfx.tap();
    setGame(next);
    begin(next);
  }

  function boardTap(event: ReactMouseEvent<HTMLCanvasElement>) {
    const g = live.current, { cell } = geo.current;
    if (g.phase !== "choose" || anim.current) { tapDice(); return; }
    const rect = event.currentTarget.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top, p = point.current;
    for (const piece of options(g, g.die)) {
      const index = g.turn * g.pieces + piece, at = g.pos[index];
      if (at === 0) startSpot(index, cell, p); else centerOf(at, cell, 0, 0, p);
      const near = Math.hypot(p.x - x, p.y - y) < cell * 0.8;
      centerOf(landing(at, g.die)!.to, cell, 0, 0, p);
      if (near || Math.hypot(p.x - x, p.y - y) < cell * 0.8) { pick(piece); return; }
    }
  }

  // Space or Enter rolls, 1 and 2 (or the arrows) pick a piece, while the board is on screen.
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!boardVisible || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a, summary")) return;
      const g = live.current;
      if ((event.key === " " || event.key === "Enter") && g.phase === "play") { event.preventDefault(); tapDice(); }
      else if (g.phase === "choose") {
        const piece = event.key === "1" || event.key === "ArrowLeft" ? 0 : event.key === "2" || event.key === "ArrowRight" ? 1 : -1;
        if (piece >= 0) { event.preventDefault(); pick(piece); }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  // A hidden tab pauses the game; nothing moves until "চালিয়ে যাও".
  useEffect(() => {
    const hidden = () => {
      const g = live.current;
      if (document.hidden && g.rolls > 0 && g.phase !== "over") { setPaused(true); finishAnim(); }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, [finishAnim]);

  const settled = over && !animating;
  useEffect(() => {
    if (!settled) return;
    // Confetti for a real feat only: a new best on this phone, or the end of a game among friends.
    if (solo) {
      const beaten = submitBest(winnerMoves(game));
      setRecord(best === null ? "first" : beaten ? "new" : "");
      if (beaten && best !== null) { sfx.win(); confetti(); } else sfx.good();
    } else { sfx.win(); confetti(); }
    const timer = setTimeout(() => { overAt.current = performance.now(); setShowOver(true); }, slow ? 150 : OVER_DELAY_MS);
    return () => clearTimeout(timer);
    // Once per finished game: the best changing right after must not run it again.
  }, [settled, game.seed]);

  useEffect(() => {
    if (!(result && showOver) && !friend) return;
    let cancelled = false;
    loadCardFonts("সাপলুডু ২৪ চালে").then(() => {
      if (cancelled) return;
      if (result && showOver && cardCanvas.current) drawCard(cardCanvas.current, result, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` and the names encode everything the card draws.
  }, [state, names, format, site, friend, showOver]);

  function again(sameDice = false) {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    if (!sameDice) dropFriend();
    start(sameDice ? game.seed : newSeed(), players, twoPieces);
    if ((wrap.current?.getBoundingClientRect().top ?? 0) < 0) wrap.current?.scrollIntoView({ block: "start" });
  }

  function setPlayers(next: Players) {
    if (next === players || inProgress) return;
    if (friend) dropFriend();
    start(newSeed(), next, twoPieces);
  }

  function toggleTwo() {
    if (solo || inProgress) return;
    setTwoPieces(!twoPieces);
    start(over ? newSeed() : game.seed, players, !twoPieces);
  }

  const setName = (seat: number, value: string) => setNames(current => current.map((name, index) => index === seat ? value : name));

  const face = phase === "choose" ? game.die : game.last?.die ?? 0;
  const turnName = nameOf(turnSeat);
  const diceLabel = !started || solo ? "ছক্কা ফেলো" : `${possessive(turnName)} চাল`;
  const shown: News = news ?? (!started
    ? { title: "ছক্কা চাপো, গুটি নিজেই চলবে", sub: "সিঁড়িতে ওপরে, সাপে নিচে। ঠিক ১০০-তে পড়লে জিত।", tone: "plain" }
    : { title: `${possessive(turnName)} চাল`, sub: "ছক্কা চাপো", tone: "plain" });
  const said = paused ? "খেলা থেমে আছে। চালিয়ে যাও চাপো।" : result && showOver ? `${headline(result)} ${bn(winnerMoves(game))} চালে।`
    : phase === "choose" ? `${bn(game.die)} পড়েছে। কোন গুটি চালবে? ১ বা ২ চাপো।` : news ? `${news.title} ${news.sub}` : "";

  return (
    <div className="sl" data-slow={slow}>
      {friend && (
        <section className="sl-friend" aria-labelledby="sl-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`বন্ধুর কার্ড: ${headline(friend)} ${bn(winnerMoves(friend.game))} চালে`} />
          <div>
            <h2 id="sl-friend-title">{friendBanner(friend)}</h2>
            <p>{friendNote(friend)}</p>
          </div>
        </section>
      )}

      <ol className="sl-seats" data-count={players} aria-label="কে কোথায়">
        {Array.from({ length: players }, (_, seat) => {
          const squares = game.pos.slice(seat * game.pieces, (seat + 1) * game.pieces);
          return (
            <li key={seat} data-on={!over && turnSeat === seat} style={{ "--seat": SEATS[seat].color } as CSSProperties}>
              <Shape seat={seat} />
              <span className="sl-seat-name">{solo ? (names[0] ? seatName(names, 0) : "তুমি") : seatName(names, seat)}</span>
              <b>{squares.map(squareName).join(" · ")}</b>
              {solo && <small>চাল {bn(game.moves[0])}</small>}
            </li>
          );
        })}
      </ol>

      <div className="sl-board" style={{ "--seat": SEATS[turnSeat].color } as CSSProperties}>
        <div ref={wrap} className="sl-canvas-wrap">
          {news?.jump !== undefined && (
            <p className="sl-bubble" key={`${game.rolls}-${news.jump}`} data-tone={news.tone} aria-hidden="true"
              style={{ left: `${Math.min(80, Math.max(20, (cellOf(JUMPS[news.jump].from).col + 0.5) * 10))}%`, top: `${Math.max(9, (cellOf(JUMPS[news.jump].from).row + 0.5) * 100 / (10 + STRIP))}%` }}>
              {JUMPS[news.jump].caption}!
            </p>
          )}
          <canvas ref={canvas} onClick={boardTap} role="img" aria-label={`সাপলুডুর বোর্ড। ${Array.from({ length: players }, (_, seat) => `${nameOf(seat)} ${game.pos.slice(seat * game.pieces, (seat + 1) * game.pieces).map(squareName).join(" ও ")}-এ`).join(", ")}।`} />
        </div>
        {paused && (
          <div className="sl-cover">
            <p>খেলা থেমে আছে। গুটিগুলো যেখানে ছিল, সেখানেই আছে।</p>
            <button type="button" className="sl-big" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
          </div>
        )}
        {result && showOver && (
          <div className="sl-cover sl-over">
            <p className="sl-kicker">{solo ? "১০০-তে পৌঁছে গেছ!" : "খেলা শেষ!"}</p>
            <strong className={solo ? "" : "sl-winner"} style={solo ? undefined : { color: SEATS[game.winner].color }}>{solo ? bn(winnerMoves(game)) : headline(result)}{solo && <small> চালে</small>}</strong>
            <p>{solo ? (record === "new" ? "এই ফোনে নতুন রেকর্ড!" : record === "first" || best === null ? "প্রথম খেলা, এটাই এখন এই ফোনের সেরা" : `এই ফোনে সেরা ${bn(best)} চাল`) : `${bn(winnerMoves(game))} চালে · ${biteText(game.bites[game.winner])}`}</p>
            {solo && record === "" && nearBest(winnerMoves(game), best) && <p className="sl-near">{nearBest(winnerMoves(game), best)}</p>}
            {versus && <p className="sl-vs">{versus}</p>}
            <button type="button" className="sl-big" onClick={() => again()}>আরেকবার</button>
            {solo && <button type="button" className="sl-link" onClick={() => again(true)}>একই ছক্কায় আবার</button>}
          </div>
        )}
      </div>
      <p className="sl-sr" aria-live="polite">{said}</p>

      {phase === "choose" && !paused ? (
        <div className="sl-choose" role="group" aria-labelledby="sl-choose-title">
          <p id="sl-choose-title">{solo ? "" : `${turnName}: `}{bn(game.die)} পড়েছে। কোন গুটি চালবে?</p>
          {choices.map(piece => {
            const at = game.pos[game.turn * game.pieces + piece], land = landing(at, game.die)!;
            const tag = land.jump < 0 ? "" : land.end > land.to ? `সিঁড়ি! ${bn(land.end)}-তে` : `সাপ! ${bn(land.end)}-তে`;
            return (
              <button key={piece} type="button" className="sl-pick" data-tone={land.jump < 0 ? "plain" : land.end > land.to ? "up" : "down"} onClick={() => pick(piece)} style={{ "--seat": SEATS[game.turn].color } as CSSProperties}>
                <span className="sl-pick-top"><Shape seat={game.turn} size={22} /><b>{LABELS[piece]} নম্বর গুটি</b></span>
                <span>{squareName(at)} → {bn(land.to)}</span>
                {tag && <em>{tag}</em>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="sl-play" ref={playRow}>
          <button type="button" className="sl-dice" onClick={tapDice} disabled={paused || (over && !animating)} aria-label={`${diceLabel}${face ? `। শেষবার ${bn(face)} পড়েছিল` : ""}`} style={{ "--seat": SEATS[turnSeat].color } as CSSProperties}>
            <span className="sl-die" key={game.rolls} data-rolled={game.rolls > 0}><DieFace value={face} cowrie={cowrie} /></span>
            <span className="sl-dice-label">{diceLabel}</span>
          </button>
          <div className="sl-news" data-tone={shown.tone} key={`${shown.title}|${shown.sub}`}>
            <p className="sl-news-title">{shown.title}</p>
            <p className="sl-news-sub">{shown.sub}</p>
          </div>
        </div>
      )}

      <div className="sl-controls">
        <div className="sl-seg" role="group" aria-label="কয়জন খেলবে">
          {([1, 2, 3, 4] as const).map(count => (
            <button key={count} type="button" aria-pressed={players === count} disabled={inProgress && players !== count} onClick={() => setPlayers(count)}>{count === 1 ? "একা" : `${bn(count)} জন`}</button>
          ))}
        </div>
        <button type="button" className="sl-toggle" aria-pressed={solo || twoPieces} disabled={solo || inProgress} onClick={toggleTwo}><i aria-hidden="true" />দুই গুটি</button>
        <button type="button" className="sl-toggle" aria-pressed={cowrie} onClick={() => setCowrie(!cowrie)}><i aria-hidden="true" />কড়ি</button>
        <button type="button" className="sl-toggle" aria-pressed={fast} onClick={() => { setFast(!fast); finishAnim(); }}><i aria-hidden="true" />চাল দ্রুত করো</button>
        <button type="button" className="sl-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
        <SoundToggle compact className="sl-sound" />
        {inProgress && <button type="button" className="sl-link" onClick={() => { dropFriend(); start(newSeed(), players, twoPieces); }}>নতুন খেলা</button>}
      </div>
      <p className="sl-rule">{solo ? "একা খেললে দুই গুটি: যেকোনোটা আগে ১০০-তে তুললেই হলো। " : ""}৬ পড়লে আরেকবার। ঠিক ১০০-তে পড়তে হবে, বেশি পড়লে গুটি নড়বে না।</p>

      {!solo && (
        <details className="sl-names">
          <summary>খেলোয়াড়দের নাম দাও <small>না দিলেও চলবে</small></summary>
          <div>
            {Array.from({ length: players }, (_, seat) => (
              <label key={seat}>
                <Shape seat={seat} />
                <input value={names[seat]} maxLength={MAX_PLAYER_NAME} placeholder={SEAT_NAMES[seat]} aria-label={`${SEAT_NAMES[seat]} গুটির খেলোয়াড়ের নাম`} autoComplete="off" onChange={event => setName(seat, event.target.value)} />
              </label>
            ))}
          </div>
        </details>
      )}

      {result && showOver && (
        <section className="sl-result" id="result" aria-labelledby="sl-result-title">
          <h2 id="sl-result-title">{versus || humanLine(result)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sl-card-summary" />
            <figcaption id="sl-card-summary" className="sl-sr">সাপলুডু। {headline(result)} {bn(winnerMoves(game))} চালে। {humanLine(result)}</figcaption>
            {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="sl-share">
            {solo && (
              <label className="sl-name">
                <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={names[0]} maxLength={MAX_PLAYER_NAME} onChange={event => setName(0, event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
              </label>
            )}
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="sap-ludu.png" makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${names.join("|")}|${format}`} caption={caption(result)} state={state || undefined}
              hint={solo ? "বন্ধু লিংক খুললে ঠিক এই ছক্কাগুলোই পাবে।" : "লিংক খুললে তোমাদের খেলার কার্ডটা দেখা যাবে।"} />
          </div>
        </section>
      )}
    </div>
  );
}
