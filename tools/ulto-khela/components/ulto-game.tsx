"use client";
// IP: what we avoided — the Day–Night Stroop and card-sort tasks are public research methods, but no test-kit cards, no Sisimpur/Meena or TV/app characters or look-alikes, and no "brain training" claims; every picture is our own code art.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  addToday, answer, answerOf, bn, cardLines, COLOR_WORDS, endLine, glows, LEVEL_COUNT, nextItem, newRound, pass, paceSeconds, praiseLine, roundStars,
  RULES, SHAPE_WORDS, specOf, TARGETS, WORDS, type Round, type Today,
} from "../lib/game";
import { Bell, Ghost, PICTURE_ART, RuleIcon, SortArt } from "./art";
import { OgCard } from "./og-card";

const TOOL = "ulto-khela";

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

/** A soft two-strike bell for a rule change. */
const bell = () => { tone(1568, 0.7, 0.07, "sine"); tone(2349, 0.5, 0.03, "sine"); tone(1568, 0.7, 0.06, "sine", 0.28); tone(2349, 0.5, 0.025, "sine", 0.28); };

/** `#og` (the preview-image script only) shows a fixed finished card in place of the game: no stars, no play time. */
export function UltoGame() {
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
  const [quick, setQuick] = useState(false);
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>({ pictures: 0, cards: 0, bells: 0 });
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const badge = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const spec = specOf(round.level), item = round.item, right = answerOf(round);

  // Start at the first level without stars (a fresh random seed only after hydration).
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const first = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(level => !levels.stars[level]) ?? levels.unlocked;
    setRound(newRound(first));
  }, [levels.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // The ghost finger comes back when the child has waited a while.
  useEffect(() => {
    setIdle(false);
    if (phase !== "play" || round.stage !== "pick") return;
    const timer = setTimeout(() => setIdle(true), 7000);
    return () => clearTimeout(timer);
  }, [round.index, round.stage, phase]);

  // চটপট only (7+, off by default): a picture waits a few seconds, then quietly passes. Demo pictures always wait.
  useEffect(() => {
    if (!quick || phase !== "play" || round.stage !== "pick" || round.demo) return;
    const timer = setTimeout(() => setRound(current => pass(current)), paceSeconds(round.pace) * 1000);
    return () => clearTimeout(timer);
  }, [quick, phase, round.index, round.stage, round.demo, round.pace]);

  // After an answer the picture rests a moment, then the next one comes. The round itself never moves on alone.
  useEffect(() => {
    if (round.stage !== "done" || phase !== "play") return;
    const timer = setTimeout(() => {
      const next = nextItem(round);
      if (next) {
        if (next.rang) { bell(); speak(`এবার ${RULES[next.rule].name}`); }
        setRound(next);
        return;
      }
      const earned = roundStars(round);
      levels.record(round.level, earned);
      setStars(earned);
      setToday(before => addToday(before, round));
      sfx.win();
      if (round.level === 4 || round.level === LEVEL_COUNT) confetti();
      atBreak();
      setPhase("end");
    }, quick ? 300 : 700);
    return () => clearTimeout(timer);
  }, [round, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample).then(() => { if (live && card.current) drawCard(card.current, today, location.host); });
    return () => { live = false; };
  }, [showing, today]);

  function restart(level = round.level) {
    // The quiet pace carries over to the next round.
    setRound(newRound(level, round.pace));
    setPhase("play");
  }

  function onChoice(choice: number, element: HTMLElement) {
    const { round: next, outcome } = answer(round, choice);
    if (outcome === "ignore") return;
    if (outcome === "again") { tone(330, 0.14, 0.06, "sine"); shake(element); shake(badge.current); }
    else sfx.good();
    setRound(next);
  }

  const ghost = round.stage === "pick" && (round.demo || idle || glows(round)) ? right : null;
  const sayRule = RULES[round.rule].say;
  const label = (choice: number) => item.kind === "pair" ? WORDS[item.choices[choice]] : `${COLOR_WORDS[TARGETS[choice].color]} ${SHAPE_WORDS[TARGETS[choice].shape]}`;

  return (
    <div className="uk" data-slow={slow || undefined}>
      <div className="uk-play">
        <div className="uk-top">
          <p className="uk-level"><b>ধাপ {bn(round.level)}</b> <span>{spec.label}</span></p>
          <ol className="uk-dots" aria-label={`${bn(spec.items)}টার ${bn(round.index + 1)} নম্বর ছবি`}>
            {Array.from({ length: spec.items }, (_, index) => <li key={index} className={index < round.index || (index === round.index && round.stage === "done") ? "done" : index === round.index ? "now" : ""} />)}
          </ol>
        </div>

        <div className={`uk-rule uk-rule-${round.rule}`} ref={badge} key={`rule-${round.bells}`}>
          <span className="uk-rule-icon"><RuleIcon rule={round.rule} /></span>
          <span className="uk-rule-name">{RULES[round.rule].name}</span>
          {round.rang && round.stage === "pick" && <span className="uk-bell"><Bell /></span>}
          <SpeakButton text={sayRule} />
        </div>
        <p className="uk-sr" aria-live="polite">{round.rang ? `ঘণ্টা বাজল। এবার ${RULES[round.rule].name}: ${sayRule}।` : ""}</p>

        <div className="uk-show" key={`show-${round.index}`} aria-label={item.kind === "pair" ? WORDS[item.show] : `${COLOR_WORDS[item.card.color]} ${SHAPE_WORDS[item.card.shape]}`} role="img">
          {item.kind === "pair" ? PICTURE_ART[item.show]() : <SortArt card={item.card} />}
          {quick && !round.demo && round.stage === "pick" && <span className="uk-pace" style={{ "--pace": `${paceSeconds(round.pace)}s` } as CSSProperties} aria-hidden="true" />}
        </div>

        <div className={`uk-choices${item.kind === "sort" ? " uk-baskets" : ""}`}>
          {[0, 1].map(choice => {
            const glow = round.stage === "pick" && glows(round) && choice === right, lit = round.stage === "done" && choice === right;
            return <button type="button" key={`${round.index}-${choice}`} className={`uk-choice${glow ? " is-glow" : ""}${lit ? " is-right" : ""}`} aria-label={label(choice)} {...press(element => onChoice(choice, element))}>
              <span className="uk-art">{item.kind === "pair" ? PICTURE_ART[item.choices[choice]]() : <SortArt card={TARGETS[choice]} />}</span>
              <span className="uk-word">{label(choice)}</span>
              {ghost === choice && <Ghost />}
            </button>;
          })}
        </div>

        <div className="uk-controls">
          <button type="button" className="uk-pill" aria-pressed={quick} onClick={() => { sfx.tap(); setQuick(!quick); }}>চটপট <small>৭+</small></button>
          <button type="button" className="uk-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
          <SoundToggle compact />
        </div>

        {phase === "end" && (
          <div className="uk-over" role="status">
            <StarReveal count={stars} />
            <p className="uk-end-line">{endLine(round)}</p>
            {praiseLine(round) && <p className="uk-end-note">{praiseLine(round)}</p>}
            <div className="uk-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.level < LEVEL_COUNT && <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের ধাপ: {specOf(round.level + 1).label}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="uk-over">
            <p className="uk-end-line">সূর্য ডুবল, চাঁদ উঠল। আজকের খেলা থামল।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLines(today).join("। ")} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="uk-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} noun="ধাপ" current={round.level} unlocked={levels.unlocked} stars={levels.stars} onPick={level => restart(level)} />
        <p>{Array.from({ length: LEVEL_COUNT }, (_, index) => `${bn(index + 1)}: ${specOf(index + 1).label}`).join(" · ")}। তারা শুধু এই ফোনে মনে রাখে কোন ধাপ খেলা হলো।</p>
      </details>
      <div className="uk-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="উল্টো খেলা" text="সূর্য এলে চাঁদে চাপো, ঘণ্টা বাজলে নিয়ম বদলাও। ৪–৮ বছরের মনোযোগের খেলা, ফ্রি।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
