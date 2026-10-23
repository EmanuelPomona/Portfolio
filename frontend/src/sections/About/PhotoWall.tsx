// Owner: agent/frontend. The About photo wall (TASK-111, ADR-013): one solid rectangle of tiles,
// placed by grid spans from planWall, recomposed from about.photos at each column count.
import { useMemo, type CSSProperties } from 'react';
import { getMedia, type LifePhoto } from '../../content';
import { PhotoSlot } from '../../components/PhotoSlot/PhotoSlot';
import { useFogReveal } from '../../hooks/useFogReveal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { orientationOf, planWall, type WallItem } from '../../lib/photoWall';
import styles from './PhotoWall.module.css';

export const DESKTOP_QUERY = '(min-width: 64rem)';
export const TABLET_QUERY = '(min-width: 48rem)';

/** The wall is never wider than the page's content column. */
const WALL_MAX_PX = 1296;

/** A photo's ratio: the image's own (media manifest), or the slot's aspect while it is empty. */
function ratioOf(photo: LifePhoto): number {
  if (photo.image !== null) {
    const media = getMedia(photo.image);
    return media.width / media.height;
  }
  const [w, h] = photo.aspect.split(':').map(Number);
  return w! / h!;
}

/** About the width a tile draws at, so each image is fetched near the size it is shown. */
function sizesFor(colSpan: number, columns: number): string {
  const share = colSpan / columns;
  return `(min-width: 90rem) ${Math.round(WALL_MAX_PX * share)}px, ${Math.round(92 * share)}vw`;
}

interface PhotoWallProps {
  readonly photos: readonly LifePhoto[];
}

export function PhotoWall({ photos }: PhotoWallProps) {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const tablet = useMediaQuery(TABLET_QUERY);
  const columns = desktop ? 6 : tablet ? 4 : 2;
  const { ref } = useFogReveal<HTMLDivElement>();

  const layout = useMemo(() => {
    const items: WallItem[] = photos.map((p) => ({ id: p.id, ratio: ratioOf(p), captioned: p.caption !== null }));
    return planWall(items, columns);
  }, [photos, columns]);

  if (photos.length === 0) return null;
  const byId = new Map(photos.map((p) => [p.id, p]));
  // Reading order, so keyboard focus moves across the wall the way the eye does.
  const tiles = [...layout.tiles].sort((a, b) => a.row - b.row || a.col - b.col);

  return (
    <div
      ref={ref}
      className={styles.wall}
      style={{ '--cols': columns, '--rows': layout.rows } as CSSProperties}
      data-wall=""
      data-columns={columns}
      data-source={layout.source}
      data-fog="stagger"
      data-arrive="settle"
    >
      {tiles.map((t) => {
        const photo = byId.get(t.id)!;
        return (
          <div
            key={t.id}
            className={styles.tile}
            style={{ gridColumn: `${t.col} / span ${t.colSpan}`, gridRow: `${t.row} / span ${t.rowSpan}` }}
            data-tile={t.id}
            data-orientation={orientationOf(ratioOf(photo))}
          >
            <PhotoSlot photo={photo} sizes={sizesFor(t.colSpan, columns)} />
          </div>
        );
      })}
    </div>
  );
}
