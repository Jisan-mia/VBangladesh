export const title = "Chor-Dakat-Police-Babu (after the rewrite): the evening, the chit, the drum and the pause menu";
const game = (v: any) => {
  const drum = v.drum && v.phase !== "roll" ? ", drum still beating" : "";
  if (v.phase === "setup") return (v.rounds === 0 ? "Title screen" : v.ended ? "Paused, though the evening had ended" : "Evening waiting to continue") + drum;
  if (v.phase === "peek") return v.chit === "open" ? "Chit open" : "Chit in hand";
  if (v.phase === "roll") return v.drum ? "Drumroll" : "Drumroll, silent";
  if (v.phase === "over") return "Scorecard";
  return ({ pass: "Phone handed on", call: "Everyone has looked", guess: "Police choosing", reveal: "Chits open, round scored" } as any)[v.phase] + drum;
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.menu ? (v.here === "page" ? "Pause menu" : "Away, game paused") : v.here === "page" ? "Playing" : "Away, still running",
  Scores: v.skipped ? "Scorecard skipped by a stray tap" : "Scorecard kept",
});
const steps: Record<string, string | null> = {
  YouStart: "you tap the থালা",
  YouPickChit: "the next player taps a chit",
  YouHoldChit: "you hold the chit open",
  YouLetGo: "you let go",
  YouFold: "you press দেখেছি",
  YouCall: "you press বাবু-পুলিশ, চিরকুট খোলো",
  PoliceAccuses: "the police names someone",
  ChitsOpen: "the drumroll ends and the chits open",
  ScreenSettles: "half a second passes",
  YouNext: "you press আরেক দান / ফল দেখো",
  YouEndHere: "you press এখানেই শেষ করো",
  YouPlayMore: "you press আরও ৫ দান",
  YouPressAgain: "you press আরেক সন্ধ্যা",
  YouPause: "you press ⏸ or Escape",
  YouLookAway: "you look away (other window or tab)",
  YouComeBack: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: null,
  YouReload: "you reload the page",
};
export const step = (action: string, from: any) => {
  // Shown only where they matter: the pause from the drumroll and the chit, the reload from the scorecard.
  if ((action === "YouPause" || action === "YouLookAway") && from.phase !== "roll" && from.phase !== "peek") return null;
  if (action === "YouReload" && from.phase !== "over") return null;
  return action in steps ? steps[action] : action;
};
// The chart hides the tap guard and নতুন করে শুরু everywhere, the pause except from the drum and the chit, and the
// reload except from the scorecard; the model and the report keep them all.
export const group = (v: any) => v.menu ? "held" : v.phase === "over" ? "done" : v.phase === "setup" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
