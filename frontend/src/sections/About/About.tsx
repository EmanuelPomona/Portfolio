// Owner: agent/frontend. About (TASK-105, TASK-111): the brief description, this semester's
// classes, and the photo wall: one solid, asymmetric rectangle of life photos (ADR-013).
import type { About as AboutContent } from '../../content';
import { Section } from '../../components/Section/Section';
import { useFogReveal } from '../../hooks/useFogReveal';
import { PhotoWall } from './PhotoWall';
import styles from './About.module.css';

interface AboutProps {
  readonly about: AboutContent;
  readonly heading: string;
}

export function About({ about, heading }: AboutProps) {
  const { ref } = useFogReveal<HTMLDivElement>();

  return (
    <Section id="about" heading={heading} backdrop="evergreen" clouds className={styles.section}>
      <div ref={ref} className={styles.intro} data-fog="stagger">
        <p className={styles.lede}>{about.description}</p>
        <div className={styles.classes}>
          <h3 className={styles.label}>{about.classes.label}</h3>
          <ul className={styles.list}>
            {about.classes.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      {about.photos.length > 0 ? (
        <div className={styles.collage}>
          <PhotoWall photos={about.photos} />
        </div>
      ) : null}
    </Section>
  );
}
