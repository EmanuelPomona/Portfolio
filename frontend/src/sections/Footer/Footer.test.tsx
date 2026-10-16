import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { site } from '../../content';
import { Footer } from './Footer';

describe('Footer', () => {
  afterEach(cleanup);

  it('is the page footer with the copyright and the updated month', () => {
    render(<Footer site={site} />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('© 2026 Emanuel Ling');
    expect(footer).toHaveTextContent('Updated October 2026');
    expect(footer.textContent).not.toMatch(/[\u2014\u00b7]/); // no em dash, no dot-joined strip
  });

  it('leaves out the updated line rather than print a broken date', () => {
    render(<Footer site={{ ...site, updated: 'soon' }} />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent('© Emanuel Ling');
    expect(footer.textContent).not.toMatch(/Updated|Invalid/);
  });
});
