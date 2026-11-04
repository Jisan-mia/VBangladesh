export const title = "কার-চিহ্ন বসাও: screens, the word timer, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The slate (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The filled page (আবার খেলো / শেষ)";
  if (v.pending === "next") return "Right sign, the next word in 1.1 s";
  if (v.pending === "end") return "Last sign right, stars saved, the page in 1.1 s";
  return v.word === 1 ? "First word" : "Last word";
};
export const state = (v: any) => ({
  Round: screen(v),
  Menu: v.paused ? "Pause menu open, the timer waits" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the page" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  YouPickALevel: "the child picks a level",
  YouTapAWrongSign: "the child taps a wrong sign",
  YouTapTheRightSign: "the child taps the right sign",
  TheNextWordComes: "the next word comes",
  TheEndScreenComes: "the filled page comes",
  YouGoAway: "the window blurs, or ⏸ / P / Esc",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the page",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
