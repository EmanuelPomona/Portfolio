// Owner: agent/frontend. A project as a dark macOS browser window: black until attended (TASK-103).
import { useState } from 'react';
import { getMedia, type MediaAsset, type Project } from '../../content';
import { useAttention } from '../../hooks/useAttention';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { Picture } from '../Picture/Picture';
import styles from './BrowserWindow.module.css';

/** A window draws at most 760 CSS px wide: this covers it at about 2x without the largest file. */
const POSTER_WIDTH = 1280;

/**
 * One URL for <video poster>, which cannot choose from a srcset: the smallest WebP rendition at
 * least POSTER_WIDTH wide (else the largest), or the JPEG fallback when there is no WebP.
 */
function posterUrl(media: MediaAsset): string {
  const webp = media.sources.find((source) => source.type === 'image/webp');
  if (!webp) return media.fallback.src;
  const candidates = webp.srcset
    .split(',')
    .map((candidate) => {
      const [url = '', width = '0'] = candidate.trim().split(/\s+/);
      return { url, width: Number.parseInt(width, 10) };
    })
    .sort((a, b) => a.width - b.width);
  return (candidates.find((c) => c.width >= POSTER_WIDTH) ?? candidates.at(-1))?.url || media.fallback.src;
}

interface BrowserWindowProps {
  readonly project: Project;
  readonly sizes: string;
}

export function BrowserWindow({ project, sizes }: BrowserWindowProps) {
  const { ref, attended } = useAttention<HTMLAnchorElement>();
  const [failed, setFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  // Plays only while someone looks at it, and never under reduced motion (the poster stays).
  const reduced = usePrefersReducedMotion();
  useVideoPlayback(video, attended && !reduced);
  const { screen, primary } = project;
  const showImage = screen.image !== null && !failed;
  // A recording plays in the screen; if it cannot load, its poster stays as a still.
  const recording = screen.video && screen.image && !videoFailed ? screen.video : null;

  return (
    <a
      ref={ref}
      className={styles.window}
      href={primary.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.title}, ${primary.label}, ${project.addressBar}${showImage ? '' : ', screenshot soon'}`}
      data-state={attended ? 'attention' : 'rest'}
    >
      <span className={styles.chrome} aria-hidden="true">
        <span className={styles.lights}>
          <span className={styles.light} />
          <span className={styles.light} />
          <span className={styles.light} />
        </span>
        <span className={styles.address}>{project.addressBar}</span>
      </span>
      {/* Keeps the address and the placeholder separate words for text readers (axe label-in-name);
          whitespace between these two block-level boxes renders nothing. */}
      {' '}
      <span className={styles.screen}>
        {recording ? (
          <video
            ref={setVideo}
            className={styles.video}
            src={recording.src}
            poster={posterUrl(getMedia(screen.image!))}
            width={recording.width}
            height={recording.height}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onError={() => setVideoFailed(true)}
          />
        ) : showImage ? (
          <Picture
            media={getMedia(screen.image!)}
            alt={screen.alt ?? ''}
            sizes={sizes}
            className={screen.video ? styles.contain : styles.cover}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className={styles.empty}>screenshot soon</span>
        )}
      </span>
    </a>
  );
}
