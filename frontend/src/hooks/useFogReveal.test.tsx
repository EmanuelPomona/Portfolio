import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
