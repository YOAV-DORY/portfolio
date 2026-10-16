import { useLayoutEffect, useRef } from 'react'
import { Container, Label, Pill } from '../components/ui'
import { SITE } from '../content/site'
import { intro } from '../lib/intro'
import { gsap, MEDIA } from '../motion/gsap'
import { Portrait } from './Portrait'

// The intro: the wordmark PORTFOLIO assembles letter by letter, morphs one letter every 150 ms into
// YOAV DORY (the F drops out, which is where the name splits), moves down to its place, the halves
// slide apart and the role line and buttons rise. About 3.3 s, skippable, never for reduced motion.
const LEFT = { from: 'PORT', to: 'YOAV' }
const MID = 'F'
const RIGHT = { from: 'OLIO', to: 'DORY' }

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const skip = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const html = document.documentElement
    if (!html.classList.contains('intro')) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA.motion, () => {
      window.clearTimeout(window.__introFailsafe)
      const q = gsap.utils.selector(el)
      const title = q('.hero-title')[0] as HTMLElement
      const halves = q('[data-half]') as HTMLElement[]
      const mid = q('.hero-mid')[0] as HTMLElement
      const fromGlyphs = q('.glyph-from, .hero-mid > span') as HTMLElement[]
      const toGlyphs = q('.glyph-to') as HTMLElement[]
      const letterSlots = q('[data-slot]') as HTMLElement[]
      const fades = q('[data-intro-fade]') as HTMLElement[]

      // Each slot starts as wide as its PORTFOLIO letter and eases to the width of its YOAV DORY letter,
      // so the word keeps even spacing while it morphs. The F slot shrinks to a word gap.
      const fromW = letterSlots.map((s) => (s.querySelector('.glyph-from') as HTMLElement).offsetWidth)
      const toW = letterSlots.map((s) => s.offsetWidth)
      const gap = parseFloat(getComputedStyle(title.querySelector('.hero-row')!).fontSize) * 0.22

      // FLIP: measure where the gathered word sits just before it moves, and where the final layout puts it.
      const box = (n: HTMLElement) => n.getBoundingClientRect()
      mid.style.width = `${gap}px`
      const before = { title: box(title), l: box(halves[0]), r: box(halves[1]) }
      html.classList.remove('intro')
      const after = { title: box(title), l: box(halves[0]), r: box(halves[1]) }
      html.classList.add('intro')
      mid.style.width = ''
      const dy = before.title.top - after.title.top
      const dl = before.l.left - after.l.left
      const dr = before.r.left - after.r.left

      html.style.overflow = 'hidden' // scroll stays locked until the very end
      const release = () => {
        html.style.overflow = ''
        gsap.set([title, ...halves, ...fades, ...fromGlyphs, ...toGlyphs, ...letterSlots, mid], { clearProps: 'all' })
        intro.finish()
      }

      const tl = gsap.timeline({ onComplete: release })
      // 1. assemble. y: 0 matters: GSAP reads the CSS translateY(110%) of the gathered state as pixels.
      tl.set(letterSlots, { width: (i: number) => fromW[i] }, 0)
      tl.fromTo(fromGlyphs, { y: 0, yPercent: 110, rotate: 8 }, { yPercent: 0, rotate: 0, duration: 0.5, ease: 'power3.out', stagger: 0.035 }, 0)
      tl.call(() => intro.cueTiles(), [], 0.35)
      // 2. morph, one letter every 150 ms
      const T0 = 0.6
      const order = [...LEFT.to, MID, ...RIGHT.to]
      let slot = 0
      order.forEach((_, i) => {
        const at = T0 + i * 0.15
        tl.to(fromGlyphs[i], { yPercent: -110, duration: 0.4, ease: 'power3.inOut' }, at)
        if (i === LEFT.to.length) {
          tl.fromTo(mid, { width: mid.offsetWidth }, { width: gap, duration: 0.4, ease: 'power3.inOut' }, at)
        } else {
          tl.to(letterSlots[slot], { width: toW[slot], duration: 0.4, ease: 'power3.inOut' }, at)
          tl.fromTo(toGlyphs[slot++], { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: 'power3.inOut' }, at)
        }
      })
      // 3. move to place while the halves slide apart; 4. role line and buttons rise
      const T1 = T0 + order.length * 0.15 + 0.05
      tl.set(fades, { autoAlpha: 0, y: 50 }, T1)
      tl.set(title, { y: dy }, T1)
      tl.set(halves[0], { x: dl }, T1)
      tl.set(halves[1], { x: dr }, T1)
      tl.set(mid, { width: 0 }, T1)
      tl.call(() => html.classList.remove('intro'), [], T1)
      tl.to(title, { y: 0, duration: 0.95, ease: 'power3.inOut' }, T1)
      tl.to(halves, { x: 0, duration: 0.95, ease: 'power3.inOut' }, T1 + 0.08)
      tl.to(fades, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }, T1 + 0.35)

      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && tl.progress(1)
      const onSkip = () => tl.progress(1)
      const skipButton = skip.current
      window.addEventListener('keydown', onKey)
      skipButton?.addEventListener('click', onSkip)
      return () => {
        window.removeEventListener('keydown', onKey)
        skipButton?.removeEventListener('click', onSkip)
        if (tl.progress() < 1) tl.progress(1)
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <section
      id="home"
      ref={root}
      aria-label="Introduction"
      className="relative isolate h-[100svh] min-h-[560px] overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,#222_0%,#0a0a0a_48%,#000_78%)]"
    >
      <div aria-hidden="true" className="grain absolute inset-0 -z-10" />

      <Portrait className="absolute left-1/2 top-[27%] aspect-square w-[min(88vw,440px)] -translate-x-1/2 md:top-[5vh] md:w-auto md:h-[min(70vh,46vw)]" />

      <h1 className="hero-title absolute inset-x-0 top-[19%] z-10 -translate-y-1/2 md:top-[72%]">
        <span className="sr-only">Yoav Dory</span>
        <Container>
          <span aria-hidden="true" className="hero-row heading flex items-start justify-between text-[14vw] leading-[0.9] md:text-[min(13vw,21vh,13rem)]">
            <Half from={LEFT.from} to={LEFT.to} side="l" />
            <span className="hero-mid relative inline-block w-0 overflow-hidden">
              <span className="text-gradient inline-block">{MID}</span>
            </span>
            <Half from={RIGHT.from} to={RIGHT.to} side="r" />
          </span>
        </Container>
      </h1>

      {/* top labels */}
      <Container className="absolute inset-x-0 top-20 z-10 hidden justify-between md:flex">
        <Label className="!text-gray-500">
          <span data-intro-fade="">CS &amp; Entrepreneurship · Reichman University</span>
        </Label>
        <Label className="!text-gray-500">
          <span data-intro-fade="">Former IDF Combat ICT Officer</span>
        </Label>
      </Container>

      {/* role line + buttons */}
      <Container className="absolute inset-x-0 bottom-[max(1.5rem,5vh)] z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <p data-intro-fade="" className="text-[clamp(1.35rem,2.4vw,2rem)] leading-tight tracking-tight text-white">
          <strong className="font-bold">Student Developer</strong> <span className="font-serif font-light italic text-accent">&amp; Product</span>
        </p>
        <div data-intro-fade="" className="flex flex-wrap gap-3">
          <Pill variant="primary" href={SITE.cv} download="Yoav-Dory-CV.pdf">
            Download CV
          </Pill>
          <Pill href="#contact">Contact</Pill>
        </div>
      </Container>

      <button
        ref={skip}
        type="button"
        className="skip-intro label absolute right-6 top-6 z-20 items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-gray-300 transition-colors hover:border-accent hover:text-white md:right-16"
      >
        Skip intro <span className="text-tag">esc</span>
      </button>
    </section>
  )
}

function Half({ from, to, side }: { from: string; to: string; side: 'l' | 'r' }) {
  return (
    <span data-half={side} className="flex">
      {[...to].map((ch, i) => (
        <span key={i} data-slot="" className="relative inline-block overflow-hidden py-[0.03em]">
          <span className="glyph-from text-gradient">{from[i]}</span>
          <span className="glyph-to text-gradient inline-block">{ch}</span>
        </span>
      ))}
    </span>
  )
}
