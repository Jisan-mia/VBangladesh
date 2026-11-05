export const title = "ঘড়ি দেখি: screens, the clock under a finger, ▶, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "title") return "The clock (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The day's clocks (আবার খেলো / শেষ)";
  if (v.solved) return v.item === 2 ? "Last item right, stars saved, ▶ waits" : "Item right, ▶ waits";
  return v.item === 1 ? "First item" : "Last item";
};
export const state = (v: any) => ({
  Round: screen(v),
  Hand: v.grip ? (v.finger ? "A finger turns a hand" : "A hand held with no finger") : "Hands at rest",
  Window: v.paused ? "Pause menu open" : !v.focused ? "Another window" : v.swallow ? "Back from away, the next tap only wakes" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps খেলো or আবার খেলো",
  YouOpenTheLevelList: "the level list opens",
  YouPickALevel: "the child picks a level",
  YouPressTheClock: "a finger goes down on the clock",
  YouLiftYourFinger: "the finger comes up, the hand clicks in",
  YouLetGoInAnotherWindow: "the button comes up in another window",
  WindowBlurs: "the window blurs: the menu opens, the turn ends",
  WindowFocuses: "the window comes back",
  TheMouseHovers: "the mouse passes over the clock",
  YouGetItRight: "✓ or the right card",
  YouSlip: "a wrong answer: a wobble",
  YouPressNext: "▶",
  YouPause: "⏸, P or Escape",
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
