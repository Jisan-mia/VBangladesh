"use client";
// IP: what we avoided — no Inside Out or any film's emotion characters, colours-as-characters or look, no Sisimpur/Meena faces, no emoji; the faces, children, scenes and icons are our own code art.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, speak, useKidsSession } from "../../../shared/kids-kit";
import { FEELINGS, type Feeling } from "../lib/faces";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  addToday, againLine, alsoLine, bn, chooseKind, endLine, glows, isLast, kindQuestion, mirrorLine, nameFeeling, newRound, nextScene, practised,
  question, sayLine, sceneOf, scenesOf, setOf, SET_COUNT, type Round, type Today,
} from "../lib/scenes";
import { Child, Face, Ghost, KindIcon, SceneArt } from "./art";

const TOOL = "moner-rong";

/** Acts on the first finger at once (a 50ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: (element: HTMLElement) => void) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget); },
});

export function MonerGame() {
  const levels = useLevels(TOOL, SET_COUNT);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const [round, setRound] = useState<Round>(() => newRound(1));
  const [phase, setPhase] = useState<"play" | "end" | "closed">("play");
  const [stars, setStars] = useState(0);
  const [today, setToday] = useState<Today>({ scenes: 0, feelings: [] });
  const [message, setMessage] = useState("");
  const [idle, setIdle] = useState(false);
  const [showing, setShowing] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const picked = useRef(false);

  const scene = sceneOf(round), spec = setOf(round.set), count = scenesOf(round.set).length;
  const tint = round.picked ? FEELINGS[round.picked].light : null;

  // Start where the child left off: the first open set without stars.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    picked.current = true;
    const start = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(open => !levels.stars[open]) ?? levels.unlocked;
    setRound(newRound(start));
  }, [levels.loaded, levels.unlocked, levels.stars]);

  // The ghost finger comes back when the child has waited a while.
  useEffect(() => {
    setIdle(false);
    if (phase !== "play") return;
    const timer = setTimeout(() => setIdle(true), 7000);
    return () => clearTimeout(timer);
  }, [round, phase]);

  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts(cardFontSample).then(() => { if (live && card.current) drawCard(card.current, today, location.host); });
    return () => { live = false; };
  }, [showing, today]);

  function onFace(feeling: Feeling, button: HTMLElement) {
    const { round: next, outcome } = nameFeeling(round, feeling);
    if (outcome === "ignore") { sfx.tap(); return; }
    if (outcome === "again") { tone(330, 0.14, 0.06, "sine"); shake(button); setMessage(againLine(scene)); }
    else { sfx.good(); setMessage(""); speak(sayLine(scene, feeling)); }
    setRound(next);
  }

  function onKind(choice: number) {
    if (round.step !== "kind") return;
    sfx.note(choice ? 4 : 2, 0.3);
    speak(scene.kind[choice].after);
    setRound(chooseKind(round, choice));
  }

  function onNext() {
    const next = nextScene(round);
    if (next) { sfx.tap(); setRound(next); speak(sceneOf(next).text); return; }
    const earned = practised(levels.stars[round.set] ?? 0);
    levels.record(round.set, earned);
    setStars(earned);
    setToday(before => addToday(before, round));
    sfx.win();
    if (round.set === SET_COUNT) confetti();
    atBreak();
    setPhase("end");
  }

  function restart(set = round.set) {
    // The quiet ease carries over to the next round until five first-try fits lift it.
    setRound(newRound(set, round.eased && round.rightRun < 5, round.rightRun));
    setMessage(""); setPhase("play");
  }

  const first = today.scenes === 0 && round.index === 0 && round.tries === 0 && round.set === 1;
  const ghostFace = round.step === "name" && (first || idle || glows(round)) ? scene.feels.find(feeling => round.faces.includes(feeling)) : null;
  const said = round.picked ? `${sayLine(scene, round.picked)} ${alsoLine(scene, round.picked)}`.trim() : "";

  return (
    <div className="mr" data-slow={slow || undefined}>
      <div className="mr-play">
        <div className="mr-top">
          <p className="mr-level"><b>ধাপ {bn(round.set)}</b> <span>{spec.title}</span></p>
          <button type="button" className="mr-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle compact />
        </div>
        <ol className="mr-dots" aria-label={`${bn(count)}টা ছবির ${bn(round.index + 1)} নম্বর`}>
          {Array.from({ length: count }, (_, index) => <li key={index} className={index < round.index ? "done" : index === round.index ? "now" : ""} />)}
        </ol>

        <div className="mr-stage" style={tint ? { background: `${tint}aa` } : undefined}>
          <span className="mr-prop"><SceneArt prop={scene.prop} /></span>
          <figure className="mr-child" key={`${scene.id}-${round.step}`}>
            <Child face={round.step === "name" ? null : round.step === "after" ? "calm" : round.picked} fill={tint ?? ""} hair={scene.hair} glasses={scene.glasses} />
            <figcaption>{scene.who}</figcaption>
          </figure>
        </div>
        <p className="mr-text">{scene.text} <SpeakButton text={scene.text} /></p>

        {round.step === "name" && <>
          <h3 className="mr-q">{question(scene)}</h3>
          <div className="mr-faces" data-n={round.faces.length}>
            {round.faces.map(feeling => {
              const glow = glows(round) && scene.feels.includes(feeling);
              return <button type="button" key={feeling} className={`mr-face${glow ? " is-glow" : ""}`} style={{ "--feel": FEELINGS[feeling].color } as CSSProperties}
                aria-label={FEELINGS[feeling].word} {...press(element => onFace(feeling, element))}>
                <Face feeling={feeling} fill={FEELINGS[feeling].light} /><span>{FEELINGS[feeling].word}</span>
                {ghostFace === feeling && <Ghost />}
              </button>;
            })}
          </div>
          <p className="mr-msg" aria-live="polite">{message}</p>
        </>}

        {round.step === "kind" && <>
          <p className="mr-said" aria-live="polite">{said}</p>
          <h3 className="mr-q">{kindQuestion(scene)}</h3>
          <div className="mr-kinds">
            {scene.kind.map((kind, index) => <button type="button" key={kind.text} className="mr-kind" {...press(() => onKind(index))}>
              <KindIcon icon={kind.icon} /><span>{kind.text}</span>{idle && index === 0 && <Ghost />}
            </button>)}
          </div>
        </>}

        {round.step === "after" && round.kind !== null && <>
          <p className="mr-said" aria-live="polite">{scene.kind[round.kind].after}</p>
          <div className="mr-ask"><small>একসাথে কথা বলো</small><p>{scene.ask}</p></div>
          <button type="button" className="kit-primary mr-next" {...press(onNext)}>{isLast(round) ? "ধাপ শেষ" : "পরের ছবি"}<span aria-hidden="true">→</span>{idle && <Ghost />}</button>
        </>}

        {phase === "end" && (
          <div className="mr-over mr-end" role="status">
            <StarReveal count={stars} />
            <p className="mr-end-line">{endLine(round)}</p>
            <p className="mr-end-note">{mirrorLine(round.set)}</p>
            <div className="mr-end-actions">
              <button type="button" className="kit-primary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
              <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("closed"); }}>শেষ</button>
            </div>
            {round.set < SET_COUNT && <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(round.set + 1); }}>পরের ধাপ: {setOf(round.set + 1).title}</button>}
            <ShowParentButton onClick={() => setShowing(true)} />
          </div>
        )}
        {phase === "closed" && (
          <div className="mr-over">
            <p className="mr-end-line">আজকের ছবিগুলো তোলা রইল।</p>
            <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); restart(); }}>আবার খেলো</button>
          </div>
        )}
      </div>

      <ShowParent open={showing} onClose={() => setShowing(false)} picture={{ fileName: `${TOOL}.png`, make: () => cardBlob(today, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`আজ ${bn(today.scenes)}টা ছবিতে মনের রং চেনা হলো।`} /></figure>
      </ShowParent>
      {resting && <RestScreen onExtend={extend} />}

      <details className="mr-drawer">
        <summary>সব ধাপ</summary>
        <LevelGrid count={SET_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={round.set} noun="ধাপ" onPick={set => restart(set)} />
        <p>তারা মানে কতবার খেলা হলো। কে কত মেলাল, তার হিসাব নেই।</p>
      </details>
      <div className="mr-parent">
        <ParentGate label="বড়দের জন্য"><ShareToolLink title="মনের রং" text="ছবি দেখে অনুভূতির নাম চেনার খেলা, ছোটদের জন্য। ফ্রি, অ্যাকাউন্ট লাগে না।" /></ParentGate>
        <p>খেলার কিছুই ফোনের বাইরে যায় না। কোন ধাপ কতবার খেলা হলো, শুধু এই ব্রাউজারে থাকে।</p>
      </div>
    </div>
  );
}
