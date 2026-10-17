// Owner: agent/frontend. A project as a dark macOS browser window: black until attended (TASK-103).
import { useState } from 'react';
import { getMedia, type Project } from '../../content';
import { useAttention } from '../../hooks/useAttention';
import { Picture } from '../Picture/Picture';
import styles from './BrowserWindow.module.css';

interface BrowserWindowProps {
  readonly project: Project;
  readonly sizes: string;
}

export function BrowserWindow({ project, sizes }: BrowserWindowProps) {
  const { ref, attended } = useAttention<HTMLAnchorElement>();
  const [failed, setFailed] = useState(false);
  const { screen, primary } = project;
  const showImage = screen.image !== null && !failed;

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
        {showImage ? (
          <Picture
            media={getMedia(screen.image!)}
            alt={screen.alt ?? ''}
            sizes={sizes}
            className={styles.cover}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className={styles.empty}>screenshot soon</span>
        )}
      </span>
    </a>
  );
}
