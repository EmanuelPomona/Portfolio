/**
 * CONTENT CONTRACT. Owner: manager.
 * Authoritative for every content shape the page renders. Semantics and invariants:
 * docs/DATABASE.md. Change only through a CONTRACT CHANGE REQUEST (docs/AGENT_PROTOCOL.md §6).
 * Values live in site.ts / projects.ts / about.ts / contact.ts (owner: agent/backend).
 */
import type { MediaId } from './media';

/** DOM ids of the four page sections are exactly these strings. */
export type SectionId = 'home' | 'projects' | 'about' | 'contact';

export interface NavItem {
  readonly id: SectionId;
  /** Visible label, also the section heading. */
  readonly label: string;
}

export type LinkKind = 'live' | 'code' | 'devpost' | 'linkedin' | 'email' | 'github';

export interface Link {
  readonly kind: LinkKind;
  /** Visible text, e.g. "Live site", "Code", "Devpost", "LinkedIn", "Email", "GitHub". */
  readonly label: string;
  /** Absolute https:// URL, or mailto: when kind is "email". */
  readonly href: string;
}

export interface Site {
  readonly name: string;
  readonly tagline: string;
  /** Canonical origin with no trailing slash, e.g. "https://emanuel-ling.vercel.app". Empty until first deploy. */
  readonly origin: string;
  /** Document title. */
  readonly title: string;
  /** Meta description, at most 160 characters. */
  readonly description: string;
  /** Date the content was last edited, ISO YYYY-MM-DD. */
  readonly updated: string;
  /** Render order. Contains each SectionId exactly once. */
  readonly nav: readonly NavItem[];
  /** Decorative hero background (the alpine valley). */
  readonly heroImage: MediaId;
  /** Decorative background behind Projects and About (the evergreen fog). */
  readonly sectionsImage: MediaId;
  /** Small row under the tagline (approved design §5.15). */
  readonly heroLinks: readonly Link[];
}

/** A short screen recording shown in a project window while it is attended (ADR-012). */
export interface ProjectVideo {
  /** Root-relative URL of a muted H.264 MP4 committed under frontend/public/media/video/. */
  readonly src: `/media/video/${string}.mp4`;
  /** Encoded frame size in px, so the layout is right before the video's metadata loads. */
  readonly width: number;
  readonly height: number;
  /** Seconds into the recording where the poster frame was taken. The first play starts here, so
   * the still flows into motion; later loops start at 0. Omitted means 0. */
  readonly posterTime?: number;
}

export interface ProjectScreen {
  /** null means no screenshot yet: the window renders its empty state. */
  readonly image: MediaId | null;
  /** Non-empty when image is non-null; null when image is null. */
  readonly alt: string | null;
  /** Optional recording. When present, `image` is its poster frame and is never null (C-22). */
  readonly video?: ProjectVideo;
}

export interface Project {
  /** Stable kebab-case id. The project's DOM id is `project-${id}`. */
  readonly id: string;
  readonly title: string;
  /** Exactly one sentence, ending in a period. No em dash. */
  readonly sentence: string;
  /** One to four short facts shown as a single meta line. */
  readonly meta: readonly string[];
  /** Where activating the window goes: the live site if one exists, otherwise the repository. */
  readonly primary: Link;
  /** Further links (code, Devpost). Never repeats primary.href. May be empty. */
  readonly secondary: readonly Link[];
  /** Address-bar text: primary.href without scheme, "www.", or trailing slash. */
  readonly addressBar: string;
  readonly screen: ProjectScreen;
}

export type PhotoAspect = '4:3' | '3:2' | '2:3' | '9:16' | '16:9' | '1:1';

export interface LifePhoto {
  readonly id: string;
  /** The slot renders at this ratio whether or not an image exists. */
  readonly aspect: PhotoAspect;
  readonly image: MediaId | null;
  /** Non-empty when image is non-null; null when image is null. */
  readonly alt: string | null;
  /** null means the owner has not written it yet. Never a placeholder string. */
  readonly caption: string | null;
}

export interface ClassList {
  /** e.g. "This semester". */
  readonly label: string;
  readonly items: readonly string[];
}

export interface About {
  /** One or two sentences. */
  readonly description: string;
  /** true while the description is the manager's draft awaiting the owner's edit. Not rendered. */
  readonly descriptionIsDraft: boolean;
  readonly classes: ClassList;
  /** Render order. 0 to 8 slots. */
  readonly photos: readonly LifePhoto[];
}

export interface Contact {
  /** Render order. */
  readonly links: readonly Link[];
}

export interface Content {
  readonly site: Site;
  /** Render order. The displayed number is position + 1, zero-padded ("01"). */
  readonly projects: readonly Project[];
  readonly about: About;
  readonly contact: Contact;
}
