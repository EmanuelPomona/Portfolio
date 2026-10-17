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
  });

  it('reveals an element that is already above the viewport', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    // Below the viewport and not intersecting: it stays in the fog.
    act(() => io.intersect(el, 0, { top: 2000, height: 600 }));
    expect(el).not.toHaveAttribute('data-revealed', 'true');
    // Entirely above it (a nav jump past it, or a load at #about): revealed at once, no motion.
    act(() => io.intersect(el, 0, { top: -900, height: 600 }));
    expect(el).toHaveAttribute('data-revealed', 'true');
    expect(el).toHaveAttribute('data-reveal', 'instant');
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
