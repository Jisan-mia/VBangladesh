export const title = "অ-তে অজগর (HEAD 6775639): level, pause menu, window, arrow key and levels";
const open = (v: any) => Math.max(v.unlocked, v.friend);
const game = (v: any) => {
  if (v.phase === "won") return v.menu ? "Card, menu open" : "Level done, card shows";
  if (v.phase === "ready") return v.menu ? "Start screen, menu open" : "Start screen (শুরু করো)";
  if (v.paused || v.menu) return "Paused, menu open";
  return v.window === "here" ? "Letters falling" : "Letters falling while you're away";
};
export const state = (v: any) => ({
  Game: game(v) + (v.opened > open(v) ? ", a level you opened is locked again" : ""),
  Window: v.window === "here" ? "You're on the page" : v.window === "blurred" ? "Another window has focus" : "Tab hidden",
  Basket: v.hand === "held" ? "Arrow held, basket heads for the edge" : v.hand === "stuck" ? "You let go, the basket still runs to the edge" : "Basket still",
});
const labels: Record<string, string> = {
  YouPressStart: "you press শুরু করো",
  YouHoldAnArrow: "you hold ← or →",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  YouPressPause: "you press ⏸ or Escape",
  YouRestart: "you press নতুন করে শুরু",
  TheLastLetterLands: "the last right letter lands",
  YouPlayAgain: "you press আবার খেলো",
  YouGoToTheNextLevel: "you press পরের লেভেল",
  YouPickALevel: "you pick a level",
  AFriendsLinkOpens: "a friend's link opens",
};
// Hidden: picking a level or opening a link from mid-level (the same reset from every state).
export const step = (action: string, from: any) => {
  if ((action === "YouPickALevel" || action === "AFriendsLinkOpens") && from.phase === "play") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "won" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
