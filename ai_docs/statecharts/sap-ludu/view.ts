export const title = "Sap Ludu after the rewrite: the race, the computer turn, the pause menu and the end screen";
const game = (v: any) => {
  if (v.screen === "title") return v.sheet ? "সব লেভেল sheet" : "Start card (big die)";
  if (v.screen === "over") return v.sheet ? "সব লেভেল sheet" : v.held ? "End screen, a key still held" : "End screen (stars, stats)";
  if (v.act === "moving") return "Die rolls, piece walks";
  if (v.act === "choosing") return v.seat === "bot" ? "Computer picks a piece" : "You pick a piece (১ or ২)";
  return v.seat === "bot" ? "Computer's turn" : "Your turn";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win !== "on" ? "Away, game paused" : v.menu ? "Pause menu" : v.breath ? "Breath after resume" : "Playing",
});
const hidden = new Set(["KeyUp", "YouCloseSheet", "TabHides", "YouHurry", "FriendLinkOpens"]);
const restartShown = (from: any) => from.screen === "play" && from.act === "moving";
export const step = (action: string, from: any) => (action === "YouRestart" && !restartShown(from)) || hidden.has(action) && !(action === "FriendLinkOpens" && from.screen === "title" && !from.friend) ? null : ({
  YouStart: "you tap the big die",
  YouRoll: "you tap the die",
  YouHurry: "you tap during the walk",
  YouPick: "you pick a piece",
  MoveEnds: "the piece lands",
  YouGetHome: "your piece gets home",
  BotRolls: "the computer rolls",
  BotPicks: "the computer picks",
  BreathEnds: "the breath ends",
  WindowBlurs: "you look away (other window or tab)",
  TabHides: "you hide the tab",
  YouComeBack: "you come back",
  YouPause: "you press P, Esc or ⏸",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  KeyHeldThrough: "you were holding Space as it ended",
  KeyUp: "you let go of the key",
  KeyRepeats: "the held key repeats (ignored)",
  YouGoNext: "you press পরের লেভেল / আবার",
  YouOpenSheet: "you open সব লেভেল",
  YouPickLevel: "you pick a level",
  YouCloseSheet: "you close the sheet",
  FriendLinkOpens: "a friend's link opens",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.win !== "on" || v.menu || v.breath ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
