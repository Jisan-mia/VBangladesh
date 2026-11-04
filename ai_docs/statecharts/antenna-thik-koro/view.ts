export const title = "অ্যান্টেনা ঠিক করো: round, window, hand and static";
const game = (v: any) => v.phase === "over" ? "Card shows" : v.paused ? "Paused" : ({ ready: "Waiting for your first turn", search: "Searching for the signal", locked: "Picture locked" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.held ? "Holding ← or →" : "Hands off",
  Static: v.hiss ? "Static on" : "Static off",
  Sound: v.sound ? "Sound on" : "Sound off",
});
export const step = (action: string) => ({
  YouHoldTurn: "you hold ← or →",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  SignalLocks: "the picture locks",
  NextChannel: "the next channel starts",
  LastChannel: "the last channel locks and the card shows",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  PlayAgain: "you play again",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
