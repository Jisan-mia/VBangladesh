// The round's clock, run every fixed step (60 a second) while the page is playing. Allocation-free: it moves numbers on the Run and
// pushes event codes for the page to read. A paused, blurred or hidden page simply stops calling this, so nothing finishes by itself.
import { ASK_MS, EV, HOLD_MS, IDLE_MS, ST, push, type Run } from "./sim";

export function advance(run: Run, ms: number) {
  if (run.stage === ST.DONE) {
    run.holdT += ms;
    if (!run.over && !run.ready && run.holdT >= HOLD_MS) { run.ready = true; push(run, EV.READY); }
  } else if (run.stage === ST.ASK && !run.askReady) {
    run.holdT += ms;
    if (run.holdT >= ASK_MS) { run.askReady = true; push(run, EV.READY); }
  }
  if (run.over && !run.ended) {
    run.endT -= ms;
    if (run.endT <= 0) { run.ended = true; push(run, EV.CARD); }
  }
  if (!run.over && (run.stage === ST.BALANCE || (run.stage === ST.ASK && run.askReady))) {
    const before = run.idleT;
    run.idleT += ms;
    if (before < IDLE_MS && run.idleT >= IDLE_MS) push(run, EV.IDLE);
  }
}
