// Owner: agent/frontend. The hero (TASK-102, wireframe 1): the alpine photograph, the name as a
// book's title page, and the owner's "moving thingy", a slow drift of fog across the valley.
import { useEffect, useState } from 'react';
import { getMedia, type Link, type Site } from '../../content';
import { Picture } from '../../components/Picture/Picture';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import styles from './Hero.module.css';

interface HeroProps {
  readonly site: Site;
  /** Receives the hero <img>'s decode() promise once; App hands it to the Loader. */
  readonly onHeroDecode: (decoded: Promise<void>) => void;
  /** False while the loader is up: the copy waits in the fog and clears as the paper does. */
  readonly ready?: boolean;
}

/** True while the hero is on screen, the tab is visible, and motion is allowed. */
function useDriftPlaying(target: HTMLElement | null): boolean {
  const reduced = usePrefersReducedMotion();
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);

  useEffect(() => {
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setInView(entry.isIntersecting);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);

  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return inView && visible && !reduced;
}

function HeroLink({ link }: { readonly link: Link }) {
  const external = !link.href.startsWith('mailto:');
  return external ? (
    <a className={styles.link} href={link.href} target="_blank" rel="noopener noreferrer">
      {link.label}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  ) : (
    <a className={styles.link} href={link.href}>
      {link.label}
    </a>
  );
}

export function Hero({ site, onHeroDecode, ready = true }: HeroProps) {
  const [section, setSection] = useState<HTMLElement | null>(null);
  const playing = useDriftPlaying(section);
  const photo = getMedia(site.heroImage);

  return (
    <section id="home" ref={setSection} className={styles.hero}>
      <div className={styles.photo} aria-hidden="true">
        <Picture media={photo} alt="" sizes="100vw" priority className={styles.image} onDecode={onHeroDecode} />
        <div className={styles.drift} data-drift={playing ? 'running' : 'paused'}>
          <Picture media={photo} alt="" sizes="100vw" className={styles.image} />
        </div>
      </div>

      <div className={styles.copy} data-fog="stagger" data-revealed={ready ? 'true' : undefined}>
        <h1 className={styles.name}>{site.name}</h1>
        <p className={styles.tagline}>{site.tagline}</p>
        <ul className={styles.links}>
          {site.heroLinks.map((link, i) => (
            <li key={link.kind} className={styles.item}>
              <HeroLink link={link} />
              {i < site.heroLinks.length - 1 ? (
                <span className={styles.dot} aria-hidden="true">
                  ·
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
