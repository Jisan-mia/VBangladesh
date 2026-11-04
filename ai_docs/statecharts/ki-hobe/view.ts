export const title = "কী হবে বলো তো?: the guess, the experiment, the sound, the rest screen and the parent gate";
const game = (v: any) => ({
  choose: "Guess what will happen",
  watch: "The experiment plays",
  result: "What happened, and why",
  end: "Round done: আবার খেলো / শেষ / পরের ধাপ",
  closed: "পরীক্ষাগার বন্ধ",
} as any)[v.screen];
export const state = (v: any) => ({
  Game: game(v),
  Window: v.away ? "You're away" : "You're watching",
  Sound: v.sound ? (v.pending ? "Sound on, a note coming" : "Sound on") : (v.pending ? "Sound off, a note still coming" : "Sound off"),
  Rest: v.resting ? "Rest screen up" : v.late ? "Today's time used up" : "Time left today",
  Gate: v.gate ? (v.holder === "parent" ? "Gate open, parent holding" : "Gate open, child holding") : "Gate closed",
});
export const step = (action: string) => ({
  YouGuess: "you tap a guess",
  SceneNoteSounds: "the splash or ring sounds",
  TheExperimentEnds: "the experiment ends and the answer shows",
  YouTapLast: "you tap শেষ under the last answer",
  YouTapPlayAgain: "you tap আবার খেলো",
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
export const group = (v: any) => v.resting ? "rest" : v.screen === "end" || v.screen === "closed" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
