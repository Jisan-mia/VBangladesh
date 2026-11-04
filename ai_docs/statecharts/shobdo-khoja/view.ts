export const title = "শব্দ খোঁজা: round, window, finger and levels";
const struck = (v: any) => v.found ? ", 1 of 2 struck" : "";
const game = (v: any) => ({
  ready: "Grid waiting, clock stopped",
  playing: `Hunting, clock running${struck(v)}`,
  paused: `Pause card, clock stopped${struck(v)}`,
  over: "All words struck, card shows",
} as any)[v.phase];
const levels = (v: any) => {
  const c: number[] = v.cleared ?? [];
  if (!c.length) return v.friend ? "Nothing cleared, friend's level 2 open" : "Nothing cleared";
  if (c.includes(1)) return "Level 1 cleared, level 2 open";
  return "Only level 2 cleared, level 2 open for good";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Finger: v.press === "none" ? "Finger off the grid" : v.press === "down" ? "Finger on a letter" : "Dragging a stroke",
  Levels: levels(v),
});
export const step = (action: string, _from: any, to: any) => action === "YouLetGoOnAWord" && to.phase === "over" ? `you strike the last word of level ${to.stage}` : ({
  YouTouchALetter: "you touch a letter",
  YouDrag: "you drag across letters",
  YouLetGoOnAWord: "you let go on a listed word",
  YouLetGoElsewhere: "you let go without a word",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  FanfarePlays: null,
  YouPlayAgain: "you press আবার খেলো",
  YouGoToNextLevel: "you press পরের লেভেল",
  YouPickALevel: "you pick a level",
  FriendLinkOpens: "you open a friend's level-2 link",
} as Record<string, string | null>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
