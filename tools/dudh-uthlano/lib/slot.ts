// One pending timer that can be replaced or cancelled: the confetti after a card, the doorbell banner. Taking the clock as an
// argument keeps it testable in node. A new round, a pause and unmount all cancel, so a celebration never lands on another round.
export type Clock = { set: (run: () => void, ms: number) => number; clear: (id: number) => void };

export function createSlot(clock: Clock) {
  let id = 0;
  const cancel = () => { if (id) { clock.clear(id); id = 0; } };
  return {
    /** Replaces whatever was pending. */
    schedule(run: () => void, ms: number) { cancel(); id = clock.set(() => { id = 0; run(); }, ms); },
    cancel,
    pending: () => id !== 0,
  };
}
export type Slot = ReturnType<typeof createSlot>;

export const windowClock: Clock = { set: (run, ms) => window.setTimeout(run, ms), clear: id => window.clearTimeout(id) };
