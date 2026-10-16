import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Accent, Arrow, Container, Lines, Pill } from '../components/ui'
import { SITE } from '../content/site'
import { gsap, MEDIA, type MediaConditions } from '../motion/gsap'
import { useReveal } from '../motion/useReveal'

// The round icon buttons repeat the text links for the pointer; keyboard and screen readers use the text link.
const ROWS: Array<{ label: string; value: string; href: string; icon: ReactNode }> = [
  { label: 'Email', value: SITE.email, href: `mailto:${SITE.email}`, icon: <MailIcon /> },
  { label: 'GitHub', value: 'github.com/YOAV-DORY', href: SITE.github, icon: <CodeIcon /> },
  { label: 'LinkedIn', value: 'linkedin.com/in/yoav-dory', href: SITE.linkedin, icon: <span className="text-[15px] font-black tracking-tight">in</span> },
]

export function Contact() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  // Panel: rises 48px and fades over 1.1s, rows rise from their masks; on desktop it drifts ±3.5%.
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA, (ctx) => {
      const { motion, desktop } = ctx.conditions as MediaConditions
      if (!motion) return
      const panel = el.querySelector('[data-panel]')!
      const trigger = { trigger: panel, start: 'top 88%', once: true }
      gsap.from(panel, { y: 48, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: trigger })
      gsap.from(el.querySelectorAll('[data-row]'), { yPercent: 100, duration: 0.85, ease: 'power3.out', stagger: 0.08, delay: 0.25, scrollTrigger: trigger })
      if (desktop) {
        gsap.fromTo(
          el.querySelector('[data-panel-drift]'),
          { yPercent: 3.5 },
          { yPercent: -3.5, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom bottom', scrub: 1 } },
        )
      }
    })
    return () => mm.revert()
  }, [])

  return (
    <section id="contact" ref={root} aria-labelledby="contact-title" className="relative isolate overflow-hidden border-t border-white/10">
      {/* Dark gradient background with overlay (no video: nothing to show that isn't already above). */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_15%_10%,#1d1c1a_0%,transparent_60%),radial-gradient(60%_60%_at_90%_90%,#15140f_0%,transparent_60%),#050505]">
        <div className="mesh absolute -inset-[20%] opacity-25" />
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <Container className="grid grid-cols-1 gap-16 pb-20 pt-28 md:pt-40 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <div>
          <p data-reveal="up" className="label inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-gray-200">
            <span className="ping relative size-2 rounded-full bg-[#3ddc84]" />
            {SITE.status}
          </p>
          <Lines id="contact-title" lines={['Get in', <Accent key="a">touch</Accent>]} className="mt-8 text-[clamp(3.75rem,13vw,10rem)]" />
          <p data-reveal="up" className="mt-8 max-w-md text-lg leading-relaxed text-gray-300">
            Looking for a student developer or product role. If you are hiring, or want to talk about one of the projects, email is the fastest way to reach me.
          </p>
          <div data-reveal-group className="mt-10 flex flex-wrap gap-3">
            <Pill variant="primary" href={`mailto:${SITE.email}`}>
              Email me
            </Pill>
            <Pill href={SITE.cv} download="Yoav-Dory-CV.pdf">
              Download CV
            </Pill>
          </div>
        </div>

        <div data-panel-drift>
          <div data-panel className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm md:p-4">
            <ul>
              {ROWS.map((r, i) => (
                <li key={r.label} className={`overflow-hidden ${i ? 'border-t border-white/10' : ''}`}>
                  <div data-row className="flex items-center justify-between gap-4 px-4 py-5 md:px-6 md:py-7">
                    <div className="min-w-0">
                      <p className="label text-gray-500">{r.label}</p>
                      <a
                        href={r.href}
                        {...(r.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="mt-2 block truncate text-lg tracking-tight text-white underline-offset-4 hover:underline md:text-xl"
                      >
                        {r.value}
                      </a>
                    </div>
                    <a
                      href={r.href}
                      aria-hidden="true"
                      data-magnetic="0.35"
                      tabIndex={-1}
                      {...(r.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="grid grid-cols-1 size-14 shrink-0 place-items-center rounded-full border border-white/20 text-white transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-black md:size-16"
                    >
                      {r.icon}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>

    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-bg">
      <Container className="flex flex-col gap-4 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
        <p>© 2026 Yoav Dory. Designed and built by me, with React, GSAP and a hand-written WebGL shader.</p>
        <a href="#home" className="inline-flex items-center gap-2 text-gray-400 hover:text-white">
          Back to top <Arrow className="-rotate-45" />
        </a>
      </Container>
    </footer>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" strokeLinejoin="round" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" />
    </svg>
  )
}
