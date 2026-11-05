export const title = "সমান ভাগ: the table, the last piece, the voice, the rest screen and the parent gate";
const game = (v: any) => {
  if (v.phase === "end") return "Round done: আবার খেলো / শেষ / পরের ধাপ";
  if (v.phase === "closed") return "মেহমানরা বাড়ি গেল";
  const where = v.kind === "cut" ? "রুটি কাটা" : v.item === 1 ? "First table" : "Last table";
  return ({ share: `${where}: share it out`, left: `${where}: who gets the last one?`, cut: `${where}: how many pieces?`,
    done: `${where}: everyone served` } as any)[v.stage];
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.away ? "You're away" : "You're watching",
  Sound: v.sound ? "Sound on" : "Sound off",
  Rest: v.resting ? "Rest screen up" : v.late ? "Today's time used up" : "Time left today",
  Gate: v.gate ? (v.holder === "parent" ? "Gate open, parent holding" : "Gate open, child holding") : "Gate closed",
});
export const step = (action: string) => ({
  YouShareFairly: "you give everyone the same",
  YouGiveTheLastOne: "you choose who gets the last one",
  YouCutItRight: "you cut the রুটি right and hand out the pieces",
  NextGuestsCome: "the next guests sit down",
  TheRoundEnds: "the round ends",
  YouTapPlayAgain: "you tap আবার খেলো",
  YouTapNextStep: "you tap পরের ধাপ",
  YouTapEnd: "you tap শেষ",
  YouPickAStep: "you pick a step in সব ধাপ",
  YouTabAndEnterBehindRest: "you press Tab and Enter behind the rest screen",
  YouLookAway: "you switch to another app or window",
  YouComeBack: "you come back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  TodaysTimeRunsOut: "today's minutes run out",
  ParentGivesTenMore: "a parent gives ten more minutes",
  ParentOpensTheGate: "a parent opens বড়দের জন্য",
  ParentClosesTheGate: "a parent presses বন্ধ করো",
  ParentHandsThePhoneBack: "the parent hands the phone back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase !== "play" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
