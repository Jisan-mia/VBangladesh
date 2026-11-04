export const title = "Bostar Pahar: the screen, the menu and the window";
const game = (v: any) => {
  if (v.screen === "title") return "Title: the sack says খেলো";
  if (v.screen === "over") return "End screen";
  return ({ swing: "Sack swinging", drop: "Sack dropping", end: "Pile toppling or truck leaving" } as any)[v.phase];
};
export const state = (v: any) => ({
  Game: game(v),
  Menu: v.paused ? "Menu open, game paused" : v.guard ? "Just resumed (taps only wake)" : "Menu shut",
  Window: v.here === "page" ? "On the page" : "Away (another window or a hidden tab)",
});
const steps: Record<string, string> = {
  YouPressKey: "you press Space",
  KeyRepeats: "the held key repeats",
  YouReleaseKey: "you let go of Space",
  YouTap: "you tap the scene",
  YouPickChoice: "you press পরের লেভেল or আবার খেলো",
  YouOpenTheMenu: "you press P, ⏸ or Esc",
  YouResume: "you press চালিয়ে যাও",
  GuardPasses: "a quarter second passes",
  SackLands: "the sack lands",
  RoundEnds: "the end screen shows",
  MomentPasses: "half a second passes",
  ChimesEnd: "the chimes end",
  SoundToggles: "you switch sound",
  WindowBlurs: "you click into another window or hide the tab",
  WindowFocuses: "you come back",
  TabHides: "you click into another window or hide the tab",
  TabShows: "you come back",
};
export const step = (action: string) => steps[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.paused ? "held" : v.screen === "title" ? "start" : "play";
export const colors = { start: "blue", play: "teal", held: "yellow", done: "blue" };
