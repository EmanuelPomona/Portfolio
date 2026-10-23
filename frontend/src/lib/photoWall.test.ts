import { describe, expect, it } from 'vitest';
import { CAPTION_MIN_ROWS, orientationOf, planWall, ROW_UNIT, type Tile, type WallItem, type WallLayout } from './photoWall';

const COLUMNS = [2, 4, 6] as const;
const COUNTS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Ratio mixes the wall must handle, as a ratio for the i-th photo. */
const MIXES: Record<string, (i: number) => number> = {
  'all portrait': () => 2 / 3,
  'all landscape': () => 4 / 3,
  'all square': () => 1,
  alternating: (i) => (i % 2 === 0 ? 3 / 2 : 2 / 3),
  // Today's five slots (4:3, 2:3, 4:3, 9:16, 4:3), repeating.
  "today's aspects": (i) => [4 / 3, 2 / 3, 4 / 3, 9 / 16, 4 / 3][i % 5]!,
};

function items(n: number, ratio: (i: number) => number): WallItem[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, ratio: ratio(i) }));
}

/** A tile's own ratio: colSpan / (rowSpan * ROW_UNIT), gutters ignored. */
const tileRatio = (t: Tile) => t.colSpan / (t.rowSpan * ROW_UNIT);

/** Every cell of the rectangle covered by exactly one tile, every tile inside it. */
function coverage(layout: WallLayout): { gaps: number; overlaps: number; outside: number } {
  const counts = new Map<string, number>();
  let outside = 0;
  for (const t of layout.tiles) {
    for (let r = t.row; r < t.row + t.rowSpan; r++) {
      for (let c = t.col; c < t.col + t.colSpan; c++) {
        if (r < 1 || c < 1 || r > layout.rows || c > layout.columns) outside++;
        counts.set(`${r},${c}`, (counts.get(`${r},${c}`) ?? 0) + 1);
      }
    }
  }
  let gaps = 0;
  let overlaps = 0;
  for (let r = 1; r <= layout.rows; r++) {
    for (let c = 1; c <= layout.columns; c++) {
      const k = counts.get(`${r},${c}`) ?? 0;
      if (k === 0) gaps++;
      if (k > 1) overlaps += k - 1;
    }
  }
  return { gaps, overlaps, outside };
}

/** Every combination the wall must handle: n = 1..12 x columns x mixes, planned once. */
let walls: { mix: string; columns: 2 | 4 | 6; n: number; input: WallItem[]; layout: WallLayout }[] | null = null;
function everyWall() {
  if (!walls) {
    walls = [];
    for (const [mix, ratio] of Object.entries(MIXES)) {
      for (const columns of COLUMNS) {
        for (const n of COUNTS) {
          const input = items(n, ratio);
          walls.push({ mix, columns, n, input, layout: planWall(input, columns) });
        }
      }
    }
  }
  return walls;
}

describe('photoWall', () => {
  it('orientationOf classes ratios: below 0.85 portrait, above 1.18 landscape, else square', () => {
    expect(orientationOf(2 / 3)).toBe('portrait');
    expect(orientationOf(9 / 16)).toBe('portrait');
    expect(orientationOf(0.849)).toBe('portrait');
    expect(orientationOf(0.85)).toBe('square');
    expect(orientationOf(1)).toBe('square');
    expect(orientationOf(1.18)).toBe('square');
    expect(orientationOf(1.181)).toBe('landscape');
    expect(orientationOf(4 / 3)).toBe('landscape');
    expect(orientationOf(4)).toBe('landscape');
    expect(orientationOf(1 / 3)).toBe('portrait');
  });

  it('fills the rectangle exactly: every cell covered once, no overlap', { timeout: 30_000 }, () => {
    for (const { mix, columns, n, input, layout } of everyWall()) {
      const where = `${mix}, n=${n}, ${columns} columns`;
      expect(layout.columns, where).toBe(columns);
      expect(layout.tiles, where).toHaveLength(n);
      // One tile per photo, each photo once.
      expect(new Set(layout.tiles.map((t) => t.id)), where).toEqual(new Set(input.map((p) => p.id)));
      expect(coverage(layout), where).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
      for (const t of layout.tiles) {
        expect(Number.isInteger(t.col) && Number.isInteger(t.row) && t.colSpan >= 1 && t.rowSpan >= 1, where).toBe(true);
      }
    }
  });

  it('is deterministic: the same items give the same layout', () => {
    for (const columns of COLUMNS) {
      for (const n of [1, 3, 5, 7, 12]) {
        const input = items(n, MIXES["today's aspects"]!);
        expect(planWall(input, columns)).toEqual(planWall(input.map((p) => ({ ...p })), columns));
      }
    }
  });

  it('no tile is shorter than two row units, at any column count', () => {
    // Two row units are one column width: a one-row tile is a sliver that reads as filler, not as
    // an art-directed photo (manager ruling, round 4).
    for (const { mix, columns, n, layout } of everyWall()) {
      const where = `${mix}, n=${n}, ${columns} columns: ${layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`).join(' ')}`;
      for (const t of layout.tiles) expect(t.rowSpan, where).toBeGreaterThanOrEqual(2);
    }
  });

  it('varies spans: with 3 or more photos, at least two column spans and two row spans', () => {
    for (const { mix, columns, n, layout } of everyWall()) {
      if (n < 3) continue;
      const where = `${mix}, n=${n}, ${columns} columns`;
      expect(new Set(layout.tiles.map((t) => t.colSpan)).size, where).toBeGreaterThanOrEqual(2);
      expect(new Set(layout.tiles.map((t) => t.rowSpan)).size, where).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps every tile within a factor of 2 of its photo\'s ratio, even for extremes', { timeout: 30_000 }, () => {
    // A 4:1 panorama and a 1:3 phone screenshot among ordinary photos.
    const extremes = (i: number) => [4, 1 / 3, 4 / 3, 2 / 3, 1, 16 / 9][i % 6]!;
    const extremeWalls = COLUMNS.flatMap((columns) =>
      COUNTS.map((n) => ({ mix: 'extremes', columns, n, input: items(n, extremes), layout: planWall(items(n, extremes), columns) })),
    );
    for (const { mix, columns, n, input, layout } of [...everyWall(), ...extremeWalls]) {
      const ratioOf = new Map(input.map((p) => [p.id, p.ratio]));
      for (const t of layout.tiles) {
        const p = ratioOf.get(t.id)!;
        const factor = Math.max(tileRatio(t) / p, p / tileRatio(t));
        expect(factor, `${mix}, n=${n}, ${columns} columns, ${t.id} (${p.toFixed(2)}) in ${t.colSpan}x${t.rowSpan}`).toBeLessThanOrEqual(2 + 1e-9);
      }
      expect(coverage(layout), `${mix}, n=${n}, ${columns} columns`).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
    }
  });

  it('staggers rows: with 4 or more photos on 4 and 6 columns, no horizontal gutter crosses the full width', () => {
    for (const { mix, columns, n, layout } of everyWall()) {
      if (n < 4 || columns === 2) continue;
      // A row boundary y is a full-width gutter when no tile crosses it.
      const crossing = (y: number) => layout.tiles.some((t) => t.row <= y && t.row + t.rowSpan - 1 > y);
      const gutters = Array.from({ length: layout.rows - 1 }, (_, i) => i + 1).filter((y) => !crossing(y));
      expect(gutters, `${mix}, n=${n}, ${columns} columns`).toEqual([]);
    }
  });

  it('gives every photo a tile of its own orientation, up to 6 photos on 4 and 6 columns', () => {
    const extremes = (i: number) => [4, 1 / 3, 4 / 3, 2 / 3, 1, 16 / 9][i % 6]!;
    const cases = [
      ...everyWall(),
      ...([4, 6] as const).flatMap((columns) =>
        COUNTS.map((n) => ({ mix: 'extremes', columns, n, input: items(n, extremes), layout: planWall(items(n, extremes), columns) })),
      ),
    ];
    for (const { mix, columns, n, input, layout } of cases) {
      if (n > 6 || columns === 2) continue;
      const ratioOf = new Map(input.map((p) => [p.id, p.ratio]));
      const misses = layout.tiles.filter((t) => orientationOf(tileRatio(t)) !== orientationOf(ratioOf.get(t.id)!));
      const where = `${mix}, n=${n}, ${columns} columns: ${misses.map((t) => `${t.id} in ${t.colSpan}x${t.rowSpan}`).join(', ')}`;
      // An exhaustive search proves 4 or 5 square photos on 6 columns cannot all get strictly square
      // tiles (0.85 to 1.18) while the wall also varies its spans and staggers its gutters (A-04).
      // There, and only there, one square photo may take a near-square tile, between 0.75 and 1.34.
      const squaresOnSix = columns === 6 && (n === 4 || n === 5) && input.every((p) => orientationOf(p.ratio) === 'square');
      // And once every tile is at least two rows tall, 4 or more landscape-only photos on 4 columns
      // cannot all get landscape tiles: a 1-wide landscape tile is then impossible (1x2 is square), so
      // a 3-wide tile cannot be placed either, a full-width one leaves a full-width gutter, and only
      // 2-wide tiles remain, which breaks span variety. There every miss is a near-square tile.
      // (Some mostly-landscape sets on 4 columns are impossible too, e.g. 4:3, 3:2, 16:9 and 2:3 by
      // exhaustive search; the planner falls back the same way. The mixes here do not include one.)
      const landscapesOnFour = columns === 4 && n >= 4 && input.every((p) => orientationOf(p.ratio) === 'landscape');
      if (squaresOnSix) {
        expect(misses.length, where).toBeLessThanOrEqual(1);
        for (const t of misses) expect(tileRatio(t) >= 0.75 && tileRatio(t) <= 1.34, where).toBe(true);
      } else if (landscapesOnFour) {
        for (const t of misses) expect(tileRatio(t) >= 0.75 && tileRatio(t) <= 1.34, where).toBe(true);
      } else {
        expect(misses, where).toEqual([]);
      }
    }
  });

  it("keeps nearly every photo's orientation in packed walls of 7 and 8 photos on 4 and 6 columns", () => {
    // Content held at most 8 photos (C-17, now 12). Each half of a packed wall keeps its photos'
    // shapes when it can (A-05). Since every tile spans at least two rows, a landscape cannot be one
    // column wide, so landscape-heavy halves cannot vary their widths and give orientation up; this
    // pins the share at what that allows: at least 90% of tiles (97% before the two-row rule).
    const SHAPES = [4 / 3, 3 / 4, 16 / 9, 9 / 16, 1, 3 / 2, 2 / 3, 4 / 5, 0.462];
    const samples = [
      ...Object.entries(MIXES).map(([mix, ratio]) => ({ mix, ratio })),
      ...Array.from({ length: 12 }, (_, s) => ({ mix: `camera sample ${s}`, ratio: (i: number) => SHAPES[(s * 7 + i * 5 + ((s * i) % 3)) % SHAPES.length]! })),
    ];
    let tiles = 0;
    let kept = 0;
    for (const { mix, ratio } of samples) {
      for (const columns of [4, 6] as const) {
        for (const n of [7, 8]) {
          const input = items(n, ratio);
          const layout = planWall(input, columns);
          const ratioOf = new Map(input.map((p) => [p.id, p.ratio]));
          expect(coverage(layout), `${mix}, n=${n}, ${columns} columns`).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
          tiles += layout.tiles.length;
          kept += layout.tiles.filter((t) => orientationOf(tileRatio(t)) === orientationOf(ratioOf.get(t.id)!)).length;
        }
      }
    }
    expect(tiles).toBe(510);
    expect(kept / tiles).toBeGreaterThanOrEqual(0.9);
  });

  it('packs 7 to 12 photos into a staggered wall, never a stack of full-width cards', () => {
    // A full-width stack is the uniform grid the owner ruled out. The extremes mix (4:1 and 1:3
    // among ordinary photos) is the hardest the tests know.
    const extremes = (i: number) => [4, 1 / 3, 4 / 3, 2 / 3, 1, 16 / 9][i % 6]!;
    const mixes = [...Object.entries(MIXES), ['extremes', extremes] as const];
    for (const [mix, ratio] of mixes) {
      for (const columns of COLUMNS) {
        for (let n = 7; n <= 12; n++) {
          const layout = planWall(items(n, ratio), columns);
          const where = `${mix}, n=${n}, ${columns} columns: ${layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`).join(' ')}`;
          expect(layout.tiles.every((t) => t.colSpan === columns), where).toBe(false);
          if (columns >= 4) {
            const crossing = (y: number) => layout.tiles.some((t) => t.row <= y && t.row + t.rowSpan - 1 > y);
            expect(Array.from({ length: layout.rows - 1 }, (_, i) => i + 1).filter((y) => !crossing(y)), where).toEqual([]);
          }
        }
      }
    }
  });

  it('crops uniform panoramas up to 4:1 within a factor of 2, phones included', () => {
    // With two-row tiles the widest phone tile is 2x2 (2:1), so 4:1 is the widest photo it can
    // hold within the crop limit; varied tile sizes give way before the crop limit does.
    for (const ratio of [3, 4]) {
      for (const columns of COLUMNS) {
        for (let n = 1; n <= 8; n++) {
          const layout = planWall(items(n, () => ratio), columns);
          for (const t of layout.tiles) {
            const factor = Math.max(tileRatio(t) / ratio, ratio / tileRatio(t));
            expect(factor, `${n} x ${ratio}:1 on ${columns} columns: ${t.id} in ${t.colSpan}x${t.rowSpan}`).toBeLessThanOrEqual(2 + 1e-9);
          }
        }
      }
    }
  });

  it('composes 1 and 2 photos into a solid, intentional rectangle', () => {
    for (const { mix, columns, n, input, layout } of everyWall()) {
      if (n > 2) continue;
      const where = `${mix}, n=${n}, ${columns} columns: ${layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`).join(' ')}`;
      const ratioOf = new Map(input.map((p) => [p.id, p.ratio]));
      const factor = (t: Tile) => Math.max(tileRatio(t) / ratioOf.get(t.id)!, ratioOf.get(t.id)! / tileRatio(t));
      if (n === 1) {
        // One photo is the whole wall, at its own shape.
        expect(layout.tiles[0], where).toMatchObject({ col: 1, row: 1, colSpan: columns, rowSpan: layout.rows });
        expect(factor(layout.tiles[0]!), where).toBeLessThanOrEqual(1.2);
        continue;
      }
      // Two photos: never a heavy crop to dodge symmetry.
      for (const t of layout.tiles) expect(factor(t), where).toBeLessThanOrEqual(1.5);
      if (columns >= 4) {
        // A spread: side by side across the full height.
        for (const t of layout.tiles) expect(t.row === 1 && t.rowSpan === layout.rows, where).toBe(true);
      }
    }
  });

  it('sets two camera-shape photos side by side across the full height on 4 and 6 columns', () => {
    // Never two cards stacked across the full width when a spread can keep both photos' shapes.
    const SHAPES = [4 / 3, 3 / 4, 16 / 9, 9 / 16, 1, 3 / 2, 2 / 3, 4 / 5, 0.462];
    const keeps = (c: number, r: number, p: number) => {
      const t = c / (r * ROW_UNIT);
      return orientationOf(t) === orientationOf(p) && Math.max(t / p, p / t) <= 2 + 1e-9;
    };
    // Brute force: some split of the columns, at some common height, keeps both photos' shapes.
    const spreadExists = (a: number, b: number, columns: number) =>
      Array.from({ length: columns - 1 }, (_, i) => i + 1).some((c) =>
        Array.from({ length: 4 * columns }, (_, i) => i + 1).some((r) => keeps(c, r, a) && keeps(columns - c, r, b)),
      );
    let spreads = 0;
    for (const columns of [4, 6] as const) {
      for (const a of SHAPES) {
        for (const b of SHAPES) {
          const layout = planWall([{ id: 'p1', ratio: a }, { id: 'p2', ratio: b }], columns);
          const where = `${a.toFixed(3)} + ${b.toFixed(3)} on ${columns}: ${layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`).join(' ')}`;
          expect(coverage(layout), where).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
          // Each photo keeps its own shape (A-05), spread or not.
          for (const t of layout.tiles) expect(keeps(t.colSpan, t.rowSpan, t.id === 'p1' ? a : b), where).toBe(true);
          if (spreadExists(a, b, columns)) {
            spreads++;
            for (const t of layout.tiles) expect(t.row === 1 && t.rowSpan === layout.rows, where).toBe(true);
          }
        }
      }
    }
    expect(spreads).toBeGreaterThan(100); // most pairs (of 162) can be a spread
  });

  it('gives a captioned photo a tile at least two rows tall, so a 120-character label fits', () => {
    // Measured with the label's CSS at the narrowest column (1024px, 6 columns): a 120-character
    // label is 135px tall in a 147px 1x2 tile; a one-row tile (70px) would cut it.
    expect(CAPTION_MIN_ROWS).toBe(2);
    for (const [mix, ratio] of Object.entries(MIXES)) {
      for (const columns of COLUMNS) {
        for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
          for (const which of ['every other', 'all'] as const) {
            const input = items(n, ratio).map((p, i) => ({ ...p, captioned: which === 'all' || i % 2 === 0 }));
            const layout = planWall(input, columns);
            const where = `${mix}, n=${n}, ${columns} columns, ${which} captioned: ${layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`).join(' ')}`;
            expect(coverage(layout), where).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
            for (const t of layout.tiles) {
              if (input.find((p) => p.id === t.id)!.captioned) expect(t.rowSpan, where).toBeGreaterThanOrEqual(CAPTION_MIN_ROWS);
            }
          }
        }
      }
    }
  });

  it('2 columns: a solid rectangle with at least two tile sizes', () => {
    for (const { mix, columns, n, layout } of everyWall()) {
      if (columns !== 2 || n < 2) continue;
      const where = `${mix}, n=${n}: ${layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`).join(' ')}`;
      expect(coverage(layout), where).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
      // Never a single column of equal cards: at least two different tiles.
      expect(new Set(layout.tiles.map((t) => `${t.colSpan}x${t.rowSpan}`)).size, where).toBeGreaterThanOrEqual(2);
    }
  });

  it("composes today's five photos on 6 columns like the reference: a two-column feature, full height", () => {
    // The owner's reference: a feature tile two columns wide down the whole wall, the rest broken
    // at staggered heights. Never one giant tile beside a strip of stacked cards (F-111 defect).
    const input = items(5, MIXES["today's aspects"]!);
    const layout = planWall(input, 6);
    const shape = layout.tiles.map((t) => `${t.id} ${t.colSpan}x${t.rowSpan}`).join(', ');
    const full = layout.tiles.filter((t) => t.rowSpan === layout.rows);
    expect(full.map((t) => t.id), shape).toEqual(['p4']); // the 9:16 portrait
    expect(full[0]!.colSpan, shape).toBe(2);
    // No other tile spans more than half the wall, and the wall is wider than it is tall.
    for (const t of layout.tiles) expect(t.colSpan, shape).toBeLessThanOrEqual(3);
    expect(layout.rows * ROW_UNIT, shape).toBeLessThan(6);
  });

  it('plans fast enough to run in render: under 200 ms for six photos of one camera shape', () => {
    // The planner runs on the main thread at first render and at every breakpoint change. Six
    // photos of one shape is its hardest search. Camera and phone shapes, and a 1:3 screenshot.
    // Alone each plans in about 70 ms or less; the bound leaves room for a busy test machine, and
    // still fails the old search (0.6 to 1.3 s).
    const SHAPES = [4 / 3, 3 / 4, 16 / 9, 9 / 16, 1, 3 / 2, 2 / 3, 4 / 5, 0.462, 1 / 3];
    planWall(items(3, MIXES["today's aspects"]!), 6); // warm up
    for (const columns of COLUMNS) {
      for (const ratio of SHAPES) {
        // Best of three, so one slow run cannot fail it.
        let ms = Infinity;
        for (let run = 0; run < 3; run++) {
          const t0 = performance.now();
          planWall(items(6, () => ratio), columns);
          ms = Math.min(ms, performance.now() - t0);
        }
        // Shared CI runners are slower than a dev machine (GitHub measured 241 ms here); 500 ms on
        // CI still fails the old search, which never ran under 600 ms.
        expect(ms, `six ${ratio.toFixed(3)} on ${columns} columns`).toBeLessThan(process.env.CI ? 500 : 200);
      }
    }
  });

  it('uses curated patterns up to 6 photos and packing from 7', () => {
    for (const { mix, columns, n, layout } of everyWall()) {
      expect(layout.source, `${mix}, n=${n}, ${columns} columns`).toBe(n <= 6 ? 'curated' : 'packed');
    }
    // A seventh photo switches to packing without breaking the wall.
    const six = planWall(items(6, MIXES["today's aspects"]!), 6);
    const seven = planWall(items(7, MIXES["today's aspects"]!), 6);
    expect([six.source, seven.source]).toEqual(['curated', 'packed']);
    expect(coverage(seven)).toEqual({ gaps: 0, overlaps: 0, outside: 0 });
  });
});
