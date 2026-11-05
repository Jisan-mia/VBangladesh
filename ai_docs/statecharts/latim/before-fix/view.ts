export const title = "লাটিম: the spin, the window, your hand and the hum";
const top = (v: any) => ({ ready: "In your hand", spin: "Spinning", low: "Spinning slowly (হাতে তোলো shows)", settle: "Coming to rest", over: "Card shows" } as any)[v.phase];
export const state = (v: any) => ({
  Top: v.paused ? `${top(v)}, paused` : top(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: ({ none: "Hands off", hold: "Holding to wind", swipe: "Pulling down" } as any)[v.hand],
  Hum: v.hum ? "Hum on" : "Hum off",
  Sound: v.sound ? "Sound on" : "Sound off",
  Levels: v.drawer ? "Level list open" : "Level list shut",
  Cheer: v.cheer ? "Cheer queued" : "No cheer queued",
});
export const step = (action: string) => ({
  YouHoldToWind: "you hold the button to wind",
  YouLetGoAndThrow: "you let go and it throws",
  YouStartAPull: "you put a finger on the top",
  YouFlick: "you pull down and let go",
  SpinSlows: "the spin slows",
  TopFalls: "the top falls",
  YouPickItUp: "you press হাতে তোলো",
  TopComesToRest: "it comes to rest and the card shows",
  CheerFires: "the cheer plays",
  YouPause: "you press থামাও",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  PullCancelled: "the pull is cancelled",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouOpenLevels: "you open সব লেভেল",
  YouCloseLevels: "you close সব লেভেল",
  YouPickALevel: "you pick a level",
  YouPlayAgain: "you press আবার খেলো",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
