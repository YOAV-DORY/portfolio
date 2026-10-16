// Runtime performance check (before/after comparisons), in installed Chrome at DPR 2.
//
//   node scripts/perf.mjs [baseUrl=http://localhost:4180] [label=now] [cpuThrottle=4]
//
// For 1280x720 and 390x844, with the CPU slowed down (default 4x, like a busy or older machine):
// - intro: wall-clock time until the intro ends, and until scrolling is unlocked;
// - idle: running animations (document.getAnimations) at the top, 7 s after load;
// - unlock: when a real wheel gesture first moves the page (overflow: hidden blocks wheels, not
//   scrollTo, so this measures what a visitor feels);
// - scroll: frame times (requestAnimationFrame deltas), long tasks, and from a Chrome trace the time
//   spent in Paint / raster / layout / style while wheel-scrolling the whole page, top to bottom;
// - visual: viewport screenshots of the hero, About, a project header and Contact once settled.
// Writes shots-perf/<label>/ (gitignored) with report.json and the screenshots.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const [base = 'http://localhost:4180', label = 'now', throttle = '4'] = process.argv.slice(2)
const out = new URL(`../shots-perf/${label}/`, import.meta.url).pathname
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const report = { base, label, cpuThrottle: Number(throttle), runs: [] }

for (const vp of [{ width: 1280, height: 720, mobile: false }, { width: 390, height: 844, mobile: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.mobile, hasTouch: vp.mobile })
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(throttle) })
  await page.addInitScript(() => {
    window.__perf = { longtasks: [], introEnd: null }
    try {
      new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__perf.longtasks.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true })
    } catch {}
    const poll = () => {
      const d = document.documentElement
      if (d && window.__perf.introEnd === null && document.body && !d.classList.contains('intro')) window.__perf.introEnd = Math.round(performance.now())
      if (window.__perf.introEnd === null) setTimeout(poll, 25)
    }
    poll()
  })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  // wheel a little every 100 ms until the page moves: that is when scrolling is really unlocked
  await page.mouse.move(vp.width / 2, vp.height / 2)
  let unlock = null
  for (let i = 0; i < 80 && unlock === null; i++) {
    if (vp.mobile) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vp.width / 2, y: 600 }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vp.width / 2, y: 560 }] })
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    } else await page.mouse.wheel(0, 40)
    await page.waitForTimeout(100)
    const y = await page.evaluate(() => window.scrollY)
    if (y > 0) unlock = Math.round(await page.evaluate(() => performance.now()))
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(6000)
  const idle = await page.evaluate(() => {
    const running = document.getAnimations().filter((a) => a.playState === 'running')
    return { running: running.length, names: [...new Set(running.map((a) => a.animationName ?? a.constructor.name))] }
  })
  const intro = await page.evaluate(() => ({ introEnd: window.__perf.introEnd }))
  intro.unlock = unlock

  // wheel-scroll the whole page while recording frame deltas
  await page.evaluate(() => {
    window.__frames = []
    let last = performance.now()
    const tick = (t) => {
      window.__frames.push(t - last)
      last = t
      if (window.__recording) requestAnimationFrame(tick)
    }
    window.__recording = true
    window.__perf.longtasks.length = 0
    requestAnimationFrame(tick)
  })
  await page.mouse.move(vp.width / 2, vp.height / 2)
  await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'cc'] })
  const t0 = Date.now()
  // the real bottom is re-read every step: content-visibility placeholders change the page height
  while (await page.evaluate(() => window.scrollY < document.documentElement.scrollHeight - window.innerHeight - 4) && Date.now() - t0 < 60000) {
    if (vp.mobile) await page.evaluate(() => window.scrollBy(0, 60))
    else await page.mouse.wheel(0, 120)
    await page.waitForTimeout(16)
  }
  const trace = JSON.parse((await browser.stopTracing()).toString())
  const cost = {}
  for (const e of trace.traceEvents ?? []) {
    if (e.ph !== 'X' || !e.dur) continue
    const key = { Paint: 'paint', RasterTask: 'raster', Layout: 'layout', UpdateLayoutTree: 'style', PrePaint: 'prepaint', Layerize: 'layerize' }[e.name]
    if (key) cost[key] = (cost[key] ?? 0) + e.dur / 1000
  }
  for (const k of Object.keys(cost)) cost[k] = Math.round(cost[k])
  const elapsed = Date.now() - t0
  const reached = await page.evaluate(() => Math.round(window.scrollY))
  const scroll = await page.evaluate(() => {
    window.__recording = false
    const f = window.__frames.slice(2).sort((a, b) => a - b)
    const pct = (p) => Math.round(f[Math.floor((f.length - 1) * p)] * 10) / 10
    return { frames: f.length, p50: pct(0.5), p95: pct(0.95), over25ms: Math.round((f.filter((x) => x > 25).length / f.length) * 1000) / 10, longtasks: window.__perf.longtasks.length, longestTask: Math.max(0, ...window.__perf.longtasks) }
  })

  // settled screenshots per section
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  for (const [name, sel, offset] of [['hero', '#home', 0], ['about', '#cv', 0], ['project', '#project-2', 0], ['contact', '#contact', 0]]) {
    await page.evaluate(([s, o]) => {
      const el = document.querySelector(s)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + o, behavior: 'instant' })
    }, [sel, offset])
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${out}${vp.width}-${name}.png` })
  }
  scroll.elapsedMs = elapsed
  scroll.reachedY = reached
  scroll.fps = Math.round((scroll.frames / (elapsed / 1000)) * 10) / 10
  const run = { viewport: `${vp.width}x${vp.height}`, intro, idle, scroll, cost, height: await page.evaluate(() => document.documentElement.scrollHeight) }
  report.runs.push(run)
  console.log(`${run.viewport}: intro ends ${intro.introEnd} ms, scroll unlocked ${intro.unlock} ms | idle running animations ${idle.running} ${JSON.stringify(idle.names)} | scrolled to ${scroll.reachedY} in ${scroll.elapsedMs} ms, ${scroll.fps} fps (${scroll.frames} frames), p50 ${scroll.p50} ms, p95 ${scroll.p95} ms, ${scroll.over25ms}% over 25 ms, long tasks ${scroll.longtasks} (max ${scroll.longestTask} ms) | trace ms ${JSON.stringify(cost)} | page ${run.height}px`)
  await ctx.close()
}
writeFileSync(`${out}report.json`, JSON.stringify(report, null, 2))
await browser.close()
