export const title = "বর্ণ লিখি: screens, the finger, pause, the daily limit and keys";
const screen = (v: any) => {
  if (v.screen === "cover") return "The notebook cover (খেলো)";
  if (v.screen === "levels") return "The set list";
  if (v.screen === "end") return "The filled page (আবার খেলো / শেষ)";
  const last = v.letterNo === 2;
  return v.phase === "drawn" ? (last ? "Last letter's picture: শেষ" : "Letter's picture: পরেরটা") : (last ? "Tracing the last letter" : "Tracing a letter");
};
export const state = (v: any) => ({
  Set: screen(v),
  Hand: v.pointer ? "Finger on the board" : v.swallow ? "Back from away, the next tap only wakes" : "Hands off",
  Menu: v.paused ? "Pause menu open" : v.away ? "In another window" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the page" : "Rest screen") : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouStartASet: "the child taps খেলো or আবার খেলো",
  YouOpenTheSetList: "the child opens the set list",
  YouOpenTheSetListFromTheMenu: "সব লেভেল from the pause menu",
  YouGoBackFromTheList: "← from the set list",
  YouPickASet: "the child picks a set",
  YouTouchTheBoard: "the child touches the board",
  YouTraceTheLastStroke: "the finger writes the last stroke",
  
  YouLiftYourFinger: "the child lifts the finger",
  YouPressEnterOnTheBoard: "Enter replays the moving dot",
  YouTapNext: "the child taps →",
  
  YouGoBackToTheCover: "শেষ, or নতুন করে শুরু",
  WindowBlurs: "the window blurs",
  WindowFocuses: "the window comes back",
  PlayerMenuOpens: "⏸ / P / Esc opens the player's menu",
  YouResume: "চালিয়ে যাও",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the page",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
