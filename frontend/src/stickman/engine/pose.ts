// Owner: agent/stickman. The rig, ported from the owner-approved prototype's draw(). Pure.
//
// Local space: the figure is 40 units tall, feet at the origin, y down, +x is the way he faces.
// The renderer scales by size / 40 and mirrors by facing. Angles follow the prototype: a segment at
// angle a runs (sin a, cos a), so 0 points straight down and +π/2 points forward.
import type { GestureState } from './gestures';
import type { MotionState } from './motion';
import { clamp, lerp, type Vec2 } from './vec';

export interface Limb {
  root: Vec2;
  joint: Vec2;
  end: Vec2;
}

export interface Pose {
  hip: Vec2;
  shoulder: Vec2;
  neck: Vec2;
  head: Vec2;
  headRadius: number;
  /** [front, back] */
  legs: readonly [Limb, Limb];
  /** [front, back]. The front arm points and holds the pencil. */
  arms: readonly [Limb, Limb];
}

export interface PencilPose extends Pose {
  pencil: { tip: Vec2; top: Vec2 };
}

/** The relaxed front-arm angle the prototype uses when nothing is being pointed at. */
export const REST_POINT_ANGLE = 1.2;

const RIG_UNITS = 40;
const THIGH = 8;
const SHIN = 8;
const UPPER_ARM = 6.4;
const FOREARM = 6;
const HIP_Y = -16;
const SHOULDER_UP = 11;
const NECK_UP = 13.2;
const HEAD_UP = 17.4;
const HEAD_R = 3.9;

/** Run blend: 0 at or below 220 px/s, 1 at 720 px/s and above. */
export function runBlend(speed: number): number {
  return clamp((speed - 220) / 500, 0, 1);
}

/** Stroke width in CSS px for a figure `size` px tall (prototype values). */
export function lineWidthFor(size: number): number {
  return size < 15 ? 1.15 : size < 22 ? 1.45 : 1.8;
}

function limb(root: Vec2, a1: number, l1: number, a2: number, l2: number): Limb {
  const joint = { x: root.x + Math.sin(a1) * l1, y: root.y + Math.cos(a1) * l1 };
  const end = { x: joint.x + Math.sin(a2) * l2, y: joint.y + Math.cos(a2) * l2 };
  return { root, joint, end };
}

interface Torso {
  walk: number;
  run: number;
  sit: number;
  hip: Vec2;
  shoulder: Vec2;
  neck: Vec2;
  head: Vec2;
}

function torso(s: MotionState, g: GestureState): Torso {
  const walk = clamp(s.speed / 60, 0, 1);
  const run = runBlend(s.speed) * walk;
  const sit = g.sit * (1 - walk);
  const hop = g.cheer > 0.55 ? Math.sin(((1 - g.cheer) / 0.45) * Math.PI) * 5 : 0;
  const bob = -Math.abs(Math.sin(s.phase)) * 1.4 * walk;
  const lean = 0.16 * run;
  const hip = { x: 0, y: HIP_Y + bob + sit * 8 - hop };
  const up = (len: number) => ({
    x: hip.x + Math.sin(lean) * len,
    y: hip.y - Math.cos(lean) * len,
  });
  return { walk, run, sit, hip, shoulder: up(SHOULDER_UP), neck: up(NECK_UP), head: up(HEAD_UP) };
}

/**
 * Angle (in rig convention) from his shoulder to a screen-space target, for computePose's
 * pointAngle. `s.pos` is his feet on screen.
 */
export function pointAngleTo(s: MotionState, g: GestureState, size: number, target: Vec2): number {
  const k = size / RIG_UNITS;
  const { shoulder } = torso(s, g);
  const sx = s.pos.x + shoulder.x * k * s.facing;
  const sy = s.pos.y + shoulder.y * k;
  return Math.atan2((target.x - sx) * s.facing, target.y - sy);
}

export function computePose(
  s: MotionState,
  g: GestureState,
  pointAngle: number,
  clock: number,
): Pose {
  const { walk, run, sit, hip, shoulder, neck, head } = torso(s, g);
  const ph = s.phase;
  const swing = (0.5 + 0.35 * run) * walk;
  const cheer = g.cheer > 0 ? Math.min(1, g.cheer * 4) : 0;
  const wave = Math.sin(clock * 22) * 0.35;

  const leg = (side: 1 | -1): Limb => {
    let a = side * Math.sin(ph) * swing;
    const lift = Math.max(0, Math.sin(ph + (side > 0 ? Math.PI / 2 : -Math.PI / 2)));
    const bend = (0.15 + lift * (0.7 + 0.5 * run)) * walk;
    let a2 = a - bend;
    a = lerp(a, 1.45, sit);
    a2 = lerp(a2, 0.05, sit);
    return limb(hip, a, THIGH, a2, SHIN);
  };

  const arm = (side: 1 | -1): Limb => {
    let a = -side * Math.sin(ph) * swing * 0.9 + (side > 0 ? 0.08 : -0.04);
    let a2 = a + (0.25 + 0.5 * run) * walk + 0.12;
    a = lerp(a, side > 0 ? 0.35 : -0.25, sit);
    a2 = lerp(a2, side > 0 ? 0.9 : 0.3, sit);
    const upA = side > 0 ? Math.PI - 0.5 : -(Math.PI - 0.5);
    a = lerp(a, upA, cheer);
    a2 = lerp(a2, upA + (side > 0 ? wave : -wave), cheer);
    if (side > 0) {
      a = lerp(a, pointAngle, g.point);
      a2 = lerp(a2, pointAngle, g.point);
    }
    return limb(shoulder, a, UPPER_ARM, a2, FOREARM);
  };

  return {
    hip,
    shoulder,
    neck,
    head,
    headRadius: HEAD_R,
    legs: [leg(1), leg(-1)],
    arms: [arm(1), arm(-1)],
  };
}

// ---- the loader's pencil -------------------------------------------------------------------------

/** Pencil tip in rig space: on the ground line, just ahead of his feet. */
export const PENCIL_TIP: Readonly<Vec2> = Object.freeze({ x: 10, y: 0 });
/** Rig units. He is 40 units tall; the wireframe's pencil is much larger than he is. */
export const PENCIL_LENGTH = 50;
/** Lean of the shaft back from vertical, so the top rises behind his head. */
const PENCIL_TILT = 0.44;
/** Preferred grip, in rig units from the tip along the shaft. */
const GRIP_FROM_TIP = 20;

/**
 * Returns the pose with the front hand gripping a large pencil whose tip stays planted at
 * PENCIL_TIP, so a line traced at the tip is continuous however he walks. Two-bone IK for the arm.
 */
export function holdPencil(pose: Pose): PencilPose {
  const tip = { x: PENCIL_TIP.x, y: PENCIL_TIP.y };
  const dir = { x: -Math.sin(PENCIL_TILT), y: -Math.cos(PENCIL_TILT) };
  const top = { x: tip.x + dir.x * PENCIL_LENGTH, y: tip.y + dir.y * PENCIL_LENGTH };
  const at = (u: number) => ({ x: tip.x + dir.x * u, y: tip.y + dir.y * u });

  const S = pose.shoulder;
  const reach = (UPPER_ARM + FOREARM) * 0.97;
  // Closest point on the shaft line to the shoulder, then the reachable stretch around it.
  const u0 = (S.x - tip.x) * dir.x + (S.y - tip.y) * dir.y;
  const foot = at(u0);
  const h = Math.hypot(S.x - foot.x, S.y - foot.y);
  const w = h < reach ? Math.sqrt(reach * reach - h * h) : 0;
  const u = clamp(GRIP_FROM_TIP, Math.max(0, u0 - w), Math.min(PENCIL_LENGTH, u0 + w));
  const grip = at(u);

  const d = clamp(
    Math.hypot(grip.x - S.x, grip.y - S.y),
    Math.abs(UPPER_ARM - FOREARM) + 1e-6,
    UPPER_ARM + FOREARM - 1e-6,
  );
  const base = Math.atan2(grip.x - S.x, grip.y - S.y);
  const cosA = (UPPER_ARM * UPPER_ARM + d * d - FOREARM * FOREARM) / (2 * UPPER_ARM * d);
  const a1 = base - Math.acos(clamp(cosA, -1, 1)); // elbow bends back and down
  const joint = { x: S.x + Math.sin(a1) * UPPER_ARM, y: S.y + Math.cos(a1) * UPPER_ARM };
  const a2 = Math.atan2(grip.x - joint.x, grip.y - joint.y);
  const front = limb(S, a1, UPPER_ARM, a2, FOREARM);

  return { ...pose, arms: [front, pose.arms[1]], pencil: { tip, top } };
}
