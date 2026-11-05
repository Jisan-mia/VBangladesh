export const title = "গুনে দেখি: round, glimpse, window, sound, daily limit and links";
const game = (v: any) => {
  if (v.exit === "site") return "Left for another page";
  if (v.exit === "share") return "Parent shares the link";
  if (v.resting) return "Rest screen";
  if (v.phase === "end") return "End card";
  if (v.phase === "closed") return "Closed (মাছগুলো পুকুরেই রইল)";
  const last = v.item === 1;
  if (v.stage === "done") return last ? "Last pond right, cheering" : "Pond right, next one coming";
  if (v.mode === "nojor") return v.looking ? "এক নজরে: pattern showing" : "এক নজরে: pattern hidden";
  return "গুনি: counting the fish";
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.focused ? "On the page" : "Another window",
  Sound: v.sound ? "Sound on" : "Sound off",
});
export const step = (action: string) => ({
  YouAnswerRight: "you answer right",
  YouSeeItAgain: "you ask to see it again (or miss)",
  GlimpseEnds: "the pattern hides after 1.5 s",
  NextPondComes: "the next pond comes",
  RoundEnds: "the round ends and the card shows",
  YouTapAModeOrStep: "you tap a mode button",
  YouTapAStepInTheDrawer: "you pick a step in the drawer",
  YouPlayAgain: "you press আবার খেলো",
  YouTapShesh: "you press শেষ",
  WindowBlurs: "you look away (another window or tab)",
  WindowFocuses: "you come back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  ParentGivesMoreTime: "a parent gives 10 more minutes",
  ParentSharesTheLink: "a parent opens the gate and shares the link",
  YouTapALinkAroundTheGame: "you tap a link around the game",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.exit !== "none" ? "gone" : v.resting ? "rest" : v.phase === "play" ? "play" : "between";
export const colors = { play: "teal", between: "blue", rest: "yellow", gone: "orange" };
