export const title = "Golokdhadha after the rewrite: the screens, the menu, the window, your finger and the card";
const game = (v: any) => v.sheet ? "The level list is open" : ({
  title: "Title: the maze says খেলো",
  play: v.walking ? "Walking to the next turn" : "Standing at a turn",
  over: "At the shop, the card shows",
} as any)[v.screen];
export const state = (v: any) => ({
  Game: v.menu === "open" ? (v.screen === "over" ? "Card, menu open" : "Paused: the menu is open") : game(v),
  Window: v.window === "focused" ? "You're on the page" : "Away (another window or a hidden tab)",
  Finger: v.hand === "off" ? "Hands off" : v.hand === "down" ? "Finger on the board" : "Button up, but the game thinks it's held",
});
export const step = (action: string) => ({
  YouTapThePlayArt: "you tap the maze on the title",
  YouPickTodaysMaze: "you pick today's maze",
  YouSwipe: "you swipe or press an arrow",
  YouPutFingerDown: "you put a finger on the board",
  YouDragAcross: "you drag across the board",
  MouseMovesWithNoButton: "you move the mouse without pressing",
  YouLiftFinger: "you lift your finger",
  YouLetGoElsewhere: "you let go in the other window",
  WalkerStopsAtATurn: "the walker stops at a turn",
  WalkerReachesTheShop: "the walker reaches the shop",
  WindowBlurs: "you click into another window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouComeBackByKeyboard: "you come back with the keyboard",
  YouClickBackIn: "you click back into the page",
  YouPressPause: "you press ⏸, P or Esc",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  YouToggleSlow: "you switch ধীরে খেলো",
  YouHoldEnter: "you hold Enter",
  YouReleaseEnter: "you let go of Enter",
  HeldEnterRepeats: "the held Enter repeats on the card",
  YouPressEnterOnTheCard: "you press Enter on the card",
  YouPressTheMarkedButton: "you press the marked button",
  YouOpenTheList: "you open সব লেভেল",
  YouPickALevel: "you pick a level",
  YouCloseTheList: "you close the list",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.menu === "open" || v.sheet ? "held" : v.screen === "title" ? "start" : "play";
export const colors = { start: "blue", play: "teal", held: "yellow", done: "blue" };
