export const title = "Sir ghurlei thamo: the class, the window, the chit and its hum";
export const state = (v: any) => {
  if (v.pending) return "Friend's link ignored";
  if (v.hand === "skipped") return "Enter held: the result was skipped";
  if (v.phase === "over") return "Result";
  if (v.party) return "New class, the old confetti still to come";
  if (v.paused) return "Paused";
  if (v.phase === "ready") return "Ready";
  if (!v.focused) return v.holding ? "Chit moving while you're away" : "Clock running while you're away";
  if (v.holding && v.sound && !v.hum) return "Chit moving in silence";
  if (v.teacher === "class" && v.holding) return "Teacher looking, chit moving";
  return v.holding ? "Passing the chit" : "Chit still";
};
const labels: Record<string, string> = {
  YouPressEnter: "you press Enter",
  KeyRepeats: "the held key repeats",
  YouLetGo: "you let go",
  YouResume: "you press চালিয়ে যাও",
  YouSwitchMode: "you switch to one-tap",
  YouPlayAgain: "you press আরেকবার",
  TeacherTurns: "the teacher turns",
  TeacherTurnsBack: "the teacher turns back",
  ChitCaught: "the teacher catches the chit",
  ChitArrives: "the chit reaches the last bench",
  PartyFires: "the confetti falls",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  FriendLinkArrives: "you open a friend's link in this tab",
};
// The chart keeps these arrows (whole arrows only); the rest repeat what these show.
const kept = new Set([
  "Ready|Passing the chit", "Ready|Friend's link ignored",
  "Passing the chit|Result", "Passing the chit|Teacher looking, chit moving", "Teacher looking, chit moving|Chit still",
  "Passing the chit|Chit still", "Chit still|Passing the chit",
  "Passing the chit|Clock running while you're away", "Passing the chit|Chit moving while you're away",
  "Chit moving while you're away|Clock running while you're away", "Clock running while you're away|Chit still",
  "Passing the chit|Paused", "Paused|Chit still",
  "Passing the chit|Chit moving in silence", "Chit moving in silence|Chit still",
  "Result|New class, the old confetti still to come", "New class, the old confetti still to come|Ready", "Result|Ready",
  "Result|Enter held: the result was skipped", "Enter held: the result was skipped|Ready",
]);
export const step = (action: string, from: any, to: any) => {
  const a = state(from), b = state(to);
  return a === b || kept.has(`${a}|${b}`) ? labels[action] ?? action : null;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
