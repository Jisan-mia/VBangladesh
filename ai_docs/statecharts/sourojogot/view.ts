export const title = "সৌরজগতের সফর: screens, the end timer or ▶, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The launch picture (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The end screen (আবার খেলো / শেষ)";
  if (v.pending === "end") return "Last planet right, stars saved, the end screen in 1.5 s";
  if (v.pending === "wait") return "Last answer right, stars saved, waiting for ▶";
  if (v.revealed) return "Right answer shown, waiting for ▶";
  return v.item === 1 ? "First question" : "Last question";
};
export const state = (v: any) => ({
  Round: screen(v),
  Menu: v.paused ? "Pause menu open, the timer waits" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  TheMenuOpensTheLevelList: "সব লেভেল in the player's menu",
  YouPickALevel: "the child picks a level",
  YouTapAWrongAnswer: "the child taps a wrong planet or picture",
  YouTapTheRightAnswer: "the child taps the right one",
  TheNextButton: "the child taps ▶",
  TheEndButtonIsTapped: "the child taps ▶ after the last answer",
  TheEndTimerFires: "the end timer fires",
  YouGoAway: "the window blurs, or ⏸ / P / Esc",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the end screen",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
