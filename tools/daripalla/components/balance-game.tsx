"use client";
// IP: what we avoided — the pan balance is a public classroom model for "=", but no textbook (NCTB) pictures or sums, no Sisimpur/Meena or TV/app characters or look-alikes, no real-world weight claims (no কেজি/গ্রাম), and no "brain training" promises; all art is our own code.

import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, sfx, shake, tone, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  add, addToday, bn, cardLines, choose, EMPTY_TODAY, endLine, feedback, glows, hint, LEVEL_COUNT, newRound, nextPuzzle, praiseLine, prompt, remove,
  roundStars, settled, specOf, springStep, tiltFor, totals, type Outcome, type Piece, type Round, type Today,
} from "../lib/game";
import { Ghost, Stand, Strings } from "./art";
import { OgCard } from "./og-card";
import { PieceView, pieceName } from "./pieces";

const TOOL = "daripalla";
const PIVOT = 40;

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

/** A brass clink for a level pan, and a quieter second one as it wobbles. */
const clink = () => { tone(2093, 0.45, 0.06, "triangle"); tone(3322, 0.3, 0.03, "sine"); tone(2093, 0.35, 0.03, "triangle", 0.32); };
const thunk = () => { tone(190, 0.12, 0.14, "sine", 0, 120); tone(900, 0.03, 0.03, "square"); };
const soft = () => tone(330, 0.14, 0.06, "sine");

/** `#og` (the preview-image script only) shows a fixed finished card in place of the game: no stars, no play time. */
export function BalanceGame() {
  const [og, setOg] = useState(false);
  useEffect(() => { if (location.hash === "#og") setOg(true); }, []);
  return og ? <OgCard onClose={() => { history.replaceState(null, "", location.pathname); setOg(false); }} /> : <Game />;
}

function Game() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [round, setRound] = useState<Round>(() => newRound(1, 0, 1));
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>(EMPTY_TODAY);
  const [line, setLine] = useState("");
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const [moving, setMoving] = useState(true);
  const card = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null), beam = useRef<HTMLDivElement>(null), leftPan = useRef<HTMLDivElement>(null), rightPan = useRef<HTMLDivElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const sim = useRef({ angle: 0, speed: 0 });
  const started = useRef(false);

  const { puzzle } = round, target = tiltFor(round), spec = specOf(round.level);
  const targetRef = useRef(target);
  targetRef.current = target;

  // Start at the first level without stars (a fresh random seed only after hydration).
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const first = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(level => !levels.stars[level]) ?? levels.unlocked;
    setRound(newRound(first));
  }, [levels.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // The beam: a damped spring toward the tilt, so a level pan settles with a wobble. Slow mode jumps straight there.
  useEffect(() => { setMoving(true); }, [target, slow]);
  const step = useCallback((dt: number) => {
    if (slow) { sim.current = { angle: targetRef.current, speed: 0 }; }
    else sim.current = springStep(sim.current, targetRef.current, dt);
    if (settled(sim.current, targetRef.current)) { sim.current = { angle: targetRef.current, speed: 0 }; setMoving(false); }
  }, [slow]);
  const draw = useCallback(() => {
    const box = stage.current;
    if (!box || !beam.current || !leftPan.current || !rightPan.current) return;
    const width = box.clientWidth, panWidth = Math.min(132, width * 0.39), arm = Math.min(width / 2 - panWidth / 2 - 2, 112);
    const radians = sim.current.angle * Math.PI / 180, dx = arm * Math.cos(radians), dy = arm * Math.sin(radians), cx = width / 2;
    beam.current.style.width = `${2 * arm + 16}px`;
    beam.current.style.transform = `translate(${cx - arm - 8}px, ${PIVOT - 5}px) rotate(${sim.current.angle}deg)`;
    leftPan.current.style.width = rightPan.current.style.width = `${panWidth}px`;
    leftPan.current.style.transform = `translate(${cx - dx - panWidth / 2}px, ${PIVOT - dy}px)`;
    rightPan.current.style.transform = `translate(${cx + dx - panWidth / 2}px, ${PIVOT + dy}px)`;
  }, []);
  useGameLoop(step, draw, moving);
  useEffect(() => { addEventListener("resize", draw); return () => removeEventListener("resize", draw); }, [draw]);

  // The ghost finger comes back when the child has waited a while.
  useEffect(() => {
    setIdle(false);
    if (phase !== "play" || round.stage === "done") return;
    const timer = setTimeout(() => setIdle(true), 8000);
    return () => clearTimeout(timer);
  }, [round, phase]);

  // The last puzzle of a round rests a moment on its level pan, then the calm end screen. The next level never starts by itself.
  useEffect(() => {
    if (round.stage !== "done" || phase !== "play" || nextPuzzle(round)) return;
    const timer = setTimeout(() => {
      const earned = roundStars(round);
      levels.record(round.level, earned);
      setStars(earned);
      sfx.win();
      if (round.level === 3 || round.level === LEVEL_COUNT) confetti();
      atBreak();
      setPhase("end");
    }, slow ? 900 : 1800);
    return () => clearTimeout(timer);
  }, [round, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample).then(() => { if (live && card.current) drawCard(card.current, today, location.host); });
    return () => { live = false; };
  }, [showing, today]);

  function restart(level = round.level) {
    setRound(newRound(level, round.pace));
    setLine("");
    setPhase("play");
  }

  function apply(next: { round: Round; outcome: Outcome }, element: HTMLElement | null, value?: number) {
    const { outcome } = next;
    if (outcome === "ignore") return;
    if (outcome === "full") { soft(); shake(element); shake(tray.current); }
    else if (outcome === "level") { thunk(); clink(); }
    else if (outcome === "right") { sfx.good(); clink(); }
    else if (outcome === "again") { soft(); shake(element); }
    else if (outcome === "over") { thunk(); }
    else if (outcome === "removed") sfx.pick();
    else thunk();
    if (next.round.stage === "done") setToday(before => addToday(before, next.round));
    setLine(feedback(next.round, outcome, value));
    setRound(next.round);
  }

  function goNext() {
    const next = nextPuzzle(round);
    if (!next) return;
    sfx.tap();
    setLine("");
    setRound(next);
  }

  const help = hint(round);
  const moved = round.added.length > 0 || round.tries > 0 || round.guess !== null;
  const ghostOn = phase === "play" && (idle || (round.index === 0 && !moved) || glows(round));
  const ghost = (where: "tray" | "pan" | "choice", at: number) => ghostOn && help && where in help && (help as Record<string, number>)[where] === at ? <Ghost /> : null;
  const { left, right } = totals(round);
  const sign = puzzle.kind === "guess" || left === right ? "=" : left > right ? ">" : "<";
  const level = round.stage === "done" || (round.stage === "ask" && puzzle.kind === "find");
  const reveal = (piece: Piece): boolean | number => piece.kind === "star" ? (round.guess ?? false) : round.stage === "done";
  const rightPieces = [...puzzle.start, ...round.added];
  const term = (piece: Piece, key: string) => <span className="dp-term" key={key}>{piece.kind === "fruit" && piece.hidden ? <span className="dp-term-art"><PieceView piece={piece} reveal={round.stage === "done"} /></span> : piece.kind === "star" ? "★" : bn(piece.value)}</span>;
  const side = (pieces: Piece[], prefix: string) => pieces.length ? pieces.flatMap((piece, index) => index ? [<span key={`${prefix}p${index}`} className="dp-op">+</span>, term(piece, `${prefix}${index}`)] : [term(piece, `${prefix}${index}`)]) : [<span key={`${prefix}e`} className="dp-term dp-empty">০</span>];

  return (
    <div className="dp" data-slow={slow || undefined}>
      <div className="dp-play">
        <div className="dp-top">
          <p className="dp-level"><b>ধাপ {bn(round.level)}</b> <span>{spec.label}</span></p>
          <ol className="dp-dots" aria-label={`${bn(spec.puzzles)}টার ${bn(round.index + 1)} নম্বর পাল্লা`}>
            {Array.from({ length: spec.puzzles }, (_, index) => <li key={index} className={index < round.index || (index === round.index && round.stage === "done") ? "done" : index === round.index ? "now" : ""} />)}
          </ol>
        </div>
        <p className="dp-prompt">{prompt(round)}</p>

        <div className={`dp-scale${level ? " is-level" : ""}`} ref={stage}>
          <Stand />
          <div className="dp-beam" ref={beam} aria-hidden="true"><span className="dp-needle" /></div>
          <div className="dp-pan" ref={leftPan} role="group" aria-label={`বাম পাল্লা: ${puzzle.left.map(piece => pieceName(piece, reveal(piece))).join(", ")}`}>
            <Strings />
            <div className="dp-load">{puzzle.left.map((piece, index) => <span className={`dp-item fixed${puzzle.left.length === 1 ? " big" : puzzle.left.length === 2 ? " half" : ""}`} key={index}><PieceView piece={piece} reveal={reveal(piece)} /></span>)}</div>
          </div>
          <div className="dp-pan" ref={rightPan} role="group" aria-label="ডান পাল্লা">
            <Strings />
            <div className="dp-load">
              {puzzle.start.map((piece, index) => <span className={`dp-item fixed${piece.kind === "weight" ? " big" : ""}`} key={`s${index}`} aria-label={pieceName(piece)}><PieceView piece={piece} /></span>)}
              {round.added.map((piece, index) => <span className="dp-item added" key={`a${index}`}><PieceView piece={piece} reveal /></span>)}
            </div>
            {/* The whole pan is one big target (well over 72px) that lifts the piece put on last, so small pieces never steal each other's taps. */}
            {round.stage === "balance" && round.added.length > 0 && <button type="button" className="dp-lift" aria-label={`${pieceName(round.added[round.added.length - 1], true)}: তুলে নাও`} {...press(element => apply(remove(round, round.added.length - 1), element))}>
              {ghost("pan", round.added.length - 1)}
            </button>}
          </div>
        </div>

        <p className={`dp-equation${left === right && round.stage !== "balance" ? " is-level" : ""}`} aria-label={`সমীকরণ: ${puzzle.left.map(piece => pieceName(piece, reveal(piece))).join(" যোগ ")} ${sign === "=" ? "সমান" : sign === ">" ? "বড়" : "ছোট"} ${rightPieces.map(piece => pieceName(piece, true)).join(" যোগ ") || "শূন্য"}`}>
          {side(puzzle.left, "l")}<span className="dp-sign">{sign}</span>{side(rightPieces, "r")}
        </p>
        <p className="dp-line" aria-live="polite">{line}</p>

        <div className="dp-tray" ref={tray} style={{ gridTemplateColumns: `repeat(${round.stage === "balance" ? puzzle.tray.length : round.stage === "ask" ? puzzle.choices.length : 1}, minmax(0, 1fr))` }}>
          {round.stage === "balance" && puzzle.tray.map((piece, index) => <button type="button" key={index} className="dp-take" aria-label={`${pieceName(piece, true)}: ডান পাল্লায় দাও`} {...press(element => apply(add(round, index), element))}>
            <PieceView piece={piece} reveal />{ghost("tray", index)}
          </button>)}
          {round.stage === "ask" && puzzle.choices.map(value => <button type="button" key={value} className={`dp-choice${glows(round) && value === puzzle.answer ? " is-glow" : ""}${round.guess === value && puzzle.kind === "guess" ? " is-tried" : ""}`} {...press(element => apply(choose(round, value), element, value))}>
            {bn(value)}{ghost("choice", value)}
          </button>)}
          {round.stage === "done" && nextPuzzle(round) && <button type="button" className="kit-primary dp-next" onClick={goNext}>পরের পাল্লা</button>}
        </div>

        <div className="dp-controls">
          <button type="button" className="dp-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
          <SoundToggle compact />
        </div>

        {phase === "end" && (
          <div className="dp-over" role="status">
            <StarReveal count={stars} />
            <p className="dp-end-line">{endLine(round)}</p>
            {praiseLine(round) && <p className="dp-end-note">{praiseLine(round)}</p>}
            <div className="dp-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.level < LEVEL_COUNT && <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের ধাপ: {specOf(round.level + 1).label}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="dp-over">
            <p className="dp-end-line">দোকান বন্ধ, পাল্লা সোজা হয়ে ঝুলছে।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLines(today).join("। ")} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="dp-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} noun="ধাপ" current={round.level} unlocked={levels.unlocked} stars={levels.stars} onPick={level => restart(level)} />
        <p>{Array.from({ length: LEVEL_COUNT }, (_, index) => `${bn(index + 1)}: ${specOf(index + 1).label}`).join(" · ")}। তারা শুধু এই ফোনে মনে রাখে কোন ধাপ খেলা হলো।</p>
      </details>
      <div className="dp-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="দাঁড়িপাল্লা" text="দোকানের দাঁড়িপাল্লায় বাটখারা চাপিয়ে দুই দিক সমান করার খেলা। ৬–১১ বছর, ফ্রি।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
