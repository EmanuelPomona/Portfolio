// Owner: agent/frontend.
// WALKING SKELETON from the manager scaffold: unstyled, semantic, real content. agent/frontend
// replaces everything here EXCEPT the mount contract (docs/API.md §2.5): StickmanLayer always
// mounted, Loader mounted until onDone, <main> inert while the loader is up.
import { useMemo, useState } from 'react';
import { flags } from '../config/flags';
import { content, getMedia } from '../content';
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

  return (
    <>
      <StickmanLayer touch={flags.touchStickman} />
      {!loaderDone && <Loader ready={heroReady} onDone={() => setLoaderDone(true)} />}
      <main aria-busy={!loaderDone} inert={!loaderDone}>
        <nav aria-label="Sections">
          {site.nav.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>

        <section id="home">
          <h1>{site.name}</h1>
          <p>{site.tagline}</p>
          <ul>
            {site.heroLinks.map((link) => (
              <li key={link.kind}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </section>

        <section id="projects">
          <h2>Projects</h2>
          {projects.map((project, i) => (
            <article key={project.id} id={`project-${project.id}`}>
              <h3>
                {String(i + 1).padStart(2, '0')} / {project.title}
              </h3>
              <p>{project.sentence}</p>
              <p>{project.meta.join(' · ')}</p>
              <a href={project.primary.href} target="_blank" rel="noreferrer">
                {project.addressBar}
              </a>
              {project.secondary.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              ))}
            </article>
          ))}
        </section>

        <section id="about">
          <h2>About</h2>
          <p>{about.description}</p>
          <h3>{about.classes.label}</h3>
          <ul>
            {about.classes.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section id="contact">
          <h2>Contact</h2>
          <ul>
            {contact.links.map((link) => (
              <li key={link.kind}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
