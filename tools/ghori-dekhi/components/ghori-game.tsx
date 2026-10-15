"use client";
// IP: what we avoided — no textbook or app clock face, no TV characters, no named child; the clock, the skies and every object are our own SVG, and the time words are everyday Bangladeshi speech.

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  choiceCount, doneLine, firstMove, FRESH_PACE, LEVEL_COUNT, levelOf, makeRound, methodLine, nextPace, readChoices, ROUND, say, shouldGlow, starsOf,
  type Item, type Pace,
} from "../lib/day";
import { bn, onFace, partOf, readHint, same, sayLeft, sayTime, setHint, type Time } from "../lib/time";
import { Scene } from "./art";
import { ClockFace, type Hand } from "./clock";
import { PrintSheet } from "./print-sheet";

const TOOL = "ghori-dekhi";
type Say = { title?: string; text: string; hint?: boolean };
const soft = () => tone(330, 0.12, 0.06, "sine");
const START = 0; // every "set" item starts at 12:00, hands together

export function GhoriGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const session = useKidsSession();
  const [print, setPrint] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"play" | "done" | "menu">("play");
  const [items, setItems] = useState<Item[]>(() => makeRound(1, 1));
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(START);
  const [hand, setHand] = useState<Hand>("hour");
  const [choices, setChoices] = useState<Time[]>([]);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [tries, setTries] = useState(0);
  const [pace, setPace] = useState<Pace>(FRESH_PACE);
  const [said, setSaid] = useState<Say>({ text: "" });
  const [touched, setTouched] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const clockBox = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const item = items[Math.min(index, ROUND - 1)], spec = levelOf(level);
  const glow = shouldGlow(pace, tries);

  useEffect(() => { setPrint(new URLSearchParams(location.search).has("print")); }, []);

  /** Ready item `at` of a round: hands back to 12, the hand to move first chosen, the choices drawn. */
  const ready = useCallback((round: Item[], at: number, lv: number, currentPace: Pace) => {
    const next = round[at];
    setIndex(at); setTotal(START); setSolved(false); setTries(0); setWrongPicks([]);
    setHand(firstMove(next.time).hand);
    setChoices(next.mode === "read" ? readChoices(next.time, lv, choiceCount(currentPace), newSeed()) : []);
    setSaid({ text: "" });
  }, []);

  const begin = useCallback((next: number) => {
    const round = makeRound(next, newSeed());
    setLevel(next); setItems(round); setPhase("play"); setMistakes(0); setPace(FRESH_PACE); setShowParent(false); setTouched(false);
    ready(round, 0, next, FRESH_PACE);
  }, [ready]);

  // Open where the child left off: the first open level without stars.
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    begin(Array.from({ length: levels.unlocked }, (_, i) => i + 1).find(lv => !levels.stars[lv]) ?? 1);
  }, [levels.loaded, levels.unlocked, levels.stars, begin]);

  useEffect(() => {
    if (!showParent || !card.current) return;
    let live = true;
    loadCardFonts(`${doneLine()} ঘড়ি দেখি ${items.map(entry => `${say(entry.time, 5)} ${entry.activity.name}`).join(" ")}`).catch(() => undefined).then(() => {
      if (live && card.current) drawCard(card.current, level, items, mistakes, location.host);
    });
    return () => { live = false; };
  }, [showParent, level, items, mistakes]);

  function finish() {
    levels.record(level, starsOf(mistakes));
    sfx.win();
    if (level === LEVEL_COUNT) confetti();
    setPhase("done");
    session.atBreak();
  }

  function right() {
    sfx.good();
    setSolved(true);
    setPace(value => nextPace(value, true));
    const left = sayLeft(item.time);
    setSaid({ title: sayTime(item.time, { part: true }), text: left ? `মানে ${left}।` : `${item.activity.name}।` });
  }

  function slip(hint: string, target: Element | null) {
    soft();
    shake(target);
    setMistakes(value => value + 1);
    setTries(value => value + 1);
    setPace(value => nextPace(value, false));
    setSaid({ text: hint, hint: true });
  }

  function turn(next: number, how: "drag" | "tap") {
    if (phase !== "play" || solved) return;
    setTouched(true);
    if (next !== total) { if (how === "drag") sfx.tick(); else sfx.pick(); }
    setTotal(next);
  }

  function check() {
    if (solved) return;
    setTouched(true);
    if (same(total, item.time)) right();
    else slip(setHint(total, item.time), clockBox.current);
  }

  function choose(time: Time, button: HTMLButtonElement) {
    if (solved) return;
    setTouched(true);
    if (time.h === item.time.h && time.m === item.time.m) { right(); return; }
    setWrongPicks(value => [...value, `${time.h}:${time.m}`]);
    slip(readHint(time, item.time), button);
  }

  function next() {
    sfx.tap();
    if (index + 1 >= ROUND) { setIndex(ROUND); finish(); return; }
    ready(items, index + 1, level, pace);
  }

  if (print) return <PrintSheet />;

  const part = partOf(item.time.h);
  const demo = !touched && index === 0 && phase === "play" && item.mode === "set" ? firstMove(item.time) : null;

  return (
    <div className="gd" data-slow={slow}>
      <div className="gd-top">
        <p className="gd-level"><b>লেভেল {bn(level)}</b> <span>{spec.title}</span></p>
        <ol className="gd-dots" aria-label={`${bn(ROUND)}টার মধ্যে ${bn(Math.min(index, ROUND))}টা হয়েছে`}>
          {items.map((entry, i) => <li key={i} className={i < index || (i === index && solved) ? "on" : i === index && phase === "play" ? "now" : ""} />)}
        </ol>
      </div>

      <div className="gd-stage">
        <div className="gd-scene">
          <Scene activity={item.activity.id} part={part} />
          <div className="gd-ask">
            <p className="gd-what">{item.activity.name}</p>
            {item.mode === "set"
              ? <p className="gd-target"><span>কাঁটা ঘুরিয়ে বানাও</span> {sayTime(item.time, { part: true })}</p>
              : <p className="gd-target">কয়টা বাজে?</p>}
          </div>
          {item.mode === "set" && <SpeakButton text={sayTime(item.time, { part: true })} />}
        </div>

        <div className="gd-clock-box" ref={clockBox}>
          {item.mode === "set"
            ? <ClockFace total={total} target={item.time} ghost={glow && !solved} demo={demo} slow={slow} chosen={hand} step={spec.step} onTurn={turn} onChoose={setHand}
              label={`ঘড়ি: এখন ${sayTime(onFace(total))}। বানাতে হবে ${sayTime(item.time)}`} />
            : <ClockFace total={item.time.h * 60 + item.time.m} label={`ঘড়ি, ${item.activity.name}`} />}
        </div>

        {item.mode === "set" ? (
          <div className="gd-tools">
            <button type="button" className={`gd-chip gd-chip-hour${hand === "hour" ? " on" : ""}`} aria-pressed={hand === "hour"} onClick={() => { sfx.tap(); setHand("hour"); }} disabled={solved}>
              <svg viewBox="0 0 40 24" aria-hidden="true"><rect x="4" y="8" width="22" height="8" rx="3" /></svg>ছোট কাঁটা
            </button>
            <button type="button" className={`gd-chip gd-chip-minute${hand === "minute" ? " on" : ""}`} aria-pressed={hand === "minute"} onClick={() => { sfx.tap(); setHand("minute"); }} disabled={solved}>
              <svg viewBox="0 0 40 24" aria-hidden="true"><rect x="2" y="9" width="36" height="6" rx="3" /></svg>বড় কাঁটা
            </button>
            {solved
              ? <button type="button" className="kit-primary gd-go" onClick={next}>{index + 1 >= ROUND ? "শেষ দেখো" : "পরেরটা"}</button>
              : <button type="button" className="kit-primary gd-go" onClick={check}>হয়েছে</button>}
          </div>
        ) : (
          <div className="gd-tools gd-choices" data-count={choices.length}>
            {choices.map(time => {
              const ok = time.h === item.time.h && time.m === item.time.m;
              return <button key={`${time.h}:${time.m}`} type="button" className={`gd-choice${ok && (glow || solved) ? " gd-glow" : ""}`}
                disabled={wrongPicks.includes(`${time.h}:${time.m}`) || (solved && !ok)} onClick={event => choose(time, event.currentTarget)}>
                {say(time, level)}
              </button>;
            })}
            {solved && <button type="button" className="kit-primary gd-go gd-next" onClick={next}>{index + 1 >= ROUND ? "শেষ দেখো" : "পরেরটা"}</button>}
          </div>
        )}

        {phase === "done" && <div className="gd-end" role="status">
          <StarReveal count={starsOf(mistakes)} />
          <p className="gd-end-line">{doneLine()}।</p>
          <p className="gd-end-note">{methodLine(mistakes, level)}</p>
          <div className="gd-end-actions">
            <button type="button" className="kit-primary" onClick={() => { sfx.tap(); begin(level); }}>আবার খেলো</button>
            <button type="button" className="kit-primary gd-quiet" onClick={() => { sfx.tap(); setPhase("menu"); }}>শেষ</button>
          </div>
          <ShowParentButton onClick={() => setShowParent(true)} />
        </div>}
        {phase === "menu" && <div className="gd-end gd-menu">
          <p className="gd-end-line">আরেকটা খেলবে? একটা বেছে নাও।</p>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={begin} />
        </div>}
      </div>

      <div className={`gd-say${said.hint ? " hint" : ""}${said.text ? "" : " empty"}`} role="status" aria-live="polite">
        {said.title && <p className="gd-say-title">{said.title}</p>}
        {said.text && <p>{said.text}</p>}
        {said.title && <SpeakButton text={said.title} />}
      </div>

      <div className="gd-controls">
        <button type="button" className="gd-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
        <details className="gd-drawer">
          <summary>সব লেভেল</summary>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={begin} />
        </details>
      </div>

      <div className="gd-parent">
        <ParentGate label="বড়দের জন্য">
          <ShareToolLink title="ঘড়ি দেখি" text="ছোটদের ঘড়ি দেখা শেখার খেলা: সাড়ে, সোয়া, পৌনে। ফ্রি, বিজ্ঞাপন নেই।" />
          <a className="kit-secondary" href="/ghori-dekhi?print">কাঁটা আঁকার ঘড়ি প্রিন্ট করো</a>
        </ParentGate>
      </div>

      <ShowParent open={showParent} onClose={() => setShowParent(false)} picture={{ fileName: `ghori-dekhi-level-${level}.png`, make: () => cardBlob(level, items, mistakes, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`ঘড়ি দেখির কার্ড: ${doneLine()}।`} /></figure>
        <p>{doneLine()}।</p>
      </ShowParent>
      {session.resting && <RestScreen onExtend={session.extend} />}
    </div>
  );
}
