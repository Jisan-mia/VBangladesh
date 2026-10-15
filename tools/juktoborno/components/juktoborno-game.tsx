"use client";
// IP: what we avoided — no NCTB textbook pages, words or pictures, no TV characters, no app's look; the "machine" is plain CSS and every picture is our own code art.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, hiss, newSeed, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard, type Today } from "../lib/draw-card";
import {
  ALL_WORDS, LEVEL_COUNT, ROUND_SIZE, bn, conjunct, current, done, equation, hint, levelOf, methodLine, newRound, next, place, shapeNote,
  starsOf, tiles, unplace, whyLine, type Round,
} from "../lib/words";
import { PrintSheet } from "./print-sheet";
import { WordLine, WordPicture } from "./word-bits";

const TOOL = "juktoborno";
const BOOK_KEY = "ektukhani-juktoborno-book";
const ALL_JOINTS = [...new Set(ALL_WORDS.map(item => conjunct(item.parts)))];

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

const readBook = (): string[] => { try { const saved = JSON.parse(localStorage.getItem(BOOK_KEY) ?? "[]"); return Array.isArray(saved) ? saved.filter(j => ALL_JOINTS.includes(j)) : []; } catch { return []; } };
const writeBook = (book: string[]) => { try { localStorage.setItem(BOOK_KEY, JSON.stringify(book)); } catch { /* private mode */ } };

function Ghost() {
  return <svg className="jb-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1d2b53" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** The machine's sound: two soft clanks and a puff, then the chime. */
function clank(slow: boolean) {
  tone(180, 0.07, 0.1, "square"); tone(240, 0.07, 0.08, "square", 0.12);
  if (!slow) hiss(0.25, 0.06, 1600, "bandpass", 0.22);
  setTimeout(() => sfx.good(), 320);
}

export function JuktobornoGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [printing, setPrinting] = useState(false);
  const [round, setRound] = useState<Round>(() => newRound(1, 1));
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>({ count: 0, modes: [], items: [] });
  const [showing, setShowing] = useState(false);
  const [book, setBook] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const machine = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const picked = useRef(false);

  useEffect(() => { setPrinting(new URLSearchParams(location.search).has("print")); setBook(readBook()); }, []);

  // Start where the child left off: the first open level without stars, with a fresh order of words.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    picked.current = true;
    const start = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(open => !levels.stars[open]) ?? levels.unlocked;
    setRound(newRound(start, newSeed()));
  }, [levels.loaded, levels.unlocked, levels.stars]);

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample(today)).then(() => { if (live && card.current) drawCard(card.current, today, location.host); });
    return () => { live = false; };
  }, [showing, today]);

  if (printing) return <PrintSheet />;

  const spec = levelOf(round.level), item = done(round) ? null : current(round);
  const juri = spec.mode === "juri", help = hint(round);
  const joint = item ? conjunct(item.parts) : "";
  const ghostOn = !touched && round.level === 1 && round.index === 0 && !round.filled.length && !levels.stars[1];
  const want = item && !round.solved ? item.parts[round.filled.length] : null;

  function tapTile(letter: string) {
    setTouched(true);
    const { round: after, outcome } = place(round, letter);
    if (outcome === "ignore") { sfx.tap(); return; }
    setRound(after);
    if (outcome === "fill") { sfx.drop(); return; }
    if (outcome === "right") {
      clank(slow);
      speak(after.items[after.index].word);
      const got = conjunct(after.items[after.index].parts);
      if (!book.includes(got)) { const grown = [...book, got]; setBook(grown); writeBook(grown); }
      return;
    }
    tone(330, 0.14, 0.06, "sine");
    shake(machine.current);
  }

  function tapSlot() {
    if (!round.filled.length || round.solved) return;
    sfx.tap();
    setRound(unplace(round));
  }

  function goNext() {
    sfx.tap();
    const moved = next(round);
    if (!done(moved)) { setRound(moved); return; }
    const earned = starsOf(round.misses);
    levels.record(round.level, earned);
    setStars(earned);
    setToday(before => ({ count: before.count + ROUND_SIZE, modes: [...new Set([...before.modes, spec.mode])], items: round.items }));
    sfx.win();
    if (spec.mode === "juri") confetti(); // a whole set (its ভাঙি and জুড়ি) is finished
    setRound(moved);
    atBreak();
    setPhase("end");
  }

  function restart(level = round.level) {
    setRound(newRound(level, newSeed()));
    setPhase("play");
  }

  const box = (letter: string | undefined, index: number) => {
    const wrong = round.last && round.last.outcome !== "right" && !round.filled.length;
    return <button type="button" key={index} className={`jb-slot${letter ? " is-full" : ""}${wrong ? " is-tried" : ""}`} aria-label={letter ? `${letter}, ফিরিয়ে নাও` : `${bn(index + 1)} নম্বর ঘর, ফাঁকা`}
      {...press(tapSlot)}>{letter ?? (wrong ? round.last!.tried[index] : "")}</button>;
  };
  const slots = item ? item.parts.map((_, index) => <span className="jb-part" key={index}>{index > 0 && <i aria-hidden="true">+</i>}{box(round.filled[index], index)}</span>) : null;
  const block = <span className={`jb-block${round.solved ? " is-done" : ""}${juri && !round.solved ? " is-empty" : ""}`} aria-label={juri && !round.solved ? "যুক্তবর্ণ, এখনো ফাঁকা" : joint}>
    {juri && !round.solved ? "?" : joint}
  </span>;
  const note = item && (round.solved ? shapeNote(item.parts) : whyLine(round));
  const ask = juri ? "ছবির নামটা বলো। ফাঁকা ঘরের যুক্তবর্ণে কোন কোন বর্ণ?" : `${joint}-তে কোন কোন বর্ণ? যেটা আগে, সেটা আগে বসাও।`;

  return (
    <div className="jb" data-slow={slow || undefined}>
      <div className="jb-play">
        <div className="jb-top">
          <p className="jb-level"><b>ধাপ {bn(round.level)}</b> <span>{spec.title}</span></p>
          <button type="button" className="jb-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact />
        </div>
        <ol className="jb-dots" aria-label={`${bn(ROUND_SIZE)}টার মধ্যে ${bn(Math.min(round.index + 1, ROUND_SIZE))} নম্বর শব্দ`}>
          {round.items.map((word, index) => <li key={word.word} className={index < round.index || (index === round.index && round.solved) ? "is-done" : index === round.index ? "is-now" : ""} />)}
        </ol>

        {item && <>
          <div className="jb-card">
            <WordPicture pic={item.pic} size={76} />
            <WordLine item={item} gap={juri && !round.solved} />
            {(round.solved || !juri) && <SpeakButton text={item.word} />}
          </div>

          <div className="jb-machine" ref={machine} data-n={item.parts.length} data-mode={spec.mode} aria-label={juri ? "বর্ণ জোড়ার কারখানা" : "যুক্তবর্ণ ভাঙার কারখানা"} role="group">
            <span className="jb-gear" aria-hidden="true" />
            {juri ? <>{slots}<i aria-hidden="true">=</i>{block}</> : <>{block}<i aria-hidden="true">=</i>{slots}</>}
          </div>

          <p className={`jb-say${note ? " is-note" : ""}`} aria-live="polite">
            {round.solved ? <><b>{equation(item.parts)}</b>{note && <span> {note}</span>}</> : note || ask}
          </p>

          {round.solved
            ? <button type="button" className="kit-primary jb-next" onClick={goNext}>{round.index + 1 === round.items.length ? "শেষ" : "পরেরটা"}</button>
            : <div className="jb-tiles" role="group" aria-label="বর্ণগুলো">
              {tiles(round).map(letter => {
                const glow = help >= 2 && letter === want;
                return <button type="button" key={letter} className={`jb-tile${glow ? " is-glow" : ""}`} aria-label={letter} {...press(() => tapTile(letter))}>
                  {letter}{ghostOn && letter === want && <Ghost />}
                </button>;
              })}
            </div>}
        </>}

        {phase === "end" && (
          <div className="jb-over" role="status">
            <StarReveal count={stars} />
            <p className="jb-end-line">{bn(ROUND_SIZE)}টা যুক্তবর্ণ {juri ? "জুড়লে" : "ভাঙলে"}।</p>
            <p className="jb-end-note">{methodLine(round)}</p>
            <p className="jb-end-sums">{round.items.map(word => <span key={word.word}>{equation(word.parts)}</span>)}</p>
            <p className="jb-end-note">এবার কোনো বই খুলে একটা যুক্তবর্ণ খুঁজে বের করো।</p>
            <div className="jb-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.level < LEVEL_COUNT && <button type="button" className="kk-link jb-onward" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের ধাপ: {levelOf(round.level + 1).title}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="jb-over">
            <p className="jb-end-line">কারখানা আজকের মতো বন্ধ।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>নতুন খেলা</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`আজ ${bn(today.count)}টা যুক্তবর্ণ: ${today.items.map(word => equation(word.parts)).join(", ")}`} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="jb-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={round.level} noun="ধাপ" onPick={pick => restart(pick)} />
      </details>
      <details className="jb-drawer">
        <summary>যুক্তবর্ণের খাতা · {bn(book.length)}/{bn(ALL_JOINTS.length)}</summary>
        <ul className="jb-book">{ALL_JOINTS.map(j => <li key={j} className={book.includes(j) ? "is-got" : ""} aria-label={book.includes(j) ? j : "এখনো পাওনি"}>{j}</li>)}</ul>
      </details>
      <div className="jb-parent">
        <a className="jb-print" href="/juktoborno?print">‘ভেঙে লেখো’ শিট প্রিন্ট করো</a>
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="যুক্তবর্ণ ভাঙি-জুড়ি" text="ক্ষ = ক + ষ। ছবির শব্দে যুক্তবর্ণ ভাঙা-জোড়ার খেলা, ৭–১০ বছরের জন্য। ফ্রি।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা আর খাতার যুক্তবর্ণ, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
