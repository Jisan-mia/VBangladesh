export const title = "বাঘবন্দি: game, bot, window and friend's link";
const game = (v: any) => {
  if (v.stage === "friend") return "Friend's card shows";
  if (v.stage === "over") return "Game over, result shows";
  if (v.paused) return "Paused";
  if (v.turn === "bot") return v.stage === "ready" ? "Bot opens (you're the tiger)" : "Bot is thinking";
  return v.stage === "ready" ? "Your first move" : "Your move";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
});
const calm = (v: any) => v.stage === "ready" && v.turn === "you" && !v.paused;
export const step = (action: string, from: any) => {
  // Resets that every state has: drawn only from the first screen (and the result, for another game).
  if (action === "YouPickMode" && !calm(from)) return null;
  if (action === "FriendLinkOpens" && !calm(from)) return null;
  if (action === "YouPlayAgain" && from.stage !== "over") return null;
  return label(action);
};
const label = (action: string) => ({
  YouMove: "you move a piece",
  BotMoves: "the bot moves",
  Celebrate: null,
  YouTakeBack: "you press ফিরিয়ে আনো",
  YouPickMode: "you pick ছাগল হবো, বাঘ হবো or দুজনে",
  YouTakeTheChallenge: "you take the friend's challenge",
  YouPlayAgain: "you start another game",
  FriendLinkOpens: "a friend's link opens",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouResume: "you press চালিয়ে যাও",
} as Record<string, string | null>)[action] ?? action;
export const group = (v: any) => v.stage === "over" || v.stage === "friend" ? "done" : v.paused ? "held" : v.turn === "bot" ? "bot" : "play";
export const colors = { play: "teal", bot: "orange", held: "yellow", done: "blue" };
