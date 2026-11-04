export const title = "দুধ উথলানোর আগে: pot, window, hand, hum, celebration and link";
const game = (v: any) => v.paused ? "Paused" : ({
  waiting: "Pot waiting on the stove",
  rising: "Milk rising",
  result: "Pot's score shows",
  over: "Card shows",
} as any)[v.phase];
const link = (v: any) => !v.friend ? "No friend's link" : v.on !== "theirs" ? "Another kitchen open" : v.seed === "theirs" ? "Friend's pots on the stove" : "Friend's kitchen, other pots";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.hold ? "Holding Space or a finger" : "Hands off",
  Hum: v.hum ? "Stove hums" : "No hum",
  Sound: v.sound ? "Sound on" : "Sound off",
  Celebration: v.cheer ? "Stars or confetti queued" : "Nothing queued",
  Link: link(v),
});
export const step = (action: string, from: any, to: any) => action === "YouPickKitchen"
  ? (to.on === "theirs" ? "you pick the friend's kitchen from সব রান্নাঘর" : "you pick another kitchen from সব রান্নাঘর")
  : ({
  YouPressToResume: "you press চালিয়ে যাও",
  YouPressToLight: "you press and hold চেপে ধরো",
  YouPressToLift: "you press নামাও",
  YouLetGoQuickly: "you let go quickly",
  YouLetGoAfterHolding: "you let go after holding",
  MilkSpills: "the milk boils over",
  NextPotComes: "the next pot comes",
  RoundEnds: "the round ends and the card shows",
  CheerPlays: "the stars or confetti play",
  YouPlayOn: "you press আরেকবার or পরের রান্নাঘর",
  YouPlayFreshPots: "you press নতুন পাতিলে খেলো",
  FriendLinkOpens: "a friend's link opens",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : v.phase === "rising" ? "play" : "wait";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
