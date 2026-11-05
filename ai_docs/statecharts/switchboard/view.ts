export const title = "Switchboard (after the rewrite): the board, what holds it, the hum";
// Regions as the player sees them: the board, the window and menu, the hum.
export const state = (v: any) => ({
  Board: v.screen === "title" ? (v.linked ? "Friend's board on the start card" : "Start card")
    : v.screen === "over" ? "All bulbs lit, stars show"
    : v.sheet ? "সব লেভেল open, board held"
    : v.moves === 0 ? "Fresh board, live" : "Flipping switches",
  Window: v.away ? "You're away, menu up" : v.menu ? "Pause menu" : v.guard ? "Just came back (the next tap only wakes)" : "You're on the page",
  Hum: v.hum === "real" ? "Hum playing" : v.sound ? "Hum quiet" : "Sound off",
});
// Merged: every way to a fresh start card (নতুন করে শুরু, a picked level, পরের লেভেল, a friend's link) is "you start a new board".
export const step = (action: string) => ({
  YouStart: "you press শুরু করো",
  YouPressASwitch: "you press a switch",
  YouLightTheLastBulb: "you light the last bulb",
  YouTakeBack: "you take a press back",
  YouLeave: "you click away or hide the tab",
  YouComeBack: "you come back",
  YouOpenTheMenu: "you press ⏸ or P",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you start a new board",
  GuardPasses: "a moment passes",
  ResultGuardPasses: "a moment passes",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  YouPickALevel: "you start a new board",
  YouGoOn: "you start a new board",
  FriendLinkOpens: "you open a friend's link",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  ChimesPlay: "the star chimes play",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.away || v.menu || v.sheet ? "held" : v.screen === "title" ? "start" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", start: "purple" };
