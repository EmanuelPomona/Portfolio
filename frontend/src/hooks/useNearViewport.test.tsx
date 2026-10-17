import { act, cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installIntersectionObserver } from '../test-utils/media';
import { useNearViewport } from './useNearViewport';

function Probe() {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const near = useNearViewport(el);
  return <div ref={setEl} data-testid="probe" data-near={near ? 'yes' : 'no'} />;
}

describe('useNearViewport', () => {
  let io: ReturnType<typeof installIntersectionObserver>;
  beforeEach(() => {
    io = installIntersectionObserver();
  });
  afterEach(() => {
    cleanup();
    io.restore();
  });

  it('stays false until the target nears the viewport, then latches true and stops watching', () => {
    render(<Probe />);
    const el = screen.getByTestId('probe');
    expect(el).toHaveAttribute('data-near', 'no');
    act(() => io.intersect(el, 0));
    expect(el).toHaveAttribute('data-near', 'no');
    act(() => io.intersect(el, 0.01));
    expect(el).toHaveAttribute('data-near', 'yes');
    expect(io.watching(el)).toBe(false);
  });

  it('looks ahead of the viewport, so the target is ready by the time it scrolls in', () => {
    render(<Probe />);
    expect(io.optionsFor(screen.getByTestId('probe'))?.rootMargin).toBe('50% 0px');
  });

  it('is true where IntersectionObserver is missing, rather than never', () => {
    io.restore();
    const original = window.IntersectionObserver;
    Reflect.deleteProperty(window, 'IntersectionObserver');
    try {
      render(<Probe />);
      expect(screen.getByTestId('probe')).toHaveAttribute('data-near', 'yes');
    } finally {
      window.IntersectionObserver = original;
      io = installIntersectionObserver();
    }
  });
});
