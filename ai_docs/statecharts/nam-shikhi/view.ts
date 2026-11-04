export const title = "Nam Shikhi: the name book, pause and focus, and the daily limit";
const game = (v: any) => {
  if (v.screen === "title" || v.screen === "list") return "Title or level list";
  if (v.screen === "end") return "End screen";
  if (!v.solved) return "A card, stickers on offer";
  return v.card === 2 ? "Page full and recorded, → shows" : "Sticker placed, → shows";
};
export const state = (v: any) => ({
  Game: game(v),
  Pause: v.menu ? "Pause menu" : v.swallow || v.window !== "here" ? "Away, next tap only wakes" : "Playing",
  Today: v.resting ? "Rest screen (আজ এটুকুই)" : "No rest screen",
});
export const step = (action: string) => ({
  YouPressStart: "খেলো or আবার খেলো",
  YouTapTheRightSticker: "the child taps the right sticker",
  YouPressNext: "the child presses →",
  TheGuardPasses: "the end screen's guard passes",
  YouPressShesh: "শেষ",
  YouOpenTheList: "সব লেভেল",
  YouPickALevel: "a level is picked",
  ALinkOpens: "a #p= link opens",
  ThePageOpens: "the page opens again",
  YouPressPause: "⏸ or P",
  WindowBlurs: "the window or tab goes away",
  TabHides: "the window or tab goes away",
  YouComeBack: "the window is back",
  YouResume: "চালিয়ে যাও",
  YouRestart: "নতুন করে শুরু",
  TimeIsUp: "today's play time runs out",
  AParentGivesMoreTime: "a parent gives ১০ মিনিট more",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
