// Owner: agent/frontend. A quiet footer (TASK-106): copyright, and when the content was last updated.
import type { Site } from '../../content';
import { formatUpdated, yearOf } from '../../lib/format';
import styles from './Footer.module.css';

export function Footer({ site }: { readonly site: Site }) {
  const year = yearOf(site.updated);
  const updated = formatUpdated(site.updated);
  return (
    <footer className={styles.footer}>
      <p>{year ? `© ${year} ${site.name}` : `© ${site.name}`}</p>
      {updated ? <p>Updated {updated}</p> : null}
    </footer>
  );
}
