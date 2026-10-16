import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { installMatchMedia } from '../test-utils/media';
import { REDUCED_MOTION_QUERY, usePrefersReducedMotion } from './usePrefersReducedMotion';

describe('usePrefersReducedMotion', () => {
  let media: ReturnType<typeof installMatchMedia> | undefined;
  afterEach(() => {
    cleanup();
    media?.restore();
  });

  it('returns true when (prefers-reduced-motion: reduce) matches and updates on change', () => {
    media = installMatchMedia({ [REDUCED_MOTION_QUERY]: true });
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);

    act(() => media!.set(REDUCED_MOTION_QUERY, false));
    expect(result.current).toBe(false);

    act(() => media!.set(REDUCED_MOTION_QUERY, true));
    expect(result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    media = installMatchMedia();
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('stops listening on unmount', () => {
    media = installMatchMedia();
    const { unmount } = renderHook(() => usePrefersReducedMotion());
    expect(media.listenerCount(REDUCED_MOTION_QUERY)).toBe(1);
    unmount();
    expect(media.listenerCount(REDUCED_MOTION_QUERY)).toBe(0);
  });
});
