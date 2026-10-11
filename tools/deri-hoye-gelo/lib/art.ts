// Our own drawings, in game units with the origin on the ground under each thing (y goes up as negative).
// The scene paints them once into small sprites; the result card paints them big. Nothing here runs per frame.

type Ctx = CanvasRenderingContext2D;

export const SKIN = "#b9784f", SKIN_DARK = "#9a5f3d", HAIR = "#1d1410", SHIRT = "#f8f6ef", SHIRT_SHADE = "#d8d3c4";
export const NAVY = "#24345e", NAVY_DARK = "#1a2648", BAG = "#b23a2e", BAG_DARK = "#86281f", BRASS = "#e2ad3c";

/** A pose: angles in radians from straight down (positive swings forward, to the right). */
export type Pose = {
  hipX: number; hipY: number; lean: number;
  thighF: number; bendF: number; thighB: number; bendB: number;
  armF: number; elbowF: number; armB: number; elbowB: number;
  braid: number; mouth: 0 | 1 | 2;
};

const THIGH = 10, SHIN = 10, UPPER = 7, FORE = 6.5, TORSO = 12;

function joint(x: number, y: number, angle: number, length: number): [number, number] {
  return [x + Math.sin(angle) * length, y + Math.cos(angle) * length];
}

function stroke(context: Ctx, color: string, width: number, points: number[]) {
  context.strokeStyle = color; context.lineWidth = width; context.lineCap = "round"; context.lineJoin = "round";
  context.beginPath(); context.moveTo(points[0], points[1]);
  for (let index = 2; index < points.length; index += 2) context.lineTo(points[index], points[index + 1]);
  context.stroke();
}

function leg(context: Ctx, pose: Pose, thigh: number, bend: number, back: boolean, girl: boolean) {
  const skin = back ? SKIN_DARK : SKIN;
  const [kx, ky] = joint(pose.hipX, pose.hipY, thigh, THIGH);
  const shin = thigh - bend;
  const [fx, fy] = joint(kx, ky, shin, SHIN);
  stroke(context, skin, 4.2, [pose.hipX, pose.hipY, kx, ky, fx, fy]);
  // White school socks up the shin, then a black shoe pointing forward.
  const [sx, sy] = joint(fx, fy, shin + Math.PI, 3.6);
  stroke(context, back ? "#d9d6cc" : "#ffffff", 4.4, [sx, sy, fx, fy]);
  context.fillStyle = back ? "#141110" : "#231e1b";
  context.save(); context.translate(fx, fy); context.rotate(-shin * 0.35);
  context.beginPath(); context.ellipse(1.8, 0.9, 3.9, 2.1, 0, 0, Math.PI * 2); context.fill();
  context.restore();
  if (!girl) {
    // Navy shorts over the top of the thigh.
    const [ox, oy] = joint(pose.hipX, pose.hipY, thigh, 5);
    stroke(context, back ? NAVY_DARK : NAVY, 6.4, [pose.hipX, pose.hipY, ox, oy]);
  }
}

function arm(context: Ctx, x: number, y: number, upper: number, elbow: number, back: boolean) {
  const [ex, ey] = joint(x, y, upper, UPPER);
  const [hx, hy] = joint(ex, ey, upper + elbow, FORE);
  stroke(context, back ? SKIN_DARK : SKIN, 3.3, [x, y, ex, ey, hx, hy]);
  // A short white sleeve.
  const [sx, sy] = joint(x, y, upper, 3);
  stroke(context, back ? SHIRT_SHADE : SHIRT, 4.6, [x, y, sx, sy]);
  context.fillStyle = back ? SKIN_DARK : SKIN;
  context.beginPath(); context.arc(hx, hy, 1.9, 0, Math.PI * 2); context.fill();
}

function head(context: Ctx, x: number, y: number, pose: Pose, girl: boolean, dizzy = false) {
  context.save(); context.translate(x, y); context.rotate(pose.lean * 0.35);
  if (girl) {
    // Two braids with white ribbons, swinging behind.
    for (const [offset, shade] of [[-0.25, "#120c09"], [0.15, HAIR]] as const) {
      const angle = pose.braid + offset;
      context.fillStyle = shade;
      for (let link = 0; link < 3; link++) {
        const [bx, by] = joint(-4.6, 1.5, -1.0 + angle, 3 + link * 2.6);
        context.beginPath(); context.ellipse(bx, by, 1.9, 1.5, angle, 0, Math.PI * 2); context.fill();
      }
      const [rx, ry] = joint(-4.6, 1.5, -1.0 + angle, 11.3);
      context.fillStyle = "#ffffff";
      context.beginPath(); context.ellipse(rx - 1.4, ry, 1.6, 1.1, 0.6, 0, Math.PI * 2); context.ellipse(rx + 1.2, ry + 0.4, 1.6, 1.1, -0.6, 0, Math.PI * 2); context.fill();
    }
  }
  context.fillStyle = SKIN;
  context.beginPath(); context.arc(0, 0, 6.3, 0, Math.PI * 2); context.fill();
  context.fillStyle = HAIR;
  context.beginPath();
  context.moveTo(-6.6, 1.6);
  context.bezierCurveTo(-7.6, -6.4, -1.6, -8.6, 3.6, -6.6);
  context.quadraticCurveTo(6.6, -5.2, 6.8, -2.2);
  context.quadraticCurveTo(3.8, -4.2, 1, -3.6);
  context.quadraticCurveTo(-1.6, -1.2, -3.2, 2.6);
  context.closePath(); context.fill();
  if (girl) { context.beginPath(); context.arc(-4.4, 0.6, 2.6, 0, Math.PI * 2); context.fill(); }
  // Ear, eye, brow and an open "late!" mouth.
  context.fillStyle = SKIN_DARK;
  context.beginPath(); context.ellipse(-1.6, 0.8, 1.4, 1.9, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = HAIR; context.lineWidth = 0.9; context.lineCap = "round";
  if (dizzy) {
    context.beginPath(); context.moveTo(1.6, -1.6); context.lineTo(3.6, 0); context.moveTo(3.6, -1.6); context.lineTo(1.6, 0); context.stroke();
  } else {
    context.fillStyle = HAIR;
    context.beginPath(); context.arc(3.1, -0.9, 0.95, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.moveTo(1.8, -3.1); context.lineTo(4.4, -2.5); context.stroke();
  }
  context.fillStyle = "#7a2e22";
  if (pose.mouth === 1) { context.beginPath(); context.ellipse(4.2, 2.6, 1.1, 1.3, 0, 0, Math.PI * 2); context.fill(); }
  else { context.strokeStyle = "#7a2e22"; context.beginPath(); context.arc(3.6, 1.9, 1.5, 0.3, pose.mouth === 2 ? 2.6 : 1.9); context.stroke(); }
  context.fillStyle = "#e7835f55";
  context.beginPath(); context.arc(2.2, 2.3, 1.4, 0, Math.PI * 2); context.fill();
  context.restore();
}

/** Our school kid: a white shirt, navy shorts (or a navy pinafore and two braids), a red satchel, white socks. */
export function drawKid(context: Ctx, pose: Pose, girl: boolean, dizzy = false) {
  const { hipX, hipY, lean } = pose;
  const [shX, shY] = joint(hipX, hipY, Math.PI - lean, TORSO);
  const [nx, ny] = joint(shX, shY, Math.PI - lean, 7.6);
  arm(context, shX - 0.6, shY + 1.2, pose.armB, pose.elbowB, true);
  leg(context, pose, pose.thighB, pose.bendB, true, girl);

  context.save(); context.translate(hipX, hipY); context.rotate(lean);
  // The satchel on the back, its flap and brass buckle.
  context.fillStyle = BAG;
  context.beginPath(); context.roundRect(-10.6, -12.4, 7.4, 10.6, 2); context.fill();
  context.fillStyle = BAG_DARK;
  context.beginPath(); context.roundRect(-10.9, -12.8, 7.8, 4.8, 2); context.fill();
  context.fillStyle = BRASS; context.fillRect(-8.2, -8.6, 2.2, 1.8);
  // Shirt, collar and buttons.
  context.fillStyle = SHIRT;
  context.beginPath(); context.roundRect(-4.8, -13, 9.4, 13.6, 3); context.fill();
  context.fillStyle = SHIRT_SHADE; context.fillRect(-4.8, -2, 9.4, 1.2);
  context.fillStyle = "#ffffff"; context.strokeStyle = SHIRT_SHADE; context.lineWidth = 0.6;
  context.beginPath(); context.moveTo(-1.6, -13); context.lineTo(0.8, -10.6); context.lineTo(3.4, -13); context.closePath(); context.fill(); context.stroke();
  context.fillStyle = "#b9b4a6";
  for (const by of [-8.6, -5.4]) { context.beginPath(); context.arc(1.4, by, 0.55, 0, Math.PI * 2); context.fill(); }
  if (girl) {
    // A navy pinafore: straps, a bib and a skirt.
    context.fillStyle = NAVY;
    context.fillRect(-3.8, -13, 1.6, 6); context.fillRect(2.4, -13, 1.6, 6);
    context.beginPath(); context.roundRect(-4.4, -8, 8.8, 8.6, 1.5); context.fill();
    context.beginPath(); context.moveTo(-4.8, -1); context.lineTo(4.8, -1); context.lineTo(7.2, 7.4); context.lineTo(-7, 7.4); context.closePath(); context.fill();
    context.strokeStyle = NAVY_DARK; context.lineWidth = 0.7;
    context.beginPath(); context.moveTo(-1.8, 0); context.lineTo(-2.6, 7.2); context.moveTo(1.8, 0); context.lineTo(2.6, 7.2); context.stroke();
  } else {
    context.fillStyle = NAVY; context.fillRect(-4.8, -1, 9.6, 3.6);
  }
  // The satchel strap across the chest.
  context.strokeStyle = BAG_DARK; context.lineWidth = 1.5;
  context.beginPath(); context.moveTo(-3.6, -12.6); context.lineTo(4.4, -2.4); context.stroke();
  context.restore();

  leg(context, pose, pose.thighF, pose.bendF, false, girl);
  head(context, nx, ny, pose, girl, dizzy);
  arm(context, shX + 0.6, shY + 1.4, pose.armF, pose.elbowF, false);
}

const base: Pose = { hipX: 0, hipY: -21, lean: 0.18, thighF: 0, bendF: 0.3, thighB: 0, bendB: 0.3, armF: 0, elbowF: 1.3, armB: 0, elbowB: 1.3, braid: 0, mouth: 1 };

/** One of eight running frames (`phase` 0..1). */
export function runPose(phase: number): Pose {
  const angle = phase * Math.PI * 2;
  const swing = (offset: number) => 0.85 * Math.sin(angle + offset);
  const bend = (offset: number) => 0.25 + 1.15 * Math.max(0, Math.cos(angle + offset));
  return {
    ...base, hipY: -21 + 1.2 * Math.abs(Math.cos(angle)) - 0.6,
    thighF: swing(0), bendF: bend(0), thighB: swing(Math.PI), bendB: bend(Math.PI),
    armF: -0.75 * Math.sin(angle), armB: 0.75 * Math.sin(angle), braid: 0.25 * Math.sin(angle),
  };
}

export const jumpUpPose: Pose = { ...base, hipY: -24, lean: 0.12, thighF: 1.15, bendF: 1.5, thighB: -0.25, bendB: 1.0, armF: 2.4, elbowF: 0.3, armB: -0.9, elbowB: 0.6, braid: -0.4, mouth: 1 };
export const jumpDownPose: Pose = { ...base, hipY: -22, lean: 0.1, thighF: 0.55, bendF: 0.5, thighB: 0.05, bendB: 0.7, armF: 1.5, elbowF: 0.5, armB: -1.1, elbowB: 0.4, braid: 0.5, mouth: 2 };
/** Ducked low and still running: two frames. The body is shifted back so it stays over its hit box. */
export function duckPose(step: number): Pose {
  const s = step ? 1 : -1;
  return { ...base, hipX: -8, hipY: -11.5, lean: 1.12, thighF: 1.0 + 0.25 * s, bendF: 2.1, thighB: 0.55 - 0.25 * s, bendB: 1.7, armF: 0.6 + 0.2 * s, elbowF: 1.0, armB: -0.4, elbowB: 0.9, braid: -0.3, mouth: 1 };
}
export const sitPose: Pose = { ...base, hipX: -2, hipY: -3.5, lean: -0.3, thighF: 1.5, bendF: 0.2, thighB: 1.35, bendB: 0.15, armF: 2.9, elbowF: 1.9, armB: -0.5, elbowB: 0.2, braid: 0.6, mouth: 2 };

/** The kid sitting in the road after a bump: dizzy eyes, two little stars, the satchel fallen beside. */
export function drawSitting(context: Ctx, girl: boolean) {
  drawSatchel(context, -17, 0);
  drawKid(context, sitPose, girl, true);
  for (const [x, y] of [[-5, -27], [7, -29]] as const) drawStar(context, x, y, 2.6, "#ffcf3d");
}

export function drawSatchel(context: Ctx, x: number, y: number) {
  context.save(); context.translate(x, y); context.rotate(-0.25);
  context.fillStyle = BAG; context.beginPath(); context.roundRect(-5.5, -9, 11, 9, 2); context.fill();
  context.fillStyle = "#f4efe2"; context.fillRect(-3.8, -11, 7.4, 3);
  context.strokeStyle = "#9cb3d6"; context.lineWidth = 0.6;
  context.beginPath(); context.moveTo(-3.2, -10); context.lineTo(3, -10); context.stroke();
  context.fillStyle = BAG_DARK; context.beginPath(); context.roundRect(-6, -9.6, 12, 3.6, 1.5); context.fill();
  context.fillStyle = BRASS; context.fillRect(-1, -6.6, 2, 1.6);
  context.restore();
}

export function drawStar(context: Ctx, x: number, y: number, r: number, color: string) {
  context.fillStyle = color;
  context.beginPath();
  for (let index = 0; index < 10; index++) {
    const angle = -Math.PI / 2 + index * Math.PI / 5, radius = index % 2 ? r * 0.45 : r;
    context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  context.closePath(); context.fill();
}

/** A muddy puddle on the road, `w` wide. */
export function drawPuddle(context: Ctx, w: number) {
  const rx = w / 2 + 6;
  context.fillStyle = "#7b6047";
  for (const [x, r] of [[-rx - 2, 2.2], [rx + 1, 1.8], [-rx * 0.5, 1.4], [rx * 0.6, 1.6]] as const) { context.beginPath(); context.ellipse(x, x > 0 ? -0.5 : -2.8, r * 1.5, r * 0.7, 0, 0, Math.PI * 2); context.fill(); }
  context.beginPath(); context.ellipse(0, -1.6, rx, 5.4, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#6a5a4c";
  context.beginPath(); context.ellipse(0, -1.4, rx - 2.4, 4, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#93aebd";
  context.beginPath(); context.ellipse(-rx * 0.2, -2.4, rx * 0.55, 1.3, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#d6e6ee";
  context.beginPath(); context.ellipse(-rx * 0.3, -2.7, rx * 0.22, 0.6, 0, 0, Math.PI * 2); context.fill();
}

/** A vendor's bamboo ঝাঁকা set down on the road, heaped with eggplant, tomatoes, a gourd and chillies. */
export function drawBasket(context: Ctx) {
  context.fillStyle = "#00000022";
  context.beginPath(); context.ellipse(0, 0, 17, 2.2, 0, 0, Math.PI * 2); context.fill();
  // The heap first, so the rim sits in front of it.
  context.fillStyle = "#8fbf5a";
  context.beginPath(); context.ellipse(-5, -18, 9, 4.2, -0.25, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#6f9e3f"; context.beginPath(); context.ellipse(-12.5, -16, 2.2, 1.6, 0, 0, Math.PI * 2); context.fill();
  for (const [x, y, a] of [[6, -18, 0.5], [1, -21, -0.3]] as const) {
    context.fillStyle = "#5b2a6c";
    context.beginPath(); context.ellipse(x, y, 6.2, 3, a, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#3e7a2c";
    context.beginPath(); context.ellipse(x - Math.cos(a) * 6, y - Math.sin(a) * 6, 2, 1.6, a, 0, Math.PI * 2); context.fill();
  }
  for (const [x, y] of [[-9, -20.5], [11, -16], [-1, -16.5]] as const) {
    context.fillStyle = "#d8432c"; context.beginPath(); context.arc(x, y, 3.2, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#f08a6a"; context.beginPath(); context.arc(x - 1, y - 1.1, 1, 0, Math.PI * 2); context.fill();
  }
  stroke(context, "#3f9a35", 1.2, [12, -21, 14, -23.5, 16, -23]);
  stroke(context, "#3f9a35", 1.2, [-14, -18.5, -16, -21, -15, -23]);
  // The woven basket.
  context.fillStyle = "#c8964f";
  context.beginPath(); context.moveTo(-17, -15); context.lineTo(17, -15); context.lineTo(13, 0); context.lineTo(-13, 0); context.closePath(); context.fill();
  context.strokeStyle = "#9c6d32"; context.lineWidth = 0.7;
  context.beginPath();
  for (let y = -12; y < 0; y += 3) { context.moveTo(-16.5 + (y + 15) * 0.25, y); context.lineTo(16.5 - (y + 15) * 0.25, y); }
  for (let x = -15; x <= 15; x += 3.4) { context.moveTo(x, -15); context.lineTo(x * 0.78, 0); }
  context.stroke();
  context.fillStyle = "#a8783a";
  context.beginPath(); context.roundRect(-18.5, -17, 37, 3.6, 1.8); context.fill();
}

/** A parked bicycle on its stand, side on. */
export function drawBike(context: Ctx) {
  const frame = "#2d5d6b";
  context.fillStyle = "#00000022";
  context.beginPath(); context.ellipse(0, 0, 27, 2.2, 0, 0, Math.PI * 2); context.fill();
  for (const cx of [-17, 17]) {
    context.strokeStyle = "#9aa1a6"; context.lineWidth = 0.5;
    context.beginPath();
    for (let spoke = 0; spoke < 8; spoke++) { const a = spoke * Math.PI / 4 + 0.2; context.moveTo(cx, -10.5); context.lineTo(cx + Math.cos(a) * 9.6, -10.5 + Math.sin(a) * 9.6); }
    context.stroke();
    context.strokeStyle = "#262626"; context.lineWidth = 2.4;
    context.beginPath(); context.arc(cx, -10.5, 9.4, 0, Math.PI * 2); context.stroke();
    context.strokeStyle = "#bfc5c9"; context.lineWidth = 0.7;
    context.beginPath(); context.arc(cx, -10.5, 7.9, 0, Math.PI * 2); context.stroke();
    context.fillStyle = "#555"; context.beginPath(); context.arc(cx, -10.5, 1.3, 0, Math.PI * 2); context.fill();
  }
  // Carrier over the back wheel, kickstand, frame, fork, chainring, saddle and handlebar.
  stroke(context, "#3a3a3a", 1.1, [-24, -22.5, -8, -22.5]);
  stroke(context, "#3a3a3a", 0.8, [-22, -22.5, -17, -10.5]);
  stroke(context, "#3a3a3a", 1.2, [-2, -10, -6, 0]);
  stroke(context, frame, 2.2, [-17, -10.5, -2, -10, -6.5, -25, -17, -10.5]);
  stroke(context, frame, 2.2, [-6.5, -25, 12, -27, -2, -10]);
  stroke(context, frame, 2.2, [12.6, -29, 13.4, -23, 17, -10.5]);
  context.strokeStyle = "#444"; context.lineWidth = 1;
  context.beginPath(); context.arc(-2, -10, 3, 0, Math.PI * 2); context.stroke();
  stroke(context, "#3a3a3a", 1.4, [-6.5, -25, -7.2, -28]);
  context.fillStyle = "#1f1a17";
  context.beginPath(); context.ellipse(-8, -29, 4.6, 1.7, 0.05, 0, Math.PI * 2); context.fill();
  stroke(context, "#3a3a3a", 1.5, [12.6, -29, 12, -33, 6.5, -33.5]);
  stroke(context, "#1f1a17", 2.4, [6.4, -33.5, 4.6, -33.2]);
  context.fillStyle = "#d9d9d9"; context.beginPath(); context.arc(13.8, -26.2, 1.1, 0, Math.PI * 2); context.fill();
}

/** A desi cow sitting in the middle of the road, chewing calmly, facing the kid. */
export function drawCow(context: Ctx) {
  const coat = "#b8743f", dark = "#8f5730", light = "#f1e6d6";
  context.fillStyle = "#00000024";
  context.beginPath(); context.ellipse(2, 0, 31, 2.6, 0, 0, Math.PI * 2); context.fill();
  // Tail curled on the ground with its dark tuft.
  stroke(context, dark, 1.6, [27, -12, 33, -6, 30, -1.5]);
  context.fillStyle = "#3b2a1e"; context.beginPath(); context.ellipse(28, -1.4, 2.6, 1.4, 0.3, 0, Math.PI * 2); context.fill();
  // Body with the zebu hump, a white patch and folded legs.
  context.fillStyle = coat;
  context.beginPath(); context.ellipse(4, -11, 26, 11, 0, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(-9, -20, 7, 5, -0.2, 0, Math.PI * 2); context.fill();
  context.fillStyle = light;
  context.beginPath(); context.ellipse(10, -12, 8, 6, 0.3, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(2, -3.4, 20, 3.6, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = dark;
  context.beginPath(); context.ellipse(-12, -2, 7, 2.4, 0, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(20, -2.2, 6, 2.2, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#3b2a1e";
  for (const x of [-18, 25]) { context.beginPath(); context.ellipse(x, -1.4, 2, 1.4, 0, 0, Math.PI * 2); context.fill(); }
  // Neck, a red rope collar, then the head turned toward the road ahead.
  context.fillStyle = coat;
  context.beginPath(); context.moveTo(-14, -18); context.quadraticCurveTo(-22, -20, -24, -14); context.lineTo(-16, -6); context.closePath(); context.fill();
  stroke(context, "#c9372c", 1.4, [-15.5, -18, -20.5, -8.5]);
  context.save(); context.translate(-25, -17); context.rotate(-0.35);
  context.fillStyle = light;
  context.beginPath(); context.moveTo(-4.4, -4.8); context.quadraticCurveTo(-1, -6.6, 0.6, -6); context.lineTo(-4.6, -9.6); context.closePath(); context.fill();
  context.beginPath(); context.moveTo(1.4, -5.6); context.quadraticCurveTo(4.4, -6.2, 5.4, -9.4); context.lineTo(2.6, -4.6); context.closePath(); context.fill();
  context.fillStyle = coat;
  context.beginPath(); context.ellipse(0, 0, 6.4, 5.6, 0, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(6.2, -2.8, 3.6, 1.6, -0.4, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#e6b19a";
  context.beginPath(); context.ellipse(-4.8, 3.2, 4.2, 3.2, 0.3, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#5a3a2e";
  context.beginPath(); context.arc(-6.4, 3, 0.7, 0, Math.PI * 2); context.fill();
  // Half-closed, unbothered eyes.
  context.strokeStyle = "#2a1d14"; context.lineWidth = 0.9; context.lineCap = "round";
  context.beginPath(); context.arc(-1.4, -0.8, 1.6, 0.15, Math.PI - 0.15); context.stroke();
  context.beginPath(); context.moveTo(-3, -0.6); context.lineTo(0.2, -0.6); context.stroke();
  context.restore();
}

/** Two bamboo poles behind the lane and a rope between them with a checked গামছা hanging low. */
export function drawLine(context: Ctx) {
  for (const x of [-21, 21]) {
    stroke(context, "#c9a35a", 2.6, [x, -12, x, -94]);
    context.strokeStyle = "#9d7a37"; context.lineWidth = 0.8;
    context.beginPath(); for (let y = -24; y > -92; y -= 14) { context.moveTo(x - 1.3, y); context.lineTo(x + 1.3, y); } context.stroke();
  }
  context.strokeStyle = "#e9dcc0"; context.lineWidth = 1;
  context.beginPath(); context.moveTo(-21, -88); context.quadraticCurveTo(0, -82, 21, -87); context.stroke();
  // The গামছা: red with a white and green check, folded over the rope, a fringe at the bottom.
  context.save();
  context.beginPath(); context.moveTo(-13, -85.5); context.lineTo(13, -85.5); context.lineTo(13.6, -31); context.lineTo(-13.6, -31); context.closePath();
  context.fillStyle = "#c8302c"; context.fill(); context.clip();
  context.fillStyle = "#f4ede0aa";
  for (let x = -12; x < 14; x += 6.5) context.fillRect(x, -86, 1.6, 56);
  for (let y = -80; y < -30; y += 7) context.fillRect(-14, y, 28, 1.6);
  context.fillStyle = "#2f7d4a";
  context.fillRect(-14, -38, 28, 2); context.fillRect(-14, -78, 28, 1.4);
  context.restore();
  context.fillStyle = "#a6231f"; context.fillRect(-13.4, -86.5, 26.8, 4.6);
  context.strokeStyle = "#f4ede0"; context.lineWidth = 0.7;
  context.beginPath(); for (let x = -12.5; x <= 12.5; x += 2.2) { context.moveTo(x, -31); context.lineTo(x + 0.3, -29); } context.stroke();
}

/** A low mango branch leaning over the lane from a tree behind it. */
export function drawBranch(context: Ctx) {
  context.fillStyle = "#6b4a2e";
  context.beginPath(); context.moveTo(24, -12); context.lineTo(34, -12); context.lineTo(31, -120); context.lineTo(25, -120); context.closePath(); context.fill();
  context.strokeStyle = "#6b4a2e"; context.lineCap = "round";
  context.lineWidth = 4.4; context.beginPath(); context.moveTo(27, -78); context.quadraticCurveTo(6, -66, -24, -52); context.stroke();
  context.lineWidth = 2; context.beginPath(); context.moveTo(-2, -61); context.lineTo(-10, -44); context.moveTo(12, -68); context.lineTo(8, -50); context.stroke();
  const leaves: Array<[number, number, number, string]> = [
    [-26, -50, 1.6, "#2f5a26"], [-20, -42, 1.9, "#3b6c2d"], [-14, -38, 1.4, "#2f5a26"], [-8, -40, 1.7, "#4c8236"], [-2, -36, 1.5, "#3b6c2d"],
    [4, -40, 1.8, "#2f5a26"], [10, -38, 1.3, "#4c8236"], [16, -44, 1.6, "#3b6c2d"], [-16, -50, 0.9, "#4c8236"], [2, -50, 0.7, "#2f5a26"],
    [-24, -40, 2.1, "#4c8236"], [20, -40, 1.5, "#2f5a26"], [-10, -47, 2.2, "#3b6c2d"], [8, -46, 2.4, "#4c8236"],
  ];
  for (const [x, y, a, color] of leaves) { context.fillStyle = color; context.beginPath(); context.ellipse(x, y, 7.4, 2.4, a, 0, Math.PI * 2); context.fill(); }
  for (const [x, y] of [[-6, -34], [13, -35]] as const) {
    context.fillStyle = "#86b23a"; context.beginPath(); context.ellipse(x, y, 2.6, 3.4, 0.2, 0, Math.PI * 2); context.fill();
  }
}

/** A steel tiffin carrier, three tiers and a handle, with a soft glow so it reads as a pick-up. */
export function drawTiffin(context: Ctx, glow = true) {
  if (glow) {
    const halo = context.createRadialGradient(0, -8, 2, 0, -8, 15);
    halo.addColorStop(0, "#fff3b0cc"); halo.addColorStop(1, "#fff3b000");
    context.fillStyle = halo; context.beginPath(); context.arc(0, -8, 15, 0, Math.PI * 2); context.fill();
  }
  context.strokeStyle = "#7d878e"; context.lineWidth = 1.3;
  context.beginPath(); context.moveTo(-5, -14); context.quadraticCurveTo(0, -20, 5, -14); context.stroke();
  stroke(context, "#8e989f", 1, [-6.6, -14.5, -6.6, -1]);
  stroke(context, "#8e989f", 1, [6.6, -14.5, 6.6, -1]);
  for (let tier = 0; tier < 3; tier++) {
    const y = -4.6 - tier * 4.6;
    context.fillStyle = "#b9c3c9"; context.beginPath(); context.roundRect(-6, y, 12, 4.4, 1.6); context.fill();
    context.fillStyle = "#eef3f5"; context.fillRect(-4.6, y + 0.8, 3, 1.2);
    context.fillStyle = "#8e989f"; context.fillRect(-6, y + 3.6, 12, 0.8);
  }
  context.fillStyle = "#c9d1d6"; context.beginPath(); context.ellipse(0, -14.4, 5.6, 1.4, 0, 0, Math.PI * 2); context.fill();
}

/** The school gate: brick pillars, an iron arch, a sign board and the brass bell hanging in the middle. */
export function drawGate(context: Ctx, sign: string, font: string) {
  for (const x of [-56, 56]) {
    context.fillStyle = "#b5523b"; context.fillRect(x - 8, -122, 16, 110);
    context.strokeStyle = "#8f3c2a"; context.lineWidth = 0.6;
    context.beginPath(); for (let y = -116; y < -12; y += 5) { context.moveTo(x - 8, y); context.lineTo(x + 8, y); } context.stroke();
    context.fillStyle = "#f1ece0"; context.fillRect(x - 10, -128, 20, 7);
    // The gate leaves stand open, folded back along the wall.
    context.strokeStyle = "#2f6b4f"; context.lineWidth = 1.2;
    const side = Math.sign(x);
    context.beginPath();
    for (let bar = 0; bar <= 4; bar++) { const bx = x + side * (10 + bar * 5); context.moveTo(bx, -14); context.lineTo(bx, -66); }
    context.moveTo(x + side * 10, -20); context.lineTo(x + side * 30, -20); context.moveTo(x + side * 10, -62); context.lineTo(x + side * 30, -62);
    context.stroke();
  }
  context.strokeStyle = "#2f6b4f"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(-50, -122); context.quadraticCurveTo(0, -150, 50, -122); context.stroke();
  context.fillStyle = "#f6f1e3"; context.strokeStyle = "#2f6b4f"; context.lineWidth = 1.6;
  context.beginPath(); context.roundRect(-26, -146, 52, 15, 3); context.fill(); context.stroke();
  context.fillStyle = "#24345e"; context.font = font; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(sign, 0, -138.2);
  context.textBaseline = "alphabetic";
  stroke(context, "#5a4a3a", 0.8, [0, -131, 0, -120]);
  drawBell(context, 0, -114, 6);
}

export function drawBell(context: Ctx, x: number, y: number, r: number) {
  context.fillStyle = BRASS;
  context.beginPath(); context.ellipse(x, y, r, r * 1.05, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#f6d27a"; context.beginPath(); context.ellipse(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.3, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#9c7420"; context.lineWidth = r * 0.16;
  context.beginPath(); context.ellipse(x, y, r * 0.62, r * 0.66, 0, 0, Math.PI * 2); context.stroke();
}

/** A roadside stone with a yellow cap, like the ones that count the road. The number is drawn by the caller. */
export function drawMilestone(context: Ctx) {
  context.fillStyle = "#00000022"; context.beginPath(); context.ellipse(0, 0, 9, 1.6, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#f4f1e8";
  context.beginPath(); context.moveTo(-7, 0); context.lineTo(-7, -14); context.arc(0, -14, 7, Math.PI, 0); context.lineTo(7, 0); context.closePath(); context.fill();
  context.save(); context.clip();
  context.fillStyle = "#f2c230"; context.fillRect(-8, -22, 16, 7.4);
  context.restore();
  context.strokeStyle = "#cfc9b8"; context.lineWidth = 0.6; context.stroke();
}
