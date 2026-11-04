export const title = "মনের রং: scenes, voice, stars, rest screen and parent gate";
const scene = (v: any) => v.away ? "Left the kids' area" : ({
  name1: "Naming a feeling", kind1: "Picking a kind thing", talk1: "Talking about it",
  name2: "Naming a feeling", kind2: "Picking a kind thing", talk2: "Talking about the last picture",
  end: v.stars > Math.min(3, v.plays) ? "Card shows, set counted twice" : "Card shows", closed: "Pictures put away for today",
} as any)[v.step];
const gate = (v: any) => ({
  shut: "Gate shut", holding: "Gate held", repeat: "Gate held", orphan: "Let go, timer still running",
  ask: "Sum question shows", early: "Sum question shows without a full hold", open: "Grown-up opened the gate", child: "Child opened the gate",
} as any)[v.gate];
export const state = (v: any) => ({
  Scene: scene(v),
  Rest: v.rest ? "Rest screen shows" : v.overLimit ? "Today's time is up" : "Time left today",
  Voice: v.speaking ? (v.sound ? "Reading a line aloud" : "Reading aloud with sound off") : (v.sound ? "Sound on" : "Sound off"),
  Gate: gate(v),
});
// Hidden to keep the chart readable: the gate shutting when a set starts or শেষ is pressed.
export const step = (action: string, from: any) => {
  if (["YouStartASet", "YouPressShesh", "YouTabUnderTheRestScreen"].includes(action) && from.gate !== "shut") return null;
  return ({
    YouNameTheFeeling: "you tap a face that fits",
    YouPickAnotherFace: "you tap a face that doesn't fit",
    YouPickAKindThing: "you pick a kind thing",
    YouPressNextPicture: "you press পরের ছবি",
    YouPressSetDone: "you press ধাপ শেষ",
    YouPressTheHiddenButton: "you Tab to the hidden ধাপ শেষ and press Enter",
    YouPressShesh: "you press শেষ",
    YouStartASet: "you start a set",
    YouTabUnderTheRestScreen: "you Tab to আবার খেলো under the rest screen and press Enter",
    SoundOff: "you turn sound off",
    SoundOn: "you turn sound on",
    TheLineIsSpoken: "the line finishes",
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
    Done: "nothing more to play",
  } as Record<string, string>)[action] ?? action;
};
export const group = (v: any) => v.away ? "out" : v.rest ? "rest" : ["end", "closed"].includes(v.step) ? "break" : "play";
export const colors = { play: "teal", break: "blue", rest: "yellow", out: "pink" };
