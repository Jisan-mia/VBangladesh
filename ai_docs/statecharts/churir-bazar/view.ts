export const title = "চুড়ির বাজার: tray, pause, window, press, rattle and notes";
const trays: Record<string, string> = {
  title: "Title: the medallion says খেলো",
  ready: "Waiting for your first swap",
  still: "Tray still, your move",
  anim: "Bangles lifting and falling",
  last: "Last move's bangles falling",
  shaking: "No swap left, the tray shakes",
  won: "Level cleared, end screen and card",
  lost: "Out of moves",
};
// The rules also watch the hand (a press in flight), the sound switch with the rattle loop, and the result's notes; the chart
// draws only the tray, the menu and the window, so it stays readable.
export const state = (v: any) => ({
  Tray: trays[v.g],
  Menu: v.paused ? "Menu open, tray paused" : "Menu shut",
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
});
export const step = (action: string, from: any) =>
  ({
    YouStartALevel: from.g === "title" ? "you press খেলো" : "you press আবার খেলো, পরের লেভেল or নতুন করে শুরু",
    YouPressABangle: "you press on a bangle",
    ThePointerMovesAcross: "you drag it onto its neighbour",
    TheMouseMovesWithNoButton: "the mouse moves with no button held",
    YouLetGo: "you let go",
    TheMoveSettles: "the tray settles",
    NoSwapIsLeft: "no swap is left",
    TheLevelIsWon: "the goals are met and the tray settles",
    TheMovesRunOut: "the moves run out",
    TheCheerEnds: "the notes finish",
    TheShakeEnds: "the shake ends",
    WindowBlurs: "you click into another window",
    WindowFocuses: "you come back to the window",
    TabHides: "you hide the tab",
    TabShows: "the tab shows again",
    YouPause: "you press P, ⏸, Esc or সব লেভেল",
    YouResume: "you press চালিয়ে যাও",
    SoundOff: "you turn sound off",
    SoundOn: "you turn sound on",
  } as Record<string, string | null>)[action] ?? action;
export const group = (v: any) => (v.g === "won" || v.g === "lost" ? "done" : v.paused ? "held" : "play");
export const colors = { play: "teal", held: "yellow", done: "blue" };
