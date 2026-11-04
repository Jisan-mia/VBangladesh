export const title = "ঝালমুড়ি সাপ: run, window, board, card guard, celebration and link";
const game = (v: any) => ({ ready: "Ready screen", playing: "Snake moving", paused: "Paused", over: "Card shows" } as any)[v.phase];
const link = (v: any) => !v.friend ? "No friend's link" : v.on !== "theirs" ? "Another level picked" : v.seed === "theirs" ? "Friend's ঠোঙা on the board" : "Friend's level, other ঠোঙা";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Board: v.inView ? "Board on screen" : "Board scrolled away",
  Guard: v.guard ? "Card buttons wait 0.7 s" : "Card buttons ready",
  Celebration: v.cheer ? "Stars or confetti queued" : "Nothing queued",
  Link: link(v),
});
export const step = (action: string, from: any, to: any) => {
  if (action === "YouPlayAgain") return to.on === "theirs" ? "you press আবার খেলো on the friend's level" : "you press আরেকবার or পরের লেভেল";
  if (action === "RunEnds") return to.cheer ? "the run ends with stars or a record" : "the snake crashes";
  if (action === "YouPickLevel") return to.on === "theirs" ? "you pick the friend's level" : "you pick another level or ক্লাসিক";
  return ({
    YouStart: "you press শুরু করো or swipe",
    YouPause: "you press P or the pause button",
    YouResume: "you press চালিয়ে যাও",
    GuardLifts: "0.7 s pass",
    CheerPlays: "the stars or confetti play",
    FriendLinkOpens: "a friend's link opens",
    WindowBlurs: "you click into another window",
    WindowFocuses: "you come back to the window",
    TabHides: "you hide the tab",
    TabShows: "the tab shows again",
    YouScrollAway: "you scroll the board away",
    YouScrollBack: "you scroll back to the board",
  } as Record<string, string>)[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
