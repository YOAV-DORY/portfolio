// Real screenshots of the live products (image kind 1 in the README: "real screenshots").
//
//   node scripts/capture.mjs [glassbox|eastwire ...]
//
// Opens each live page in installed Chrome at 1440x900 (desktop) and 390x844 (phone, 2x pixels),
// waits for the page to settle and writes PNGs to scripts/.raw/<project>/<page>-<width>.png.
// scripts/to-webp.py turns them into the webp files under public/media/.
// glassbox runs on Render's free plan and can take up to a minute to wake, hence the long timeout.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const TARGETS = {
  glassbox: {
    base: 'https://glassbox-uayo.onrender.com',
    pages: { landing: '/', desk: '/assess', simulator: '/portfolio' },
  },
  eastwire: {
    base: 'https://eastwire.pages.dev',
    pages: { home: '/', map: '/map', sources: '/sources', search: '/search?q=economy' },
  },
}
// 1440x900 for galleries, 390x844 for phone frames, and a taller 1440x1026 desktop shot for the hero
// frames: their parallax layer is 114% of a 16:10 frame, so it needs a 1440:1026 image to avoid side crops.
const VIEWPORTS = [
  { width: 1440, height: 900, scale: 1, mobile: false, suffix: '1440' },
  { width: 1440, height: 1026, scale: 1, mobile: false, suffix: 'hero', only: ['glassbox'] },
  { width: 390, height: 844, scale: 2, mobile: true, suffix: '390' },
]

const only = process.argv.slice(2)
const browser = await chromium.launch({ channel: 'chrome' })
for (const [project, { base, pages }] of Object.entries(TARGETS)) {
  if (only.length && !only.includes(project)) continue
  const out = new URL(`./.raw/${project}/`, import.meta.url).pathname
  mkdirSync(out, { recursive: true })
  for (const vp of VIEWPORTS) {
    if (vp.only && !vp.only.includes(project)) continue
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      colorScheme: 'dark',
      reducedMotion: 'reduce', // settled frames, no half-finished entrance animations
    })
    const page = await context.newPage()
    for (const [name, path] of Object.entries(pages)) {
      await page.goto(base + path, { waitUntil: 'networkidle', timeout: 120_000 })
      // Render's free plan shows its own "waking up" page first; wait for the real app.
      await page.waitForFunction(() => !/waking up|application loading/i.test(document.body.innerText), null, { timeout: 120_000 })
      await page.waitForLoadState('networkidle')
      await page.waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 90_000 }).catch(() => {})
      await page.waitForTimeout(2500) // map tiles and late images
      const file = `${out}${name}-${vp.suffix}.png`
      await page.screenshot({ path: file })
      console.log('wrote', file)
    }
    await context.close()
  }
}
await browser.close()
