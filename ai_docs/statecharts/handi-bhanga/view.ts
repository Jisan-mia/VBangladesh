export const title = "Handi-bhanga: screens, pause, level list and window";
const game = (v: any) =>
  v.sheet ? "Level list open" : v.paused ? "Pause menu open"
  : v.screen === "title" ? "Title: the খেলো pot" : v.screen === "over" ? "Result shows" : v.ball === "flying" ? "Ball in the air" : "Ball on the লাঠি";
export const state = (v: any) => ({
  Game: game(v),
  Window: v.win === "away" || !v.inView ? "You're away: another window, a hidden tab or the stall scrolled off" : "You're on the stall",
});
const labels: Record<string, string> = {
  YouTapTitlePot: "you tap the খেলো pot",
  YouPressStall: "you press on the stall",
  YouLiftFinger: "you lift your finger",
  MouseMovesWithNoButton: "the mouse moves with no button down",
  YouHoldArrow: "you hold ← or →",
  YouLetGoArrow: "you let go of the arrow",
  YouPressThrowKey: "you press Space, Enter or ↑",
  YouLetGoThrowKey: "you let go of the throw key",
  BallFalls: "the ball falls, a ball is lost",
  FanfarePlays: "the star chimes play",
  WakeEnds: "a quarter second passes",
  YouPause: "you open the pause menu",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window, hide the tab or scroll the stall away",
  WindowFocuses: "you come back",
  YouScrollAway: "you click into another window, hide the tab or scroll the stall away",
  YouScrollBack: "you come back",
  YouOpenLevels: "you open সব লেভেল",
  YouCloseLevels: "you close সব লেভেল",
  YouPickLevel: "you pick a stall, or press পরের লেভেল or আবার খেলো",
  YouPressResultKey: "you press a fresh key on the result",
  YouTurnSoundOff: "you turn sound off",
  YouTurnSoundOn: "you turn sound on",
};
export const step = (action: string, from: any, to: any) => {
  if (action === "RoundEnds") return to.fanfare && !from.fanfare ? "the round ends with stars" : "the round ends";
  return labels[action] ?? action;
};
export const group = (v: any) => v.screen === "over" ? "done" : v.paused || v.sheet ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
