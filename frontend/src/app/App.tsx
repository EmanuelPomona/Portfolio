// Owner: agent/frontend.
// The page. Keeps the mount contract (docs/API.md §2.5): StickmanLayer always mounted, Loader
// mounted until onDone, <main> inert and aria-busy while the loader is up, and `ready` created
// once from the same hero source the hero renders.
// TASK-101: shell, nav, and sections. Section contents are still the scaffold's plain markup;
// TASK-102 to TASK-106 replace them.
import { useState } from 'react';
import { Nav } from '../components/Nav/Nav';
import { Section } from '../components/Section/Section';
import { flags } from '../config/flags';
import { content, type NavItem } from '../content';
import { useActiveSection } from '../hooks/useActiveSection';
import { Hero } from '../sections/Hero/Hero';
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
  const label = (id: string) => site.nav.find((item) => item.id === id)?.label ?? id;

  return (
    <>
      <StickmanLayer touch={flags.touchStickman} />
      {!loaderDone && <Loader ready={heroReady.promise} onDone={() => setLoaderDone(true)} />}
      <main aria-busy={!loaderDone} inert={!loaderDone}>
        <ActiveNav items={site.nav} />

        <Hero site={site} onHeroDecode={heroReady.settleWith} ready={loaderDone} />

        <Section id="projects" heading={label('projects')} backdrop="evergreen">
          {projects.map((project, i) => (
            <article key={project.id} id={`project-${project.id}`}>
              <h3>
                {String(i + 1).padStart(2, '0')} / {project.title}
              </h3>
              <p>{project.sentence}</p>
              <p>{project.meta.join(' · ')}</p>
              <a href={project.primary.href} target="_blank" rel="noopener noreferrer">
                {project.addressBar}
              </a>
              {project.secondary.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </article>
          ))}
        </Section>

        <Section id="about" heading={label('about')} backdrop="evergreen">
          <p>{about.description}</p>
          <h3>{about.classes.label}</h3>
          <ul>
            {about.classes.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section id="contact" heading={label('contact')}>
          <ul>
            {contact.links.map((link) => (
              <li key={link.kind}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </>
  );
}
