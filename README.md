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
  `data-reveal-group`, `data-reveal-lines`, `data-parallax`, `data-magnetic`, `data-count`) inside
  `gsap.matchMedia`. Nothing animates for `prefers-reduced-motion: reduce`; the prerendered HTML is
  already the final state, so reduced motion just shows it.
- `src/sections/Hero.tsx`: the intro. PORTFOLIO assembles, morphs a letter every 150 ms into YOAV
  DORY, moves to place, the halves split, the buttons rise; about 3.3 s, scroll locked meanwhile,
  "Skip intro" or Esc ends it. `index.html` decides before first paint whether it plays, with a
  4.5 s failsafe.
- `src/webgl/tiles.ts`: instanced tiles sampled from the photo, dust to portrait, pushed by the
  pointer. One WebGL2 context, DPR capped at 2, draws only while something moves.
- Each project has its own beat (`useBeat` in `src/sections/Projects.tsx`): verdict stamps,
  a glass wipe, a 3D tilt.

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
It fails loudly on sideways overflow, elements wider than the viewport, clipped text, text left
hidden after its reveal, broken images and console errors.
