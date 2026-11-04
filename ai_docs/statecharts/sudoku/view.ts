export const title = "সুডোকু: round and clock, window, star chimes and your work";
const game = (v: any) => v.phase === "over"
  ? (v.link === "broken" ? "Result shows, its link opens nothing" : "Result shows, its link opens your grid")
  : ({ ready: "New grid, clock at zero", playing: "Solving, clock running", paused: "Paused (থেমে আছে)" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Chimes: v.chime ? "Star chimes still to ring" : "No chimes waiting",
  Work: v.lost ? "A half-done grid was thrown away" : v.work ? "Your digits on the grid" : "Nothing written yet",
});
export const step = (action: string, _from: any, to: any) => {
  if ((action === "YouTakeAHint") && to.phase === "over") return to.link === "broken" ? "you take a 10th or later hint and the grid fills" : "a hint fills the last cell";
  if (action === "YouWriteADigit" && to.phase === "over") return "you write the last digit";
  return ({
    YouTapACell: "you tap a cell",
    YouWriteADigit: "you write a digit or take a hint",
    YouTakeAHint: "you write a digit or take a hint",
    WindowBlurs: "you click into another window",
    WindowFocuses: "you come back to the window",
    TabHides: "you hide the tab",
    TabShows: "the tab shows again",
    YouResume: "you press চালিয়ে যাও",
    StarsChime: "the star chimes ring",
    YouGoOn: "you press পরের লেভেল or আবার খেলো",
    YouPlayAgain: "you press পরের লেভেল or আবার খেলো",
    YouPickALevel: "you tap a level arrow, a level or আজকের ধাঁধা",
  } as Record<string, string>)[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
