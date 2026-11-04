export const title = "গোলকধাঁধা: the run, the window, your finger and the card";
const game = (v: any) => ({
  ready: "Waiting at home",
  playing: v.walking ? "Walking, clock running" : "Standing at a junction, clock running",
  paused: "Paused (থেমে আছে)",
  over: v.generous ? "At the shop, graded at the slow par" : "At the shop, card shows",
} as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: v.window === "hidden" ? "Tab hidden" : v.window === "focused" ? "You're on the page" : "Another window has focus",
  Finger: v.hand === "off" ? "Hands off" : v.hand === "down" ? "Finger or mouse held on the board" : "Button up, but the game still thinks it's held",
  Speed: v.slow ? (v.walkedFast ? "ধীরে খেলো on, after walking at full speed" : "ধীরে খেলো on") : "Full speed",
  Maze: v.kind === "daily" ? "Today's maze" : "A level",
  Card: v.went === "otherwise" ? "Enter did something the gold button doesn't say" : "Card keys as labelled",
});
export const step = (action: string) => ({
  YouPressArrow: "you press an arrow",
  YouPutFingerDown: "you put a finger or the mouse down on the board",
  YouSwipe: "you swipe",
  MouseDriftsWithNoButton: "you move the mouse without pressing",
  YouLiftFinger: "you lift your finger",
  YouLetGoElsewhere: "you let go in the other window",
  BrowserCancelsTouch: "the phone cancels the touch",
  WalkerStopsAtJunction: "the walker stops at a junction",
  WalkerReachesShop: "the walker reaches the shop",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  YouToggleSlow: "you press ধীরে খেলো",
  YouPlayAgain: "you press আবার শুরু or আবার খেলো",
  YouPickDaily: "you press আজকের ধাঁধা",
  YouPickLevel: "you pick a level",
  YouPressCardButton: "you press the card's gold button",
  YouPressEnterOnCard: "you press Enter on the card",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
