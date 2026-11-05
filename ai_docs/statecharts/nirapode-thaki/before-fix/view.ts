export const title = "নিরাপদে থাকি: scene, question, sound, daily limit and links";
const game = (v: any) => {
  if (v.exit === "site") return "Left for another page";
  if (v.exit === "share") return "Parent shares the link";
  if (v.resting) return "Rest screen";
  if (v.phase === "done") return "What you learned";
  if (v.phase === "idle") return "Scene tiles (শেষ)";
  const n = v.q === 0 ? "First question" : "Last question";
  return v.solved ? `${n}, safe pick found` : v.tried ? `${n}, আরেকবার ভাবো` : n;
};
export const state = (v: any) => ({
  Game: game(v),
  Sound: v.sound ? "Sound on" : "Sound off",
});
export const step = (action: string) => ({
  YouPickTheSafeOne: "you pick the safe one",
  YouPickAWrongOne: "you pick a wrong one",
  YouTapNext: "you press পরেরটা",
  YouPlayAgain: "you press আবার খেলো",
  YouTapShesh: "you press শেষ",
  YouTapASceneTile: "you tap a scene tile",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  ParentGivesMoreTime: "a parent gives 10 more minutes",
  ParentSharesTheLink: "a parent opens the gate and shares the link",
  YouTapALinkAroundTheGame: "you tap a link around the game",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.exit !== "none" ? "gone" : v.resting ? "rest" : v.phase === "play" ? "play" : "between";
export const colors = { play: "teal", between: "blue", rest: "yellow", gone: "orange" };
