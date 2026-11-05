export const title = "Dosh ghater nouka (boat race): screens, the race, pause, the mode chips, the share gate and the daily limit";
const screen = (v: any) => {
  if (v.screen === "title") return "The river (খেলো)";
  if (v.screen === "levels") return "The level list";
  if (v.screen === "end") return "The end page (আবার খেলো / শেষ)";
  if (v.over) return "Your boat at the last ghat, stars saved, the page in 1.3 s";
  if (v.spin === "turning") return "The চরকি turning";
  if (v.spin === "landed") return "Tap the ghats";
  return "Press the চরকি";
};
export const state = (v: any) => ({
  Race: screen(v),
  Menu: v.away || v.paused ? "Menu open or away, the boats wait" : "Playing",
  Today: v.resting ? (v.screen === "play" ? "Time's up, the rest waits for the end page" : "Rest screen") : "Time left today",
});
export const step = (action: string) => ({
  YouStartARace: "the child taps খেলো or আবার খেলো",
  YouOpenTheLevelList: "the child opens the level list",
  YouPickALevel: "the child picks a level",
  YouPressTheSpinner: "the child presses the চরকি",
  TheSpinnerLands: "the চরকি stops",
  YouTapAWrongGhat: "the child taps a wrong ghat",
  YouTapTheRightGhat: "the child taps the right ghat",
  TheEndPageComes: "the end page comes",
  YouOpenTheMenu: "⏸ / P / Esc",
  YouLeave: "the window blurs or hides",
  YouComeBack: "the window is back",
  YouResume: "চালিয়ে যাও",
  YouGoBackToTheTitle: "নতুন করে শুরু, সব লেভেল, or শেষ",
  YouTapTheOtherMode: "the child taps the other mode chip",
  AGrownUpOpensTheGate: "a grown-up opens বড়দের জন্য",
  TheGateCloses: "the share gate closes",
  YouHoldEnter: "the child holds Enter",
  TheKeyRepeats: "Enter auto-repeats on the end page",
  YouLetGoOfTheKey: "the child lets go of the key",
  TimeIsUp: "today's play time runs out",
  ThePageOpens: "the page opens again",
  TenMoreMinutes: "a grown-up gives আজ আরও ১০ মিনিট",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
