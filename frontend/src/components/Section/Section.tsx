// Owner: agent/frontend. A page section: its id, optional h2, and optional fog backdrop (TASK-101).
import type { ReactNode } from 'react';
import { getMedia, site, type SectionId } from '../../content';
import { useFogReveal } from '../../hooks/useFogReveal';
import { Clouds } from '../Clouds/Clouds';
import { Picture } from '../Picture/Picture';
import { SECTION_BACKDROP_SIZES } from '../Picture/sizes';
import styles from './Section.module.css';

interface SectionProps {
  readonly id: SectionId;
  readonly heading?: string;
  /** "evergreen" paints site.sectionsImage dissolving into Mist. Decorative only. */
  readonly backdrop?: 'evergreen' | 'none';
  /** Without `heading`: the id of a heading the children render, which then names the section. */
  readonly labelledBy?: string;
  /** Photographic clouds drifting behind the content (TASK-107). */
  readonly clouds?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

function EvergreenBackdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <Picture media={getMedia(site.sectionsImage)} alt="" sizes={SECTION_BACKDROP_SIZES} />
    </div>
  );
}

export function Section({ id, heading, backdrop = 'none', labelledBy, clouds = false, className, children }: SectionProps) {
  const headingId = `${id}-heading`;
  const { ref } = useFogReveal<HTMLElement>();
  return (
    <section
      id={id}
      aria-labelledby={heading ? headingId : labelledBy}
      className={className ? `${styles.section} ${className}` : styles.section}
    >
      {backdrop === 'evergreen' && <EvergreenBackdrop />}
      {clouds ? <Clouds section={id} /> : null}
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
