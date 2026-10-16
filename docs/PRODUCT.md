# Product Specification

**Owner:** manager. **Approved intent:** `docs/superpowers/specs/2026-10-16-portfolio-design.md`
(signed off by Emanuel, 2026-10-16). Approved copy lives in that file's section 7
and, at runtime, in `frontend/src/content/`.

## Product name

**emanuel-ling**: the official portfolio of Emanuel Ling.

## One-sentence description

A one-page portfolio where a tiny hand-drawn stickman is the cursor. He walks
through misty black-and-white mountains, and Emanuel's projects and photos come
into color only when you pay attention to them.

---

## Problem

Emanuel is applying for summer 2027 internships now, in October 2026, and has
nowhere he is proud to send people.

- His real work (two live web apps, an award-winning hackathon project, and a
  reinforcement-learning agent) is scattered across GitHub READMEs.
- His previous portfolio read as generic AI output, so it hurt more than it
  helped. The specific failures are listed in the approved design, section 1.

## Target users

1. **Primary: the internship screener.** A recruiter or engineer who clicks the
   link from his résumé or LinkedIn, often in a phone's in-app browser, between
   other candidates. They give the page under 60 seconds.
   - They need to learn what he has built, whether it is real (live links), and
     how to reach him.
   - They need to remember him afterwards.
2. **Secondary: people who know him.** Claremont classmates, hackathon teammates,
   professors, and the Revelation Youth community. These visitors linger, play
   with the stickman, and look at the photos.

## Core user story

As an internship screener,
I want to see a candidate's real projects and how to contact him within a minute,
so that I can decide whether to move him forward, and remember why.

## MVP goal

The MVP is shipped when a visitor to the public URL can:

1. Arrive through a first-visit loader that is short, skippable, and finishes in
   at most 4.5s.
2. Use the stickman cursor everywhere on desktop, with no loss of click precision.
3. Reach all four projects (live site and code) within about 10s of the loader
   ending.
4. See the About section: intro, classes, and photo slots.
5. Open LinkedIn, email, or GitHub.

All of this must work on a phone and with reduced motion.

## Primary demo flow

1. **Loader.** Open the URL in a fresh browser session. The loader shows the
   stickman scribbling loops above a progress bar. He finishes in about 1.2 to
   3s, drops his pencil, and becomes the cursor.
2. **Hero.** The hero shows "Emanuel Ling / CS + Math @ Pomona College" over the
   alpine photograph, with fog drifting slowly. Moving the mouse makes the
   stickman walk to the ring cursor, and he hurries when it is far away.
3. **Nav.** Clicking "Projects" in the centered nav makes the stickman cheer, and
   the page scrolls to Projects.
4. **Projects.** Each project is a dark browser window, and hovering one brings it
   to life:
   - the traffic lights color in;
   - the address bar shows the real URL;
   - the screen lifts out of black.

   Clicking the SagePlan window opens https://sageplan.vercel.app in a new tab.
5. **About.** Scrolling to About shows the intro and two classes. Hovering a photo
   slot brings it out of the fog.
6. **Contact.** Clicking "Email" opens a mail client addressed to
   emanuelling27@gmail.com.
7. **Phone.** On a 390px phone the same flow works:
   - project windows come alive as they reach the middle of the screen;
   - once the owner has approved the touch mode, the stickman walks along the
     bottom edge and runs to taps.
8. **Reduced motion.** With reduced motion turned on, there is a 300ms fade
   instead of the loader animation, and the normal cursor is used. All content is
   still present.

## Must-have features

- [ ] First-visit loader with the scribbling stickman. It obeys the timing rules
      in the approved design (§5.2).
- [ ] Stickman cursor on fine pointers, matching `docs/reference/stickman-cursor-spike.html`
      (32px, ring, walk/run, point, cheer, sit).
- [ ] Stickman touch mode: bottom edge, scroll walking, runs to taps.
      - Built and demoable in the lab page.
      - It sits behind the `touchStickman` flag, which stays **off in production**
        until the owner tunes it (approved design §5.14).
- [ ] Hero with the alpine photograph, name, subtitle, centered nav, and fog drift.
- [ ] Projects: four dark macOS browser windows that alternate sides, with
      one-sentence copy, a meta line, a primary link, and a code link.
- [ ] Attention reveal on hover, keyboard focus, and the touch center band. It
      applies to project screens and life photos.
- [ ] Designed empty states for every image slot that has no image yet.
- [ ] About: intro (draft, owner to edit), classes, and a scattered photo collage
      with caption slots.
- [ ] Connect: LinkedIn, Email, GitHub.
- [ ] Fog-clearing scroll reveal of sections.
- [ ] Reduced-motion and keyboard paths, both complete.
- [ ] Responsive at 1440, 768, and 390, with the mobile layout designed, not shrunk.
- [ ] Page title, meta description, Open Graph image, favicon, and Person JSON-LD.
- [ ] Deployed on Vercel, with `PREVIEW_URL` recorded.
- [ ] An image pipeline, so Emanuel can drop in screenshots and photos later
      without editing layout code.

## Nice-to-have features

Only after every must-have is verified.

- [ ] Cursor-local "wipe the fog off the glass" reveal inside a project window
      before it comes fully alive.
- [ ] Muted, looping screen recordings inside project windows, loaded only when in
      view.
- [ ] A "last updated" stamp in the footer, driven by content data.
- [ ] Touch: the stickman waves when the visitor reaches Contact.

## Explicitly out of scope

Blog, case-study pages, extra routes, CMS or admin, contact form, theme toggle,
analytics dashboard, chatbot, résumé download, sound, i18n, comments.

Also out of scope: any generated or stock stand-in for a project screenshot or a
personal photo. Empty slots stay honestly empty until the owner supplies the real
image. The two background photographs are the owner's chosen assets and are not
affected by this rule.

## Success criteria

- Every item in `docs/ACCEPTANCE.md` passes, with evidence in `docs/review/`.
- Mobile Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95,
  SEO ≥ 95, measured against the deployed preview.
- **Share test:** Emanuel is willing to put the URL on his résumé.
  - He has seen the deployed preview and does not ask for a redesign.
  - The reviewer's primary-test answer from `docs/DESIGN_CONSTRAINTS.md` §1 is
    "no, this could not be pasted onto another site".

## Constraints

| Constraint | Value |
|---|---|
| Time | Ship v1 as soon as possible; recruiting is happening now |
| Team | Manager, frontend, stickman slice, backend (content/media/deploy), reviewer |
| Required technologies | Static React + TypeScript (Vite), Vercel. See `docs/ARCHITECTURE.md` |
| Required APIs | None. No server, no database, no third-party runtime calls |
| Owner-supplied later | Project screenshots, collage photos and captions, intro edit, custom domain |
