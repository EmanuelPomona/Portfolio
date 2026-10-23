// Owner: agent/frontend. The About photo wall's planner (TASK-111, ADR-013): photos in, explicit
// CSS Grid placements out. Pure and deterministic: no randomness, no Date, no layout reads.

export type Orientation = 'portrait' | 'landscape' | 'square';

/** A photo's shape class from its ratio (width / height). */
export function orientationOf(ratio: number): Orientation {
  if (ratio < 0.85) return 'portrait';
  if (ratio > 1.18) return 'landscape';
  return 'square';
}

/** A photo to place: its id and ratio (width / height). */
export interface WallItem {
  readonly id: string;
  readonly ratio: number;
  /** The photo has a caption: its tile is at least CAPTION_MIN_ROWS tall, so the label fits. */
  readonly captioned?: boolean;
}

/**
 * Rows a captioned photo's tile spans at least: never a one-row strip. Measured with the label's
 * CSS, a 120-character caption fits a 1x2 tile at every width, the narrowest being 147px at 1024
 * (label 135px). Three rows would fit more but slows the search for same-shape sets (seconds).
 */
export const CAPTION_MIN_ROWS = 2;

/** A photo's placement: 1-based grid starts and spans. */
export interface Tile {
  readonly id: string;
  readonly col: number;
  readonly row: number;
  readonly colSpan: number;
  readonly rowSpan: number;
}

export interface WallLayout {
  readonly columns: number;
  readonly rows: number;
  readonly source: 'curated' | 'packed';
  readonly tiles: readonly Tile[];
}

/** A row is half a column wide: a tile's ratio is colSpan / (rowSpan * ROW_UNIT), gutters ignored. */
export const ROW_UNIT = 0.5;

/** What a composition must satisfy. */
interface Rules {
  /** Every tile keeps its photo's orientation. */
  readonly orientation: boolean;
  /** Largest allowed tile-to-photo ratio factor, either way. */
  readonly maxFactor: number;
  /** At least two column spans and two row spans. */
  readonly variety: boolean;
  /** No horizontal gutter crosses the full width. */
  readonly stagger: boolean;
  /** At least this many distinct tile sizes (colSpan x rowSpan). */
  readonly distinctSizes: number;
  /** Every tile runs the wall's full height: two photos side by side, never stacked. */
  readonly spread: boolean;
  /** Rows where this composition may not have a full-width gutter (its neighbour has one there). */
  readonly avoidBreaks?: ReadonlySet<number>;
}

/** A placement inside a search, 0-based. */
interface Placed {
  readonly item: number;
  readonly col: number;
  readonly row: number;
  readonly c: number;
  readonly r: number;
}

interface Candidate {
  readonly rows: number;
  readonly placed: readonly Placed[];
  readonly cost: number;
}

interface Shape {
  readonly c: number;
  readonly r: number;
  readonly cost: number;
}

/** How far a tile's ratio is from its photo's: |ln(tile / photo)|. */
const fit = (c: number, r: number, ratio: number) => Math.abs(Math.log(c / (r * ROW_UNIT) / ratio));

/** Cells per tile the wall aims for, by column count: sets the wall's scale. */
const TARGET_TILE_AREA: Record<number, number> = { 2: 4, 3: 6, 4: 6, 6: 8 };

/** The shortest wall worth aiming for, by column count, so a few photos never make a thin strip. */
const MIN_TARGET_ROWS: Record<number, number> = { 2: 3, 3: 4, 4: 4, 6: 5 };

/** The wall height the art direction aims for. */
const targetRows = (n: number, columns: number) =>
  Math.max(((TARGET_TILE_AREA[columns] ?? 6) * n) / columns, MIN_TARGET_ROWS[columns] ?? 4);

/**
 * A photo's candidate tiles: for every width, row counts around its ideal (2 * width / ratio), so
 * every width stays available to the arrangement; best fit first. With `every`, every row count in
 * the factor-2 band (cheap for a few photos, and what lets two very different shapes share a height).
 */
function shapesFor(ratio: number, columns: number, rows: number, rules: Rules, every: boolean, minRows: number): Shape[] {
  const out: Shape[] = [];
  for (let c = 1; c <= columns; c++) {
    const ideal = c / (ratio * ROW_UNIT);
    // The nearest row counts, and a few spread across the factor-2 band, so photos of very
    // different shapes can still share a height.
    const near = every
      ? new Set(Array.from({ length: Math.ceil(ideal * 2) - Math.floor(ideal / 2) + 1 }, (_, i) => Math.floor(ideal / 2) + i))
      : new Set(
          [ideal / 2, ideal / Math.SQRT2, Math.floor(ideal), Math.ceil(ideal), ideal * Math.SQRT2, ideal * 2].map((x) => Math.round(x)),
        );
    if (minRows > 1) near.add(minRows);
    const options: Shape[] = [];
    for (const r of near) {
      if (r < minRows || r > rows) continue;
      const t = c / (r * ROW_UNIT);
      if (rules.orientation && orientationOf(t) !== orientationOf(ratio)) continue;
      if (Math.max(t / ratio, ratio / t) > rules.maxFactor + 1e-9) continue;
      options.push({ c, r, cost: fit(c, r, ratio) });
    }
    options.sort((a, b) => a.cost - b.cost || a.r - b.r);
    out.push(...options);
  }
  out.sort((a, b) => a.cost - b.cost || a.c * a.r - b.c * b.r || a.c - b.c);
  return out;
}

/** Rows y (0 < y < rows) where every column has a tile boundary: full-width gutters. */
function fullWidthBreaks(placed: readonly Placed[], rows: number): number[] {
  const out: number[] = [];
  for (let y = 1; y < rows; y++) {
    if (!placed.some((p) => p.row < y && p.row + p.r > y)) out.push(y);
  }
  return out;
}

/** The parts of the art direction known from the shapes alone, plus the hard shape rules. */
function shapeKey(chosen: readonly Shape[], columns: number, rows: number, rules: Rules): number {
  // Called for every candidate shape set, so it allocates nothing (n is at most 6).
  const n = chosen.length;
  const first = chosen[0]!;
  if (rules.spread && chosen.some((s) => s.r !== rows)) return Infinity;
  if (rules.variety && n >= 3) {
    if (chosen.every((s) => s.c === first.c)) return Infinity;
    if (chosen.every((s) => s.r === first.r)) return Infinity;
  }
  // Each distinct size at its first occurrence, with its number of copies k.
  let distinct = 0;
  let equal = 0;
  for (let i = 0; i < n; i++) {
    const s = chosen[i]!;
    let seen = false;
    for (let j = 0; j < i && !seen; j++) seen = chosen[j]!.c === s.c && chosen[j]!.r === s.r;
    if (seen) continue;
    distinct++;
    let k = 1;
    for (let j = i + 1; j < n; j++) if (chosen[j]!.c === s.c && chosen[j]!.r === s.r) k++;
    equal += 0.12 * (k - 1);
  }
  if (distinct < Math.min(rules.distinctSizes, n)) return Infinity;
  let penalty = 0;
  // Equal tiles read as a uniform grid (two equal photos are simply a spread).
  if (n >= 3) penalty += equal;
  // The references lead with one feature tile: at least two columns and half the height.
  if (n >= 3 && columns >= 4 && !chosen.some((s) => s.c >= 2 && s.r * 2 >= rows)) penalty += 0.4;
  return penalty + heightPenalty(n, columns, rows);
}

/**
 * Scale: about TARGET_TILE_AREA cells per photo, never a thin strip. From three photos the wall
 * holds its scale firmly, or one near-perfect giant tile beside a strip outbids a real bento.
 * Known from the height alone, so the search also uses it as a bound.
 */
const heightPenalty = (n: number, columns: number, rows: number) =>
  (n >= 3 ? 0.6 : 0.3) * Math.abs(Math.log(rows / targetRows(n, columns)));

/** A mirror-symmetric wall reads as a template. */
function mirrorPenalty(placed: readonly Placed[], columns: number): number {
  // With one or two photos a symmetric spread is the natural composition.
  if (placed.length < 3) return 0;
  const key = (col: number, p: Placed) => `${col},${p.row},${p.c},${p.r}`;
  const own = new Set(placed.map((p) => key(p.col, p)));
  return placed.every((p) => own.has(key(columns - p.col - p.c, p))) ? 0.6 : 0;
}

/**
 * Exact tilings of a columns x rows rectangle by fixed rectangles (one per item), each placed at
 * the first empty cell. Calls `found` for each; stops when it returns true. `forbidden(y)` names
 * rows where a full-width gutter is not allowed: a tiling is dropped as soon as one shows.
 */
function arrange(
  rects: readonly { item: number; c: number; r: number }[],
  columns: number,
  rows: number,
  found: (placed: readonly Placed[]) => boolean,
  forbidden?: (y: number) => boolean,
): void {
  const cells = columns * rows;
  const grid = new Uint8Array(cells);
  const used = new Array<boolean>(rects.length).fill(false);
  const stack: Placed[] = [];
  let stop = false;
  const dfs = (from: number, checked: number) => {
    if (stop) return;
    if (stack.length === rects.length) {
      stop = found(stack);
      return;
    }
    let idx = from;
    while (idx < cells && grid[idx]) idx++;
    if (idx >= cells) return;
    const row = Math.floor(idx / columns);
    const col = idx % columns;
    // Every row above the first empty cell is full, so each tile crossing a boundary up to this row
    // is already placed: a gutter there is final.
    if (forbidden) {
      for (let y = checked + 1; y <= row && y < rows; y++) {
        if (forbidden(y) && !stack.some((p) => p.row < y && p.row + p.r > y)) return;
      }
    }
    const next = Math.max(checked, row);
    let avail = 0;
    while (col + avail < columns && !grid[row * columns + col + avail]) avail++;
    for (let i = 0; i < rects.length && !stop; i++) {
      if (used[i]) continue;
      const { c, r } = rects[i]!;
      // Equal rectangles are interchangeable here, and sorted next to each other: try each size
      // once at this cell, as its first unused copy.
      const prev = rects[i - 1];
      if (prev && !used[i - 1] && prev.c === c && prev.r === r) continue;
      if (c > avail || row + r > rows) continue;
      let free = true;
      for (let y = row + 1; y < row + r && free; y++) {
        for (let x = col; x < col + c; x++) {
          if (grid[y * columns + x]) {
            free = false;
            break;
          }
        }
      }
      if (!free) continue;
      for (let y = row; y < row + r; y++) grid.fill(1, y * columns + col, y * columns + col + c);
      used[i] = true;
      stack.push({ item: rects[i]!.item, col, row, c, r });
      dfs(idx + c, next);
      stack.pop();
      used[i] = false;
      for (let y = row; y < row + r; y++) grid.fill(0, y * columns + col, y * columns + col + c);
    }
  };
  dfs(0, 0);
}

/**
 * Rows every tile spans at least: two row units are one column width. A one-row tile is a sliver
 * that reads as filler, not as an art-directed photo (manager ruling, round 4).
 */
export const MIN_TILE_ROWS = 2;

/** The fewest rows an item's tile may span. */
const minRowsOf = (item: WallItem) => Math.max(MIN_TILE_ROWS, item.captioned ? CAPTION_MIN_ROWS : 1);

/** Tallest tile considered, in rows, by column count. */
const maxRowsFor = (columns: number) => 4 * columns;

/** Cost caps tried in turn: the first that yields a composition yields the cheapest one. */
const CAPS = [0.8, 1.6, 3.2, Infinity];

/**
 * The `keep` cheapest compositions of the items on `columns` columns over the allowed heights:
 * one shape per item (best fit first, bounded by cost), then an exact arrangement of those shapes
 * that keeps the rules. Cheapest first.
 */
function composeTop(items: readonly WallItem[], columns: number, rules: Rules, keep: number, heights: readonly number[]): Candidate[] {
  // Size sets with no tiling that keeps the gutter rules, at a height: true at every cap.
  const untileable = new Set<string>();
  for (const cap of CAPS) {
    const found = composeUnder(items, columns, rules, keep, heights, cap, untileable);
    if (found.length > 0) return found;
  }
  return [];
}

function composeUnder(
  items: readonly WallItem[],
  columns: number,
  rules: Rules,
  keep: number,
  heights: readonly number[],
  cap: number,
  untileable: Set<string>,
): Candidate[] {
  const n = items.length;
  const tallest = Math.max(...heights);
  // Up to three photos, every row count: they must share heights, and the search stays small.
  const shapes = items.map((it) => shapesFor(it.ratio, columns, tallest, rules, n <= 3, minRowsOf(it)));
  const best: Candidate[] = [];
  if (shapes.some((s) => s.length === 0)) return best;
  const restMin = new Array<number>(n + 1).fill(0);
  const restMinArea = new Array<number>(n + 1).fill(0);
  const restMaxArea = new Array<number>(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    restMin[i] = restMin[i + 1]! + shapes[i]![0]!.cost;
    restMinArea[i] = restMinArea[i + 1]! + Math.min(...shapes[i]!.map((x) => x.c * x.r));
    restMaxArea[i] = restMaxArea[i + 1]! + Math.max(...shapes[i]!.map((x) => x.c * x.r));
  }
  // Items with the same ratio (and caption need) are interchangeable: their choices never decrease.
  const twinOf = items.map((it, i) => items.findIndex((o, j) => j < i && o.ratio === it.ratio && minRowsOf(o) === minRowsOf(it)));
  const worst = () => (best.length >= keep ? best[best.length - 1]!.cost : cap);
  const chosen: Shape[] = [];
  const chosenIndex: number[] = [];
  // Gutters the rules forbid, checked while each tiling is built.
  const avoid = rules.avoidBreaks;
  const forbidden = rules.stagger ? () => true : avoid && avoid.size > 0 ? (y: number) => avoid.has(y) : undefined;
  // The height being searched: its row count, its area, and its (fixed) height penalty.
  let rows = 0;
  let target = 0;
  let floor = 0;

  const consider = (fitCost: number) => {
    const key = fitCost + shapeKey(chosen, columns, rows, rules);
    if (key >= worst()) return;
    const rects = chosen.map((s, item) => ({ item, c: s.c, r: s.r }));
    // Bigger tiles first: arrangements are found faster and lead with the feature.
    rects.sort((a, b) => b.c * b.r - a.c * a.r || b.r - a.r || a.item - b.item);
    const sizes = `${rows}:${rects.map((x) => `${x.c}x${x.r}`).join(',')}`;
    if (untileable.has(sizes)) return;
    let tiled = false;
    arrange(
      rects,
      columns,
      rows,
      (placed) => {
        if (rules.stagger && fullWidthBreaks(placed, rows).length > 0) return false;
        if (avoid && avoid.size > 0 && fullWidthBreaks(placed, rows).some((y) => avoid.has(y))) return false;
        tiled = true;
        const total = key + mirrorPenalty(placed, columns);
        if (total >= worst()) return false;
        let at = best.findIndex((b) => b.cost > total);
        if (at < 0) at = best.length;
        best.splice(at, 0, { rows, placed: [...placed], cost: total });
        if (best.length > keep) best.pop();
        // One arrangement per shape set is enough unless several are wanted.
        return keep === 1 && total === key;
      },
      forbidden,
    );
    if (!tiled) untileable.add(sizes);
  };

  const dfs = (i: number, fitCost: number, area: number) => {
    if (i === n) {
      if (area === target) consider(fitCost);
      return;
    }
    // The finished area must be exactly this height's rectangle.
    if (area + restMinArea[i]! > target || area + restMaxArea[i]! < target) return;
    const twin = twinOf[i]!;
    const from = twin >= 0 ? chosenIndex[twin]! : 0;
    const list = shapes[i]!;
    for (let k = from; k < list.length; k++) {
      const s = list[k]!;
      if (fitCost + s.cost + restMin[i + 1]! + floor >= worst()) break;
      if (s.r > rows) continue;
      chosen.push(s);
      chosenIndex.push(k);
      dfs(i + 1, fitCost + s.cost, area + s.c * s.r);
      chosen.pop();
      chosenIndex.pop();
    }
  };
  // One height at a time, nearest the target first: once the height penalty alone (plus the best
  // possible fit) cannot beat the best composition found, no later height can either.
  const order = [...new Set(heights)].sort((a, b) => heightPenalty(n, columns, a) - heightPenalty(n, columns, b) || a - b);
  for (const h of order) {
    floor = heightPenalty(n, columns, h);
    if (floor + restMin[0]! >= worst()) break;
    rows = h;
    target = columns * h;
    dfs(0, 0, 0);
  }
  return best;
}

/** The single cheapest composition over all allowed heights. */
function compose(items: readonly WallItem[], columns: number, rules: Rules, heights: readonly number[]): Candidate | null {
  return composeTop(items, columns, rules, 1, heights)[0] ?? null;
}

/** Every wall height a composition of n photos could need: past the tallest tile as photos stack. */
const allHeights = (n: number, columns: number) =>
  Array.from({ length: Math.min(60, maxRowsFor(columns) + 4 * n) }, (_, i) => i + 1);

const toTiles = (items: readonly WallItem[], placed: readonly Placed[], colOffset = 0, rowOffset = 0, mirrorWidth = 0): Tile[] =>
  placed.map((p) => ({
    id: items[p.item]!.id,
    col: 1 + colOffset + (mirrorWidth ? mirrorWidth - p.col - p.c : p.col),
    row: 1 + rowOffset + p.row,
    colSpan: p.c,
    rowSpan: p.r,
  }));

function rulesFor(n: number, columns: number): Rules {
  return {
    orientation: n <= 6 && columns >= 4,
    maxFactor: 2,
    variety: n >= 3,
    stagger: n >= 4 && columns >= 4,
    // Phones: never a single column of equal cards.
    distinctSizes: columns === 2 && n >= 2 ? 2 : 1,
    // Two photos on tablets and desktops: a spread, never two full-width cards stacked.
    spread: n === 2 && columns >= 4,
  };
}

/** Splits n photos into k groups as evenly as possible, larger groups first. */
function chunkSizes(n: number, k: number): number[] {
  return Array.from({ length: k }, (_, i) => Math.floor(n / k) + (i < n % k ? 1 : 0));
}

export function planWall(items: readonly WallItem[], columns: 2 | 4 | 6): WallLayout {
  const n = items.length;
  if (n === 0) return { columns, rows: 0, source: 'curated', tiles: [] };
  if (n <= 6) {
    const strict = rulesFor(n, columns);
    // Proven impossible (photoWall.test.ts, orientation): with two-row tiles, 4 or more
    // landscape-only photos on 4 columns cannot all keep their orientation while spans vary and
    // gutters stagger. Skip the exhaustive search that would only confirm it.
    const impossible =
      MIN_TILE_ROWS >= 2 && columns === 4 && n >= 4 && items.every((it) => orientationOf(it.ratio) === 'landscape');
    // A spread gives way before orientation does: a photo's own shape matters more (A-05).
    const best = impossible
      ? null
      : (compose(items, columns, strict, allHeights(n, columns)) ??
        (strict.spread ? compose(items, columns, { ...strict, spread: false }, allHeights(n, columns)) : null));
    if (best) return { columns, rows: best.rows, source: 'curated', tiles: toTiles(items, best.placed) };
    return fallback(items, columns, 'curated');
  }
  // Each half keeps its photos' orientation when it can (A-05), and gives it up only if it must.
  // Last before a stack: halves (and phone parts) that need not vary on their own. A staggered
  // wall of fewer sizes still beats a stack of full-width cards.
  return (
    pack(items, columns, true) ??
    pack(items, columns, false) ??
    pack(items, columns, false, false) ??
    fallback(items, columns, 'packed')
  );
}

/**
 * Never expected for real photos (the tests sweep the mixes): a solid rectangle with the art
 * rules relaxed one by one, and finally one photo per full-width row, which always tiles.
 */
function fallback(items: readonly WallItem[], columns: 2 | 4 | 6, source: WallLayout['source']): WallLayout {
  const strict = rulesFor(items.length, columns);
  for (const rules of [
    { ...strict, orientation: false },
    { ...strict, orientation: false, stagger: false },
    { ...strict, orientation: false, stagger: false, variety: false },
    // Varied tile sizes give way before the crop limit does.
    { ...strict, orientation: false, stagger: false, variety: false, distinctSizes: 1 },
    { ...strict, orientation: false, stagger: false, variety: false, distinctSizes: 1, maxFactor: Infinity },
  ]) {
    const best = items.length <= 6 ? compose(items, columns, rules, allHeights(items.length, columns)) : null;
    if (best) return { columns, rows: best.rows, source, tiles: toTiles(items, best.placed) };
  }
  const tiles: Tile[] = [];
  let row = 1;
  for (const item of items) {
    const rowSpan = Math.max(minRowsOf(item), Math.round(columns / (item.ratio * ROW_UNIT)));
    tiles.push({ id: item.id, col: 1, row, colSpan: columns, rowSpan });
    row += rowSpan;
  }
  return { columns, rows: row - 1, source, tiles };
}

/**
 * 7 photos or more: compositions of at most 6, mirrored alternately. On phones they stack; on
 * tablets and desktops two sit side by side at a common height, their breaks staggered.
 */
function pack(items: readonly WallItem[], columns: 2 | 4 | 6, orientation: boolean, variety = true): WallLayout | null {
  const n = items.length;
  if (columns === 2) {
    const sizes = chunkSizes(n, Math.ceil(n / 6));
    const tiles: Tile[] = [];
    let start = 0;
    let rowOffset = 0;
    for (const [k, size] of sizes.entries()) {
      const part = items.slice(start, start + size);
      start += size;
      const rules = rulesFor(part.length, 2);
      const best = compose(part, 2, { ...rules, variety: rules.variety && variety }, allHeights(part.length, 2));
      if (!best) return null;
      tiles.push(...toTiles(part, best.placed, 0, rowOffset, k % 2 ? 2 : 0));
      rowOffset += best.rows;
    }
    return { columns, rows: rowOffset, source: 'packed', tiles };
  }
  const width = columns / 2;
  const [na, nb] = chunkSizes(n, 2) as [number, number];
  const a = items.slice(0, na);
  const b = items.slice(na, na + nb);
  // Each half varies on its own (both hold 3 photos or more), so the whole wall does too.
  const half: Rules = { ...rulesFor(n, columns), orientation, variety, stagger: false };
  const whole = rulesFor(n, columns);
  let chosen: { rows: number; a: Candidate; b: Candidate; cost: number } | null = null;
  // Each half's own best height, then a few shared heights around them.
  const ha = compose(a, width, half, allHeights(a.length, width))?.rows;
  const hb = compose(b, width, half, allHeights(b.length, width))?.rows;
  if (ha === undefined || hb === undefined) return null;
  const mid = Math.round((ha + hb) / 2);
  const heights = [...new Set([ha, hb, mid, ha - 1, ha + 1, hb - 1, hb + 1, mid - 1, mid + 1])]
    .filter((h) => h >= 1)
    .sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid) || x - y);
  for (const h of heights) {
    for (const x of composeTop(a, width, half, 3, [h])) {
      if (chosen && x.cost >= chosen.cost) continue;
      // The right half is composed against the left: no gutter where the left has one.
      const avoid = new Set(whole.stagger ? fullWidthBreaks(x.placed, h) : []);
      const [y] = composeTop(b, width, { ...half, avoidBreaks: avoid }, 1, [h]);
      if (!y) continue;
      const cost = x.cost + y.cost;
      if (chosen && cost >= chosen.cost) continue;
      chosen = { rows: h, a: x, b: y, cost };
    }
  }
  if (!chosen) return null;
  return {
    columns,
    rows: chosen.rows,
    source: 'packed',
    tiles: [...toTiles(a, chosen.a.placed), ...toTiles(b, chosen.b.placed, width, 0, width)],
  };
}
