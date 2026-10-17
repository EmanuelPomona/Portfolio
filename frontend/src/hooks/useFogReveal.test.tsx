import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { globalCss } from '../test-utils/cssTimings';
import { installIntersectionObserver, installMatchMedia } from '../test-utils/media';
import { useFogReveal } from './useFogReveal';
import { REDUCED_MOTION_QUERY } from './usePrefersReducedMotion';

function Probe() {
  const { ref, revealed } = useFogReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-fog="self" data-testid="probe">
      {revealed ? 'revealed' : 'fogged'}
    </div>
  );
}

function ArrivalProbe() {
  const { ref } = useFogReveal<HTMLDivElement>();
  return (
    <div ref={ref} data-fog="stagger" data-arrive="from-left" data-testid="arrival">
      <p>Plate</p>
      <a href="https://example.com/">Live site</a>
    </div>
  );
}

describe('useFogReveal', () => {
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

  it('marks revealed once the element intersects at 15%', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    expect(el).not.toHaveAttribute('data-revealed', 'true');

    act(() => io.intersect(el, 0.1));
    expect(el).not.toHaveAttribute('data-revealed', 'true');
    expect(el).toHaveTextContent('fogged');

    act(() => io.intersect(el, 0.15));
    expect(el).toHaveAttribute('data-revealed', 'true');
    expect(el).toHaveTextContent('revealed');
  });

  it('reveals an element taller than the viewport once it fills 15% of the viewport', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    // 6000px tall: 2% of it is 120px, which is over 15% of a 768px viewport.
    act(() => io.intersect(el, 0.02, { height: 6000, viewportHeight: 768 }));
    expect(el).toHaveAttribute('data-revealed', 'true');
  });

  it('is revealed immediately under reduced motion', () => {
    media.restore();
    media = installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    render(<Probe />);
    const el = screen.getByTestId('probe');
    expect(el).toHaveAttribute('data-revealed', 'true');
    expect(el).toHaveTextContent('revealed');
    // Instant, so turning reduced motion off later never plays a reveal for content already shown.
    expect(el).toHaveAttribute('data-reveal', 'instant');
  });

  it('settles once its reveal has finished, so a reduced-motion or print toggle never replays it', () => {
    // Regression (review, round 2): `animation: none !important` under reduced motion or print,
    // lifted again, restarted every finished reveal: the page blanked and slid back in.
    render(<ArrivalProbe />);
    const el = screen.getByTestId('arrival');
    act(() => io.intersect(el, 0.5));
    expect(el).toHaveAttribute('data-revealed', 'true');
    expect(el).not.toHaveAttribute('data-reveal');

    const end = (name: string) => {
      const event = new Event('animationend', { bubbles: true });
      Object.defineProperty(event, 'animationName', { value: name });
      act(() => {
        el.querySelector('p')!.dispatchEvent(event);
      });
    };
    end('unrelated');
    expect(el).not.toHaveAttribute('data-reveal');
    end('arrive');
    expect(el).toHaveAttribute('data-reveal', 'instant');
  });

  it('reveals an element that is already above the viewport', () => {
    // An observer reports only changes of intersection, so "above" arrives in two real ways.
    // 1. Its first report finds the element above: the page was restored or jumped past it before
    //    it was observed.
    const first = render(<Probe />);
    const above = first.getByTestId('probe');
    act(() => io.intersect(above, 0, { top: -900, height: 600 }));
    expect(above).toHaveAttribute('data-revealed', 'true');
    expect(above).toHaveAttribute('data-reveal', 'instant');
    first.unmount();

    // 2. It was crossing the viewport, under 15% of it shown, when a jump carried it off the top.
    render(<Probe />);
    const passing = screen.getByTestId('probe');
    act(() => io.intersect(passing, 0, { top: 2000, height: 600 })); // first report: below
    expect(passing).not.toHaveAttribute('data-revealed', 'true');
    act(() => io.intersect(passing, 0.05, { top: 730, height: 600 })); // its top edge enters
    expect(passing).not.toHaveAttribute('data-revealed', 'true');
    act(() => io.intersect(passing, 0, { top: -900, height: 600 })); // gone through the top
    expect(passing).toHaveAttribute('data-revealed', 'true');
    expect(passing).toHaveAttribute('data-reveal', 'instant');
  });

  it('focus within an unrevealed arrival reveals it immediately', () => {
    render(<ArrivalProbe />);
    const el = screen.getByTestId('arrival');
    const link = screen.getByRole('link', { name: 'Live site' });
    expect(el).not.toHaveAttribute('data-revealed', 'true');

    act(() => link.focus());
    expect(el).toHaveAttribute('data-revealed', 'true');
    // Instant: no fog, no travel, so focused content is fully visible in the same frame.
    expect(el).toHaveAttribute('data-reveal', 'instant');
    expect(globalCss).toMatch(/\[data-reveal='instant'\][^{]*\{[^}]*animation:\s*none/);

    act(() => link.blur());
    expect(el).toHaveAttribute('data-revealed', 'true');
  });

  it('shows focused content fully while its reveal is still running, without restarting it', () => {
    // M-04: the hero copy clears right after the loader, and a keyboard user can tab into it
    // mid-animation (measured at 0.93 opacity). Important declarations outrank the animation, and
    // leaving `animation` itself alone means nothing replays when focus moves on.
    const rule = globalCss.match(/\[data-fog='stagger'\] > :focus-within[^{]*\{([^}]*)\}/)?.[1] ?? '';
    expect(rule).toMatch(/opacity:\s*1 !important/);
    expect(rule).toMatch(/filter:\s*none !important/);
    expect(rule).toMatch(/translate:\s*none !important/);
    expect(rule).not.toMatch(/animation/);
    expect(globalCss).toMatch(/\[data-fog='self'\]:focus-within/);
  });

  it('never un-reveals', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    act(() => io.intersect(el, 0.5));
    expect(el).toHaveAttribute('data-revealed', 'true');

    act(() => io.intersect(el, 0));
    expect(el).toHaveAttribute('data-revealed', 'true');
    expect(el).toHaveTextContent('revealed');
    // Once revealed there is nothing left to watch.
    expect(io.watching(el)).toBe(false);
  });
});
