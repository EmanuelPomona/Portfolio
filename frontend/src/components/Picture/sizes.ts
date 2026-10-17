// Owner: agent/frontend. One `sizes` per photograph use, shared by every <Picture> that shows the
// same photo: the same srcset with the same sizes picks the same file, so a second layer of a photo
// (the hero's fog drift, the clouds) never costs a second download.

/** The alpine valley, full-bleed in the hero. */
export const HERO_PHOTO_SIZES = '100vw';

/** The evergreen fog behind a section, at most 72rem wide. */
export const SECTION_BACKDROP_SIZES = '(min-width: 72rem) 72rem, 100vw';
