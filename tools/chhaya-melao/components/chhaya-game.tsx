"use client";
// IP: what we avoided — no shadow-matching app's look or picture set, no textbook or flash-card art, no cartoon characters; every object is our own flat SVG, and each shadow is that same drawing turned dark.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, makeRng, newSeed, sfx, shake, soundOn, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, bn, speak, useKidsSession } from "../../../shared/kids-kit";
import { drawCard, FOOTER, loadPictures, type CardData } from "../lib/draw-card";
import { LEVEL_COUNT, OG_DEMO, ROUND, cardTitle, choiceCount, choicesFor, isOgHash, levelOf, roundTargets, starsOf, turnCss, turnFor, type Turn } from "../lib/game";
import { shapeOf, type Shape } from "../lib/shapes";
import { lampClick, softMiss } from "../lib/sound";

const TOOL = "chhaya-melao";
const NEXT_MS = 1500;
type Phase = "dark" | "play" | "done" | "idle";
type Round = { level: number; targets: Shape[]; index: number; choices: Shape[]; turn: Turn; wrong: string[]; solved: boolean; firstTry: number; missRun: number; rightRun: number; touched: boolean };
type Result = { level: number; stars: number; ids: string[]; clean: boolean };

function Art({ shape, className, style }: { shape: Shape; className: string; style?: CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: shape.art }} />;
}

/** The ghost finger that shows the first tap, so a child who can't read yet knows where to press. */
function Finger() {
  return <span className="cm-ghost-at" aria-hidden="true"><svg className="cm-ghost" viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2f2a3a" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

function Lamp() {
  return <svg className="cm-lamp" viewBox="0 0 60 60" aria-hidden="true"><path d="M30 0 V14" stroke="#5d4037" strokeWidth="3" /><path d="M14 30 Q14 14 30 14 Q46 14 46 30 Z" fill="#7a4fb5" /><circle className="cm-bulb" cx="30" cy="33" r="7" /></svg>;
}

function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.footer} ${data.ids.map(id => shapeOf(id)?.bn).join(" ")}`);
      const pictures = await loadPictures(data.ids);
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} />;
}

function newItem(round: Round, index: number, rng: () => number): Round {
  const spec = levelOf(round.level), target = round.targets[index];
  const count = choiceCount(spec.choices, round.missRun, round.rightRun);
  return { ...round, index, choices: choicesFor(target, count, spec.kin, rng), turn: turnFor(spec.turned, rng), wrong: [], solved: false };
}

export function ChhayaGame() {
  const [phase, setPhase] = useState<Phase>("dark");
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<Round | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const rng = useRef<() => number>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const picked = useRef(false);

  // On return, start at the first open level without stars, unless the child already chose one.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    const open = Array.from({ length: levels.unlocked }, (_, i) => i + 1);
    setLevel(open.find(n => !levels.stars[n]) ?? levels.unlocked);
  }, [levels.loaded, levels.unlocked, levels.stars]);

  // `#og`: the site's preview image only. A fixed result, the parent card open; nothing saved, no daily-limit check.
  useEffect(() => {
    if (!isOgHash(location.hash)) return;
    setResult({ level: OG_DEMO.level, stars: OG_DEMO.stars, ids: OG_DEMO.ids, clean: true });
    setPhase("done");
    setShowing(true);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = useCallback((next: number) => {
    clearTimeout(timer.current);
    rng.current = makeRng(newSeed());
    const base: Round = { level: next, targets: roundTargets(rng.current), index: 0, choices: [], turn: "none", wrong: [], solved: false, firstTry: 0, missRun: 0, rightRun: 0, touched: false };
    lampClick();
    setLevel(next);
    setRound(newItem(base, 0, rng.current));
    setResult(null);
    setPhase("play");
  }, []);

  const finish = (done: Round) => {
    const stars = starsOf(done.firstTry), before = levels.stars;
    const wasComplete = Object.keys(before).length >= LEVEL_COUNT;
    levels.record(done.level, stars);
    // Confetti only once every level has its first star; otherwise a short chime.
    if (!wasComplete && Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(n => n === done.level || before[n])) confetti(); else sfx.win();
    setResult({ level: done.level, stars, ids: done.targets.map(t => t.id), clean: done.firstTry === ROUND });
    setPhase("done");
    atBreak();
  };

  const choose = (shape: Shape, element: Element) => {
    if (!round || round.solved) return;
    const target = round.targets[round.index];
    if (shape.id !== target.id) {
      if (round.wrong.includes(shape.id)) return;
      softMiss();
      shake(element);
      setRound({ ...round, wrong: [...round.wrong, shape.id], touched: true });
      return;
    }
    sfx.good();
    if (soundOn()) speak(target.bn);
    const first = round.wrong.length === 0;
    const solved: Round = { ...round, solved: true, touched: true, firstTry: round.firstTry + (first ? 1 : 0), rightRun: first ? round.rightRun + 1 : 0, missRun: first ? 0 : round.missRun + 1 };
    setRound(solved);
    timer.current = setTimeout(() => {
      if (solved.index + 1 >= ROUND) { finish(solved); return; }
      lampClick();
      setRound(newItem(solved, solved.index + 1, rng.current!));
    }, NEXT_MS);
  };

  const pickLevel = (next: number) => { picked.current = true; start(next); };

  const card = useMemo<CardData | null>(() => result && {
    label: `ছায়া মেলাও · ধাপ ${bn(result.level)}`, title: cardTitle(result.ids.length, bn), stars: result.stars, ids: result.ids, footer: FOOTER,
  }, [result]);

  const fresh = levels.loaded && Object.keys(levels.stars).length === 0;
  const target = round && phase === "play" ? round.targets[round.index] : null;
  const hint = !!round && !round.solved && round.wrong.length >= Math.min(2, round.choices.length - 1);

  return <div className={`cm${slow ? " cm-slow" : ""}`}>
    <div className={`cm-wall${phase === "dark" ? "" : " lit"}`}>
      <div className="cm-light" aria-hidden="true" />
      <Lamp />
      <div className="cm-tools">
        <button type="button" className="cm-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
        <SoundToggle compact />
      </div>

      {phase === "dark" && <button type="button" className="cm-switch" aria-label="বাতি জ্বালাও" onClick={() => { picked.current = true; start(level); }}>
        <svg viewBox="0 0 60 60" aria-hidden="true"><rect x="14" y="6" width="32" height="48" rx="8" fill="#fff" /><rect x="22" y="14" width="16" height="16" rx="4" fill="#7a4fb5" /><circle cx="30" cy="42" r="4" fill="#d6c8ea" /></svg>
        {fresh && <Finger />}
      </button>}

      {target && round && <>
        <ol className="cm-dots" aria-label={`${bn(ROUND)}টার মধ্যে ${bn(round.index + 1)} নম্বর ছায়া`}>
          {round.targets.map((t, i) => <li key={t.id} className={i < round.index || (i === round.index && round.solved) ? "done" : i === round.index ? "now" : ""} />)}
        </ol>
        <div className="cm-cast" key={`${round.targets[0].id}-${round.index}`} style={{ "--turn": turnCss[round.turn] } as CSSProperties}>
          <Art shape={target} className={`cm-shadow${round.wrong.length && !round.solved ? " look" : ""}`} />
          {round.solved && <Art shape={target} className="cm-object" />}
        </div>
        <p className="cm-name" role="status" aria-live="polite">{round.solved ? target.bn : ""}</p>
      </>}

      {phase === "done" && result && <div className="cm-lit-done" aria-hidden="true">
        {result.ids.slice(0, 3).map(id => <Art key={id} shape={shapeOf(id)!} className="cm-mini" />)}
      </div>}
      {phase === "idle" && <p className="cm-idle">আজকের মতো হলো।<br />এবার ঘরে একটা ছায়া খুঁজে আম্মুকে দেখাও।</p>}
    </div>

    {phase === "play" && round && <ul className={`cm-choices n${round.choices.length}`} aria-label="কার ছায়া? ছবিটা চাপো">
      {round.choices.map(shape => {
        const right = shape.id === round.targets[round.index].id;
        const state = round.solved && right ? "right" : round.wrong.includes(shape.id) ? "wrong" : hint && right ? "hint" : "";
        return <li key={shape.id}>
          <button type="button" className={`cm-choice ${state}`} aria-label={shape.bn} data-ok={right ? "1" : undefined}
            disabled={round.solved && !right} onClick={event => choose(shape, event.currentTarget)}>
            <Art shape={shape} className="cm-pic" />
            {fresh && !round.touched && round.index === 0 && right && <Finger />}
          </button>
        </li>;
      })}
    </ul>}

    {phase === "done" && result && <div className="cm-done">
      <StarReveal count={result.stars} />
      <h2>{bn(result.ids.length)}টা ছায়া মেলালে।</h2>
      {result.clean && <p className="cm-method">প্রথমবারেই সবগুলো। ভালো করে দেখে মিলিয়েছ।</p>}
      <ul className="cm-found">{result.ids.map(id => { const shape = shapeOf(id)!; return <li key={id}><Art shape={shape} className="cm-pic" /><span>{shape.bn}</span></li>; })}</ul>
      <div className="cm-pair">
        <button type="button" className="kit-primary" onClick={() => { sfx.pop(); pickLevel(result.level); }}>আবার খেলো</button>
        <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    <div className="cm-levels">
      <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={phase === "play" ? level : undefined} onPick={pickLevel} noun="ধাপ" />
    </div>

    {card && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `chhaya-melao-dhap-${result!.level}.png`,
      make: async () => { const pictures = await loadPictures(card.ids); return renderCard(canvas => drawCard(canvas, card, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={card} /></div>
      <p className="cm-parent-line"><b>বড়দের জন্য:</b> আকার খেয়াল করে মেলানোর এই অভ্যাসটাই পরে ব আর র, প আর ষ আলাদা করে চিনতে কাজে লাগে। রাতে টর্চ জ্বেলে দেয়ালে হাত দিয়ে পাখির ছায়া বানাও, ছোটজনকে বলতে দাও কী হলো।</p>
    </ShowParent>}
    {resting && <RestScreen onExtend={extend} />}

    <div className="cm-gate">
      <ParentGate><ShareToolLink title="ছায়া মেলাও" text="দেয়ালে ছায়া পড়ে, ছোটজন চিনে নেয় কার ছায়া। ৩–৬ বছরের প্রথম খেলা, পড়তে হয় না।" /></ParentGate>
    </div>
  </div>;
}
