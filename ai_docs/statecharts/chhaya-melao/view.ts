export const title = "ছায়া মেলাও: the wall, the round, the rest screen and you";
const wall = (v: any) => {
  if (v.phase === "dark") return "Lamp off, switch waiting";
  if (v.phase === "done") return "Round over: stars and the found pictures";
  if (v.phase === "idle") return "আজকের মতো হলো";
  const n = v.item === 1 ? "First shadow" : "Last shadow";
  return v.solved ? `${n} matched, next one coming` : `${n} on the wall`;
};
export const state = (v: any) => ({
  Wall: wall(v),
  Rest: v.resting ? "Rest screen up" : v.over ? (v.restSeen ? "Rest was shown, time still over" : "Today's minutes are up") : "Time left today",
  You: v.away ? "Looking away" : v.focus === "level" ? "Here, a level button has focus" : "Here",
});
export const step = (action: string) => ({
  YouFlipTheSwitch: "you press the light switch",
  YouPickTheRightPicture: "you tap the right picture",
  YouPickAWrongPicture: "you tap a wrong picture",
  NextShadowComes: "a moment later the next shadow comes",
  RoundEnds: "a moment later the round ends",
  YouTapALevel: "you tap a level number",
  YouPressEnter: "you press Enter",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressDone: "you press শেষ",
  TodaysMinutesRunOut: "today's minutes run out",
  AGrownUpGivesTenMore: "a grown-up gives 10 more minutes",
  ThePageReloads: "the page reloads",
  YouLookAway: "you look away",
  YouComeBack: "you come back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "play" ? "play" : v.phase === "done" ? "done" : "wait";
export const colors = { play: "teal", rest: "yellow", done: "blue", wait: "tan" };
