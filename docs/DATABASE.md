# Database Design (content schema)

## Provider

None.

## Database

None. This project is static (ADR-001).

The content is a set of **typed TypeScript modules** in `frontend/src/content/`, committed to git:
- **Shapes:** `frontend/src/content/types.ts`, the canonical artifact. Where this
  file and that one disagree, the TypeScript wins, and the disagreement is a defect
  to report.
- **This document:** what each entity means, the invariants every value must satisfy, and how
  the media files are laid out.

| Role | Who |
|---|---|
| Schema (types, invariants) | manager |
| Values and invariant tests | agent/backend |
| Consumer | agent/frontend, through `src/content/index.ts` only |
| Edits to values after launch | Emanuel, by following `frontend/src/content/README.md` (TASK-301) |

---

# Entities

Types and optionality are in `types.ts`. Below are only the semantics a reader
could not get from the types.

## Site

| Field | Meaning |
|---|---|
| `name`, `tagline` | The hero's two lines. They are approved copy. |
| `origin` | The canonical origin, set after the first deploy. `''` until then; `seo.ts` omits the canonical tag and the og:url while it is empty. |
| `title`, `description` | Document title and meta description. |
| `updated` | The last content edit, as ISO `YYYY-MM-DD`. Bump it with any content change. |
| `nav` | The four sections, in render order. |
| `heroImage`, `sectionsImage` | Decorative backgrounds, by `MediaId`. |
| `heroLinks` | The small LinkedIn · Email · GitHub row in the hero. |

## Link

A `kind` (`live` | `code` | `devpost` | `linkedin` | `email` | `github`), a
visible `label`, and an `href`.

## Project

| Field | Meaning |
|---|---|
| `id` | Stable kebab-case id, also used in `project-${id}` DOM ids and as the screenshot filename (`media-src/projects/<id>.png`). |
| `title` | Display title, set in italic by the frontend. |
| `sentence` | The single approved sentence. |
| `meta` | Stack or credit facts on one line. |
| `primary` | The window's click target: the live site if one exists, otherwise the repository. |
| `secondary` | Every other link: code or Devpost. |
| `addressBar` | What the fake address field shows. Derived from `primary.href`. |
| `screen` | `{ image, alt }`. Both are `null` until the owner supplies a screenshot. |

## LifePhoto

| Field | Meaning |
|---|---|
| `id` | `photo-N`, also the filename `media-src/life/<id>.jpg`. |
| `aspect` | The slot's ratio. The empty slot keeps it, so adding a photo later does not shift layout. |
| `image`, `alt` | Both `null` until supplied. |
| `caption` | `null` until the owner writes it. |

## About

| Field | Meaning |
|---|---|
| `description` | The "brief description" from wireframe p3. Currently the manager's facts-only draft. |
| `descriptionIsDraft` | `true` until the owner edits the description. It is never rendered. |
| `classes` | `{ label: 'This semester', items: [...] }`. |
| `photos` | The collage slots, in reading order. |

## Contact

`links`, in render order: LinkedIn, Email, GitHub.

## MediaAsset (generated)

The shape is in `media.ts`. It is produced only by `npm run media` and never
edited by hand. See `docs/API.md` §3 for the pipeline contract.

---

# Relationships

```text
Content
 ├─ site ──────┬─ nav[] ............ SectionId  (= DOM ids of the four sections)
 │             ├─ heroImage ........ MediaAsset
 │             ├─ sectionsImage .... MediaAsset
 │             └─ heroLinks[] ...... Link  (same hrefs as contact.links)
 ├─ projects[] ┬─ primary .......... Link
 │             ├─ secondary[] ...... Link
 │             └─ screen.image ..... MediaAsset | null
 ├─ about ─────┬─ classes .......... ClassList
 │             └─ photos[].image ... MediaAsset | null
 └─ contact ───── links[] .......... Link
```

---

# Invariants

`agent/backend` enforces these in `frontend/src/content/content.contract.test.ts`
(TASK-301). The `contract` in the filename makes them part of
`npm run test:contract`.

| ID | Invariant |
|---|---|
| C-01 | No string anywhere in `content` contains an em dash (U+2014). |
| C-02 | `project.sentence` is exactly one sentence. It ends with `.`, contains no `. `, `! `, or `? ` followed by an uppercase letter before the end, and is at most 200 characters. |
| C-03 | Project ids are unique and match `^[a-z0-9]+(-[a-z0-9]+)*$`. |
| C-04 | `meta` has 1 to 4 items, each at most 40 characters with no trailing punctuation. |
| C-05 | Every `href` is either an absolute `https://` URL that `new URL()` accepts, or a `mailto:` address containing `@`. There is no `http://`. |
| C-06 | Within a project, no two links share an `href`. In particular, `secondary` never repeats `primary.href`. |
| C-07 | `addressBar` equals `primary.href` with the scheme, a leading `www.`, and any trailing `/` removed. |
| C-08 | `primary.kind` is `live` or `code`. If a project has a `live` link, it is the `primary`. |
| C-09 | For every `ProjectScreen` and `LifePhoto`: `image === null` if and only if `alt === null`. A non-null `alt` is at least 8 characters, and is not just "image", "photo", or "screenshot". |
| C-10 | `caption` is `null`, or a trimmed, non-empty string of at most 120 characters. |
| C-11 | Every referenced `MediaId` exists in `mediaManifest` (`isMediaId`). |
| C-12 | `site.nav` ids are exactly `home, projects, about, contact`, in that order. |
| C-13 | `site.title` is at most 70 characters; `site.description` is at most 160. |
| C-14 | `site.updated` is a real calendar date, `YYYY-MM-DD`, not in the future. |
| C-15 | `site.origin` is `''` or an `https://` origin with no path and no trailing slash. |
| C-16 | `about.description` is 1 or 2 sentences and at most 320 characters. |
| C-17 | `about.photos` has 0 to 8 entries, with unique ids matching `^photo-\d+$`. |
| C-18 | `contact.links` kinds are unique and include `linkedin`, `email`, and `github`. |
| C-19 | Every `site.heroLinks` href also appears in `contact.links`. |
| C-20 | No content string contains placeholder words (case-insensitive): `lorem`, `ipsum`, `todo`, `tbd`, `placeholder`, `coming soon`. |
| C-21 | The media manifest is current. Every source in `media-src/` has an entry, every entry's files exist under `public/media/`, and every non-null `image` points at an existing entry. Node environment. |

---

# Persistence and change

- **Storage** is git. A content edit is a commit.
- **There are no migrations.** A shape change is a contract change: manager only,
  through `docs/AGENT_PROTOCOL.md` §6, updating `types.ts` and this file together.
- **Adding a screenshot or photo needs no shape change.** Drop the file in
  `media-src/`, run `npm run media`, then set `image` and `alt` in
  `projects.ts` or `about.ts`.
