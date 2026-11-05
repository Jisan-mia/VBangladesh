export const title = "লাটিম after the rewrite: the spin, the window, your hand, the breath, the hum and the star chimes";
const game = (v: any) => {
  if (v.skipped || v.byItself) return "A held key played by itself";
  if (v.sheet) return "Level list open";
  if (v.phase === "over") return v.fresh ? "Result just appeared" : "Result shows";
  if (v.phase === "title") return "First screen";
  if (v.paused) return "Paused (menu)";
  if (v.breath) return "A breath before the top moves";
  return v.top === "hand" ? (v.winding ? "Winding the string" : v.pull ? "Pulling the string down" : "In your hand") : v.top === "spin" ? "Spinning" : "Falling or on the palm";
};
export const state = (v: any) => game(v);
const labels: Record<string, string> = {
  YouStart: "you press খেলো",
  YouPlayAgain: "you start another spin",
  YouPressAKeyOnTheResult: "you press a fresh key on the result",
  YouHoldToWind: "you hold to wind",
  YouPutAFingerOnTheTop: "you put a finger on the top",
  YouLetGoAndItThrows: "you let go and it throws",
  YouPullDownAndLetGo: "you pull down and let go",
  YouLetGoWithoutAThrow: "you let go without a throw",
  YouNudge: "you tap to steady it",
  YouPressLift: "you press হাতে তোলো",
  YouClickAnUnfocusedWindow: "you click the window back into focus",
  YouPressAPlayKey: "you press Space",
  TheTopFalls: "the top falls",
  TheFallSettles: "it comes to rest and the result shows",
  TheBreathEnds: "the breath ends",
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
};
const hidden = new Set(["SoundOff", "SoundOn", "TheChimesPlay", "TheKeyRepeats", "YouLetGoOfTheKey", "TheResultSettles", "FriendLinkOpens"]);
export const step = (action: string) => hidden.has(action) ? null : labels[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused || v.sheet ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
