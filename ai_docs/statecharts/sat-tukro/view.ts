export const title = "সাত টুকরো: picture, hand, window, pause, picture list and daily limit";
const game = (v: any) => {
  if (v.exit === "share") return "Parent opens the gate: plain link or print sheet";
  if (v.resting && v.screen !== "play") return "Rest screen";
  if (v.screen === "title") return "Title (the board is খেলো)";
  if (v.screen === "levels") return v.back === "play" ? "Picture list, the half-built picture kept" : "Picture list";
  if (v.screen === "end") return "End screen (আবার খেলো / শেষ)";
  if (v.pending) return "Picture done, stars saved, the cheer";
  return v.placed === 0 ? "Empty shadow" : "Half built";
};
export const state = (v: any) => ({
  Picture: game(v),
  Hand: v.grip ? "Dragging a piece" : v.focused ? (v.swallow ? "Back from away, the next press only wakes" : "Hands off") : "Away",
  Player: v.paused ? "Pause menu open, the cheer waits" : "Playing",
});
export const step = (action: string) => ({
  YouStartAPicture: "the child taps খেলো or আবার খেলো",
  YouPressAPiece: "you press a piece",
  YouDropItInPlace: "you drop it in its place",
  YouDropItWrong: "you drop it in the wrong place",
  TouchIsCancelled: "the phone cancels the touch",
  WindowBlurs: "you click into another window",
  YouLetGoAway: "you let go over the other window",
  WindowFocuses: "you come back to the window",
  YouPause: "⏸, P or Esc",
  YouResume: "চালিয়ে যাও",
  YouRestartFromTheMenu: "নতুন করে শুরু",
  CheerEnds: "the cheer ends and the end screen shows",
  YouOpenThePictures: "you open the picture list",
  YouGoBack: "ফিরে যাও",
  YouPickThisPicture: "you pick the picture you are building",
  YouPickAnotherPicture: "you pick a picture",
  YouPressShesh: "you press শেষ",
  TimeIsUp: "today's play time runs out",
  ParentGivesMoreTime: "a grown-up gives আজ আরও ১০ মিনিট",
  ParentOpensThePrintSheetOrShares: "a grown-up opens the gate and shares or prints",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.exit !== "none" ? "gone" : v.resting && v.screen !== "play" ? "rest" : v.screen === "play" ? "play" : "between";
export const colors = { play: "teal", between: "blue", rest: "yellow", gone: "orange" };
