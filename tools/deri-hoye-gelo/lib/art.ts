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

/** A page torn from the kid's exercise book, blown along the road: ruled lines, a red margin, a soft glow so it reads as a pick-up. */
export function drawPage(context: Ctx, glow = true) {
  if (glow) {
    const halo = context.createRadialGradient(0, -8, 2, 0, -8, 15);
    halo.addColorStop(0, "#ffffffcc"); halo.addColorStop(1, "#ffffff00");
    context.fillStyle = halo; context.beginPath(); context.arc(0, -8, 15, 0, Math.PI * 2); context.fill();
  }
  context.save();
  context.rotate(-0.18);
  context.fillStyle = "#fdfbf3"; context.strokeStyle = "#b9b2a0"; context.lineWidth = 0.7;
  context.beginPath(); context.moveTo(-7, -17); context.lineTo(6, -17); context.lineTo(8, -14); context.lineTo(8, 0); context.lineTo(-7, 0); context.closePath(); context.fill(); context.stroke();
  context.strokeStyle = "#8fb3de"; context.lineWidth = 0.6;
  context.beginPath(); for (let y = -13; y < 0; y += 2.6) { context.moveTo(-6, y); context.lineTo(7.4, y); } context.stroke();
  stroke(context, "#e0786b", 0.7, [-4, -16.5, -4, -0.5]);
  stroke(context, "#3d4f86", 0.8, [-2.6, -10.2, 4, -10.2]);
  context.restore();
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

/* ---------- the rewrite's new drawings: worlds, the bazaar, the rain, signboards, tyres, mud, the gate and its guard ---------- */

/** One palette per world: the sky top to bottom, the sun, the far strip's wash (rain), and the ground under the road. */
export const WORLD_ART = [
  { sky: ["#86bde0", "#f3d3a6", "#ffe7c2"], sun: "#ffd27a", glow: "#fff1cc", wash: "", verge: "#6f9440", hud: "#1f2a44" },
  { sky: ["#5fb0e6", "#b9def1", "#fff1cf"], sun: "#fff4c2", glow: "#fffbe8", wash: "", verge: "#8d8a83", hud: "#1f2a44" },
  { sky: ["#4d5d73", "#7f8ea1", "#aab6bf"], sun: "", glow: "", wash: "#2c3f5a59", verge: "#4f6b3a", hud: "#f3f6fb" },
] as const;

/** The sky over the road: the world's gradient, a sun (or rain clouds), clouds and a paper kite. `h` is the sky's height in units. */
export function paintWorldSky(context: Ctx, w: number, h: number, world: number) {
  const art = WORLD_ART[world];
  const sky = context.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, art.sky[0]); sky.addColorStop(0.62, art.sky[1]); sky.addColorStop(1, art.sky[2]);
  context.fillStyle = sky; context.fillRect(0, 0, w, h + 2);
  if (art.sun) {
    const sx = world === 0 ? 92 : 300, sy = world === 0 ? h - 150 : h * 0.3;
    const glow = context.createRadialGradient(sx, sy, 6, sx, sy, 70);
    glow.addColorStop(0, art.glow); glow.addColorStop(1, `${art.glow}00`);
    context.fillStyle = glow; context.fillRect(sx - 80, sy - 80, 160, 160);
    context.fillStyle = art.sun; context.beginPath(); context.arc(sx, sy, world === 0 ? 20 : 15, 0, Math.PI * 2); context.fill();
  }
  // Clouds: soft puffs, darker and lower in the rain.
  context.fillStyle = world === 2 ? "#3e4b5e" : "#ffffffd9";
  const rows = world === 2 ? [[40, 0.12, 1.5], [200, 0.2, 1.8], [320, 0.08, 1.3], [110, 0.34, 1.2], [270, 0.42, 1.1]] : [[70, 0.3, 1], [210, 0.45, 0.8], [300, 0.2, 0.6], [150, 0.62, 0.7]];
  for (const [x, at, s] of rows) {
    const y = h * at;
    for (const [dx, dy, r] of [[-14, 4, 9], [-2, -2, 12], [12, 3, 9], [0, 6, 10], [22, 6, 7]] as const) { context.beginPath(); context.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); context.fill(); }
  }
  if (world === 2) return;
  // A paper kite with its tail, the kind every lane has in the sky.
  context.save(); context.translate(250, h * 0.36); context.rotate(0.2);
  context.fillStyle = world === 1 ? "#2b6fd6" : "#e5483b"; context.beginPath(); context.moveTo(0, -9); context.lineTo(7, 0); context.lineTo(0, 9); context.lineTo(-7, 0); context.closePath(); context.fill();
  context.fillStyle = "#ffd166"; context.beginPath(); context.moveTo(0, -9); context.lineTo(7, 0); context.lineTo(0, 0); context.closePath(); context.fill();
  context.strokeStyle = "#7a2b22"; context.lineWidth = 0.6; context.beginPath(); context.moveTo(0, 9); context.quadraticCurveTo(-4, 16, 2, 22); context.stroke();
  context.restore();
  context.strokeStyle = "#4a5b6a66"; context.lineWidth = 0.5; context.beginPath(); context.moveTo(252, h * 0.36 + 10); context.quadraticCurveTo(200, h * 0.7, 160, h); context.stroke();
  context.strokeStyle = "#4a5b6a"; context.lineWidth = 1; context.lineCap = "round";
  context.beginPath();
  for (const [x, y] of [[130, h * 0.5], [142, h * 0.48], [152, h * 0.51]] as const) { context.moveTo(x - 4, y - 2); context.quadraticCurveTo(x - 2, y - 3.5, x, y); context.quadraticCurveTo(x + 2, y - 3.5, x + 4, y - 2); }
  context.stroke();
}

function shopFront(context: Ctx, x: number, b: number, w: number, wall: string, shutter: string, sign: string, word: string, font: string) {
  context.fillStyle = wall; context.fillRect(x, b - 86, w, 86);
  context.fillStyle = "#00000014"; context.fillRect(x, b - 86, w, 4);
  // Upper floor windows with grills, a balcony with clothes drying.
  context.fillStyle = "#3d6470";
  for (let wx = x + 8; wx < x + w - 14; wx += 20) context.fillRect(wx, b - 76, 12, 14);
  context.strokeStyle = "#ffffff55"; context.lineWidth = 0.7;
  context.beginPath(); for (let wx = x + 8; wx < x + w - 14; wx += 20) for (let bar = 3; bar < 12; bar += 3) { context.moveTo(wx + bar, b - 76); context.lineTo(wx + bar, b - 62); } context.stroke();
  // The shop's signboard and its rolled-up shutter over the open front.
  context.fillStyle = sign; context.fillRect(x + 3, b - 54, w - 6, 13);
  context.fillStyle = "#ffffff"; context.font = font; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(word, x + w / 2, b - 47.4);
  context.textBaseline = "alphabetic";
  context.fillStyle = shutter; context.fillRect(x + 4, b - 41, w - 8, 6);
  context.fillStyle = "#3a2e2a"; context.fillRect(x + 4, b - 35, w - 8, 35);
  // Goods on shelves inside.
  const colors = ["#e0a43a", "#c8452f", "#5c9a4a", "#f1e3c4", "#3c6fb0"];
  for (let row = 0; row < 3; row++) for (let gx = x + 7; gx < x + w - 9; gx += 6) { context.fillStyle = colors[(gx + row * 3) % 5]; context.fillRect(gx, b - 31 + row * 9, 4, 6); }
}

function rickshaw(context: Ctx, x: number, b: number, hood: string) {
  context.strokeStyle = "#2a2a2a"; context.lineWidth = 1.4;
  for (const cx of [x, x + 24]) { context.beginPath(); context.arc(cx, b - 7, 7, 0, Math.PI * 2); context.stroke(); }
  context.fillStyle = hood;
  context.beginPath(); context.moveTo(x - 6, b - 14); context.quadraticCurveTo(x - 4, b - 40, x + 12, b - 38); context.lineTo(x + 12, b - 14); context.closePath(); context.fill();
  context.fillStyle = "#e9c46a"; context.fillRect(x - 6, b - 16, 20, 4);
  context.strokeStyle = "#e5483b"; context.lineWidth = 1;
  context.beginPath(); for (let i = 0; i < 4; i++) { context.moveTo(x - 4 + i * 4, b - 36 + i * 2); context.lineTo(x - 2 + i * 4, b - 18); } context.stroke();
  context.strokeStyle = "#3a3a3a"; context.lineWidth = 1.2;
  context.beginPath(); context.moveTo(x + 12, b - 14); context.lineTo(x + 24, b - 16); context.lineTo(x + 26, b - 26); context.stroke();
  context.fillStyle = "#1f1a17"; context.fillRect(x + 20, b - 22, 7, 2);
}

/** The bazaar lane behind the road: shop fronts with Bangla signboards, rickshaws waiting, wires overhead. `font` paints the signs. */
export function paintTown(context: Ctx, width: number, height: number, font: string) {
  const b = height;
  context.fillStyle = "#c7b8a4";
  for (let x = -10; x < width + 20; x += 60) context.fillRect(x, b - 108 - ((x * 7) % 18), 52, 108);
  const shops: Array<[number, number, string, string, string, string]> = [
    [0, 74, "#e9d7b0", "#8c9aa3", "#2b6f5a", "মুদি দোকান"], [78, 66, "#f0c9b6", "#9aa3a8", "#b2402f", "চা-নাস্তা"], [148, 80, "#d4e1d0", "#8c9aa3", "#2b4c8c", "লাইব্রেরি"],
    [232, 70, "#f3e3a6", "#9aa3a8", "#7a3d8c", "দর্জি"], [306, 76, "#e8c7c7", "#8c9aa3", "#b2402f", "মিষ্টিমুখ"], [386, 72, "#cfe0e8", "#9aa3a8", "#2b6f5a", "ওষুধ"],
    [462, 78, "#efd9b4", "#8c9aa3", "#9a5b1e", "হোটেল"], [544, 70, "#dcd0e6", "#9aa3a8", "#2b4c8c", "সেলুন"], [618, 102, "#f0c9b6", "#8c9aa3", "#b2402f", "স্টেশনারি"],
  ];
  for (const [x, w, wall, shutter, sign, word] of shops) shopFront(context, x, b, w, wall, shutter, sign, word, font);
  for (const [x, hood] of [[60, "#2f6fb0"], [290, "#c8302c"], [520, "#2f8a4f"]] as const) rickshaw(context, x, b, hood);
  // Poles and the wires every bazaar has.
  context.fillStyle = "#5a5a5a";
  for (const px of [120, 360, 600]) { context.fillRect(px - 1.2, b - 118, 2.4, 118); context.fillRect(px - 8, b - 114, 16, 2); }
  context.strokeStyle = "#2e2e2e99"; context.lineWidth = 0.7;
  context.beginPath();
  for (const px of [-120, 120, 360, 600]) for (const wx of [-7, -2, 7]) { context.moveTo(px + wx, b - 113); context.quadraticCurveTo(px + 120 + wx, b - 98 + wx, px + 240 + wx, b - 113); }
  context.stroke();
}

/** The bazaar's footpath: grey slabs, a kerb and the drain. */
export function paintPavement(context: Ctx, tile: number) {
  context.fillStyle = "#9b9a94"; context.fillRect(0, 0, tile, 5);
  context.fillStyle = "#b9b6ad"; context.fillRect(0, 4, tile, 33);
  context.strokeStyle = "#8f8c84"; context.lineWidth = 0.9;
  context.beginPath();
  for (let x = 0; x <= tile; x += 24) { context.moveTo(x, 4); context.lineTo(x, 37); }
  context.moveTo(0, 20); context.lineTo(tile, 20);
  context.stroke();
  context.fillStyle = "#a5a29a";
  for (let i = 0; i < 7; i++) { const x = (i * 29) % tile, y = 8 + ((i * 17) % 26); context.fillRect(x, y, 2, 1.2); }
  context.fillStyle = "#6d6b66"; context.fillRect(0, 37, tile, 5);
  context.fillStyle = "#57534d"; context.fillRect(0, 42, tile, 21);
  context.fillStyle = "#6b675f"; for (let x = 4; x < tile; x += 12) context.fillRect(x, 46, 6, 2);
}

/** The rainy road: dark wet earth with shining streaks. */
export function paintWetDirt(context: Ctx, tile: number) {
  context.fillStyle = "#4f6b3a"; context.fillRect(0, 0, tile, 6);
  const path = context.createLinearGradient(0, 5, 0, 37);
  path.addColorStop(0, "#8a6c4c"); path.addColorStop(1, "#6f553b");
  context.fillStyle = path; context.fillRect(0, 5, tile, 32);
  context.fillStyle = "#b9c7d266";
  for (let i = 0; i < 6; i++) { const x = (i * 41) % tile, y = 10 + ((i * 19) % 22); context.fillRect(x, y, 10 + (i % 3) * 4, 1.1); }
  context.fillStyle = "#4a6a36"; context.fillRect(0, 37, tile, 26);
  context.strokeStyle = "#6e9445"; context.lineWidth = 1.1;
  context.beginPath(); for (let x = 2; x < tile; x += 5) { const y = 58 - (x % 3); context.moveTo(x, y); context.quadraticCurveTo(x - 1, y - 8, x - 3, y - 13); } context.stroke();
}

/** A shop's signboard hanging over the road on two chains from an iron bracket. */
export function drawSign(context: Ctx, word: string, font: string) {
  context.strokeStyle = "#3a3a3a"; context.lineWidth = 2.4;
  context.beginPath(); context.moveTo(34, -112); context.lineTo(34, -12); context.stroke();
  context.lineWidth = 1.8;
  context.beginPath(); context.moveTo(34, -100); context.lineTo(-30, -100); context.moveTo(34, -88); context.lineTo(18, -100); context.stroke();
  context.strokeStyle = "#6b6b6b"; context.lineWidth = 0.8;
  context.beginPath(); context.moveTo(-24, -100); context.lineTo(-24, -62); context.moveTo(24, -100); context.lineTo(24, -62); context.stroke();
  context.fillStyle = "#c8452f";
  context.beginPath(); context.roundRect(-29, -64, 58, 32, 3); context.fill();
  context.fillStyle = "#f6e7c4"; context.beginPath(); context.roundRect(-26, -61, 52, 26, 2); context.fill();
  context.fillStyle = "#b2402f"; context.font = font; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(word, 0, -48);
  context.textBaseline = "alphabetic";
}

/** A bicycle tyre a boy is rolling down the lane with a stick (you see the tyre; he's far behind). */
export function drawTire(context: Ctx) {
  context.strokeStyle = "#1f1f1f"; context.lineWidth = 4.2;
  context.beginPath(); context.arc(0, 0, 9, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = "#555"; context.lineWidth = 1.1;
  context.beginPath(); context.arc(0, 0, 6.2, 0, Math.PI * 2); context.stroke();
  context.strokeStyle = "#9aa1a6"; context.lineWidth = 0.6;
  context.beginPath(); for (let spoke = 0; spoke < 6; spoke++) { const a = spoke * Math.PI / 3; context.moveTo(0, 0); context.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); } context.stroke();
  context.fillStyle = "#e9c46a"; context.beginPath(); context.arc(0, 0, 1.6, 0, Math.PI * 2); context.fill();
  // A white chalk mark on the rubber, so you can see it spin.
  context.strokeStyle = "#f4efe2"; context.lineWidth = 2; context.beginPath(); context.arc(0, 0, 9, -0.3, 0.3); context.stroke();
}

/** A wide patch of rainy-season mud, `w` wide: dark, with ripples and a footprint. */
export function drawMud(context: Ctx, w: number) {
  const rx = w / 2 + 4;
  context.fillStyle = "#5b4330";
  context.beginPath(); context.ellipse(0, -1.6, rx, 5.6, 0, 0, Math.PI * 2); context.fill();
  for (const [x, r] of [[-rx - 3, 2.6], [rx + 2, 2.2], [-rx * 0.4, 1.6], [rx * 0.5, 1.8]] as const) { context.beginPath(); context.ellipse(x, -0.8, r * 1.6, r * 0.7, 0, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#4a3627"; context.beginPath(); context.ellipse(0, -1.4, rx - 3, 4, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = "#8a7a6a"; context.lineWidth = 0.6;
  context.beginPath(); for (const [x, s] of [[-rx * 0.4, 5], [rx * 0.3, 7]] as const) context.ellipse(x, -2, s, 1.2, 0, 0, Math.PI * 2); context.stroke();
  context.fillStyle = "#9fb1bd99"; context.beginPath(); context.ellipse(-rx * 0.1, -2.6, rx * 0.5, 0.9, 0, 0, Math.PI * 2); context.fill();
}

/** The school gate's pillars, arch, sign and bell, without the two iron leaves (they swing, so they're drawn on their own). */
export function drawGateFrame(context: Ctx, sign: string, font: string) {
  for (const x of [-56, 56]) {
    context.fillStyle = "#b5523b"; context.fillRect(x - 8, -122, 16, 110);
    context.strokeStyle = "#8f3c2a"; context.lineWidth = 0.6;
    context.beginPath(); for (let y = -116; y < -12; y += 5) { context.moveTo(x - 8, y); context.lineTo(x + 8, y); } context.stroke();
    context.fillStyle = "#f1ece0"; context.fillRect(x - 10, -128, 20, 7);
  }
  context.strokeStyle = "#2f6b4f"; context.lineWidth = 3;
  context.beginPath(); context.moveTo(-50, -122); context.quadraticCurveTo(0, -150, 50, -122); context.stroke();
  context.fillStyle = "#f6f1e3"; context.strokeStyle = "#2f6b4f"; context.lineWidth = 1.6;
  context.beginPath(); context.roundRect(-26, -146, 52, 15, 3); context.fill(); context.stroke();
  context.fillStyle = "#24345e"; context.font = font; context.textAlign = "center"; context.textBaseline = "middle";
  context.fillText(sign, 0, -138.2);
  context.textBaseline = "alphabetic";
  stroke(context, "#5a4a3a", 0.8, [0, -131, 0, -120]);
}

/** One iron gate leaf, 48 wide from its hinge (x 0) toward the middle, 54 high. */
export function drawGateLeaf(context: Ctx) {
  context.strokeStyle = "#2f6b4f"; context.lineWidth = 1.4;
  context.beginPath();
  for (let bar = 0; bar <= 8; bar++) { const bx = bar * 6; context.moveTo(bx, -12); context.lineTo(bx, -66); }
  context.moveTo(0, -18); context.lineTo(48, -18); context.moveTo(0, -42); context.lineTo(48, -42); context.moveTo(0, -64); context.lineTo(48, -64);
  context.stroke();
  context.fillStyle = "#2f6b4f";
  for (let bar = 0; bar <= 8; bar++) { context.beginPath(); context.moveTo(bar * 6 - 1.5, -66); context.lineTo(bar * 6, -70); context.lineTo(bar * 6 + 1.5, -66); context.fill(); }
}

/** দারোয়ান চাচা by the gate: a khaki uniform, a cap, a moustache, one hand out for the gate. */
export function drawGuard(context: Ctx) {
  context.fillStyle = "#00000022"; context.beginPath(); context.ellipse(0, 0, 9, 2, 0, 0, Math.PI * 2); context.fill();
  stroke(context, "#5d4a2e", 4.4, [-3, -1, -3, -20]);
  stroke(context, "#5d4a2e", 4.4, [3, -1, 3, -20]);
  context.fillStyle = "#1f1a17"; context.fillRect(-6, -2, 6, 2.4); context.fillRect(1, -2, 6, 2.4);
  context.fillStyle = "#b8a06a"; context.beginPath(); context.roundRect(-7, -40, 14, 22, 3); context.fill();
  context.fillStyle = "#8a7444"; context.fillRect(-7, -22, 14, 2);
  stroke(context, "#b8a06a", 3.4, [-6, -37, -14, -27]);
  stroke(context, SKIN_DARK, 3, [-14, -27, -17, -22]);
  context.fillStyle = SKIN_DARK; context.beginPath(); context.arc(0, -46, 6, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#2a2a2a"; context.fillRect(-3.5, -44, 4, 1.2);
  context.fillStyle = "#5a4a2a"; context.beginPath(); context.roundRect(-7, -54, 14, 5, 2); context.fill(); context.fillRect(-9, -50, 10, 1.8);
}

/* ---------- the village strips and ground tiles (moved here from the old draw-scene.ts) ---------- */

/** The far strip behind the road is STRIP_W wide and STRIP_H high; a ground tile is TILE wide and TILE_H high. */
export const STRIP_W = 720, STRIP_H = 118, TILE = 96, TILE_H = 62;

function villagePalm(context: Ctx, x: number, base: number, height: number, color: string) {
  context.strokeStyle = color; context.lineWidth = 2.2; context.lineCap = "round";
  context.beginPath(); context.moveTo(x, base); context.quadraticCurveTo(x + 4, base - height * 0.6, x + 2, base - height); context.stroke();
  context.fillStyle = color;
  for (let leaf = 0; leaf < 7; leaf++) {
    const a = -Math.PI / 2 + (leaf - 3) * 0.5;
    context.beginPath(); context.ellipse(x + 2 + Math.cos(a) * 9, base - height + Math.sin(a) * 4 + 3, 11, 2.6, a, 0, Math.PI * 2); context.fill();
  }
}

function villageHut(context: Ctx, x: number, w: number, wall: string, roof: string) {
  const b = STRIP_H;
  context.fillStyle = wall; context.fillRect(x, b - 30, w, 30);
  context.fillStyle = roof;
  context.beginPath(); context.moveTo(x - 6, b - 28); context.lineTo(x + 8, b - 48); context.lineTo(x + w - 8, b - 48); context.lineTo(x + w + 6, b - 28); context.closePath(); context.fill();
  context.strokeStyle = "#00000026"; context.lineWidth = 0.8;
  context.beginPath(); for (let rx = x + 10; rx < x + w - 6; rx += 4) { context.moveTo(rx, b - 47); context.lineTo(rx - 5, b - 29); } context.stroke();
  context.fillStyle = "#4a5a6a"; context.fillRect(x + w * 0.2, b - 20, 9, 20);
  context.fillStyle = "#3d7d86"; context.fillRect(x + w * 0.6, b - 22, 12, 9);
  context.fillStyle = "#2e5f66"; context.fillRect(x + w * 0.6 + 5.4, b - 22, 1.2, 9);
}

export function paintVillageLane(context: Ctx) {
  const b = STRIP_H;
  context.fillStyle = "#8db38a";
  for (let x = -10; x < STRIP_W + 20; x += 34) { context.beginPath(); context.arc(x, b - 34 - ((x * 7) % 13), 22, 0, Math.PI * 2); context.fill(); }
  context.fillRect(0, b - 34, STRIP_W, 34);
  villageHut(context, 22, 70, "#e7c27a", "#8c9aa3");
  villagePalm(context, 108, b, 74, "#4f7a46");
  // A two-storey house with grilled windows and the black water tank on its roof.
  context.fillStyle = "#f1ead8"; context.fillRect(130, b - 72, 88, 72);
  context.fillStyle = "#e2d9c2"; context.fillRect(126, b - 76, 96, 5); context.fillRect(126, b - 40, 96, 3);
  context.fillStyle = "#3d6470";
  for (const wy of [b - 66, b - 32]) for (const wx of [140, 168, 196]) context.fillRect(wx, wy, 14, 14);
  context.strokeStyle = "#d9d1bd"; context.lineWidth = 0.8;
  context.beginPath(); for (const wy of [b - 66, b - 32]) for (const wx of [140, 168, 196]) for (let bar = 3; bar < 14; bar += 3.5) { context.moveTo(wx + bar, wy); context.lineTo(wx + bar, wy + 14); } context.stroke();
  context.fillStyle = "#2b2b2b"; context.beginPath(); context.roundRect(190, b - 92, 16, 16, 2); context.fill();
  context.fillStyle = "#444"; context.fillRect(188, b - 94, 20, 3);
  // A low brick wall in front.
  context.fillStyle = "#b9614a"; context.fillRect(120, b - 13, 116, 13);
  context.strokeStyle = "#94473a"; context.lineWidth = 0.6;
  context.beginPath(); for (let wy = b - 9; wy < b; wy += 4) { context.moveTo(120, wy); context.lineTo(236, wy); } context.stroke();
  // Banana plant.
  context.fillStyle = "#5f9a4a";
  context.fillRect(244, b - 30, 3, 30);
  for (const a of [-2.4, -1.9, -1.2, -0.7]) { context.beginPath(); context.ellipse(245 + Math.cos(a) * 11, b - 30 + Math.sin(a) * 9, 13, 4, a, 0, Math.PI * 2); context.fill(); }
  villageHut(context, 266, 66, "#9cc3a8", "#a5583c");
  // The tea stall: a wooden box, an awning, a bench, a kettle on the counter.
  context.fillStyle = "#8a5a36"; context.fillRect(352, b - 34, 62, 34);
  context.fillStyle = "#d9a441"; context.fillRect(350, b - 30, 66, 4);
  context.fillStyle = "#c2453a";
  context.beginPath(); context.moveTo(344, b - 36); context.lineTo(422, b - 36); context.lineTo(416, b - 46); context.lineTo(350, b - 46); context.closePath(); context.fill();
  context.fillStyle = "#f4ede0"; for (let sx = 356; sx < 414; sx += 12) context.fillRect(sx, b - 46, 5, 10);
  context.fillStyle = "#555"; context.beginPath(); context.ellipse(370, b - 32, 4, 3, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#6e4628"; context.fillRect(424, b - 9, 30, 3); context.fillRect(426, b - 6, 2, 6); context.fillRect(450, b - 6, 2, 6);
  villagePalm(context, 468, b, 66, "#4f7a46");
  villageHut(context, 486, 62, "#e4a9a0", "#7f8f98");
  context.strokeStyle = "#5d8f4a"; context.lineWidth = 2;
  context.beginPath(); for (let bx = 566; bx < 586; bx += 3) { context.moveTo(bx, b); context.quadraticCurveTo(bx + 5, b - 40, bx + 14 - (bx % 7), b - 66 + (bx % 9)); } context.stroke();
  villageHut(context, 610, 80, "#a9c6de", "#8c9aa3");
  // Electric poles every 240 units with two sagging wires, so the strip tiles.
  context.fillStyle = "#5a5a5a";
  for (const px of [120, 360, 600]) { context.fillRect(px - 1.2, b - 98, 2.4, 98); context.fillRect(px - 8, b - 94, 16, 2); }
  context.strokeStyle = "#3e3e3e88"; context.lineWidth = 0.7;
  context.beginPath();
  for (const px of [-120, 120, 360, 600]) for (const wx of [-7, 7]) { context.moveTo(px + wx, b - 93); context.quadraticCurveTo(px + 120 + wx, b - 80, px + 240 + wx, b - 93); }
  context.stroke();
}

export function paintVillageField(context: Ctx) {
  const b = STRIP_H;
  context.fillStyle = "#93b98f";
  for (let x = -10; x < STRIP_W + 20; x += 26) { context.beginPath(); context.arc(x, b - 30 - ((x * 11) % 12), 16, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#9aa7ad";
  for (const rx of [120, 380, 610]) { context.beginPath(); context.moveTo(rx, b - 36); context.lineTo(rx + 5, b - 42); context.lineTo(rx + 17, b - 42); context.lineTo(rx + 22, b - 36); context.closePath(); context.fill(); }
  for (const [px, ph] of [[80, 70], [300, 82], [520, 64], [668, 76]] as const) villagePalm(context, px, b - 22, ph, "#5c8656");
  const field = context.createLinearGradient(0, b - 28, 0, b);
  field.addColorStop(0, "#a9cf62"); field.addColorStop(1, "#7aa43c");
  context.fillStyle = field; context.fillRect(0, b - 28, STRIP_W, 28);
  context.strokeStyle = "#c4de8255"; context.lineWidth = 0.8;
  context.beginPath(); for (let y = b - 24; y < b; y += 5) { context.moveTo(0, y); context.lineTo(STRIP_W, y); } context.stroke();
  // A haystack round its pole, a pond and a cow grazing far off.
  context.fillStyle = "#d9b25a";
  context.beginPath(); context.moveTo(184, b - 18); context.quadraticCurveTo(186, b - 52, 204, b - 54); context.quadraticCurveTo(222, b - 52, 224, b - 18); context.closePath(); context.fill();
  context.strokeStyle = "#b48d3c"; context.lineWidth = 0.7;
  context.beginPath(); for (let y = b - 46; y < b - 20; y += 6) { context.moveTo(188, y); context.quadraticCurveTo(204, y + 3, 221, y); } context.stroke();
  context.fillStyle = "#6b4a2e"; context.fillRect(203, b - 62, 2, 10);
  context.fillStyle = "#6f9a4a"; context.beginPath(); context.ellipse(470, b - 12, 58, 11, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#8cc0d6"; context.beginPath(); context.ellipse(470, b - 12, 50, 8, 0, 0, Math.PI * 2); context.fill();
  context.fillStyle = "#c9e3ee"; context.fillRect(440, b - 15, 34, 1.4); context.fillRect(470, b - 10, 22, 1.2);
  context.fillStyle = "#7d5436";
  context.beginPath(); context.ellipse(612, b - 20, 9, 4.5, 0, 0, Math.PI * 2); context.fill();
  context.beginPath(); context.ellipse(602, b - 17, 3.2, 2.6, 0.5, 0, Math.PI * 2); context.fill();
  context.fillRect(606, b - 17, 1.4, 6); context.fillRect(617, b - 17, 1.4, 6);
}

export function paintBrickTile(context: Ctx) {
  context.fillStyle = "#7fae4b"; context.fillRect(0, 0, TILE, 5);
  context.strokeStyle = "#5f8d33"; context.lineWidth = 0.8;
  context.beginPath(); for (let x = 2; x < TILE; x += 6) { context.moveTo(x, 4); context.lineTo(x + 1.4, 0.6); } context.stroke();
  context.fillStyle = "#86452f"; context.fillRect(0, 4, TILE, 37);
  const colors = ["#b4553a", "#a64b33", "#c0623f", "#ad5136"];
  for (let row = 0; row < 8; row++) {
    for (let col = -1; col < TILE / 12 + 1; col++) {
      const x = col * 12 + (row % 2) * 6;
      context.fillStyle = colors[(col * 7 + row * 13 + 64) % 4];
      context.fillRect(x + 0.5, 4.5 + row * 4, 11, 3.2);
    }
  }
  context.fillStyle = "#9a4a33";
  for (let x = 0; x < TILE; x += 4) context.fillRect(x + 0.4, 37, 3.2, 4);
  const verge = context.createLinearGradient(0, 41, 0, 60);
  verge.addColorStop(0, "#8bb055"); verge.addColorStop(1, "#6f9440");
  context.fillStyle = verge; context.fillRect(0, 41, TILE, 22);
  context.strokeStyle = "#5c8433"; context.lineWidth = 1;
  context.beginPath(); for (let x = 3; x < TILE; x += 9) { context.moveTo(x, 50 + (x % 5)); context.lineTo(x - 1, 45 + (x % 4)); context.moveTo(x + 2, 50 + (x % 5)); context.lineTo(x + 4, 46); } context.stroke();
}

export function paintDirtTile(context: Ctx) {
  context.fillStyle = "#7aa43c"; context.fillRect(0, 0, TILE, 6);
  context.strokeStyle = "#5f8a2c"; context.lineWidth = 1;
  context.beginPath(); for (let x = 1; x < TILE; x += 4) { context.moveTo(x, 6); context.lineTo(x + 1, -1 + (x % 3)); } context.stroke();
  const path = context.createLinearGradient(0, 5, 0, 37);
  path.addColorStop(0, "#d4ab72"); path.addColorStop(1, "#c39761");
  context.fillStyle = path; context.fillRect(0, 5, TILE, 32);
  context.strokeStyle = "#ad8350"; context.lineWidth = 1.2;
  context.beginPath(); context.moveTo(0, 14); context.lineTo(TILE, 14); context.moveTo(0, 28); context.lineTo(TILE, 28); context.stroke();
  context.fillStyle = "#a57c4c";
  for (let index = 0; index < 9; index++) { const x = (index * 37) % TILE, y = 8 + ((index * 23) % 26); context.beginPath(); context.ellipse(x, y, 1.6, 0.9, 0, 0, Math.PI * 2); context.fill(); }
  context.fillStyle = "#6f9a3a"; context.fillRect(0, 37, TILE, 26);
  context.strokeStyle = "#8fbf4a"; context.lineWidth = 1.1;
  context.beginPath(); for (let x = 2; x < TILE; x += 5) { const y = 58 - (x % 3); context.moveTo(x, y); context.quadraticCurveTo(x - 1, y - 8, x - 3, y - 14); context.moveTo(x, y); context.quadraticCurveTo(x + 2, y - 9, x + 4, y - 13); } context.stroke();
}

export function paintSeamTree(context: Ctx) {
  // A big mango tree that stands where the lane gives way to the field (it hides the seam between the two strips).
  context.fillStyle = "#5a3d26"; context.fillRect(-5, -70, 10, 70);
  for (const [x, y, r, c] of [[-22, -84, 22, "#2f5a26"], [18, -88, 24, "#2f5a26"], [0, -104, 26, "#3b6c2d"], [-12, -76, 18, "#3b6c2d"], [14, -72, 18, "#4c8236"], [-4, -90, 20, "#4c8236"]] as const) {
    context.fillStyle = c; context.beginPath(); context.arc(x, y, r, 0, Math.PI * 2); context.fill();
  }
}

