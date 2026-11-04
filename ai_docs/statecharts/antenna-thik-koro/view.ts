export const title = "অ্যান্টেনা ঠিক করো: screen, window, hand, static and chimes";
const game = (v: any) => ({ title: "Title: the set says খেলো", ready: "Waiting for your first turn", search: "Searching for the signal", got: "Picture locked", over: "Card shows" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Menu: v.paused ? "Menu open, game paused" : "Menu shut",
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.held ? "Holding ← or →" : "Hands off",
  Static: v.hiss ? "Static on" : "Static off",
  Sound: v.sound ? "Sound on" : "Sound off",
  Chimes: v.chime ? "Card chimes playing" : "Quiet",
});
export const step = (action: string) => ({
  YouTapTheSet: "you tap the set",
  YouHoldTurn: "you hold ← or →",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouOpenTheMenu: "you press ⏸ or Esc",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  SignalLocks: "the picture locks",
  NextChannel: "the next channel starts",
  LastChannel: "the last channel locks and the card shows",
  ChimesEnd: "the chimes end",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouPlayOn: "you press ১, ২ or ৩ on the card",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.paused ? "held" : v.phase === "over" ? "done" : v.phase === "title" ? "start" : "play";
export const colors = { start: "blue", play: "teal", held: "yellow", done: "blue" };
