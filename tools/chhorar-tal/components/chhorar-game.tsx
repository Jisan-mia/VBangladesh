"use client";
// IP: what we avoided — no YouTube-rhyme-channel characters, tunes or look, no Sisimpur or textbook art, no Nazrul/Jasimuddin or any modern author's rhyme; only folk ছড়া, our own flat drawings and a synthesized ঢোল.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { buzz, confetti, makeRng, newSeed, sfx, shake, soundOn, useGameLoop, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, bn, speak, useKidsSession } from "../../../shared/kids-kit";
import { drawCard, FOOTER, loadPicture, type CardData } from "../lib/draw-card";
import { LEVEL_COUNT, OG_DEMO, beatPlan, cardTitle, choicesFor, isOgHash, levelOf, nearBeat, rhymeForLevel, starsOf, wordBeats, windowFor, type Beat } from "../lib/game";
import { pictureOf, type Picture } from "../lib/pictures";
import { bare, isBlank, rhymeOf, wordsOf, type Rhyme } from "../lib/rhymes";
import { beatThump, softMiss, tapOffBeat, tapOnBeat } from "../lib/sound";

const TOOL = "chhorar-tal";
const NEXT_MS = 1800;
type Phase = "ready" | "beat" | "rhyme" | "done" | "idle";
type Result = { level: number; stars: number; hits: number; words: number; firstTry: boolean };

function Art({ picture, className }: { picture: Picture; className: string }) {
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: picture.art }} />;
}

function DrumArt() {
  return <svg className="ct-drum-art" viewBox="0 0 140 90" aria-hidden="true">
    <rect x="16" y="10" width="108" height="70" rx="32" fill="#b5651d" stroke="#5b3510" strokeWidth="4" />
    <path d="M30 13 L42 77 L54 13 L66 77 L78 13 L90 77 L102 13 L112 70" fill="none" stroke="#f3e2c0" strokeWidth="3.5" strokeLinejoin="round" />
    <ellipse cx="17" cy="45" rx="11" ry="34" fill="#f3e2c0" stroke="#5b3510" strokeWidth="4" />
    <ellipse cx="123" cy="45" rx="11" ry="34" fill="#f3e2c0" stroke="#5b3510" strokeWidth="4" />
  </svg>;
}

/** The ghost finger that taps the drum in time, so a child who can't read yet sees what to do. */
function Finger() {
  return <span className="ct-ghost-at" aria-hidden="true"><svg className="ct-ghost" viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#3a2a1c" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.footer} ${data.drum}`);
      const picture = await loadPicture(rhymeOf(data.rhyme)?.answer ?? "");
      if (live && ref.current) drawCard(ref.current, data, picture, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} />;
}

/** One line of the ছড়া as whole words: the one under the beat lights, those already said stay dark, the rest wait faded. */
function Line({ rhyme, line, now, said, blanks, filled, className }: { rhyme: Rhyme; line: number; now: number; said: boolean; blanks: boolean; filled: boolean; className: string }) {
  return <p className={className}>{wordsOf(rhyme.lines[line]).map((word, index) => {
    const blank = blanks && isBlank(rhyme, line, index), core = bare(word);
    const state = said || index < now ? "said" : index === now ? "now" : "";
    return <span key={index}>{index > 0 && " "}{blank
      ? <><span className={`ct-blank${filled ? " filled" : ""}`}>{filled ? core : " "}</span>{word.slice(core.length)}</>
      : <span className={`ct-word ${state}`}>{word}</span>}</span>;
  })}</p>;
}

export function ChhorarGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [level, setLevel] = useState(1);
  const [beatIndex, setBeatIndex] = useState(-1);
  const [pulse, setPulse] = useState(false);
  const [glow, setGlow] = useState({ n: 0, near: false, on: false });
  const glowTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [choices, setChoices] = useState<Picture[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [touched, setTouched] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const picked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const run = useRef({ plan: [] as Beat[], elapsed: 0, last: -1, on: false, ended: false, hits: new Set<number>(), missRun: 0, hitRun: 0, lastGlow: 0 });

  const spec = levelOf(level), rhyme = rhymeForLevel(level);

  // On return, start at the first open level without stars, unless the child already chose one.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    const open = Array.from({ length: levels.unlocked }, (_, i) => i + 1);
    setLevel(open.find(n => !levels.stars[n]) ?? levels.unlocked);
  }, [levels.loaded, levels.unlocked, levels.stars]);

  // `#og`: the site's preview image only. A fixed result, the parent card open; nothing saved, no daily-limit check.
  useEffect(() => {
    if (!isOgHash(location.hash)) return;
    picked.current = true;
    setLevel(OG_DEMO.level);
    setResult({ ...OG_DEMO, firstTry: true });
    setPhase("done");
    setShowing(true);
  }, []);

  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(glowTimer.current); }, []);

  const start = useCallback((next: number) => {
    clearTimeout(timer.current);
    sfx.tap(); // starts the phone's audio from inside the tap
    run.current = { plan: beatPlan(rhymeForLevel(next)), elapsed: 0, last: -1, on: false, ended: false, hits: new Set(), missRun: 0, hitRun: 0, lastGlow: 0 };
    setLevel(next);
    setBeatIndex(-1);
    setResult(null);
    setTouched(false);
    setPhase("beat");
  }, []);

  const toRhyme = () => {
    setChoices(choicesFor(rhyme, spec.choices, makeRng(newSeed())));
    setWrong([]);
    setSolved(false);
    setPhase("rhyme");
  };

  // The steady beat: one word per beat, counted from play time only (a hidden tab pauses it, with no catch-up).
  useGameLoop(dt => {
    const r = run.current;
    if (r.ended) return;
    r.elapsed += dt * 1000;
    const index = Math.floor(r.elapsed / spec.beatMs);
    if (index !== r.last) {
      r.last = index;
      if (index >= r.plan.length) { r.ended = true; setPulse(false); toRhyme(); return; }
      beatThump(r.plan[index].word === 0);
      setBeatIndex(index);
    }
    const on = r.elapsed - index * spec.beatMs < 280;
    if (on !== r.on) { r.on = on; setPulse(on); }
  }, () => {}, phase === "beat");

  const tap = () => {
    if (phase === "ready") { picked.current = true; start(level); return; }
    if (phase !== "beat") return;
    const r = run.current;
    const { beat, near } = nearBeat(r.elapsed, spec.beatMs, windowFor(spec.windowMs, r.missRun, r.hitRun));
    if (near) {
      tapOnBeat(); buzz(8);
      r.hitRun++; r.missRun = 0;
      if (r.plan[beat]?.word >= 0) r.hits.add(beat);
    } else {
      tapOffBeat();
      r.missRun++; r.hitRun = 0;
    }
    setTouched(true);
    // A glow at most about three times a second, however fast the taps come.
    const now = performance.now();
    if (now - r.lastGlow > 340) {
      r.lastGlow = now;
      setGlow(g => ({ n: g.n + 1, near, on: true }));
      clearTimeout(glowTimer.current);
      glowTimer.current = setTimeout(() => setGlow(g => ({ ...g, on: false })), 380);
    }
  };

  const onPointer = (event: PointerEvent<HTMLButtonElement>) => { if (event.isPrimary) tap(); };
  const onKey = (event: KeyboardEvent<HTMLButtonElement>) => { if ((event.key === "Enter" || event.key === " ") && !event.repeat) { event.preventDefault(); tap(); } };

  const finish = () => {
    const words = wordBeats(run.current.plan), hits = run.current.hits.size, firstTry = wrong.length === 0;
    const stars = starsOf(hits, words, firstTry), before = levels.stars;
    const wasComplete = Object.keys(before).length >= LEVEL_COUNT;
    levels.record(level, stars);
    // Confetti only once every ছড়া has its first star; otherwise a short chime.
    if (!wasComplete && Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(n => n === level || before[n])) confetti(); else sfx.win();
    setResult({ level, stars, hits, words, firstTry });
    setPhase("done");
    atBreak();
  };

  const choose = (picture: Picture, element: Element) => {
    if (solved) return;
    if (picture.id !== rhyme.answer) {
      if (wrong.includes(picture.id)) return;
      softMiss();
      shake(element);
      setWrong([...wrong, picture.id]);
      return;
    }
    sfx.good();
    if (soundOn()) speak(rhyme.lines.join(" "));
    setSolved(true);
    timer.current = setTimeout(finish, NEXT_MS);
  };

  const pickLevel = (next: number) => { picked.current = true; start(next); };

  const card = useMemo<CardData | null>(() => {
    if (!result) return null;
    const done = rhymeForLevel(result.level);
    return {
      label: `ছড়ার তালে · ${done.name}`, title: cardTitle(done.lines.length, bn), stars: result.stars, rhyme: done.id, footer: FOOTER,
      drum: result.hits ? `ঢোলে ${bn(result.hits)} বার তাল` : "ঢোলের তাল শুনলাম",
    };
  }, [result]);

  const fresh = levels.loaded && Object.keys(levels.stars).length === 0;
  const beat = run.current.plan[beatIndex];
  const pass = beat?.pass ?? 0, current = Math.max(0, beat?.line ?? 0);
  const hint = !solved && choices.length > 0 && wrong.length >= Math.min(2, choices.length - 1);
  const answer = pictureOf(rhyme.answer)!;
  const partner = bare(rhyme.partner);

  return <div className={`ct${slow ? " ct-slow" : ""}`} style={{ "--beat": `${spec.beatMs}ms` } as CSSProperties}>
    <div className="ct-stage">
      <div className="ct-tools">
        <button type="button" className="ct-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
        <SoundToggle compact />
      </div>

      {phase === "ready" && <>
        <p className="ct-name">{rhyme.name}</p>
        <p className="ct-cue">ঢোলে চাপ দাও, ছড়া শুরু হবে।</p>
      </>}

      {phase === "beat" && <>
        <ol className="ct-passes" aria-label={`দুইবারের মধ্যে ${bn(pass + 1)} নম্বর বার`}>
          {[0, 1].map(n => <li key={n} className={n < pass ? "done" : n === pass ? "now" : ""} />)}
        </ol>
        <div className="ct-lines" aria-live="off">
          {Array.from({ length: current }, (_, line) => <Line key={`${pass}-${line}`} rhyme={rhyme} line={line} now={-1} said blanks={false} filled={false} className="ct-past" />)}
          <Line key={`${pass}-${current}`} rhyme={rhyme} line={current} now={beat && beat.line === current ? (beat.word >= 0 ? beat.word : 99) : -1} said={false} blanks={false} filled={false} className="ct-now" />
        </div>
      </>}

      {(phase === "rhyme" || phase === "done") && <div className="ct-lines ct-whole">
        {rhyme.lines.map((_, line) => <Line key={line} rhyme={rhyme} line={line} now={-1} said blanks filled={phase === "done" || solved} className="ct-all" />)}
      </div>}

      {phase === "idle" && <p className="ct-cue">আজকের মতো হলো।<br />এবার আম্মুর সাথে হাতে তালি দিয়ে ছড়াটা বলো।</p>}
    </div>

    {(phase === "ready" || phase === "beat") && <div className="ct-drum-row">
      <button type="button" className={`ct-drum${pulse ? " beat" : ""}`} aria-label={phase === "ready" ? `ঢোল: ${rhyme.name} শুরু করো` : "ঢোল বাজাও"}
        onPointerDown={onPointer} onKeyDown={onKey}>
        <DrumArt />
        {glow.on && phase === "beat" && <span key={glow.n} className={`ct-ring${glow.near ? " near" : ""}`} aria-hidden="true" />}
        {fresh && (phase === "ready" || (!touched && pass === 0 && current === 0)) && <Finger />}
      </button>
    </div>}

    {phase === "rhyme" && <>
      <p className="ct-ask">কোনটা মেলে <b>{partner}</b>-এর সাথে?</p>
      <ul className={`ct-choices n${choices.length}`} aria-label="মিলের শব্দটা কোনটা? ছবিটা চাপো">
        {choices.map(picture => {
          const right = picture.id === rhyme.answer;
          const state = solved && right ? "right" : wrong.includes(picture.id) ? "wrong" : hint && right ? "hint" : "";
          return <li key={picture.id}>
            <button type="button" className={`ct-choice ${state}`} aria-label={picture.bn} data-ok={right ? "1" : undefined}
              disabled={solved && !right} onClick={event => { sfx.tap(); choose(picture, event.currentTarget); }}>
              <Art picture={picture} className="ct-pic" />
              <span className="ct-label">{picture.bn}</span>
            </button>
          </li>;
        })}
      </ul>
    </>}

    {phase === "done" && result && <div className="ct-done">
      <StarReveal count={result.stars} />
      <h2>{rhymeForLevel(result.level).name}, তালে তালে বললে।</h2>
      {result.words > 0 && result.hits / result.words >= 0.5
        ? <p className="ct-method">ঢোলের শব্দ শুনে শুনে চাপ দিয়েছ, তাই তালে মিলেছে।</p>
        : result.firstTry && <p className="ct-method">{partner} আর {answer.bn}: শেষটা কানে মিলিয়ে খুঁজে পেলে।</p>}
      <div className="ct-pair">
        <button type="button" className="kit-primary" onClick={() => pickLevel(result.level)}>আবার খেলো</button>
        <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    <div className="ct-levels">
      <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={phase === "beat" || phase === "rhyme" ? level : undefined} onPick={pickLevel} noun="ছড়া" />
    </div>

    {card && result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `chhorar-tal-${card.rhyme}.png`,
      make: async () => { const picture = await loadPicture(rhymeForLevel(result.level).answer); return renderCard(canvas => drawCard(canvas, card, picture, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={card} /></div>
      <p className="ct-parent-line"><b>বড়দের জন্য:</b> তাল ধরা আর শেষের মিল শোনা, পড়তে শেখার আগের ধাপ। আজ রাতে ছড়াটা একসাথে বলো, প্রতি শব্দে একটা তালি। {rhymeForLevel(result.level).source}।</p>
    </ShowParent>}
    {resting && <RestScreen onExtend={extend} />}

    <div className="ct-gate">
      <ParentGate><ShareToolLink title="ছড়ার তালে" text="হাট্টিমা টিম টিম, আতা গাছে তোতা পাখি: ঢোলে তাল দিয়ে পুরোনো ছড়া বলার খেলা। ৩–৬ বছরের জন্য।" /></ParentGate>
    </div>
  </div>;
}
