export const title = "সুর বানাই: screens, the beat loop, the draft, away and back, the pause menu and the daily limit";
const restUp = (v: any) => v.resting !== "no" && v.screen !== "play" && v.screen !== "free";
const screen = (v: any) => {
  if (restUp(v)) return v.resting === "atOpen" ? "Opens on the rest screen" : "Rest screen";
  if (v.screen === "play") return v.answered ? "Level matched, ➜ waits" : v.playing === "target" ? "Level: the tune plays" : v.playing === "mine" ? "Level: your copy plays" : v.heard ? "Level: heard, copying" : "Level: listen first";
  if (v.screen === "free") return v.playing === "free" ? "আমার সুর: your tune plays" : v.unsaved ? "আমার সুর: a tune in the draft" : "আমার সুর: empty grid";
  return ({ title: "Title: the card, আমার সুর, সব লেভেল", levels: "The level list", end: v.endKind === "kept" ? "End screen: the tune is kept" : "End screen: আবার খেলো / শেষ" } as any)[v.screen];
};
export const state = (v: any) => ({
  Screen: screen(v),
  Hand: v.paused ? "Pause menu open" : v.window === "here" ? "In the game" : "In another window or tab hidden",
});
export const step = (action: string) => ({
  YouTapACell: "you tap a cell, the draft is saved",
  YouClear: "you press মুছো",
  YouPressPlay: "you press বাজাও",
  YouPressStop: "you press থামাও",
  YouKeep: "you press রাখো",
  YouGoHome: "you press the home button",
  YouStartALevel: "you press খেলো or pick a level",
  YouStartFree: "you press আমার সুর",
  YouPlayAgain: "you press আবার খেলো",
  YouFinish: "you press শেষ",
  YouOpenTheLevelList: "you open সব লেভেল",
  YouCloseTheLevelList: "you close the list",
  YouListen: "you press শোনো",
  YouPlayYourCopy: "you press বাজাও on your copy",
  YouStopTheTune: "you press থামাও",
  YouCheckWrong: "you press মেলাও and it doesn't match",
  YouCheckRight: "you press মেলাও and it matches",
  YouPressNext: "you press the big ➜",
  NextBeat: "the next beat plays",
  TuneEnds: "the tune reaches its end",
  WindowBlurs: "you click into another window, or hide the tab",
  WindowFocuses: "you come back to the window",
  PlayerPauses: "the pause menu opens (⏸, P, Esc)",
  PlayerResumes: "চালিয়ে যাও",
  PlayerRestarts: "নতুন করে শুরু",
  PlayerOpensTheLevelList: "সব লেভেল in the menu",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  GrownUpGivesTime: "a grown-up gives 10 more minutes",
  YouHoldTheGate: "you hold বড়দের জন্য",
  YouLetGoOfTheGate: "you let go",
  GateTimerFires: "two seconds pass",
  GrownUpClosesGate: "the gate closes",
  YouTapAKidsToolCard: "you tap another kids' tool",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => restUp(v) ? "rest" : ["end", "levels", "title"].includes(v.screen) ? "card" : "play";
export const colors = { play: "teal", card: "blue", rest: "yellow" };
