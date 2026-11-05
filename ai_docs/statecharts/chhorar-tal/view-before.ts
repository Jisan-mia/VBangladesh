export const title = "ছড়ার তালে: the round, the window, keys, the voice and the daily limit";
const round = (v: any) => ({
  ready: "Drum waiting (ঢোলে চাপ দাও)",
  beat: v.progress === 0 ? "ছড়া playing, first lines" : "ছড়া playing, last line",
  rhyme: v.voice ? "Rhyme pick (the ছড়া was spoken)" : "Rhyme pick, nothing spoken: only words to read",
  solved: "Right picture, card in 1.8 s",
  done: "Done screen (আবার খেলো / শেষ)",
  idle: "আজকের মতো হলো",
} as any)[v.phase];
export const state = (v: any) => ({
  Round: round(v) + (v.lost ? ", the won round was never counted" : ""),
  Window: v.win === "here" ? "On the page" : "Away (another window or tab)",
  Keys: v.keyWent === "restart" ? "Space started the ছড়া over" : v.keyWent === "scroll" ? "Space scrolled the page" : v.focus === "level" ? "Focus on a ছড়া button" : v.focus === "drum" ? "Focus on the drum" : "Nothing focused",
  Voice: !v.voice ? "No Bangla voice on this phone" : v.speaking ? "Voice reading the ছড়া" : "Voice quiet",
  Sound: v.sound ? "Sound on" : "Sound off",
  Today: v.resting ? "Rest screen (আজ এটুকুই)" : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouTapTheDrum: "you tap the drum",
  YouPressSpace: "you press Space",
  YouPickAChhora: "you tap a ছড়া number",
  TheBeatMovesOn: "the beat moves on",
  TheChhoraEnds: "the ছড়া ends and the pictures come",
  YouTapTheRightPicture: "you tap the right picture",
  TheRoundEnds: "the done screen comes",
  TheVoiceFinishes: "the voice finishes",
  YouPlayAgain: "you tap আবার খেলো",
  YouPressShesh: "you tap শেষ",
  YouLeave: "you click into another window or hide the tab",
  YouComeBack: "you come back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  TimeIsUp: "today's time runs out",
  AParentGivesTenMinutes: "a parent gives ১০ more minutes",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : ["done", "idle"].includes(v.phase) ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
