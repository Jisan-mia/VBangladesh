export const title = "ছক-জোড়া (after the rewrite): the quilt, কাটাকুটি, the bot's beat, the pause menu and the finger";
const game = (v: any) => {
  if (v.screen === "title") return "Start card";
  if (v.screen === "kata") return "কাটাকুটি (its bot marks only while you're here)";
  if (v.screen === "over") return v.fresh ? "Result, just shown" : "Result";
  if (v.sheet) return "Level sheet open, play held";
  if (v.turn === "bot") return "Bot's turn, it sews a beat later";
  return v.armed ? "Stitch armed: tap again to give the boxes" : v.mode === "pair" ? "A person's turn (two on one phone)" : "Your turn";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.menu ? (v.win === "on" ? "Pause menu" : "Away, pause menu up") : v.win === "on" ? (v.guard ? "Just came back" : "On the page") : "Away (another window or tab)",
  Finger: v.finger === "down" ? "Finger on the cloth" : "No finger",
});
const steps: Record<string, string | null> = {
  YouPickMode: "you pick একা or দুজনে",
  YouStart: "you press সেলাই শুরু",
  YouOpenKatakuti: "you open কাটাকুটি",
  YouPressTheCloth: "you touch the cloth",
  YouLiftAndArm: "you let go on a stitch that gives boxes away",
  YouLiftAndSew: "you sew (let go, or Enter on the cursor)",
  TheTouchIsCancelled: null,
  YouPressEnterOnTheCursor: "you sew (let go, or Enter on the cursor)",
  YouTakeBack: "you press ফিরিয়ে আনো",
  TheBotSews: "the bot sews",
  YouMarkACell: "you mark a cell",
  TheKatakutiBotMarks: "the কাটাকুটি bot marks",
  YouPlayAnotherRound: "you press আরেক দান",
  YouLeaveKatakuti: "you go back to the start card",
  GuardEnds: null,
  HandGuardEnds: null,
  ResultSettles: "a moment passes",
  YouGoOn: "you press পরের লেভেল / আবার খেলো (or a fresh Enter)",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close the sheet",
  YouPickFromTheSheet: "you pick a level from the sheet",
  WindowBlurs: "you look away",
  TabHides: "you look away",
  WindowFocuses: "you come back",
  TabShows: "you come back",
  YouPause: "you press ⏸, P or Escape",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: null,
};
export const step = (action: string, from: any, to: any) => {
  // Drawn where they matter: looking away and ⏸ from the quilt and কাটাকুটি, the sheet and modes from the start card or the quilt.
  if ((action === "WindowBlurs" || action === "TabHides" || action === "YouPause") && from.screen !== "play" && from.screen !== "kata") return null;
  if (action === "YouPickMode" && from.mode === to.mode) return null;
  if (action === "TheBotSews" && from.turn === to.turn && to.screen === "play") return null;
  if ((action === "YouOpenTheSheet" || action === "YouTakeBack") && (from.screen !== "play" || from.armed)) return null;
  if (action === "YouCloseTheSheet" && (to.turn === "bot" || to.armed)) return null;
  return action in steps ? steps[action] : action;
};
export const group = (v: any) => v.screen === "over" ? "done" : v.screen === "title" ? "start" : v.sheet || v.menu || v.win !== "on" ? "held" : v.screen === "kata" ? "kata" : v.turn === "bot" ? "bot" : "play";
export const colors = { play: "teal", bot: "orange", held: "yellow", done: "blue", start: "purple", kata: "pink" };
