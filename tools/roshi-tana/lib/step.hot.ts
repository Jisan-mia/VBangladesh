// The per-step rules: runs every frame on a cheap phone, so it mutates the match in place and allocates nothing.
// With every new feature off (the old ladder) this is the old rope.ts update() exactly, so old links replay the same.
import { beatTime, kindOf, pull, rivalWeight, DAMP, HEAVE, KIND, PULL, REST, STEP, MAX_BEATS, type Match } from "./match";

/** A missed beat on a slick (dewy) field slips this share of a tap slip. */
const SLICK_MISS = 0.5;

/** Moves the match clock to `t`: the bot pulls on its beats, unpulled beats break combos, heaves land, the rope slides, and the match may end. */
export function advance(m: Match, t: number) {
  if (m.winner !== null) return;
  const def = m.def, late = m.win.late, you = m.sides[0];
  if (m.now < 0 && t >= 0) m.now = 0;
  // The slide is integrated exactly, so a long frame on a slow phone moves the rope just as far as many short ones.
  const dt = Math.max(0, (t - m.now) / 1000);
  m.now = t;

  while (m.bot && beatTime(m, m.botNext) <= t) {
    const k = m.botNext, kind = kindOf(m, k);
    if ((kind & KIND) !== REST) {
      const roll = m.rng(), weight = rivalWeight(m);
      // The team pulls a beat it hits; a beat it misses breaks its combo.
      if (roll < def.perfect) pull(m, 1, "perfect", weight);
      else if (roll < def.perfect + def.good) pull(m, 1, "good", weight);
      else m.sides[1].combo = 0;
      if (kind & HEAVE && def.surge) {
        m.heaves++;
        // Already nailed (a tap right on it, a hair early): held before it lands.
        if (you.nailed === k) { m.held++; m.hold = 1; }
        else {
          const amount = PULL.perfect * weight * def.surge.power * STEP * DAMP;
          m.v -= amount; m.heave = 1; m.heaveBeat = k; m.heaveAmt = amount;
        }
      }
    }
    m.botNext++;
  }
  while (beatTime(m, m.closeNext) + late < t) {
    const beat = m.closeNext;
    if (beat >= m.playFrom) {
      const rest = (kindOf(m, beat) & KIND) === REST;
      m.beats++;
      for (let side = 0; side < (m.bot ? 1 : 2); side++) {
        const p = m.sides[side];
        if (p.claimed >= beat) continue;
        if (rest) { p.rested++; continue; }
        p.combo = 0; p.missed++;
        if (def.slick) m.v -= (side === 0 ? 1 : -1) * def.slip * STEP * DAMP * SLICK_MISS;
      }
      if (m.heaveBeat === beat) m.heaveBeat = -1;
    }
    m.closeNext++;
  }

  const decay = Math.exp(-DAMP * dt);
  m.x += m.v * (1 - decay) / DAMP;
  m.v *= decay;
  const ease = Math.exp(-5 * dt);
  m.sides[0].lean *= ease; m.sides[1].lean *= ease;
  m.heave *= ease; m.hold *= ease;

  if (m.x >= 1) { m.x = 1; m.winner = 0; }
  else if (m.x <= -1) { m.x = -1; m.winner = 1; }
  else if (m.beats >= MAX_BEATS) m.winner = m.x > 0.02 ? 0 : m.x < -0.02 ? 1 : -1;
  // Beats already struck whose windows are still open count too (the win usually lands on one).
  if (m.winner !== null && Math.abs(m.x) >= 1) for (let beat = Math.max(m.closeNext, m.playFrom); beatTime(m, beat) <= t; beat++) m.beats++;
}
