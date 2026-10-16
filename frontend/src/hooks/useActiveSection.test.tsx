import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SectionId } from '../content';
import { useActiveSection } from './useActiveSection';

const IDS: readonly SectionId[] = ['home', 'projects', 'about', 'contact'];

function Probe() {
  const active = useActiveSection(IDS);
  return (
    <>
      {IDS.map((id) => (
        <section key={id} id={id} />
      ))}
      <output data-testid="active">{active}</output>
    </>
  );
}

function placeSection(id: SectionId, top: number, bottom: number) {
  const el = document.getElementById(id)!;
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom,
    height: bottom - top,
    left: 0,
    right: 1000,
    width: 1000,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

describe('useActiveSection', () => {
  beforeEach(() => {
    // Run animation frames synchronously so a scroll is measured at once.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 0 });
  });

  it('defaults to home', () => {
    render(<Probe />);
    expect(screen.getByTestId('active')).toHaveTextContent('home');
  });

  it('returns the id whose rect contains innerHeight/2', () => {
    render(<Probe />);
    placeSection('home', -1600, -800);
    placeSection('projects', -800, 600); // contains y = 400
    placeSection('about', 600, 1800);
    placeSection('contact', 1800, 2400);
    scrollTo(1600);
    expect(screen.getByTestId('active')).toHaveTextContent('projects');

    placeSection('projects', -1400, 0);
    placeSection('about', 0, 1200); // contains y = 400
    placeSection('contact', 1200, 1800);
    scrollTo(2200);
    expect(screen.getByTestId('active')).toHaveTextContent('about');
  });

  it('returns the last id when scrolled to the bottom', () => {
    render(<Probe />);
    // A short Contact section never reaches the viewport center, even at the very bottom.
    placeSection('home', -3000, -2200);
    placeSection('projects', -2200, -400);
    placeSection('about', -400, 560); // contains y = 400
    placeSection('contact', 560, 800);
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3800 });
    scrollTo(3000); // 3000 + 800 = scrollHeight
    expect(screen.getByTestId('active')).toHaveTextContent('contact');
  });
});
