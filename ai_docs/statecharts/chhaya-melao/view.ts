export const title = "ছায়া মেলাও: the lamp, the wall, the toy in your hand, the hold, the rest screen";
const wall = (v: any) => {
  if (v.screen === "title") return "The unlit lamp (বাতি জ্বালাও)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "End screen (আবার খেলো / শেষ)";
  if (v.solved) return v.idx === 2 ? "Last shadow matched, round saved, the hold runs" : "Wall matched, the hold runs";
  return v.hand ? "A toy in your hand" : "A shadow on the wall";
};
export const state = (v: any) => ({
  Wall: wall(v),
  Window: v.screen !== "play" ? "Nothing to hold" : v.paused || v.away ? "Menu open or looking away, the hold waits" : "In front",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end screen" : "Rest screen") : "Time left today",
});
export const step = (action: string) => ({
  YouLightTheLamp: "you tap the lamp or আবার খেলো",
  YouOpenTheLevelList: "you open the level list",
  YouPickALevel: "you tap the lamp or আবার খেলো",
  YouCloseTheLevelList: "you go back from the list",
  YouLiftAToy: "you lift a toy",
  YouLetGoOfTheToy: "you drop it on a wrong shadow or in the air: it goes home",
  YouMatchAShadow: "you drop it on the right shadow (or tap it, with one shadow open)",
  TheHoldRunsOut: "the hold runs out: next wall or the end screen",
  YouGoAway: "the window blurs, or ⏸ / P / Esc",
  TheWindowBlurs: "the window blurs, or ⏸ / P / Esc",
  TheWindowComesBack: "চালিয়ে যাও, or the window comes back",
  YouResume: "চালিয়ে যাও, or the window comes back",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
