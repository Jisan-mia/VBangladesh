export const title = "ছবির টুকরো: round and clock, window, your hand, the cheer and open levels";
const set = (v: any): number[] => Array.isArray(v.cleared) ? v.cleared : Object.values(v.cleared ?? {}) as number[];
const game = (v: any) => ({
  ready: "Pieces in the tray, clock at zero",
  playing: "Putting pieces in, clock running",
  paused: "Paused (থেমে আছে), clock stopped",
  done: "The painting is whole, result shows",
} as any)[v.phase];
const opened = (v: any) => {
  const done = set(v), unlocked = Math.min(2, 1 + Math.max(0, ...done));
  let run = 0; while (done.includes(run + 1)) run++;
  return unlocked > Math.min(2, 1 + run) ? "A level opened that you never earned" : unlocked > 1 ? "Level 2 open, earned" : "Only level 1 open";
};
export const state = (v: any) => ({
  Game: `${game(v)} (level ${v.level})`,
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.hand === "drag" ? "A piece under your finger" : "Hands off",
  Cheer: v.cheer ? "Win sound and confetti still to go off" : "Nothing waiting",
  Levels: opened(v),
});
// Hidden: picking a level from সব লেভেল in the middle of a round (it acts like আবার খেলো and would add 8 arrows).
export const step = (action: string, from: any) => action === "YouPickALevel" && (from.phase === "playing" || from.phase === "paused") ? null : ({
  YouTouchAPiece: "you tap a piece",
  YouPickUpAPiece: "you pick up a piece and drag it",
  YouDropItWrong: "you drop it in the wrong place",
  YouPlaceTheLastPiece: "the last piece goes in",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the page",
  TabHides: "you hide the tab",
  TabShows: "you come back to the page",
  YouResume: "you press চালিয়ে যাও",
  CheerFires: "the win sound and confetti go off",
  YouPressNextLevel: "you press পরের লেভেল, আবার খেলো or a level in সব লেভেল",
  YouPlayAgain: "you press পরের লেভেল, আবার খেলো or a level in সব লেভেল",
  YouPickALevel: "you press পরের লেভেল, আবার খেলো or a level in সব লেভেল",
  FriendLinkOpens: "you open a friend's link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "done" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
