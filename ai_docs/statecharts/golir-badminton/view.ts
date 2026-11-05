export const title = "গলির ব্যাডমিন্টন after the rewrite: the match, the window, the finger, the breath and the wind";
const game = (v: any) => {
  if (v.skipped) return "Result skipped by a key";
  if (v.sheet) return "Level list open";
  if (v.phase === "over") return v.fresh ? "Result just appeared" : "Result shows";
  if (v.phase === "title") return "First screen";
  if (v.paused) return "Paused (menu)";
  return v.breath ? "A breath before the shuttle moves" : "Rally in play";
};
const where = (v: any) => !v.visible || !v.focused ? "You're away" : "You're on the court";
export const state = (v: any) => ({
  Game: game(v),
  Window: where(v),
  Finger: v.held ? "Finger on the shuttle" : "Nothing held",
  Wind: v.wind === "live" ? "Wind blowing" : v.wind === "stub" ? "Silent stub" : "No wind",
  Sound: v.sound ? "Sound on" : "Sound off",
});
const labels: Record<string, string> = {
  YouStart: "you start a match",
  YouTouch: "you touch as the ring turns gold",
  YouDecide: "you lift or pull (the shot)",
  TheBreathEnds: "the breath ends",
  TheMatchEnds: "someone reaches the points",
  YouPressAKeyOnTheResult: "you press a key on the result",
  TheResultSettles: "a moment passes",
  WindowBlurs: "you leave (another window, or hide the tab)",
  TabHides: "you leave (another window, or hide the tab)",
  YouPause: "you press ⏸ or P",
  WindowFocuses: "you come back",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  OpenTheList: "you open the level list",
  CloseTheList: "you close the level list",
  TheLoopRemounts: "the game loop remounts",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string) => {
  if (action === "SoundOff" || action === "SoundOn" || action === "TheLoopRemounts") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.paused || v.sheet ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
