export const title = "সমান ভাগ: screens, the piece in hand, the ➜, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The mat (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The end screen (আবার খেলো / শেষ)";
  const serving = v.idx === 1 ? "First guests" : "Last guests";
  if (v.solved) return v.idx === 2 ? "Last table served, stars saved, waiting for ➜" : "Table served, every face smiling, waiting for ➜";
  return v.hand ? `${serving}: a piece in the hand` : serving;
};
export const state = (v: any) => ({
  Round: screen(v),
  Menu: v.paused ? "Pause menu open, nothing moves" : v.swallow ? "Back from away, the next touch only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end screen" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps the mat or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  YouPickALevel: "the child picks a level",
  YouCloseTheLevelList: "the child goes back from the list",
  YouOpenLevelsFromTheMenu: "সব লেভেল in the pause menu",
  YouLiftAPiece: "the child lifts a piece",
  YouDropAPiece: "the child puts it on a plate that is still short",
  YouOverfillAPlate: "the child puts it on a plate with its share already",
  YouGiveTheLastPiece: "the child gives the last piece, everyone is equal",
  YouPressTheArrow: "the child presses ➜",
  YouGoAway: "⏸ / P / Esc, or the window blurs and the menu opens",
  TheWindowBlurs: "the window blurs before the menu opens",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheMat: "নতুন করে শুরু, or শেষ",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the end screen",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
