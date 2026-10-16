// Owner: agent/frontend.
// The page. Keeps the mount contract (docs/API.md §2.5): StickmanLayer always mounted, Loader
// mounted until onDone, <main> inert and aria-busy while the loader is up, and `ready` created
// once from the same hero source the hero renders.
// TASK-101: shell, nav, and sections. Section contents are still the scaffold's plain markup;
// TASK-102 to TASK-106 replace them.
import { useMemo, useState } from 'react';
import { Nav } from '../components/Nav/Nav';
import { Section } from '../components/Section/Section';
import { flags } from '../config/flags';
import { content, getMedia } from '../content';
import { useActiveSection } from '../hooks/useActiveSection';
import { Loader, StickmanLayer, loaderMode } from '../stickman';

function decodeImage(src: string): Promise<unknown> {
  const img = new Image();
  img.src = src;
  return img.decode();
}

export function App() {
  const { site, projects, about, contact } = content;
  const heroReady = useMemo(() => decodeImage(getMedia(site.heroImage).fallback.src), [site.heroImage]);
  const [loaderDone, setLoaderDone] = useState(() => loaderMode() === 'skip');
  const sectionIds = site.nav.map((item) => item.id);
  const active = useActiveSection(sectionIds);
  const label = (id: string) => site.nav.find((item) => item.id === id)?.label ?? id;

  return (
    <>
      <StickmanLayer touch={flags.touchStickman} />
      {!loaderDone && <Loader ready={heroReady} onDone={() => setLoaderDone(true)} />}
      <main aria-busy={!loaderDone} inert={!loaderDone}>
        <Nav items={site.nav} active={active} />

        <Section id="home">
          <h1>{site.name}</h1>
          <p>{site.tagline}</p>
          <ul>
            {site.heroLinks.map((link) => (
              <li key={link.kind}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </Section>

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
