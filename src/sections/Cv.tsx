import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react'
import { Accent, Arrow, Container, Label, Lines, Pill } from '../components/ui'
import { ABOUT, LANGUAGES, SITE, SKILLS, TRACKS, type Track } from '../content/site'
import { gsap, MEDIA, ScrollTrigger, type MediaConditions } from '../motion/gsap'
import { playOnEnter, useReveal } from '../motion/useReveal'

export function Cv() {
  return (
    <section id="cv" aria-labelledby="cv-title" className="cv-auto relative bg-bg [--cv-size:3270px] md:[--cv-size:2850px] lg:[--cv-size:2520px]">
      <h2 id="cv-title" className="sr-only">
        CV
      </h2>
      <About />
      <Path />
      <Skills />
    </section>
  )
}

/* ------------------------------------------------------------------ about */

function About() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  // Desktop: the text goes from a readable grey to white, top to bottom, as the card scrolls in. A
  // white copy of the paragraph sits on top of the grey one inside a window: the window and the copy
  // move in opposite directions (two transforms), so the white region grows without repainting any
  // text. Mobile: a short drift. Reduced motion: plain white text.
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA, (ctx) => {
      const { motion, desktop } = ctx.conditions as MediaConditions
      if (!motion) return
      const card = el.querySelector<HTMLElement>('[data-about-card]')!
      if (!desktop) {
        playOnEnter(card, gsap.from(card, { y: 16, duration: 0.45, ease: 'power2.out', paused: true }))
        return
      }
      card.classList.add('about-scrub')
      const scrollTrigger = { trigger: card, start: 'top 92%', end: 'bottom 95%', scrub: true }
      gsap.fromTo(card.querySelector('.about-window'), { yPercent: -100 }, { yPercent: 0, ease: 'none', scrollTrigger })
      gsap.fromTo(card.querySelector('.about-copy'), { yPercent: 100 }, { yPercent: 0, ease: 'none', scrollTrigger })
      return () => card.classList.remove('about-scrub')
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={root} className="pb-12 pt-14 md:pb-16 md:pt-20">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Label>
            <span className="text-tag">01</span> &nbsp;/ About
          </Label>
          <p data-reveal="up" aria-hidden="true" className="heading text-gradient mt-4 text-[clamp(3rem,11vw,6.5rem)]">
            About
          </p>
          <p data-reveal="up" data-reveal-delay="0.1" className="mt-4 max-w-sm text-gray-400">
            The short version of my CV. The full one is a click away.
          </p>
          <div data-reveal="up" data-reveal-delay="0.2" className="mt-6">
            <Pill href={SITE.cv} download="Yoav-Dory-CV.pdf">
              Download CV (PDF)
            </Pill>
          </div>
        </div>

        <div data-about-card className="rounded-3xl border border-white/10 bg-panel p-7 md:p-12">
          <h3 className="sr-only">About me</h3>
          <div className="relative overflow-hidden">
            <p className="about-base text-[clamp(1.08rem,1.6vw,1.4rem)] font-light leading-[1.55] tracking-tight text-gray-200">
              <AboutText />
            </p>
            <div aria-hidden="true" className="about-window pointer-events-none absolute inset-0 hidden select-none overflow-hidden">
              <p className="about-copy text-[clamp(1.08rem,1.6vw,1.4rem)] font-light leading-[1.55] tracking-tight text-white">
                <AboutText />
              </p>
            </div>
          </div>
          <p className="label mt-10 border-t border-white/10 pt-6 text-gray-500">Languages · {LANGUAGES}</p>
        </div>
      </Container>
    </div>
  )
}

function AboutText() {
  return ABOUT.map((seg, i) => <Fragment key={i}>{seg.bold ? <strong className="font-semibold">{seg.text}</strong> : seg.text}</Fragment>)
}

/* ------------------------------------------------------------------ accordion */

function Path() {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(0)
  useReveal(root)

  // Rows drift up a little while their divider stretches (--rule-scale 0 to 1).
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA.motion, () => {
      const rows = el.querySelectorAll('.acc-row')
      const tween = gsap.from(rows, { y: 12, '--rule-scale': 0, duration: 0.45, ease: 'power2.out', stagger: 0.04, paused: true })
      playOnEnter(el.querySelector('[data-rows]')!, tween)
      // The timeline line down the left draws itself as the rows scroll through.
      gsap.fromTo(
        el.querySelector('[data-timeline]'),
        { scaleY: 0 },
        { scaleY: 1, ease: 'none', scrollTrigger: { trigger: el.querySelector('[data-rows]'), start: 'top 80%', end: 'bottom 65%', scrub: true } },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={root} className="pb-12 md:pb-16">
      <Container className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <Label className="mb-4">
            <span className="text-tag">02</span> &nbsp;/ Experience
          </Label>
          <Lines lines={['The path', <Accent key="a">so far</Accent>]} className="text-[clamp(2.5rem,8vw,5.5rem)]" />
        </div>
        <p data-reveal="up" className="max-w-sm text-gray-400">
          Service, study and volunteering. Open a row for the details.
        </p>
      </Container>
      <div className="relative">
        {/* Timeline: a thin accent line in the left gutter, drawn with scroll (full without motion). */}
        <span
          data-timeline
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-px origin-top bg-accent/60 left-[calc(max(0px,(100%_-_80rem)/2)_+_0.6rem)] md:left-[calc(max(0px,(100%_-_80rem)/2)_+_2.25rem)]"
        />
        <ul data-rows className="border-b border-white/20">
          {TRACKS.map((t, i) => (
            <Row key={t.title} track={t} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
          ))}
        </ul>
      </div>
    </div>
  )
}

function Row({ track, index, open, onToggle }: { track: Track; index: number; open: boolean; onToggle: () => void }) {
  const id = useId()
  return (
    <li className="acc-row" data-open={open}>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={onToggle}
          className="acc-head block w-full text-left focus-visible:!outline-offset-[-2px]"
        >
          <Container className="flex items-center gap-5 py-5 md:gap-10 md:py-7">
            <span className="acc-muted label w-8 shrink-0 text-gray-500">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
                <span className="heading text-[clamp(1.6rem,4.5vw,3.25rem)]">{track.title}</span>
                <span className="acc-muted text-sm text-gray-400 md:text-right">{track.summary}</span>
              </span>
              {/* What a skimming reader sees without opening the row (hidden once it is open). */}
              <span className="acc-highlights acc-muted mt-1 flex flex-col gap-1.5 text-[15px] leading-snug text-gray-300 md:flex-row md:flex-wrap md:gap-x-8">
                {track.highlights.map((h) => (
                  <span key={h} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[0.45em] size-1.5 shrink-0 bg-accent" />
                    {h}
                  </span>
                ))}
              </span>
            </span>
            <Arrow className="acc-arrow !size-5 shrink-0 rotate-45 md:!size-6" />
          </Container>
        </button>
      </h3>
      <div id={id} role="region" aria-label={track.title} className="acc-panel">
        <Container className="grid grid-cols-1 gap-8 pb-8 md:grid-cols-2 md:pb-10 md:pl-[calc(4rem+2.5rem)]">
          {track.entries.map((e) => (
            <div key={e.role}>
              <p className="text-lg font-semibold tracking-tight text-white">{e.role}</p>
              <p className="label mt-2 text-gray-500">
                {e.org}
                {e.dates && <> · {e.dates}</>}
              </p>
              <ul className="mt-5 space-y-3">
                {e.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-gray-300">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 bg-accent" />
                    <span className="leading-relaxed">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Container>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ skills marquee */

function Skills() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  // Velocity: a fast scroll briefly skews the rows (up to 6deg) and speeds the tracks up, then both
  // ease back. Skew is a transform on the row; speed is the CSS animations' playbackRate. The rows
  // still pause off screen (data-pause-offscreen).
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA.motion, () => {
      const rows = Array.from(el.querySelectorAll<HTMLElement>('.marquee'))
      const anims = () => rows.flatMap((r) => r.querySelector('.marquee-track')?.getAnimations() ?? [])
      const skew = rows.map((r) => gsap.quickTo(r, 'skewX', { duration: 0.5, ease: 'power3.out' }))
      const speed = { rate: 1 }
      const applyRate = () => anims().forEach((a) => (a.playbackRate = speed.rate))
      let settle = 0
      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          const v = self.getVelocity()
          skew.forEach((to) => to(gsap.utils.clamp(-6, 6, -v / 300)))
          gsap.to(speed, { rate: 1 + Math.min(Math.abs(v) / 1500, 3), duration: 0.25, overwrite: true, onUpdate: applyRate })
          window.clearTimeout(settle)
          settle = window.setTimeout(() => {
            skew.forEach((to) => to(0))
            gsap.to(speed, { rate: 1, duration: 0.9, ease: 'power2.out', overwrite: true, onUpdate: applyRate })
          }, 140)
        },
      })
      return () => {
        window.clearTimeout(settle)
        speed.rate = 1
        applyRate()
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={root} className="pb-14 md:pb-20">
      <Container className="mb-8 md:mb-10">
        <Label className="mb-4">
          <span className="text-tag">03</span> &nbsp;/ Skills
        </Label>
        <Lines lines={['Tools I', <Accent key="a">reach for</Accent>]} className="text-[clamp(2.5rem,8vw,5.5rem)]" />
      </Container>
      <div className="flex flex-col gap-4 md:gap-5" data-reveal="fade">
        {SKILLS.map((row) => (
          <div key={row.label}>
            <h3 className="sr-only">{row.label}</h3>
            <Container className="mb-3">
              <p aria-hidden="true" className="label text-gray-500">
                {row.label}
              </p>
            </Container>
            <div data-pause-offscreen className="marquee overflow-hidden px-6 md:px-0">
              <ul
                className="marquee-track"
                style={{ ['--marquee-duration' as string]: `${row.seconds}s`, ['--marquee-direction' as string]: row.reverse ? 'reverse' : 'normal' }}
              >
                {[0, 1, 2, 3].map((copy) =>
                  row.items.map((item) => (
                    <li key={`${copy}-${item}`} aria-hidden={copy > 0 ? 'true' : undefined} className="pr-3">
                      <span className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.03] px-5 py-2.5 text-[15px] text-gray-200 md:px-6 md:py-3 md:text-lg">
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                        {item}
                      </span>
                    </li>
                  )),
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
