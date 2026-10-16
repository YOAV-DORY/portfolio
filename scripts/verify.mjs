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
  { width: 1280, height: 720, mobile: false },
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
  // Measure from the top: further down, covered projects are scaled to 0.96 by the stack.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(400)
  const result = await page.evaluate(() => {
    // measure the natural layout: sticky project stack off (as ScrollTrigger does while refreshing)
    document.documentElement.classList.add('no-stack')
    const vw = document.documentElement.clientWidth
    const wide = []
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (!r.width || el.closest('.marquee, [aria-hidden="true"], .sr-only, pre, [data-strip]')) continue
      if (r.right > vw + 1 || r.left < -1) {
        const s = getComputedStyle(el)
        if (s.position === 'fixed' || s.visibility === 'hidden') continue
        wide.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} [${Math.round(r.left)}, ${Math.round(r.right)}]`)
      }
    }
    const hidden = []
    for (const el of document.querySelectorAll('main h2, main h3, main p, main li, main a, main dd')) {
      if (el.closest('[aria-hidden="true"], .sr-only, #mobile-menu, .acc-panel, .expand:not([data-open="true"]), .skip-intro, .sequence, dialog')) continue
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
    // .pin-spacer: the scroll distance of a pinned strip counts as content (the strip is on screen)
    for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main li, main a, main img, main video, main canvas, main svg, main dd, main dt, main pre, main button, footer p, footer a, .pin-spacer')) {
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
    document.documentElement.classList.remove('no-stack')
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
    await scrollThrough(page) // content-visibility sections get their real size once rendered
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

// Scrolling acceptance pass (from the external reviews), at 1280x720 and 390x844:
// - slow scroll (~900 px/s) and fast scroll (big programmatic jumps), with screenshots taken WHILE
//   moving as well as after short pauses; at every capture nothing on screen may be hidden or
//   transparent, the screen may not be near-black, and every metric must read exactly what it read
//   at first paint (no count-ups);
// - the portrait resolves without a pointer, the intro shows a skip control;
// - nav anchor jumps (desktop nav and the mobile menu) land headings below the header, and the menu
//   closes; Back to top returns to the hero;
// - "Show technical details": the phone diagram and code are readable (no tiny text, no sideways
//   scroll) and the enlarge dialog opens readable, closes on Esc and returns focus.
const VISIBLE_CHECK = () => {
  const inView = (el) => {
    const r = el.getBoundingClientRect()
    return r.bottom > 64 && r.top < window.innerHeight && r.width > 0 && r.height > 0
  }
  const hidden = [...document.querySelectorAll('main h2, main h3, main p, main li, main dd, main dt, main img, main figure, [data-line], [data-verdict], [data-country], .acc-row')]
    .filter((el) => !el.closest('.sr-only, .expand:not([data-open="true"]), .acc-panel, dialog, #home, .sequence > img:not(.opacity-100)') && !el.matches('.sequence > img:not(.opacity-100)'))
    .filter(inView)
    .filter((el) => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const st = getComputedStyle(n)
        if (st.visibility === 'hidden' || Number(st.opacity) < 0.99) return true
      }
      return false
    })
    .map((el) => `${el.tagName.toLowerCase()}: ${el.textContent.trim().slice(0, 36) || el.getAttribute('alt')?.slice(0, 36) || ''}`)
  const metrics = [...document.querySelectorAll('main dl dd')].map((d) => d.textContent)
  const unloaded = [...document.querySelectorAll('main img')].filter(inView).filter((i) => !(i.complete && i.naturalWidth > 0)).length
  const videos = [...document.querySelectorAll('video')]
    .filter((v) => { const r = v.getBoundingClientRect(); return r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.25 })
    .map((v) => ({ src: v.currentSrc.split('/').slice(-2).join('/'), readyState: v.readyState, paused: v.paused }))
  return { y: Math.round(window.scrollY), hidden, metrics, unloaded, videos }
}

function darkness(shot) {
  return Number(execFileSync(process.env.PYTHON ?? 'python3', ['-c', `from PIL import Image; im = Image.open('${shot}').convert('L'); h = im.histogram(); print(sum(h[:14]) / sum(h))`]).toString())
}

if (only.includes('fast')) {
  for (const vp of [WIDTHS[2], WIDTHS[1]]) {
    const { ctx, page, errors } = await context(vp, { skipIntro: false })
    await page.goto(base, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(400)
    const skip = page.getByRole('button', { name: /skip intro/i })
    const skipVisible = await skip.isVisible()
    const box = await skip.boundingBox()
    const firstMetrics = await page.evaluate(() => [...document.querySelectorAll('main dl dd')].map((d) => d.textContent))
    await page.waitForTimeout(5800) // intro (~3.5 s) + 2 s + the cross-fade
    const portrait = await page.evaluate(() => getComputedStyle(document.querySelector('.portrait-static')).opacity)
    await page.screenshot({ path: `${out}scroll-${vp.width}-portrait.png` })
    console.log(`scroll ${vp.width}x${vp.height}: skip control visible=${skipVisible} at ${box && `${Math.round(box.x)},${Math.round(box.y)}`}; portrait opacity ${portrait}; metrics at first paint: ${firstMetrics.join(' | ')}`)

    const max = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    const problems = []
    let shotNo = 0
    const capture = async (mode) => {
      const st = await page.evaluate(VISIBLE_CHECK)
      const shot = `${out}scroll-${vp.width}-${mode}-${String(shotNo++).padStart(2, '0')}.png`
      await page.screenshot({ path: shot })
      const dark = darkness(shot)
      const metricsChanged = st.metrics.join('|') !== firstMetrics.join('|')
      const bad = st.hidden.length || dark > 0.97 || metricsChanged || (mode === 'pause' && st.videos.some((v) => v.paused || v.readyState < 2))
      if (bad) problems.push({ mode, ...st, dark })
      console.log(`  ${bad ? 'CHECK' : 'ok   '} ${mode.padEnd(6)} y=${String(st.y).padStart(5)} dark=${dark.toFixed(2)} hidden=${st.hidden.length} metrics=${metricsChanged ? 'CHANGED' : 'same'} unloadedImgs=${st.unloaded}${st.videos.length ? ' video=' + st.videos.map((v) => `${v.src}:${v.paused ? 'paused' : 'playing'}/${v.readyState}`).join(',') : ''}${st.hidden.length ? ' ' + st.hidden.slice(0, 3).join('; ') : ''}`)
    }

    // slow: about 900 px/s, a capture every ~1.3 s while moving
    let y = 0
    let t = 0
    while (y < max) {
      y = Math.min(max, y + 18)
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y)
      await page.waitForTimeout(20)
      if ((t += 20) % 1300 < 20) await capture('slow')
    }
    // fast: jump up to the top in one go, then down in 85%-of-a-screen jumps at ~20 per second,
    // capturing mid-run (no wait) and after a 0.6 s pause
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    y = 0
    while (y < max) {
      for (let i = 0; i < 4 && y < max; i++) {
        y = Math.min(max, y + Math.round(vp.height * 0.85))
        await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), y)
        await page.waitForTimeout(40)
      }
      await capture('moving')
      await page.waitForTimeout(600)
      await capture('pause')
    }
    report.checks.push({ label: `scroll ${vp.width}`, skipVisible, portrait, problems, errors })

    // anchors: desktop nav, or the mobile menu
    for (const name of ['CV', 'Projects', 'Contact']) {
      if (vp.mobile) {
        await page.getByRole('button', { name: /open menu/i }).click()
        await page.waitForTimeout(600)
        await page.locator('#mobile-menu').getByRole('link', { name, exact: true }).click()
      } else {
        await page.locator('header nav').getByRole('link', { name, exact: true }).click()
      }
      await page.waitForTimeout(1600)
      const r = await page.evaluate((n) => {
        const section = document.getElementById(n.toLowerCase())
        const heading = section.querySelector('h2:not(.sr-only), [data-reveal-lines], p.label') ?? section
        return {
          menuClosed: document.getElementById('mobile-menu').hasAttribute('inert') && document.documentElement.style.overflow === '',
          headingTop: Math.round(heading.getBoundingClientRect().top),
          headerBottom: Math.round(document.querySelector('header').getBoundingClientRect().bottom),
          hash: location.hash,
        }
      }, name)
      const st = await page.evaluate(VISIBLE_CHECK)
      const ok = r.menuClosed && r.headingTop >= r.headerBottom && !st.hidden.length
      console.log(`  ${ok ? 'ok   ' : 'CHECK'} ${vp.mobile ? 'menu' : 'nav '} > ${name}: menu closed=${r.menuClosed}, heading at ${r.headingTop}px (header ends ${r.headerBottom}px), hidden=${st.hidden.length} ${r.hash}`)
      await page.screenshot({ path: `${out}scroll-${vp.width}-anchor-${name.toLowerCase()}.png` })
      report.checks.push({ label: `anchor ${vp.width} ${name}`, ...r, hidden: st.hidden })
    }
    // back to top
    await page.getByRole('link', { name: 'Back to top', exact: true }).click()
    await page.waitForTimeout(1800)
    const top = await page.evaluate(() => ({ y: Math.round(window.scrollY), heroVisible: document.getElementById('home').getBoundingClientRect().top > -5 }))
    console.log(`  ${top.y < 10 && top.heroVisible ? 'ok   ' : 'CHECK'} back to top: scrollY=${top.y}`)
    await page.screenshot({ path: `${out}scroll-${vp.width}-backtotop.png` })

    // technical details + enlarge
    // A visitor reaches this button as the project ends (bottom of the screen), before the next project
    // slides over it: scroll there the same way, then click.
    const toggle = page.locator('#project-1').getByRole('button', { name: /show technical details/i })
    await toggle.evaluate((b) => b.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await page.waitForTimeout(300)
    await toggle.click()
    await page.waitForTimeout(800)
    const details = await page.evaluate(() => {
      const panel = document.getElementById('project-1-details')
      const svg = [...panel.querySelectorAll('svg[role="img"]')].find((x) => x.getBoundingClientRect().width > 0)
      const texts = [...svg.querySelectorAll('text')].filter((x) => x.textContent.trim()).map((x) => x.getBoundingClientRect().height)
      const pre = panel.querySelector('pre')
      return {
        open: panel.dataset.open,
        diagram: svg.getAttribute('viewBox'),
        smallestDiagramText: Math.round(Math.min(...texts) * 10) / 10,
        codeFont: getComputedStyle(pre).fontSize,
        codeSideways: pre.scrollWidth > pre.clientWidth + 1,
      }
    })
    await page.locator('#project-1-details svg[role="img"]').filter({ visible: true }).first().evaluate((x) => x.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await page.waitForTimeout(400)
    await page.screenshot({ path: `${out}scroll-${vp.width}-details-diagram.png` })
    await page.locator('#project-1-details pre').evaluate((x) => x.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${out}scroll-${vp.width}-details-code.png` })
    const enlarge = page.locator('#project-1-details').getByRole('button', { name: /^enlarge/i }).first()
    await enlarge.evaluate((b) => b.scrollIntoView({ block: 'end', behavior: 'instant' }))
    await page.waitForTimeout(300)
    await enlarge.click()
    await page.waitForTimeout(600)
    const dialog = await page.evaluate(() => {
      const d = [...document.querySelectorAll('dialog')].find((x) => x.open)
      return d && { open: true, imgWidth: Math.round(d.querySelector('img').getBoundingClientRect().width), focused: document.activeElement?.getAttribute('aria-label') }
    })
    await page.screenshot({ path: `${out}scroll-${vp.width}-dialog.png` })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
    const after = await page.evaluate(() => ({ anyOpen: [...document.querySelectorAll('dialog')].some((x) => x.open), focus: document.activeElement?.getAttribute('aria-label')?.slice(0, 20), scrollUnlocked: document.documentElement.style.overflow === '' }))
    console.log(`  details: ${JSON.stringify(details)}`)
    console.log(`  enlarge: ${JSON.stringify(dialog)} -> after Esc ${JSON.stringify(after)}`)
    report.checks.push({ label: `details ${vp.width}`, details, dialog, after })
    if (errors.length) console.log('  console errors:', errors)
    await ctx.close()
  }
}

writeFileSync(`${out}report.json`, JSON.stringify(report, null, 2))
await browser.close()
console.log('shots in', out)
