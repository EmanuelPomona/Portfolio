import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contact } from '../../content';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { Connect } from './Connect';

// K-01 (round 2): Contact is one sentence, "Contact: LinkedIn, Email, GitHub."
const SENTENCE = 'Contact: LinkedIn, Email, GitHub.';

function line(container: HTMLElement) {
  // The sentence is the element that holds the h2 and the links.
  const h2 = within(container).getByRole('heading', { level: 2, name: 'Contact' });
  return h2.parentElement!;
}

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

  it('renders Contact as one sentence reading "Contact: LinkedIn, Email, GitHub."', () => {
    const { container } = render(<Connect links={contact.links} heading="Contact" />);
    const sentence = line(container);
    expect(sentence.textContent!.replace(/\s+/g, ' ').trim()).toBe(SENTENCE);
    // X-04: the section is labelled by its h2 named "Contact".
    expect(screen.getByRole('region', { name: 'Contact' })).toHaveAttribute('id', 'contact');
  });

  it('links have the exact contact.ts hrefs in order, and the punctuation is outside every link', () => {
    const { container } = render(<Connect links={contact.links} heading="Contact" />);
    const links = within(line(container)).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://www.linkedin.com/in/emanuel-ling-915a73244',
      'mailto:emanuelling27@gmail.com',
      'https://github.com/EmanuelPomona',
    ]);
    expect(links.map((a) => a.textContent)).toEqual(['LinkedIn', 'Email', 'GitHub']);
    for (const a of links) expect(a.textContent).not.toMatch(/[:,.]/);
  });

  it('mailto opens in the same tab; LinkedIn and GitHub open a new tab with rel="noopener noreferrer"', () => {
    const { container } = render(<Connect links={contact.links} heading="Contact" />);
    for (const a of within(line(container)).getAllByRole('link')) {
      if (a.getAttribute('href')!.startsWith('mailto:')) {
        expect(a).not.toHaveAttribute('target');
        expect(a).toHaveAccessibleName('Email');
      } else {
        expect(a).toHaveAttribute('target', '_blank');
        expect(a).toHaveAttribute('rel', 'noopener noreferrer');
        // The new-tab notice is announced without becoming part of the visible sentence.
        expect(a).toHaveAccessibleDescription('opens in a new tab');
      }
    }
  });

  it('prints no addresses', () => {
    const { container } = render(<Connect links={contact.links} heading="Contact" />);
    expect(container.textContent).not.toMatch(/@|linkedin\.com|github\.com/);
  });
});
