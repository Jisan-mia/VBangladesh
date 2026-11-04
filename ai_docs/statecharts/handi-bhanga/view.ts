export const title = "হাঁড়িভাঙা: round, window, hands, level list and cheer";
const game = (v: any) => v.phase === "playing" ? (v.ball === "flying" ? "Ball in the air" : "Ball on the stick") : ({ ready: "Waiting for your first throw", paused: "Paused", over: "Card shows" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win === "hidden" ? "Tab hidden" : v.win === "away" ? "Another window has focus" : v.inView ? "You're on the stall" : "Stall scrolled away",
  Keys: v.keys ? "Holding ← or →" : "Keys up",
  Finger: v.drag ? "Finger or mouse down on the stall" : "Finger up",
  Levels: v.picker ? "সব লেভেল open" : "সব লেভেল closed",
  Cheer: v.fanfare ? "Cheer still to come" : "No cheer waiting",
  Chances: v.droppedAway ? "A ball fell while you were away" : "Every ball fell while you watched",
});
const labels: Record<string, string> = {
  YouStart: "you press শুরু করো or the চাপো pad",
  YouThrow: "you throw the ball",
  BallFalls: "the ball falls, a chance is lost",
  FanfarePlays: "the cheer plays",
  YouPause: "you press ⏸",
  YouResume: "you press চালিয়ে যাও",
  YouHoldArrow: "you hold ← or →",
  YouLetGoArrow: "you let go of the key",
  YouPressStall: "you press on the stall",
  YouLiftFinger: "you lift your finger",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouScrollAway: "you scroll the stall away",
  YouScrollBack: "you scroll back",
  YouOpenLevels: "you open সব লেভেল",
  YouCloseLevels: "you close সব লেভেল",
  YouPickLevel: "you pick a level or press পরের লেভেল",
  YouPlayAgain: "you press আবার খেলো",
};
export const step = (action: string, from: any, to: any) => {
  if (action === "RoundEnds") return to.fanfare && !from.fanfare ? "the round ends with stars" : from.fanfare ? "the round ends" : "the round ends with no stars";
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
