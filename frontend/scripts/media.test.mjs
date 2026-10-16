// @vitest-environment node
// Owner: agent/backend. Media pipeline tests (TASK-302): pure helpers, then the real CLI against temp dirs.
import { describe, expect, it } from 'vitest';
import { mediaIdFromPath, planWidths, renditionPath } from './media-lib.mjs';

describe('mediaIdFromPath', () => {
  it('mediaIdFromPath accepts kebab paths and rejects "My Photo.PNG"', () => {
    expect(mediaIdFromPath('projects/sageplan.png')).toBe('projects/sageplan');
    expect(mediaIdFromPath('backgrounds/alpine-valley.png')).toBe('backgrounds/alpine-valley');
    expect(mediaIdFromPath('life/photo-2.jpg')).toBe('life/photo-2');
    expect(mediaIdFromPath('life/photo-2.jpeg')).toBe('life/photo-2');
    expect(mediaIdFromPath('og-source.webp')).toBe('og-source');
    expect(() => mediaIdFromPath('My Photo.PNG')).toThrow(
      new Error('media-src/My Photo.PNG: name must be lowercase kebab-case'),
    );
  });

  it.each([
    'projects/sage_plan.png',
    'projects/-sageplan.png',
    'projects/sageplan-.png',
    'Projects/sageplan.png',
    'projects/sageplan.PNG',
    'projects/sageplan',
    'projects//sageplan.png',
  ])('rejects %s', (rel) => {
    expect(() => mediaIdFromPath(rel)).toThrow(`media-src/${rel}: name must be lowercase kebab-case`);
  });
});

describe('planWidths', () => {
  it('planWidths(1672) = [640,1024,1600,1672]', () => {
    expect(planWidths(1672)).toEqual([640, 1024, 1600, 1672]);
  });

  it('planWidths(1024) = [640,1024]', () => {
    expect(planWidths(1024)).toEqual([640, 1024]);
  });

  it('planWidths(500) = [500]', () => {
    expect(planWidths(500)).toEqual([500]);
  });

  it('planWidths(3000) = [640,1024,1600,2400]', () => {
    expect(planWidths(3000)).toEqual([640, 1024, 1600, 2400]);
  });

  it('planWidths(2400) = [640,1024,1600,2400]', () => {
    expect(planWidths(2400)).toEqual([640, 1024, 1600, 2400]);
  });

  it.each([0, -5, 12.5, Number.NaN])('rejects a width of %s', (w) => {
    expect(() => planWidths(w)).toThrow(RangeError);
  });
});

describe('renditionPath', () => {
  it('builds /media/<id>-<width>.<ext>', () => {
    expect(renditionPath('projects/sageplan', 1024, 'avif')).toBe('/media/projects/sageplan-1024.avif');
    expect(renditionPath('backgrounds/alpine-valley', 1672, 'jpg')).toBe('/media/backgrounds/alpine-valley-1672.jpg');
  });
});
