# media-src

Original images. Owner: agent/backend's pipeline reads this folder; Emanuel drops new images here.

| Folder | What goes here | Naming |
|---|---|---|
| `backgrounds/` | The two fog photographs (already here) | `kebab-case.png` or `.jpg` |
| `projects/` | One screenshot per project, at least 1600px wide, 16:10 | `<project-id>.png`, e.g. `sageplan.png` |
| `life/` | Collage photos | `<photo-id>.jpg`, e.g. `photo-1.jpg` |

After adding a file, run `npm run media` and set the matching `image` and `alt` in
`frontend/src/content/`. The full guide is written by TASK-301.
