export const title = "চড়ুই তাড়াও: afternoon, window, level list, cheer and link";
const game = (v: any) => ({ ready: "Waiting for your first tap", playing: "Sparrows landing", paused: "Paused", over: "Card shows" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Levels: v.picker ? "সব লেভেল open" : "সব লেভেল closed",
  Cheer: v.fanfare ? "Cheer still to come" : "No cheer waiting",
  Grain: v.ateAway ? "Grain was eaten while you were away" : "Grain only eaten while you watched",
  Link: v.link === "none" ? "No friend's link" : v.lvl === "theirs" ? (v.seed === "theirs" ? "On the friend's field" : "Friend's level, a fresh field") : "Friend's link, another level",
});
const where = (to: any) => to.link === "none" ? "" : to.lvl === "theirs" ? " (the friend's level)" : " (another level)";
export const step = (action: string, from: any, to: any) => {
  if (action === "RoundEnds") return to.fanfare && !from.fanfare ? "dusk falls and the field is passed" : from.fanfare ? "dusk falls" : "dusk falls or the grain runs out, not passed";
  if (action === "YouPickLevel" || action === "YouGoNext" || action === "FriendLinkOpens") return labels[action] + where(to);
  return labels[action] ?? action;
};
const labels: Record<string, string> = {
  YouStart: "you tap the field",
  SparrowsEat: "a sparrow nibbles",
  FanfarePlays: "the cheer plays",
  YouPause: "you press থামাও",
  YouResume: "you press চালিয়ে যাও",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouOpenLevels: "you open সব লেভেল",
  YouCloseLevels: "you close সব লেভেল",
  YouPickLevel: "you pick a level",
  YouGoNext: "you press পরের লেভেল",
  YouPlayAgain: "you press আবার খেলো",
  FriendLinkOpens: "a friend's link opens",
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
