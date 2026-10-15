"use client";
// IP: what we avoided — no NCTB textbook letters, stroke charts or pictures, no TV or app characters; the strokes are our own, the letters come from the open Noto font, the pictures are অ-তে অজগর's own drawings.

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { buzz, confetti, sfx, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, cardFontSample, drawCard, drawPic } from "../lib/draw-card";
import { LEVEL_COUNT, bn, endLine, levelOf, pictureOf } from "../lib/levels";
import { pathOf, strokesOf, type Pt } from "../lib/strokes";
import { againLetter, done, down, finishStroke, letterOf, move, nearPath, newRound, nextLetter, starsOf, strokeOf, up, type Event, type Round } from "../lib/trace";
import { Arrow, GuideLetter, StartDot, StrokeLine } from "./marks";
import { PrintSheet } from "./print-sheet";

const TOOL = "borno-likhi";
const OG_LETTERS = ["অ", "আ", "ই", "ঈ", "উ", "ঊ"];
const HAND = "M14 30V8a5 5 0 0 1 10 0v16l12 2a6 6 0 0 1 5 7l-2 13a10 10 0 0 1-10 9H19a9 9 0 0 1-7-4L3 39a4.5 4.5 0 0 1 7-5z";

/** The letter's little bell when it turns into its picture. */
const chime = () => { tone(1319, 0.45, 0.06, "sine", 0.05); tone(1976, 0.5, 0.035, "sine", 0.12); };

export function LikhiGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [round, setRound] = useState<Round>(() => newRound(1));
  const [game, setGame] = useState(0);
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<string[]>([]);
  const [showing, setShowing] = useState(false);
  const [print, setPrint] = useState<number | null>(null);
  const [demo, setDemo] = useState<{ id: number; loop: boolean } | null>(null);
  const live = useRef(round);
  const touched = useRef(false);
  const picked = useRef(false);
  const board = useRef<SVGSVGElement>(null);
  const ink = useRef<SVGPathElement>(null), fill = useRef<SVGPathElement>(null), finger = useRef<SVGCircleElement>(null);
  const demoLine = useRef<SVGPathElement>(null), demoPen = useRef<SVGGElement>(null);
  const card = useRef<HTMLCanvasElement>(null), pic = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null), last = useRef<Pt | null>(null), inkPath = useRef(""), inkOn = useRef(false), ticked = useRef(0);

  // ?print opens the A4 sheet; #og opens a fixed card for the site's preview image and saves nothing.
  useEffect(() => {
    const wanted = new URLSearchParams(location.search).get("print");
    if (wanted !== null) setPrint(Math.min(LEVEL_COUNT, Math.max(1, Math.round(Number(wanted)) || 1)));
    if (location.hash === "#og") { setToday(OG_LETTERS); setShowing(true); }
  }, []);

  // Start at the first set without stars; every set stays open so a parent can pick today's homework.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    picked.current = true;
    const start = Array.from({ length: LEVEL_COUNT }, (_, index) => index + 1).find(level => !levels.stars[level]) ?? 1;
    show(newRound(start));
    setGame(count => count + 1);
  }, [levels.loaded, levels.stars]);

  // Each new letter shows its first stroke once; the very first one keeps showing until a finger touches the board.
  useEffect(() => {
    if (phase === "play" && !done(live.current)) setDemo({ id: Date.now(), loop: !touched.current });
  }, [round.index, game, phase]);

  useEffect(() => {
    const line = demoLine.current, pen = demoPen.current;
    const clear = () => { line?.setAttribute("d", ""); pen?.setAttribute("visibility", "hidden"); };
    const stroke = strokeOf(live.current);
    if (!demo || !line || !pen || !stroke || live.current.letterDone) { clear(); return; }
    const samples = stroke.samples;
    const place = (i: number) => {
      line.setAttribute("d", pathOf(samples.slice(0, i + 1)));
      pen.setAttribute("transform", `translate(${samples[i][0].toFixed(1)} ${samples[i][1].toFixed(1)})`);
      pen.setAttribute("visibility", "visible");
    };
    if (slow) { // no motion: the whole stroke lights up, the finger rests on the start dot
      place(samples.length - 1);
      pen.setAttribute("transform", `translate(${samples[0][0]} ${samples[0][1]})`);
      const timer = demo.loop ? undefined : setTimeout(() => { clear(); setDemo(null); }, 2500);
      return () => { clearTimeout(timer); clear(); };
    }
    const ms = 600 + stroke.length * 18;
    let start = performance.now(), frame = 0;
    const tick = (now: number) => {
      const t = (now - start) / ms;
      if (t > 1.6) {
        if (!demo.loop) { clear(); setDemo(null); return; }
        start = now;
      }
      place(Math.round(Math.min(1, Math.max(0, t)) * (samples.length - 1)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); clear(); };
  }, [demo, slow]);

  useEffect(() => {
    const canvas = pic.current;
    if (!round.letterDone || !canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, canvas.width, canvas.height);
    drawPic(c, pictureOf(letterOf(round)).pic, canvas.width / 2, canvas.height / 2, canvas.width * 0.9);
  }, [round]);

  const cardLetters = [...new Set(today)];
  useEffect(() => {
    if (!showing) return;
    let on = true;
    const letters = [...new Set(today)];
    loadCardFonts(cardFontSample(letters)).then(() => { if (on && card.current) drawCard(card.current, letters, location.host); });
    return () => { on = false; };
  }, [showing, today]);

  function show(next: Round) { live.current = next; setRound(next); }
  function paintFill() {
    const now = live.current, stroke = strokeOf(now);
    fill.current?.setAttribute("d", stroke && !now.letterDone && now.reach > 0 ? pathOf(stroke.samples.slice(0, now.reach + 1)) : "");
  }
  function clearInk() { inkPath.current = ""; inkOn.current = false; ink.current?.setAttribute("d", ""); }

  function handle([next, event]: [Round, Event]) {
    live.current = next;
    paintFill();
    if (!event) {
      if (next.reach - ticked.current >= 6) { ticked.current = next.reach; tone(420 + next.reach * 6, 0.05, 0.03, "sine"); }
      return;
    }
    ticked.current = 0;
    clearInk();
    if (event === "stroke") { tone(880, 0.12, 0.06, "triangle"); buzz(8); }
    if (event === "letter") {
      chime(); buzz(12);
      const char = letterOf(next);
      speak(pictureOf(char).label);
      setToday(before => [...before, char]);
    }
    if (event === "help") setDemo({ id: Date.now(), loop: false });
    setRound(next);
  }

  const toBox = (event: PointerEvent<SVGSVGElement>): Pt => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100];
  };
  function trail(point: Pt) {
    finger.current?.setAttribute("cx", point[0].toFixed(1));
    finger.current?.setAttribute("cy", point[1].toFixed(1));
    if (!nearPath(live.current, point)) { inkOn.current = false; return; }
    inkPath.current += `${inkOn.current ? "L" : "M"}${point[0].toFixed(1)} ${point[1].toFixed(1)}`;
    inkOn.current = true;
    ink.current?.setAttribute("d", inkPath.current);
  }

  function onDown(event: PointerEvent<SVGSVGElement>) {
    if (!event.isPrimary || pointer.current !== null || phase !== "play" || live.current.letterDone) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* a synthetic or already-lifted pointer */ }
    pointer.current = event.pointerId;
    touched.current = true;
    setDemo(null);
    sfx.tap();
    const point = toBox(event);
    last.current = point;
    finger.current?.setAttribute("visibility", "visible");
    inkOn.current = false;
    trail(point);
    handle(down(live.current, point));
  }
  function onMove(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerId !== pointer.current) return;
    const point = toBox(event);
    trail(point);
    handle(move(live.current, last.current ?? point, point));
    last.current = point;
  }
  function onUp(event: PointerEvent<SVGSVGElement>) {
    if (event.pointerId !== pointer.current) return;
    pointer.current = null; last.current = null; inkOn.current = false;
    finger.current?.setAttribute("visibility", "hidden");
    handle(up(live.current));
  }
  function onKey(event: KeyboardEvent<SVGSVGElement>) {
    if ((event.key !== "Enter" && event.key !== " ") || live.current.letterDone || done(live.current)) return;
    event.preventDefault();
    sfx.tap();
    handle(finishStroke(live.current));
  }

  function goNext() {
    sfx.tap();
    clearInk();
    const now = live.current, moved = nextLetter(now);
    if (!done(moved)) { show(moved); return; }
    const earned = starsOf(now.helps), first = !levels.stars[now.level];
    levels.record(now.level, earned);
    setStars(earned);
    sfx.win();
    if (first) confetti(); // a whole set written for the first time
    show(moved);
    atBreak();
    setPhase("end");
  }
  function again() { sfx.tap(); clearInk(); show(againLetter(live.current)); setGame(count => count + 1); }
  function restart(level = live.current.level) {
    clearInk();
    show(newRound(level, live.current.pace));
    setGame(count => count + 1);
    setPhase("play");
  }

  if (print !== null) return <PrintSheet level={print} />;

  const spec = levelOf(round.level), playing = !done(round);
  const letter = playing ? letterOf(round) : spec.letters[spec.letters.length - 1];
  const strokes = strokesOf(letter), current = strokeOf(round), picture = pictureOf(letter);
  const lastLetter = round.index + 1 >= round.letters.length;

  return (
    <div className="bl" data-slow={slow || undefined}>
      <div className="bl-play">
        <div className="bl-top">
          <p className="bl-level"><b>সেট {bn(round.level)}</b> <span>{spec.title}</span></p>
          <button type="button" className="bl-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
          <SoundToggle compact />
        </div>
        <ol className="bl-chips" aria-label={`${bn(round.letters.length)}টার মধ্যে ${bn(Math.min(round.index + 1, round.letters.length))} নম্বর`}>
          {round.letters.map((char, index) => <li key={char} className={index < round.index || (index === round.index && round.letterDone) ? "is-done" : index === round.index ? "is-now" : ""}>{char}</li>)}
        </ol>

        {phase === "play" && playing && <>
          <svg ref={board} key={`${game}-${round.index}`} className={`bl-board${round.letterDone ? " is-done" : ""}`} viewBox="0 0 100 100" tabIndex={0}
            role="img" aria-label={round.letterDone ? `${letter} লেখা হয়ে গেছে` : `${letter} লেখার ঘর: ${bn(strokes.length)}টা দাগের ${bn(round.stroke + 1)} নম্বর। আঙুলে টানো, কিবোর্ডে Enter।`}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
            <GuideLetter char={letter} />
            {strokes.map((stroke, index) => <StrokeLine key={index} stroke={stroke}
              className={index < round.stroke || round.letterDone ? "bl-done-line" : index === round.stroke ? "bl-now" : "bl-later"} />)}
            <path ref={fill} className="bl-fill" />
            <path ref={demoLine} className="bl-demo" />
            <path ref={ink} className="bl-ink" />
            {current && !round.letterDone && <>
              <Arrow stroke={current} />
              <StartDot stroke={current} n={round.stroke + 1} className="bl-start bl-glow" />
            </>}
            <circle ref={finger} className="bl-finger" r={4} visibility="hidden" />
            <g ref={demoPen} className="bl-demo-pen" visibility="hidden" aria-hidden="true">
              <circle r={3.2} />
              <path d={HAND} transform="translate(-6 -0.4) scale(0.42)" />
            </g>
          </svg>

          <div className="bl-under" aria-live="polite">
            {round.letterDone
              ? <>
                <canvas ref={pic} className="bl-pic" width={200} height={200} aria-hidden="true" />
                <div className="bl-under-text">
                  <p className="bl-word">{picture.label}</p>
                  <div className="bl-under-actions">
                    <button type="button" className="kit-primary" onClick={goNext}>{lastLetter ? "শেষ" : "পরেরটা"}</button>
                    <button type="button" className="kit-secondary" onClick={again}>আবার লিখি</button>
                  </div>
                </div>
              </>
              : <>
                <p className="bl-name"><b>{letter}</b> <span>{picture.label}</span></p>
                <SpeakButton text={picture.label} />
                <button type="button" className="bl-show" onClick={() => { sfx.tap(); setDemo({ id: Date.now(), loop: false }); }}>
                  <svg viewBox="0 0 48 60" aria-hidden="true"><path d={HAND} /></svg>দেখাও
                </button>
              </>}
          </div>
        </>}

        {phase === "end" && (
          <div className="bl-over" role="status">
            <StarReveal count={stars} />
            <p className="bl-end-line">{endLine(round.letters)}</p>
            <p className="bl-end-note">এবার খাতায় পেনসিলে একবার করে লেখো। আম্মু-আব্বুকে পাশে বসাও।</p>
            <div className="bl-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.level < LEVEL_COUNT && <button type="button" className="kk-link bl-onward" onClick={() => { sfx.tap(); restart(round.level + 1); }}>পরের সেট: {levelOf(round.level + 1).title}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="bl-over">
            <p className="bl-end-line">আজকের লেখা শেষ। এবার খাতা আর পেনসিল।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>নতুন খেলা</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(cardLetters, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`আজ আঙুলে লেখা: ${cardLetters.join(" ")}`} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="bl-drawer">
        <summary>সব সেট</summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={LEVEL_COUNT} current={round.level} noun="সেট" onPick={level => restart(level)} />
      </details>
      <div className="bl-parent">
        <a className="bl-print-link" href={`/borno-likhi?print=${round.level}`}>এই সেটের খাতার পাতা প্রিন্ট করো (A4)</a>
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="বর্ণ লিখি" text="অ আ ক খ আর ০–৯ আঙুলে লেখার খেলা: কোন দাগ আগে, মাত্রা কখন। ৪–৭ বছর, ফ্রি।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন সেটে কয় তারা, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
