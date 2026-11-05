// The page around a round: which screen shows, the player's pause, going away and coming back, an item solved and waiting for ▶,
// the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component forwards events here and obeys. Spec: ai_docs/statecharts/ghori-dekhi/Ghori.tla.

export type Screen = "title" | "play" | "end" | "levels";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never turns a hand or picks a card. */
  swallow: boolean;
  /** The item is right and ▶ is waiting. `last` says it was the round's last item. */
  solved: boolean;
  last: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event times: ▶ and the end screen's keys count only from a fresh press after these. */
  solvedAt: number;
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, solved: false, last: false, resting: false, serial: 0, recorded: 0, solvedAt: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over an item. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.solved = false; s.last = false; s.swallow = false;
  return true;
}

export type Touch = "ignored" | "woke" | "counts";
/** A finger or key on the clock, ✓ or a card. Only on the play screen with nothing covering it and the item still open. */
export function touch(s: Session): Touch {
  if (s.screen !== "play" || s.paused || s.solved || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * An item is right. On the round's last item the stars are saved and the limit is checked at this very tap (`over`, from atBreak()),
 * not when ▶ is pressed, so nothing a quick hand does next can lose them. Returns true when the caller must record the round.
 */
export function solve(s: Session, last: boolean, over: boolean, now: number): boolean {
  s.solved = true; s.last = last; s.solvedAt = now;
  if (!last) return false;
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

export type Advance = "no" | "next" | "end";
/** ▶ (by finger, or a key press that began after the item was solved and isn't a repeat). The last item's ▶ opens the end screen, once. */
export function advance(s: Session, key?: { timeStamp: number; repeat: boolean }): Advance {
  if (s.screen !== "play" || s.paused || !s.solved || restShows(s)) return "no";
  if (key && (key.repeat || key.timeStamp <= s.solvedAt)) return "no";
  s.solved = false;
  if (s.last) { s.screen = "end"; s.endAt = key?.timeStamp ?? s.solvedAt; return "end"; }
  return "next";
}

/** The end screen's keys: only a fresh press that began after it appeared, never a held or repeating one. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last ✓. */
export function toTitle(s: Session) { s.screen = "title"; s.solved = false; s.last = false; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. From the title or the end screen it goes back there; from the player's menu mid-round the round is left and it goes back to the title. */
export function openLevels(s: Session) {
  if (s.screen === "title" || s.screen === "end") { s.back = s.screen; s.screen = "levels"; }
  else if (s.screen === "play") { s.back = "title"; s.screen = "levels"; s.solved = false; s.last = false; s.swallow = false; }
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }
