export const title = "Paka-Kancha (after the rewrite): the game and what holds it";
// Regions as the player sees them: the game, the window and menu. Where focus sits is checked in the full run (report.md) and left out of the drawing.
export const state = (v: any) => ({
  Game: v.screen === "title" ? (v.linked ? "Friend's level on the start card" : "Start card")
    : v.screen === "over" ? (v.won ? "Result: cracked, stars show" : "Result: not this time")
    : v.sheet ? "সব লেভেল open, game held"
    : v.input === "full" ? "Four digits typed" : v.input === "part" ? "Typing a row" : v.guesses === 0 ? "Fresh row" : "Row empty",
  Window: v.away ? "You're away, menu up" : v.menu ? "Pause menu" : v.guard ? "Just came back (the next tap only wakes)" : "You're on the page",
});
// Merged: every way to a fresh start card (নতুন করে শুরু, a picked level, পরের লেভেল, a friend's link) is "you start a new game".
export const step = (action: string) => ({
  YouStart: "you press শুরু করো",
  YouTypeADigit: "you type a digit",
  YouTapADigit: "you tap a digit on the pad",
  YouTapErase: "you tap মুছো",
  YouTabToAKey: "you press Tab",
  YouTapCheck: "you check the row",
  YouPressEnter: "you press Enter",
  YouLeave: "you click away or hide the tab",
  YouComeBack: "you come back",
  YouOpenTheMenu: "you press ⏸ or P",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you start a new game",
  GuardPasses: "a moment passes",
  ResultGuardPasses: "a moment passes",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  YouPickALevel: "you start a new game",
  YouGoOn: "you start a new game",
  FriendLinkOpens: "you open a friend's link",
  TheCheerPlays: null,
} as Record<string, string | null>)[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.away || v.menu || v.sheet ? "held" : v.screen === "title" ? "start" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", start: "purple" };
