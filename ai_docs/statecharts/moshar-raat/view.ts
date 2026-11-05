export const title = "Moshar Raat after the rewrite: the night, the list, the window and a link";
const game = (v: any) => v.picking ? (v.phase === "paused" ? "সব রাত open, night paused" : "সব রাত open")
  : ({ title: "Title (রাত শুরু)", playing: v.flying ? "Mosquitoes flying (পিন-পিন)" : "Night on, air clear", paused: "Paused", over: "Card shows" } as any)[v.phase];
const link = (v: any) => v.link === "none" ? "No friend's link"
  : v.link === "other" ? "Friend's link, another night picked"
  : v.seed === "theirs" ? "Friend's night, their seed" : "Friend's night, your own seed";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Link: link(v),
});
export const step = (action: string, _from: any, to: any) => ({
  YouStart: "you press রাত শুরু",
  AMosquitoArrives: "a mosquito flies in",
  TheAirClears: "the last one in the air is zapped or bites",
  YouHoldAnArrow: "you hold an arrow",
  YouLetGo: "you let go",
  YouTapTheRoom: "you tap the room",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheList: "you open সব রাত",
  YouCloseTheList: "you close সব রাত",
  YouPickANight: "you pick a night",
  NightEnds: "dawn comes, or the sleeper wakes",
  CheerFires: "the celebration timer fires",
  YouPlayAgain: "you press আবার খেলো",
  YouGoOn: "you press পরের রাত",
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
