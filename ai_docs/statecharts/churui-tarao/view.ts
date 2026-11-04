export const title = "Churui Tarao after the rewrite: the afternoon, the list, the window and a link";
const game = (v: any) => v.picking ? (v.phase === "paused" ? "সব ক্ষেত open, afternoon paused" : "সব ক্ষেত open")
  : v.phase === "playing" && v.boss === "here" ? "Boss bird at the grain, dusk waits"
  : ({ title: "Title (মাঠে নামো)", playing: v.eating ? "Birds pecking (rustle)" : "Afternoon on, grass clear", paused: "Paused", over: v.outcome === "lost" ? "Card shows: all grain gone" : "Card shows: dusk, field passed" } as any)[v.phase];
const link = (v: any) => v.link === "none" ? "No friend's link"
  : v.link === "other" ? "Friend's link, another ক্ষেত picked"
  : v.seed === "theirs" ? "Friend's afternoon, their seed" : "Friend's afternoon, your own seed";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Link: link(v),
});
export const step = (action: string, _from: any, to: any) => ({
  YouStart: "you press মাঠে নামো",
  ABirdLands: "a bird lands at the grain",
  TheGrassClears: "the last bird at the grain is shooed",
  TheBossArrives: "the boss bird flies in",
  YouChaseTheBossOff: "you clap the boss off for good",
  YouTapTheField: "you tap the field",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheList: "you open সব ক্ষেত",
  YouCloseTheList: "you close সব ক্ষেত",
  YouPickAField: "you pick a ক্ষেত",
  DuskFalls: "dusk falls, the field is passed",
  TheGrainIsGone: "the last grain is eaten",
  CheerFires: "the celebration timer fires",
  YouPlayAgain: "you press আবার খেলো",
  YouGoOn: "you press পরের ক্ষেত",
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
