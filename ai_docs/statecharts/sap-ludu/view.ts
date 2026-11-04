export const title = "সাপলুডু: turn, walking piece, window, result and friend's dice";
const game = (v: any) => {
  if (v.cover) return "Result cover shows";
  if (v.paused) return "Paused cover";
  if (v.phase === "fresh") return "Waiting for the first roll";
  if (v.phase === "choose") return "Pick a piece (১ or ২)";
  if (v.phase === "over") return "Reached 100 (last walk, sound, confetti)";
  if (v.walking) return "Piece walks";
  return "Your roll";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : "You're on the page",
  Dice: v.friend ? "Friend's dice, their card shown" : v.dice === "theirs" ? "Friend's dice, no card" : "Fresh dice",
});
export const step = (action: string, from: any) => action === "YouSkipWalk" || (action === "FriendLinkOpens" && !(from.phase === "fresh" && !from.paused && !from.cover)) ? null : ({
  YouRoll: "you tap the dice",
  YouPick: "you pick a piece",
  YouSkipWalk: "you tap again to finish the move",
  PieceLands: "the piece lands",
  Celebrate: "the win sound and confetti play",
  ResultShows: "the result cover appears",
  YouPlayAgain: "you press আরেকবার",
  YouRaceSameDice: "you press একই ছক্কায় আবার",
  YouStartOver: "you press নতুন খেলা",
  FriendLinkOpens: "a friend's link opens",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouResume: "you press চালিয়ে যাও",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.cover || v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
