export const title = "chhorar-tal: the screens, the beat, the window, keys and the daily limit";
const round = (v: any) => ({
  title: "Title (the big drum)",
  levels: "ছড়া list (nothing runs)",
  play: v.counting ? "Counting in (২, ১)" : v.beat === 0 ? "ছড়া playing, early lines" : "ছড়া playing, last line",
  end: v.guard ? "End screen (আবার খেলো / শেষ, live)" : "End screen (buttons waking, stars counting)",
} as any)[v.screen];
export const state = (v: any) => ({
  Round: round(v) + (v.screen === "end" && v.recorded ? ", stars saved" : ""),
  Beat: v.menu ? "Player's menu open: beat stopped" : v.win === "away" ? "Away: beat stopped" : v.loop ? "Beat running" : v.owed ? "Beat owed a count-in" : "No beat",
  Window: v.win === "here" ? "On the page" : "Away (another window or tab)",
  Keys: v.keyWent === "tap" ? "Space tapped the drum" : v.keyWent === "start" ? "Space started the ছড়া" : v.swallow ? "First tap back only wakes the game" : "Space goes to the game",
  Today: v.resting ? "Rest screen (আজ এটুকুই)" : v.overLimit ? "Today's time is up" : "Time left today",
});
export const step = (action: string) => ({
  YouTapTheStart: "you tap the big drum",
  YouPressSpaceOnTheTitle: "you press Space on the title",
  YouPickAChhora: "you pick a ছড়া in the list",
  YouOpenTheList: "you open the ছড়া list",
  YouCloseTheList: "you close the list",
  YouTapTheDrum: "you tap the drum",
  YouPressSpace: "you press Space",
  CountInEnds: "the two beats are counted in",
  TheBeatMovesOn: "the beat moves on",
  TheChhoraEnds: "the last beat ends: stars saved, limit checked",
  TheGuardPasses: "the end screen's buttons wake up",
  YouPlayAgain: "you tap আবার খেলো",
  YouPressShesh: "you tap শেষ",
  YouLeave: "you click into another window or hide the tab",
  YouComeBack: "you come back",
  YouPause: "you open the player's menu",
  YouResume: "you tap চালিয়ে যাও",
  TimeIsUp: "today's time runs out",
  AParentGivesTenMinutes: "a parent gives ১০ more minutes",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : v.menu || v.win === "away" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
