import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { projects, type Project } from '../../content';
import { fogDelay, globalCss, partDeclaration, resolveNumber } from '../../test-utils/cssTimings';
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

  it('plates arrive from their own side: data-arrive matches data-side', () => {
    const { container } = render(<Projects projects={projects} heading="Projects" />);
    for (const plate of articles(container)) {
      expect(plate).toHaveAttribute('data-arrive', `from-${plate.dataset.side}`);
      // The arrival rides the fog reveal the plate already has.
      expect(plate).toHaveAttribute('data-fog', 'stagger');
    }
    // From the left means a negative x offset, from the right a positive one.
    expect(globalCss).toMatch(/\[data-arrive='from-left'\]\s*\{[^}]*--arrive-dir-x:\s*-1/);
    expect(globalCss).toMatch(/\[data-arrive='from-right'\]\s*\{[^}]*--arrive-dir-x:\s*1/);
    // The window travels about 48px; its title and caption about 16px.
    const distance = (cls: string) => resolveNumber(partDeclaration(css, cls, '--arrive-distance') ?? '0px');
    expect(distance('window')).toBe(48);
    expect(distance('title')).toBe(16);
    expect(distance('caption')).toBe(16);
  });

  it("the caption's arrival starts after its window's", () => {
    const { container } = render(<Projects projects={[projects[0]!]} heading="Projects" />);
    const parts = [...articles(container)[0]!.children];
    // 1-based child positions, which set each part's fog-clear delay.
    const nth = (find: (el: Element) => boolean) => parts.findIndex(find) + 1;
    const title = nth((el) => el.tagName === 'H3');
    const caption = nth((el) => el.textContent!.includes(projects[0]!.sentence));
    const windowPart = nth((el) => el.querySelector('a') !== null && el.tagName !== 'H3' && !el.textContent!.includes(projects[0]!.sentence));
    expect([title, windowPart, caption].every((n) => n > 0)).toBe(true);

    const start = (n: number, cls: string) => fogDelay(n) + resolveNumber(partDeclaration(css, cls, '--arrive-delay') ?? '0s');
    const windowStart = start(windowPart, 'window');
    // A beat, not a stagger: clearly after the window has started moving.
    expect(start(caption, 'caption')).toBeGreaterThanOrEqual(windowStart + 0.1);
    expect(start(title, 'title')).toBeGreaterThan(windowStart);
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
