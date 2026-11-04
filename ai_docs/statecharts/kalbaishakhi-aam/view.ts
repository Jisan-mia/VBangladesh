export const title = "Kalbaishakhi Aam after the rewrite: storm, list, window and link";
const game = (v: any) => v.picking ? (v.phase === "paused" ? "সব ঝড় open, storm paused" : "সব ঝড় open")
  : ({ title: "Title (ঝড় শুরু)", playing: "Storm falling", paused: "Paused", over: "Card shows" } as any)[v.phase];
const link = (v: any) => v.link === "none" ? "No friend's link"
  : v.link === "other" ? "Friend's link, another storm picked"
  : v.seed === "theirs" ? "Friend's storm, their seed" : "Friend's storm, your own seed";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Link: link(v),
});
export const step = (action: string, _from: any, to: any) => ({
  YouStart: "you press ঝড় শুরু (or tap, or an arrow)",
  YouHold: "you hold ← / → or a finger",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও (or tap the cover)",
  YouOpenTheList: "you open সব ঝড়",
  YouCloseTheList: "you close সব ঝড়",
  YouPickAStorm: "you pick a storm",
  StormEnds: "the storm ends and the card shows",
  CheerFires: "the celebration timer fires",
  YouPlayAgain: "you press আবার খেলো",
  YouGoOn: "you press পরের ঝড়",
  YouRestart: "you press নতুন করে শুরু",
  FriendLinkOpens: "a friend's link opens",
  YouHoldEnter: "you hold Enter",
  EnterRepeats: "Enter repeats",
  YouLetGoOfEnter: "you let go of Enter",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? (to ? action : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.picking ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
