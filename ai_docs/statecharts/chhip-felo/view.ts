export const title = "Chhip Felo after the rewrite: the screens, the cast, the window, your hand, the hum and the end screen";
const where = (v: any) => !v.visible ? "Away: a hidden tab" : !v.focused ? "Away: another window" : "You're on the pond";
const game = (v: any) => {
  if (v.sheet) return "A choice screen is open";
  if (v.screen === "title") return "On the title";
  if (v.screen === "over") return v.owed === "due" ? "End screen, chimes still to come" : "End screen";
  if (v.paused) return "Paused (menu)";
  return ({ aim: "Aiming the rod", fly: "Float in the air", wait: v.dip ? "The float is under" : "Watching the float", reel: "Fish on the line", card: "Catch or miss card" } as any)[v.phase];
};
export const state = (v: any) => ({ Game: game(v), Window: where(v) });
const words: Record<string, string> = {
  YouStart: "you tap the title float",
  YouHoldToAim: "you press and hold",
  YouLetGoToCast: "you let go and the float flies",
  YouTapToWake: "your first tap back only wakes the game",
  YouStrike: "you strike on the dip",
  YouStrikeTooSoon: "you strike too soon",
  YouHoldToReel: "you hold to reel",
  YouSlacken: "you lift to give line",
  FloatLands: "the float lands",
  FloatDips: "the float goes under",
  FishTakesTheBait: "you're too late",
  CastEnds: "the fish is landed or gets away",
  NextCast: "the card ends: the next cast",
  LevelEnds: "the card ends: the level is over",
  SlowToggles: "you switch slow mode",
  FanfarePlays: "the stars chime",
  YouPlayOn: "you press Next level",
  YouOpenASheet: "you open the level list or the album",
  YouCloseTheSheet: "you close it",
  YouPickALevel: "you pick a level",
  YouOpenAFriendsLink: "you open a friend's link",
  FriendLevelCleared: "you clear a friend's far level",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouPressP: "you press P",
  YouResume: "you press Resume",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string, from: any, to: any) => {
  // Hidden from the chart (the report still checks them): the sound switch, ধীরে খেলো, a friend's link, a cleared friend
  // level, the sheet except from the title and the end screen, hiding the tab (it acts like another window), and
  // window moves outside the play screen.
  if (["SoundOff", "SoundOn", "SlowToggles", "YouOpenAFriendsLink", "FriendLevelCleared", "TabHides", "TabShows"].includes(action)) return null;
  if ((action === "YouOpenASheet" || action === "YouCloseTheSheet" || action === "YouPickALevel") && from.screen === "play") return null;
  if ((action === "WindowBlurs" || action === "WindowFocuses") && (from.screen !== "play" || from.sheet)) return null;
  if (action === "WindowBlurs" && from.paused) return null;
  if (action === "YouPressP" && from.phase !== "reel") return null;
  if (action === "FanfarePlays" && from.sheet) return null;
  return words[action] ?? action;
};
export const group = (v: any) => v.screen === "over" ? "done" : v.paused || v.sheet ? "held" : v.screen === "title" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
