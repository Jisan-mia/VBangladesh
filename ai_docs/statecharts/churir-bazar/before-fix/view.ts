export const title = "চুড়ির বাজার: tray, pause, window, drag, rattle and cheer";
const trays: Record<string, string> = {
  ready: "Waiting for your first swap",
  still: "Tray still, your move",
  busy: "Bangles lifting and falling",
  final: "Last move's bangles falling",
  stuck: "No swap left, চুড়ি ঝাঁকাও shows",
  shaking: "Tray shaking",
  won: "Level cleared, card shows",
  lost: "Out of moves",
};
export const state = (v: any) => ({
  Tray: v.paused ? "Paused" : trays[v.g],
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Pointer: v.drag ? "A bangle is being dragged" : "Pointer free",
  Sound: !v.sound ? "Sound off" : v.rattle ? "Sound on, rattle playing" : "Sound on, no rattle",
  Cheer: v.cheer ? "End sound and confetti still to come" : "Nothing to come",
});
const midRound = (v: any) => !["ready", "won", "lost"].includes(v.g);
export const step = (action: string, from: any) =>
  action === "YouStartALevel" && midRound(from) ? null
  : ({
  YouSwap: "you swap two bangles",
  YouStartADrag: "you press on a bangle",
  ThePointerMovesAcross: "the pointer moves across the tray",
  YouLetGo: "you let go",
  TheCascadeEnds: "the tray settles",
  NoSwapIsLeft: "no swap is left",
  TheLevelIsWon: "the goals are met",
  TheMovesRunOut: "the moves run out",
  TheCheerPlays: "the end sound and confetti play",
  YouShakeTheTray: "you press চুড়ি ঝাঁকাও",
  TheShakeEnds: "the shake ends",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouStartALevel: "you start a level or open a friend's link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => (v.g === "won" || v.g === "lost" ? "done" : v.paused ? "held" : "play");
export const colors = { play: "teal", held: "yellow", done: "blue" };
