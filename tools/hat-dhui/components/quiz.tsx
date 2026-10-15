"use client";
// "কখন ধোব": pick the moment to wash with soap. A wrong pick wobbles softly with a hint; after two, the right one glows.

import { useRef, useState } from "react";
import { makeRng, newSeed, sfx, shake, soundOn } from "../../../shared/game-kit";
import { SpeakButton, bn, speak } from "../../../shared/kids-kit";
import { ICONS } from "../lib/art";
import { ASK, QUESTIONS, choiceCount, choicesFor, type Moment } from "../lib/quiz";
import { softMiss } from "../lib/sound";
import { Finger } from "./finger";

export function Icon({ id, className = "hd-icon" }: { id: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[id] ?? "" }} />;
}

type Round = { index: number; choices: Moment[]; wrong: string[]; solved: boolean; firstTry: number; missRun: number; rightRun: number };

export function Quiz({ ghost, onDone }: { ghost: boolean; onDone: (firstTry: number) => void }) {
  const rng = useRef<() => number>(null);
  rng.current ??= makeRng(newSeed());
  const [round, setRound] = useState<Round>(() => ({ index: 0, choices: choicesFor(QUESTIONS[0], 3, rng.current!), wrong: [], solved: false, firstTry: 0, missRun: 0, rightRun: 0 }));
  const [touched, setTouched] = useState(false);
  const question = QUESTIONS[round.index], last = round.index + 1 >= QUESTIONS.length;

  const choose = (choice: Moment, element: Element) => {
    if (round.solved) return;
    setTouched(true);
    if (choice.id === question.right.id) {
      sfx.good();
      if (soundOn()) speak(question.why);
      const first = round.wrong.length === 0;
      setRound(r => ({ ...r, solved: true, firstTry: r.firstTry + (first ? 1 : 0), rightRun: first ? r.rightRun + 1 : 0, missRun: first ? 0 : r.missRun + 1 }));
      return;
    }
    if (round.wrong.includes(choice.id)) return;
    softMiss();
    shake(element);
    setRound(r => ({ ...r, wrong: [...r.wrong, choice.id] }));
  };

  const next = () => {
    sfx.tap();
    if (last) { onDone(round.firstTry); return; }
    setRound(r => {
      const index = r.index + 1, q = QUESTIONS[index];
      return { ...r, index, wrong: [], solved: false, choices: choicesFor(q, choiceCount(r.missRun, r.rightRun, q.wrong.length + 1), rng.current!) };
    });
  };

  const hint = round.wrong.length >= 2 && !round.solved;
  return <div className="hd-quiz">
    <div className="hd-ask">
      <p><span className="hd-count">{bn(round.index + 1)}/{bn(QUESTIONS.length)}</span> {ASK}</p>
      <SpeakButton text={ASK} />
    </div>
    <ul className={`hd-choices n${round.choices.length}`}>
      {round.choices.map(choice => {
        const right = choice.id === question.right.id;
        const state = round.solved && right ? "right" : round.wrong.includes(choice.id) ? "wrong" : hint && right ? "hint" : "";
        return <li key={choice.id}>
          <button type="button" className={`hd-choice ${state}`} data-ok={right ? "1" : undefined} disabled={round.solved && !right} onClick={event => choose(choice, event.currentTarget)}>
            <Icon id={choice.id} /><span>{choice.bn}</span>
            {ghost && !touched && round.index === 0 && right && <Finger />}
          </button>
        </li>;
      })}
    </ul>
    <div className="hd-after" role="status" aria-live="polite">
      {round.solved
        ? <><p className="hd-why">{question.why}</p><button type="button" className="kit-primary hd-next" onClick={next}>{last ? "দেখো কী শিখলে" : "পরেরটা"} <span aria-hidden="true">→</span></button></>
        : round.wrong.length > 0 && <p className="hd-try"><b>আরেকবার ভাবো।</b> {question.hint}</p>}
    </div>
  </div>;
}
