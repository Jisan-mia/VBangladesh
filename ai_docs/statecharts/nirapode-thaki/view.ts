export const title = "নিরাপদে থাকি: screens, the answer that waits for ➜, pause, the pace and the daily limit";
const screen = (v: any) => {
  if (v.screen === "title") return "The postcard (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The end screen (আবার খেলো / শেষ)";
  if (v.answered) return v.q === 2 ? "Last answer right, stars saved, ➜ waits" : "Right answer shows why, ➜ waits";
  return v.q === 1 ? "First question" : "Last question";
};
export const state = (v: any) => ({
  Round: screen(v),
  Menu: v.paused ? "Pause menu open" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end screen" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  YouPickALevel: "the child picks a level",
  YouTapAWrongPicture: "the child taps a wrong picture",
  YouTapTheSafePicture: "the child taps the safe picture",
  YouTapNext: "the child taps ➜",
  YouGoAway: "the window blurs, or ⏸ / P / Esc",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
