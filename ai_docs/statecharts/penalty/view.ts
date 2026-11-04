export const title = "পেনাল্টি কিক: the kicks, the window, your finger and the crowd";
const stage = (v: any) => ({ aim: "Your kick: aiming", fly: "Ball in the air", after: "Ball landed", ready: "Their whistle", run: "Their run-up" } as any)[v.stage];
export const state = (v: any) => ({
  Match: v.shown === "over" ? (v.finishes > 1 ? "Card shows (finished twice)" : "Card shows") : v.finishes > 0 ? `Match decided ${v.finishes === 1 ? "once" : "twice"}, card not drawn yet` : `${stage(v)}${v.paused ? ", paused" : ""}`,
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Finger: v.pointer ? "Finger on the board" : "Finger off",
  Crowd: v.hum === "real" ? "Murmur on" : "Murmur off",
  Space: v.key ? "Space held down" : "Space up",
});
export const step = (action: string) => ({
  YouTouchTheBoard: "you put a finger on the board",
  YouSwipeAndShoot: "you swipe and shoot",
  YouLiftWithoutAShot: "you lift without a shot",
  BallLands: "the ball lands",
  TheirTurn: "their kicker steps up",
  MatchDecided: "the match is decided",
  CardShows: "the card shows",
  RunUpStarts: "their run-up starts",
  TheyKick: "they kick",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouOpenMatches: "you open সব ম্যাচ",
  YouCloseMatches: "you close সব ম্যাচ",
  YouPickAMatch: "you pick a match",
  YouPlayAgain: "you press আবার খেলো",
  YouHoldSpaceToDiveMiddle: "you hold Space to dive to the middle",
  SpaceRepeatsOnTheCard: "Space, still held, repeats on the card",
  YouLetGoOfSpace: "you let go of Space",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.shown === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
