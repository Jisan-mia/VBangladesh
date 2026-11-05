export const title = "সুর বানাই: the parent gate and leaving the game";
export const state = (v: any) => ({
  Gate: ({ shut: "Gate shut", holding: "Holding the gate", asks: "Gate asks the sum", open: "Gate open: share the plain address" } as any)[v.gate],
  Page: v.page === "kids" ? "On another kids' tool" : "In the game",
});
export const step = (action: string) => ({
  YouHoldTheGate: "you hold বড়দের জন্য",
  YouLetGo: "you let go",
  TwoSecondsPass: "two seconds pass",
  GrownUpAnswers: "a grown-up answers the sum",
  GrownUpShares: "a grown-up shares the address",
  GrownUpClosesGate: "a wrong sum, or 20 seconds, closes the gate",
  YouTapAKidsToolCard: "you tap another kids' tool",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.page === "kids" ? "out" : v.gate === "shut" ? "quiet" : "gate";
export const colors = { quiet: "blue", gate: "yellow", out: "teal" };
