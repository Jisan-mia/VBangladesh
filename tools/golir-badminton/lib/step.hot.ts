// The per-step rules: runs 60 times a second on a cheap phone, so it mutates the match in place and allocates nothing.
// The shuttle walks along its precomputed path; points are decided when it lands; the rival swings when it reaches them.
import { DT } from "./physics";
import {
  atRival, emit, point, release, serveNow,
  DONE, E_NET, FLY, GAP, GAP_TIME, HIGH, HOLD_MAX, R_BEAT, R_MISS, R_REACH, R_RIVAL_NET, R_RIVAL_OUT, R_WHIFF, R_YOU_NET, R_YOU_OUT, WHIFF,
  type Match,
} from "./match";

/** How fast you run to the shuttle (units a second). You always get there. */
const YOU_RUN = 900;

/** One game step (DT seconds). */
export function advance(m: Match) {
  m.clock += DT;
  let gap = m.youTo - m.youX, most = YOU_RUN * DT;
  m.youX += gap > most ? most : gap < -most ? -most : gap;
  if (m.clock >= m.rivalGo) {
    gap = m.rivalTo - m.rivalX; most = m.def.run * DT;
    m.rivalX += gap > most ? most : gap < -most ? -most : gap;
  }
  if (m.phase === DONE) return;
  if (m.phase === GAP) {
    m.t += DT;
    if (m.t >= GAP_TIME) serveNow(m);
    return;
  }
  if (m.phase !== FLY) return;
  const p = m.path;
  // A finger is on it: the shuttle stays on the racket until the touch says tap or pull (a short hit-stop).
  if (m.pressAt >= 0) {
    if (++m.hold >= HOLD_MAX) release(m, HIGH);
    return;
  }
  m.i++;
  if (m.i === p.netAt) emit(m, E_NET, p.from);
  if (p.from === 1) {
    if (!m.swung && !m.past && p.contactAt >= 0 && (m.i - p.contactAt) * DT > m.win) m.past = true;
    if (m.i >= p.landAt) {
      if (p.netAt >= 0) point(m, 0, R_RIVAL_NET);
      else if (p.out) point(m, 0, R_RIVAL_OUT);
      else point(m, 1, m.swung && m.grade === WHIFF ? R_WHIFF : R_MISS);
    }
    return;
  }
  if (p.netAt >= 0 || p.out) {
    if (m.i >= p.landAt) point(m, 1, p.netAt >= 0 ? R_YOU_NET : R_YOU_OUT);
    return;
  }
  if (m.i === p.contactAt && m.goes) { atRival(m); return; }
  if (m.i >= p.landAt) point(m, 0, m.fail === R_BEAT ? R_BEAT : R_REACH);
}
