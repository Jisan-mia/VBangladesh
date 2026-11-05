export const title = "গুনে দেখি: screens, the pond timer, the glimpse, pause, the daily limit and keys";
const game = (v: any) => {
  if (v.screen === "title") return "The title (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The end screen (আবার / শেষ)";
  if (v.pending === "next") return "Pond right, the next pond in 1.1 s";
  if (v.pending === "end") return "Last pond right, stars saved, the end screen in 1.1 s";
  return v.looking ? "এক নজরে: pattern showing" : "এক নজরে: pattern covered";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.paused ? "Pause menu open, everything waits" : v.away ? "Another window, everything waits" : "In front",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end screen" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার",
  YouOpenTheLevelList: "the level list opens (title, end, or the player's সব লেভেল)",
  YouCloseTheLevelList: "the child goes back from the list",
  YouPickALevel: "the child picks a level",
  YouTapAWrongAnswer: "the child taps a wrong answer",
  YouTapTheRightAnswer: "the child taps the right answer",
  YouTapTheCover: "the child taps the cover to look again",
  TheGlimpseEnds: "the pattern hides after 1.5 s",
  TheNextPondComes: "the next pond comes",
  TheEndScreenComes: "the end screen comes",
  WindowBlurs: "the window blurs or the tab hides",
  WindowFocuses: "the window comes back",
  TheMenuOpens: "⏸, P or Escape opens the menu",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheTitle: "নতুন করে শুরু, or শেষ",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "rest" : v.screen === "play" ? "play" : "between";
export const colors = { play: "teal", between: "blue", rest: "yellow" };
