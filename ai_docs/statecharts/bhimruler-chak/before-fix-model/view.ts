export const title = "ভিমরুলের চাক: round, clock, window, finger and levels";
const games: Record<string, string> = {
  ready: "Waiting for your first tap",
  friendBoard: "Friend's orchard, clock not started",
  running: "Playing, clock running",
  paused: "Paused, clock stopped",
  won: "Orchard cleared, card shows",
  lost: "Hit a nest",
};
const progress = (v: any) =>
  v.link === 0 ? "No friend link; levels open as you clear them"
  : v.c1 ? "Friend's link; level 1 cleared"
  : v.unl >= 2 ? "Friend's level cleared; levels 2–3 saved open, level 1 never cleared"
  : "Friend's link; levels 2–3 open, level 1 not cleared";
export const state = (v: any) => ({
  Game: games[v.game],
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Finger: v.press ? "Finger held on a bush" : "Hands off",
  Levels: progress(v),
});
// Hidden to keep the chart readable: opening a link mid-round, and starting a level mid-round (both reset the round like
// the arrows from "Waiting for your first tap" and the end states do).
const midRound = (v: any) => ["running", "paused", "friendBoard"].includes(v.game);
export const step = (action: string, from: any, to: any) =>
  (action === "YouOpenAFriendLink" && from.game !== "ready") || (action === "YouStartALevel" && midRound(from)) ? null
  : action === "YouClearTheLastBush" && progress(from) !== progress(to)
  ? (to.c1 && !from.c1 ? "you clear level 1" : "you clear level 2 or 3 before level 1")
  : ({
  YouOpenAFriendLink: "you open a friend's link to level 3",
  YouMakeAMove: "you clear a bush, tie a গামছা or take a hint",
  YouClearTheLastBush: "you clear the last safe bush",
  YouHitANest: "you tap a nest",
  YouTouchAndHold: "you press and hold a bush",
  YouLiftYourFinger: "you lift your finger",
  TheLongPressTies: "the long press ties a গামছা",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  YouStartALevel: "you start a level",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => (v.game === "won" || v.game === "lost" ? "done" : v.game === "paused" ? "held" : "play");
export const colors = { play: "teal", held: "yellow", done: "blue" };
