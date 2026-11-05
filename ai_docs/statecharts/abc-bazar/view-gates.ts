export const title = "এবিসি বাজার: the phone, the share gate and the rest screen's gate";
export const state = (v: any) => ({
  Screen: v.screen === "title" ? "The stall" : v.screen === "play" ? "A round" : "The page or the level list",
  Today: v.resting ? (v.screen === "play" ? "Time's up, waiting for the round's end" : "Rest screen") : "Time left today",
  Phone: v.holder === "parent" ? "A parent has the phone" : "The child has the phone",
  ShareGate: v.gate === "open" ? "Share gate open (a parent answered)" : "Share gate closed",
  RestGate: v.restGate === "open" ? "Rest gate open (a parent answered)" : "Rest gate closed",
});
export const step = (action: string) => ({
  YouStartARound: "the child taps the stall",
  TheRoundEnds: "the round ends",
  YouGoToTheTitle: "the child goes back to the stall",
  YouOpenTheLevelList: "the child opens the level list",
  ThePageOpens: "the page opens again",
  AParentTakesThePhone: "a parent takes the phone",
  TheChildTakesItBack: "the child takes the phone back",
  AParentOpensTheGate: "the parent opens বড়দের জন্য",
  TheChildMashesTheGate: "the child holds বড়দের জন্য and mashes",
  SomeoneUsesTheGate: "the link is shared, or the print sheet opens",
  TwentySecondsPass: "20 s pass",
  AParentOpensTheRestGate: "the parent opens the rest screen's gate",
  TheChildMashesTheRestGate: "the child mashes the rest screen's gate",
  TenMoreMinutes: "আজ আরও ১০ মিনিট",
  TheRestGateShuts: "a limit is chosen, or 20 s pass",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
