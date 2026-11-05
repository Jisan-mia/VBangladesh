export const title = "Danguli after the rewrite: the round, the window, the play key, the breath, the wind and the star chimes";
const game = (v: any) => {
  if (v.skipped || v.byItself) return "A held key played by itself";
  if (v.sheet) return "Level list open";
  if (v.phase === "over") return v.fresh ? "Result just appeared" : "Result shows";
  if (v.phase === "title") return "First screen";
  if (v.paused) return "Paused (menu)";
  return v.breath ? "A breath before the kathi moves" : v.ball === "aim" ? "Ready to flick" : "Kathi in the air";
};
export const state = (v: any) => game(v);
const labels: Record<string, string> = {
  YouStart: "you press খেলো",
  YouPlayAgain: "you start another round",
  YouPressAKeyOnTheResult: "you press a fresh key on the result",
  TheResultSettles: "a moment passes",
  YouTapTheField: "you tap the field",
  YouClickAnUnfocusedWindow: "you click the window back into focus",
  YouPressAPlayKey: "you press Space",
  YouLetGo: "you let go",
  TheKeyRepeats: "the held key repeats",
  TheKathiLands: "the kathi lands untouched",
  TheShotSettles: "the hit settles",
  TheRestEnds: "the round ends",
  TheBreathEnds: "the breath ends",
  TheChimesPlay: "the star chimes play",
  WindowBlurs: "you leave (another window, or hide the tab)",
  TabHides: "you leave (another window, or hide the tab)",
  YouPause: "you press the pause button or P",
  WindowFocuses: "you come back",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  OpenTheList: "you open the level list",
  OpenTheListFromTheMenu: "you open the level list",
  CloseTheList: "you close the level list",
  YouPickALevel: "you pick a level",
  FriendLinkOpens: "you open a friend's link",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
const hidden = new Set(["SoundOff", "SoundOn", "TheChimesPlay", "TheKeyRepeats", "YouLetGo", "TheResultSettles", "FriendLinkOpens"]);
export const step = (action: string) => hidden.has(action) ? null : labels[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused || v.sheet ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
