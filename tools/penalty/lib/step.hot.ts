// The match clock, one fixed step at a time: the power meter, the shot clock, their whistle and run-up, the flight, the roll,
// then the next kick or the end. Allocation-free. The Over stage is terminal: once a match is decided no step changes it,
// however many steps a slow frame runs before React draws the card (the old double-whistle bug).
import { land, next, scuff, theirKick, pace, Ev, Stage, AFTER, DRILL_AFTER, METER_PERIOD, READY, RUN, type Game } from "./game";
import { BALL_R } from "./swipe";

const TAU = Math.PI * 2;
const ease = (t: number) => 1 - (1 - t) * (1 - t);
const clamp01 = (t: number) => t < 0 ? 0 : t > 1 ? 1 : t;

/** Advance the match by `dt` real seconds. */
export function stepGame(g: Game, dt: number) {
  if (g.stage === Stage.Over) return;
  const k = pace(g);
  g.clock += dt;
  g.played += dt;
  switch (g.stage) {
    case Stage.Aim: {
      g.t += dt * k;
      if (g.meter) g.power = 0.1 + 0.9 * (0.5 - 0.5 * Math.cos((TAU * (g.clock - g.meterFrom) * k) / METER_PERIOD));
      if (g.data.clock > 0) {
        const before = g.shotLeft;
        g.shotLeft -= dt * k;
        if (g.shotLeft < 3 && Math.ceil(g.shotLeft) < Math.ceil(before) && g.shotLeft > 0) g.events |= Ev.Tick;
        if (g.shotLeft <= 0) { g.shotLeft = 0; scuff(g); }
      }
      return;
    }
    case Stage.Ready:
      g.t += dt * k;
      if (g.t >= READY) { g.stage = Stage.Run; g.t = 0; g.events |= Ev.RunUp; }
      return;
    case Stage.Run:
      g.t += dt * k;
      if (g.t >= RUN) theirKick(g);
      return;
    case Stage.Fly: {
      // Hit-stop: the ball sits on the boot for a moment when struck.
      if (g.hold > 0) { g.hold -= dt; return; }
      g.t += dt * k;
      const p = clamp01(g.t / g.flyTime), q = 1 - p;
      g.ballX = q * q * g.fromX + 2 * q * p * g.ctrlX + p * p * g.toX;
      g.ballY = q * q * g.fromY + 2 * q * p * g.ctrlY + p * p * g.toY;
      g.ballR = BALL_R - (BALL_R - 5.5) * p;
      if (!g.calm) g.spin += dt * 14;
      if (p >= 1) land(g);
      return;
    }
    case Stage.After: {
      g.t += dt * k;
      const p = ease(clamp01(g.t / 0.45));
      g.ballX = g.toX + (g.endX - g.toX) * p;
      g.ballY = g.toY + (g.endY - g.toY) * p;
      if (g.t >= (g.data.format === "shootout" ? AFTER : DRILL_AFTER)) next(g);
      return;
    }
  }
}
