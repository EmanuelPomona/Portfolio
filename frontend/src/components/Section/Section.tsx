// Owner: agent/frontend. A page section: its id, optional h2, and optional fog backdrop (TASK-101).
import type { ReactNode } from 'react';
import { getMedia, site, type SectionId } from '../../content';
import { useFogReveal } from '../../hooks/useFogReveal';
import { Picture } from '../Picture/Picture';
import styles from './Section.module.css';

interface SectionProps {
  readonly id: SectionId;
  readonly heading?: string;
  /** "evergreen" paints site.sectionsImage dissolving into Mist. Decorative only. */
  readonly backdrop?: 'evergreen' | 'none';
  readonly className?: string;
  readonly children: ReactNode;
}

function EvergreenBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <Picture media={getMedia(site.sectionsImage)} alt="" sizes="(min-width: 72rem) 72rem, 100vw" />
    </div>
  );
}

export function Section({ id, heading, backdrop = 'none', className, children }: SectionProps) {
  const headingId = `${id}-heading`;
  const { ref } = useFogReveal<HTMLElement>();
  return (
    <section
      id={id}
      aria-labelledby={heading ? headingId : undefined}
      className={className ? `${styles.section} ${className}` : styles.section}
    >
      {backdrop === 'evergreen' && <EvergreenBackdrop />}
      <div className={styles.body}>
        {heading ? (
          <header ref={ref} className={styles.header} data-fog="self">
            <h2 id={headingId} className={styles.heading}>
              {heading}
            </h2>
          </header>
        ) : null}
        {children}
      </div>
    </section>
  );
}
