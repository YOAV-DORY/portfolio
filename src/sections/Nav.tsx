import { useEffect, useRef, useState } from 'react'
import { Container, Pill } from '../components/ui'
import { NAV, SITE } from '../content/site'
import { useIntroDone } from '../lib/intro'

/**
 * Fixed top nav. Enters after the intro; transparent at the top, blurred black once scrolled.
 * The active link follows the section crossing the middle of the viewport (IntersectionObserver with
 * rootMargin -45% top and bottom). A 1px accent line under it shows scroll progress.
 */
export function Nav() {
  const introDone = useIntroDone()
  const [active, setActive] = useState('home')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const progress = useRef<HTMLDivElement>(null)
  const burger = useRef<HTMLButtonElement>(null)
  const firstLink = useRef<HTMLAnchorElement>(null)

  // active section
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // scrolled state + progress line (transform only, one rAF per frame at most)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      if (progress.current) progress.current.style.transform = `scaleX(${p})`
      setScrolled(window.scrollY > 12)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // mobile menu: scroll lock, Escape closes, focus moves in and back
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    html.style.overflow = 'hidden'
    firstLink.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onWide = () => window.innerWidth >= 768 && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onWide)
    const btn = burger.current
    return () => {
      html.style.overflow = ''
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onWide)
      btn?.focus()
    }
  }, [open])

  const solid = scrolled || open
  // The menu is a sibling of the header: the header's transform and backdrop-filter would otherwise
  // become the containing block of the fixed full-screen panel.
  return (
    <>
    <header
      inert={!introDone}
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,opacity,background-color,border-color,backdrop-filter] duration-700 ease-[var(--ease-out)] ${
        introDone ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${solid ? 'border-b border-white/10 bg-black/70 backdrop-blur-xl' : 'border-b border-transparent'}`}
    >
      <a href="#cv" className="label sr-only z-[60] rounded-full bg-accent px-4 py-2 text-black focus:not-sr-only focus:absolute focus:left-4 focus:top-3">
        Skip to content
      </a>
      <Container className="flex h-16 items-center justify-between gap-6">
        <a href="#home" className="relative z-[60] text-base font-black uppercase tracking-tighter text-white" aria-label="Yoav Dory, back to top">
          Yoav Dory
        </a>

        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  aria-current={active === n.id ? 'location' : undefined}
                  className="group relative inline-block py-2 text-sm text-gray-300 transition-colors hover:text-white aria-[current]:text-white"
                >
                  {n.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0.5 h-px origin-left bg-accent transition-transform duration-500 ease-[var(--ease-out)] ${
                      active === n.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={burger}
          type="button"
          className="relative z-[60] -mr-2 grid size-11 place-items-center md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true" className="relative block h-3 w-6">
            <span className={`absolute left-0 block h-px w-6 bg-white transition-transform duration-500 ease-[var(--ease-out)] ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 block h-px w-6 bg-white transition-transform duration-500 ease-[var(--ease-out)] ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </span>
        </button>
      </Container>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-px overflow-hidden">
        <div ref={progress} className="h-full w-full origin-left scale-x-0 bg-accent" />
      </div>
    </header>

      {/* mobile menu */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`fixed inset-0 z-40 flex h-[100dvh] flex-col justify-between bg-[#0a0a0a] px-6 pb-10 pt-28 transition-[opacity,visibility] duration-500 md:hidden ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <nav aria-label="Menu">
          <ul className="flex flex-col gap-2">
            {NAV.map((n, i) => (
              <li key={n.id} className="overflow-hidden">
                <a
                  ref={i === 0 ? firstLink : undefined}
                  href={`#${n.id}`}
                  aria-current={active === n.id ? 'location' : undefined}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${120 + i * 60}ms` : '0ms' }}
                  className={`heading text-gradient block py-1 text-[clamp(3rem,15vw,4.5rem)] transition-[transform,opacity] duration-700 ease-[var(--ease-out)] ${
                    open ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                  }`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex flex-col gap-4">
          <a href={`mailto:${SITE.email}`} className="text-gray-300 underline-offset-4 hover:underline">
            {SITE.email}
          </a>
          <div className="flex gap-3">
            <Pill variant="primary" href={SITE.cv} download="Yoav-Dory-CV.pdf">
              Download CV
            </Pill>
          </div>
        </div>
      </div>
    </>
  )
}
