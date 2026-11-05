export const title = "আম্মুর নম্বর: a round of pieces, the look, the eye, the window, the kept number and the daily limit";
const round = (v: any) => ({
  title: "Title (the toy phone, খেলো)",
  look: v.piece === 0 ? "First piece playing (০১৭)" : "Longer piece playing",
  dial: v.piece === 0 ? "Dialling the first piece" : "Dialling the longer piece",
  rest: "Piece done, the next plays in 1 s",
  ring: "Whole number dialled and recorded, phone rings (1.6 s)",
  end: "End screen (আবার খেলো / শেষ)",
} as any)[v.phase];
export const state = (v: any) => ({
  Round: round(v),
  Look: ["look", "dial"].includes(v.phase) ? (v.looked ? "Saw the digits" : "The digits are playing") : "No look on screen",
  Window: v.win === "here" ? "On the page" : "Away (another window, hidden tab or the menu): every beat is held",
  Number: v.stored ? "Kept on this phone (parent ticked keep)" : "Only in this page",
  Today: v.resting ? "Rest screen owed (আজ এটুকুই)" : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  "AParentSetsTheNumber(TRUE)": "a parent types the number and ticks keep",
  "AParentSetsTheNumber(FALSE)": "a parent types the number, no tick",
  AParentClearsTheNumber: "a parent taps নম্বর মুছে দাও",
  YouPlay: "you tap খেলো or আবার খেলো",
  YouPlayPastTheLimit: "you tap খেলো past today's limit",
  TheLookEnds: "the digits finish playing and hide",
  YouTapADigitWhileTheDigitsPlay: "you tap a digit while the digits play (ignored)",
  YouTapTheEyeWhileTheDigitsPlay: "you tap the eye while the digits play (ignored)",
  YouTapTheEye: "you tap the eye",
  YouDialTheFirstPiece: "you dial the first piece",
  YouDialTheWholeNumber: "you dial the whole number",
  TheNextPiecePlays: "the next piece plays",
  TheEndScreenComes: "the end screen comes",
  YouRestart: "you tap ⟳ or শেষ",
  YouLeave: "you click into another window, hide the tab or open the menu",
  YouComeBack: "you come back",
  TimeIsUp: "today's time runs out",
  AParentGivesTenMinutes: "a parent gives ১০ more minutes",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : ["end", "title"].includes(v.phase) ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
