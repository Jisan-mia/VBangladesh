"use client";
// IP: what we avoided — no NCTB textbook text or pictures, no TV or app characters, no NASA photos or logos; every scene is our own SVG.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, hiss, newSeed, sfx, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard, type Today } from "../lib/draw-card";
import { LEVEL_COUNT, bn, current, done, endLine, levelOf, matchLine, methodLine, newRound, next, predict, shownChoices, starsOf, type Round } from "../lib/game";
import type { Pic } from "../lib/art";
import { ITEMS, SCENE_MS, type Item } from "../lib/questions";
import { PicG, SceneView } from "./scenes";

const TOOL = "ki-hobe";

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: () => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(); },
});

function Ghost() {
  return <svg className="ki-ghost" viewBox="0 0 48 60" aria-hidden="true">
    <path d="M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z" fill="#fff" stroke="#1f2d4a" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}

/** One soft sound as the experiment starts: a splash, a click, a hum. Mute-first: the scene says it all without it. */
function sceneSound(item: Item) {
  if (item.scene === "pond") hiss(0.3, 0.12, 900, "lowpass", 0.75);
  else if (item.scene === "magnet") tone(1320, 0.05, 0.07, "triangle", 0.55);
  else if (item.scene === "phone") { tone(520, 0.12, 0.05, "sine", 0.2); tone(520, 0.12, 0.05, "sine", 1.2); }
  else if (item.scene === "fall" || item.scene === "moonfall") sfx.whoosh();
}

export function KiHobeGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [round, setRound] = useState<Round>(() => newRound(1, 1));
  const [game, setGame] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>({ count: 0, items: [] });
  const [showing, setShowing] = useState(false);
  const [touched, setTouched] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const picked = useRef(false);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // #og: a fixed card for the site's preview image. Opens ShowParent only; nothing is saved.
  useEffect(() => {
    if (location.hash !== "#og") return;
    setToday({ count: 4, items: ITEMS.filter(item => item.set === 1) });
    setShowing(true);
  }, []);

  // Start where the child left off: the first open level without stars.
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

  const item = done(round) ? null : current(round);
  const ghostOn = !touched && round.level === 1 && round.index === 0 && round.picked === null && !levels.stars[1];
  const last = round.index + 1 === round.items.length;

  function choose(choice: number) {
    if (!item || round.picked !== null) return;
    setTouched(true);
    sfx.pick();
    const after = predict(round, choice);
    setRound(after);
    sceneSound(item);
    const matched = choice === item.answer;
    timer.current = setTimeout(() => {
      setRevealed(true);
      if (matched) sfx.good(); else tone(392, 0.16, 0.06, "sine", 0, 523);
    }, slow ? 350 : SCENE_MS[item.scene]);
  }

  function goNext() {
    sfx.tap();
    setRevealed(false);
    const moved = next(round);
    if (!done(moved)) { setRound(moved); return; }
    const total = round.items.length, earned = starsOf(round.right, total), first = !levels.stars[round.level];
    levels.record(round.level, earned);
    setStars(earned);
    setToday(before => ({ count: before.count + total, items: round.items }));
    sfx.win();
    if (first) confetti(); // a whole set finished for the first time
    setRound(moved);
    atBreak();
    setPhase("end");
  }

  function restart(level = round.level) {
    if (timer.current) clearTimeout(timer.current);
    setRevealed(false);
    setRound(newRound(level, newSeed(), round.easy));
    setGame(count => count + 1);
    setPhase("play");
  }

  const choicePic = (pics: readonly Pic[]) =>
    <svg viewBox={`0 0 ${64 * pics.length} 64`} aria-hidden="true">{pics.map((pic, k) => <PicG key={pic} pic={pic} x={32 + 64 * k} y={32} />)}</svg>;

  return (
    <div className="ki" data-slow={slow || undefined}>
      <div className="ki-play">
        <div className="ki-top">
          <p className="ki-level"><b>ধাপ {bn(round.level)}</b> <span>{levelOf(round.level).title}</span></p>
          <button type="button" className="ki-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact />
        </div>
        <ol className="ki-dots" aria-label={`${bn(round.items.length)}টার মধ্যে ${bn(Math.min(round.index + 1, round.items.length))} নম্বর প্রশ্ন`}>
          {round.items.map((one, index) => <li key={one.id} className={index < round.index || (index === round.index && revealed) ? "is-done" : index === round.index ? "is-now" : ""} />)}
        </ol>

        {item && <>
          <div className="ki-ask">
            <p>{item.ask}</p>
            <SpeakButton text={item.ask} />
          </div>
          <SceneView key={`${game}-${round.index}`} item={item} playing={round.picked !== null} />

          {round.picked === null
            ? <div className="ki-choices" role="group" aria-label="তোমার আন্দাজ" data-n={shownChoices(item, round.easy).length}>
              {shownChoices(item, round.easy).map((index, k) => {
                const choice = item.choices[index];
                return <button type="button" key={choice.label} className="ki-choice" {...press(() => choose(index))}>
                  {choicePic(choice.pics)}<span>{choice.label}</span>
                  {ghostOn && k === 0 && <Ghost />}
                </button>;
              })}
            </div>
            : !revealed
              ? <p className="ki-watch" aria-live="polite">দেখো কী হয়…</p>
              : <div className="ki-result" aria-live="polite">
                <p className="ki-match">{matchLine(round.picked === item.answer)}</p>
                <p className="ki-what">{item.result}</p>
                <p className="ki-why">{item.why}</p>
                <p className="ki-home"><b>বাসায় করে দেখো (বড়দের সাথে):</b> {item.home}</p>
                <button type="button" className="kit-primary ki-next" onClick={goNext}>{last ? "শেষ" : "পরেরটা"}</button>
              </div>}
        </>}

        {phase === "end" && (
          <div className="ki-over" role="status">
            <StarReveal count={stars} />
            <p className="ki-end-line">{endLine(round.right, round.items.length)}</p>
            <p className="ki-end-note">{methodLine(round.right, round.items.length)}</p>
            <p className="ki-end-note">এবার বড়দের সাথে একটা ‘বাসায় করে দেখো’ বেছে নাও।</p>
            <div className="ki-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.level < LEVEL_COUNT && <button type="button" className="kk-link ki-onward" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের ধাপ: {levelOf(round.level + 1).title}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="ki-over">
            <p className="ki-end-line">আজকের পরীক্ষাগার বন্ধ।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>নতুন খেলা</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`আজ ${bn(today.count)}টা প্রশ্ন: ${today.items.map(one => one.card).join(", ")}`} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="ki-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={round.level} noun="ধাপ" onPick={pick => restart(pick)} />
      </details>
      <div className="ki-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="কী হবে বলো তো?" text="আগে আন্দাজ, তারপর দেখা: নারকেল ভাসে কেন, আকাশ নীল কেন। ৫–১০ বছরের বিজ্ঞানের খেলা, ফ্রি।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
