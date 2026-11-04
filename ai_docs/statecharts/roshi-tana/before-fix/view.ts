export const title = "রশি টানাটানি: the match, the window, the beat clock and the crowd";
const match = (v: any) =>
  v.phase === "ready" ? "Drum waiting for your tap" : v.phase === "over" ? "Card shows" : v.paused ? "Paused" : v.unseen > 0 ? "Beats going by unseen" : "Pulling on the beat";
export const state = (v: any) => ({
  Match: match(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "You're on the field" : "Field scrolled away",
  Crowd: v.hum === "live" ? "Crowd playing" : v.hum === "stub" ? "Crowd silent (made while muted)" : "No crowd",
  Sound: v.sound ? "Sound on" : "Sound off",
});
const STEPS: Record<string, string | null> = {
  YouStart: "you tap the drum to start",
  YouWinTheMatch: "the ribbon reaches our line",
  YouLoseTheMatch: "the ribbon reaches their line",
  BeatGoesByUnseen: "a beat goes by while the loop is frozen",
  LoopCatchesUp: "the game catches up all the missed beats at once",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the field away",
  ScrollBack: "you scroll the field back",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouPickALevel: null,
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
