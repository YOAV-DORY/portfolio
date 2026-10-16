// Screen videos for the project sections (image kind 1: real product footage).
//
//   node scripts/record.mjs [permissionguard|eastwire ...]
//
// Both videos are rendered frame by frame (screenshot per frame, then ffmpeg), which gives sharp,
// deterministic footage instead of a lossy live screen recording:
// - permissionguard: scripts/pg-terminal.html, a replay of real captured CLI output (see that file).
// - eastwire: the live site at https://eastwire.pages.dev, scrolled smoothly, then the map page.
// Output: public/media/<project>/loop.mp4 (H.264, muted, under 2 MB) and poster.webp.
// Needs installed Chrome, ffmpeg with libx264, and Pillow (scripts/to-webp.py's venv) for the poster.
import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'

const FPS = 30
const W = 1280
const H = 912 // 16:10 frame x 114%: the parallax layer of the hero frame
const only = process.argv.slice(2)
const want = (name) => !only.length || only.includes(name)
const here = new URL('.', import.meta.url).pathname
const PY = process.env.PYTHON ?? 'python3'

const browser = await chromium.launch({ channel: 'chrome' })

async function frames(name, draw, count) {
  const dir = `${here}.raw/frames-${name}/`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (let i = 0; i < count; i++) {
    const page = await draw(i)
    await page.screenshot({ path: `${dir}${String(i).padStart(4, '0')}.png` })
  }
  return dir
}

function encode(name, dir, posterFrame) {
  const outDir = `${here}../public/media/${name}/`
  mkdirSync(outDir, { recursive: true })
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}%04d.png`,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-an', `${outDir}loop.mp4`])
  execFileSync(PY, ['-c', `from PIL import Image; Image.open('${dir}${String(posterFrame).padStart(4, '0')}.png').convert('RGB').save('${outDir}poster.webp', 'WEBP', quality=80, method=6)`])
  console.log('wrote', `${outDir}loop.mp4`, `${outDir}poster.webp`)
}

if (want('permissionguard')) {
  const page = await browser.newPage({ viewport: { width: W, height: H } })
  await page.goto(`file://${here}pg-terminal.html`)
  const duration = await page.evaluate(() => window.__duration)
  const count = Math.ceil((duration / 1000) * FPS)
  const dir = await frames('permissionguard', async (i) => {
    await page.evaluate((t) => window.render(t), (i * 1000) / FPS)
    return page
  }, count)
  encode('permissionguard', dir, count - 1) // poster: the finished run, every verdict visible
  await page.close()
}

if (want('eastwire')) {
  const context = await browser.newContext({ viewport: { width: W, height: H }, colorScheme: 'dark' })
  const page = await context.newPage()
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  // Shot list: [path, seconds, scroll distance in px]. Each page is pre-scrolled once so lazy images load.
  const SHOTS = [
    ['/', 6.5, 1500],
    ['/map', 6.5, 520],
  ]
  let frame = 0
  const dir = `${here}.raw/frames-eastwire/`
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  for (const [path, seconds, distance] of SHOTS) {
    await page.goto(`https://eastwire.pages.dev${path}`, { waitUntil: 'networkidle', timeout: 120_000 })
    await page.evaluate(async (d) => {
      for (let y = 0; y <= d; y += 200) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
      window.scrollTo(0, 0)
    }, distance)
    await page.waitForTimeout(2500)
    const n = Math.round(seconds * FPS)
    for (let i = 0; i < n; i++) {
      // hold 0.8 s, glide, hold the end
      const p = Math.min(1, Math.max(0, (i / n - 0.12) / 0.7))
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(ease(p) * distance))
      await page.screenshot({ path: `${dir}${String(frame++).padStart(4, '0')}.png` })
    }
  }
  encode('eastwire', dir, 0) // poster: the front page before scrolling
  await context.close()
}

await browser.close()
