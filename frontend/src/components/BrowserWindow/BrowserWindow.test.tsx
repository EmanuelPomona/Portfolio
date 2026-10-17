import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMedia, projects, type Project } from '../../content';
import { FINE_POINTER_QUERY } from '../../hooks/useMediaQuery';
import { REDUCED_MOTION_QUERY } from '../../hooks/usePrefersReducedMotion';
import { installMatchMedia } from '../../test-utils/media';
import { BrowserWindow } from './BrowserWindow';
import styles from './BrowserWindow.module.css';

// jsdom computes no stylesheet layout, so the rules themselves are asserted from the source file.
// (Vitest intercepts .css imports, including ?raw, so it is read from disk.)
const css = readFileSync(join(__dirname, 'BrowserWindow.module.css'), 'utf8');

const sageplan = projects[0]!;

// TEST FIXTURE ONLY (W-04). A window only ever shows its own project's screenshot (W-03); the
// evergreen photo stands in for one here. It is 1024x1536 (2:3), so it is also the non-16:10 case.
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
      // An empty window's visible placeholder is part of the name too; a filled one has neither.
      if (project.screen.image === null) {
        expect(link.textContent).toContain('screenshot soon');
        expect(link.getAttribute('aria-label')).toMatch(/, screenshot soon$/);
      } else {
        expect(link.textContent).not.toContain('screenshot soon');
        expect(link.getAttribute('aria-label')).not.toContain('screenshot soon');
      }
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

  it('renders each shipped window empty exactly when its screen.image is null (W-03)', () => {
    for (const project of projects) {
      const { container, unmount } = render(<BrowserWindow project={project} sizes={SIZES} />);
      const empty = project.screen.image === null;
      expect(container.querySelector('img, video') === null).toBe(empty);
      expect(container.textContent?.includes('screenshot soon')).toBe(empty);
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

// TEST FIXTURE ONLY (W-08). A recording only ever shows its own project (W-03); the evergreen photo
// stands in for the poster frame and the URL is never fetched (jsdom loads no media).
const withRecording: Project = {
  ...sageplan,
  screen: {
    image: 'backgrounds/evergreen-forest',
    alt: 'Fixture poster',
    video: { src: '/media/video/fixture.mp4', width: 1270, height: 940 },
  },
};

/** Every URL the poster's renditions offer: each srcset candidate and the JPEG fallback. */
function renditionUrls(id: NonNullable<Project['screen']['image']>): string[] {
  const media = getMedia(id);
  const fromSrcset = (srcset: string) => srcset.split(',').map((c) => c.trim().split(/\s+/)[0]!);
  return [...media.sources.flatMap((s) => fromSrcset(s.srcset)), ...fromSrcset(media.fallback.srcset), media.fallback.src];
}

describe('BrowserWindow with a recording (W-08, ADR-012)', () => {
  let media: ReturnType<typeof installMatchMedia>;
  beforeEach(() => {
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true });
  });
  afterEach(() => {
    cleanup();
    media.restore();
    vi.restoreAllMocks();
  });

  it('renders a muted, looping, playsinline video with preload="none" and the poster from screen.image', () => {
    const { container } = render(<BrowserWindow project={withRecording} sizes={SIZES} />);
    const video = container.querySelector('video')!;
    expect(video).not.toBeNull();
    expect(video.closest(`.${styles.screen}`)).not.toBeNull();
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video).toHaveAttribute('preload', 'none');
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('src', '/media/video/fixture.mp4');
    expect(renditionUrls('backgrounds/evergreen-forest')).toContain(video.getAttribute('poster'));
  });

  it('plays on attention and pauses, holding its frame, when attention leaves', () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    const { container } = render(<BrowserWindow project={withRecording} sizes={SIZES} />);
    const link = screen.getByRole('link');
    const video = container.querySelector('video')!;
    // Nothing plays, and nothing is fetched, at rest.
    expect(play).not.toHaveBeenCalled();

    fireEvent.mouseEnter(link);
    expect(play).toHaveBeenCalledTimes(1);
    expect(play.mock.contexts[0]).toBe(video);

    // Holding the frame: a pause, never a rewind or a reload.
    let rewound = false;
    Object.defineProperty(video, 'currentTime', { configurable: true, get: () => 12.5, set: () => { rewound = true; } });
    fireEvent.mouseLeave(link);
    expect(pause).toHaveBeenCalled();
    expect(rewound).toBe(false);
    expect(load).not.toHaveBeenCalled();

    // Keyboard focus is attention too.
    play.mockClear();
    fireEvent.keyDown(document, { key: 'Tab' });
    act(() => link.focus());
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('never plays under reduced motion; the poster shows instead', () => {
    media.restore();
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const { container } = render(<BrowserWindow project={withRecording} sizes={SIZES} />);
    const link = screen.getByRole('link');
    fireEvent.mouseEnter(link);
    // Attention still shows (the glass lifts, color arrives), but nothing moves.
    expect(link).toHaveAttribute('data-state', 'attention');
    expect(play).not.toHaveBeenCalled();
    expect(container.querySelector('video')).toHaveAttribute('poster');

    // Turning reduced motion on mid-play pauses it.
    media.restore();
    media = installMatchMedia({ [FINE_POINTER_QUERY]: true });
    cleanup();
    const second = render(<BrowserWindow project={withRecording} sizes={SIZES} />);
    const pause = vi.mocked(HTMLMediaElement.prototype.pause);
    pause.mockClear();
    fireEvent.mouseEnter(second.getByRole('link'));
    expect(play).toHaveBeenCalledTimes(1);
    act(() => media.set(REDUCED_MOTION_QUERY, true));
    expect(pause).toHaveBeenCalled();
  });

  it('a rejected play() is swallowed, with no unhandled rejection or console error', async () => {
    // Browsers reject play() when autoplay policy, a quick hover-out, or a missing codec interrupts
    // it. That is not an error worth a console line; the poster simply stays.
    // A plain stub, not vi.spyOn: a spy attaches its own handlers to a returned promise (to record
    // settledResults), which would mark the rejection handled and make this test unable to fail.
    const original = HTMLMediaElement.prototype.play;
    let calls = 0;
    HTMLMediaElement.prototype.play = function play() {
      calls += 1;
      return Promise.reject(new DOMException('The play() request was interrupted by a call to pause().', 'AbortError'));
    };
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error');
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    try {
      render(<BrowserWindow project={withRecording} sizes={SIZES} />);
      fireEvent.mouseEnter(screen.getByRole('link'));
      expect(calls).toBe(1);
      // Let the rejection settle, and Node's unhandled-rejection check run.
      await new Promise((resolve) => setTimeout(resolve, 30));
      expect(unhandled).not.toHaveBeenCalled();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
      HTMLMediaElement.prototype.play = original;
    }
  });

  it('falls back to the still poster when the video errors', () => {
    const { container } = render(<BrowserWindow project={withRecording} sizes={SIZES} />);
    fireEvent.error(container.querySelector('video')!);
    expect(container.querySelector('video')).toBeNull();
    // The poster frame as a still screenshot, fitted the way the recording was: never the empty state.
    const img = container.querySelector('img')!;
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', getMedia('backgrounds/evergreen-forest').fallback.src);
    expect(img).toHaveClass(styles.contain!);
    expect(screen.queryByText('screenshot soon')).toBeNull();
    expect(screen.getByRole('link')).toHaveAccessibleName('SagePlan, Live site, sageplan.vercel.app');
  });

  it('the video is aria-hidden and the window\'s name is unchanged', () => {
    const { container } = render(<BrowserWindow project={withRecording} sizes={SIZES} />);
    expect(container.querySelector('video')).toHaveAttribute('aria-hidden', 'true');
    // The same name as a window with a still screenshot: no "screenshot soon", nothing about video.
    const still = render(<BrowserWindow project={withScreenshot} sizes={SIZES} />);
    const names = screen.getAllByRole('link').map((link) => link.getAttribute('aria-label'));
    expect(names).toEqual(['SagePlan, Live site, sageplan.vercel.app', 'SagePlan, Live site, sageplan.vercel.app']);
    still.unmount();
  });

  it('fits the recording with contain on black', () => {
    // Recordings are rarely 16:10: letterboxed whole on the screen's black, never stretched or cut.
    const video = rule('.video');
    expect(video).toMatch(/object-fit:\s*contain/);
    expect(video).toMatch(/width:\s*100%/);
    expect(video).toMatch(/height:\s*100%/);
    expect(video).toMatch(/background(-color)?:\s*var\(--color-screen-off\)/);
    expect(rule('.screen')).toMatch(/background:\s*var\(--color-screen-off\)/);
    // The same glass as a screenshot (W-04): gray at rest, color on attention; the still fallback too.
    expect(video).toMatch(/filter:\s*grayscale\(1\)/);
    expect(rule('.contain')).toMatch(/object-fit:\s*contain/);
    expect(css).toMatch(/\.window\[data-state='attention'\] \.video,\s*\.window\[data-state='attention'\] \.contain\s*\{[^}]*filter:\s*none/);
  });
});
