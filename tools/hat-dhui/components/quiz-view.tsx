"use client";
// "কখন ধোব" with pictures only: the question is soap, hands and a "?" bubble, and each choice is a picture. Text is for the
// parent reading aloud. A wrong pick wobbles softly; after two the right one glows with a dashed ring. Nothing moves on its own.
import type { PointerEvent as ReactPointerEvent } from "react";
import { bn } from "../../../shared/kids-kit";
import { SCENES } from "../lib/art";
import { currentQuestion, hintOn, isLastQuestion, type QuizRound } from "../lib/quiz-round";
import { ASK, QUESTIONS } from "../lib/quiz";
import { Finger } from "./finger";
import { Icon, Picture } from "./icon";

export type QuizViewProps = {
  round: QuizRound;
  ghost: boolean;
  tiles: { current: (HTMLButtonElement | null)[] };
  onPick: (id: string, element: HTMLElement) => void;
  onNext: () => void;
  /** Keeps a screen reader's click (detail 0) from doubling a key press. */
  keyPickAt: { current: number };
};

export function QuizView({ round, ghost, tiles, onPick, onNext, keyPickAt }: QuizViewProps) {
  const question = currentQuestion(round), hint = hintOn(round), last = isLastQuestion(round);
  return <div className="hd-quiz" data-solved={round.solved || undefined}>
    <div className="hd-hud">
      <ol className="hd-pips" aria-label={`${bn(QUESTIONS.length)}টার মধ্যে ${bn(round.index + (round.solved ? 1 : 0))}টা হয়েছে`}>
        {QUESTIONS.map((q, i) => {
          const got = i < round.index || (i === round.index && round.solved);
          return <li key={q.id} className={got ? "done" : i === round.index ? "now" : ""}>{got && <Icon id={q.id} className="hd-pip-icon" />}</li>;
        })}
      </ol>
    </div>

    <div className="hd-ask" key={round.index}>
      <Picture svg={SCENES.ask} className="hd-ask-pic" />
      <p className="hd-ask-line">{ASK}</p>
    </div>

    <ul className={`hd-choices n${round.choices.length}`}>
      {round.choices.map((choice, at) => {
        const right = choice.id === question.right.id;
        const state = round.solved && right ? "right" : round.wrong.includes(choice.id) ? "wrong" : hint && right ? "hint" : "";
        return <li key={`${round.index}-${choice.id}`}>
          <button type="button" ref={node => { tiles.current[at] = node; }} className={`hd-choice ${state}`} disabled={round.solved && !right} aria-label={`${bn(at + 1)}: ${choice.bn}`}
            onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
              // Only the first finger counts (a palm or a second finger is ignored), and only the main mouse button.
              if (!event.isPrimary || event.button !== 0) return;
              event.preventDefault();
              onPick(choice.id, event.currentTarget);
            }}
            // A screen reader's activation (a click with no pointer); a key press already picked through the window.
            onClick={event => { if (event.detail === 0 && performance.now() - keyPickAt.current > 400) onPick(choice.id, event.currentTarget); }}>
            <Icon id={choice.id} /><span className="hd-choice-name">{choice.bn}</span>
            <span className="hd-key" aria-hidden="true">{bn(at + 1)}</span>
            {state === "right" && <span className="hd-puffs" aria-hidden="true"><i /><i /><i /><i /></span>}
            {ghost && round.index === 0 && right && !round.solved && round.wrong.length === 0 && <Finger />}
          </button>
        </li>;
      })}
    </ul>

    <div className="hd-after" role="status" aria-live="polite">
      {round.solved
        ? <>
            <div className="hd-why"><Picture svg={SCENES.rinse} className="hd-why-pic" /><p>{question.why}</p></div>
            <button type="button" className="hd-next" aria-label={last ? "দেখো কী শিখলে" : "পরেরটা"} onClick={event => { event.currentTarget.blur(); onNext(); }}>
              <svg viewBox="0 0 48 48" aria-hidden="true">{last ? <path d="M9 25l10 10 20-22" /> : <path d="M8 24h30M26 11l13 13-13 13" />}</svg>
            </button>
          </>
        : round.wrong.length > 0 && <p className="hd-try"><b>আরেকবার ভাবো।</b> {question.hint}</p>}
    </div>
  </div>;
}
