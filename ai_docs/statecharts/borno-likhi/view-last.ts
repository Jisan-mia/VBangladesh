export const title = "বর্ণ লিখি: the last letter, writing it again, and a key held through the result";
export const state = (v: any) => ({
  Letter: v.screen === "end" ? "The end card" : v.phase === "drawn" ? "The last letter's picture" : "Tracing the last letter",
  Set: v.records === 0 ? "Stars not saved yet" : "Stars saved once",
  Key: v.held ? "Enter held down" : "Keys up",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouWriteTheLastStroke: "the finger writes the last stroke",
  YouTapWriteAgain: "the child taps আবার লিখি",
  YouTapNext: "the child taps শেষ",
  YouTapTheEndButton: "the child taps আবার খেলো",
  YouPressTheKey: "the child presses Enter",
  TheKeyRepeats: "Enter auto-repeats",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
