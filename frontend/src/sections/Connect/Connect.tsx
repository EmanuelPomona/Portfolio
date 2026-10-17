// Owner: agent/frontend. Contact as one sentence (TASK-109, round 2): "Contact: LinkedIn, Email,
// GitHub." The owner asked for it on one line; it reads as the colophon's last line.
import { Fragment } from 'react';
import type { Link } from '../../content';
import { Section } from '../../components/Section/Section';
import { useFogReveal } from '../../hooks/useFogReveal';
import styles from './Connect.module.css';

interface ConnectProps {
  readonly links: readonly Link[];
  readonly heading: string;
}

const HEADING_ID = 'contact-heading';
const NEW_TAB_ID = 'contact-new-tab';

export function Connect({ links, heading }: ConnectProps) {
  const { ref } = useFogReveal<HTMLDivElement>();
  return (
    <Section id="contact" labelledBy={HEADING_ID} clouds className={styles.section}>
      {/* The h2 sits inside the sentence; the punctuation stays outside every link. */}
      <div ref={ref} className={styles.line} data-fog="self">
        <h2 id={HEADING_ID} className={styles.heading}>
          {heading}
        </h2>
        :{' '}
        {links.map((link, i) => {
          const external = !link.href.startsWith('mailto:');
          return (
            <Fragment key={link.kind}>
              <a
                className={styles.link}
                href={link.href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer', 'aria-describedby': NEW_TAB_ID }
                  : {})}
              >
                {link.label}
              </a>
              {i < links.length - 1 ? ', ' : '.'}
            </Fragment>
          );
        })}
      </div>
      {/* Announced as the links' description, never shown: the visible line stays one sentence. */}
      <span id={NEW_TAB_ID} hidden>
        opens in a new tab
      </span>
    </Section>
  );
}
