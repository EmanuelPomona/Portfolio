import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { projects, type Project } from '../../content';
import { FINE_POINTER_QUERY } from '../../hooks/useMediaQuery';
import { installMatchMedia } from '../../test-utils/media';
import { BrowserWindow } from './BrowserWindow';
import styles from './BrowserWindow.module.css';

// jsdom computes no stylesheet layout, so the rules themselves are asserted from the source file.
// (Vitest intercepts .css imports, including ?raw, so it is read from disk.)
const css = readFileSync(join(__dirname, 'BrowserWindow.module.css'), 'utf8');

const sageplan = projects[0]!;

// TEST FIXTURE ONLY (W-04). Shipped content never puts a photograph in a project window.
// The evergreen photo is 1024x1536 (2:3), so it is also the non-16:10 screenshot case.
const withScreenshot: Project = {
  ...sageplan,
  screen: { image: 'backgrounds/evergreen-forest', alt: 'Fixture screenshot' },
};

const SIZES = '(min-width: 1024px) 56vw, 92vw';

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

describe('BrowserWindow', () => {
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true });
  });
  afterEach(() => {
    cleanup();
    media.restore();
  });

  it('is one link to primary.href in a new tab, named "<title>, <label>, <addressBar>, screenshot soon" while empty (W-05, ADR-010)', () => {
    render(<BrowserWindow project={sageplan} sizes={SIZES} />);
    const link = screen.getByRole('link', { name: 'SagePlan, Live site, sageplan.vercel.app, screenshot soon' });
    expect(link).toHaveAttribute('href', 'https://sageplan.vercel.app');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('names every shipped window with text it visibly shows (WCAG 2.5.3 Label in Name)', () => {
    for (const project of projects) {
      const { unmount } = render(<BrowserWindow project={project} sizes={SIZES} />);
      const link = screen.getByRole('link');
      expect(link.getAttribute('aria-label')).toContain(project.addressBar);
      expect(link.textContent).toContain(project.addressBar);
      // Every shipped window is empty, so its visible placeholder is part of the name too.
      expect(link.textContent).toContain('screenshot soon');
      expect(link.getAttribute('aria-label')).toMatch(/, screenshot soon$/);
      unmount();
    }
  });

  it('separates the address and the placeholder with whitespace, so their words never fuse', () => {
    // Text-content readers (axe's label-in-name check among them) join adjacent elements' text with
    // nothing between them: without a separator they read "...vercel.appscreenshot soon".
    render(<BrowserWindow project={sageplan} sizes={SIZES} />);
    expect(screen.getByRole('link').textContent).toMatch(/sageplan\.vercel\.app\s+screenshot soon/);
  });

  it('drops "screenshot soon" from the name once the window shows a screenshot', () => {
    render(<BrowserWindow project={withScreenshot} sizes={SIZES} />);
    expect(screen.getByRole('link')).toHaveAttribute('aria-label', 'SagePlan, Live site, sageplan.vercel.app');
  });

  it('shows exactly project.addressBar in the address field', () => {
    const { container } = render(<BrowserWindow project={projects[1]!} sizes={SIZES} />);
    const field = container.querySelector(`.${styles.address}`)!;
    expect(field.textContent).toBe('github.com/EmanuelPomona/Street-Safe-LA');
  });

  it('renders the empty state, and no image, when screen.image is null (W-03)', () => {
    const { container } = render(<BrowserWindow project={sageplan} sizes={SIZES} />);
    expect(screen.getByText('screenshot soon')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders every shipped project window empty (W-03)', () => {
    for (const project of projects) {
      const { container, unmount } = render(<BrowserWindow project={project} sizes={SIZES} />);
      expect(container.querySelector('img')).toBeNull();
      unmount();
    }
  });

  it('shows the fixture screenshot and toggles data-state on hover and on focus (W-04)', () => {
    const { container } = render(<BrowserWindow project={withScreenshot} sizes={SIZES} />);
    const link = screen.getByRole('link');
    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.queryByText('screenshot soon')).toBeNull();
    expect(link).toHaveAttribute('data-state', 'rest');

    fireEvent.mouseEnter(link);
    expect(link).toHaveAttribute('data-state', 'attention');
    fireEvent.mouseLeave(link);
    expect(link).toHaveAttribute('data-state', 'rest');

    fireEvent.keyDown(document, { key: 'Tab' });
    act(() => link.focus());
    expect(link).toHaveAttribute('data-state', 'attention');
    act(() => link.blur());
    expect(link).toHaveAttribute('data-state', 'rest');
  });

  it('darkens and desaturates the screenshot at rest and clears it on attention (W-04)', () => {
    expect(rule('.cover')).toMatch(/filter:\s*grayscale\(1\)/);
    expect(rule(".window[data-state='attention'] .cover")).toMatch(/filter:\s*none/);
    expect(rule('.screen::after')).toMatch(/opacity:\s*0\.\d+/);
    expect(rule(".window[data-state='attention'] .screen::after")).toMatch(/opacity:\s*0;/);
  });

  it('a non-16:10 screenshot is cropped with object-fit cover inside the 16:10 screen', () => {
    const { container } = render(<BrowserWindow project={withScreenshot} sizes={SIZES} />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('width', '1024');
    expect(img).toHaveAttribute('height', '1536');
    expect(img).toHaveClass(styles.cover!);
    expect(img.closest(`.${styles.screen}`)).not.toBeNull();
    expect(rule('.screen')).toMatch(/aspect-ratio:\s*16\s*\/\s*10/);
    expect(rule('.cover')).toMatch(/object-fit:\s*cover/);
  });

  it('falls back to the empty state when the image fails to load', () => {
    const { container } = render(<BrowserWindow project={withScreenshot} sizes={SIZES} />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('screenshot soon')).toBeInTheDocument();
  });
});
