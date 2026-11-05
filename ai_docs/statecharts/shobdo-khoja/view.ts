export const title = "Shobdo khoja after the rewrite: page, pen, window, choices and levels";
const game = (v: any) => {
  if (v.ask) return "Ask card: এই পাতা ছেড়ে যাবে? (clock stopped)";
  if (v.sheet) return v.phase === "paused" ? "সব লেভেল open, clock stopped" : "সব লেভেল open, nothing started";
  if (v.phase === "ready") return "Start card, grid hidden";
  if (v.phase === "playing") return v.press === "none" ? "Hunting, clock running" : "Hunting, pen on the grid";
  if (v.phase === "paused") return "Paused (থেমে আছে), pen lifted";
  return "All words struck, result shows";
};
const levels = (v: any) => (v.open ?? 1) > 1 ? "Level 2 open by your own clear" : "Only level 1 open (a friend's level only visits)";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Away (another window or tab)",
  Levels: levels(v),
});
const LABELS: Record<string, string | null> = {
  YouPressStart: "you press খোঁজা শুরু",
  YouTouchALetter: "you touch a letter",
  YouDrag: null,
  YouLetGoOnAWord: "you let go on a listed word",
  YouLetGoElsewhere: "you let go without a word",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  FanfareEnds: null,
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close the sheet",
  YouPickALevel: "you pick a level",
  YouStay: "you press এখানেই থাকো",
  YouLeave: "you press ছেড়ে যাও",
  YouGoToNextLevel: "you press পরের লেভেল",
  YouPlayAgain: "you press আবার খেলো",
  FriendLinkOpens: null,
};
export const step = (action: string, from: any, to: any) => {
  if (action === "YouLetGoOnAWord" && to.phase === "over") return to.open > from.open ? "you strike the last word, the next level opens" : "you strike the last word";
  return action in LABELS ? LABELS[action] : action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
