export const title = "Baghbandi (after the rewrite): the game, the bot's beat, the pause menu, the window and the level sheet";
const game = (v: any) => {
  if (v.screen === "title") return v.friend && v.lv === 3 ? "Start card, friend's level" : "Start card";
  if (v.screen === "over") return v.fresh ? "Result, just shown" : "Result";
  if (v.sheet) return "Level sheet open, play held";
  return v.turn === "bot" ? "Bot's turn, it moves a beat later" : "Your move";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.menu ? (v.win === "on" ? "Pause menu" : "Away, pause menu up") : v.win === "on" ? (v.guard ? "Just came back" : "You're on the page") : "Away (another window or tab)",
});
const steps: Record<string, string | null> = {
  YouPickSide: "you pick বাঘ, ছাগল or দুজনে",
  YouPickLevel: "you step to another level",
  YouStart: "you press শুরু করো",
  YouMove: "you move a piece",
  BotMoves: "the bot moves",
  YouTakeBack: "you press ফিরিয়ে আনো",
  YouReopen: "you take back a lost lesson's last move",
  GuardEnds: null,
  ResultSettles: "a moment passes",
  YouGoOn: "you press পরের লেভেল / আবার খেলো (or a fresh Enter)",
  YouOpenSheet: "you open সব লেভেল",
  YouCloseSheet: "you close the sheet",
  YouPickFromSheet: "you pick a level from the sheet",
  WindowBlurs: "you look away (other window or tab)",
  TabHides: "you look away (other window or tab)",
  WindowFocuses: "you come back",
  TabShows: "you come back",
  YouPause: "you press ⏸, P or Escape",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: null,
  FriendLinkOpens: "a friend's link opens",
};
export const step = (action: string, from: any) => {
  // Shown where they matter: looking away from play, the friend's link and side picks from the start card only.
  if ((action === "WindowBlurs" || action === "TabHides" || action === "YouPause") && from.screen !== "play") return null;
  if ((action === "FriendLinkOpens" || action === "YouPickLevel") && from.screen !== "title") return null;
  return action in steps ? steps[action] : action;
};
export const group = (v: any) => v.screen === "over" ? "done" : v.screen === "title" ? "start" : v.sheet || v.menu || v.win !== "on" ? "held" : v.turn === "bot" ? "bot" : "play";
export const colors = { play: "teal", bot: "orange", held: "yellow", done: "blue", start: "purple" };
