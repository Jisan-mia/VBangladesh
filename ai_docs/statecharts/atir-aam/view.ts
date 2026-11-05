export const title = "আঁটি থেকে আম: the screen, the menu, ফেরত নাও and the পাকা আম celebration";
const game = (v: any) => {
  if (v.screen === "title") return "Title: the plate says খেলো";
  if (v.screen === "over") return "End screen and card";
  if (v.screen === "choosing") return "মালির থলে open, the bed waits";
  if (v.top === "small") return v.peak === "big" ? "Swiping, পাকা আম taken back" : "Swiping, no পাকা আম yet";
  return v.news ? "পাকা আম just grown, line showing" : "Swiping, পাকা আম on the bed";
};
export const state = (v: any) => ({
  Game: game(v),
  Menu: v.menu ? "Menu open, bed paused" : v.guard ? "Just resumed (a swipe only wakes it)" : "Menu shut",
  Window: v.away ? "Away (another window or a hidden tab)" : "On the page",
});
const steps: Record<string, string | null> = {
  YouStart: "you tap the plate, পরের লেভেল or আবার খেলো",
  YouPress: null,
  YouLift: null,
  YouSwipe: "you swipe",
  YouGrowAMango: "you swipe two কাঁচা আম into a পাকা আম",
  TheChordEnds: null,
  YouTakeBack: "you press ফেরত",
  AnOfferOpens: "a new stage opens মালির থলে",
  YouPickACard: "you pick a card",
  TheRunEnds: "the run ends",
  YouGoAway: "you click into another window or hide the tab",
  YouComeBack: "you come back",
  YouOpenTheMenu: "you press P, ⏸, Esc or সব লেভেল",
  YouResume: "you press চালিয়ে যাও",
  TheBreathPasses: "a quarter second passes",
  YouSwitchSound: null,
};
// A finger, the chord fading and the sound switch change nothing the chart draws; the rules still check them.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.screen === "over" ? "done" : v.menu ? "held" : v.screen === "title" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
