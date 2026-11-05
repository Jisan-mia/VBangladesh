// The page around a round: which screen shows, the player's pause, going away and coming back, the one timer that moves the
// round to its end screen, the kids' rest screen, the picture list, and which keys count. Pure and mutable, so the
// statechart's bug paths replay in node tests (tests/session.test.ts); the component forwards events here and obeys.
// Spec: ai_docs/statecharts/sat-tukro/SatTukro.tla.

export type Screen = 'title' | 'play' | 'end' | 'levels';
/** The cheer after the last piece: then the end screen. */
export type Pending = 'none' | 'end';

export type Session = {
  screen: Screen;
  /** Where the picture list goes back to. From play it keeps the half-built picture. */
  back: 'title' | 'end' | 'play';
  /** The player's pause menu is open. */
  paused: boolean;
  /** The window is blurred or the tab hidden. */
  away: boolean;
  /** The first press after coming back only wakes the game; it never picks, drops or turns a piece. */
  swallow: boolean;
  pending: Pending;
  /** The cheer timer was stopped by a pause and waits for চালিয়ে যাও. */
  frozen: boolean;
  /** The kids' daily limit has passed at a break: the rest screen shows on every screen but play. */
  resting: boolean;
  /** Which round is on screen, and the last one whose stars were saved and limit checked. */
  serial: number;
  recorded: number;
  /** Event time the end screen appeared: its keys count only from a fresh press after it. */
  endAt: number;
};

export const createSession = (): Session =>
  ({ screen: 'title', back: 'title', paused: false, away: false, swallow: false, pending: 'none', frozen: false, resting: false, serial: 0, recorded: 0, endAt: 0 });

/** The rest screen covers the stage at a break only: never over a half-built picture. */
export const restShows = (s: Session) => s.resting && s.screen !== 'play';
/** The cheer timer may run only while nothing covers the game. */
export const timerMayRun = (s: Session) => s.pending !== 'none' && !s.paused && !s.frozen;
/** Time to light the hint for a child who has gone quiet: only while a picture is being built and nothing covers it. */
export const hintMayShow = (s: Session) => s.screen === 'play' && s.pending === 'none' && !s.paused && !s.away && !restShows(s);

/**
 * খেলো, আবার খেলো or a picture from the list. Opening a round is a break too: past today's limit (`over`, from atBreak())
 * the round doesn't start and the rest screen shows instead. Returns true when the round starts.
 */
export function begin(s: Session, over: boolean): boolean {
  s.resting = over;
  if (over || s.paused) return false;
  s.screen = 'play'; s.serial += 1; s.pending = 'none'; s.frozen = false; s.swallow = false;
  return true;
}

export type Press = 'ignored' | 'woke' | 'counts';
/** A finger or key on the table. Only on the play screen, with nothing covering it and the picture not yet done. */
export function pressTable(s: Session): Press {
  if (s.screen !== 'play' || s.paused || s.pending !== 'none' || restShows(s)) return 'ignored';
  if (s.swallow) { s.swallow = false; return 'woke'; }
  return 'counts';
}

/**
 * The last piece. The picture is finished at this very drop: its stars are saved and the limit is checked (`over`, from
 * atBreak()) now, not when the end screen comes, so nothing a quick hand does next can lose them. Only the cheer waits.
 * Returns true when the caller must record the round.
 */
export function finished(s: Session, over: boolean): boolean {
  if (s.screen !== 'play' || s.pending !== 'none') return false;
  s.pending = 'end';
  s.recorded = s.serial;
  s.resting = over;
  return true;
}

/** The cheer timer fires. */
export function timerFires(s: Session, now: number) {
  if (!timerMayRun(s)) return;
  s.screen = 'end'; s.endAt = now; s.pending = 'none';
}

/** The player's menu opened (⏸, P, Escape, blur or hide): the cheer timer freezes where it is. */
export function pause(s: Session) {
  s.paused = true;
  if (s.pending !== 'none') s.frozen = true;
}
/** চালিয়ে যাও: the timer runs again (the component gives it a short breath), and the hand is fresh. */
export function resume(s: Session) { s.paused = false; s.frozen = false; s.swallow = false; }

/** Window blur or tab hide. The first press back is swallowed unless the player's menu takes it. */
export function blur(s: Session) { s.away = true; if (s.screen === 'play') s.swallow = true; }
export function focus(s: Session) { s.away = false; }

/** নতুন করে শুরু, or শেষ: back to the title. A finished round was already recorded at its last drop. */
export function toTitle(s: Session) { s.screen = 'title'; s.pending = 'none'; s.frozen = false; s.paused = false; s.swallow = false; }

/**
 * The picture list: a choice screen, nothing runs under it. Opened mid-picture it keeps the half-built picture and goes back
 * to it; opened during the cheer it first lets the end screen come (the picture is done, its stars already saved).
 */
export function openLevels(s: Session, now: number) {
  if (s.screen === 'play' && s.pending !== 'none') { s.screen = 'end'; s.endAt = now; s.pending = 'none'; s.frozen = false; }
  if (s.screen === 'title' || s.screen === 'end' || s.screen === 'play') { s.back = s.screen; s.screen = 'levels'; }
}
/** ফিরে যাও: nothing changed. */
export function closeLevels(s: Session) { if (s.screen === 'levels') { s.screen = s.back; s.swallow = false; } }
/** A cell in the list: the picture being built picks 'resume' (the same picture, pieces kept); anything else starts a round. */
export const pickFromList = (s: Session, samePicture: boolean): 'resume' | 'begin' => s.back === 'play' && samePicture ? 'resume' : 'begin';

/** A grown-up gave more time on the rest screen. */
export function extend(s: Session) { s.resting = false; }

/** Result-screen keys need a fresh press that started after the screen appeared, never a held or repeating key. */
export const freshKey = (s: Session, timeStamp: number, repeat: boolean) => s.screen === 'end' && !repeat && timeStamp > s.endAt;
