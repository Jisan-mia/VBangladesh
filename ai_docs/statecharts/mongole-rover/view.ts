export const title = "মঙ্গলে রোভার: the plan, the run, the story, the rest screen and you";
const game = (v: any) => {
  if (v.screen === "won") return "Level won: stars and a Mars fact";
  if (v.screen === "title") return "The hill (start)";
  if (v.screen === "story") return "First-run story";
  if (v.screen === "levels") return "Level list";
  if (v.screen === "run") return v.solved ? "Last rock lifted, stars saved" : "Rover driving";
  return v.fail ? "The bad block glows, fix the plan" : "Planning";
};
export const state = (v: any) => ({
  Game: game(v),
  Rest: v.resting ? "Rest screen up" : v.over ? "Today's minutes are up" : "Time left today",
  You: v.hand === "menu" ? "Menu open" : v.hand === "away" ? "Looking away" : "Here",
});
export const step = (action: string) => ({
  YouTapTheHill: "you tap the hill (খেলো)",
  YouFinishTheStory: "you finish or skip the story",
  YouEditThePlan: "you add or remove arrows",
  YouTapToWake: "your first tap back only wakes the game",
  YouTapGo: "you tap চালাও",
  TheGuardPasses: "half a second passes",
  YouTapStop: "you tap থামাও",
  TheRoverMoves: "the rover moves a square",
  TheRoverLiftsTheLastRock: "the rover lifts the last rock (stars saved)",
  TheEndScreenShows: "the end screen shows",
  TheRoverBumps: "the rover bumps and stops",
  YouPressNextLevel: "you press পরের লেভেল",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressDone: "you press শেষ",
  YouOpenTheLevelList: "you open the level list",
  YouPickALevel: "you pick a level",
  YouCloseTheLevelList: "you close the level list",
  ThePlayerMenuOpens: "the pause menu opens",
  YouResume: "you press চালিয়ে যাও",
  YouLookAway: "you look away",
  YouComeBack: "you come back",
  TodaysMinutesRunOut: "today's minutes run out",
  AGrownUpGivesTenMore: "a grown-up gives 10 more minutes",
  ThePageReloads: "the page reloads",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.screen === "run" ? "run" : v.screen === "won" ? "won" : "plan";
export const colors = { plan: "teal", run: "orange", rest: "yellow", won: "blue" };
