export const title = "সুর বানাই: the beat and the sound switch";
export const state = (v: any) => ({
  Beat: v.playing ? "A tune plays" : "Nothing plays",
  Where: v.paused ? "Pause menu open" : v.window === "here" ? "In the game" : "In another window or tab hidden",
  Sound: v.sound ? "Sound on" : v.beatHeard ? "Sound off, a note still rings" : "Sound off",
});
export const step = (action: string) => ({
  YouStartATune: "you start a tune",
  TheTuneStops: "the tune stops",
  NextBeat: "the next beat plays",
  WindowBlurs: "you click into another window, or hide the tab",
  WindowFocuses: "you come back to the window",
  PlayerPauses: "the pause menu opens",
  PlayerResumes: "চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.playing ? "play" : "quiet";
export const colors = { play: "teal", quiet: "blue" };
