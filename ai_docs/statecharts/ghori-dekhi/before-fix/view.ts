export const title = "ঘড়ি দেখি: round, clock hand, card, rest screen and parent gate";
const round = (v: any) => v.away ? "Left the kids' area" : ({
  set1: "Setting the clock, ghost finger shows",
  ok1: "Clock set right", read2: "Reading the clock", ok2: "Read it right", set3: "Setting the clock, no ghost finger",
  ok3: "Last one right", done: v.recorded > 1 ? "Card shows, round counted twice" : "Card shows", menu: "Level menu",
} as any)[v.pos];
const hand = (v: any) => v.grip ? (v.finger ? (v.focused ? "Turning a hand" : "Turning a hand, window away") : (v.focused ? "Hand follows without a finger" : "Hand stuck, window away"))
  : (v.focused ? "Hands off" : "Window away");
const gate = (v: any) => ({
  shut: "Gate shut", holding: "Gate held", repeat: "Gate held", orphan: "Let go, timer still running",
  ask: "Sum question shows", early: "Sum question shows without a full hold", open: "Grown-up opened the gate", child: "Child opened the gate",
} as any)[v.gate];
export const state = (v: any) => ({
  Round: round(v),
  Hand: hand(v),
  Rest: v.rest ? "Rest screen shows" : v.overLimit ? "Today's time is up" : "Time left today",
  Gate: gate(v),
});
// Hidden to keep the chart readable: leaving by a site link from the card (the same arrow as from the first item),
// and the gate shutting when a round starts or শেষ is pressed.
export const step = (action: string, from: any) => {
  if (["YouStartARound", "YouPressShesh", "YouTabUnderTheRestScreen"].includes(action) && from.gate !== "shut") return null;
  return ({
    YouPressTheClock: "you press on the clock",
    YouLiftYourFinger: "you lift your finger",
    YouLetGoInAnotherWindow: "you let go in another window",
    WindowBlurs: "you click into another window",
    WindowFocuses: "you come back to the window",
    YouGetItRight: "you get it right",
    YouSlip: "you slip",
    YouPressNext: "you press পরেরটা",
    YouPressSeeTheEnd: "you press শেষ দেখো",
    YouPressTheHiddenButton: "you Tab to the hidden শেষ দেখো and press Enter",
    YouPressShesh: "you press শেষ",
    YouStartARound: "you start a round",
    YouTabUnderTheRestScreen: "you Tab to আবার খেলো under the rest screen and press Enter",
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
};
export const group = (v: any) => v.away ? "out" : v.rest ? "rest" : ["done", "menu"].includes(v.pos) ? "break" : "play";
export const colors = { play: "teal", break: "blue", rest: "yellow", out: "pink" };
