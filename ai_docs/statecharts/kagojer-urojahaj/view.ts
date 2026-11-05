export const title = "Kagojer Urojahaj after the rewrite: flight, list, window, hold and wind";
const game = (v: any) => v.picking ? (v.phase === "paused" ? "সব লেভেল open, flight paused" : "সব লেভেল open")
  : ({ title: "Title (ছোড়ো)", story: "Story panels", flying: "Plane flying", paused: "Paused", over: "End screen" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
});
export const step = (action: string) => ({
  YouThrow: "you press ছোড়ো",
  YouPress: "you press the scene (or Space)",
  YouLetGo: "you let go",
  StoryEnds: "the story ends",
  TheFlightEnds: "the plane lands or the last page falls",
  TheCheerPlays: "the celebration plays",
  YouPlayAgain: "you press আবার খেলো / পরের লেভেল",
  YouReset: "you restart or pick a level",
  YouOpenTheList: "you open সব লেভেল",
  YouCloseTheList: "you close সব লেভেল",
  YouPause: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.picking ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
