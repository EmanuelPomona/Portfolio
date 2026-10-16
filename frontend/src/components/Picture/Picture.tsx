// Owner: agent/frontend. The one way the page renders an image (TASK-102, docs/API.md §3).
import { useEffect, useRef } from 'react';
import type { MediaAsset } from '../../content';
import styles from './Picture.module.css';

interface PictureProps {
  readonly media: MediaAsset;
  /** Required; pass "" for decorative images. */
  readonly alt: string;
  readonly sizes: string;
  /** The LCP image: loaded eagerly at high priority. Everything else is lazy. */
  readonly priority?: boolean;
  /** Applied to the <img>. */
  readonly className?: string;
  /** Called once, with the <img>'s decode() promise. */
  readonly onDecode?: (decoded: Promise<void>) => void;
  /** Called when the image fails to load, so the owner can fall back to its empty state. */
  readonly onError?: () => void;
}

export function Picture({ media, alt, sizes, priority = false, className, onDecode, onError }: PictureProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const reported = useRef(false);
  const onDecodeRef = useRef(onDecode);
  useEffect(() => {
    onDecodeRef.current = onDecode;
  });

  useEffect(() => {
    const img = imgRef.current;
    const report = onDecodeRef.current;
    if (!img || !report || reported.current) return;
    reported.current = true; // once, even when StrictMode replays the effect
    report(typeof img.decode === 'function' ? img.decode() : Promise.resolve());
  }, []);

  return (
    <picture className={styles.picture}>
      {media.sources.map((source) => (
        <source key={source.type} type={source.type} srcSet={source.srcset} sizes={sizes} />
      ))}
      <img
        ref={imgRef}
        className={className}
        sizes={sizes}
        srcSet={media.fallback.srcset}
        src={media.fallback.src}
        width={media.width}
        height={media.height}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? undefined : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        style={{ backgroundColor: media.placeholder }}
        onError={onError}
      />
    </picture>
  );
}
