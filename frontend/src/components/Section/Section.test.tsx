import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { installFrames } from '../../test-utils/frames';
import { Section } from './Section';

const css = readFileSync(join(__dirname, 'Section.module.css'), 'utf8');

describe('Section', () => {
  afterEach(cleanup);

  it('renders a section with its id, named by an h2 when a heading is given', () => {
    const { container } = render(
      <Section id="projects" heading="Projects">
        <p>body</p>
      </Section>,
    );
    const section = container.querySelector('section#projects');
    expect(section).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Projects' })).toBe(section);
  });

  it('renders no heading when none is given', () => {
    render(
      <Section id="home">
        <p>body</p>
      </Section>,
    );
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('lets the backdrop lag the scroll downward only (--depth), clipped to its own section', () => {
    const frames = installFrames();
    try {
      const { container } = render(
        <Section id="about" heading="About" backdrop="evergreen">
          <p>body</p>
        </Section>,
      );
      frames.flush();
      const backdrop = container.querySelector('img')!.closest('[aria-hidden="true"]') as HTMLElement;
      expect(backdrop.style.getPropertyValue('--depth')).toMatch(/^-?[\d.]+px$/);
      // Down only: --depth runs -80..80px, the backdrop 0..80px. Moving up would lift its
      // half-faded top above the section's clip and cut it (a luminance step at the boundary).
      expect(css).toMatch(/\.backdrop\s*\{[^}]*translate:\s*0 calc\(\(var\(--depth, 0px\) \+ 80px\) \/ 2\)/);
      // Offsets and arrivals never spill into the next section or widen the page.
      expect(css).toMatch(/\.section\s*\{[^}]*overflow:\s*clip/);
    } finally {
      frames.restore();
    }
  });

  it('paints the evergreen backdrop as a decorative image hidden from assistive tech', () => {
    const { container } = render(
      <Section id="about" heading="About" backdrop="evergreen">
        <p>body</p>
      </Section>,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
    expect(img!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('paints no backdrop by default', () => {
    const { container } = render(
      <Section id="contact" heading="Contact">
        <p>body</p>
      </Section>,
    );
    expect(container.querySelector('img')).toBeNull();
  });
});
