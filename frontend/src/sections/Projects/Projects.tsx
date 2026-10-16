// Owner: agent/frontend. Projects as plates in a book (TASK-104, wireframe 2): each window is the
// plate, its caption set on the facing side, sides alternating down the page.
import type { Project } from '../../content';
import { BrowserWindow } from '../../components/BrowserWindow/BrowserWindow';
import { Section } from '../../components/Section/Section';
import { useFogReveal } from '../../hooks/useFogReveal';
import styles from './Projects.module.css';

interface ProjectsProps {
  readonly projects: readonly Project[];
  readonly heading: string;
}

/** Matches the layout: 7 or 6 of 12 columns from 1024px up, the content width below. */
const WINDOW_SIZES = '(min-width: 90rem) 760px, (min-width: 64rem) 54vw, 92vw';

function Plate({ project, index }: { readonly project: Project; readonly index: number }) {
  const { ref } = useFogReveal<HTMLElement>();
  const number = String(index + 1).padStart(2, '0');
  return (
    <article
      ref={ref}
      id={`project-${project.id}`}
      className={styles.plate}
      data-side={index % 2 === 0 ? 'left' : 'right'}
      data-fog="stagger"
    >
      <h3 className={styles.title}>
        {/* The spaces stay outside the hidden slash, so the heading is named "01 SagePlan". */}
        <span className={styles.number}>{number}</span>{' '}
        <span className={styles.slash} aria-hidden="true">
          /
        </span>{' '}
        <em className={styles.name}>{project.title}</em>
      </h3>
      <div className={styles.window}>
        <BrowserWindow project={project} sizes={WINDOW_SIZES} />
      </div>
      <div className={styles.caption}>
        <p className={styles.sentence}>{project.sentence}</p>
        <p className={styles.meta}>{project.meta.join(' · ')}</p>
        {project.secondary.length > 0 ? (
          <ul className={styles.links}>
            {project.secondary.map((link) => (
              <li key={link.href}>
                <a className={styles.link} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}

export function Projects({ projects, heading }: ProjectsProps) {
  return (
    <Section id="projects" heading={heading} backdrop="evergreen" className={styles.section}>
      <div className={styles.list}>
        {projects.map((project, i) => (
          <Plate key={project.id} project={project} index={i} />
        ))}
      </div>
    </Section>
  );
}
