// Owner: agent/frontend. About (TASK-105, wireframe 3): the brief description, this semester's
// classes, and a loose, overlapping scatter of life photos. Not a grid.
import type { CSSProperties } from 'react';
import type { About as AboutContent, LifePhoto } from '../../content';
import { PhotoSlot } from '../../components/PhotoSlot/PhotoSlot';
import { Section } from '../../components/Section/Section';
import { useFogReveal } from '../../hooks/useFogReveal';
import styles from './About.module.css';

interface AboutProps {
  readonly about: AboutContent;
  readonly heading: string;
}

/** Five positions, in reading order (wireframe 3); photos beyond five start a new spread. */
const PER_SPREAD = 5;

/**
 * Slot widths per position as a share of the collage (phone, tablet, desktop), matching the
 * recipes in About.module.css, so each image is fetched at about the size it is drawn.
 */
const WIDTHS: readonly (readonly [number, number, number])[] = [
  [78, 52, 40],
  [48, 34, 24],
  [46, 36, 28],
  [42, 26, 18],
  [54, 40, 33],
];

function sizesFor(pos: number): string {
  const [phone, tablet, desktop] = WIDTHS[pos]!;
  const desktopPx = Math.round((desktop / 100) * 1296); // the collage is at most 1296px wide
  return `(min-width: 90rem) ${desktopPx}px, (min-width: 64rem) ${Math.round(desktop * 0.92)}vw, (min-width: 48rem) ${Math.round(tablet * 0.9)}vw, ${Math.round(phone * 0.92)}vw`;
}

function ratio(aspect: LifePhoto['aspect']): number {
  const [w, h] = aspect.split(':').map(Number);
  return w! / h!;
}

function Spread({ photos }: { readonly photos: readonly LifePhoto[] }) {
  const { ref } = useFogReveal<HTMLDivElement>();
  // Each present slot's width-to-height ratio, so the spread's CSS can size itself to the
  // lowest photo whatever aspects the owner chooses.
  const vars = Object.fromEntries(photos.map((p, i) => [`--r${i}`, ratio(p.aspect).toFixed(4)])) as CSSProperties;
  return (
    <div
      ref={ref}
      className={styles.spread}
      style={vars}
      data-spread=""
      data-fill={photos.length}
      data-captioned={photos.some((p) => p.caption !== null) ? 'true' : undefined}
      data-fog="stagger"
    >
      {photos.map((photo, i) => (
        <div key={photo.id} className={`${styles.place} ${styles[`p${i}`]}`} data-pos={i}>
          <PhotoSlot photo={photo} sizes={sizesFor(i)} />
        </div>
      ))}
    </div>
  );
}

export function About({ about, heading }: AboutProps) {
  const { ref } = useFogReveal<HTMLDivElement>();
  const spreads: (readonly LifePhoto[])[] = [];
  for (let i = 0; i < about.photos.length; i += PER_SPREAD) spreads.push(about.photos.slice(i, i + PER_SPREAD));

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
      {spreads.length > 0 ? (
        <div className={styles.collage}>
          {spreads.map((photos) => (
            <Spread key={photos[0]!.id} photos={photos} />
          ))}
        </div>
      ) : null}
    </Section>
  );
}
