export const title = "বর্ণ লিখি: the set, the finger, the keyboard, mute, rest and the parent gate";
const letter = (v: any) => v.page === "adult" ? "Left for an adult tool" : v.resting === "atOpen" ? "Opens on the rest screen" : v.resting === "atBreak" ? "Rest screen" : ({
  trace: v.last ? "Tracing the set's last letter" : "Tracing a letter",
  drawn: v.last ? "Last letter done: শেষ" : "Letter done: পরেরটা",
  end: "End card",
  closed: "আজকের লেখা শেষ",
} as any)[v.phase];
export const state = (v: any) => ({
  Set: letter(v),
  Finger: v.pointer ? (v.window === "here" ? "Finger on the board" : "Finger counted on the board, you're away") : (v.window === "here" ? "Hands off" : "In another window"),
  Keys: ({ none: "Nothing focused", board: "Board focused", next: "পরেরটা focused", toggle: "Sound toggle focused", lost: "Focus fell to the page" } as any)[v.focus] + (v.misfire ? ", Enter clicked a button" : ""),
  Sound: v.sound ? (v.talking ? "Sound on, speaking" : "Sound on") : (v.talking ? "Sound off, but speaking" : "Sound off"),
  Gate: ({ shut: "Gate shut", holding: "Holding the gate", extra: "Holding, a second timer armed", armed: "Let go, a timer still armed", asks: "Gate asks the sum" } as any)[v.gate],
});
export const step = (action: string) => ({
  YouTouchTheBoard: "you touch the board",
  YouTraceAStroke: "you trace a stroke",
  YouLiftYourFinger: "you lift your finger",
  YouTabToTheBoard: "you Tab to the board",
  YouTabToNext: "you Tab to পরেরটা",
  YouPressEnterOnTheBoard: "you press Enter on the board",
  YouPressEnterOnTheToggle: "you press Enter to write",
  YouTapNext: "you tap পরেরটা",
  YouPressEnterOnNext: "you press Enter on পরেরটা",
  YouTapWriteAgain: "you tap আবার লিখি",
  YouStartASet: "you start a set",
  YouPressEnd: "you press শেষ",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouTapTheSoundToggle: "you tap the speaker",
  SpeechEnds: "the voice finishes",
  GrownUpGivesTime: "a grown-up gives 10 more minutes",
  YouHoldTheGate: "you hold বড়দের জন্য",
  YouLetGoOfTheGate: "you let go",
  GateTimerFires: "two seconds pass",
  GrownUpClosesGate: "the gate closes",
  YouTapARelatedCard: "you tap a card under the game",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.page === "adult" ? "out" : v.resting !== "no" ? "rest" : v.phase === "trace" ? "play" : "card";
export const colors = { play: "teal", card: "blue", rest: "yellow", out: "pink" };
