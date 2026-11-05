export const title = "এবিসি বাজার: screens, the ➜, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The stall (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The basket (আবার খেলো / শেষ)";
  const item = v.idx === 1 ? "First item" : "Last item";
  if (v.solved) return v.idx === 2 ? "Last tile right, stars saved, waiting for ➜" : "Right tile, waiting for ➜";
  return item;
};
export const state = (v: any) => ({
  Round: screen(v),
  Menu: v.paused ? "Pause menu open, nothing moves" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the basket" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps the stall or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  YouPickALevel: "the child picks a level",
  YouCloseTheLevelList: "the child goes back from the list",
  YouTapAWrongTile: "the child taps a wrong tile",
  YouTapTheRightTile: "the child taps the right tile",
  YouPressTheArrow: "the child presses ➜",
  YouGoAway: "the window blurs, or ⏸ / P / Esc",
  TheWindowBlurs: "the window blurs before the menu opens",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the basket",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
