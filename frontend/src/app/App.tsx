// Owner: agent/frontend.
// The page. Keeps the mount contract (docs/API.md §2.5): StickmanLayer always mounted, Loader
// mounted until onDone, <main> inert and aria-busy while the loader is up, and `ready` created
// once from the same hero source the hero renders.
import { useEffect, useState } from 'react';
import { Nav } from '../components/Nav/Nav';
import { flags } from '../config/flags';
import { content, type NavItem } from '../content';
import { useActiveSection } from '../hooks/useActiveSection';
import { About } from '../sections/About/About';
import { Connect } from '../sections/Connect/Connect';
import { Footer } from '../sections/Footer/Footer';
import { Hero } from '../sections/Hero/Hero';
import { Projects } from '../sections/Projects/Projects';
import { Loader, StickmanLayer, loaderMode } from '../stickman';

interface Deferred {
  readonly promise: Promise<void>;
  readonly settleWith: (decoded: Promise<void>) => void;
}

/**
 * The Loader's `ready` (mount contract rule 4): created once, settled by the decode() of the hero
 * <img> the page actually renders, so the srcset candidate the browser picked is the one awaited.
 */
function createHeroReady(): Deferred {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // A failed decode counts as ready for the Loader. With no Loader mounted (skip mode) nothing
  // else listens, so mark the rejection handled instead of logging an uncaught error.
  promise.catch(() => {});
  return { promise, settleWith: (decoded) => void decoded.then(resolve, reject) };
}

/** Owns the active-section subscription so a section change re-renders the nav, not the page. */
function ActiveNav({ items }: { readonly items: readonly NavItem[] }) {
  const active = useActiveSection(items.map((item) => item.id));
  return <Nav items={items} active={active} />;
}

export function App() {
  const { site, projects, about, contact } = content;
  const [heroReady] = useState(createHeroReady);
  const [loaderDone, setLoaderDone] = useState(() => loaderMode() === 'skip');
  const [loaderShown] = useState(() => !loaderDone);
  const label = (id: string) => site.nav.find((item) => item.id === id)?.label ?? id;

  // A first visit to /#about: while the loader is up <main> is inert, so the browser's own jump to
  // the fragment lands nowhere. Once the loader releases the page, go there. Skip mode keeps the
  // browser's native behavior.
  useEffect(() => {
    if (!loaderShown || !loaderDone || !location.hash) return;
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [loaderShown, loaderDone]);

  return (
    <>
      <StickmanLayer touch={flags.touchStickman} />
      {!loaderDone && <Loader ready={heroReady.promise} onDone={() => setLoaderDone(true)} />}
      <main aria-busy={!loaderDone} inert={!loaderDone}>
        <ActiveNav items={site.nav} />

        <Hero site={site} onHeroDecode={heroReady.settleWith} ready={loaderDone} />

        <Projects projects={projects} heading={label('projects')} />

        <About about={about} heading={label('about')} />

        <Connect links={contact.links} heading={label('contact')} />
      </main>
      <Footer site={site} />
    </>
  );
}
