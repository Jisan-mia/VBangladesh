export const title = "মুখে মুখে হিসাব (after the rewrite): round, clocks, pause, sheet, keys and levels";
const secs = (v: any) => (v.left >= 1 ? "time left" : "no time left");
const round = (v: any) =>
  v.phase === "ready" ? "Cash box shut (শুরু করো)"
  : v.phase === "over" ? "End screen and card"
  : v.why === "sheet" ? "Paused by সব লেভেল, sum covered"
  : v.why === "away" ? "Paused, the cash box covers the sum"
  : v.phase === "opening" ? "Drawer sliding open"
  : v.phase === "lesson" ? `A miss: the right answer and how, clock held`
  : `A sum is up, the clock runs, ${secs(v)}`;
const progress = (v: any) =>
  v.link === 0 ? (v.c1 ? "Level 1 cleared, level 2 open" : "Your own levels")
  : v.c1 ? "Friend's link; level 1 cleared" : "Friend's link; only its own level open";
export const state = (v: any) => ({
  Game: round(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Levels: progress(v),
});
const hidden = new Set(["YouHoldAKey", "YouLetGo", "TheCheerPlays", "ASecondPasses", "YouAnswerRight"]);
export const step = (action: string, from: any, to: any) =>
  hidden.has(action) ? null
  : (action === "YouStartALevel" || action === "YouOpenAFriendLink") && from.phase !== "ready" && from.phase !== "over" ? null
  : action === "TimeRunsOut" && to.c1 && !from.c1 ? "time runs out, level 1 cleared"
  : ({
  YouStart: "you press শুরু করো",
  TheDrawerOpens: "the drawer is open",
  TimeRunsOut: "time runs out",
  YouAnswerWrong: to.phase === "over" ? "a miss takes the last seconds" : "you answer wrong",
  TheLessonEnds: "the how-line has shown",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  YouStartALevel: "you pick a level",
  AKeyDownOnTheEnd: "you press a fresh key",
  YouOpenAFriendLink: "you open a friend's link to level 3",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => (v.phase === "over" ? "done" : v.why !== "none" ? "held" : v.phase === "ready" ? "wait" : "play");
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
