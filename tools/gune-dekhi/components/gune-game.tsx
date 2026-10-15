"use client";
// IP: what we avoided — no Sisimpur, Meena or any TV/app counting characters or look-alikes, no "Numberblocks"-style number creatures, no NCTB pictures; fish, mangoes, dice and ponds are our own code art.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  addToday, answer, answerOf, bn, cardLines, endLine, glows, ITEMS, lined, levelOf, LEVEL_COUNT, MODES, newRound, nextItem, NUMBER_WORDS, openSteps,
  praiseLine, roundStars, specOf, tapFish, type Mode, type Round, type Today,
} from "../lib/game";
import { DotRow, Fish, Ghost, ModeIcon, Pattern } from "./art";

const TOOL = "gune-dekhi";

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

/** A soft note that climbs with each fish counted. */
const countNote = (count: number) => tone(330 * 2 ** (count / 12), 0.18, 0.08, "triangle");

const QUESTION = { count: "প্রতিটা মাছে একবার করে চাপ দাও।", guni: "কয়টা মাছ?", nojor: "কয়টা দেখলে?", beshi: "কোন পুকুরে মাছ বেশি?", koto: "কয়টা মাছ বেশি?" };
const HINT = { guni: "শেষ মাছটার গায়ে যে নম্বর, সেটাই মোট।", nojor: "আরেকবার দেখে নাও।", beshi: "মাছগুলো জোড়ায় জোড়ায় সাজালাম। কোন দিকে বেশি?", koto: "যে মাছের জোড়া নেই, সেগুলো গোনো।" };

export function GuneGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [round, setRound] = useState<Round>(() => newRound(1, false, 0, 1));
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>({ fish: 0, seen: 0, ponds: 0 });
  const [played, setPlayed] = useState<Mode[]>([]);
  const [message, setMessage] = useState("");
  const [idle, setIdle] = useState(false);
  const [flash, setFlash] = useState(0);
  const [looking, setLooking] = useState(false);
  const [showing, setShowing] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);

  const spec = specOf(round.level), item = round.item, mode = spec.mode;
  const startStep = (of: Mode) => { const open = openSteps(levels.stars, of); return [1, 2, 3].find(step => step <= open && !levels.stars[levelOf(of, step)]) ?? open; };

  // Start where the child left off in the counting mode (a fresh random seed only after hydration).
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    setRound(newRound(levelOf("guni", startStep("guni"))));
  }, [levels.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // The ghost finger comes back when the child has waited a while.
  useEffect(() => {
    setIdle(false);
    if (phase !== "play") return;
    const timer = setTimeout(() => setIdle(true), 7000);
    return () => clearTimeout(timer);
  }, [round, phase]);

  // এক নজরে: the group shows for 1.5 seconds, once per item and again on request. No other timer anywhere.
  useEffect(() => {
    if (item.kind !== "nojor" || phase !== "play") return;
    setLooking(true);
    const timer = setTimeout(() => setLooking(false), 1500);
    return () => clearTimeout(timer);
  }, [item, flash, phase]);

  // A right answer rests on screen for a moment, then the next pond comes. The round itself never moves on alone.
  useEffect(() => {
    if (round.stage !== "done" || phase !== "play") return;
    const timer = setTimeout(() => {
      const next = nextItem(round);
      if (next) { setRound(next); setMessage(""); return; }
      const earned = roundStars(round.firstTry);
      levels.record(round.level, earned);
      setStars(earned);
      setToday(before => addToday(before, round));
      sfx.win();
      if (spec.step === 3) confetti();
      atBreak();
      setPhase("end");
    }, 1100);
    return () => clearTimeout(timer);
  }, [round, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample).then(() => { if (live && card.current) drawCard(card.current, today, location.host); });
    return () => { live = false; };
  }, [showing, today]);

  function restart(level = round.level) {
    // The quiet ease carries over to the next round until five first-try answers lift it.
    setRound(newRound(level, round.eased, round.rightRun));
    setMessage(""); setPhase("play");
  }

  function onFish(fish: number, element: HTMLElement) {
    const next = tapFish(round, fish);
    if (!next) { sfx.tap(); shake(element); return; }
    countNote(next.counted.length);
    speak(NUMBER_WORDS[next.counted.length]);
    setRound(next);
  }

  function onAnswer(value: number, element: HTMLElement) {
    const { round: next, outcome } = answer(round, value);
    if (outcome === "ignore") return;
    if (outcome === "again") {
      tone(330, 0.14, 0.06, "sine"); shake(element);
      setMessage(HINT[round.stage === "koto" ? "koto" : mode]);
      if (mode === "nojor") setFlash(count => count + 1);
    } else {
      sfx.good(); setMessage("");
      if (item.kind !== "beshi" || round.stage === "koto") speak(NUMBER_WORDS[answerOf(round)]);
      if (next.stage === "done" && !played.includes(mode)) setPlayed([...played, mode]);
    }
    setRound(next);
  }

  // The ghost finger: the first count of the day, the first answer in each mode, an idle wait, or after two tries.
  const firstTime = !played.includes(mode) && round.index === 0 && round.tries === 0;
  const nextFish = item.kind === "guni" && round.stage === "count" ? Array.from({ length: item.n }, (_, index) => index).find(index => !round.counted.includes(index)) : undefined;
  const ghostFish = nextFish !== undefined && (firstTime || idle) ? nextFish : null;
  const ghostAnswer = round.stage !== "count" && round.stage !== "done" && (glows(round) || (firstTime && item.kind !== "guni") || (idle && round.tries > 0)) ? answerOf(round) : null;
  const question = round.stage === "count" ? QUESTION.count : round.stage === "koto" || (round.stage === "done" && item.kind === "beshi" && item.koto) ? QUESTION.koto : QUESTION[mode];

  function tiles(values: number[], pictures = false) {
    return <div className="gd-tiles">
      {values.map(value => {
        const glow = glows(round) && value === answerOf(round), right = round.stage === "done" && value === answerOf(round);
        return <button type="button" key={value} className={`gd-tile${glow ? " is-glow" : ""}${right ? " is-right" : ""}`} aria-label={NUMBER_WORDS[value]} {...press(element => onAnswer(value, element))}>
          {pictures ? <DotRow n={value} /> : <b>{bn(value)}</b>}
          {ghostAnswer === value && <Ghost />}
        </button>;
      })}
    </div>;
  }

  function pond(side: 0 | 1) {
    if (item.kind !== "beshi") return null;
    const count = item.counts[side], other = item.counts[1 - side], more = count > other;
    const line = round.tries > 0 || round.stage === "koto" || (round.stage === "done" && Boolean(item.koto));
    const spots = line ? lined(count) : item.spots[side];
    const scale = item.bigFewer ? (more ? 0.72 : 1.2) : 0.9;
    const glow = round.stage === "pick" && glows(round) && more;
    return <button type="button" className={`gd-pond gd-small${glow ? " is-glow" : ""}${round.stage !== "pick" && more ? " is-right" : ""}`} aria-label={`${side ? "ডানের" : "বাঁয়ের"} পুকুর`}
      style={{ "--fish": line ? "30%" : `${(count <= 6 ? 50 : 33) * scale}%` } as CSSProperties} {...press(element => { if (round.stage === "pick") onAnswer(side, element); })}>
      {spots.map((spot, index) => <span key={index} className={`gd-swim${line && index >= other ? " is-extra" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%`, animationDelay: `${index * 50}ms` }}>
        <Fish tint={spot.tint} flip={spot.flip} />
      </span>)}
      {ghostAnswer === side && <Ghost />}
    </button>;
  }

  return (
    <div className="gd" data-slow={slow || undefined}>
      <div className="gd-modes" aria-label="খেলা বেছে নাও">
        {MODES.map(each => <button type="button" key={each.id} aria-pressed={each.id === mode}
          {...press(() => { if (each.id === mode && phase === "play") return; sfx.tap(); restart(levelOf(each.id, startStep(each.id))); })}>
          <ModeIcon mode={each.id} /><span>{each.name}</span>
        </button>)}
      </div>

      <div className="gd-play">
        <div className="gd-top">
          <p className="gd-level"><b>ধাপ {bn(spec.step)}</b> <span>{spec.label}</span></p>
          <ol className="gd-dots" aria-label={`${bn(ITEMS)}টার ${bn(round.index + 1)} নম্বর`}>
            {Array.from({ length: ITEMS }, (_, index) => <li key={index} className={index < round.index || (index === round.index && round.stage === "done") ? "done" : index === round.index ? "now" : ""} />)}
          </ol>
          <button type="button" className="gd-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
          <SoundToggle compact />
        </div>
        <p className="gd-q">{question} <SpeakButton text={question} /></p>

        {item.kind === "guni" && <>
          <div className={`gd-pond gd-count${round.stage === "count" ? "" : " is-counted"}`} key={`${round.seed}-${round.index}`}
            style={{ "--cols": item.grid[0], "--rows": item.grid[1] } as CSSProperties}>
            {item.spots.map((spot, index) => {
              const order = round.counted.indexOf(index), last = order === item.n - 1;
              return <button type="button" key={index} className={`gd-swim gd-fish${order >= 0 ? " is-on" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%`, animationDelay: `${index * 50}ms` }}
                aria-label={order >= 0 ? `মাছ, ${NUMBER_WORDS[order + 1]}` : "মাছ, এখনো গোনা হয়নি"} {...press(element => onFish(index, element))}>
                <Fish tint={spot.tint} flip={spot.flip} />
                {order >= 0 && <b className={`gd-badge${last && round.stage === "pick" ? " is-last" : ""}`} aria-hidden="true">{bn(order + 1)}</b>}
                {ghostFish === index && <Ghost />}
              </button>;
            })}
          </div>
          {round.stage !== "count" && tiles(item.choices)}
        </>}

        {item.kind === "nojor" && <>
          <div className="gd-look" key={`${round.seed}-${round.index}`}>
            {looking || round.stage === "done"
              ? item.parts.map((part, index) => <Pattern key={index} n={part} look={item.look} />)
              : <span className="gd-cover" aria-hidden="true">?</span>}
          </div>
          <button type="button" className="kit-secondary gd-again" disabled={looking || round.stage === "done"} {...press(() => { if (looking || round.stage === "done") return; sfx.whoosh(); setFlash(count => count + 1); })}>আবার দেখাও</button>
          {tiles(item.choices, item.pictures)}
        </>}

        {item.kind === "beshi" && <>
          <div className="gd-ponds" key={`${round.seed}-${round.index}`}>{pond(0)}{pond(1)}</div>
          {item.koto && (round.stage === "koto" || round.stage === "done") && tiles(item.koto)}
        </>}

        <p className="gd-msg" aria-live="polite">{message}</p>

        {phase === "end" && (
          <div className="gd-over" role="status">
            <StarReveal count={stars} />
            <p className="gd-end-line">{endLine(round)}</p>
            {praiseLine(round) && <p className="gd-end-note">{praiseLine(round)}</p>}
            <div className="gd-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {spec.step < 3 && <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের ধাপ: {specOf(round.level + 1).label}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="gd-over">
            <p className="gd-end-line">মাছগুলো পুকুরেই রইল।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLines(today).join("। ")} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="gd-drawer">
        <summary>{MODES.find(each => each.id === mode)!.name}: সব ধাপ</summary>
        <LevelGrid count={3} noun="ধাপ" current={spec.step} unlocked={openSteps(levels.stars, mode)}
          stars={Object.fromEntries([1, 2, 3].filter(step => levels.stars[levelOf(mode, step)]).map(step => [step, levels.stars[levelOf(mode, step)]]))}
          onPick={step => restart(levelOf(mode, step))} />
        <p>{[1, 2, 3].map(step => `ধাপ ${bn(step)}: ${specOf(levelOf(mode, step)).label}`).join(" · ")}। তারা শুধু এই ফোনে মনে রাখে কোন ধাপ খেলা হলো।</p>
      </details>
      <div className="gd-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="গুনে দেখি" text="মাছ গুনে গুনে সংখ্যা শেখার খেলা, ৩–৬ বছরের জন্য। ফ্রি, অ্যাকাউন্ট লাগে না।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
