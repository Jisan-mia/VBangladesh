"use client";
// IP: what we avoided — no textbook alphabet chart or primer pictures, no TV or app characters, no phonics-programme songs; every picture is our own SVG, the word list is our own (Boat, Rickshaw, Jackfruit for Bangladesh), and the b d p q cue is a plain stick-and-belly drawing.

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, shake, soundOn, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard, loadPictures } from "../lib/draw-card";
import { entryOf, X_NOTE } from "../lib/letters";
import {
  answerOf, askOf, bn, choiceCount, choicesFor, doneLine, FRESH_PACE, LEVEL_COUNT, levelOf, makeRound, methodLine, nextPace, ROUND, shouldGlow, slipLine, starsOf,
  type Item, type Pace,
} from "../lib/round";
import { EnglishWord, Glyph, Pic, SayEnglish, sayEnglish } from "./art";
import { PrintSheet } from "./print-sheet";

const TOOL = "abc-bazar";
const soft = () => tone(330, 0.12, 0.06, "sine");

/** The finger that shows the first tap. */
const FINGER = <svg className="ab-finger" viewBox="0 0 40 52" aria-hidden="true"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2b2433" strokeWidth="2.6" strokeLinejoin="round" /></svg>;

/** What hangs on the stall: the letter, or the picture with its word blanked, or a b d p q drawing. */
function Sign({ item }: { item: Item }) {
  const entry = entryOf(item.letter);
  if (item.kind === "picture") return <p className="ab-sign-letters" lang="en" aria-label={`${entry.letter} ${entry.letter.toLowerCase()}`}>{entry.letter} <span>{entry.letter.toLowerCase()}</span></p>;
  if (item.kind === "small") return <p className="ab-sign-letters" lang="en">{entry.letter}</p>;
  if (item.kind === "same") return <Glyph letter={answerOf(item)} className="ab-sign-glyph" />;
  return <div className="ab-sign-pic">
    <Pic letter={entry.letter} />
    <p><b lang="en"><span className="ab-blank">_</span>{entry.word.slice(1)}</b><span>{entry.bn}</span></p>
  </div>;
}

/** One choice's face: a picture, a small letter, a capital-and-small pair, or a b d p q drawing. */
function Face({ item, value }: { item: Item; value: string }) {
  if (item.kind === "picture") return <Pic letter={value} />;
  if (item.kind === "mirror" || item.kind === "same") return <Glyph letter={value} />;
  if (item.kind === "small") return <span className="ab-letter" lang="en">{value}</span>;
  return <span className="ab-letter ab-pair" lang="en">{value}<small>{value.toLowerCase()}</small></span>;
}
const faceLabel = (item: Item, value: string) => item.kind === "picture" ? `${entryOf(value).word}, ${entryOf(value).bn}` : value;

export function AbcGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const session = useKidsSession();
  const [print, setPrint] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"play" | "done" | "menu">("play");
  const [items, setItems] = useState<Item[]>(() => makeRound(1, 1));
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<string[]>(() => choicesFor(makeRound(1, 1)[0], 1, 3, 1));
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [tries, setTries] = useState(0);
  const [pace, setPace] = useState<Pace>(FRESH_PACE);
  const [slip, setSlip] = useState("");
  const [touched, setTouched] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);

  const item = items[Math.min(index, ROUND - 1)], entry = entryOf(item.letter), answer = answerOf(item);
  const glow = shouldGlow(pace, tries);

  useEffect(() => { setPrint(new URLSearchParams(location.search).has("print")); }, []);

  const ready = useCallback((round: Item[], at: number, lv: number, currentPace: Pace) => {
    setIndex(at); setSolved(false); setTries(0); setWrongPicks([]); setSlip("");
    setChoices(choicesFor(round[at], lv, choiceCount(currentPace, levelOf(lv).mode), newSeed()));
  }, []);

  const begin = useCallback((next: number) => {
    const round = makeRound(next, newSeed());
    setLevel(next); setItems(round); setPhase("play"); setMistakes(0); setPace(FRESH_PACE); setShowParent(false); setTouched(false);
    ready(round, 0, next, FRESH_PACE);
  }, [ready]);

  // Open where the child left off: the first level without stars.
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    begin(Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).find(lv => !levels.stars[lv]) ?? 1);
  }, [levels.loaded, levels.stars, begin]);

  useEffect(() => {
    if (!showParent || !card.current) return;
    let live = true;
    Promise.all([loadCardFonts(cardFontSample(items)).catch(() => undefined), loadPictures(items.map(entry => entry.letter))]).then(([, pictures]) => {
      if (live && card.current) drawCard(card.current, level, items, mistakes, pictures, location.host);
    });
    return () => { live = false; };
  }, [showParent, level, items, mistakes]);

  function finish() {
    const before = levels.stars, wasAll = Object.keys(before).length >= LEVEL_COUNT;
    levels.record(level, starsOf(mistakes));
    // Confetti only once the whole bazar has a star on every level.
    if (!wasAll && Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(lv => lv === level || before[lv])) confetti(); else sfx.win();
    setPhase("done");
    session.atBreak();
  }

  function choose(value: string, button: HTMLButtonElement) {
    if (solved || phase !== "play" || wrongPicks.includes(value)) return;
    setTouched(true);
    if (value === answer) {
      sfx.good();
      setSolved(true);
      setSlip("");
      setPace(current => nextPace(current, true));
      if (soundOn()) sayEnglish(entry.word);
      return;
    }
    soft();
    shake(button);
    setWrongPicks(list => [...list, value]);
    setMistakes(count => count + 1);
    setTries(count => count + 1);
    setPace(current => nextPace(current, false));
    setSlip(slipLine(item, value));
  }

  function next() {
    sfx.tap();
    if (index + 1 >= ROUND) { setIndex(ROUND); finish(); return; }
    ready(items, index + 1, level, pace);
  }

  if (print) return <PrintSheet />;

  const spec = levelOf(level);
  const ghost = !touched && index === 0 && phase === "play" && levels.loaded;
  const last = index + 1 >= ROUND;

  return (
    <div className="ab" data-slow={slow}>
      <div className="ab-top">
        <p className="ab-level"><b>লেভেল {bn(level)}</b> <span>{spec.title}</span></p>
        <ol className="ab-dots" aria-label={`${bn(ROUND)}টার মধ্যে ${bn(Math.min(index + (solved ? 1 : 0), ROUND))}টা হয়েছে`}>
          {items.map((_, i) => <li key={i} className={i < index || (i === index && solved) ? "on" : i === index && phase === "play" ? "now" : ""} />)}
        </ol>
      </div>

      <div className="ab-stage">
        <div className="ab-awning" aria-hidden="true" />
        <div className={`ab-sign${solved ? " solved" : ""}`} key={`${level}-${index}`}><Sign item={item} /></div>
        <p className="ab-ask">{askOf(item)}</p>

        <ul className={`ab-choices n${choices.length} k-${item.kind}`}>
          {choices.map(value => {
            const right = value === answer;
            const state = solved && right ? " right" : wrongPicks.includes(value) ? " wrong" : glow && right && !solved ? " ab-glow" : "";
            return <li key={value}>
              <button type="button" className={`ab-choice${state}`} data-ok={right || undefined} aria-label={faceLabel(item, value)} disabled={solved && !right} aria-disabled={wrongPicks.includes(value) || undefined}
                onClick={event => choose(value, event.currentTarget)}>
                <Face item={item} value={value} />
                {ghost && right && <span className="ab-ghost">{FINGER}</span>}
              </button>
            </li>;
          })}
        </ul>

        {phase === "done" && <div className="ab-end" role="status">
          <StarReveal count={starsOf(mistakes)} />
          <p className="ab-end-line">{doneLine(level)}।</p>
          <p className="ab-end-note">{methodLine(mistakes, level)}</p>
          <div className="ab-end-actions">
            <button type="button" className="kit-primary" onClick={() => { sfx.tap(); begin(level); }}>আবার খেলো</button>
            <button type="button" className="kit-primary ab-quiet" onClick={() => { sfx.tap(); setPhase("menu"); }}>শেষ</button>
          </div>
          <ShowParentButton onClick={() => setShowParent(true)} />
        </div>}
        {phase === "menu" && <div className="ab-end ab-menu">
          <p className="ab-end-line">আরেকটা খেলবে? একটা বেছে নাও।</p>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={LEVEL_COUNT} current={level} onPick={begin} />
        </div>}
      </div>

      <div className={`ab-say${slip ? " hint" : ""}${phase === "play" && (solved || slip) ? "" : " empty"}`} role="status" aria-live="polite">
        {phase !== "play" ? null : solved ? <>
          <div className="ab-say-word">
            <p><EnglishWord entry={entry} /> <span className="ab-gloss">{entry.bn}</span></p>
            {entry.letter === "X" && <p className="ab-x">{X_NOTE}</p>}
          </div>
          <SayEnglish word={entry.word} />
          <button type="button" className="kit-primary ab-next" onClick={next}>{last ? "শেষ দেখো" : "পরেরটা"} <span aria-hidden="true">→</span></button>
        </> : slip && <p>{slip}</p>}
      </div>

      <div className="ab-controls">
        <button type="button" className="ab-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
        <details className="ab-drawer">
          <summary>সব লেভেল</summary>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={LEVEL_COUNT} current={level} onPick={begin} />
        </details>
      </div>

      <div className="ab-parent">
        <ParentGate label="বড়দের জন্য">
          <ShareToolLink title="এবিসি বাজার" text="ছোটদের ইংরেজি বর্ণমালা শেখার খেলা: M দিয়ে Mango, R দিয়ে Rickshaw। ফ্রি, বিজ্ঞাপন নেই।" />
          <a className="kit-secondary" href="/abc-bazar?print">A–Z রং করার পাতা প্রিন্ট করো</a>
        </ParentGate>
      </div>

      <ShowParent open={showParent} onClose={() => setShowParent(false)} picture={{ fileName: `abc-bazar-level-${level}.png`, make: () => cardBlob(level, items, mistakes, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`এবিসি বাজারের কার্ড: ${doneLine(level)}।`} /></figure>
        <p>{doneLine(level)}: {items.map(entry => entryOf(entry.letter).word).join(", ")}।</p>
      </ShowParent>
      {session.resting && <RestScreen onExtend={session.extend} />}
    </div>
  );
}
