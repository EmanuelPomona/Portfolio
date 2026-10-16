// Owner: agent/frontend. Contact, set as the book's colophon (TASK-106): each way to reach Emanuel,
// with its real address beneath it.
import type { Link } from '../../content';
import { Section } from '../../components/Section/Section';
import { useFogReveal } from '../../hooks/useFogReveal';
import { displayAddress } from '../../lib/format';
import styles from './Connect.module.css';

interface ConnectProps {
  readonly links: readonly Link[];
  readonly heading: string;
}

export function Connect({ links, heading }: ConnectProps) {
  const { ref } = useFogReveal<HTMLUListElement>();
  return (
    <Section id="contact" heading={heading} className={styles.section}>
      <ul ref={ref} className={styles.list} data-fog="stagger">
        {links.map((link) => {
          const external = !link.href.startsWith('mailto:');
          return (
            <li key={link.kind}>
              <a
                className={styles.link}
                href={link.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                <span className={styles.label} data-label="">
                  {link.label}
                </span>
                <span className={styles.address}>{displayAddress(link.href)}</span>
                {external ? <span className="visually-hidden"> (opens in a new tab)</span> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
