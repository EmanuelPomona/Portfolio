// Owner: agent/frontend. A project as a dark macOS browser window: black until attended (TASK-103).
import { useState } from 'react';
import { getMedia, type Project } from '../../content';
import { useAttention } from '../../hooks/useAttention';
import { useDriftPlaying } from '../../hooks/useDriftPlaying';
import { useNearViewport } from '../../hooks/useNearViewport';
import { useVideoPlayback } from '../../hooks/useVideoPlayback';
import { Picture } from '../Picture/Picture';
import styles from './BrowserWindow.module.css';
import { posterUrl } from './poster';

interface BrowserWindowProps {
  readonly project: Project;
  readonly sizes: string;
}

export function BrowserWindow({ project, sizes }: BrowserWindowProps) {
  const { ref, attended } = useAttention<HTMLAnchorElement>();
  const [failed, setFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  // Plays only while someone looks at it AND it may move: on screen, in a visible tab, motion
  // allowed (useDriftPlaying, the page's one such signal). Attention alone is not enough: keyboard
  // focus survives scrolling the window out of sight. Under reduced motion the poster stays.
  const mayMove = useDriftPlaying(video);
  useVideoPlayback(video, attended && mayMove, project.screen.video?.posterTime ?? 0);
  // A <video poster> cannot lazy-load, so it is set once the window nears the viewport.
  const near = useNearViewport(video);
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
            poster={near ? posterUrl(getMedia(screen.image!)) : undefined}
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
