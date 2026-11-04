export const title = "কার-চিহ্ন বসাও: round, sound, daily limit and parent gates";
const round = (v: any) => {
  if (v.phase === "pick") return v.lost ? "Level picker, the finished round was never counted" : "Level picker";
  if (v.phase === "end") return "End screen (আবার খেলো / শেষ)";
  const late = v.begun === "late" ? ", started after today's time ran out" : "";
  if (v.phase === "solved") return (v.word === 1 ? "Right sign, next word in 1.1 s" : "Last sign right, end screen in 1.1 s") + late;
  return (v.word === 1 ? "First word" : "Last word") + late;
};
const gate = (g: string) => g === "closed" ? "closed" : g === "parent" ? "opened by a parent" : "opened by the child";
export const state = (v: any) => ({
  Round: round(v),
  Today: v.resting ? "Rest screen (আজ এটুকুই), its gate " + gate(v.restGate) : v.overLimit ? "Today's time is up" : "Time left today",
  Phone: v.holder === "parent" ? "A parent has the phone" : "The child has the phone",
  ShareGate: "Share gate " + gate(v.shareGate),
  Sound: (v.sound ? "Sound on" : "Sound off") + (v.phase === "solved" ? ", the phone says the word" : ""),
});
export const step = (action: string) => ({
  YouTapTheRightSign: "the child taps the right sign",
  TheNextWordComes: "the next word comes (1.1 s)",
  TheRoundEnds: "the end screen comes (1.1 s)",
  YouTapTheLevelButton: "the child taps the level button",
  YouPressShesh: "the child presses শেষ",
  YouStartARound: "the child presses আবার খেলো or picks a level",
  ThePageOpens: "the page opens again (reload, or from the kids' hub)",
  TimeIsUp: "today's play time runs out",
  AParentTakesThePhone: "a parent takes the phone",
  TheChildTakesItBack: "the child takes the phone back",
  AParentOpensTheShareGate: "the parent opens বড়দের জন্য",
  TheChildOpensTheShareGate: "the child holds বড়দের জন্য and mashes the pad",
  SomeoneClosesTheShareGate: "someone presses বন্ধ করো",
  AParentOpensTheRestGate: "the parent opens the rest screen's gate",
  TheChildOpensTheRestGate: "the child holds the rest screen's gate and mashes the pad",
  SomeoneGivesTenMinutes: "someone taps আজ আরও ১০ মিনিট",
  SoundOff: "the child turns sound off",
  SoundOn: "the child turns sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : v.phase === "end" || v.phase === "pick" ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
