// The per-frame drawing: copy the pre-painted ground, then the crowd, the flag, the keeper, the kicker, the ball and its trail,
// the aim marks, the tells, the shot clock and the danger rim. Allocation-free: no literals, closures or string building in
// here; everything comes from the View and the Game.
import { footShown, keeperLean, kickRound, leanShown, runUp, Stage, type Game } from "./game";
import { DIVE, kickZone, Outcome, type Zone } from "./rules";
import { BALL_R, GTOP, GW, GX, GY, H, SPOT_X, SPOT_Y, W } from "./swipe";
import { drawArms, drawBall, drawClockBar, drawCrosshair, drawFan, drawFlag, drawFootMark, drawKeeper, drawKicker, drawMeter, drawPole, drawRipple, drawTrail } from "./scene";
import { BALL_TRAIL, type View } from "./view";
import { US } from "./levels";

const DASH: number[] = [6, 5];
const NO_DASH: number[] = [];
const ease = (t: number) => 1 - (1 - t) * (1 - t);
const clamp01 = (t: number) => t < 0 ? 0 : t > 1 ? 1 : t;

/** Decay the juice timers (call once per step). */
export function moveView(v: View, dt: number) {
  v.clock += dt;
  if (v.cheer > 0) v.cheer = Math.max(0, v.cheer - dt * 0.7); else if (v.cheer < 0) v.cheer = Math.min(0, v.cheer + dt * 0.9);
  if (v.ripple > 0) v.ripple = Math.max(0, v.ripple - dt * 1.4);
  if (v.wobble > 0) v.wobble = Math.max(0, v.wobble - dt * 2.2);
  if (v.flash > 0) v.flash = Math.max(0, v.flash - dt * 6);
  if (v.shake > 0) v.shake = Math.max(0, v.shake - dt);
  if (v.squash > 0) v.squash = Math.max(0, v.squash - dt * 5);
}

/** Remember where the ball is, for the motion trail. */
export function trackBall(v: View, g: Game) {
  if (g.stage !== Stage.Fly) { v.bcount = 0; return; }
  v.bhead = (v.bhead + 1) % BALL_TRAIL;
  v.bx[v.bhead] = g.ballX; v.by[v.bhead] = g.ballY;
  if (v.bcount < BALL_TRAIL) v.bcount++;
}

function drawCrowd(v: View, c: CanvasRenderingContext2D) {
  const shirts = v.palette.shirts, cheer = v.cheer, calm = v.calm;
  for (let i = 0; i < v.crowd; i++) {
    let lift = 0;
    if (cheer > 0) lift = calm ? cheer * 2 : cheer * (1.5 + 3.5 * Math.abs(Math.sin(v.clock * 13 + v.cp[i])));
    else if (cheer < 0) lift = cheer * 1.5;
    else if (!calm) lift = Math.sin(v.clock * 1.3 + v.cp[i]) * 0.4;
    drawFan(c, v.cx[i], v.cy[i], v.cr[i], shirts[v.cs[i]], lift, (i & 1) === 1);
    if (cheer > 0.35) drawArms(c, v.cx[i], v.cy[i], v.cr[i], lift);
  }
}

/** The keeper on screen this frame: hips x, lift, tilt and crouch. */
function drawKeeperNow(v: View, c: CanvasRenderingContext2D, g: Game) {
  const ours = g.side === 1, kit = ours ? US.keeperKit : g.data.team.keeperKit, size = !ours && g.data.keeper.tall ? 1.28 : 1;
  let zone = -1, progress = 0;
  if (g.stage === Stage.Fly || g.stage === Stage.After) {
    zone = g.result.keeper;
    if (ours && g.dive < 0) zone = -1;
    // Their keeper reacts a beat after the kick; ours goes as the ball is struck.
    const start = ours ? 0 : g.flyTime * 0.12;
    progress = g.stage === Stage.After ? 1 : g.hold > 0 ? 0 : ease(clamp01((g.t - start) / 0.28));
  }
  if (zone < 0) {
    const sway = v.calm ? 0 : Math.sin(v.clock * 1.8) * 3;
    let lean = 0, tilt = 0;
    if (ours && g.dive >= 0 && g.stage !== Stage.Fly && g.stage !== Stage.After) lean = (g.dive - 1) * 8;
    if (!ours) {
      // His tell: weight onto the side he means to dive.
      const shown = keeperLean(g), side = g.plans.keeper[kickRound(g)].lean;
      lean = side * 11 * shown; tilt = side * 0.2 * shown;
    }
    const hop = progress > 0 ? Math.sin(progress * Math.PI) * 8 : 0;
    drawKeeper(c, GX + sway * (1 - Math.abs(tilt) * 4) + lean, GY, tilt, hop, v.calm ? 0.5 : 0.5 + Math.sin(v.clock * 3) * 0.3, kit, size);
    return;
  }
  const kx = DIVE[zone][0], ky = DIVE[zone][1], side = zone === 0 ? -1 : zone === 2 ? 1 : 0;
  drawKeeper(c, GX + kx * GW * progress, GY, side * 1.2 * progress, (side ? ky * 70 : 14) * Math.sin(progress * Math.PI * 0.85), 0, kit, size);
}

function drawBallTrail(v: View, c: CanvasRenderingContext2D, r: number) {
  if (v.calm || v.bcount < 3) return;
  c.fillStyle = "#ffffff";
  for (let k = 1; k < v.bcount; k++) {
    const i = (v.bhead - k + BALL_TRAIL) % BALL_TRAIL;
    c.globalAlpha = 0.28 * (1 - k / v.bcount);
    c.beginPath(); c.arc(v.bx[i], v.by[i], r * (1 - k * 0.07), 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}

/** The whole frame. `hint`: the first-kick ghost swipe. */
export function drawFrame(v: View, g: Game, hint: boolean) {
  const c = v.context, background = v.background;
  if (!c || !background) return;
  c.save();
  c.setTransform(v.ratio, 0, 0, v.ratio, 0, 0);
  if (v.shake > 0 && !v.calm) c.translate(Math.sin(v.clock * 83) * v.shakeSize * v.shake * 8, Math.cos(v.clock * 71) * v.shakeSize * v.shake * 5);
  c.scale(v.scale, v.scale);
  c.translate(0, v.top);
  c.drawImage(background, 0, -v.top, W, H + v.top + v.bottom);
  drawCrowd(v, c);
  if (g.data.wind) drawFlag(c, g.plans.keeper[g.side === 0 ? kickRound(g) : g.tally.usTaken % g.plans.keeper.length].wind / g.data.wind, v.calm ? 0 : v.clock);
  if (v.ripple > 0) drawRipple(c, v.rippleX, v.rippleY, v.ripple);
  if (v.wobble > 0) {
    const off = v.calm ? 0 : Math.sin(v.clock * 55) * 2.2 * v.wobble;
    if (v.wobbleSide === 0) drawPole(c, GX - GW, GTOP + off, GX + GW, GTOP + off, v.palette.bamboo);
    else drawPole(c, GX + v.wobbleSide * GW + off, GY + 2, GX + v.wobbleSide * GW + off, GTOP - 3, v.palette.bamboo);
  }
  const flying = g.stage === Stage.Fly || g.stage === Stage.After;
  // A ball past the goal line sits behind the keeper; one still on its way is in front.
  const behind = flying && g.ballY < GY - 2 && (g.result.outcome === Outcome.Goal || g.result.outcome === Outcome.Over);
  const squash = g.stage === Stage.Aim ? v.squash : 0;
  if (behind) { drawBallTrail(v, c, g.ballR); drawBall(c, g.ballX, g.ballY, g.ballR, g.spin, 0); }
  drawKeeperNow(v, c, g);
  const swing = g.stage === Stage.Fly ? (g.hold > 0 ? 0.85 : clamp01(g.t / 0.12)) : g.stage === Stage.After ? 1 : 0;
  if (g.side === 1) {
    const plan = g.plans.shots[kickRound(g)], step = runUp(g), shown = leanShown(g);
    const zone: Zone = kickZone(g.level, plan, g.dive < 0 ? null : (g.dive as Zone), g.early);
    const foot = footShown(g) ? zone - 1 : 0;
    const watching = g.data.shooter.watch && g.stage === Stage.Run && shown < 1 ? 1 - shown : 0;
    if (!behind) { drawBallTrail(v, c, g.ballR); drawBall(c, g.ballX, g.ballY, g.ballR, g.spin, 0); }
    if (footShown(g) && g.stage === Stage.Run) drawFootMark(c, foot, Math.min(1, (step - 0.78) * 8));
    drawKicker(c, step, plan.lean * ease(shown), swing, g.data.team.kit, g.data.team.shorts, foot, watching);
    if (watching > 0) {
      // His eyes on you: a dashed sight line from his head to the keeper.
      const hx = SPOT_X - 56 + step * 32, hy = SPOT_Y + 40 - step * 10 - 51;
      c.setLineDash(DASH); c.strokeStyle = "#fff6c8"; c.globalAlpha = 0.85 * watching; c.lineWidth = 2.4; c.lineCap = "butt";
      c.beginPath(); c.moveTo(hx + 4, hy - 8); c.lineTo(GX + (g.dive >= 0 ? (g.dive - 1) * 8 : 0), GY - 34); c.stroke();
      c.setLineDash(NO_DASH);
      // Two bright eyes on the back of his turned head.
      c.fillStyle = "#ffffff"; c.beginPath(); c.arc(hx - 3, hy - 3, 1.8, 0, Math.PI * 2); c.arc(hx + 3, hy - 3, 1.8, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
  } else {
    drawKicker(c, 0.94, 0, swing, US.kit, US.shorts, 0, 0);
    if (!behind) { drawBallTrail(v, c, g.ballR); drawBall(c, g.ballX, g.ballY, g.ballR, g.spin, squash); }
    if (g.stage === Stage.Aim) {
      if (v.aim === 1) drawTrail(c, v.xs, v.ys, v.count);
      if (g.aimed || v.aim !== 0) drawCrosshair(c, g.aimX, g.aimY, v.palette.night ? "#ffd23f" : "#1f6f43");
      if (g.meter || v.aim === 1) drawMeter(c, g.meter ? g.power : v.swipePower);
      if (hint && v.aim === 0 && !v.calm) {
        // A ghost finger: from the ball up to the goal's corner, every 1.6 s.
        const p = (v.clock % 1.6) / 1.1;
        if (p < 1) {
          const q = ease(p), x = SPOT_X + (GX + GW * 0.62 - SPOT_X) * q, y = SPOT_Y + (GY - 50 - SPOT_Y) * q;
          c.globalAlpha = 0.85 * (1 - p); c.strokeStyle = "#ffffff"; c.lineWidth = 3; c.lineCap = "round";
          c.beginPath(); c.moveTo(SPOT_X, SPOT_Y); c.lineTo(x, y); c.stroke();
          c.fillStyle = "#ffffff"; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill();
          c.globalAlpha = 1;
        }
      }
    }
  }
  if (v.flash > 0) {
    c.strokeStyle = "#ffffff"; c.globalAlpha = v.flash; c.lineWidth = 3;
    c.beginPath(); c.arc(SPOT_X, SPOT_Y, BALL_R + 6 + (1 - v.flash) * 16, 0, Math.PI * 2); c.stroke();
    c.globalAlpha = 1;
  }
  const clockShare = g.data.clock && g.stage === Stage.Aim ? g.shotLeft / g.data.clock : 1;
  if (g.data.clock && g.side === 0 && g.stage === Stage.Aim) drawClockBar(c, clockShare, H + v.bottom);
  c.restore();
  // The danger rim, over everything, in screen space.
  const danger = (g.danger && (g.stage === Stage.Aim || g.stage === Stage.Ready || g.stage === Stage.Run)) || clockShare < 0.4;
  if (danger && v.danger && v.look === 1) {
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = v.calm ? 0.6 : 0.45 + 0.3 * Math.sin(v.clock * 6);
    c.drawImage(v.danger, 0, 0);
    c.restore();
  }
}
