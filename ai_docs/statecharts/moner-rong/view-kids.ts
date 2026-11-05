export const title = "Moner Rong: the kids rules (limit, gate, sharing, voice)";
export const state = (v: any) => ({
  Round: v.phase === "title" ? "Title" : v.phase === "play" ? "A round" : "Full page",
  Screen: v.stage === "shown" ? (v.resting && v.phase !== "play" ? "Rest screen on the stage" : "Game on the stage") : "Launch card",
  Phone: v.holder === "parent" ? (v.gate === "open" ? "A parent, gate open" : "A parent has the phone") : "The child has the phone",
});
export const step = (action: string) => ({
  YouOpenThePlayer: "খেলো on the launch card", YouLeaveThePlayer: "Back to the launch card", YouPressStart: "খেলো in the game",
  ThePageFills: "the last picture is won", YouGoToTheTitle: "শেষ or নতুন করে শুরু", ThePageOpens: "the page opens again",
  TimeIsUp: "today's time runs out", AParentGivesMoreTime: "a parent gives more time", AParentTakesThePhone: "a parent takes the phone",
  TheChildTakesItBack: "the child takes it back", AParentOpensTheGate: "the parent opens the gate", AParentSharesTheLink: "the parent shares the address",
  SoundSwitch: "sound on or off",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : v.phase === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
