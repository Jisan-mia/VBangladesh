export const title = "ভুল কোথায়?: pictures, clock, window and level list";
const game = (v: any) => ({
  ready: "Veil: শুরু করো",
  playing: v.found ? "Hunting, one found (clock running)" : "Hunting, none found (clock running)",
  paused: "Veil: থেমে আছে",
  done: v.cheer ? "Stars and card, confetti on its way" : "Stars and card",
} as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Levels: v.drawer ? "Level list open" : "Level list shut",
});
const steps: Record<string, string | null> = {
  YouStart: "you press শুরু করো or চালিয়ে যাও",
  YouFindOne: "you circle a difference",
  YouFindTheLast: "you circle the last difference",
  CheerFires: "the confetti falls",
  YouPlayALevel: "you start a level (পরের লেভেল, আবার খেলো, শুরু থেকে or one from the list)",
  FriendsLinkOpens: null,
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouOpenTheLevels: "you open সব লেভেল",
  YouCloseTheLevels: "you close সব লেভেল",
};
// A friend's link opening mid-game (a reset to the ready veil from every state) is hidden; see README.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "done" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
