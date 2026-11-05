export const title = "যুক্তবর্ণ ভাঙি-জুড়ি: screens, the child-paced next word, the level list, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The factory (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The filled page (আবার খেলো / শেষ)";
  if (v.waiting) return v.word === 1 ? "Word solved, waiting for পরেরটা" : "Last word solved, stars saved, waiting for the page";
  return v.word === 1 ? "First word" : "Last word";
};
export const state = (v: any) => ({
  Round: screen(v),
  Menu: v.paused ? "Pause menu open" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the page" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  YouCloseTheList: "the child closes the list (same round)",
  YouPickAnotherLevel: "the child picks another level",
  YouTryAWrongSet: "the child tries letters that don't fit",
  YouSolveTheWord: "the child places the last right letter",
  AMomentPasses: "0.4 s pass",
  YouPressNext: "the child taps পরেরটা",
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
