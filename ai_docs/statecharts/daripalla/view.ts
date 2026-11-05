export const title = "দাঁড়িপাল্লা: the pans, the round, the level list, the rest screen and you";
const shop = (v: any) => {
  if (v.screen === "title") return "Title: the shop is the start button";
  if (v.screen === "end") return "End page: stars, counts, আবার খেলো, শেষ";
  if (v.screen === "levels") return v.ask ? "Level list: leave this round? (থাকি, চলো)" : `Level list (from ${v.back === "play" ? "a round" : v.back === "end" ? "the end page" : "the title"})`;
  const which = v.idx === 1 ? "First pan" : "Last pan";
  if (v.stage === "balance") return `${which}: tipped, add weights`;
  if (v.stage === "ask") return v.ready ? `${which}: level, what does the fruit weigh?` : `${which}: level, holding before the question`;
  if (v.idx === 2) return "Last pan level, round won and saved, resting a moment";
  return v.ready ? "First pan level, পরের পাল্লা shows" : "First pan level, holding";
};
export const state = (v: any) => ({
  Shop: shop(v),
  Rest: v.resting ? "Rest flag up" : v.over ? (v.restSeen ? "Rest was shown, time still over" : "Today's minutes are up") : "Time left today",
  You: v.away ? "Looking away" : v.paused ? "Menu open" : v.swallow ? "Back, first tap only wakes" : "Here",
});
export const step = (action: string) => ({
  YouStart: "you press খেলো or আবার খেলো",
  YouTapAfterComingBack: "your first tap back only wakes the game",
  YouPutOnAPiece: "you tap a weight, it flies onto the pan",
  TheQuestionAppears: "after a short hold the numbers show",
  YouChooseAWeight: "you tap a number",
  TheHoldPasses: "the level pan holds, then পরের পাল্লা shows",
  YouPressNextPan: "you press পরের পাল্লা",
  TheEndPageComes: "a moment later the end page comes",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressDone: "you press শেষ",
  YouOpenLevels: "you open the level list",
  YouCloseLevels: "you go back from the list",
  YouPickALevel: "you pick a level card",
  YouStay: "you press থাকি",
  YouLeaveTheRound: "you press চলো",
  TheMenuOpens: "the pause menu opens",
  YouResume: "you press চালিয়ে যাও",
  YouLookAway: "you look away",
  YouComeBack: "you come back",
  TodaysMinutesRunOut: "today's minutes run out",
  AGrownUpGivesTenMore: "a grown-up gives 10 more minutes",
  ThePageReloads: "the page reloads",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && v.screen !== "play" ? "rest" : v.screen === "play" ? "play" : "page";
export const colors = { play: "teal", rest: "yellow", page: "blue" };
