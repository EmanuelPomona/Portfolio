# Editing the site's content

Everything the page says lives in four files in this folder. You never need to touch layout
code to change words, add a project screenshot, or add a photo.

| File | What it holds |
|---|---|
| `site.ts` | Your name, tagline, page title and description, the date of the last edit |
| `projects.ts` | The four projects: title, sentence, meta line, links, screenshot |
| `about.ts` | The About description, this semester's classes, the photo collage |
| `contact.ts` | LinkedIn, Email, GitHub |

Do not edit `types.ts`, `media.ts`, or `media.generated.ts`. The first two define the shape of
the content. The third is written by `npm run media`.

Run every command below in a terminal, from the top folder of the project (the one with
`package.json` and `frontend/` in it).

---

## 1. Edit a sentence or caption

1. Open the file (for a project sentence, `projects.ts`) and change the text between the quotes.
   - Text in single quotes cannot contain a single quote. If your text has an apostrophe
     ("I'm"), wrap it in double quotes instead: `"I'm music director."`
2. Open `site.ts` and set `updated` to today's date, written `YYYY-MM-DD`.
3. If you rewrote the About description, also set `descriptionIsDraft: false` in `about.ts`.
4. Check it (section 4), then commit (section 5).

A few rules to keep in mind while writing. Section 4 lists all of them.
- A project sentence is **one** sentence, ends with a period, and is at most 200 characters.
- **No em dash** (the long dash). Some Mac apps turn `--` into one as you type, and
  Option-Shift-Hyphen types one. Use a comma, a colon, or parentheses.
- No unfinished words such as "TBD", "todo", or "coming soon".

## 2. Add a project screenshot

1. Take the screenshot at least 1600 pixels wide, ideally 16:10.
2. Save it as `frontend/media-src/projects/<project id>.png`. The project id is the `id` in
   `projects.ts`, so SagePlan's is `frontend/media-src/projects/sageplan.png`.
   - The filename must be lowercase words joined by hyphens. `SagePlan Screenshot.PNG` is
     rejected.
3. Run:

   ```bash
   npm run media
   ```

   It makes the web-sized copies in `frontend/public/media/projects/` and registers the image.
4. In `projects.ts`, change that project's `screen` line from
   `screen: { image: null, alt: null },` to

   ```ts
   screen: { image: 'projects/sageplan', alt: 'SagePlan showing which requirements are met' },
   ```

   - `image` is the file's path inside `media-src/`, without `.png`.
   - `alt` describes what the screenshot shows, for people using screen readers. Use at least
     8 characters, and not just "screenshot".
5. Set `updated` in `site.ts` to today. Check (section 4) and commit (section 5).

## 3. Add a photo to the collage

1. Save the photo as `frontend/media-src/life/photo-N.jpg`, where `photo-N` is the `id` of the
   slot in `about.ts`, for example `frontend/media-src/life/photo-2.jpg`.
   - Each slot has a fixed shape, its `aspect`. The five are, in order: 4:3, 2:3, 4:3, 9:16, 4:3.
     Crop the photo to its slot's shape before saving it.
2. Run:

   ```bash
   npm run media
   ```

3. In `about.ts`, fill in that slot:

   ```ts
   { id: 'photo-2', aspect: '2:3', image: 'life/photo-2', alt: 'Leading worship on keyboard', caption: 'Sunday service, fall 2026' },
   ```

   - `alt` describes the photo, at least 8 characters.
   - `caption` is the short line shown under it, at most 120 characters. Leave it `null` for no
     caption; never write a stand-in like "caption here".
4. To add a sixth slot, copy a line and give it the next id (`photo-6`). The collage holds up to
   8.
5. Set `updated` in `site.ts` to today. Check (section 4) and commit (section 5).

## 4. Check your edit

```bash
npm run test:contract
```

It ends with `Tests  N passed` when everything is fine. Otherwise it stops at the first kind of
problem it finds.

**A TypeScript error** comes first and names a file and line, for example:

```text
src/content/projects.ts(15,15): error TS2322: Type '"projects/sageplan"' is not assignable to type '"backgrounds/alpine-valley" | ...'.
```

That one means the image is not registered yet: run `npm run media`, and check that the
filename matches the `image` value. Other TypeScript errors are usually a missing quote, comma,
or bracket on the line named.

**A content problem** is listed as `rule at place: what to do`, for example:

```text
The content has problems. Fix each one, then run npm run test:contract again.
  C-01 at site.tagline: Contains an em dash (the long dash). Use a comma, a colon, or parentheses instead.
```

`site.tagline` means the `tagline` line of `site.ts`; `projects[2].sentence` means the
`sentence` of the third project (counting starts at 0).

What each rule means:

| Rule | It means |
|---|---|
| C-01 | Some text has an em dash (the long dash). Use a comma, a colon, or parentheses. |
| C-02 | A project sentence is not exactly one sentence ending in a period, or is over 200 characters. A period, `!`, or `?` followed by a capital letter counts as a new sentence, so write "e.g. the" in lowercase. |
| C-03 | A project `id` is not lowercase words joined by hyphens, or two projects share one. |
| C-04 | A project's meta line has fewer than 1 or more than 4 items, an item is over 40 characters, or an item ends with punctuation. |
| C-05 | A link does not start with `https://` (or `mailto:` with an `@` for email), or is not a valid address. |
| C-06 | A project lists the same link twice. |
| C-07 | A project's `addressBar` does not match its main link. It must be the link without `https://`, `www.`, or a trailing `/`. The message gives the exact text to use. |
| C-08 | A project's main link is not its live site or code, or a live site link sits in `secondary`. The live site, when there is one, is always the main link. |
| C-09 | An image has no alt text, alt text has no image, or the alt text is shorter than 8 characters or only says "image", "photo", or "screenshot". |
| C-10 | A caption is empty, has spaces at the start or end, or is over 120 characters. Use `null` for no caption. |
| C-11 | An `image` names a file that `npm run media` has not processed. Add the file to `frontend/media-src/` and run `npm run media`. |
| C-12 | The nav no longer lists home, projects, about, contact, in that order. |
| C-13 | The page title is over 70 characters, or the description is over 160. Search results cut off longer text. |
| C-14 | `updated` is not a real date written `YYYY-MM-DD`, or it is later than today (in UTC). |
| C-15 | `origin` is not empty or a plain `https://` address with no path and no trailing `/`. |
| C-16 | The About description is more than two sentences, over 320 characters, or does not end with `.`, `!`, or `?`. |
| C-17 | There are more than 8 photos, or a photo `id` is not `photo-` and a number, or two photos share an id. |
| C-18 | The contact links do not include exactly one each of LinkedIn, Email, and GitHub. |
| C-19 | A link in the hero row is not also one of the contact links. |
| C-20 | Some text contains an unfinished word: lorem, ipsum, todo, tbd, placeholder, or "coming soon" (any capitalization, plurals included). |

**Known false alarms for C-20.** It checks whole words in every piece of text, links
included, so an honest use of those words is flagged too: "my todos", or a repository named
`todo-app`. Reword the text. If a real link trips it, ask for the rule to be adjusted rather
than changing the link.

## 5. Commit

```bash
git add frontend/src/content frontend/media-src frontend/public/media
git commit -m "feat: add SagePlan screenshot"
git push
```

Write a message that says what changed. Commit the files `npm run media` produced together
with the original image and the content edit, so the three never get out of step.
