export const title = "হাত ধুই, দাঁত মাজি: screens, the finish timer, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The title (খেলো, three pictures)";
  if (v.screen === "end") return "The end screen (আবার খেলো / শেষ)";
  if (v.pending === "end") return "Ring closed, stars saved, the end screen in 1 s";
  if (v.finished) return "Last card right, stars saved, waiting for →";
  return v.mode === "quiz" ? "কখন ধোব, a card to pick" : "Washing or brushing, the ring filling";
};
export const state = (v: any) => ({
  Round: screen(v),
  Window: v.paused ? "Pause menu open, everything waits" : v.away === "away" ? "Another window or tab, the ring waits" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps ▶ খেলো or আবার খেলো",
  TheRingCloses: "the ring closes",
  YouPickTheLastCard: "the child picks the last right card",
  YouPressTheArrow: "the child presses →",
  TheEndScreenComes: "1 s later the end screen comes",
  YouOpenTheMenu: "⏸ / P / Esc opens the menu",
  YouResume: "চালিয়ে যাও",
  WindowBlurs: "the window blurs or the tab hides",
  WindowComesBack: "the window comes back",
  YouGoBackToTheTitle: "নতুন করে শুরু, সব লেভেল, or শেষ",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the end screen",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
