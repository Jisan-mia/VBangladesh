"use client";
// IP: what we avoided — no Meena, Sisimpur or any TV/app characters or look-alikes, no NCTB fraction pictures; the guests, food and রুটি are our own code art.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  addToday, bn, cardLines, cut, decide, doneLine, EMPTY_TODAY, endLine, FOOD_NAME, FRACTIONS, glows, hintLine, hintTarget, ITEMS, LEVELS, LEVEL_COUNT,
  MOOD_NAME, moods, newRound, nextItem, pick, praiseLine, question, roundStars, specOf, tapBasket, tapPlate, type Event, type Kind, type Leftover, type Round,
  type Step, type Today,
} from "../lib/game";
import { cutRuti, faceArt, FOOD_ART, pieceArt, rutiLeft } from "../lib/shapes";
import { Frac, Ghost, Pic } from "./art";

const TOOL = "shoman-bhag";
/** The preview-image script's fixed card (`#og`): shown once, nothing saved. */
const OG_TODAY: Today = { guests: 12, cuts: [2, 4], named: 0, table: { plates: 3, per: 2, food: "pitha" } };

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

const CHOICES: { id: Leftover; label: string }[] = [
  { id: "share", label: "ভেঙে সবাইকে দিই" },
  { id: "small", label: "ছোটজনকে দিই" },
  { id: "keep", label: "আম্মুর জন্য রাখি" },
];

export function BhagGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [round, setRound] = useState<Round>(() => newRound(1, false, 0, 1));
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>(EMPTY_TODAY);
  const [seen, setSeen] = useState<Kind[]>([]);
  const [message, setMessage] = useState("");
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);

  const spec = specOf(round.level), item = round.item;

  // Start at the first open step without stars (a fresh random seed only after hydration).
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    if (location.hash === "#og") { setToday(OG_TODAY); setShowing(true); return; }
    setRound(newRound(LEVELS.find(each => each.step <= levels.unlocked && !levels.stars[each.step])?.step ?? levels.unlocked));
  }, [levels.loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // The ghost finger comes back when the child has waited a while.
  useEffect(() => {
    setIdle(false);
    if (phase !== "play") return;
    const timer = setTimeout(() => setIdle(true), 7000);
    return () => clearTimeout(timer);
  }, [round, phase]);

  // A finished serving rests on screen (longer after the last-piece choice, to see the faces), then the next guests come.
  // The round itself never moves on alone.
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
      if (round.level === LEVEL_COUNT) confetti();
      atBreak();
      setPhase("end");
    }, round.choice !== null ? 2800 : 1700);
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

  function apply({ round: next, event }: Step, element: HTMLElement, value?: number) {
    if (event === "ignore") { sfx.tap(); return; }
    const sounds: Record<Exclude<Event, "ignore">, () => void> = {
      pick: sfx.pick, cancel: sfx.tap, drop: sfx.drop, right: sfx.good,
      over: () => { tone(330, 0.14, 0.06, "sine"); shake(element); },
      again: () => { tone(330, 0.14, 0.06, "sine"); shake(element); },
    };
    sounds[event]();
    if (event === "right") {
      if (!seen.includes(spec.kind)) setSeen([...seen, spec.kind]);
      if (next.stage === "give") { sfx.whoosh(); speak(FRACTIONS[next.cutInto].word); }
      if (item.kind === "name" && next.stage === "done") speak(FRACTIONS[item.parts].word);
    }
    // A hint stays until the plate that's over its share is put right.
    setMessage(event === "over" || event === "again" ? hintLine(round, event, value) : moods(next).includes("oh") ? message : "");
    setRound(next);
  }

  // The ghost finger: the first serving the child ever shares, an idle wait, or after two tries.
  const target = hintTarget(round);
  const firstTime = !seen.includes(spec.kind) && round.index === 0 && spec.kind === "share";
  const showGhost = phase === "play" && (firstTime || glows(round) || (idle && (round.tries > 0 || round.stage === "share" || round.stage === "give")));
  const ghostAt = (where: "basket" | number | `cut${number}` | `pick${number}`) => {
    if (!showGhost || !target) return false;
    if (where === "basket") return "basket" in target;
    if (typeof where === "number") return "plate" in target && target.plate === where;
    if (where.startsWith("cut")) return "cut" in target && target.cut === Number(where.slice(3));
    return "pick" in target && target.pick === Number(where.slice(4));
  };
  const faces = moods(round);
  const prompt = round.stage === "done" ? doneLine(round) : question(round);

  function table() {
    if (item.kind !== "share") return null;
    const art = FOOD_ART[item.food], { choice } = round;
    return <div className={`sb-table sb-n${item.guests.length}`}>
      {item.guests.map((guest, seat) => {
        const count = round.plates[seat], held = round.hand === seat;
        const bonus = choice === seat || (choice === "small" && guest.small);
        return <button type="button" key={`${round.index}-${seat}`} className={`sb-seat${held ? " is-held" : ""}${faces[seat] === "oh" ? " is-over" : ""}${round.hand !== null && !held ? " is-open" : ""}`}
          aria-label={`${guest.name}, ${MOOD_NAME[faces[seat]]}। প্লেটে ${bn(count)}টা ${FOOD_NAME[item.food]}${round.pieces[seat] || choice === "share" ? ", আর এক টুকরো" : ""}`}
          {...press(element => apply(tapPlate(round, seat), element))}>
          <Pic layers={faceArt(guest, faces[seat])} className={`sb-face${guest.small ? " is-small" : ""} sb-mood-${faces[seat]}`} key={faces[seat]} />
          <span className="sb-name">{guest.name}</span>
          <span className="sb-plate">
            {Array.from({ length: count }, (_, index) => <Pic key={index} layers={art} className={`sb-food${held && index === count - 1 ? " is-up" : ""}${faces[seat] === "oh" && index === count - 1 && glows(round) ? " is-glow" : ""}`} />)}
            {bonus && <Pic layers={art} className="sb-food" />}
            {choice === "share" && <Pic layers={art} className="sb-food sb-bit" />}
            {round.pieces[seat] && <Pic layers={pieceArt(round.cutInto)} className="sb-food sb-piece" />}
          </span>
          {ghostAt(seat) && <Ghost />}
        </button>;
      })}
    </div>;
  }

  function middle() {
    if (item.kind !== "share") return null;
    const art = FOOD_ART[item.food];
    if (round.stage === "cut") return <div className="sb-cut">
      <Pic layers={FOOD_ART.ruti} className="sb-ruti" />
      <div className="sb-knives">
        {[2, 3, 4].map(parts => <button type="button" key={parts} className={`sb-knife${glows(round) && parts === item.guests.length ? " is-glow" : ""}`} aria-label={`${bn(parts)} টুকরো`}
          {...press(element => apply(cut(round, parts), element, parts))}>
          <Pic layers={cutRuti(parts)} /><span>{bn(parts)} টুকরো</span>{ghostAt(`cut${parts}`) && <Ghost />}
        </button>)}
      </div>
    </div>;
    if (round.stage === "give" || (round.stage === "done" && item.cut)) return <div className="sb-cut sb-cut-done">
      <Pic layers={rutiLeft(round.cutInto, round.pieces.filter(Boolean).length)} className="sb-ruti is-cut" />
      <p className="sb-named"><Frac parts={round.cutInto} /><span>{FRACTIONS[round.cutInto].word}</span></p>
    </div>;
    const left = round.stage === "left";
    return <>
      <button type="button" className={`sb-basket${round.hand === "basket" ? " is-held" : ""}${left ? " is-left" : ""}`} aria-label={`ঝুড়ি, ${bn(round.basket)}টা ${FOOD_NAME[item.food]}`}
        {...press(element => apply(tapBasket(round), element))}>
        {Array.from({ length: round.basket }, (_, index) => <Pic key={index} layers={art} className={`sb-food${round.hand === "basket" && index === round.basket - 1 ? " is-up" : ""}`} />)}
        {round.choice === "keep" && <span className="sb-keep">আম্মুর জন্য</span>}
        {ghostAt("basket") && <Ghost />}
      </button>
      {left && <div className="sb-choices">
        {CHOICES.map(each => <button type="button" key={String(each.id)} className="kit-secondary" {...press(element => apply(decide(round, each.id), element))}>{each.label}</button>)}
      </div>}
    </>;
  }

  function quiz() {
    if (item.kind === "name") return <>
      <div className="sb-board"><Pic layers={cutRuti(item.parts, { shade: item.shaded })} className="sb-ruti" /></div>
      <div className={`sb-tiles sb-tiles-${item.choices.length}`}>
        {item.choices.map(parts => {
          const right = round.stage === "done" && parts === item.parts, glow = glows(round) && parts === item.parts;
          return <button type="button" key={parts} className={`sb-tile${right ? " is-right" : ""}${glow ? " is-glow" : ""}`} aria-label={FRACTIONS[parts].word}
            {...press(element => apply(pick(round, parts), element, parts))}>
            <Frac parts={parts} /><span>{FRACTIONS[parts].word}</span>{ghostAt(`pick${parts}`) && <Ghost />}
          </button>;
        })}
      </div>
    </>;
    if (item.kind === "fair") return <div className="sb-tiles sb-tiles-2">
      {[0, 1].map(side => {
        const right = round.stage === "done" && side === item.fairSide, glow = glows(round) && side === item.fairSide;
        return <button type="button" key={side} className={`sb-tile sb-fair${right ? " is-right" : ""}${glow ? " is-glow" : ""}`} aria-label={`${side ? "ডানের" : "বাঁয়ের"} রুটি`}
          {...press(element => apply(pick(round, side), element))}>
          <Pic layers={cutRuti(item.parts, { unfair: side !== item.fairSide })} />{ghostAt(`pick${side}`) && <Ghost />}
        </button>;
      })}
    </div>;
    return null;
  }

  return (
    <div className="sb" data-slow={slow || undefined}>
      <div className="sb-play">
        <div className="sb-top">
          <p className="sb-level"><b>ধাপ {bn(spec.step)}</b> <span>{spec.label}</span></p>
          <ol className="sb-dots" aria-label={`${bn(ITEMS)}টার ${bn(round.index + 1)} নম্বর`}>
            {Array.from({ length: ITEMS }, (_, index) => <li key={index} className={index < round.index || (index === round.index && round.stage === "done") ? "done" : index === round.index ? "now" : ""} />)}
          </ol>
          <button type="button" className="sb-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
          <SoundToggle compact />
        </div>
        <p className={`sb-q${round.stage === "done" ? " is-done" : ""}`} aria-live="polite">{prompt} <SpeakButton text={prompt} /></p>
        {item.kind === "share" ? <>{middle()}{table()}</> : quiz()}
        <p className="sb-msg" aria-live="polite">{message}</p>

        {phase === "end" && (
          <div className="sb-over" role="status">
            <StarReveal count={stars} />
            <p className="sb-end-line">{endLine(round)}</p>
            {praiseLine(round) && <p className="sb-end-note">{praiseLine(round)}</p>}
            <div className="sb-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.level < LEVEL_COUNT && <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের ধাপ: {specOf(round.level + 1).label}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="sb-over">
            <p className="sb-end-line">মেহমানরা খেয়েদেয়ে বাড়ি গেল।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={cardLines(today).join("। ") || "সমান ভাগ"} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="sb-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} noun="ধাপ" current={spec.step} unlocked={levels.unlocked} stars={levels.stars} onPick={step => restart(step)} />
        <p>{LEVELS.map(each => `ধাপ ${bn(each.step)}: ${each.label}`).join(" · ")}। তারা শুধু এই ফোনে মনে রাখে কোন ধাপ খেলা হলো।</p>
      </details>
      <div className="sb-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="সমান ভাগ" text="পিঠা-আম সমান ভাগ করে ভাগ আর ভগ্নাংশ শেখার খেলা, ৫–১০ বছরের জন্য। ফ্রি, বিজ্ঞাপন নেই।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
