// The page around a round: which screen shows, which beat the round is in (the look, dialling, the rest between pieces, the ring),
// the player's pause, going away and coming back, the kids' rest screen, and which keys count. Pure and mutable, so the
// statechart's bug paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/ammur-number/AmmurNumber.tla.
// The beats that run on a timer (the look, the rest, the ring) are only ever started while nobody is away: the component
// cancels them on pause or blur and starts the beat again from its first digit when the player is back.

export type Screen = "title" | "play" | "end" | "levels";
/** look: the digits play and light. dial: the child dials. rest: a piece is done, the next comes. ring: the whole number is dialled. */
export type Phase = "look" | "dial" | "rest" | "ring";

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "end";
  paused: boolean;
  away: boolean;
  /** The first tap after coming back only wakes the game; it never dials. */
  swallow: boolean;
  phase: Phase;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** The kids' daily limit passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** When the end screen appeared; its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, phase: "dial", serial: 0, recorded: 0, resting: false, endAt: 0 });

/** Nobody is looking: the player's menu is open, or the window or tab is away. */
export const held = (s: Session) => s.paused || s.away;
/** The rest screen covers the stage at a break only: never over a round. */
export const restShows = (s: Session) => s.resting && s.screen !== "play";
/** Is the child's hand free to act on the pad? */
const handFree = (s: Session) => s.screen === "play" && s.phase === "dial" && !s.paused && !restShows(s);

/**
 * খেলো, আবার খেলো or a level from the list. Opening a round is a break too: past today's limit (`over`, from atBreak()) the
 * round doesn't start and the rest screen shows instead. `looks`: the first piece opens with the look.
 * Returns true when the round starts.
 */
export function begin(s: Session, over: boolean, looks: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = "play"; s.serial += 1; s.swallow = false; s.phase = looks ? "look" : "dial";
  return true;
}

/** The look finished (its last light went out) while nobody was away: now the child dials. */
export function lookDone(s: Session): boolean {
  if (s.screen !== "play" || s.phase !== "look" || held(s)) return false;
  s.phase = "dial";
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** A finger or key on a digit. Only while dialling, with nothing covering the game. The tap back from away only wakes it. */
export function tapKey(s: Session): Tap {
  if (!handFree(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

/**
 * The eye key: only while dialling (a look already playing is not asked for again, which is what a double tap or a held Enter
 * would do). It starts the look again. Returns the same answers as a digit.
 */
export function askLook(s: Session): Tap {
  const tap = tapKey(s);
  if (tap === "counts") s.phase = "look";
  return tap;
}

/**
 * A digit went in. A finished piece rests; the whole number rings. The ring ends the round at this very tap: its stars are saved
 * and the limit is checked (`over`, from atBreak()) now, not when the end screen comes, so nothing a quick hand does next can
 * lose them. Returns true when the caller must record the round.
 */
export function dialled(s: Session, event: "right" | "piece" | "end", over: boolean): boolean {
  if (event === "piece") s.phase = "rest";
  if (event !== "end") return false;
  s.phase = "ring"; s.recorded = s.serial; s.resting = over;
  return true;
}

/** The rest between pieces is over (nobody away): the next, longer piece starts, with its look or straight to dialling. */
export function restDone(s: Session, looks: boolean): boolean {
  if (s.screen !== "play" || s.phase !== "rest" || held(s)) return false;
  s.phase = looks ? "look" : "dial";
  return true;
}

/** The ring's wait is over (nobody away): the end screen. */
export function ringDone(s: Session, now: number): boolean {
  if (s.screen !== "play" || s.phase !== "ring" || held(s)) return false;
  s.screen = "end"; s.endAt = now;
  return true;
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }
/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "play" && s.phase === "dial") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last digit. */
export function toTitle(s: Session) { s.screen = "title"; s.paused = false; s.swallow = false; s.phase = "dial"; }
/**
 * The level list: a choice screen, nothing runs under it. The game's own buttons open it from the title and the end screen only;
 * the player's pause menu (সব লেভেল) can open it mid-round, which leaves that round, and the list then goes back to the title.
 */
export function openLevels(s: Session) {
  if (s.screen === "levels") return;
  s.back = s.screen === "end" ? "end" : "title"; s.screen = "levels"; s.paused = false; s.swallow = false;
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }
/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** A key on the end screen counts only as a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "end" && !repeat && timeStamp > s.endAt;
