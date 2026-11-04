export const title = "Penalty kick: the match, pause, going away, the crowd and the card";
const stage = (v: any) => ({ aim: "Your kick", fly: "Ball in the air", after: "Ball in the air", ready: "Their run-up", run: "Their run-up", over: "Decided" } as any)[v.stage];
export const state = (v: any) => ({
  Match: v.phase === "title" ? (v.drawer ? "Match list" : "Title screen") : v.phase === "over" ? (v.drawer ? "Match list" : "Card shows") : v.phase === "paused" ? "Paused (menu open)" : stage(v),
  Window: v.visible && v.focused ? "You're on the page" : "Away (blurred or hidden)",
  Crowd: v.hum === "real" ? "Crowd murmuring" : "Crowd quiet",
});
export const step = (action: string) => ({
  YouPressPlay: "you press খেলো",
  YouTouchTheField: "you touch the field",
  YouSwipeAndShoot: "you swipe and shoot",
  YouLiftWithoutAShot: "you lift without a shot",
  YouTapASide: "you tap a side",
  YouHoldSpace: "you hold Space to dive",
  YouLetGoOfSpace: "you let go of Space",
  BallLands: "the ball lands",
  TheirTurn: "their kicker steps up",
  RunUpStarts: "their run-up starts",
  TheyKick: "they kick",
  MatchDecided: "the match is decided",
  CrowdStep: "the next frame syncs the crowd",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press ⏸ or P",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouOpenMatches: "you open সব ম্যাচ",
  YouCloseMatches: "you close the list",
  YouPickAMatch: "you pick a match",
  YouRestart: "you press নতুন করে শুরু",
  YouPlayAgain: "you press আবার খেলো",
  SpaceRepeatsOnTheCard: "Space, still held, repeats on the card (refused)",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
