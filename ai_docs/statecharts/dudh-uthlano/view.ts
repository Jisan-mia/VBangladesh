export const title = "Dudh uthlano: screen, pot, window, hand, hum, celebration and link";
const game = (v: any) => ({
  title: "Title",
  waiting: "Pot waiting on the stove",
  rising: "Milk rising",
  result: "Pot's score shows",
  over: "End screen",
} as any)[v.game];
export const state = (v: any) => ({
  Game: game(v),
  Choice: v.choice === "menu" ? "Player menu open" : v.choice === "list" ? "Level list open" : "No menu or list",
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "on" ? "You're on the page" : "Another window has focus",
  Hand: v.held ? "Holding Space or a finger" : v.away === "breath" ? "Hands off, a breath after coming back" : "Hands off",
  Hum: v.hum ? "Stove hums" : "No hum",
  Sound: v.sound ? "Sound on" : "Sound off",
  Celebration: v.cheer ? "Confetti queued" : "Nothing queued",
  Link: v.link === "none" ? "No friend's link" : v.link === "theirs" ? "Friend's pots" : "Another level open",
});
export const step = (action: string, from: any, to: any) => ({
  YouPressStart: "you tap the pot to start",
  YouPressToLight: "you press and hold the big button",
  YouPressToLift: "you press the big button to lift the pot",
  YouLetGoQuickly: "you let go quickly",
  YouLetGoAfterHolding: "you let go after holding",
  MilkSpills: "the milk boils over",
  NextPotComes: "the next pot comes",
  RoundEndsCleared: "the last pot is scored and the level is cleared",
  RoundEndsFailed: "the last pot is scored and the level is not cleared",
  CheerPlays: "the confetti plays",
  YouPlayAgain: "you press play again",
  YouPlayNext: "you press next level",
  YouOpenList: "you open the level list",
  YouPickLevel: "you pick a level from the list",
  YouCloseList: "you close the list",
  YouOpenMenu: "the player's menu opens",
  YouResume: "you press resume",
  FriendLinkOpens: "a friend's link opens",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  BreathPasses: "the breath after coming back passes",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.game === "over" ? "done" : v.choice !== "none" ? "held" : v.game === "rising" ? "play" : "wait";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
