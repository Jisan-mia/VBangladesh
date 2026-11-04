export const title = "ছিপ ফেলো: the cast, the window, your hand, the fanfare and the levels";
const game = (v: any) => v.phase === "done" ? (v.guard ? "Result just showed" : "Result shows") : v.paused ? "Paused (থেমে আছে)" : ({
  aim: "Aiming the rod", fly: "Float in the air", wait: "Watching the float", reel: "Fish on the line",
} as any)[v.phase];
// One flat label: what the game shows, where you are, and anything left over that you'd notice.
export const state = (v: any) => {
  let label = game(v);
  // A hidden tab and another window act the same except in the live phases, where the game label already differs (Paused or not).
  if (v.phase !== "done" && !v.focused) label += v.held ? ", you're away, Space still held" : ", you're away";
  if (v.skipped) label += " · a level opened that you never cleared";
  else if (v.owed === "stale") label += " · the last result's fanfare still to go off";
  return label;
};
const words: Record<string, string> = {
  YouHoldToAim: "you press and hold",
  YouLetGoToCast: "you let go and the float flies",
  YouStrike: "you strike as the float goes under",
  YouStrikeTooSoon: "the cast ends",
  YouHoldToReel: "you hold to reel",
  YouSlacken: "you let the line slacken",
  FloatLands: "the float lands",
  FishTakesTheBait: "the cast ends",
  LineGives: "the cast ends",
  FishLanded: "you land the fish",
  GuardLapses: "600 ms pass",
  FanfarePlays: "the fanfare goes off",
  YouPlayOn: "you press পরের লেভেল",
  YouPickALevel: "you pick a level in সব লেভেল",
  YouOpenAFriendsLink: "you open a friend's link",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string, from: any, to: any) => {
  // Hidden from the chart (the report still checks them): sound switches (the hum rules hold), picking a level
  // except on the result, a friend's link except at the start, and window moves on the result.
  if (action === "SoundOff" || action === "SoundOn") return null;
  if (action === "YouPickALevel" && !(from.phase === "done" && from.owed !== "none" && from.owed !== "stale")) return null;
  if (action === "YouOpenAFriendsLink" && !(from.phase === "aim" && !from.held && from.owed === "none" && !from.skipped)) return null;
  if (["WindowBlurs", "WindowFocuses", "TabHides", "TabShows"].includes(action) && (from.phase === "done" || from.skipped || from.owed === "stale")) return null;
  if (action === "FanfarePlays" && from.owed !== "stale") return null;
  // Hiding the tab is drawn only from a live phase you're watching; blurring only while not paused.
  if (action === "TabHides" && (!from.focused || from.paused || from.phase === "aim")) return null;
  if (action === "WindowBlurs" && from.paused) return null;
  return words[action] ?? action;
};
export const group = (v: any) => v.phase === "done" ? "done" : v.paused ? "held" : v.skipped || v.owed === "stale" ? "bug" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", bug: "pink" };
