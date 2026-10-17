// Owner: agent/frontend. The hero (TASK-102, wireframe 1): the alpine photograph, the name as a
// book's title page, and the owner's "moving thingy", a slow drift of fog across the valley.
import { useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { getMedia, type Link, type Site } from '../../content';
import { Picture } from '../../components/Picture/Picture';
import { HERO_PHOTO_SIZES } from '../../components/Picture/sizes';
import { useDriftPlaying } from '../../hooks/useDriftPlaying';
import { settleWhenRevealed } from '../../hooks/useFogReveal';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useScrollDepth } from '../../hooks/useScrollDepth';
import { DEPTH } from '../../lib/depth';
import styles from './Hero.module.css';

interface HeroProps {
  readonly site: Site;
  /** Receives the hero <img>'s decode() promise once; App hands it to the Loader. */
  readonly onHeroDecode: (decoded: Promise<void>) => void;
  /** False while the loader is up: the copy waits in the fog and clears as the paper does. */
  readonly ready?: boolean;
}

/**
 * Starts the hero photograph's request before React renders (this is a client-only page, so the
 * <img> alone would wait for the bundle to run and render). It hints the best format the manifest
 * has, with its srcset and sizes, so the browser fetches the same candidate the <picture> picks; a
 * browser that cannot decode that type skips the hint.
 */
export function preloadHeroImage(site: Site) {
  const media = getMedia(site.heroImage);
  const best = media.sources[0];
  preload(media.fallback.src, {
    as: 'image',
    fetchPriority: 'high',
    imageSizes: HERO_PHOTO_SIZES,
    imageSrcSet: best ? best.srcset : media.fallback.srcset,
    ...(best ? { type: best.type } : {}),
  });
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
  // The photograph lags the scroll a little (TASK-108): the valley reads as farther than the name.
  // Only the inner layer moves; the frame and its dissolve mask stay with the hero.
  const [depthLayer, setDepthLayer] = useState<HTMLDivElement | null>(null);
  useScrollDepth(depthLayer, DEPTH.hero);
  const photo = getMedia(site.heroImage);

  // The copy clears once, when the loader hands over. Afterwards (or at once under reduced motion)
  // it settles to data-reveal="instant", so a media change can never replay it.
  const [copy, setCopy] = useState<HTMLDivElement | null>(null);
  const [settled, setSettled] = useState(false);
  const reduced = usePrefersReducedMotion();
  if (ready && reduced && !settled) setSettled(true);
  useEffect(() => {
    if (!copy || !ready || settled) return;
    return settleWhenRevealed(copy, () => setSettled(true));
  }, [copy, ready, settled]);

  return (
    <section id="home" ref={setSection} className={styles.hero}>
      <div className={styles.photo} aria-hidden="true">
        <div ref={setDepthLayer} className={styles.depth}>
          <Picture media={photo} alt="" sizes={HERO_PHOTO_SIZES} priority className={styles.image} onDecode={onHeroDecode} />
          <div className={styles.drift} data-drift={playing ? 'running' : 'paused'}>
            <Picture media={photo} alt="" sizes={HERO_PHOTO_SIZES} className={styles.image} />
          </div>
        </div>
      </div>

      <div
        ref={setCopy}
        className={styles.copy}
        data-fog="stagger"
        data-revealed={ready ? 'true' : undefined}
        data-reveal={settled ? 'instant' : undefined}
      >
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
