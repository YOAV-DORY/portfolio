import { lazy, Suspense, useEffect, useRef } from 'react'
import { FEATURES } from './content/site'
import { ScrollTrigger } from './motion/gsap'
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
