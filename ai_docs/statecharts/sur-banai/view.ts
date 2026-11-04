export const title = "সুর বানাই: the grid, the beat loop, away and back, mute, rest and the parent gate";
const screen = (v: any) => v.page === "adult" ? "Left for an adult tool" : v.resting === "atOpen" ? "Opens on the rest screen" : v.resting === "atBreak" ? "Rest screen" : ({
  free: v.unsaved ? "আমার সুর: a tune not kept" : "আমার সুর: nothing to lose",
  match: v.drawer ? "সুরটা মেলাও, সব সুর open" : "সুরটা মেলাও",
  saved: "End card", won: "End card", idle: "End card",
} as any)[v.screen];
export const state = (v: any) => ({
  Screen: screen(v),
  Tune: v.playing === "none" ? "Nothing plays" : v.window === "here" ? "A tune plays" : "A tune plays, you're away",
  Sound: v.sound ? (v.talking ? "Sound on, speaking" : "Sound on") : (v.talking ? "Sound off, but speaking" : v.beatHeard ? "Sound off, a note still rings" : "Sound off"),
  Gate: ({ shut: "Gate shut", holding: "Holding the gate", extra: "Holding the gate", armed: "Let go, a timer still armed", asks: "Gate asks the sum" } as any)[v.gate],
});
export const step = (action: string) => ({
  YouTapACell: "you tap a cell",
  YouClear: "you press মুছো",
  YouPressPlay: "you press বাজাও",
  YouPressStop: "you press থামাও",
  YouSave: "you press রাখো",
  NextBeat: "the next beat plays",
  TuneEnds: "the tune to copy ends",
  YouPickFree: "you press আমার সুর",
  YouPickMatch: "you press সুরটা মেলাও",
  YouListen: "you press শোনো",
  YouCheckWrong: "you press মিলিয়ে দেখো and it doesn't match",
  YouCheckRight: "you press মিলিয়ে দেখো and it matches",
  YouOpenDrawer: "you open সব সুর",
  YouPickATune: "you pick a tune from the list",
  YouPlayAgain: "you press আবার খেলো",
  YouEnd: "you press শেষ",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouTapTheSpeaker: "you tap the speaker",
  SpeechEnds: "the voice finishes",
  GrownUpGivesTime: "a grown-up gives 10 more minutes",
  YouHoldTheGate: "you hold বড়দের জন্য",
  YouLetGoOfTheGate: "you let go",
  GateTimerFires: "two seconds pass",
  GrownUpClosesGate: "the gate closes",
  YouTapARelatedCard: "you tap a card under the game",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.page === "adult" ? "out" : v.resting !== "no" ? "rest" : ["saved", "won", "idle"].includes(v.screen) ? "card" : "play";
export const colors = { play: "teal", card: "blue", rest: "yellow", out: "pink" };
