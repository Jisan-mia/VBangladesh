export const title = "অ-তে অজগর (HEAD 6775639) against the kids' rules";
const game = (v: any) => ({ ready: "Start screen", play: "Letters falling", won: "Card with শেয়ার করো and a name field" } as any)[v.phase]
  + (v.begun === "late" && v.phase === "play" ? ", started after today's time ran out" : "");
export const state = (v: any) => ({
  Game: game(v),
  Today: v.resting ? "Rest screen" : v.overLimit ? "Today's kids' time is up" : "Time left today",
  Phone: v.holder === "parent" ? "A parent has the phone" : "The child has the phone",
  Name: v.named ? "A name typed on the card" : "No name",
  Server: v.sent === "name" ? "The name went to /api/share" : v.sent === "card" ? "The card went to /api/share" : "Nothing sent",
});
export const step = (action: string) => ({
  YouPressStart: "you press শুরু করো",
  TheLevelEnds: "the level ends",
  YouPlayAgain: "you press আবার খেলো",
  YouGoToTheNextLevel: "you press পরের লেভেল",
  SomeoneTypesAName: "someone types a name under the card",
  SomeoneSharesTheCard: "someone taps শেয়ার করো or লিংক কপি করো",
  TimeIsUp: "today's kids' time runs out",
  AParentTakesThePhone: "a parent takes the phone",
  TheChildTakesItBack: "the child takes the phone back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "won" ? "done" : "play";
export const colors = { play: "teal", done: "blue" };
