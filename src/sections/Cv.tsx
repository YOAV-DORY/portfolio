import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react'
import { Accent, Arrow, Container, Label, Lines, Pill } from '../components/ui'
import { ABOUT, LANGUAGES, SITE, SKILLS, TRACKS, type Track } from '../content/site'
import { gsap, MEDIA, type MediaConditions } from '../motion/gsap'
import { playOnEnter, useReveal } from '../motion/useReveal'

export function Cv() {
  return (
    <section id="cv" aria-labelledby="cv-title" className="relative bg-bg">
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

  // Desktop: scrubbed word-by-word colour reveal. Each word lights up as it enters the bottom of the
  // screen, so whatever is on screen is readable. Mobile: one fade-up. Reduced motion: nothing.
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA, (ctx) => {
      const { motion, desktop } = ctx.conditions as MediaConditions
      if (!motion) return
      const card = el.querySelector('[data-about-card]')!
      if (!desktop) {
        playOnEnter(card, gsap.from(card, { y: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out', paused: true }))
        return
      }
      gsap.fromTo(
        el.querySelectorAll('[data-word]'),
        { color: '#52525b', opacity: 0.2 },
        { color: '#ffffff', opacity: 1, ease: 'none', stagger: 0.05, scrollTrigger: { trigger: card, start: 'top 92%', end: 'bottom 95%', scrub: true } },
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={root} className="pb-16 pt-20 md:pb-24 md:pt-28">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <Label>
            <span className="text-tag">01</span> &nbsp;/ About
          </Label>
          <p data-reveal="up" aria-hidden="true" className="heading text-gradient mt-6 text-[clamp(4.5rem,15vw,11rem)] lg:text-[clamp(6rem,10vw,10.5rem)]">
            About
          </p>
          <p data-reveal="up" data-reveal-delay="0.1" className="mt-6 max-w-sm text-gray-400">
            The short version of my CV. The full one is a click away.
          </p>
          <div data-reveal="up" data-reveal-delay="0.2" className="mt-8">
            <Pill href={SITE.cv} download="Yoav-Dory-CV.pdf">
              Download CV (PDF)
            </Pill>
          </div>
        </div>

        <div data-about-card className="rounded-3xl border border-white/10 bg-panel p-7 md:p-12">
          <h3 className="sr-only">About me</h3>
          <p className="text-[clamp(1.2rem,1.9vw,1.6rem)] font-light leading-[1.55] tracking-tight text-gray-200">
            {ABOUT.map((seg, i) => (
              <Fragment key={i}>{seg.bold ? <strong className="font-semibold">{words(seg.text)}</strong> : words(seg.text)}</Fragment>
            ))}
          </p>
          <p className="label mt-10 border-t border-white/10 pt-6 text-gray-500">Languages · {LANGUAGES}</p>
        </div>
      </Container>
    </div>
  )
}

/** Split text into word spans for the scrubbed reveal, keeping the spaces as real text. */
function words(text: string) {
  return text.split(/(\s+)/).map((w, i) => (/^\s+$/.test(w) || !w ? w : <span key={i} data-word="">{w}</span>))
}

/* ------------------------------------------------------------------ accordion */

function Path() {
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(0)
  useReveal(root)

  // Rows rise from yPercent 12 while their divider stretches (--rule-scale 0 to 1).
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA.motion, () => {
      const rows = el.querySelectorAll('.acc-row')
      const tween = gsap.from(rows, { yPercent: 12, autoAlpha: 0, '--rule-scale': 0, duration: 0.6, ease: 'power3.out', stagger: 0.06, paused: true })
      playOnEnter(el.querySelector('[data-rows]')!, tween)
    })
    return () => mm.revert()
  }, [])

  return (
    <div ref={root} className="pb-16 md:pb-24">
      <Container className="mb-10 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
        <div>
          <Label className="mb-6">
            <span className="text-tag">02</span> &nbsp;/ Experience
          </Label>
          <Lines lines={['The path', <Accent key="a">so far</Accent>]} className="text-[clamp(3.25rem,10vw,8rem)]" />
        </div>
        <p data-reveal="up" className="max-w-sm text-gray-400">
          Service, study and volunteering. Open a row for the details.
        </p>
      </Container>
      <ul data-rows className="border-b border-white/20">
        {TRACKS.map((t, i) => (
          <Row key={t.title} track={t} index={i} open={open === i} onToggle={() => setOpen(open === i ? null : i)} />
        ))}
      </ul>
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
          <Container className="flex items-center gap-5 py-7 md:gap-10 md:py-10">
            <span className="acc-muted label w-8 shrink-0 text-gray-500">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between md:gap-8">
                <span className="heading text-[clamp(1.9rem,5.5vw,4.25rem)]">{track.title}</span>
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
        <Container className="grid grid-cols-1 gap-10 pb-12 md:grid-cols-2 md:pb-16 md:pl-[calc(4rem+2.5rem)]">
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
  return (
    <div ref={root} className="pb-20 md:pb-28">
      <Container className="mb-10 md:mb-12">
        <Label className="mb-6">
          <span className="text-tag">03</span> &nbsp;/ Skills
        </Label>
        <Lines lines={['Tools I', <Accent key="a">reach for</Accent>]} className="text-[clamp(3.25rem,10vw,8rem)]" />
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
            <div className="marquee overflow-hidden px-6 md:px-0">
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
