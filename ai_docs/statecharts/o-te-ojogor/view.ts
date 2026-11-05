export const title = "o-te-ojogor (after the rewrite): round, pause menu, window and arrow key";
const game = (v: any) => {
  if (v.phase === "done") return v.menu ? "End screen, menu open" : "End screen (আবার খেলো / শেষ)";
  if (v.phase === "title") return v.menu ? "Title, menu open" : "Title (খেলো)";
  if (v.paused || v.menu) return v.menu ? "Paused, menu open" : "Paused, tap to wake";
  return v.window === "here" ? "Round in play" : "Round in play while you're away";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.window === "here" ? "You're on the page" : v.window === "blurred" ? "Another window has focus" : "Tab hidden",
  Basket: v.hand === "held" ? "Arrow held, basket heads for the edge" : v.hand === "stuck" ? "You let go, the basket still runs" : "Basket still",
});
const labels: Record<string, string> = {
  YouPressStart: "you press খেলো",
  YouHoldAnArrow: "you hold ← or → (or drag)",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  YouTapToWake: "you tap the tree to wake it",
  YouPressPause: "you press ⏸, Escape or P",
  YouRestart: "you press নতুন করে শুরু",
  TheLastLetterLands: "the last right letter lands",
  YouPlayAgain: "you press আবার খেলো",
  YouGoToATitle: "you press শেষ (or pick a level, or open a link)",
};
export const step = (action: string) => labels[action] ?? action;
export const group = (v: any) => v.phase === "done" ? "done" : v.paused ? "held" : v.phase === "title" ? "title" : "play";
export const colors = { title: "tan", play: "teal", held: "yellow", done: "blue" };
