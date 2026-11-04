export const title = "দাঁড়িপাল্লা: the pans, the round, the rest screen and you";
const shop = (v: any) => {
  if (v.phase === "end") return "End screen: stars, আবার খেলো, পরের ধাপ";
  if (v.phase === "closed") return "দোকান বন্ধ";
  const which = v.idx === 1 ? "First pan" : "Last pan";
  if (v.stage === "balance") return `${which}: tipped, add weights`;
  if (v.stage === "ask") return `${which}: level, what does the fruit weigh?`;
  return v.idx === 1 ? "First pan level, পরের পাল্লা shows" : "Last pan level, resting a moment";
};
export const state = (v: any) => ({
  Shop: shop(v),
  Rest: v.resting ? "Rest screen up" : v.over ? (v.restSeen ? "Rest was shown, time still over" : "Today's minutes are up") : "Time left today",
  You: v.away ? "Looking away" : "Here",
});
export const step = (action: string) => ({
  YouPutOnAPiece: "you tap a weight",
  YouTapTheLastWeightOnAPhone: "on a phone, you tap the weight that levels the pan",
  YouChooseAWeight: "you tap a number",
  YouPressNextPan: "you press পরের পাল্লা",
  TheRoundEnds: "a moment later the end screen comes",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressNextLevel: "you press পরের ধাপ",
  YouPressDone: "you press শেষ",
  YouPickALevel: "you pick a level in সব ধাপ",
  TodaysMinutesRunOut: "today's minutes run out",
  AGrownUpGivesTenMore: "a grown-up gives 10 more minutes",
  ThePageReloads: "the page reloads",
  YouLookAway: "you look away",
  YouComeBack: "you come back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "play" ? "play" : "end";
export const colors = { play: "teal", rest: "yellow", end: "blue" };
