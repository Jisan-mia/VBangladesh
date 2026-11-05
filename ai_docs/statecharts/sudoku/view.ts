export const title = "Sudoku after the rewrite: start card, clock, window, sheet, chimes, saved grids and levels";
const game = (v: any) => v.phase === "over" ? "Result shows, its link opens your grid"
  : v.phase === "paused" ? (v.why === "sheet" ? "Paused by the level sheet" : "Paused (থেমে আছে)")
  : ({ ready: "Start card, clock still", playing: "Solving, clock running" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Work: v.lost ? "A half-done grid was thrown away" : v.work ? (v.kept ? "Your digits on the grid, saved" : "The solved grid") : "Nothing written yet",
});
export const step = (action: string, _from: any, to: any) => {
  if ((action === "YouWriteADigit" || action === "YouTakeAHint") && to.phase === "over") return "you write the last digit or a hint fills it";
  return ({
    YouStart: "you press শুরু করো",
    YouWriteADigit: "you write a digit or take a hint",
    YouTakeAHint: "you write a digit or take a hint",
    WindowBlurs: "you click into another window",
    WindowFocuses: "you come back to the window",
    TabHides: "you hide the tab",
    TabShows: "the tab shows again",
    YouResume: "you press চালিয়ে যাও",
    YouOpenTheSheet: "you open সব লেভেল",
    YouCloseTheSheet: "you close the sheet",
    StarsChime: "the star chimes ring",
    YouGoOn: "you press পরের লেভেল or আবার খেলো",
    YouPlayAgain: "you press পরের লেভেল or আবার খেলো",
    YouPickALevel: "you pick a level or আজকের ধাঁধা",
    FriendLinkOpens: "a friend's link opens their level",
    YouHoldEnter: "you hold Enter",
    EnterRepeats: "Enter repeats",
    YouLetGo: "you let go",
  } as Record<string, string>)[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
