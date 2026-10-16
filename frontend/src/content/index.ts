// Owner: agent/backend. The ONLY module the rest of the app imports content from.
import { about } from './about';
import { contact } from './contact';
import { projects } from './projects';
import { site } from './site';
import type { Content } from './types';

export const content: Content = { site, projects, about, contact };
export { about, contact, projects, site };
export { getMedia, isMediaId } from './media';
export type { MediaAsset, MediaId, MediaSource } from './media';
export type * from './types';
