"use client";
// IP: what we avoided — no boxed snakes-and-ladders brand name, art, characters or square numbers; our own layouts and
// captions, bamboo ladders and round-eyed snakes drawn fresh, no casino-style dice or betting words.
// Thin React over lib/: game.ts decides every roll, motion.hot.ts times the walk, paint.hot.ts draws each frame, and the
// shared player (useGamePlayer) owns pause, resume and restart. Everything that waits (a walk, a computer's turn) runs on
// the game loop's clock, so it freezes whenever the loop stops: the pause menu, a blurred window, a hidden tab.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { BODY_FONT, cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, fitCanvas, newSeed, sfx, shake, useBest, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { PALETTES, paintBoard, pieceSprite, SEATS, STRIP } from "../lib/art";
import { boardLadder, type Board } from "../lib/board";
import { cardBlob, drawCard } from "../lib/draw-card";
import { choose, classicSetup, isBot, landingOn, leadSquare, levelSetup, makeDice, piecesFor, placeOf, previews, roll, smartPick, startGame, starsOf, type Game, type Move, type Setup } from "../lib/game";
import { LEVEL_COUNT, levelOf } from "../lib/levels";
import { BOT_MS, BREATH_MS, EV_DIE, EV_DONE, EV_HOP, EV_JUMP, EV_JUMPED, finishMotion, freshPress, makeMotion, makePacer, makePlace, PACE_PICK, PACE_ROLL, paceStep, planMove, planStill, squareX, squareY, startX, startY, stepMotion } from "../lib/motion.hot";
import { bn, caption, cardHash, cardOf, cleanPlayerName, friendBanner, headline, highlights, humanLine, jumpLine, MAX_PLAYER_NAME, nameIn, nearBest, nearPar, ordinal, parseCard, sameRace, versusLine, winnerMoves, type Result } from "../lib/result";
import { rivalPick, styleOf } from "../lib/rivals";
import { DEFAULT_PREFS, OLD_BEST_KEY, OPEN_KEY, openAfter, readOpen, readPrefs, SETUP_KEY, writePrefs, type Prefs } from "../lib/save";
import { Die } from "./die";
import { Finish, type Action, type Stat, type Standing } from "./finish";
import { LevelSheet } from "./level-sheet";
import { BITE, DUST, MAX_PARTICLES, paint, spawn, SPARK, tickScene, type Scene } from "./paint.hot";
import { bite, climb, homeSound, hop, rattle, six, stuck } from "./sound";
import { Shape, StartDie, StartSetup } from "./start-card";

const TOOL = "sap-ludu";
type Screen = "title" | "play" | "over";
type Tone = "up" | "down" | "stuck" | "plain" | "six" | "home";
type News = { title: string; sub: string; tone: Tone };

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const dative = (name: string) => /[ঀ-৿]$/.test(name) ? `${name}কে` : `${name}-কে`;
const squareName = (square: number) => square === 0 ? "শুরু" : bn(square);
const paletteOf = (setup: Setup) => PALETTES[setup.level ? levelOf(setup.level).world : 2];
const bossOf = (setup: Setup) => setup.level ? levelOf(setup.level).boss?.jump ?? -1 : -1;
/** Buttons drop focus after a click, so Enter and Space go to the game, not to the last button. */
const press = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };

function makeScene(board: Board): Scene {
  return {
    board, image: null, width: 0, height: 0, cell: 0, sprites: [], sprite: 0,
    pos: new Int16Array(8), count: 0, pieces: 1, turn: 0, ghosts: new Int16Array(4), ghostCount: 0,
    danger: new Int16Array(16), dangerCount: 0, boss: -1, shake: 0,
    px: new Float32Array(MAX_PARTICLES), py: new Float32Array(MAX_PARTICLES), vx: new Float32Array(MAX_PARTICLES), vy: new Float32Array(MAX_PARTICLES),
    life: new Float32Array(MAX_PARTICLES), full: new Float32Array(MAX_PARTICLES), kind: new Uint8Array(MAX_PARTICLES),
    place: makePlace(), slow: 0, ratio: 1, font: "800 14px sans-serif",
  };
}

/** What a roll says, as it lands and (if it meets one) as the ladder or snake takes it. */
function moveNews(move: Move, game: Game, who: string): { plain: News; jump: News | null } {
  const { board } = game.setup, pieces = game.pieces;
  const lead = who ? `${who}: ` : "", again = move.again ? " · ছক্কা, আরেকবার!" : "";
  if (move.voided) return { plain: { title: `${lead}তৃতীয় ছক্কা, চাল বাতিল`, sub: "পরপর তিন ছক্কা পড়লে গুটি নড়ে না।", tone: "stuck" }, jump: null };
  if (move.stuck) {
    const need = board.last - move.from;
    return { plain: { title: `${lead}${bn(move.die)} পড়েছে, গুটি নড়বে না`, sub: (pieces === 1 ? `ঠিক ${bn(board.last)}-এ পড়তে ${bn(need)} লাগবে` : "ঠিক দান লাগবে") + again, tone: "stuck" }, jump: null };
  }
  const plain: News = { title: `${lead}${bn(move.die)} পড়েছে${move.end === board.last && move.jump < 0 ? ", ঘরে!" : ""}`, sub: `${squareName(move.from)} থেকে ${bn(move.to)}${again}`, tone: move.again ? "six" : "plain" };
  if (move.jump < 0) return { plain, jump: null };
  const line = jumpLine(board, move.jump);
  return { plain, jump: { title: `${lead}${line.title}`, sub: line.sub + again, tone: line.up ? "up" : "down" } };
}

export function LuduGame() {
  const [slow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL, false);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [open, setOpen] = useState(1);
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [screen, setScreen] = useState<Screen>("title");
  const [game, setGame] = useState<Game>(() => startGame(1, levelSetup(1)));
  const [busy, setBusy] = useState(false);
  const [face, setFace] = useState(0);
  const [spin, setSpin] = useState(0);
  const [news, setNews] = useState<News | null>(null);
  const [handoff, setHandoff] = useState(-1);
  const [danger, setDanger] = useState(false);
  const [friend, setFriend] = useState<Result | null>(null);
  const [race, setRace] = useState<{ setup: Setup; seed: number } | null>(null);
  const [visit, setVisit] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [earned, setEarned] = useState({ stars: 0, better: false, record: "" as "" | "first" | "new", opened: 0 });
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);

  const live = useRef(game);
  const screenRef = useRef<Screen>("title");
  const dice = useRef(makeDice(1));
  const seedRef = useRef(1);
  const motion = useRef(makeMotion());
  const pending = useRef<{ plain: News; jump: News | null } | null>(null);
  const scene = useRef<Scene>(null as unknown as Scene);
  if (!scene.current) scene.current = makeScene(levelSetup(1).board);
  const pacer = useRef(makePacer());
  const lastHuman = useRef(-1);
  const overAt = useRef(0);
  const focusAt = useRef(0);
  const finished = useRef("");
  /** Where the seat chips say each piece is: updated when a move lands, so they never give the end away early. */
  const shownPos = useRef<number[]>([]);
  const shownBoard = useRef("");
  const root = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const tray = useRef<HTMLDivElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const primaryRef = useRef<(() => void) | null>(null);

  const player = useGamePlayer({
    // The menu covers the stage and the loop stops (and with it every walk and computer turn); the player has already cut
    // the scheduled notes. Nothing else to do.
    onPause: () => { pacer.current.bot = Math.min(pacer.current.bot, BOT_MS / 2); },
    onResume: () => { pacer.current.breath = BREATH_MS; },
    // নতুন করে শুরু: back to this race's start card, the same setup.
    onRestart: () => toTitle(),
  });

  const level = Math.min(prefs.level, Math.max(open, visit));
  const startSetup: Setup = race?.setup ?? (prefs.mode === "solo" ? levelSetup(level) : classicSetup(prefs.seats, piecesFor(prefs.seats, prefs.two), prefs.bots));
  const viewSetup = screen === "title" ? startSetup : game.setup;
  const setup = game.setup, solo = setup.level > 0 || setup.players === 1;
  const over = screen === "over" && game.phase === "over";
  const result: Result | null = over ? { card: cardOf(game, names), game } : null;
  const state = result ? cardHash(result.card, game) : "";
  const turnBot = isBot(setup, game.turn);
  // While a move is in flight the tray names whoever threw it; the turn has already passed in the game state.
  const actor = busy && motion.current.active ? motion.current.seat : game.turn, actorBot = isBot(setup, actor);
  const humans = Array.from({ length: setup.players }, (_, seat) => seat).filter(seat => !isBot(setup, seat)).length;
  const choosing = screen === "play" && game.phase === "choose" && !busy && !turnBot;

  const nameOf = (seat: number, g: Game = live.current) => {
    if (isBot(g.setup, seat)) return nameIn({ names, bots: g.setup.bots, level: g.setup.level }, seat);
    if (g.setup.level || g.players === 1) return cleanPlayerName(names[0]) || "তুমি";
    return cleanPlayerName(names[seat]) || SEATS[seat].name;
  };
  /** Who a news line is about: nobody for you alone, else the seat's name. */
  const leadOf = (seat: number, g: Game) => (g.setup.level || g.players === 1) && seat === 0 ? "" : nameOf(seat, g);

  // ---- the canvas: the board painted once, the pieces every frame ----
  function syncScene(g: Game) {
    const s = scene.current, m = motion.current;
    s.board = g.setup.board; s.count = screenRef.current === "title" ? 0 : g.pos.length; s.pieces = g.pieces; s.turn = g.turn;
    for (let i = 0; i < g.pos.length; i++) s.pos[i] = g.pos[i];
    s.ghostCount = 0; s.dangerCount = 0;
    s.boss = screenRef.current === "play" ? bossOf(g.setup) : -1;
    s.slow = slow ? 1 : 0;
    if (screenRef.current !== "play" || m.active || g.phase === "over") { setDanger(false); return; }
    if (g.phase === "choose") {
      for (const option of previews(g)) { s.ghosts[s.ghostCount * 2] = option.to; s.ghosts[s.ghostCount * 2 + 1] = option.piece + 1; s.ghostCount++; }
    }
    // Snake heads one roll away from this person's pieces get a red ring, and the stage edge glows.
    if (g.phase === "play" && !isBot(g.setup, g.turn)) {
      const { board, rules } = g.setup;
      for (let piece = 0; piece < g.pieces; piece++) {
        const at = g.pos[g.turn * g.pieces + piece];
        for (let die = 1; die <= 6; die++) {
          const land = landingOn(board, rules, at, die);
          if (!land || land.jump < 0 || boardLadder(board, land.jump)) continue;
          let seen = false;
          for (let i = 0; i < s.dangerCount; i++) if (s.danger[i] === land.jump) seen = true;
          if (!seen && s.dangerCount < s.danger.length) s.danger[s.dangerCount++] = land.jump;
        }
      }
    }
    setDanger(s.dangerCount > 0);
  }

  function draw() {
    const c = context.current;
    if (c) paint(scene.current, c, motion.current, performance.now());
  }

  function renderBoard() {
    const element = wrap.current, target = canvas.current, s = scene.current, board = viewSetup.board;
    if (!element || !target) return;
    // The wrap's padding (7 px) and the frame drawn round the canvas (8 px) on each side.
    const room = 30, rows = board.rows + STRIP, cell = Math.floor(Math.min((element.clientWidth - room) / board.cols, (element.clientHeight - room) / rows) * 2) / 2;
    if (!cell || cell < 8) return;
    const width = board.cols * cell, height = rows * cell, ratio = Math.min(2, window.devicePixelRatio || 1);
    target.style.width = `${width}px`; target.style.height = `${height}px`;
    context.current = fitCanvas(target, width, height);
    const image = s.image ?? document.createElement("canvas");
    image.width = Math.round(width * ratio); image.height = Math.round(height * ratio);
    const c = image.getContext("2d");
    if (!c) return;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, width, height);
    paintBoard(c, board, paletteOf(viewSetup), cell, 0, 0, bossOf(viewSetup));
    s.image = image; s.width = width; s.height = height; s.cell = cell; s.ratio = ratio; s.board = board;
    s.sprite = cell * 0.74;
    s.sprites = [];
    for (let seat = 0; seat < 4; seat++) for (const label of ["", "১", "২"]) s.sprites.push(pieceSprite(seat, label, s.sprite, ratio));
    s.font = `800 ${Math.round(cell * 0.3)}px ${BODY_FONT}`;
    draw();
  }
  const renderRef = useRef(renderBoard);
  renderRef.current = renderBoard;

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("১২৩ শুরু").then(() => { if (!cancelled) renderRef.current(); }).catch(() => {});
    const observer = new ResizeObserver(() => renderRef.current());
    if (wrap.current) observer.observe(wrap.current);
    return () => { cancelled = true; observer.disconnect(); };
  }, []);

  // A new board (another level, the title's preview) is painted once; the rest of the time only the pieces move.
  const boardKey = `${viewSetup.level}|${viewSetup.board.cols}|${screen === "title" ? "t" : "p"}`;
  useEffect(() => {
    syncScene(live.current);
    if (shownBoard.current !== boardKey) { shownBoard.current = boardKey; renderBoard(); } else draw();
  }, [game, screen, boardKey, slow]);

  // ---- the turn ----
  function commit(next: Game) {
    live.current = next;
    setGame(next);
  }

  /** Start the walk (or the die alone) for the roll or pick that made `next`. `rolled`: the die was just thrown. */
  function begin(next: Game, rolled: boolean) {
    const m = motion.current, move = next.last;
    setBusy(true);
    if (next.phase === "choose") {
      // The die lands, then the choice opens.
      planStill(m, next.turn, slow); m.settle = 0; m.total = m.dice;
      const lead = leadOf(next.turn, next);
      pending.current = { plain: { title: `${lead ? `${lead}: ` : ""}${bn(next.die)} পড়েছে`, sub: "কোন গুটি চালবে?", tone: next.die === 6 ? "six" : "plain" }, jump: null };
    } else if (move) {
      pending.current = moveNews(move, next, leadOf(move.player, next));
      if (move.stuck) planStill(m, move.player, slow);
      else planMove(m, next.setup.board, move.player, move.player * next.pieces + move.piece, move.from, move.to, move.end, move.jump, rolled, slow);
      if (!rolled) setNews(pending.current.plain);
    }
    syncScene(next);
  }

  /** Throw the die for whoever's turn it is. */
  function throwDie() {
    const g = live.current;
    if (g.phase !== "play" || motion.current.active) return;
    const die = dice.current(g.rolls), next = roll(g, die);
    if (!isBot(g.setup, g.turn)) { lastHuman.current = g.turn; setHandoff(-1); }
    rattle(slow);
    if (!slow) buzz(8);
    setFace(die); setSpin(count => count + 1);
    commit(next);
    begin(next, true);
  }

  function pickPiece(piece: number) {
    const g = live.current;
    if (g.phase !== "choose" || motion.current.active) return;
    const next = choose(g, piece);
    if (next === g) return;
    sfx.tap();
    commit(next);
    begin(next, false);
  }

  /** The walk and the jump: sounds, sparks, shake and the news line, as each part happens. */
  function handle(events: number) {
    const m = motion.current, g = live.current, s = scene.current, move = g.last, said = pending.current;
    const cell = s.cell;
    if (events & EV_DIE) {
      if (said) setNews(said.plain);
      if (move?.stuck) { stuck(); shake(tray.current); }
      else if (move?.again || (g.phase === "choose" && g.die === 6)) six();
    }
    if (events & EV_HOP) {
      hop(m.hops);
      const square = m.from + m.hops;
      spawn(s, squareX(g.setup.board, square) * cell, (squareY(g.setup.board, square) + 0.3) * cell, 2, DUST);
    }
    if (events & EV_JUMP) {
      const travel = Math.max(0.2, m.travel / 1000);
      if (said?.jump) setNews(said.jump);
      const x = squareX(g.setup.board, m.to) * cell, y = squareY(g.setup.board, m.to) * cell;
      if (m.ladder) { climb(Math.round(Math.abs(m.end - m.to) / 3), travel); spawn(s, x, y, 10, SPARK); }
      else { bite(travel); spawn(s, x, y, 12, BITE); if (!slow) s.shake = cell * 0.12; }
      if (root.current) root.current.dataset.flash = m.ladder ? "climb" : "bite";
    }
    if (events & EV_JUMPED) {
      const x = squareX(g.setup.board, m.end) * cell, y = squareY(g.setup.board, m.end) * cell;
      spawn(s, x, y + cell * 0.3, 6, m.ladder ? SPARK : DUST);
      if (root.current) root.current.dataset.flash = "";
    }
    if (events & EV_DONE) settle();
  }

  /** A move has finished: the next turn, the next news, or the end of the race. */
  function settle() {
    const g = live.current, move = g.last, said = pending.current;
    pending.current = null;
    shownPos.current = g.pos;
    setBusy(false);
    if (root.current) root.current.dataset.flash = "";
    pacer.current.bot = 0;
    if (said) setNews(said.jump ?? said.plain);
    syncScene(g);
    if (g.phase === "over") { finish(g); return; }
    if (move?.home && move.player !== 0 && g.setup.until === "me") {
      homeSound(false, false);
      setNews({ title: `${nameOf(move.player, g)} ঘরে পৌঁছে গেছে!`, sub: `${ordinal(g.home.length)} হলো। তুমি চালিয়ে যাও।`, tone: "home" });
    }
    // Passing the phone: the first roll of each new person says so.
    const next = g.turn, people = Array.from({ length: g.players }, (_, seat) => seat).filter(seat => !isBot(g.setup, seat)).length;
    setHandoff(!isBot(g.setup, next) && people > 1 && next !== lastHuman.current && g.phase === "play" ? next : -1);
  }

  function finish(g: Game) {
    const key = `${g.seed}|${g.setup.level}|${g.rolls}`;
    if (finished.current === key) return;
    finished.current = key;
    let stars = 0, better = false, record: "" | "first" | "new" = "", opened = 0;
    if (g.setup.level) {
      stars = starsOf(g);
      better = levels.record(g.setup.level, stars);
      const next = openAfter(open, g.setup.level);
      if (next !== open) { setOpen(next); write(OPEN_KEY, String(next)); opened = next; }
    } else if (g.players === 1) {
      const beaten = submitBest(g.moves[0]);
      record = best === null ? "first" : beaten ? "new" : "";
    }
    const first = g.setup.until === "me" ? placeOf(g) === 1 : true;
    homeSound(first, true);
    if (!slow && (first || record === "new")) confetti();
    setEarned({ stars, better, record, opened });
    overAt.current = performance.now();
    screenRef.current = "over";
    setScreen("over");
    setHandoff(-1);
    setDanger(false);
  }

  function reset() {
    motion.current.active = 0;
    pending.current = null;
    pacer.current.bot = 0; pacer.current.breath = 0; lastHuman.current = -1;
    scene.current.shake = 0;
    scene.current.life.fill(0);
    setBusy(false); setHandoff(-1); setDanger(false); setNews(null);
    if (root.current) root.current.dataset.flash = "";
  }

  /** The start card for the current setup. */
  function toTitle(levelId?: number) {
    reset();
    setSheet(false);
    if (levelId) setPrefs({ level: levelId, mode: "solo" });
    screenRef.current = "title";
    setScreen("title");
  }

  /** A fresh race (or the same dice again) and its first roll, all from one tap. */
  function start(seed = race?.seed ?? newSeed(), using: Setup = startSetup) {
    reset();
    seedRef.current = seed;
    dice.current = makeDice(seed);
    const g = startGame(seed, using);
    finished.current = "";
    shownPos.current = g.pos;
    screenRef.current = "play";
    setScreen("play");
    setSheet(false);
    commit(g);
    setSpin(0); setFace(0);
    throwDie();
  }

  /** The die, the board, Space and Enter all come here. A tap during a walk finishes it. */
  function tap() {
    if (player.paused || pacer.current.breath > 0 || sheet) return;
    if (performance.now() - focusAt.current < 120) return;
    if (screenRef.current === "title") { start(); return; }
    if (screenRef.current !== "play") return;
    const m = motion.current;
    if (m.active) { handle(finishMotion(m)); return; }
    const g = live.current;
    if (isBot(g.setup, g.turn) || g.phase !== "play") return;
    throwDie();
  }

  function boardDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button > 0) return;
    const g = live.current, s = scene.current;
    if (g.phase === "choose" && !motion.current.active && !isBot(g.setup, g.turn) && screenRef.current === "play") {
      const rect = event.currentTarget.getBoundingClientRect(), x = (event.clientX - rect.left) / s.cell, y = (event.clientY - rect.top) / s.cell;
      for (const option of previews(g)) {
        const index = g.turn * g.pieces + option.piece, board = g.setup.board;
        const ax = option.at ? squareX(board, option.at) : startX(board, index, g.pos.length), ay = option.at ? squareY(board, option.at) : startY(board);
        if (Math.hypot(ax - x, ay - y) < 0.7 || Math.hypot(squareX(board, option.to) - x, squareY(board, option.to) - y) < 0.7) { pickPiece(option.piece); return; }
      }
      return;
    }
    tap();
  }

  // The die answers on the press (not the click), so a tap is felt at once; a keyboard click (detail 0) still works.
  const dieDown = (event: ReactPointerEvent<HTMLButtonElement>) => { if (event.isPrimary && event.button === 0) { event.currentTarget.blur(); tap(); } };
  const dieClick = (event: { detail: number; currentTarget: HTMLElement }) => { if (event.detail === 0) { event.currentTarget.blur(); tap(); } };

  // ---- the loop: walks, sparks and computer turns all run on its clock ----
  function step(dt: number) {
    const ms = dt * 1000, m = motion.current;
    tickScene(scene.current, ms);
    if (pacer.current.breath <= 0 && m.active) { handle(stepMotion(m, ms)); return; }
    const g = live.current, playing = screenRef.current === "play" && g.phase !== "over";
    const act = paceStep(pacer.current, ms, playing && isBot(g.setup, g.turn), g.phase === "choose");
    if (act === PACE_ROLL) throwDie();
    else if (act === PACE_PICK) pickPiece(rivalPick(g, styleOf(g.turn)));
  }
  useGameLoop(step, draw, screen === "play" && !player.paused);

  // ---- links, saved progress and prefs ----
  function setPrefs(change: Partial<Prefs>) {
    setPrefsState(current => { const next = { ...current, ...change }; write(SETUP_KEY, writePrefs(next)); return next; });
  }
  function dropFriend() {
    setFriend(null); setRace(null); setVisit(0);
    if (window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  useEffect(() => {
    setPrefsState(readPrefs(read(SETUP_KEY)));
    setSite(window.location.host);
    const readFriend = () => {
      const shared = parseCard(window.location.hash);
      if (!shared) return;
      const { card } = shared;
      setFriend(shared);
      if (card.level) { setVisit(card.level); setPrefsState(current => ({ ...current, mode: "solo", level: card.level })); setRace({ setup: levelSetup(card.level), seed: card.seed }); }
      else if (card.players === 1) setRace({ setup: classicSetup(1, 2), seed: card.seed });
      else { setRace(null); setPrefsState(current => ({ ...current, mode: "group", seats: card.players as Prefs["seats"], two: card.pieces === 2, bots: card.bots })); }
      toTitle();
    };
    readFriend();
    const focus = () => { focusAt.current = performance.now(); };
    window.addEventListener("hashchange", readFriend);
    window.addEventListener("focus", focus);
    return () => { window.removeEventListener("hashchange", readFriend); window.removeEventListener("focus", focus); };
  }, []);

  useEffect(() => {
    if (!levels.loaded) return;
    const raw = read(OPEN_KEY), mine = readOpen(raw, levels.stars, read(OLD_BEST_KEY));
    if (raw === null) write(OPEN_KEY, String(mine));
    setOpen(mine);
  }, [levels.loaded]);

  // The card and a friend's card, drawn when the fonts are in.
  useEffect(() => {
    if (!result && !friend) return;
    let cancelled = false;
    loadCardFonts("সাপলুডু ২৪ চালে লেভেল").then(() => {
      if (cancelled) return;
      if (result && cardCanvas.current) drawCard(cardCanvas.current, result, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` and the names encode everything the card draws.
  }, [state, names, format, site, friend, screen]);

  // Keys live on window: Space or Enter rolls (or finishes a walk), 1 and 2 pick, P pauses. On the end screen only a fresh
  // press counts, so a key held through the last move never skips it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable]") || player.paused || sheet) return;
      const key = event.key, go = key === " " || key === "Enter", onControl = Boolean(target?.closest?.("button, a, summary"));
      if (key === "p" || key === "P") { if (screenRef.current === "play") { event.preventDefault(); player.requestPause(); } return; }
      if (screenRef.current === "over") {
        if (!go || onControl || target?.closest?.(".sl-result")) return;
        event.preventDefault();
        if (freshPress(event.timeStamp, overAt.current, event.repeat)) primaryRef.current?.();
        return;
      }
      if (go) { if (onControl) return; event.preventDefault(); if (!event.repeat) tap(); return; }
      const g = live.current;
      if ((key === "1" || key === "2") && screenRef.current === "play" && g.phase === "choose" && !motion.current.active && !isBot(g.setup, g.turn)) { event.preventDefault(); pickPiece(Number(key) - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const setName = (seat: number, value: string) => setNames(current => current.map((name, index) => index === seat ? value.slice(0, MAX_PLAYER_NAME) : name));

  // ---- what the screen says ----
  const current = levelOf(setup.level || 1);
  const turnName = nameOf(game.turn, game), actorName = nameOf(actor, game);
  const choices = game.phase === "choose" ? previews(game) : [];
  const recommended = game.phase === "choose" ? smartPick(game) : -1;
  const shown: News = news ?? (setup.level ? { title: current.name, sub: current.boss ? current.boss.line : current.lesson, tone: "plain" } : { title: "ছক্কা চাপো", sub: "সিঁড়িতে ওপরে, সাপে নিচে। ঠিক ১০০-তে পড়লে জিত।", tone: "plain" });
  const hurry = "চাপলে চালটা তখনই শেষ হবে";
  const who = busy ? (solo && actor === 0 ? "তোমার চাল" : `${possessive(actorName)} চাল`)
    : turnBot ? `${turnName} চালছে…` : handoff === game.turn ? `ফোনটা ${dative(turnName)} দাও` : solo ? "তোমার চাল" : `${possessive(turnName)} চাল`;
  const whoSub = busy ? hurry : turnBot ? "কম্পিউটার নিজেই চালবে" : handoff === game.turn ? `${possessive(turnName)} চাল · ছক্কা চাপো` : "ছক্কা চাপো";
  const startLabel = race ? "একই ছক্কায় খেলো" : "ছক্কা চাপো";
  const startSub = race ? (race.setup.level ? `লেভেল ${bn(race.setup.level)} · বন্ধুর ছক্কা` : "বন্ধুর ছক্কা · ১০০ ঘর") : prefs.mode === "solo" ? `লেভেল ${bn(level)} · ${levelOf(level).name}` : `${bn(prefs.seats)} জন · ১০০ ঘর`;

  // The end screen.
  let finishView: null | { kicker: string; title: string; seat: number; stars: number | null; stats: Stat[]; lines: string[]; standings: Standing[]; note: string; primary: Action; secondary: Action[] } = null;
  if (result) {
    const g = result.game, friendRace = friend && sameRace(result.card, friend.card) ? versusLine(winnerMoves(g), winnerMoves(friend.game), friend.card.names[0]) : "";
    const again: Action = { label: "আবার খেলো", run: () => { dropFriend(); start(newSeed(), setup); } };
    const same: Action = { label: "একই ছক্কায় আবার", run: () => start(g.seed, setup) };
    const menu: Action = { label: "মেনুতে ফেরো", run: () => toTitle() };
    if (setup.level) {
      const place = placeOf(g), hasNext = setup.level < LEVEL_COUNT && setup.level + 1 <= openAfter(open, setup.level);
      const next: Action = { label: "পরের লেভেল", run: () => { dropFriend(); toTitle(setup.level + 1); } };
      finishView = {
        kicker: `লেভেল ${bn(setup.level)} · ${current.name}`, title: headline(result), seat: 0, stars: starsOf(g),
        stats: [{ label: "চাল", value: g.moves[0] }, { label: "ছক্কা", value: g.sixes[0] }, { label: "সিঁড়িতে", value: g.gained[0], sign: "+", unit: "ঘর" }, { label: "সাপে", value: g.lost[0], sign: "−", unit: "ঘর" }],
        lines: [...highlights(g, 0), humanLine(result)],
        standings: g.players > 1 ? Array.from({ length: g.players }, (_, seat) => ({ seat, name: nameOf(seat, g), square: leadSquare(g, seat), note: g.home.includes(seat) ? `${ordinal(g.home.indexOf(seat) + 1)} হয়ে ঘরে` : "পথে", first: g.home[0] === seat })) : [],
        note: friendRace || (earned.opened ? `লেভেল ${bn(earned.opened)} খুলে গেছে।` : nearPar(g)) || (place > 1 ? "দ্বিতীয় তারা সবার আগে ঘরে ফিরলে।" : ""),
        primary: hasNext && place > 0 ? next : again, secondary: hasNext ? [again, same] : [same, menu],
      };
    } else if (setup.players === 1) {
      finishView = {
        kicker: "একা দৌড় · ১০০ ঘর", title: headline(result), seat: 0, stars: null,
        stats: [{ label: "চাল", value: g.moves[0] }, { label: "ছক্কা", value: g.sixes[0] }, { label: "সিঁড়িতে", value: g.gained[0], sign: "+", unit: "ঘর" }, { label: "সাপে", value: g.lost[0], sign: "−", unit: "ঘর" }],
        lines: [...highlights(g, 0), humanLine(result)], standings: [],
        note: friendRace || (earned.record === "new" ? "এই ফোনে নতুন রেকর্ড!" : earned.record === "first" ? "প্রথম দৌড়, এটাই এখন এই ফোনের সেরা।" : nearBest(g.moves[0], best) || (best !== null ? `এই ফোনে সেরা ${bn(best)} চাল।` : "")),
        primary: again, secondary: [same, menu],
      };
    } else {
      const order = Array.from({ length: g.players }, (_, seat) => seat).sort((a, b) => leadSquare(g, b) - leadSquare(g, a));
      finishView = {
        kicker: `এক ফোনে ${bn(g.players)} জন${g.pieces === 2 ? " · দুই গুটি" : ""}`, title: headline(result), seat: g.winner, stars: null,
        stats: [{ label: "মোট দান", value: g.rolls }, { label: "ছক্কা", value: g.sixes.reduce((a, b) => a + b, 0) }, { label: "সিঁড়ি", value: g.climbs.reduce((a, b) => a + b, 0) }, { label: "সাপের কামড়", value: g.bites.reduce((a, b) => a + b, 0) }],
        lines: [humanLine(result)],
        standings: order.map(seat => ({ seat, name: nameOf(seat, g), square: leadSquare(g, seat), note: `${bn(g.moves[seat])} চাল · সিঁড়ি ${bn(g.climbs[seat])} · সাপ ${bn(g.bites[seat])}`, first: seat === g.winner })),
        note: "", primary: { label: "আরেক দান", run: () => { dropFriend(); start(newSeed(), setup); } }, secondary: [menu],
      };
    }
  }
  primaryRef.current = finishView?.primary.run ?? null;

  const announce = screen === "over" && result ? `${headline(result)} ${bn(winnerMoves(game))} চালে।`
    : choosing ? `${bn(game.die)} পড়েছে। কোন গুটি চালবে? ১ বা ২ চাপো।`
    : screen === "play" && news ? `${news.title} ${news.sub}` : "";
  const seatColour = SEATS[actor].color;

  return (
    <div ref={root} className="sl" data-screen={screen} data-slow={slow || undefined} data-danger={danger && screen === "play" ? "" : undefined}
      data-world={viewSetup.level ? levelOf(viewSetup.level).world : 2} data-finale={screen === "play" && bossOf(setup) >= 0 ? "" : undefined}
      style={{ "--seat": seatColour } as CSSProperties}>
      <div className="sl-main">
      {screen !== "title" && (
        <header className="sl-hud">
          <p className="sl-badge">{setup.level ? <>লেভেল {bn(setup.level)} · <b>{current.name}</b></> : setup.players === 1 ? "একা দৌড় · ১০০ ঘর" : `সবাই মিলে · ${bn(setup.players)} জন`}</p>
          <p className="sl-count">{solo ? <>চাল <b>{bn(game.moves[0])}</b>{setup.level ? <small> / ★ {bn(current.par)}</small> : null}</> : <>দান <b>{bn(game.rolls)}</b></>}</p>
          <ol className="sl-seats" data-count={setup.players} aria-label="কে কোথায়">
            {Array.from({ length: setup.players }, (_, seat) => (
              <li key={seat} data-on={screen === "play" && actor === seat || undefined} data-home={game.home.includes(seat) || undefined} style={{ "--seat": SEATS[seat].color } as CSSProperties}>
                <Shape seat={seat} />
                <span className="sl-seat-name">{nameOf(seat, game)}</span>
                <b>{game.home.includes(seat) ? `ঘরে · ${ordinal(game.home.indexOf(seat) + 1)}` : (busy ? shownPos.current : game.pos).slice(seat * game.pieces, (seat + 1) * game.pieces).map(squareName).join(" · ")}</b>
              </li>
            ))}
          </ol>
        </header>
      )}

      <div ref={wrap} className="sl-board" style={{ "--ratio": (viewSetup.board.rows + STRIP) / viewSetup.board.cols } as CSSProperties}>
        <canvas ref={canvas} onPointerDown={boardDown} role="img"
          aria-label={`সাপলুডুর বোর্ড, ${bn(viewSetup.board.last)} ঘর।${screen === "title" ? "" : ` ${Array.from({ length: game.players }, (_, seat) => `${nameOf(seat, game)} ${game.pos.slice(seat * game.pieces, (seat + 1) * game.pieces).map(squareName).join(" ও ")}-এ`).join(", ")}।`}`} />
        {screen === "title" && <StartDie label={startLabel} sub={startSub} slow={slow} onStart={() => tap()} />}
        {finishView && result && (
          <div className="sl-cover">
            <Finish id={`${game.seed}|${setup.level}|${game.rolls}`} {...finishView} slow={slow}
              onSeeCard={() => resultRef.current?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "start" })} />
          </div>
        )}
      </div>

      {screen === "title" && (
        <StartSetup prefs={{ ...prefs, level }} open={open} visit={visit} stars={levels.stars} names={names} friend={friend} friendCanvas={friendCanvas}
          onMode={mode => { dropFriend(); setPrefs({ mode }); }} onLevel={id => { dropFriend(); setPrefs({ level: Math.max(1, Math.min(LEVEL_COUNT, id)) }); }} onSheet={() => setSheet(true)}
          onSeats={seats => { dropFriend(); setPrefs({ seats, bots: prefs.bots & ((1 << seats) - 2) }); }} onBot={seat => { dropFriend(); setPrefs({ bots: prefs.bots ^ (1 << seat) }); }}
          onTwo={() => { dropFriend(); setPrefs({ two: !prefs.two }); }} onName={setName} />
      )}

      {screen === "play" && (choosing ? (
        <div className="sl-choose" role="group" aria-labelledby="sl-choose-title">
          <p id="sl-choose-title">{solo ? "" : `${turnName}: `}{bn(game.die)} পড়েছে। কোন গুটি চালবে?</p>
          {choices.map(option => {
            const tone = option.jump < 0 ? "plain" : option.end > option.to ? "up" : "down";
            return (
              <button key={option.piece} type="button" className="sl-pick" data-tone={tone} data-recommended={option.piece === recommended || undefined} onClick={press(() => pickPiece(option.piece))}>
                <span className="sl-pick-top"><kbd>{bn(option.piece + 1)}</kbd><Shape seat={game.turn} size={20} /><b>{bn(option.piece + 1)} নম্বর গুটি</b></span>
                <span className="sl-pick-move">{squareName(option.at)} → {bn(option.to)}</span>
                <em>{tone === "up" ? `▲ সিঁড়ি! ${bn(option.end)}-তে` : tone === "down" ? `▼ সাপ! ${bn(option.end)}-তে` : option.to === setup.board.last ? "ঘরে!" : "সোজা হাঁটা"}</em>
                {option.piece === recommended && <small className="sl-rec">সুপারিশ</small>}
              </button>
            );
          })}
        </div>
      ) : (
        <div ref={tray} className="sl-tray" data-bot={(busy ? actorBot : turnBot) || undefined} data-handoff={handoff === game.turn || undefined}>
          <button type="button" className="sl-roll" onPointerDown={dieDown} onClick={dieClick} disabled={turnBot && !busy}
            aria-label={`${who}। ${turnBot ? "কম্পিউটার নিজেই চালবে" : "ছক্কা চাপো"}${face ? `। শেষবার ${bn(face)} পড়েছিল` : ""}`}>
            <Die value={face} spin={spin} slow={slow} />
          </button>
          <div className="sl-turn">
            <p className="sl-who">{who}{whoSub && <small>{whoSub}</small>}</p>
            <div className="sl-news" data-tone={shown.tone} key={`${shown.title}|${shown.sub}`}>
              <p className="sl-news-title">{shown.tone === "up" ? "▲ " : shown.tone === "down" ? "▼ " : ""}{shown.title}</p>
              <p className="sl-news-sub">{shown.sub}</p>
            </div>
          </div>
        </div>
      ))}
      <p className="sl-sr" aria-live="polite">{announce}</p>
      {sheet && (
        <LevelSheet stars={levels.stars} open={open} visit={visit} current={level} recommended={Math.min(open, LEVEL_COUNT)}
          onPick={id => { dropFriend(); setPrefs({ level: id, mode: "solo" }); toTitle(); }} onClose={() => setSheet(false)} />
      )}
      </div>

      {result && (
        <section ref={resultRef} className="sl-result" id="result" aria-labelledby="sl-result-title">
          <h2 id="sl-result-title">{humanLine(result)}</h2>
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
            {friend && <p className="sl-friend-note">{friendBanner(friend)}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

