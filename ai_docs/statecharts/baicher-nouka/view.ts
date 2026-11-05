export const title = "বাইচের নৌকা: screen, window, menu, river rush, sound and friend's river";
const where = (v: any) => ({
  title: "Title", calib: "তাল মেলাও running", play: v.breath ? "Race (a breath after resuming)" : "Race on the water",
  over: v.since === "fresh" ? "Result, keys guarded" : "Result shows",
} as any)[v.screen];
export const state = (v: any) => ({
  Screen: where(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Menu: v.menu ? "Player's menu open" : "No menu",
  List: v.sheet ? "Race list open" : "Race list shut",
  Rush: v.rush ? "River rush on" : "River rush off",
  Sound: v.sound ? "Sound on" : "Sound off",
});
export const step = (action: string, from: any, to: any) => ({
  YouTapStart: to.owedAtStart ? "you tap খেলো (their river is owed)" : "you tap খেলো",
  YouTapAChoice: "you press আবার খেলো or পরের বাইচ",
  YouPressAKey: "you press a fresh key on the result",
  YouDrumTooSoon: "you tap Space for one more beat (refused)",
  YouPickARace: "you pick a race from সব বাইচ",
  YouRestartFromMenu: "you press নতুন করে শুরু",
  YouStartCalib: "you press তাল মেলাও",
  CalibEnds: "তাল মেলাও ends",
  YouSkipCalib: "you press বাদ দাও",
  RaceStep: "the boats row on",
  YouFinish: "you cross the finish rope",
  ResultAges: "the key guard ends",
  BreathPasses: "the breath ends",
  WindowBlurs: from.screen === "calib" ? "you click into another window (the pulses are void)" : "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press the pause button, P or Esc",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheList: "you open সব বাইচ",
  YouCloseTheList: "you close the list",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  LinkOpens: "a friend's link opens",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.menu || v.sheet || v.win !== "on" ? "held" : v.screen === "title" || v.screen === "calib" ? "ready" : "play";
export const colors = { ready: "blue", play: "teal", held: "yellow", done: "purple" };
