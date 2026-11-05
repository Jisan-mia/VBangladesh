export const title = "ছবির টুকরো after the rewrite: the round and its clock, the window, your hand, the sheet and open levels";
const set = (v: any): number[] => Array.isArray(v.cleared) ? v.cleared : Object.values(v.cleared ?? {}) as number[];
const game = (v: any) => v.sheet ? "সব লেভেল open, clock stopped" : ({
  title: "The title: the box lid and খেলো",
  playing: "Putting pieces in, clock running",
  paused: "Paused (the player's menu), clock stopped",
  over: "The picture is whole, result shows",
} as any)[v.phase];
const opened = (v: any) => {
  const done = set(v);
  let run = 0; while (done.includes(run + 1)) run++;
  return v.unlock > Math.min(2, 1 + run) ? "A level opened that you never earned" : v.unlock > 1 ? "Level 2 open, earned" : v.visit === 2 ? "Only level 1 open, a friend's level 2 to visit" : "Only level 1 open";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.hand === "drag" ? "A piece under your finger" : "Hands off",
});
void opened;
// Hidden, to keep the chart readable (all still checked by TLC): the hidden tab (it takes the blur's path), a friend's
// link and নতুন করে শুরু (both go to the title), a level from the sheet (it acts like আবার খেলো), and the result's timers.
const HIDDEN = new Set(["TabHides", "TabShows", "FriendLinkOpens", "YouRestart", "YouPickALevel", "CheerFires"]);
export const step = (action: string) => HIDDEN.has(action) ? null : ({
  YouPressPlay: "you press খেলো",
  YouPickUpAPiece: "you pick up a piece",
  YouDropItWrong: "you drop it in the wrong place",
  YouPlaceTheLastPiece: "the last piece goes in",
  CheerFires: "the confetti and the result come up",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the page",
  TabHides: "you hide the tab",
  TabShows: "you come back to the page",
  YouResume: "you press চালিয়ে যাও (or tap once)",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  YouPickALevel: "you pick a level",
  YouPressNextLevel: "you press পরের লেভেল or আবার খেলো",
  YouPlayAgain: "you press পরের লেভেল or আবার খেলো",
  YouRestart: "you press নতুন করে শুরু",
  FriendLinkOpens: "you open a friend's link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.sheet ? "held" : v.phase === "title" ? "start" : "play";
export const colors = { start: "tan", play: "teal", held: "yellow", done: "blue" };
