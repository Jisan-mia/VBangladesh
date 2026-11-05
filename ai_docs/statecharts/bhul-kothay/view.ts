export const title = "Bhul kothay after the rewrite: pictures, finger, window, choices and levels";
const game = (v: any) => {
  if (v.ask) return "Ask card: এই ছবি ছেড়ে যাবে? (clock stopped)";
  if (v.sheet) return v.phase === "paused" ? "সব লেভেল open, clock stopped" : "সব লেভেল open, nothing running";
  if (v.phase === "ready") return "Start card, pictures hidden";
  if (v.phase === "playing") return "Hunting, clock running";
  if (v.phase === "paused") return "Paused, pictures covered";
  return "All found, stars and card";
};
const levels = (v: any) => (v.open ?? 1) > 1 ? "Level 2 open by your own clear" : "Only level 1 open (a friend's level only visits)";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Away (another window or tab)",
  Levels: levels(v),
});
const LABELS: Record<string, string | null> = {
  YouPressStart: "you press খোঁজা শুরু",
  YouTapWhereNothingDiffers: null,
  YouFindOne: "you tap a difference",
  YouFindTheLast: "you tap the last difference",
  YouDragTheLamp: null,
  YouLiftYourFinger: null,
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  CheerFires: null,
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close the sheet",
  YouPickALevel: "you pick a level",
  YouStay: "you press এখানেই থাকো",
  YouLeave: "you press ছেড়ে যাও",
  YouGoToNextLevel: "you press পরের লেভেল",
  YouPlayAgain: "you press আবার খেলো",
  YouRestartFromTheMenu: "you press নতুন করে শুরু",
  FriendLinkOpens: null,
};
// Hidden: a friend's link (a reset to the start card from any state); the finger on a picture, its drag and lift, a tap where
// nothing differs and the confetti, which all stay inside one chart state.
export const step = (action: string, from: any, to: any) => {
  if (action === "YouFindTheLast") return to.open > from.open ? "you tap the last difference, the next level opens" : "you tap the last difference";
  return action in LABELS ? LABELS[action] : action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.sheet || v.ask ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
