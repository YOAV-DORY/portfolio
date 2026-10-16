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
const only = onlyArg ? onlyArg.split(',') : ['intro', 'widths', 'reduced', 'projects', 'fast']
const out = new URL('../shots/', import.meta.url).pathname
mkdirSync(out, { recursive: true })
const report = { base, checks: [] }
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu'] })

const WIDTHS = [
  { width: 320, height: 640, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 1280, height: 800, mobile: false },
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
    // Empty space: merge the vertical extents of every visible piece of content and find the longest
    // stretch with none (backgrounds don't count). The review asked for no more than 40vh anywhere.
    const spans = []
    for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main li, main a, main img, main video, main canvas, main svg, main dd, main dt, main pre, main button, footer p, footer a')) {
      if (el.closest('.sr-only, [aria-hidden="true"] .sr-only')) continue
      const r = el.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) continue
      const s = getComputedStyle(el)
      if (s.visibility === 'hidden' || Number(s.opacity) === 0) continue
      spans.push([r.top + window.scrollY, r.bottom + window.scrollY])
    }
    spans.sort((a, b) => a[0] - b[0])
    const gaps = []
    let end = spans.length ? spans[0][1] : 0
    for (const [a, b] of spans) {
      if (a > end) {
        const near = [...document.querySelectorAll('section[id]')].filter((sec) => sec.getBoundingClientRect().top + window.scrollY <= end).pop()
        gaps.push({ from: Math.round(end), px: Math.round(a - end), vh: +((a - end) / window.innerHeight).toFixed(2), in: near?.id })
      }
      end = Math.max(end, b)
    }
    gaps.sort((a, b) => b.px - a.px)
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src)
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: vw,
      overflowX: document.documentElement.scrollWidth > vw,
      wide: wide.slice(0, 15),
      hidden: hidden.slice(0, 15),
      clipped,
      pageHeight: document.documentElement.scrollHeight,
      emptyMax: gaps[0] ?? null,
      emptyOver40: gaps.filter((g) => g.vh > 0.4),
      broken,
    }
  })
  report.checks.push({ label, ...result, errors: [...errors] })
  const flag = result.overflowX || result.wide.length || result.hidden.length || result.clipped.length || result.emptyOver40.length || result.broken.length || errors.length
  console.log(`${flag ? 'CHECK' : 'ok   '} ${label}: overflowX=${result.overflowX} wide=${result.wide.length} hidden=${result.hidden.length} clipped=${result.clipped.length} broken=${result.broken.length} errors=${errors.length} height=${result.pageHeight} maxEmpty=${result.emptyMax ? `${result.emptyMax.vh}vh in #${result.emptyMax.in}` : '-'}`)
  for (const g of result.emptyOver40) console.log('      empty', JSON.stringify(g))
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

// Fast-scroll acceptance pass (from the external review): jump down the page in big programmatic
// steps, pausing now and then like a skimming reader. At every pause, after 1.3 s: every count-up on
// screen shows its real value, no revealed text is still hidden, the screen is not near-black, and a
// screen video on screen is playing. Also: the portrait resolves without a pointer, the intro has a
// visible skip control, and a menu tap closes the menu and lands the heading below the header.
if (only.includes('fast')) {
  for (const vp of [WIDTHS[2], WIDTHS[1]]) {
    const { ctx, page, errors } = await context(vp, { skipIntro: false })
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(400)
    const skip = page.getByRole('button', { name: /skip intro/i })
    const skipVisible = await skip.isVisible()
    const box = await skip.boundingBox()
    await page.waitForTimeout(5800) // intro (~3.5 s) + 2 s + the 1.2 s cross-fade
    const portrait = await page.evaluate(() => getComputedStyle(document.querySelector('.portrait-static')).opacity)
    await page.screenshot({ path: `${out}fast-${vp.width}-portrait.png` })
    console.log(`fast ${vp.width}: skip control visible=${skipVisible} at ${box && `${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}`}; portrait resolved (opacity ${portrait})`)

    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    const problems = []
    let y = 0
    let stop = 0
    while (y < max) {
      for (let i = 0; i < 3 && y < max; i++) {
        y = Math.min(max, y + Math.round(vp.height * 0.85))
        await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), y)
        await page.waitForTimeout(40) // ~20 screens per second
      }
      await page.waitForTimeout(1300)
      const state = await page.evaluate(() => {
        const inView = (el) => {
          const r = el.getBoundingClientRect()
          return r.bottom > 64 && r.top < window.innerHeight * 0.94 && r.width > 0 // ignore the last few pixels a reveal is about to enter
        }
        const fmt = (el) => new Intl.NumberFormat('en-US', { minimumFractionDigits: +el.dataset.decimals, maximumFractionDigits: +el.dataset.decimals }).format(+el.dataset.count)
        const wrongNumbers = [...document.querySelectorAll('[data-count]')].filter(inView).filter((el) => el.textContent !== fmt(el)).map((el) => `${el.textContent} (should be ${fmt(el)})`)
        const hidden = [...document.querySelectorAll('[data-reveal], [data-reveal-group] > *, [data-line], [data-row], [data-panel], .acc-row, [data-verdict], [data-country]')]
          .filter(inView)
          .filter((el) => { const st = getComputedStyle(el); return st.visibility === 'hidden' || Number(st.opacity) < 0.99 })
          .map((el) => el.textContent.trim().slice(0, 40))
        const videos = [...document.querySelectorAll('video')].filter((v) => { const r = v.getBoundingClientRect(); return r.top < window.innerHeight * 0.8 && r.bottom > window.innerHeight * 0.2 })
          .map((v) => ({ src: v.currentSrc.split('/').slice(-2).join('/'), readyState: v.readyState, paused: v.paused, t: +v.currentTime.toFixed(2) }))
        return { y: Math.round(window.scrollY), wrongNumbers, hidden, videos }
      })
      const shot = `${out}fast-${vp.width}-stop${String(stop++).padStart(2, '0')}.png`
      await page.screenshot({ path: shot })
      const dark = Number(execFileSync(process.env.PYTHON ?? 'python3', ['-c', `from PIL import Image; im = Image.open('${shot}').convert('L'); h = im.histogram(); print(sum(h[:14]) / sum(h))`]).toString())
      const bad = state.wrongNumbers.length || state.hidden.length || dark > 0.97 || state.videos.some((v) => v.paused || v.readyState < 2)
      if (bad) problems.push({ ...state, dark: +dark.toFixed(3) })
      console.log(`  ${bad ? 'CHECK' : 'ok   '} y=${state.y} dark=${dark.toFixed(2)} numbers=${state.wrongNumbers.join(', ') || 'final'} hidden=${state.hidden.length}${state.videos.length ? ' video=' + JSON.stringify(state.videos) : ''}`)
    }
    report.checks.push({ label: `fast ${vp.width}`, skipVisible, portrait, problems, errors })

    // Jump straight to each screen video (no scrolling in between) and give it 2 s to start.
    for (const i of [0, 1]) {
      const v = await page.evaluate(async (k) => {
        const el = document.querySelectorAll('video')[k]
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight / 3, behavior: 'instant' })
        await new Promise((r) => setTimeout(r, 2000))
        return { src: el.currentSrc.split('/').slice(-2).join('/'), readyState: el.readyState, paused: el.paused, t: +el.currentTime.toFixed(2) }
      }, i)
      console.log(`  jump to video: ${v.src} readyState=${v.readyState} ${v.paused ? 'PAUSED' : 'playing'} t=${v.t}s`)
      report.checks.push({ label: `video ${vp.width}`, ...v })
    }

    if (vp.mobile) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(300)
      for (const name of ['CV', 'Projects', 'Contact']) {
        await page.getByRole('button', { name: /open menu/i }).click()
        await page.waitForTimeout(700)
        await page.locator('#mobile-menu').getByRole('link', { name, exact: true }).click()
        await page.waitForTimeout(1600)
        const r = await page.evaluate((n) => {
          const menuClosed = document.getElementById('mobile-menu').hasAttribute('inert') && document.documentElement.style.overflow === ''
          const section = document.getElementById(n.toLowerCase())
          const heading = section.querySelector('h2:not(.sr-only), [data-reveal-lines], p.label') ?? section
          const top = Math.round(heading.getBoundingClientRect().top)
          const header = Math.round(document.querySelector('header').getBoundingClientRect().bottom)
          return { menuClosed, headingTop: top, headerBottom: header, hash: location.hash }
        }, name)
        console.log(`  menu > ${name}: closed=${r.menuClosed} heading top ${r.headingTop}px vs header bottom ${r.headerBottom}px ${r.headingTop >= r.headerBottom ? 'ok' : 'HIDDEN'} ${r.hash}`)
        report.checks.push({ label: `menu ${name}`, ...r })
      }
    }
    if (errors.length) console.log('  console errors:', errors)
    await ctx.close()
  }
}

writeFileSync(`${out}report.json`, JSON.stringify(report, null, 2))
await browser.close()
console.log('shots in', out)
