// Renders scripts/og.html to public/og.jpg (1200x630) for Open Graph and Twitter cards.
//   node scripts/og.mjs
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(new URL('./og.html', import.meta.url).href)
await page.waitForLoadState('networkidle')
await page.screenshot({ path: new URL('../public/og.jpg', import.meta.url).pathname, type: 'jpeg', quality: 86 })
await browser.close()
console.log('wrote public/og.jpg')
