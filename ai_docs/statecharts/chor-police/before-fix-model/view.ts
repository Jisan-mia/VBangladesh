export const title = "চোর-ডাকাত-পুলিশ-বাবু: the evening, the chit, the drum and the window";
const game = (v: any) => {
  const drum = v.drum && v.phase !== "guess" ? ", drum still beating" : "";
  if (v.phase === "setup") return (v.rounds === 0 ? "Setting up" : v.ended ? "Paused, though the evening had ended" : "Paused mid-evening") + drum;
  if (v.phase === "peek") return v.chit === "plate" ? "Picking a chit" : v.chit === "open" ? "Chit open" : "Chit folded in hand";
  if (v.phase === "guess") return v.rolling ? "Drumroll" : "Police choosing";
  if (v.phase === "over") return v.fresh ? "Scorecard just appeared" : "Scorecard";
  return ({ pass: "Phone handed on", call: "Everyone has looked", reveal: "Chits open, round scored" } as any)[v.phase] + drum;
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.here === "page" ? "On the page" : "Away (other window or tab)",
  Scores: v.skipped ? "Scorecard skipped by a stray tap" : "Scorecard kept",
});
const steps: Record<string, string | null> = {
  YouStart: "you press চিরকুট তোলো",
  YouTakePhone: "the next player takes the phone",
  YouPickChit: "you pick a chit",
  YouHoldChit: "you hold the chit open",
  YouLetGo: "you let go",
  YouFold: "you press দেখেছি",
  YouCall: "you press বাবু-পুলিশ কে, দেখাও",
  PoliceAccuses: "the police names someone",
  ChitsOpen: "the drumroll ends and the chits open",
  DrumFades: "the last drum beat fades",
  ScreenSettles: "half a second passes",
  YouNext: "you press আরেক দান / ফল দেখো",
  YouEndHere: "you press এখানেই শেষ করো",
  YouPlayMore: "you press আরও ৫ দান খেলো",
  YouPressAgain: "you press Enter again / আরেকবার",
  YouPause: "you press থামাও",
  YouReset: null,
  YouLookAway: "you look away (other window or tab)",
  YouComeBack: "you come back",
  YouReload: "you reload the page",
};
export const step = (action: string, from: any) => {
  // Shown only where they matter: পাজ from the drumroll, the reload from the scorecard.
  if (action === "YouPause" && !from.rolling) return null;
  if (action === "YouReload" && from.phase !== "over") return null;
  return action in steps ? steps[action] : action;
};
// The chart hides নতুন খেলা everywhere, থামাও except during the drumroll, and the reload except on the scorecard; the model and the report keep them.
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "setup" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
