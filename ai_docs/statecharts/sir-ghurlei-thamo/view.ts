export const title = "Sir ghurlei thamo: the class, the window, the menu, the chit and its hum";
export const state = (v: any) => {
  if (v.phase === "title") return v.sheet ? "Level list on the title" : "Title";
  if (v.phase === "over") return v.sheet ? "Level list over the result" : v.paused || !v.focused || !v.visible ? "Result, away" : "Result";
  if (v.pending) return "Friend's link waiting";
  if (v.sheet) return "Level list, class frozen";
  if (v.paused) return "Paused";
  if (!v.visible || !v.focused) return "Away, class frozen";
  if (v.breath) return "Back, a breath first";
  if (v.phase === "ready") return "Ready";
  if (v.holding && v.sound && !v.hum) return "Chit moving in silence";
  if (v.teacher === "class" && v.holding) return "Teacher looking, chit moving";
  return v.holding ? "Passing the chit" : "Chit still";
};
const labels: Record<string, string> = {
  YouPressEnter: "you press Enter",
  YouTapChit: "you press the chit",
  KeyRepeats: "the held key repeats (ignored)",
  YouLetGo: "you let go",
  YouChooseClass: "you choose a class",
  YouSwitchMode: "you switch to one-tap",
  MenuOpens: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও",
  YouOpenLevels: "you open সব লেভেল",
  YouCloseLevels: "you close the list",
  TeacherTurns: "the teacher turns",
  TeacherTurnsBack: "the teacher turns back",
  ChitCaught: "the teacher catches the chit",
  ChitArrives: "the chit reaches the last bench",
  PartyEnds: "the star chimes end",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  FriendLinkArrives: "you open a friend's link in this tab",
  BreathEnds: "half a second passes",
};
// The chart keeps these arrows (whole arrows only); the rest repeat what these show.
const kept = new Set([
  "Title|Ready", "Ready|Passing the chit", "Passing the chit|Chit still", "Chit still|Passing the chit",
  "Passing the chit|Teacher looking, chit moving", "Teacher looking, chit moving|Chit still", "Passing the chit|Result",
  "Passing the chit|Paused", "Chit still|Paused", "Ready|Paused", "Paused|Back, a breath first", "Back, a breath first|Chit still",
  "Passing the chit|Away, class frozen", "Away, class frozen|Paused", "Away, class frozen|Back, a breath first",
  "Paused|Level list, class frozen", "Passing the chit|Level list, class frozen", "Level list, class frozen|Ready", "Level list, class frozen|Back, a breath first",
  "Result|Ready", "Result|Level list over the result", "Level list over the result|Ready",
  "Passing the chit|Friend's link waiting", "Friend's link waiting|Title", "Passing the chit|Title", "Result|Title",
  "Chit still|Friend's link waiting", "Teacher looking, chit moving|Friend's link waiting",
]);
export const step = (action: string, from: any, to: any) => {
  const a = state(from), b = state(to);
  return a === b || kept.has(`${a}|${b}`) ? labels[action] ?? action : null;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.paused || v.sheet ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
