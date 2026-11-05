export const title = "Deri hoye gelo: the run, the window, the keys and the result";
export const state = (v: any) => {
  if (v.left === "stale") return "Space let go: a new run started by itself";
  if (["playing", "paused"].includes(v.phase) && v.run !== v.shown) return "Your road under the friend's banner";
  if (v.phase === "over") return "Result";
  if (v.party) return v.phase === "ready" ? "Ready, the old confetti still to come" : "Running, the old confetti still to come";
  if (v.phase === "ready") return "Ready";
  if (v.phase === "paused") return "Paused";
  if (!v.focused) return v.duck ? "Running ducked while you're away" : "Running while you're away";
  if (v.duck && v.hand !== "duck") return "Ducked with no key held";
  return v.duck ? "Ducking" : "Running";
};
const labels: Record<string, string> = {
  YouPressJump: "you press Space",
  YouPressDuck: "you hold ↓",
  YouLetGo: "you let go",
  YouPause: "you press P",
  YouResume: "you press চালিয়ে যাও",
  AgainTakesFocus: "আরেকবার takes focus",
  YouPressAgain: "you press আরেকবার",
  KidBumps: "the kid bumps into something",
  GateReached: "the kid reaches the gate",
  PartyFires: "the confetti falls",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  FriendLinkOpens: "you open a friend's link",
  YouPickDay: "you pick a day",
};
// The chart keeps these arrows (whole arrows only); the rest repeat what these show.
const kept = new Set([
  "Ready|Running", "Running|Ducking", "Ducking|Running", "Running|Result", "Ducking|Result", "Result|Ready",
  "Running|Paused", "Paused|Running", "Running|Running while you're away", "Running while you're away|Running",
  "Running while you're away|Result",
  "Ducking|Running ducked while you're away", "Running ducked while you're away|Ducked with no key held",
  "Running ducked while you're away|Result", "Ducked with no key held|Result", "Ducked with no key held|Ducking",
  "Result|Space let go: a new run started by itself", "Space let go: a new run started by itself|Running",
  "Result|Running, the old confetti still to come", "Result|Ready, the old confetti still to come",
  "Ready, the old confetti still to come|Ready", "Running, the old confetti still to come|Running",
  "Running|Your road under the friend's banner", "Your road under the friend's banner|Result",
]);
export const step = (action: string, from: any, to: any) => {
  const a = state(from), b = state(to);
  return a === b || kept.has(`${a}|${b}`) ? labels[action] ?? action : null;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
