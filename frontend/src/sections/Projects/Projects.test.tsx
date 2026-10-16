import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { projects, type Project } from '../../content';
import { installIntersectionObserver, installMatchMedia } from '../../test-utils/media';
import { Projects } from './Projects';

const css = readFileSync(join(__dirname, 'Projects.module.css'), 'utf8');

function articles(container: HTMLElement) {
  return [...container.querySelectorAll('article')];
}

describe('Projects', () => {
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

  it('renders four articles in content order with numbers 01..04', () => {
    const { container } = render(<Projects projects={projects} heading="Projects" />);
    const list = articles(container);
    expect(list.map((a) => a.id)).toEqual(projects.map((p) => `project-${p.id}`));
    const headings = list.map((a) => within(a).getByRole('heading', { level: 3 }));
    expect(headings.map((h) => h.textContent)).toEqual(
      projects.map((p, i) => `${String(i + 1).padStart(2, '0')} / ${p.title}`),
    );
    // The section itself is the Projects region with its h2.
    expect(screen.getByRole('region', { name: 'Projects' })).toHaveAttribute('id', 'projects');
  });

  it('names each heading with its number and title, separated, without the decorative slash', () => {
    render(<Projects projects={projects} heading="Projects" />);
    for (const [i, p] of projects.entries()) {
      const number = String(i + 1).padStart(2, '0');
      expect(screen.getByRole('heading', { level: 3, name: `${number} ${p.title}` })).toBeInTheDocument();
    }
  });

  it('sets each title in italics as the title of a work', () => {
    const { container } = render(<Projects projects={projects} heading="Projects" />);
    for (const [i, a] of articles(container).entries()) {
      expect(within(a).getByRole('heading', { level: 3 }).querySelector('em')).toHaveTextContent(projects[i]!.title);
    }
  });

  it('caption shows the exact sentence and meta joined by " · "', () => {
    const { container } = render(<Projects projects={projects} heading="Projects" />);
    for (const [i, a] of articles(container).entries()) {
      const p = projects[i]!;
      expect(within(a).getByText(p.sentence, { exact: true })).toBeInTheDocument();
      expect(within(a).getByText(p.meta.join(' · '), { exact: true })).toBeInTheDocument();
    }
  });

  it('secondary links never repeat the primary href', () => {
    const { container } = render(<Projects projects={projects} heading="Projects" />);
    for (const [i, a] of articles(container).entries()) {
      const p = projects[i]!;
      const hrefs = within(a).getAllByRole('link').map((l) => l.getAttribute('href'));
      expect(hrefs.filter((h) => h === p.primary.href)).toHaveLength(1); // the window only
      expect(hrefs.slice(1)).toEqual(p.secondary.map((s) => s.href));
      for (const link of within(a).getAllByRole('link')) {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  it('data-side alternates left,right,left,right', () => {
    const { container } = render(<Projects projects={projects} heading="Projects" />);
    expect(articles(container).map((a) => a.dataset.side)).toEqual(['left', 'right', 'left', 'right']);
  });

  it('keeps the backdrop pines out from under the captions where plates alternate (X-02)', () => {
    // Regression guard for the measured 1.8:1 caption contrast at 1024px: from 64rem the photo is
    // mirrored behind the first window and its caption-side edge dissolves early.
    const wide = css.match(/@media \(min-width: 64rem\)\s*\{\s*\.section\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(wide).toMatch(/--backdrop-flip:\s*-1/);
    expect(wide).toMatch(/--backdrop-edge-from:\s*\d+%/);
    expect(wide).toMatch(/--backdrop-edge-far:\s*\d+%/);
    // Stacked layouts keep the photo's own orientation, which measured clean.
    expect(css.replace(/@media[^{]*\{[\s\S]*?\n\}/g, '')).not.toMatch(/--backdrop-flip/);
  });

  it('a 60-character title fixture renders without truncation', () => {
    const title = 'A Sixty Character Project Title That Wraps Across Two Lines!';
    expect(title).toHaveLength(60);
    const long: Project = { ...projects[0]!, id: 'long-title', title };
    render(<Projects projects={[long]} heading="Projects" />);
    expect(screen.getByRole('heading', { level: 3 }).querySelector('em')!.textContent).toBe(title);
    // Wrapping, never clipping: titles wrap anywhere and balance their lines.
    expect(css).toMatch(/\.title\s*\{[^}]*overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/\.title\s*\{[^}]*text-wrap:\s*balance/);
    expect(css).not.toMatch(/\.title\s*\{[^}]*text-overflow/);
  });
});
