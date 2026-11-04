export const title = "Dosh ghater nouka (boat race): race, spin timer, away, sound, daily limit and gate";
const race = (v: any) => {
  if (v.resting) return v.phase === "play" ? "Rest screen over a race in play" : "Rest screen after the race";
  if (v.phase === "end") return "Race card shows";
  if (v.phase === "closed") return "নৌকা ঘাটে বাঁধা হলো";
  if (v.over) return "Your boat at the last ghat, card coming";
  if (v.turn === 1) return v.timer !== "none" ? "আব্বু's চরকি spinning" : v.spin !== "none" ? "আব্বু's boat counting" : "আব্বু's turn";
  if (v.spin === "old") return "Your turn, a spin you never made is set";
  return v.timer !== "none" ? (v.timer === "old" ? "Your turn, the last race's চরকি still spinning" : "Your চরকি spinning") : v.spin !== "none" ? "Your turn, tap the ghats" : "Your turn";
};
export const state = (v: any) => ({
  Race: race(v),
  Window: v.away ? "You're away" : "You're on the page",
  Sound: v.sound ? "Sound on" : v.voice === "spoke" ? "Sound off, but numbers were spoken" : "Sound off",
  Today: (v.due ? "Today's time is up" : "Time left today") + (v.skipped ? ", a finished race never counted" : ""),
  Gate: v.stage === "open" ? "Share link open" : "বড়দের জন্য closed",
});
const labels: Record<string, string> = {
  YouSpin: "you spin your চরকি",
  AbbuSpins: "a second later আব্বু spins",
  TheSpinnerStops: "the চরকি stops",
  YouCountToWhereItStops: "you tap the ghats to where it stops",
  AbbuCounts: "আব্বু's boat counts its ghats",
  TheRaceEnds: "0.9 s later the card shows",
  YouTapAModeOrAStage: "you tap a mode button or a ধাপ",
  YouPlayAgain: "you press আবার খেলো or নতুন খেলা",
  YouPressShesh: "you press শেষ",
  YouLeave: "you leave (another window or tab)",
  YouComeBack: "you come back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  TodaysTimeRunsOut: "today's time runs out",
  AGrownUpGivesTenMore: "a grown-up gives ১০ more minutes",
  AGrownUpOpensTheGate: "a grown-up opens বড়দের জন্য",
  TheGateCloses: "বন্ধ করো, one use, a minute or hiding the tab closes it",
};
export const step = (action: string) => labels[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "play" ? "play" : "done";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
