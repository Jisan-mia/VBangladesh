// One round of কখন ধোব, with no React: six moments, a few pictures each, soft misses, and the quiet sweet spot.
import { makeRng } from "../../../shared/game-core";
import { QUESTIONS, choiceCount, choicesFor, starsOf, type Moment } from "./quiz";

export type QuizRound = {
  index: number;
  choices: readonly Moment[];
  /** Wrong pictures tried on this question. */
  wrong: readonly string[];
  solved: boolean;
  /** Questions right on the first tap. */
  firstTry: number;
  missRun: number;
  rightRun: number;
  rng: () => number;
};

export function createQuizRound(seed: number): QuizRound {
  const rng = makeRng(seed);
  return { index: 0, choices: choicesFor(QUESTIONS[0], 3, rng), wrong: [], solved: false, firstTry: 0, missRun: 0, rightRun: 0, rng };
}

export const currentQuestion = (round: QuizRound) => QUESTIONS[round.index];
export const isLastQuestion = (round: QuizRound) => round.index + 1 >= QUESTIONS.length;
/** After two wrong pictures the right one glows (with a dashed ring, so it is not colour alone). */
export const hintOn = (round: QuizRound) => round.wrong.length >= 2 && !round.solved;

/** Taps a picture. A wrong one only dims it; a repeat or a tap after the answer changes nothing. */
export function tapMoment(round: QuizRound, id: string): QuizRound {
  if (round.solved || round.wrong.includes(id) || !round.choices.some(choice => choice.id === id)) return round;
  if (id === currentQuestion(round).right.id) {
    const first = round.wrong.length === 0;
    return { ...round, solved: true, firstTry: round.firstTry + (first ? 1 : 0), rightRun: first ? round.rightRun + 1 : 0, missRun: first ? 0 : round.missRun + 1 };
  }
  return { ...round, wrong: [...round.wrong, id] };
}

/** The next question, with three pictures, two after three misses in a row, four after five right in a row. */
export function nextQuestion(round: QuizRound): QuizRound {
  if (!round.solved || isLastQuestion(round)) return round;
  const index = round.index + 1, question = QUESTIONS[index];
  return { ...round, index, wrong: [], solved: false, choices: choicesFor(question, choiceCount(round.missRun, round.rightRun, question.wrong.length + 1), round.rng) };
}

export type QuizResult = { stars: number; firstTry: number; moments: number };
export const quizResult = (round: QuizRound): QuizResult => ({ stars: starsOf(round.firstTry), firstTry: round.firstTry, moments: QUESTIONS.length });
