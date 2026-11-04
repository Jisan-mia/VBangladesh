export const title = "বস্তার পাহাড়: the run, the window, the drop key and the result";
const game = (v: any) => {
  if (v.phase === "over") return v.fresh ? "Result just appeared" : "Result";
  if (v.paused) return "Paused";
  return ({ ready: "Sack swinging", swing: "Sack swinging", drop: "Sack dropping or landing", settle: "Sack dropping or landing", fall: "Pile tipping over" } as any)[v.phase];
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.here === "page" ? "On the page" : v.here === "blurred" ? "Another window has focus" : "Tab hidden",
  Key: v.held ? "Holding Space" : "Key up",
  Chimes: v.chimes ? "Star chimes waiting" : "No chimes waiting",
  Truck: v.sacks > 0 ? "Truck full (stars won)" : "Truck not full yet",
  Drops: v.repeatDrop ? "A sack dropped on key repeat" : "Every drop was a press",
  Result: v.skipped ? "Result skipped by a stray press" : "Result seen",
});
const steps: Record<string, string | null> = {
  YouPressKey: "you press Space",
  KeyRepeats: "the held key repeats",
  YouReleaseKey: "you let go of Space",
  YouTap: "you tap",
  YouPlayAgain: "you press আবার খেলো / পরের ঘাট",
  YouTogglePause: "you press থামাও / চালাও (or P)",
  SackSits: "the sack sits on the pile",
  SackSlips: "the sack slips off",
  NextSack: "the next sack comes",
  PileFalls: "the result shows",
  MomentPasses: "a moment passes",
  ChimesPlay: "the star chimes play",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
};
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
