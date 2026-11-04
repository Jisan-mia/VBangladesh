export const title = "মঙ্গলে রোভার: the plan, the run, the rest screen and you";
const planWord = (p: string) => ({ empty: "no arrows yet", bad: "a plan that bumps", long: "a long plan that works", short: "the shortest plan" } as any)[p];
const game = (v: any) => {
  if (v.phase === "won") return "Level won: stars and a Mars fact";
  if (v.phase === "idle") return "আজকের মতো হলো, level grid";
  if (v.phase === "run") return v.step === 0 ? "Run starting, rover still at the start" : "Rover driving";
  if (v.fail) return "The bad block glows, fix the plan";
  return v.plan === "empty" ? "No arrows yet" : "Planning";
};
export const state = (v: any) => ({
  Game: game(v),
  Rest: v.resting ? "Rest screen up" : v.over ? (v.restSeen ? "Rest was shown, time still over" : "Today's minutes are up") : "Time left today",
  You: v.away ? "Looking away" : v.spot === "go" && v.phase === "run" ? "Here, finger on the চালাও spot" : "Here",
});
export const step = (action: string) => ({
  YouEditThePlan: "you add or remove arrows",
  YouTapGo: "you tap চালাও",
  TheRoverMoves: "the rover moves a square",
  TheRoverStops: "the rover bumps and stops",
  TheRoverWins: "the rover picks up the last rock",
  YouTapStop: "you tap থামাও",
  YouTapTheSameSpotAgain: "you tap চালাও again quickly (or press Enter)",
  YouPickALevel: "you pick a level",
  YouPressNextLevel: "you press পরের লেভেল",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressDone: "you press শেষ",
  TodaysMinutesRunOut: "today's minutes run out",
  AGrownUpGivesTenMore: "a grown-up gives 10 more minutes",
  ThePageReloads: "the page reloads",
  YouLookAway: "you look away",
  YouComeBack: "you come back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "run" ? "run" : v.phase === "won" ? "won" : "plan";
export const colors = { plan: "teal", run: "orange", rest: "yellow", won: "blue" };
