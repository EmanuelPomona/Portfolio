import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contact } from '../../content';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { Connect } from './Connect';

describe('Connect', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    io = installIntersectionObserver();
    media = installMatchMedia();
  });
  afterEach(() => {
    cleanup();
    io.restore();
    media.restore();
  });

  it('renders LinkedIn, Email, GitHub in order with exact hrefs', () => {
    render(<Connect links={contact.links} heading="Contact" />);
    const region = screen.getByRole('region', { name: 'Contact' });
    expect(region).toHaveAttribute('id', 'contact');
    const links = within(region).getAllByRole('link');
    expect(links.map((a) => a.querySelector('[data-label]')?.textContent)).toEqual(['LinkedIn', 'Email', 'GitHub']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://www.linkedin.com/in/emanuel-ling-915a73244',
      'mailto:emanuelling27@gmail.com',
      'https://github.com/EmanuelPomona',
    ]);
  });

  it('opens web links in a new tab and keeps mailto in the same tab', () => {
    render(<Connect links={contact.links} heading="Contact" />);
    for (const a of screen.getAllByRole('link')) {
      if (a.getAttribute('href')!.startsWith('mailto:')) {
        expect(a).not.toHaveAttribute('target');
      } else {
        expect(a).toHaveAttribute('target', '_blank');
        expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  it('shows each real address under its label', () => {
    render(<Connect links={contact.links} heading="Contact" />);
    expect(screen.getByText('emanuelling27@gmail.com')).toBeInTheDocument();
    expect(screen.getByText('linkedin.com/in/emanuel-ling-915a73244')).toBeInTheDocument();
    expect(screen.getByText('github.com/EmanuelPomona')).toBeInTheDocument();
  });
});
