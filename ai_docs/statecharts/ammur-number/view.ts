export const title = "আম্মুর নম্বর: a round of pieces, the look, the window, the voice and the daily limit";
const round = (v: any) => ({
  setup: "No number yet (নম্বর দাও)",
  listen: v.piece === 0 ? "First piece playing (০১৭)" : "Longer piece playing",
  typing: v.piece === 0 ? "Dialling the first piece" : "Dialling the longer piece",
  pieceRest: "Piece done, the next plays in 1 s",
  ringing: "Whole number dialled, phone rings (1.7 s)",
  end: "End screen (আবার খেলো / শেষ / পরের ধাপ)",
  closed: "ফোন রেখে দিলাম",
} as any)[v.phase];
export const state = (v: any) => ({
  Round: round(v) + (v.lost ? ", the dialled number was never counted" : ""),
  Look: ["listen", "typing"].includes(v.phase) ? (v.looked ? "Saw the digits" : "The digits played and hid while away") : "No look on screen",
  Help: v.charged ? "A help charged while the digits already showed" : v.held ? "Enter held on আবার দেখাও" : "Each look charged once",
  Window: v.win === "here" ? "On the page" : "Away (another window or tab)",
  Number: v.sent ? "Number's words sent to a speech server" : "Number only in this page",
  Today: v.resting ? "Rest screen (আজ এটুকুই)" : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  AParentSetsTheNumber: "a parent types the number behind নম্বর দাও",
  ThePlaybackEnds: "the digits finish playing and hide",
  YouDialThePiece: "you dial the piece",
  TheNextPiecePlays: "the next piece plays",
  TheEndScreenComes: "the end screen comes",
  YouTapLookAgain: "you tap আবার দেখাও",
  YouHoldEnterOnLookAgain: "you hold Enter on আবার দেখাও",
  TheKeyRepeats: "the held key repeats",
  YouLetGo: "you let go",
  YouSwitchNumberOrStep: "you tap আব্বু or a ধাপ",
  YouPlayAgain: "you tap আবার খেলো or পরের ধাপ",
  YouPressShesh: "you tap শেষ",
  YouTapTheSpeakerOnAPhoneWithANetworkVoice: "you tap 🔈 (a phone whose Bangla voice is online)",
  YouLeave: "you click into another window or hide the tab",
  YouComeBack: "you come back",
  TimeIsUp: "today's time runs out",
  AParentGivesTenMinutes: "a parent gives ১০ more minutes",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : ["end", "closed", "setup"].includes(v.phase) ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
