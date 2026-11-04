export const title = "কালবৈশাখী আম: storm, window, hand, wind, celebration and link";
const game = (v: any) => ({ ready: "Ready screen", playing: "Storm falling", paused: "Paused", over: "Card shows" } as any)[v.phase];
const link = (v: any) => !v.friend ? "No friend's link"
  : v.on !== "theirs" ? "Another storm picked"
  : v.seed === "theirs" ? "Friend's storm, their seed" : "Bar says friend's storm, your own storm falls";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.held ? "Holding ← / → or a side" : "Hands off",
  Wind: v.wind ? "Wind blowing" : "Wind quiet",
  Sound: v.sound ? "Sound on" : "Sound off",
  Celebration: v.cheer ? "Stars or confetti queued" : "Nothing queued",
  Link: link(v),
});
export const step = (action: string, from: any, to: any) => action === "YouPickStorm" ? (to.on === "theirs" ? "you pick the friend's storm from সব ঝড়" : "you pick another storm from সব ঝড়") : ({
  YouStart: "you press শুরু করো or আবার খেলো",
  YouHoldArrow: "you hold ← / →",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press থামাও or P",
  YouResume: "you press চালিয়ে যাও",
  StormEnds: "the storm ends and the card shows",
  CheerPlays: "the stars or confetti play",
  FriendLinkOpens: "a friend's link opens",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
