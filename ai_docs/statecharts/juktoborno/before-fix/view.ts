export const title = "যুক্তবর্ণ ভাঙি-জুড়ি: round, voice, rest screen and parent gate";
const round = (v: any) => v.away ? "Left the kids' area" : ({
  ask1: "Building a word", ok1: "Word built", ask2: "Building a word", ok2: "Last word built",
  end: "Round card shows", closed: "Factory closed for today",
} as any)[v.pos];
const gate = (v: any) => ({
  shut: "Gate shut", holding: "Gate held", repeat: "Gate held", orphan: "Let go, timer still running",
  ask: "Sum question shows", early: "Sum question shows without a full hold", open: "Grown-up opened the gate", child: "Child opened the gate",
} as any)[v.gate];
export const state = (v: any) => ({
  Round: round(v),
  Rest: v.rest ? "Rest screen shows" : v.overLimit ? "Today's time is up" : "Time left today",
  Voice: v.speaking ? (v.sound ? "Reading the word aloud" : "Reading aloud with sound off") : (v.sound ? "Sound on" : "Sound off"),
  Gate: gate(v),
});
// Hidden to keep the chart readable: leaving by a site link from the middle of a round or the closed screen (the same
// arrow as from the first word), picking a level mid-round from "সব ধাপ", and the gate shutting when a round starts.
export const step = (action: string, from: any, to: any) => {
  if (action === "TheChildTapsASiteLink" && !["ask1", "end"].includes(from.pos)) return null;
  if (action === "YouStartARound" && ["ok1", "ask2", "ok2"].includes(from.pos)) return null;
  if (["YouStartARound", "YouPressShesh", "YouTabUnderTheRestScreen"].includes(action) && from.gate !== "shut") return null;
  return label(action);
};
const label = (action: string) => ({
  YouSolveTheWord: "you put in the last right letter",
  YouTryAWrongLetter: "you try a wrong letter",
  YouPressNext: "you press পরেরটা",
  YouFinishTheRound: "you press শেষ on the last word",
  YouStartARound: "you start a round",
  YouTabUnderTheRestScreen: "you Tab to আবার খেলো under the rest screen and press Enter",
  YouPressShesh: "you press শেষ on the card",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  TheWordIsSpoken: "the word finishes",
  TodaysTimeRunsOut: "today's time runs out",
  SomeoneHoldsTheGate: "someone holds বড়দের জন্য",
  TheKeyAutoRepeats: "Enter auto-repeats",
  TheyLetGoEarly: "they let go before 2 seconds",
  TwoSecondsPass: "2 seconds pass",
  AGrownUpAnswers: "a grown-up answers the sum",
  AChildMashesThePad: "a child mashes the number pad",
  TheGateCloses: "the gate closes",
  TheyGiveTenMore: "a grown-up gives 10 more minutes",
  TheChildTapsASiteLink: "the child taps a site link or the search",
  TheyComeBack: "they come back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.away ? "out" : v.rest ? "rest" : ["end", "closed"].includes(v.pos) ? "break" : "play";
export const colors = { play: "teal", break: "blue", rest: "yellow", out: "pink" };
