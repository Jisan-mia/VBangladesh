export const title = "Ghontar sur (bells): run, pause, the level list and links";
export const state = (v: any) => {
  const away = !v.visible || !v.focused;
  if (v.phase === "over") return v.done === "won" ? "End screen: cleared" : "End screen: out of slips";
  if (v.phase === "ready") return "Title: the big bell";
  if (v.sheet) return "Level list open (paused)";
  if (v.why === "away") return "Paused (menu or cover)";
  const base: Record<string, string> = {
    lead: "Quiet before the call", call: "The bells ring", answer: "Your turn", miss: "Right bell shown", cheer: v.done === "won" ? "Level cheer" : "Round cheer", encore: "The finale tune plays",
  };
  return base[v.phase] + (away ? ", you're away" : "");
};
const labels: Record<string, string> = {
  YouStart: "you tap the big bell",
  TheLeadEnds: "the call starts",
  TheCallEnds: "the call ends",
  YouFinishARound: "you play the round right",
  YouFinishTheLevel: "you play the last round right",
  YouSlip: "you ring a wrong bell",
  YouSlipTheThirdTime: "you ring a wrong bell the third time",
  TheCheerEnds: "the cheer ends",
  TheMissEnds: "the call plays again",
  TheEncoreEnds: "the tune ends",
  YouSkipTheEncore: "you tap to skip the tune",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheLevels: "you open সব লেভেল",
  YouOpenTheLevelsFromTheMenu: "you pick সব লেভেল in the menu",
  YouCloseTheLevels: "you close সব লেভেল",
  YouPickALevel: "you pick a level",
  YouPlayAgain: "you press আবার খেলো",
  YouRestart: "you press নতুন করে শুরু",
  AFriendsLinkOpens: "a friend's link opens",
};
// Hidden: picking a level and restarting (a reset every state has), friend links except from the title, and the steps that
// only change who is away (the chart shows how you get away by leaving, and back by চালিয়ে যাও).
export const step = (action: string, from: any, to: any) => {
  if (["YouPickALevel", "YouRestart"].includes(action)) return null;
  if (action === "AFriendsLinkOpens" && from.phase !== "ready") return null;
  if (["WindowFocuses", "TabShows"].includes(action) && state(from).replace(", you're away", "") === state(to).replace(", you're away", "")) return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.sheet || v.why !== "none" ? "held" : v.phase === "ready" ? "start" : "play";
export const colors = { start: "teal", play: "teal", held: "yellow", done: "blue" };
