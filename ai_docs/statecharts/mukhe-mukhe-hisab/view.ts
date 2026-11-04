export const title = "মুখে মুখে হিসাব: round, clock, sums, window and levels";
const secs = (n: number) => (n >= 1 ? "time left" : "no time left");
const round = (v: any) =>
  v.phase === "ready" ? "Waiting for শুরু করো"
  : v.phase === "over" ? "Time's up, card shows"
  : v.phase === "broken" ? "Page broken (কিছু একটা গড়বড়)"
  : v.paused ? `Paused${v.stale ? " a while" : ""}, ${secs(v.left)}${v.left < v.owed ? " (less than you had)" : ""}`
  : `Playing, ${secs(v.left)}${v.left < v.owed ? " (less than you had)" : ""}`;
const progress = (v: any) =>
  v.link === 0 ? "No friend link; levels open as you clear them"
  : v.c1 ? "Friend's link; level 1 cleared"
  : v.unl >= 2 ? "Friend's level cleared; levels 2–3 saved open, level 1 never cleared"
  : "Friend's link; levels 2–3 open, level 1 not cleared";
export const state = (v: any) => ({
  Round: round(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Levels: progress(v),
});
const midRound = (v: any) => v.phase === "playing";
export const step = (action: string, from: any, to: any) =>
  (action === "YouStartALevel" || action === "YouOpenAFriendLink") && midRound(from) ? null
  : action === "TabHides" && to.left < from.left ? "you hide the tab again while paused"
  : action === "TimeRunsOut" && progress(from) !== progress(to) ? (to.c1 && !from.c1 ? "time runs out, level 1 cleared" : "time runs out, level 2 or 3 cleared before level 1")
  : ({
  YouStart: "you press শুরু করো",
  YouAnswerTheLastSum: "you answer the 120th sum",
  YouPressTryAgain: "you press আবার চেষ্টা করি",
  ASecondPasses: "a second passes",
  TimeRunsOut: "time runs out",
  TheCheerPlays: "the cheer plays",
  TimeGoesByWhilePaused: "you wait a while",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  YouStartALevel: "you start a level",
  YouOpenAFriendLink: "you open a friend's link to level 3",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => (v.phase === "broken" ? "broken" : v.phase === "over" ? "done" : v.paused ? "held" : "play");
export const colors = { play: "teal", held: "yellow", done: "blue", broken: "orange" };
