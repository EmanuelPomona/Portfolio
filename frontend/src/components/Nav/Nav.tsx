// Owner: agent/frontend. The centered section nav (TASK-101, wireframe 1).
import type { NavItem, SectionId } from '../../content';
import styles from './Nav.module.css';

interface NavProps {
  readonly items: readonly NavItem[];
  readonly active: SectionId;
}

export function Nav({ items, active }: NavProps) {
  return (
    <nav aria-label="Sections" className={styles.nav} data-over-hero={active === 'home'}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              className={styles.link}
              href={`#${item.id}`}
              aria-current={item.id === active ? 'true' : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
