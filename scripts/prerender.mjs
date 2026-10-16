// Static prerender: renders the app to HTML at build time and writes it into dist/index.html, so
// search engines, link previews and visitors without JavaScript get the full page. Also writes
// robots.txt and sitemap.xml for VITE_SITE_URL.
//
//   vite build && vite build --ssr src/entry-server.tsx --outDir dist-ssr && node scripts/prerender.mjs
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

const root = new URL('../', import.meta.url)
const site = (loadEnv('production', fileURLToPath(root), '').VITE_SITE_URL || '').replace(/\/$/, '')
if (!site) throw new Error('VITE_SITE_URL is not set (see .env)')

const { render } = await import(new URL('dist-ssr/entry-server.js', root).href)
const file = new URL('dist/index.html', root)
const html = readFileSync(file, 'utf8')
if (!html.includes('<!--app-->')) throw new Error('dist/index.html has no <!--app--> placeholder')
writeFileSync(file, html.replace('<!--app-->', render()))

writeFileSync(new URL('dist/robots.txt', root), `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`)
writeFileSync(
  new URL('dist/sitemap.xml', root),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${site}/</loc></url>\n</urlset>\n`,
)
rmSync(new URL('dist-ssr/', root), { recursive: true, force: true })
console.log(`prerendered dist/index.html (+ robots.txt, sitemap.xml for ${site})`)
