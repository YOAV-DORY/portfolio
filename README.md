# Yoav Dory - Portfolio

Single-page animated portfolio: Vite + React + TypeScript, Tailwind CSS v4, GSAP + ScrollTrigger,
and a hand-written WebGL2 portrait. Static output, prerendered HTML, about 135 KB of gzipped JS.

All code, copy and media here are my own (or captured from my own live projects). The layout
techniques were studied from a reference teardown; no third-party template code, text, images,
video or branding is used.

## Run

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. The intro plays once per tab; add `#cv` to the URL, or reload in a new
tab after `sessionStorage.clear()`, to skip or replay it.

## Build

```bash
npm run build
```

This type-checks, builds the client, renders the app to HTML (`scripts/prerender.mjs`, so search
engines, link previews and no-JS visitors get the full page), and writes `robots.txt` and
`sitemap.xml`. Preview the result with `npm run preview`.

Set the public URL (used by canonical, Open Graph, sitemap) in `.env`:

```
VITE_SITE_URL=https://yoavdory.pages.dev
```

## Deploy (free)

**Cloudflare Pages** (recommended; `public/_headers` sets caching and security headers there):

1. Push this folder to a GitHub repo.
2. Cloudflare dashboard > Workers & Pages > Create > **Pages** tab > Connect to Git (not "Workers").
3. Framework preset: none. Build command `npm run build`, output directory `dist`.
4. Environment variables: `VITE_SITE_URL` = the `*.pages.dev` URL (or your domain), and
   `NODE_VERSION` = `22` (Vite 8 needs Node 20.19+ or 22.12+).

Or without Git: `npm run build`, then `npx wrangler pages deploy dist --project-name yoavdory`.

**Vercel**: import the repo, framework "Vite", build `npm run build`, output `dist`, same
`VITE_SITE_URL` variable. (`_headers` is Cloudflare-only; Vercel ignores it.)

## Where to change things

| What | Where |
| --- | --- |
| Main colour | `--accent` in `src/index.css` (one line) |
| All text: about, CV rows, skills, links, email, LinkedIn | `src/content/site.ts` |
| Projects: copy, numbers, tints, media, gallery | `src/content/projects.ts` |
| Portrait | put a square photo at `scripts/yoav-source.webp`, run `python scripts/make-portrait.py scripts/yoav-source.webp` (needs Pillow + numpy). It cuts the light wall out locally and writes `public/assets/yoav.webp` (keep it under 400 KB). If the photo is missing, the tiles fall back to the initials "YD". |
| CV PDF | `public/cv.pdf` |
| Screenshots | `node scripts/capture.mjs [glassbox] [eastwire]` (installed Chrome), then `python scripts/to-webp.py` > `public/media/<project>/` |
| Screen videos | `node scripts/record.mjs [permissionguard] [eastwire]` (Chrome, ffmpeg with libx264, `PYTHON=` a Python with Pillow) > `public/media/<project>/loop.mp4` + `poster.webp`. A missing video falls back to its poster. |
| Open Graph image | edit `scripts/og.html`, run `node scripts/og.mjs` > `public/og.jpg` |
| Game section | `FEATURES.play` in `src/content/site.ts` (off for v1; lazy-loaded chunk when on) |

## How the motion works

- `src/motion/useReveal.ts`: one hook per section reads data attributes (`data-reveal`,
  `data-reveal-group`, `data-reveal-lines`, `data-parallax`, `data-magnetic`) inside
  `gsap.matchMedia`. Nothing animates for `prefers-reduced-motion: reduce`; the prerendered HTML is
  already the final state, so reduced motion just shows it.
- Content is never hidden: reveals are a 0.45 s drift, completed at once for fast scrolls and anchor
  jumps (`playOnEnter`). Metrics show their real values from first paint (no count-ups).
- Scroll-driven extras (transform/opacity only, motion-OK visitors only):
  - hero: portrait and name drift up and fade a little as you scroll away;
  - About (desktop): the words light up one by one in reading order, scrubbed to scroll (opacity
    0.35 to 1 only; each word is its own compositor layer while the card is on screen);
  - experience: a timeline line draws itself down the left of the rows;
  - skills: the marquees skew (up to 6deg) and speed up with scroll velocity, then settle;
  - project titles and the Contact heading roll up into their line masks with scroll;
  - projects: tall, media-first sections (title, full-width product media, pitch and links, what it
    does / how it is built, numbers, technical details) in a sticky stack, each project staying put
    while the next slides over it (the covered one scales to 0.96 under a shade); `useStack` in
    `src/sections/Projects.tsx`;
  - glassbox (desktop): its gallery is a pinned strip scrubbed sideways (`useStrip`).
- `src/sections/Hero.tsx`: the intro. PORTFOLIO assembles, morphs a letter every 150 ms into YOAV
  DORY, moves to place, the halves split, the buttons rise; about 3.3 s, "Skip intro" or Esc ends
  it. Scrolling is locked for at most 1.2 s of wall-clock time (`intro-lock`, released by a timer in
  `index.html`), and GSAP lag smoothing is off, so a busy machine cannot stretch the intro.
- `src/webgl/tiles.ts`: instanced tiles sampled from the photo, dust to portrait, pushed by the
  pointer. Two seconds after the intro the mosaic fades into the full-resolution photo on every
  device; after that the pointer only scatters a few tiles around itself. One WebGL2 context, DPR
  capped at 2, draws only while something moves.

## Performance rules

- Animate only `transform` and `opacity`. No `filter`, `backdrop-filter` or
  `mix-blend-mode`: the background glows are plain radial gradients, the grain is a low-opacity
  tile, the header is a near-opaque black.
- Infinite CSS animations pause off screen (`src/lib/offscreen.ts`, `data-pause-offscreen`); with
  the page idle at the top, `document.getAnimations()` has nothing running.
- `#cv` and `#contact` use `content-visibility: auto` with measured placeholder sizes. The projects
  section does not: its sticky stack and pinned strip need no paint containment. In-page links
  re-align after the scroll ends in case a placeholder changed size on the way.
- Elements moved by scroll get their own compositor layer (`will-change`), the stacked project body
  only while it is moving.
- `node scripts/perf.mjs <url> <label> [cpuThrottle]` measures the intro, when a real wheel scroll
  first works, idle animations, frame times, long tasks and Chrome-trace paint/raster time while
  scrolling, at 1280x720 and 390x844, DPR 2, with the CPU slowed 4x by default.

## Images, honestly

Every visual is one of three kinds, labelled in code comments (`src/content/projects.ts`):

1. **Real**: screenshots of the live glassbox and EastWire sites and the EastWire screen recording
   (captured with Playwright at 1440 and 390 px), the PermissionGuard terminal image from its repo,
   and the PermissionGuard video, a replay of real captured CLI output (`scripts/pg-terminal.html`;
   only the typing is added, the home path is shortened to `~`).
2. **Designed**: device frames, verbatim code excerpts (skipped lines shown as `...`), and SVG
   architecture diagrams drawn from each repo's real structure (`src/visuals/`).
3. **Generated**: CSS gradient meshes, grid and grain, used only as backgrounds.

glassbox's live demo runs on synthetic applicants; the page says so next to its screenshots. Its
numbers in the strip are the README's held-out test results on the public Home Credit data.

## Verification

With a preview server running (`npm run preview -- --port 4180`):

```bash
PYTHON=/path/to/python-with-pillow node scripts/verify.mjs http://localhost:4180
```

Writes `shots/` (gitignored): the intro at fixed times, stitched full pages and per-section shots at
320, 390 and 1440 px, a reduced-motion pass, the mobile menu, and each project scrolled in six steps.
(`perf.mjs` above covers runtime cost.) It fails loudly on sideways overflow, elements wider than the viewport, clipped text, text left
hidden after its reveal, more than 40vh of empty space, broken images and console errors. The `fast`
pass scrolls in big programmatic jumps with pauses (1280 and 390 px) and checks that numbers on
screen are final, nothing is hidden, no screen is near-black, the videos play, the portrait resolves
without a pointer, the intro shows a skip control, and menu links close the menu and land below the
header.
