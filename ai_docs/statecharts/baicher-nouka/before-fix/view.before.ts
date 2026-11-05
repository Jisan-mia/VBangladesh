export const title = "বাইচের নৌকা: race, window, river view, rush sound and friend's river";
const race = (v: any) => ({
  ready: "Ready screen", calib: "তাল মেলাও running", playing: "Racing", paused: "Paused",
  over: v.since === "fresh" ? "Result, first 450 ms" : "Result shows",
} as any)[v.phase];
export const state = (v: any) => ({
  Race: race(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  River: v.seen ? "River on screen" : "River scrolled away",
  Rush: v.rush ? "Rush sound on" : "Rush sound off",
  Sound: v.sound ? "Sound on" : "Sound off",
});
export const step = (action: string, from: any, to: any) => action === "NewRace" ? (to.since === "skipped" ? "you tap Space for one more beat" : "you press আরেকবার or Space") : ({
  YouStart: "you tap শুরু করো or the drum",
  YouCalibrate: "you press তাল মেলাও",
  CalibEnds: "তাল মেলাও ends",
  YouFinish: "you cross the finish rope",
  ResultAges: "time passes on the result",
  YouTapDrumKey: "you tap Space for one more beat",
  YouPressAgain: "you press আরেকবার",
  YouPlayFromCard: "you press আরেকবার খেলো under the card",
  YouPickARace: "you pick a race from সব বাইচ",
  YouPause: "you press থামাও, P or Esc",
  YouResume: "you press চালিয়ে যাও",
  ScrollAway: "you scroll the river away",
  ScrollBack: "you scroll back to the river",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  LinkOpens: "a friend's link opens",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "ready" : "play";
export const colors = { ready: "blue", play: "teal", held: "yellow", done: "purple" };
