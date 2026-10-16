import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { site } from '../../content';
import { Nav } from './Nav';

describe('Nav', () => {
  afterEach(cleanup);

  it('renders labels in site.nav order', () => {
    render(<Nav items={site.nav} active="home" />);
    const nav = screen.getByRole('navigation', { name: 'Sections' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(site.nav.map((item) => item.label));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(site.nav.map((item) => `#${item.id}`));
  });

  it('marks exactly one link aria-current', () => {
    render(<Nav items={site.nav} active="about" />);
    const links = screen.getAllByRole('link');
    const current = links.filter((a) => a.hasAttribute('aria-current'));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('About');
    expect(current[0]).toHaveAttribute('aria-current', 'true');
  });

  it('moves aria-current when the active section changes', () => {
    const { rerender } = render(<Nav items={site.nav} active="home" />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'true');
    rerender(<Nav items={site.nav} active="contact" />);
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'true');
  });
});
