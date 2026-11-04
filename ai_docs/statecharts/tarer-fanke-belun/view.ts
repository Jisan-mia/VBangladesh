export const title = "তারের ফাঁকে বেলুন: the run, the window, the wire hum and the celebration";
const game = (v: any) => {
  if (v.phase === "over") return (v.cleared ? "Level cleared" : "Popped, result shows") + (v.fresh ? " (just now)" : "");
  if (v.paused) return "Paused";
  return ({ ready: "Waiting for the first puff", playing: "Flying", pop: "ফটাস!" } as any)[v.phase];
};
export const state = (v: any) => ({
  Game: game(v),
  Street: v.stage === 0 ? "যত দূর পারো" : "A level",
  Window: ({ page: "On the page", blurred: "Another window has focus", hidden: "Tab hidden", scrolled: "Scrolled away" } as any)[v.here],
  Hum: v.hum ? "Wire hum on" : "Wire hum off",
  Sound: v.sound ? "Sound on" : "Sound off",
  Celebration: v.party ? "Fanfare waiting to fire" : "Nothing waiting",
});
const steps: Record<string, string | null> = {
  YouPuff: "you tap (puff)",
  CrossingCleared: "the last crossing is passed",
  BalloonPops: "the balloon touches a wire or the street",
  PopEnds: "the result shows",
  PopEndsWithBest: "the result shows a new best",
  GuardPasses: "a moment passes",
  PartyFires: "the fanfare and confetti fire",
  YouPlayAgain: "you press আরেকবার / পরের লেভেল",
  YouChooseLevel: "you pick a level from সব লেভেল",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the game out of view",
  ScrollBack: "you scroll back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
// The chart shows a pick from সব লেভেল only from the result (it is open everywhere; the model keeps every pick).
export const step = (action: string, from: any, to: any) => {
  if (action === "YouChooseLevel") return from.phase !== "over" ? null : to.stage === 0 ? "you pick যত দূর পারো" : "you pick a level";
  return action in steps ? steps[action] : action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
