export const title = "উল্টো খেলা: screens, the rest after a picture, চটপট's clock, pause and away, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The launch picture (খেলো, আরামে / চটপট)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The end screen (আবার খেলো / শেষ)";
  if (v.pending === "end") return "Last picture done, stars saved, the end screen in 0.7 s";
  if (v.pending === "next") return v.item === 1 ? "First picture (demo) done, the next comes in 0.7 s" : "Picture done, the next comes in 0.7 s";
  return v.item === 1 ? "First picture (the ghost finger shows the tap)" : v.item === 2 ? "Last picture" : "A picture";
};
export const state = (v: any) => ({
  Round: screen(v),
  Pace: v.quick ? "চটপট on" : "আরামে",
  Eyes: v.paused ? "Pause menu open, every clock waits" : v.away ? "Away (another window or tab), every clock waits" : "Here",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার খেলো",
  YouChooseThePace: "the child picks আরামে or চটপট",
  YouOpenTheLevelList: "the child opens the level list",
  TheMenuOpensTheLevelList: "সব লেভেল in the player's menu",
  YouPickALevel: "the child picks a level",
  YouTapTheRightPicture: "the child taps the right picture",
  TheQuickClockPasses: "চটপট: 4 s of live time pass and the picture passes",
  TheRestEnds: "the picture's rest ends",
  ThePlayerPauses: "the player pauses (⏸, P, Esc)",
  YouResume: "চালিয়ে যাও",
  TheWindowLosesFocus: "the window blurs or the tab hides",
  TheWindowGetsFocusBack: "the window is back",
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
