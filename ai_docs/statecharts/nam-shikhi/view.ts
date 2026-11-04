export const title = "নাম শিখি: round, sound, daily limit and parent gates";
const round = (v: any) => {
  if (v.phase === "idle") return "খেলা শেষ, pack tiles";
  if (v.phase === "done") return "Done screen (আবার খেলো / শেষ)";
  const late = v.begun === "late" ? ", started after today's time ran out" : "";
  if (v.phase === "solved") return (v.target === 1 ? "Right picture, পরেরটা shows" : "Last picture right, দেখো কী শিখলে shows") + late;
  return (v.target === 1 ? "First picture" : "Last picture") + late;
};
const gate = (g: string) => g === "closed" ? "closed" : g === "parent" ? "opened by a parent" : "opened by the child";
export const state = (v: any) => ({
  Round: round(v),
  Today: v.resting ? "Rest screen (আজ এটুকুই), its gate " + gate(v.restGate) : v.overLimit ? "Today's time is up" : "Time left today",
  Phone: v.holder === "parent" ? "A parent has the phone" : "The child has the phone",
  ShareGate: "Share gate " + gate(v.shareGate),
  Sound: (v.sound ? "Sound on" : "Sound off") + (v.talk ? ", the phone says the name" : ""),
});
export const step = (action: string) => ({
  YouTapTheRightPicture: "the child taps the right picture",
  YouPressNext: "the child presses পরেরটা",
  YouPressSeeWhatYouLearned: "the child presses দেখো কী শিখলে",
  YouPressPlayAgain: "the child presses আবার খেলো or picks a pack or level",
  YouPickAPackOrLevel: "the child presses আবার খেলো or picks a pack or level",
  YouPressShesh: "the child presses শেষ",
  ALinkOpens: "a #p= link opens",
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
  TheVoiceEnds: "the spoken name ends",
  SoundOff: "the child turns sound off",
  SoundOn: "the child turns sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : v.phase === "done" || v.phase === "idle" ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
