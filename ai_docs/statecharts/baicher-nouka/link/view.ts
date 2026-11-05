export const title = "বাইচের নৌকা: a friend's link and whose river the next race is";
export const state = (v: any) => ({
  Screen: ({ title: "Title", play: "Race on the water", calib: "তাল মেলাও running", over: "Result shows" } as any)[v.screen],
  Link: v.owed ? "Their river is owed" : "No debt",
  River: v.river === "theirs" ? "Their river" : "Your river",
});
export const step = (action: string) => ({
  YouStart: "you start a race", YouPickARace: "you pick a race from সব বাইচ", YouFinish: "you cross the finish rope",
  YouStartCalib: "you press তাল মেলাও", CalibEnds: "তাল মেলাও ends", LinkOpens: "a friend's link opens",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.owed ? "held" : v.screen === "play" ? "play" : "ready";
export const colors = { ready: "blue", play: "teal", held: "yellow", done: "purple" };
