export const title = "Ki Hobe Bolo To: the guess, the experiment, the pause, the sound, the rest screen and the parent gate";
const game = (v: any) => ({
  title: "Title: the pond, the worlds",
  guess: "Guess what will happen (pictures)",
  watch: "The experiment plays",
  answer: "What happened: tick, আবার দেখো, →, কেন?",
  end: "Round done: আবার খেলো / শেষ (pictures)",
} as any)[v.screen];
export const state = (v: any) => ({
  Game: game(v),
  Pause: v.menu ? "Pause menu" : v.swallow || v.away ? "Away, next tap only wakes" : "Playing",
  Today: v.resting && (v.screen === "title" || v.screen === "end") ? "Rest screen up" : v.late ? "Today's time used up" : "Time left today",
});
export const step = (action: string) => ({
  YouTapPlay: "you tap খেলো or আবার খেলো (the limit is checked)",
  YouGuess: "you tap a guess (on the last one the stars are saved)",
  YouTapAndOnlyWake: "you tap once after coming back: it only wakes the game",
  TheExperimentEnds: "the experiment ends and the answer shows",
  TheClockFiresAway: "the clock ends while you're away: the answer waits",
  TheAnswerShowsOnReturn: "you're back: the answer shows",
  YouTapSeeAgain: "you tap আবার দেখো",
  YouTapNext: "you tap →",
  YouTapDone: "you tap শেষ",
  PlayerOpensTheMenu: "you open the pause menu",
  YouTapResume: "you tap চালিয়ে যাও",
  YouLeaveFromTheMenu: "you pick সব লেভেল or নতুন করে শুরু",
  YouLookAway: "you switch to another app or window",
  YouComeBack: "you come back",
  TodaysTimeRunsOut: "today's minutes run out",
  TheBreakCheck: "the one-second check at a break",
  ParentGivesTenMore: "a parent gives ten more minutes",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && (v.screen === "title" || v.screen === "end") ? "rest" : v.screen === "end" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
