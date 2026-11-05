// The page around a level: which screen shows, the player's pause, going away and coming back, the run and who may stop it,
// the story, the kids' rest screen, and which keys count. Pure and mutable, so the statechart's bug paths replay in node tests
// (tests/session.test.ts); the component forwards events here and obeys. Spec: ai_docs/statecharts/mongole-rover/Rover.tla.
// The run's own clock is lib/run.hot.ts; this file only decides what a tap or a key means.

export type Screen = "title" | "story" | "plan" | "run" | "won" | "levels";

/** After চালাও, a tap on থামাও is ignored for this long: a quick second tap (or a held Enter) never cancels the run before it moves. */
export const STOP_GUARD_MS = 450;

export type Session = {
  screen: Screen;
  /** Where the level list goes back to. */
  back: "title" | "won";
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first tap after coming back only wakes the game; it never adds a block, runs or stops. */
  swallow: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but a run. */
  resting: boolean;
  /** The run on screen has lifted its last rock: stars are saved, only the end screen waits. */
  solved: boolean;
  /** Which level attempt is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the run started and the end screen appeared. */
  runAt: number;
  endAt: number;
  /** How many runs started this level, for the method line. */
  runs: number;
  /** The rover has made its first move this run: থামাও means something only from here on. */
  moved: boolean;
};

export const createSession = (): Session =>
  ({ screen: "title", back: "title", paused: false, away: false, swallow: false, resting: false, solved: false, serial: 0, recorded: 0, runAt: 0, endAt: 0, runs: 0, moved: false });

/** The rest screen covers the stage at every break: never over the rover driving. */
export const restShows = (s: Session) => s.resting && s.screen !== "run";

/**
 * True while the run's clock may move: on the run screen, with the menu closed and the child here. (A run that lifted its
 * last rock past today's limit still plays its closing beat; the rest screen waits for the end screen.)
 */
export const live = (s: Session) => s.screen === "run" && !s.paused && !s.away;

/** A level opens: খেলো, আবার খেলো, পরের লেভেল, or a card in the list. Past today's limit (`over`) nothing starts and the rest screen shows. */
export function begin(s: Session, over: boolean, story = false): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = story ? "story" : "plan"; s.serial += 1; s.solved = false; s.swallow = false; s.runs = 0;
  return true;
}

/** The last story panel, or the hold to skip: the level starts. */
export function storyDone(s: Session): boolean {
  if (s.screen !== "story" || s.paused) return false;
  s.screen = "plan"; s.swallow = false;
  return true;
}

export type Tap = "ignored" | "woke" | "counts";
/** An arrow, ⌫, আরেক বার or a block on the plan: only while planning with nothing covering. */
export function tapEdit(s: Session): Tap {
  if (s.screen !== "plan" || s.paused || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  return "counts";
}

export type Go = "ignored" | "woke" | "empty" | "run";
/** চালাও. An empty plan only shows a note; otherwise the run starts at `now` (an event time). */
export function tapGo(s: Session, now: number, empty: boolean): Go {
  if (s.screen !== "plan" || s.paused || restShows(s)) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  if (empty) return "empty";
  s.screen = "run"; s.runAt = now; s.solved = false; s.moved = false; s.runs += 1;
  return "run";
}

export type Stop = "ignored" | "woke" | "stopped";
/** The rover's step arrived (the run's clock only ticks while live, so this never happens away or under the menu). */
export function stepped(s: Session) { if (s.screen === "run") s.moved = true; }

/**
 * থামাও: its own button, never within STOP_GUARD_MS of চালাও, never before the rover has moved (wall time keeps passing
 * while the clock is held, so the guard alone isn't enough), never once the last rock is lifted.
 */
export function tapStop(s: Session, now: number): Stop {
  if (s.screen !== "run" || s.paused || s.resting || s.solved) return "ignored";
  if (!s.moved || now - s.runAt < STOP_GUARD_MS) return "ignored";
  if (s.swallow) { s.swallow = false; return "woke"; }
  s.screen = "plan";
  return "stopped";
}

/**
 * The last rock is lifted. The stars are saved and the limit is checked at this moment, never in a later timer or the end
 * screen, so nothing a quick hand does next can lose them. Returns true when the caller must record.
 */
export function lifted(s: Session, over: boolean): boolean {
  if (s.screen !== "run" || s.solved) return false;
  s.solved = true; s.recorded = s.serial; s.resting = over;
  return true;
}

/** The run's clock ended on a win: the end screen shows. */
export function showWon(s: Session, now: number): boolean {
  if (s.screen !== "run" || !s.solved) return false;
  s.screen = "won"; s.endAt = now;
  return true;
}

/** The run's clock ended on a miss: back to planning, and a break (`over` from atBreak()). */
export function missed(s: Session, over: boolean): boolean {
  if (s.screen !== "run" || s.solved) return false;
  s.screen = "plan"; s.resting = over; s.swallow = false;
  return true;
}

/** The player's menu opened (⏸, P, Escape, blur or hide). */
export function pause(s: Session) { s.paused = true; }
/** চালিয়ে যাও: the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.swallow = false; }

/** Window blur or tab hide. The first tap back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === "plan" || s.screen === "run") s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A solved level was already recorded at its last rock. */
export function toTitle(s: Session) { s.screen = "title"; s.solved = false; s.paused = false; s.swallow = false; }
/** The level list: a choice screen, nothing runs under it. It opens from anywhere (the pause menu's সব লেভেল too). */
export function openLevels(s: Session) {
  if (s.screen === "levels") return;
  s.back = s.screen === "won" ? "won" : "title";
  s.screen = "levels"; s.paused = false; s.solved = false; s.swallow = false;
}
export function closeLevels(s: Session) { if (s.screen === "levels") s.screen = s.back; }

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === "won" && !repeat && timeStamp > s.endAt;
