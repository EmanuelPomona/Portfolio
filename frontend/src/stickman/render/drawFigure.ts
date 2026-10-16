// Owner: agent/stickman. Canvas renderer, ported from the prototype's limb() and draw().
// It does not clear or set the device-pixel transform: the caller owns the canvas.
import { RIG_UNITS, holdPencil, type Limb, type Pose } from '../engine/pose';
import type { Vec2 } from '../engine/vec';

export interface DrawOptions {
  /** Figure height in CSS px. */
  size: number;
  facing: 1 | -1;
  /**
   * Continuous horizontal mirror in [−1, 1], overriding facing for the x scale: a flat figure
   * turning edge-on. The loader uses it so his planted pencil tip never jumps as he turns.
   */
  mirror?: number;
  /** Stroke width in CSS px (see lineWidthFor). */
  lineWidth: number;
  color: string;
  /** Hold the loader's pencil in the front hand. */
  pencil?: boolean;
}

const PENCIL_HALF_WIDTH = 3;
const PENCIL_CONE = 7;
const PENCIL_FERRULE = 6;

function strokeLimb(ctx: CanvasRenderingContext2D, l: Limb): void {
  ctx.beginPath();
  ctx.moveTo(l.root.x, l.root.y);
  ctx.lineTo(l.joint.x, l.joint.y);
  ctx.lineTo(l.end.x, l.end.y);
  ctx.stroke();
}

/** The loader's pencil, in rig units, in the current transform (tip and top end of the shaft). */
export function strokePencil(ctx: CanvasRenderingContext2D, tip: Vec2, top: Vec2): void {
  const len = Math.hypot(top.x - tip.x, top.y - tip.y);
  const u = { x: (top.x - tip.x) / len, y: (top.y - tip.y) / len };
  const n = { x: -u.y * PENCIL_HALF_WIDTH, y: u.x * PENCIL_HALF_WIDTH };
  const along = (d: number) => ({ x: tip.x + u.x * d, y: tip.y + u.y * d });
  const cone = along(PENCIL_CONE);
  const ferrule = along(len - PENCIL_FERRULE);

  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(cone.x + n.x, cone.y + n.y);
  ctx.lineTo(top.x + n.x, top.y + n.y);
  ctx.lineTo(top.x - n.x, top.y - n.y);
  ctx.lineTo(cone.x - n.x, cone.y - n.y);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cone.x + n.x, cone.y + n.y);
  ctx.lineTo(cone.x - n.x, cone.y - n.y);
  ctx.moveTo(ferrule.x + n.x, ferrule.y + n.y);
  ctx.lineTo(ferrule.x - n.x, ferrule.y - n.y);
  ctx.stroke();
}

export function drawFigure(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  at: Vec2,
  opts: DrawOptions,
): void {
  const k = opts.size / RIG_UNITS;
  const held = opts.pencil ? holdPencil(pose) : null;
  const p = held ?? pose;

  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(k * (opts.mirror ?? opts.facing), k);
  ctx.strokeStyle = opts.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = opts.lineWidth / k;

  strokeLimb(ctx, p.legs[0]);
  strokeLimb(ctx, p.legs[1]);

  ctx.beginPath();
  ctx.moveTo(p.hip.x, p.hip.y);
  ctx.lineTo(p.neck.x, p.neck.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(p.head.x, p.head.y, p.headRadius, 0, Math.PI * 2);
  ctx.stroke();

  strokeLimb(ctx, p.arms[0]);
  strokeLimb(ctx, p.arms[1]);

  if (held) strokePencil(ctx, held.pencil.tip, held.pencil.top);

  ctx.restore();
}
