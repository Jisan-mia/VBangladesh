"use client";
// IP: what we avoided — no road-safety campaign mascots, textbook or TV characters (no Meena, no Sisimpur look-alikes), no news photos; every drawing is our own flat SVG, and the rules are paraphrased from WHO and SwimSafe/CIPRB guidance.

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, makeRng, newSeed, readLevels, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { SoundToggle, StarReveal, Stars } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, bn, speak, useKidsSession } from "../../../shared/kids-kit";
import { ICONS, sceneMarkup } from "../lib/art";
import { drawCard, loadPictures, type CardData } from "../lib/draw-card";
import { cardTitle, choiceCount, choicesFor, firstOpenSet, starsOf } from "../lib/round";
import { SETS, setFromHash, setOf, type Choice, type SetId } from "../lib/sets";

const TOOL = "nirapode-thaki";
const levelOf = (id: SetId) => SETS.findIndex(item => item.id === id) + 1;

type Round = { set: SetId; index: number; choices: Choice[]; wrong: string[]; solved: boolean; firstTry: number; missRun: number; rightRun: number };
type Phase = "play" | "done" | "idle";

function newRound(id: SetId, rng: () => number): Round {
  return { set: id, index: 0, choices: choicesFor(setOf(id).questions[0], choiceCount(0, 0, 4), rng), wrong: [], solved: false, firstTry: 0, missRun: 0, rightRun: 0 };
}

function Icon({ id, className = "nt-icon" }: { id: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[id] ?? "" }} />;
}

/** The finger that shows the first tap. */
const FINGER = <svg className="nt-ghost" viewBox="0 0 40 52" aria-hidden="true"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2f2a3a" strokeWidth="2.6" strokeLinejoin="round" /></svg>;

function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.rows.map(row => row.text).join(" ")}`);
      const pictures = await loadPictures(data.rows.map(row => row.icon));
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} />;
}

function SetTiles({ current, stars, onPick }: { current: SetId; stars: Record<number, number>; onPick: (id: SetId) => void }) {
  const glow = SETS.find((_, index) => !stars[index + 1])?.id;
  return <ul className="nt-sets">
    {SETS.map((item, index) => <li key={item.id}>
      <button type="button" aria-pressed={item.id === current} className={item.id === glow ? "next" : ""} onClick={() => onPick(item.id)}>
        <Icon id={item.icon} className="nt-set-icon" /><span>{item.bn}</span><Stars count={stars[index + 1] ?? 0} />
      </button>
    </li>)}
  </ul>;
}

export function SafeGame() {
  const rng = useRef(makeRng(1));
  const [round, setRound] = useState<Round>(() => newRound("rasta", rng.current));
  const [phase, setPhase] = useState<Phase>("play");
  const [result, setResult] = useState({ stars: 0 });
  const [touched, setTouched] = useState(false);
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const levels = useLevels(TOOL, SETS.length);
  const set = setOf(round.set), question = set.questions[round.index];
  const board = useRef<HTMLDivElement>(null);

  const start = useCallback((id: SetId) => {
    rng.current = makeRng(newSeed());
    setRound(newRound(id, rng.current));
    setPhase("play");
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(`ektukhani-levels-${TOOL}`); } catch { /* storage blocked */ }
    start(setFromHash(location.hash) ?? firstOpenSet(SETS, readLevels(saved, SETS.length)).id);
    const onHash = () => { const id = setFromHash(location.hash); if (id) start(id); };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, [start]);

  const pickSet = (id: SetId) => {
    sfx.tap();
    history.replaceState(null, "", `#s=${id}`);
    start(id);
    board.current?.scrollIntoView({ block: "nearest" });
  };

  const choose = (choice: Choice, element: Element) => {
    if (round.solved || phase !== "play") return;
    setTouched(true);
    if (choice.id === question.right.id) {
      sfx.good();
      speak(question.rule);
      const first = round.wrong.length === 0;
      setRound(r => ({ ...r, solved: true, firstTry: r.firstTry + (first ? 1 : 0), rightRun: first ? r.rightRun + 1 : 0, missRun: first ? 0 : r.missRun + 1 }));
      return;
    }
    if (round.wrong.includes(choice.id)) return;
    // A soft low note and a small wobble: never a buzzer.
    tone(330, 0.14, 0.06, "sine", 0, 262);
    shake(element);
    setRound(r => ({ ...r, wrong: [...r.wrong, choice.id] }));
  };

  const finish = () => {
    const stars = starsOf(round.firstTry, set.questions.length), level = levelOf(set.id);
    const before = levels.stars, wasComplete = SETS.every((_, index) => before[index + 1]);
    levels.record(level, stars);
    const nowComplete = SETS.every((_, index) => index + 1 === level || before[index + 1]);
    if (nowComplete && !wasComplete) confetti(); else sfx.win();
    setResult({ stars });
    setPhase("done");
    atBreak();
  };

  const next = () => {
    sfx.tap();
    if (round.index + 1 >= set.questions.length) { finish(); return; }
    setRound(r => {
      const index = r.index + 1, ask = set.questions[index];
      return { ...r, index, wrong: [], solved: false, choices: choicesFor(ask, choiceCount(r.missRun, r.rightRun, ask.wrong.length + 1), rng.current) };
    });
  };

  const hint = round.wrong.length >= 2 && !round.solved;
  const ghost = !touched && round.index === 0 && !levels.stars[levelOf(set.id)] && levels.loaded;
  const last = round.index + 1 >= set.questions.length;
  const cardData: CardData = {
    label: `নিরাপদে থাকি · ${set.bn}`, title: cardTitle(set, bn), stars: result.stars,
    rows: set.questions.map(item => ({ icon: item.right.icon, text: item.rule })),
  };

  return <div className={`nt${slow ? " nt-slow" : ""}`}>
    <div className="nt-bar">
      <p className="nt-where"><b>{set.bn}</b><span>{bn(round.index + 1)}/{bn(set.questions.length)}</span></p>
      <button type="button" className="nt-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
      <SoundToggle compact />
    </div>

    <div className="nt-board" ref={board}>
      {phase === "play" && <>
        <div className={`nt-scene${round.solved ? " solved" : ""}`}>
          <svg viewBox="0 0 320 160" aria-hidden="true" dangerouslySetInnerHTML={{ __html: sceneMarkup(set.scene, question.prop) }} />
          {round.solved && <span className="nt-badge gx-pop"><Icon id={question.right.icon} /></span>}
        </div>

        <div className="nt-ask">
          <p>{question.ask}</p>
          <SpeakButton text={question.ask} />
        </div>

        <ul className={`nt-choices n${round.choices.length}`}>
          {round.choices.map(choice => {
            const right = choice.id === question.right.id;
            const state = round.solved && right ? "right" : round.wrong.includes(choice.id) ? "wrong" : hint && right ? "hint" : "";
            return <li key={choice.id}>
              <button type="button" className={`nt-choice ${state}`} data-ok={right ? "1" : undefined} disabled={round.solved && !right}
                onClick={event => choose(choice, event.currentTarget)}>
                <Icon id={choice.icon} /><span>{choice.bn}</span>
                {ghost && right && <span className="nt-ghost-at">{FINGER}</span>}
              </button>
            </li>;
          })}
        </ul>

        <div className="nt-after" role="status" aria-live="polite">
          {round.solved
            ? <>
                <p className="nt-why">{question.why}</p>
                <button type="button" className="kit-primary nt-next" onClick={next}>{last ? "দেখো কী শিখলে" : "পরেরটা"} <span aria-hidden="true">→</span></button>
              </>
            : round.wrong.length > 0 && <p className="nt-try"><b>আরেকবার ভাবো।</b> {question.hint}</p>}
        </div>
      </>}

      {phase === "done" && <div className="nt-done">
        <StarReveal count={result.stars} />
        <h2>{cardTitle(set, bn)}</h2>
        <ul className="nt-rules">{set.questions.map(item => <li key={item.id}><Icon id={item.right.icon} /><span>{item.rule}</span></li>)}</ul>
        <p className="nt-away">{set.away}</p>
        <div className="nt-pair">
          <button type="button" className="kit-primary" onClick={() => { sfx.pop(); start(set.id); }}>আবার খেলো</button>
          <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
        </div>
        <ShowParentButton onClick={() => setShowing(true)} />
      </div>}

      {phase === "idle" && <div className="nt-idle">
        <p>খেলা শেষ। আবার খেলতে চাইলে একটা দৃশ্য বেছে নাও।</p>
        <SetTiles current={set.id} stars={levels.stars} onPick={pickSet} />
      </div>}
    </div>

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `nirapode-thaki-${set.id}.png`,
      make: async () => { const pictures = await loadPictures(cardData.rows.map(row => row.icon)); return renderCard(canvas => drawCard(canvas, cardData, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={cardData} /></div>
      <p className="nt-parent-line"><b>বড়দের জন্য:</b> {set.parent.fact} {set.parent.action} <small>সূত্র: {set.parent.source}</small></p>
    </ShowParent>
    {resting && <RestScreen onExtend={extend} />}

    <section className="nt-more" aria-labelledby="nt-more-title">
      <h2 id="nt-more-title">কোন দৃশ্যটা খেলবে?</h2>
      {phase !== "idle" && <SetTiles current={set.id} stars={levels.stars} onPick={pickSet} />}
      <div className="nt-gate">
        <ParentGate><ShareToolLink title="নিরাপদে থাকি" text="রাস্তা পার, পুকুরঘাট, চুলা, ঘুড়ির তার, মেলা আর বজ্রপাতে কী করতে হয়, ছোটদের খেলা।" /></ParentGate>
      </div>
    </section>
  </div>;
}
