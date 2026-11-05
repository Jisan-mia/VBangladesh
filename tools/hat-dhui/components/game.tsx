"use client";
// IP: what we avoided — no Meena or Sisimpur look-alikes, no soap or toothpaste brands, no textbook or poster art; every hand, mouth and germ is our own flat SVG, and the steps are paraphrased from WHO's handwashing guide.
// The game inside the shared player. The rules live in lib/ (run.hot.ts keeps the routine's clock, quiz-round.ts plays the
// quiz, session.ts decides screens, timers, pause and the rest screen); this file feeds taps and keys in, draws and plays sounds.
import { useEffect, useMemo, useRef, useState } from "react";
import { useGamePlayer } from "../../../shared/game-player-client";
import { confetti, newSeed, shake, silenceScheduled, useLevels, useSlowMode } from "../../../shared/game-kit";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from "../../../shared/kids-kit";
import { cardData } from "../lib/card-data";
import { cardSvgs, drawCard, loadPictures } from "../lib/draw-card";
import { renderCard } from "../../../shared/card-canvas";
import { FACTS } from "../lib/facts";
import { MODES, completesSet, firstToPlay, modeFromHash, modeOf, nextMode, type ModeId } from "../lib/levels";
import { createQuizRound, isLastQuestion, nextQuestion, quizResult, tapMoment, type QuizRound } from "../lib/quiz-round";
import { isBedtime } from "../lib/routines";
import * as S from "../lib/session";
import * as sound from "../lib/sound";
import { CardCanvas } from "./card";
import { EndScreen, type Result } from "./end-screen";
import { QuizView } from "./quiz-view";
import { RoutineView } from "./routine-view";
import { Title } from "./title";

const SLUG = "hat-dhui";
const BREATH_MS = 500, FINISH_MS = 1000;

export function HatDhuiGame() {
  const levels = useLevels(SLUG, MODES.length);
  const kids = useKidsSession();
  const [slow] = useSlowMode();
  const session = useRef<S.Session>(S.createSession());
  const [screen, setScreen] = useState<S.Screen>("title");
  const [mode, setMode] = useState<ModeId>("hat");
  const modeRef = useRef<ModeId>("hat");
  const [serial, setSerial] = useState(0);
  const [seed, setSeed] = useState(1);
  const [quiz, setQuizState] = useState<QuizRound>(() => createQuizRound(1));
  const quizRef = useRef(quiz);
  const [result, setResult] = useState<Result | null>(null);
  const [ghost, setGhost] = useState(false);
  const [showing, setShowing] = useState(false);
  const [gateKey, setGateKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const keyPickAt = useRef(0);
  const live = useRef({ slow, levels, kids });
  live.current = { slow, levels, kids };

  // ---- the one pending timer (the end screen after the ring closes), cleared on restart, pause and unmount ----
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopPending = () => { if (pending.current) clearTimeout(pending.current); pending.current = null; };
  const clearAll = () => { stopPending(); };
  useEffect(() => () => { clearAll(); silenceScheduled(); }, []);

  const sync = () => setScreen(session.current.screen);
  const choose = (id: ModeId) => { modeRef.current = id; setMode(id); };
  const setQuiz = (next: QuizRound) => { quizRef.current = next; setQuizState(next); };

  // ---- first load: a #m= link picks the activity; else this phone's progress picks the one that's ready ----
  const started = useRef(false);
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const fromHash = modeFromHash(location.hash);
    choose(fromHash ?? firstToPlay(levels.stars));
    setGhost(Object.keys(levels.stars).length === 0);
  }, [levels.loaded, levels.stars]);
  useEffect(() => {
    const onHash = () => { const id = modeFromHash(location.hash); if (id && session.current.screen === "title") choose(id); };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);

  // Dev builds only: lets an in-page autopilot (play-test-orca) read the session; nothing ships.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    Object.assign(window, { __hat: { session: () => session.current, quiz: () => quizRef.current, mode: () => modeRef.current } });
  }, []);

  // ---- the end screen's timer: fires only for the round that armed it ----
  const armEnd = (ms: number) => {
    stopPending();
    const armedFor = session.current.serial;
    pending.current = setTimeout(() => { pending.current = null; if (S.timerFires(session.current, performance.now(), armedFor)) sync(); }, ms);
  };

  // ---- the player: pause freezes the timer; resume gives it back after a breath ----
  const toTitle = () => { clearAll(); silenceScheduled(); S.toTitle(session.current); setShowing(false); sync(); };
  const player = useGamePlayer({
    onPause: () => { S.pause(session.current); stopPending(); },
    onResume: () => { S.resume(session.current); if (session.current.pending !== "none") armEnd(BREATH_MS); },
    onRestart: toTitle,
    onLevels: toTitle,
  });

  // ---- away and back: the clock stops, and the first tap back only wakes the game ----
  useEffect(() => {
    const onBlur = () => S.blur(session.current);
    const onFocus = () => S.focus(session.current);
    const onVisibility = () => { if (document.hidden) S.blur(session.current); else S.focus(session.current); };
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("blur", onBlur); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  // ---- an open parent gate shuts on the next tap anywhere else in the game (a phone handed back) ----
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const down = (event: PointerEvent) => {
      const open = node.querySelector(".hd-grown .kk-gate-open, .hd-grown .kk-gate");
      if (open && !(event.target instanceof Node && open.contains(event.target))) setGateKey(key => key + 1);
    };
    node.addEventListener("pointerdown", down, true);
    return () => node.removeEventListener("pointerdown", down, true);
  }, []);

  // ---- rounds ----
  function begin(id: ModeId) {
    const s = session.current;
    clearAll(); silenceScheduled();
    choose(id);
    // Opening a round is a break too: past today's limit the rest screen shows and nothing starts.
    if (!S.begin(s, kids.atBreak())) { sync(); return; }
    setSerial(s.serial); setSeed(newSeed()); setResult(null); setShowing(false);
    setGhost(!live.current.levels.stars[modeOf(id).level]);
    if (modeOf(id).kind === "quiz") setQuiz(createQuizRound(newSeed()));
    if (modeOf(id).kind === "routine") sound.startChime(); else sound.next();
    sync();
  }

  /** The round is won at this step: stars saved and the limit checked now, never inside a timer a quick tap can cancel. */
  function won(next: Result, timed: boolean) {
    const s = session.current;
    if (!S.finish(s, live.current.kids.atBreak(), timed)) return false;
    const level = modeOf(next.mode).level, stars = live.current.levels.stars;
    const closesSet = completesSet(stars, level);
    live.current.levels.record(level, next.stars);
    if (closesSet && !live.current.slow) confetti({ count: 80, y: 0.3 });
    setResult(next);
    if (timed) armEnd(FINISH_MS);
    return true;
  }

  const routineDone = () => won({ mode: modeRef.current, stars: 3, bedtime: modeRef.current === "dat" && isBedtime(new Date()), firstTry: 0 }, true);

  /** A card, by finger or key. */
  function pick(id: string, element: HTMLElement | null) {
    const s = session.current, before = quizRef.current;
    if (S.tapGame(s) !== "counts") return;
    const after = tapMoment(before, id);
    if (after === before) return;
    setGhost(false);
    setQuiz(after);
    if (after.solved) {
      sound.right();
      if (isLastQuestion(after)) { const done = quizResult(after); won({ mode: "kokhon", stars: done.stars, bedtime: false, firstTry: done.firstTry }, false); }
    } else {
      sound.softMiss();
      if (!live.current.slow) shake(element);
    }
  }

  /** → after a right card: the next picture, or (after the last) the end screen. Only the player's own hand moves it on. */
  function onward() {
    const s = session.current, round = quizRef.current;
    if (S.tapGame(s) !== "counts" || !round.solved) return;
    if (isLastQuestion(round)) { if (S.goToEnd(s, performance.now())) sync(); return; }
    setQuiz(nextQuestion(round));
    sound.next();
  }

  const openAgain = () => begin(modeRef.current);
  const finishRound = () => {
    // শেষ: back to the title, with the next level ready. Nothing starts by itself.
    choose(nextMode(modeRef.current, live.current.levels.stars));
    toTitle();
  };
  const select = (id: ModeId) => {
    sound.next();
    choose(id);
    try { history.replaceState(history.state, "", `#m=${id}`); } catch { /* sandboxed frames */ }
  };

  // ---- keys at the window, so Enter never presses a stale focused button ----
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || player.paused) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select, [contenteditable], .kk-gate, .kk-gate-open, .kk-rest, .kk-show")) return;
      const s = session.current, key = event.key, id = modeRef.current;
      if (kids.resting && s.screen !== "play") return;
      if (key === "p" || key === "P") { event.preventDefault(); player.requestPause(); return; }
      if (s.screen === "title") {
        if (key === "Enter" || key === " ") { event.preventDefault(); if (!event.repeat) begin(id); return; }
        const at = "123".indexOf(key);
        if (at >= 0 && !event.repeat) { event.preventDefault(); select(MODES[at].id); }
        return;
      }
      if (s.screen === "play" && modeOf(id).kind === "quiz") {
        const at = "1234".indexOf(key), round = quizRef.current;
        if (at >= 0) { event.preventDefault(); const choice = round.choices[at]; if (choice && !event.repeat) { keyPickAt.current = performance.now(); pick(choice.id, tiles.current[at]); } return; }
        if (key === "Enter" || key === " ") { event.preventDefault(); if (!event.repeat) onward(); }
        return;
      }
      if (s.screen === "end" && (key === "Enter" || key === " ")) { event.preventDefault(); if (S.freshKey(s, event.timeStamp, event.repeat)) begin(id); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  const card = useMemo(() => result ? cardData(result.mode, result.stars, result.bedtime, bn) : null, [result]);
  const fact = FACTS[result?.mode ?? mode];
  const restUp = kids.resting && screen !== "play";
  const kind = modeOf(mode).kind;

  return <div ref={root} className="hd" data-screen={screen} data-slow={slow || undefined}>
    {screen === "title" && <Title mode={mode} stars={levels.stars} ghost={ghost && levels.loaded} onStart={() => begin(mode)} onSelect={select}>
      <div className="hd-grown">
        <ParentGate key={gateKey}><ShareToolLink title="হাত ধুই, দাঁত মাজি" text="২০ সেকেন্ডে হাত ধোয়া আর ২ মিনিটে দাঁত মাজা, বেসিনের পাশে ফোন রেখে ছোটদের খেলা।" /></ParentGate>
      </div>
    </Title>}

    {screen === "play" && kind === "routine" && <RoutineView key={serial} wash={mode === "hat"} session={session.current} seed={seed} slow={slow} paused={player.paused} onFinish={routineDone} onPoke={() => S.tapGame(session.current) === "counts"} />}
    {screen === "play" && kind === "quiz" && <QuizView round={quiz} ghost={ghost} tiles={tiles} onPick={pick} onNext={onward} keyPickAt={keyPickAt} />}

    {screen === "end" && result && <EndScreen result={result} slow={slow} onAgain={openAgain} onDone={finishRound} onShow={() => setShowing(true)} />}

    {card && result && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `hat-dhui-${result.mode}.png`,
      make: async () => { const pictures = await loadPictures(cardSvgs(card)); return renderCard(canvas => drawCard(canvas, card, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={card} /></div>
      <p className="hd-parent-line"><b>বড়দের জন্য:</b> {fact.fact} {fact.action} <small>সূত্র: {fact.source}</small></p>
    </ShowParent>}
    {restUp && <RestScreen onExtend={minutes => { kids.extend(minutes); S.extend(session.current); }} />}
  </div>;
}
