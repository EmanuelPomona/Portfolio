// Owner: agent/frontend. One life photo, sunk into the fog until attended (TASK-105).
import { useState, type CSSProperties } from 'react';
import { getMedia, type LifePhoto } from '../../content';
import { useAttention } from '../../hooks/useAttention';
import { Picture } from '../Picture/Picture';
import styles from './PhotoSlot.module.css';

interface PhotoSlotProps {
  readonly photo: LifePhoto;
  readonly sizes: string;
  readonly className?: string;
}

export function PhotoSlot({ photo, sizes, className }: PhotoSlotProps) {
  // The hook mirrors attention onto the figure as data-attended; the CSS does the rest.
  const { ref } = useAttention<HTMLElement>();
  const [failed, setFailed] = useState(false);
  const hasImage = photo.image !== null && !failed;
  // With no photo and no caption there is nothing to announce or to reach by keyboard.
  const silent = !hasImage && photo.caption === null;
  const ratio = { '--ratio': photo.aspect.replace(':', ' / ') } as CSSProperties;

  return (
    <figure
      ref={ref}
      className={className ? `${styles.slot} ${className}` : styles.slot}
      style={ratio}
      data-aspect={photo.aspect}
      data-empty={hasImage ? undefined : 'true'}
      aria-hidden={silent ? 'true' : undefined}
      tabIndex={hasImage ? 0 : undefined}
    >
      <div className={styles.frame}>
        {hasImage ? (
          <Picture
            media={getMedia(photo.image!)}
            alt={photo.alt ?? ''}
            sizes={sizes}
            className={styles.image}
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      {photo.caption !== null ? <figcaption className={styles.caption}>{photo.caption}</figcaption> : null}
    </figure>
  );
}
