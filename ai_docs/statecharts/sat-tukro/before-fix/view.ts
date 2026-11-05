export const title = "সাত টুকরো: picture, hand, window, daily limit and links";
const game = (v: any) => {
  if (v.exit === "site") return "Left for another page";
  if (v.exit === "share") return "Parent shares the link";
  if (v.resting) return "Rest screen";
  if (v.phase === "pick") return v.cheer ? "Picture list, cheer still pending" : "Picture list";
  if (v.phase === "end") return "End screen";
  if (v.cheer) return "Picture done, cheering";
  return v.placed === 0 ? "Empty shadow" : "Half built";
};
export const state = (v: any) => ({
  Game: game(v),
  Hand: v.grip ? (!v.focused ? "Away, piece still held" : v.finger ? "Dragging a piece" : "Piece follows the bare pointer") : v.focused ? "Hands off" : "Away",
});
export const step = (action: string) => ({
  YouPressAPiece: "you press a piece",
  YouDropItInPlace: "you drop it in its place",
  YouDropItWrong: "you drop it in the wrong place",
  TouchIsCancelled: "the phone cancels the touch",
  WindowBlurs: "you click into another window",
  YouLetGoAway: "you let go over the other window",
  WindowFocuses: "you come back to the window",
  YouOpenThePictures: "you tap the picture's name (or শেষ)",
  YouPickThisPicture: "you pick the same picture",
  YouPickAnotherPicture: "you pick another picture",
  CheerEnds: "the cheer ends and the end screen shows",
  YouPlayAgain: "you press আবার খেলো",
  ParentGivesMoreTime: "a parent gives 10 more minutes",
  ParentSharesTheLink: "a parent opens the gate and shares the link",
  YouTapALinkAroundTheGame: "you tap a link around the game",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.exit !== "none" ? "gone" : v.resting ? "rest" : v.phase === "play" ? "play" : "between";
export const colors = { play: "teal", between: "blue", rest: "yellow", gone: "orange" };
