export const title = "o-te-ojogor (after the rewrite) against the kids' rules";
export const state = (v: any) => ({
  Game: ({ title: "Title (খেলো)", play: "Round in play", done: "End screen (আবার খেলো / শেষ / আব্বু-আম্মুকে দেখাও)" } as any)[v.phase],
  Today: v.resting ? "Rest screen" : v.overLimit ? "Today's kids' time is up" : "Time left today",
  Phone: v.holder === "parent" ? (v.gate === "open" ? "A parent has the phone, gate open" : "A parent has the phone") : "The child has the phone",
  Sent: v.sent === "address" ? "The tool's address was shared" : "Nothing sent",
});
export const step = (action: string) => ({
  YouPressStart: "you press খেলো",
  TheLevelEnds: "the level ends",
  YouPlayAgain: "you press আবার খেলো",
  YouFinishUp: "you press শেষ",
  ThePageOpens: "the page opens again",
  TimeIsUp: "today's kids' time runs out",
  AParentGivesMoreTime: "a parent gives 10 more minutes",
  AParentTakesThePhone: "a parent takes the phone",
  TheChildTakesItBack: "the child takes the phone back",
  AParentOpensTheGate: "a parent opens the gate",
  AParentSharesTheLink: "a parent shares the game's link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "play" ? "play" : v.phase === "done" ? "done" : "title";
export const colors = { title: "tan", play: "teal", done: "blue", rest: "purple" };
