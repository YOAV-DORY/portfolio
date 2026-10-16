import { lazy, Suspense, useEffect, useRef } from 'react'
import { FEATURES } from './content/site'
import { MEDIA, ScrollTrigger } from './motion/gsap'
import { Contact, Footer } from './sections/Contact'
import { Cv } from './sections/Cv'
import { Hero } from './sections/Hero'
import { Nav } from './sections/Nav'
import { Projects } from './sections/Projects'

// Optional game section: off for v1, kept behind FEATURES.play and split into its own chunk.
const Play = FEATURES.play ? lazy(() => import('./sections/Play')) : null

export default function App() {
  const main = useRef<HTMLElement>(null)

  // Any height change (an accordion row opening, a late image) moves every trigger below it, so
  // ScrollTrigger re-measures once the layout has settled.
  useEffect(() => {
    let timer = 0
    let first = true
    const ro = new ResizeObserver(() => {
      if (first) return void (first = false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    if (main.current) ro.observe(main.current)
    return () => {
      ro.disconnect()
      window.clearTimeout(timer)
    }
  }, [])

  // In-page links scroll here instead of through CSS scroll-behavior (which fights ScrollTrigger's
  // measurements). The scroll waits a frame so a mobile menu can close and unlock scrolling first,
  // then focus moves to the section so keyboard and screen-reader users land there too.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.('a[href^="#"]')
      const id = link?.getAttribute('href')?.slice(1)
      const target = id ? document.getElementById(id) : null
      if (!target) return
      e.preventDefault()
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: window.matchMedia(MEDIA.motion).matches ? 'smooth' : 'auto', block: 'start' })
        history.pushState(null, '', `#${id}`)
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
        target.focus({ preventScroll: true })
      })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // Images are lazy so the first paint stays light, but a fast scroller can outrun lazy loading. Once
  // the page has loaded and the browser is idle, the rest are fetched in the background.
  useEffect(() => {
    const warm = () =>
      document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => {
        img.loading = 'eager'
      })
    const idle = (fn: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout: 4000 }) : window.setTimeout(fn, 1500))
    const onLoad = () => window.setTimeout(() => idle(warm), 1200)
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return (
    <>
      <Nav />
      <main ref={main}>
        <Hero />
        <Cv />
        <Projects />
        {Play && (
          <Suspense fallback={null}>
            <Play />
          </Suspense>
        )}
        <Contact />
      </main>
      <Footer />
    </>
  )
}
