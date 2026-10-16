import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Section } from './Section';

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
