"use client";
// কাটাকুটি on a 3×3 patch of the quilt: you sew red cross-stitches (✕), the bot blue running-stitch rings (○).
import { useEffect, useRef, useState } from "react";
import { buzz, confetti, hiss, newSeed, sfx, shake, tone, totalStars, useLevels } from "../../../shared/game-kit";
import { SoundToggle, Stars, StarReveal } from "../../../shared/game-ui";
import { borderPath, palette } from "../lib/art";
import { BOTS, botMove, botName, mark, newRound, outcome, starsOf, threeStarGoal, type Bot, type Round } from "../lib/katakuti";
import { bn } from "../lib/link";

const TOOL = "chhok-jora-katakuti";
const SIZE = 300, CELL = 100;
const COLORS = ["#c23b2a", "#2457a6", "#f3c548", "#fbf3e6", "#3d8a3c"];
/** A cross-stitch: two quick needle pulls. */
const crossSound = () => { hiss(0.05, 0.08, 2800, "bandpass"); hiss(0.05, 0.08, 3400, "bandpass", 0.07); tone(1500, 0.02, 0.035, "square", 0.07); };
/** The bot's ring: one longer, softer pull. */
const ringSound = () => { hiss(0.14, 0.06, 1800, "bandpass"); tone(900, 0.03, 0.03, "triangle", 0.1); };

const cellLabel = (cell: number) => `${["ওপরের", "মাঝের", "নিচের"][Math.floor(cell / 3)]} সারির ${["বাঁ", "মাঝের", "ডান"][cell % 3]} ঘর`;

export function KatakutiGame({ slow, setSlow }: { slow: boolean; setSlow: (next: boolean) => void }) {
  const levels = useLevels(TOOL, BOTS.length);
  const [round, setRound] = useState<Round>(() => newRound(1, 1));
  const [tally, setTally] = useState<[number, number, number]>([0, 0, 0]);
  const [streak, setStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [beforeStars, setBeforeStars] = useState(0);
  const roundRef = useRef(round);
  roundRef.current = round;
  const finished = useRef<Round | null>(null);
  const opened = useRef(false);
  const timers = useRef<number[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { bot } = round;
  const end = outcome(round.cells);
  const botTurn = !end.over && round.turn === 1;
  const total = totalStars(levels.stars);

  const later = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, ms)); };
  function fresh(nextBot: Bot, first?: 0 | 1) {
    timers.current.forEach(clearTimeout); timers.current = [];
    setRound(newRound(newSeed(), nextBot, first ?? 0));
    setEarned(0);
  }
  function chooseBot(next: Bot) {
    if (next === bot && !round.moves.length) return;
    sfx.tap();
    setStreak(0);
    setTally([0, 0, 0]);
    fresh(next);
  }

  // After the stars are read: start against the first bot short of three stars.
  useEffect(() => {
    if (!levels.loaded || opened.current) return;
    opened.current = true;
    fresh(BOTS.find(level => (levels.stars[level] ?? 0) < 3) ?? 3);
  }, [levels.loaded]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // The bot answers after a short beat, so its stitch can be seen.
  useEffect(() => {
    if (!botTurn) return;
    const timer = window.setTimeout(() => {
      const current = roundRef.current;
      const next = current.turn === 1 && !outcome(current.cells).over ? mark(current, botMove(current)) : null;
      if (next) { ringSound(); setRound(next); }
    }, slow ? 900 : 480);
    return () => window.clearTimeout(timer);
  }, [round, botTurn, slow]);

  // The end of a round: tally, streak, stars once, then the sound that fits.
  useEffect(() => {
    if (!end.over || finished.current === round) return;
    finished.current = round;
    const stars = starsOf(bot, end.winner);
    const had = levels.stars[bot] ?? 0;
    setBeforeStars(had);
    setEarned(stars);
    setTally(current => { const next: [number, number, number] = [...current]; next[end.winner === null ? 2 : end.winner]++; return next; });
    if (stars) levels.record(bot, stars);
    if (end.winner === 0) {
      const run = streak + 1;
      setStreak(run);
      sfx.combo(run - 1);
      buzz([15, 30, 15]);
    } else if (end.winner === 1) setStreak(0);
    const cheer = 300 + 260 * (stars + 1);
    if (end.winner === 1) { later(250, sfx.lose); shake(boardRef.current); }
    else if (stars === 3 && had < 3) later(cheer, () => { sfx.levelUp(); confetti({ colors: COLORS }); });
    else if (end.winner === 0) later(cheer, () => { sfx.win(); confetti({ count: 50, colors: COLORS }); });
    else later(cheer, sfx.good);
  }, [round]);

  function play(cell: number) {
    if (botTurn || end.over) return;
    const next = mark(round, cell);
    if (!next) { sfx.wrong(); shake(cellRefs.current[cell]); return; }
    crossSound();
    buzz(8);
    setRound(next);
  }

  // The next round: the bot opens every other one.
  const again = () => fresh(bot, round.first === 0 ? 1 : 0);
  const nextBot = bot < 3 ? (bot + 1) as Bot : null;

  function status() {
    if (end.over) return "";
    if (botTurn) return `${botName(bot)} বট ভাবছে…`;
    if (!round.moves.length) return round.first === 0 ? "তুমি ✕, বট ○। যেকোনো ঘরে চাপো। পাশাপাশি, ওপর-নিচ বা কোনাকুনি তিনটা হলেই জয়।" : "তোমার পালা। এক সারিতে তিনটা ✕ বসাও।";
    return "তোমার পালা।";
  }
  const verdict = end.winner === 0 ? "জিতে গেছ!" : end.winner === 1 ? `এবার ${botName(bot)} বট জিতল।` : "সমান সমান!";
  const near = !end.over ? ""
    : earned === 3 ? (bot === 3 ? "কঠিন বট হারে না। সমান করাই তার সাথে জেতা।" : beforeStars < 3 ? `${botName(bot)} বট পার। পুরো ৩ তারা।` : "")
    : end.winner === 1 ? threeStarGoal(bot)
    : `${threeStarGoal(bot)} এবার ${bn(earned)}টা।`;

  return (
    <>
      <div className="cj-bots" role="group" aria-label="কোন বটের সাথে">
        {BOTS.map(level => (
          <button key={level} type="button" aria-pressed={bot === level} onClick={() => chooseBot(level)}>
            <span>{botName(level)}</span>
            <Stars count={levels.stars[level] ?? 0} />
          </button>
        ))}
      </div>

      <div className="cj-ktally" aria-label="এই বটের সাথে আজকের হিসাব">
        <span><b>{bn(tally[0])}</b> তুমি</span>
        <span><b>{bn(tally[1])}</b> বট</span>
        <span><b>{bn(tally[2])}</b> সমান</span>
        <span className="cj-ktotal">★ {bn(total)}/{bn(BOTS.length * 3)}</span>
      </div>

      <div className="cj-kboard" ref={boardRef} data-over={end.over}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <defs>
            <pattern id="cj-kripple" width="24" height="16" patternUnits="userSpaceOnUse">
              <path d="M2 4h8M14 4h8M8 12h8M20 12h4M0 12h4" stroke={palette.ripple} strokeWidth="1.6" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width={SIZE} height={SIZE} rx="14" fill={palette.cloth} />
          <rect width={SIZE} height={SIZE} rx="14" fill="url(#cj-kripple)" />
          <path d={borderPath(SIZE, 10, 20)} fill="none" stroke={palette.border} strokeWidth="3" strokeDasharray="8 6" strokeLinecap="round" />
          {[1, 2].map(line => <g key={line} stroke={palette.thread} strokeWidth="5" strokeDasharray="10 9" strokeLinecap="round">
            <line x1={CELL * line} y1="22" x2={CELL * line} y2={SIZE - 22} />
            <line x1="22" y1={CELL * line} x2={SIZE - 22} y2={CELL * line} />
          </g>)}
          {round.cells.map((who, cell) => {
            if (who < 0) return null;
            const x = (cell % 3) * CELL + CELL / 2, y = Math.floor(cell / 3) * CELL + CELL / 2;
            return <g key={cell} transform={`translate(${x} ${y})`} className="cj-kmark">
              {who === 0
                ? <g stroke={palette.players[0]} strokeWidth="9" strokeLinecap="round" strokeDasharray="13 6"><line x1="-26" y1="-26" x2="26" y2="26" /><line x1="26" y1="-26" x2="-26" y2="26" /></g>
                : <circle r="27" fill="none" stroke={palette.players[1]} strokeWidth="8" strokeDasharray="11 7" strokeLinecap="round" />}
            </g>;
          })}
          {end.line && (() => {
            const [a, , c] = end.line, at = (cell: number) => [(cell % 3) * CELL + CELL / 2, Math.floor(cell / 3) * CELL + CELL / 2];
            const [x1, y1] = at(a), [x2, y2] = at(c);
            return <line className="cj-kwin" x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.heart} strokeWidth="12" strokeLinecap="round" strokeDasharray="16 8" opacity=".9" />;
          })()}
        </svg>
        <div className="cj-kcells">
          {round.cells.map((who, cell) => (
            <button key={cell} ref={element => { cellRefs.current[cell] = element; }} type="button" disabled={end.over || botTurn}
              aria-label={`${cellLabel(cell)}${who === 0 ? ", তোমার ✕" : who === 1 ? ", বটের ○" : ", খালি"}`} onClick={() => play(cell)} />
          ))}
        </div>
      </div>

      {end.over ? (
        <div className="cj-over cj-kover" role="status">
          <p className="cj-over-score">{verdict}</p>
          {earned > 0 && <StarReveal count={earned} />}
          <p className="cj-over-verdict"><span>{near}</span>{streak > 1 && end.winner === 0 && <span> টানা {bn(streak)} দান জিতলে।</span>}</p>
        </div>
      ) : (
        <p className="cj-status" role="status" aria-live="polite">{status()}</p>
      )}

      <div className="cj-controls cj-kcontrols">
        {end.over ? <>
          {earned === 3 && nextBot && beforeStars < 3
            ? <button type="button" className="kit-primary cj-again" onClick={() => chooseBot(nextBot)}>এবার {botName(nextBot)} বট</button>
            : <button type="button" className="kit-primary cj-again" onClick={again}>আরেক দান</button>}
          {earned === 3 && nextBot && beforeStars < 3
            ? <button type="button" className="cj-tool" onClick={again}>আরেক দান</button>
            : <SoundToggle compact className="cj-sound" />}
        </> : <>
          <button type="button" className="cj-tool" onClick={() => fresh(bot)} disabled={!round.moves.length}>নতুন দান</button>
          <button type="button" className="cj-tool cj-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact className="cj-sound" />
        </>}
      </div>
    </>
  );
}
