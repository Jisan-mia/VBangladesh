// Which sounds a screen change plays, decided purely from the before and after states, so the tests can check that
// the drum stops with its round and the fanfare plays once per scorecard. The component only plays what this returns.
import { CHOR, dealFor, type Play } from "./game";

export type Cue =
  /** The signature: a brass-plate ঠুং as the evening starts. */
  | "clink"
  /** A chit is picked or folded; the same rustle for every role. */
  | "rustle"
  /** The বাবু and পুলিশ chits open on the table. */
  | "flips"
  /** The police named someone. */
  | "drum"
  /** Cut every note still scheduled (the drum's later beats): the round it belonged to is gone. */
  | "hush"
  | "caught" | "missed"
  | "fanfare";

export function cues(before: Play, after: Play): Cue[] {
  if (before.phase === after.phase && before.turn === after.turn && before.game.caught.length === after.game.caught.length) return [];
  const out: Cue[] = [];
  if (before.phase === "roll" && after.phase !== "reveal") out.push("hush");
  if (before.phase !== "roll" && before.phase !== "setup" && before.phase !== "over" && after.phase === "setup") out.push("hush");
  switch (after.phase) {
    case "pass": if (before.phase === "setup" || before.phase === "over") out.push("clink"); else if (before.phase === "peek") out.push("rustle"); break;
    case "peek": out.push("rustle"); break;
    case "call": if (before.phase === "peek") out.push("rustle"); break;
    case "guess": out.push("flips"); break;
    case "roll": out.push("drum"); break;
    case "reveal": {
      const roles = dealFor(after.game.seed, after.game.caught.length - 1);
      out.push(roles[after.accused] === CHOR ? "caught" : "missed");
      break;
    }
    case "over": out.push("fanfare"); break;
  }
  return out;
}
