// Visual + layout check of the built page (run `npm run build` and a preview server first).
//
//   node scripts/verify.mjs [baseUrl=http://localhost:4180] [only=intro,widths,reduced,projects]
//
// Writes PNGs and report.json to shots/ (gitignored):
//   intro-<ms>.png              the intro at fixed times (1440 wide)
//   <width>-full.png            full page after every reveal has run, at 320, 390 and 1440
//   <width>-<section>.png       each section on its own
//   reduced-<width>-full.png    prefers-reduced-motion: reduce (no pin, no scrub, everything visible)
//   <width>-menu.png            the open mobile menu (320 and 390)
//   <project>-p<step>.png       each project section scrolled through in steps (1440 and 390)
// Checks: sideways overflow, elements wider than the viewport, text clipped by its own box, broken
// images, console errors, text still hidden (opacity 0 / visibility hidden) after its reveal ran.
// Full pages are stitched from viewport screenshots (scripts/stitch.py, needs Pillow: PYTHON=...),
// because Playwright's fullPage mode changes the device metrics, which re-runs the media queries
// and restarts the animations mid-capture.
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const [base = 'http://localhost:4180', onlyArg = ''] = process.argv.slice(2)
const only = onlyArg ? onlyArg.split(',') : ['intro', 'widths', 'reduced', 'projects']
const out = new URL('../shots/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
const report = { base, checks: [] }
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] })

const WIDTHS = [
  { width: 320, height: 640, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 1440, height: 900, mobile: false },
]
const SECTIONS = ['home', 'cv', 'project-1', 'project-2', 'project-3', 'contact']

async function context(vp, { reduced = false, skipIntro = true } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  })
  if (skipIntro) await ctx.addInitScript(() => sessionStorage.setItem('yd.intro', '1'))
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  return { ctx, page, errors }
}

/** Scroll top to bottom in viewport steps so every once-only reveal fires, then return to the top. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 160))
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    await new Promise((r) => setTimeout(r, 1500))
  })
}

async function layoutChecks(page, label, errors) {
  const result = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const wide = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (!r.width || el.closest('.marquee, [aria-hidden="true"], .sr-only, pre')) continue
      if (r.right > vw + 1 || r.left < -1) {
        const s = getComputedStyle(el)
        if (s.position === 'fixed' || s.visibility === 'hidden') continue
        wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} [${Math.round(r.left)}, ${Math.round(r.right)}]`)
      }
    }
    const hidden = []
    for (const el of document.querySelectorAll('main h2, main h3, main p, main li, main a, main dd')) {
      if (el.closest('[aria-hidden="true"], .sr-only, #mobile-menu, .acc-panel, .skip-intro, .sequence')) continue
      let n = el
      while (n && n !== document.body) {
        const s = getComputedStyle(n)
        if (s.visibility === 'hidden' || Number(s.opacity) < 0.05) {
          hidden.push(`${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 50)}`)
          break
        }
        n = n.parentElement
      }
    }
    const clipped = []
    for (const el of document.querySelectorAll('.line-mask, main dd, main h3:not(.sr-only), main [data-half]')) {
      const inner = el.matches('.line-mask') ? el.firstElementChild : el
      if (inner && inner.scrollWidth > el.clientWidth + 2) clipped.push(`${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 40)} (${inner.scrollWidth} > ${el.clientWidth})`)
    }
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src)
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      overflowX: document.documentElement.scrollWidth > vw,
      wide: wide.slice(0, 15),
      hidden: hidden.slice(0, 15),
      clipped,
      broken,
    }
  })
  report.checks.push({ label, ...result, errors: [...errors] })
  const flag = result.overflowX || result.wide.length || result.hidden.length || result.clipped.length || result.broken.length || errors.length
  console.log(`${flag ? 'CHECK' : 'ok   '} ${label}: overflowX=${result.overflowX} wide=${result.wide.length} hidden=${result.hidden.length} clipped=${result.clipped.length} broken=${result.broken.length} errors=${errors.length}`)
  for (const c of result.clipped) console.log('      clipped', c)
}

/** Full page + per-section PNGs, stitched from viewport screenshots. The nav shows only on the first frame. */
async function stitched(page, prefix) {
  const dir = `${out}frames/`
  mkdirSync(dir, { recursive: true })
  const { height, vh, sections } = await page.evaluate((ids) => ({
    height: document.documentElement.scrollHeight,
    vh: window.innerHeight,
    sections: ids
      .map((id) => document.getElementById(id))
      .filter(Boolean)
      .map((el) => ({ id: el.id, top: Math.round(el.getBoundingClientRect().top + window.scrollY), height: Math.round(el.offsetHeight) })),
  }), SECTIONS)
  const frames = []
  for (let y = 0, k = 0; y < height; y += vh, k++) {
    const top = Math.min(y, height - vh)
    await page.evaluate(([t, hideNav]) => {
      window.scrollTo({ top: t, behavior: 'instant' })
      document.querySelector('header').style.visibility = hideNav ? 'hidden' : ''
    }, [top, k > 0])
    await page.waitForTimeout(1100)
    const path = `${dir}${prefix}-${String(k).padStart(2, '0')}.png`
    await page.screenshot({ path })
    frames.push({ path, y: top })
  }
  await page.evaluate(() => (document.querySelector('header').style.visibility = ''))
  const manifest = `${dir}${prefix}.json`
  writeFileSync(manifest, JSON.stringify({
    out: `${out}${prefix}-full.png`,
    height,
    frames,
    sections: sections.map((s) => ({ ...s, out: `${out}${prefix}-${s.id}.png` })),
  }))
  execFileSync(process.env.PYTHON ?? 'python3', [new URL('./stitch.py', import.meta.url).pathname, manifest])
}

if (only.includes('intro')) {
  const { ctx, page, errors } = await context(WIDTHS[2], { skipIntro: false })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  const t0 = Date.now()
  for (const ms of [250, 700, 1200, 1700, 2300, 2900, 3500, 4300]) {
    const wait = ms - (Date.now() - t0)
    if (wait > 0) await page.waitForTimeout(wait)
    await page.screenshot({ path: `${out}intro-${String(ms).padStart(4, '0')}.png` })
  }
  const state = await page.evaluate(() => ({ intro: document.documentElement.classList.contains('intro'), overflow: document.documentElement.style.overflow }))
  console.log('intro state at ~4.3s:', JSON.stringify(state))
  report.checks.push({ label: 'intro', state, errors })
  // Skip button
  const s2 = await context(WIDTHS[1], { skipIntro: false })
  await s2.page.goto(base, { waitUntil: 'domcontentloaded' })
  await s2.page.waitForTimeout(500)
  await s2.page.getByRole('button', { name: /skip intro/i }).click()
  await s2.page.waitForTimeout(300)
  const skipped = await s2.page.evaluate(() => !document.documentElement.classList.contains('intro') && document.documentElement.style.overflow === '')
  console.log('skip intro works:', skipped)
  await s2.page.screenshot({ path: `${out}intro-skipped-390.png` })
  report.checks.push({ label: 'skip', skipped })
  await s2.ctx.close()
  await ctx.close()
}

if (only.includes('widths')) {
  for (const vp of WIDTHS) {
    const { ctx, page, errors } = await context(vp)
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${out}${vp.width}-first.png` })
    await scrollThrough(page)
    await layoutChecks(page, `motion ${vp.width}`, errors)
    await stitched(page, String(vp.width))
    if (vp.mobile) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.getByRole('button', { name: /open menu/i }).click()
      await page.waitForTimeout(900)
      await page.screenshot({ path: `${out}${vp.width}-menu.png` })
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      const closed = await page.evaluate(() => document.getElementById('mobile-menu').hasAttribute('inert') && document.documentElement.style.overflow === '')
      console.log(`menu ${vp.width} closes on Escape and unlocks scroll:`, closed)
    }
    await ctx.close()
  }
}

if (only.includes('reduced')) {
  for (const vp of [WIDTHS[1], WIDTHS[2]]) {
    const { ctx, page, errors } = await context(vp, { reduced: true, skipIntro: false })
    await page.goto(base, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    const introOn = await page.evaluate(() => document.documentElement.classList.contains('intro'))
    console.log(`reduced ${vp.width}: intro class present = ${introOn} (expected false)`)
    await layoutChecks(page, `reduced ${vp.width}`, errors)
    await stitched(page, `reduced-${vp.width}`)
    await ctx.close()
  }
}

if (only.includes('projects')) {
  for (const vp of [WIDTHS[2], WIDTHS[1]]) {
    const { ctx, page } = await context(vp)
    await page.goto(base, { waitUntil: 'networkidle' })
    for (const id of ['project-1', 'project-2', 'project-3']) {
      const { top, height } = await page.evaluate((i) => {
        const r = document.getElementById(i).getBoundingClientRect()
        return { top: r.top + window.scrollY, height: r.height }
      }, id)
      const steps = [0, 0.15, 0.3, 0.5, 0.7, 0.9]
      for (const [k, p] of steps.entries()) {
        await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(top - vp.height * 0.6 + p * height))
        await page.waitForTimeout(700)
        await page.screenshot({ path: `${out}${id}-${vp.width}-p${k}.png` })
      }
    }
    await ctx.close()
  }
}

writeFileSync(`${out}report.json`, JSON.stringify(report, null, 2))
await browser.close()
console.log('shots in', out)
