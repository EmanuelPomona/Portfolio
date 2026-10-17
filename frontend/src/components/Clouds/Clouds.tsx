// Owner: agent/frontend. Photographic clouds drifting behind a section (TASK-107, round 2): the
// owner's "clouds should be hovering slightly within the page".
//
// Props: `section`, the section the clouds sit behind; it selects that section's placement in
// Clouds.module.css. Used only by Section.
//
// Each layer is cut from one of the owner's two photographs, at the same `sizes` as that photo's
// existing use, so the browser reuses the file it already has. Layers are screened over the Mist,
// so they can only lighten what is behind the text, never darken it. Each layer root carries
// data-drift="running" | "paused" | "off": paused off-screen or in a hidden tab, off (static)
// under reduced motion. Each layer also lags the scroll on its own --depth (TASK-108), measured
// from its own position, so a cloud high in a tall section still moves while it is in view.
import { useState } from 'react';
import { getMedia, site, type SectionId } from '../../content';
import { useDriftPlaying } from '../../hooks/useDriftPlaying';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useScrollDepth } from '../../hooks/useScrollDepth';
import { DEPTH } from '../../lib/depth';
import { Picture } from '../Picture/Picture';
import { HERO_PHOTO_SIZES, SECTION_BACKDROP_SIZES } from '../Picture/sizes';
import styles from './Clouds.module.css';

const LAYERS = [
  { name: 'valley', photo: site.heroImage, sizes: HERO_PHOTO_SIZES, depth: DEPTH.valleyCloud },
  { name: 'forest', photo: site.sectionsImage, sizes: SECTION_BACKDROP_SIZES, depth: DEPTH.forestCloud },
] as const;

/** Contact is short: one band of valley fog. Chosen here, so a hidden layer is never mounted. */
const LAYERS_FOR: Partial<Record<SectionId, readonly (typeof LAYERS)[number][]>> = {
  contact: [LAYERS[0]],
};

type Drift = 'running' | 'paused' | 'off';

function CloudLayer({ layer, drift }: { readonly layer: (typeof LAYERS)[number]; readonly drift: Drift }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  useScrollDepth(el, layer.depth);
  return (
    <div ref={setEl} className={`${styles.layer} ${styles[layer.name]}`} data-drift={drift}>
      <Picture media={getMedia(layer.photo)} alt="" sizes={layer.sizes} className={styles.image} />
    </div>
  );
}

export function Clouds({ section }: { readonly section: SectionId }) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const playing = useDriftPlaying(root);
  const reduced = usePrefersReducedMotion();
  const drift: Drift = reduced ? 'off' : playing ? 'running' : 'paused';

  return (
    <div ref={setRoot} className={styles.clouds} aria-hidden="true" data-clouds={section}>
      {(LAYERS_FOR[section] ?? LAYERS).map((layer) => (
        <CloudLayer key={layer.name} layer={layer} drift={drift} />
      ))}
    </div>
  );
}
