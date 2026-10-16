import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { BrowserFrame, PhoneFrame, Plain, TerminalFrame } from '../components/frames'
import { Accent, Container, Label, Lines, Pill } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { PROJECTS, type GalleryItem, type Media, type Project } from '../content/projects'
import { SITE } from '../content/site'
import { gsap, MEDIA, ScrollTrigger, type MediaConditions } from '../motion/gsap'
import { numberFormat, playOnEnter, useReveal } from '../motion/useReveal'
import { CodeCard } from '../visuals/CodeCard'
import { ResponsiveDiagram } from '../visuals/Diagrams'
import { EnlargeButton, Zoomable } from '../components/Zoomable'

export function Projects() {
  const intro = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLElement>(null)
  useReveal(intro)
  useStack(root)
  return (
    <section id="projects" ref={root} aria-labelledby="projects-title" className="relative">
      <div ref={intro} className="border-t border-white/10 pb-2 pt-14 md:pt-20">
        <Container className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Label className="mb-4">
              <span className="text-tag">04</span> &nbsp;/ Projects
            </Label>
            <Lines id="projects-title" lines={["Things I've", <Accent key="a">built</Accent>]} className="text-[clamp(2.5rem,8vw,5.5rem)]" />
          </div>
          <div data-reveal="up" className="max-w-sm space-y-4">
            <p className="text-gray-400">Three projects, each built end to end: an AI security layer, an explainable credit model and a news map. All code is public.</p>
            <Pill href={SITE.github}>All code on GitHub</Pill>
          </div>
        </Container>
      </div>
      {PROJECTS.map((p, i) => (
        <ProjectSection key={p.id} project={p} index={i} />
      ))}
    </section>
  )
}

function ProjectSection({ project: p, index }: { project: Project; index: number }) {
  const root = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)
  useReveal(root)
  useBeat(root, p.beat)
  useStrip(root, Boolean(p.strip))
  const titleId = `${p.id}-title`
  const detailsId = `${p.id}-details`

  return (
    <section
      id={p.id}
      ref={root}
      aria-labelledby={titleId}
      data-stack
      style={{ '--tint': p.tint, '--word': p.tint, zIndex: index + 1 } as CSSProperties}
      className="relative isolate overflow-hidden bg-bg"
    >
      <div data-stack-body className="relative pb-16 pt-12 md:pb-24 md:pt-16">
      {/* Generated abstract backdrop (image kind 3): CSS gradient mesh, grid and grain in the tint. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="mesh absolute -inset-[10%] opacity-70" />
        <div className="grid-lines absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tint/50 to-transparent" />
      </div>

      <Container>
        {/* header: number, title, one-line pitch, links */}
        <p data-reveal="up" className="label mb-4 flex items-center gap-3 text-gray-400">
          <span className="text-tint">{p.number}</span>
          <span className="h-px w-10 bg-white/25" />
          Project
        </p>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end">
          <Lines
            as="h3"
            id={titleId}
            lines={[
              <span key="t">
                {p.title[0]}
                <Accent>{p.title[1]}</Accent>
              </span>,
            ]}
            scrub
            className="whitespace-nowrap text-[min(calc(140vw/var(--len)),6rem)] lg:col-span-7 lg:text-[min(calc(88vw/var(--len)),calc(76rem/var(--len)),7rem)]"
            style={{ '--len': p.title.join('').length } as CSSProperties}
          />
          <div className="space-y-4 lg:col-span-5 lg:pb-2">
            <p data-reveal="up" className="text-lg leading-snug text-gray-200">
              {p.pitch}
            </p>
            <div data-reveal-group className="flex flex-wrap gap-3">
              {p.links.map((l) => (
                <Pill key={l.href} href={l.href} variant={l.primary ? 'primary' : 'secondary'}>
                  {l.label}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* the story: product on the left, what it does and the real numbers on the right */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:mt-10 lg:grid-cols-12 lg:gap-10">
          <figure className="lg:col-span-7">
            <div data-beat-stage className="relative [perspective:1400px]">
              {p.beat === 'tilt' && <CountryTicker />}
              <div data-beat-frame className="relative">
                <HeroMedia media={p.hero} />
                {p.beat === 'wipe' && (
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <span data-sheen className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                  </span>
                )}
              </div>
              {p.beat === 'stamp' && <Verdicts />}
            </div>
            <figcaption className="label mt-3 flex items-center gap-2 text-gray-500">
              <span className="size-1.5 rounded-full bg-tint" />
              {p.hero.kind === 'sequence' ? p.hero.caption : 'Screen recording'}
            </figcaption>
          </figure>

          <div className="flex flex-col gap-7 lg:col-span-5">
            <div>
              <Label className="mb-3">What it does</Label>
              <ol data-reveal-group className="space-y-3">
                {p.does.map((d, i) => (
                  <li key={d} className="flex gap-4 border-t border-white/10 pt-3">
                    <span className="label pt-0.5 text-tint">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[15px] leading-snug text-gray-200">{d}</span>
                  </li>
                ))}
              </ol>
            </div>
            {/* Real values from the repo or README, shown as they are (no count-up). */}
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {p.numbers.map((n) => (
                <div key={n.label} className="flex flex-col-reverse justify-end gap-1 bg-[#070707] px-4 py-4">
                  <dt className="text-[13px] leading-snug text-gray-400">{n.label}</dt>
                  <dd className="heading text-gradient whitespace-nowrap text-[clamp(1.6rem,6vw,2.4rem)] tabular-nums">
                    {numberFormat(n.decimals ?? 0)(n.value)}
                    {n.suffix}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {p.note && (
          <p data-reveal="up" className="mt-6 max-w-3xl rounded-2xl border border-white/10 bg-panel px-5 py-3.5 text-sm leading-relaxed text-gray-300">
            <span className="label mr-3 !text-[10px] text-tag">Note</span>
            {p.note}
          </p>
        )}

        {/* Desktop only: the gallery as a horizontal strip, pinned and scrubbed sideways (useStrip).
            Phones keep it inside the technical details below. */}
        {p.strip && (
          <div className="mt-8 hidden lg:block">
            <Label className="mb-4">Screens, architecture and code · scroll</Label>
            <div data-strip className="strip -mx-2 px-2">
              <div data-strip-track className="flex w-max items-center gap-6 pb-2">
                {p.gallery.map((g, i) => (
                  <figure key={i} className="flex w-[min(34rem,40vw)] shrink-0 snap-start flex-col">
                    <GalleryVisual item={g} />
                    <figcaption className="label mt-3 text-gray-500">{g.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* optional: how it is built, architecture, code and more screens */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen((o) => !o)}
            className="group flex min-h-11 w-full items-center justify-between gap-4 text-left"
          >
            <span>
              <span className="label text-gray-300 group-hover:text-white">{open ? 'Hide' : 'Show'} technical details</span>
              <span className={`mt-1 block text-sm text-gray-500 ${p.strip ? 'lg:hidden' : ''}`}>Stack, architecture diagram, code from the repo and more screens</span>
              {p.strip && <span className="mt-1 hidden text-sm text-gray-500 lg:block">The stack it is built with</span>}
            </span>
            <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full border border-white/20 text-lg transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
              +
            </span>
          </button>
          <div id={detailsId} role="region" aria-label={`${p.title.join('')}: technical details`} className="expand" data-open={open}>
            <div>
              <div className="pb-2 pt-6">
                <Label className="mb-3">How it is built</Label>
                <ul className="flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <li key={s} className="rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 font-mono text-[12px] text-gray-200">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`grid grid-cols-1 gap-x-6 gap-y-8 pb-4 pt-6 md:grid-cols-2 ${p.strip ? 'lg:hidden' : ''}`}>
                {p.gallery.map((g, i) => (
                  <figure key={i} className={`flex min-w-0 flex-col ${p.gallery.length % 2 && i === p.gallery.length - 1 ? 'md:col-span-2' : ''}`}>
                    <GalleryVisual item={g} />
                    <figcaption className="label mt-3 text-gray-500">{g.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
      </div>
      {/* Shade over a project as the next one slides over it (the sticky stack). */}
      <div data-stack-shade aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 bg-black opacity-0" />
    </section>
  )
}

// Title size comes from its length (--len): a short name is big, PERMISSIONguard still fits a 320px
// phone and, from 1024px, its 7-of-12 column (capped by the max-w-7xl container, not the viewport).

/* ------------------------------------------------------------------ media */

function HeroMedia({ media }: { media: Media }) {
  // Product media sit in a 16:10 frame on a parallax layer 114% tall (data-parallax="top"), anchored
  // at the top so the product's own header stays in view, drifting up 12% with scroll. The media are
  // captured at that taller aspect (1440x1026, 1280x912), so nothing is cropped at the sides.
  const frame = (node: ReactNode) => (
    <div data-parallax-frame className="relative aspect-[16/10] overflow-hidden">
      {node}
    </div>
  )
  if (media.kind === 'video') {
    const slot = frame(
      <>
        <VideoSlot src={media.src} poster={media.poster} alt={media.alt} />
        {/* A terminal at phone width is too small to read: open its last frame (the poster) full size. */}
        {media.frame === 'terminal' && <EnlargeButton src={media.poster} alt={media.alt} width={1280} height={912} className="md:hidden" />}
      </>,
    )
    return media.frame === 'terminal' ? <TerminalFrame title="~/PermissionGuard">{slot}</TerminalFrame> : <BrowserFrame url={media.url}>{slot}</BrowserFrame>
  }
  return <BrowserFrame url={media.url}>{frame(<Sequence frames={media.frames} />)}</BrowserFrame>
}

/** Screenshot sequence: cross-fades through real screenshots while visible (motion allowed). */
function Sequence({ frames }: { frames: Array<{ src: string; alt: string }> }) {
  const [index, setIndex] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || !window.matchMedia(MEDIA.motion).matches) return
    let timer = 0
    const io = new IntersectionObserver(([e]) => {
      window.clearInterval(timer)
      if (e.isIntersecting) timer = window.setInterval(() => setIndex((i) => (i + 1) % frames.length), 3200)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      window.clearInterval(timer)
    }
  }, [frames.length])
  return (
    <>
      <div ref={root} data-parallax="top" className="sequence absolute inset-x-0 top-0 h-[114%]">
        {frames.map((f, i) => (
          <img
            key={f.src}
            src={f.src}
            alt={i === 0 ? f.alt : ''}
            aria-hidden={i === 0 ? undefined : true}
            width={1440}
            height={1026}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 size-full object-cover object-top ${i === index ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/60 px-2 py-1.5" aria-hidden="true">
        {frames.map((f, i) => (
          <span key={f.src} className={`h-[3px] rounded-full transition-all duration-500 ${i === index ? 'w-6 bg-tint' : 'w-2 bg-white/40'}`} />
        ))}
      </div>
    </>
  )
}

function GalleryVisual({ item }: { item: GalleryItem }) {
  switch (item.kind) {
    case 'desktop': {
      // Wide screenshots are unreadable at phone width, so they open full size on tap.
      const [w, h] = item.size ?? [1440, 900]
      const img = <Zoomable src={item.src} alt={item.alt} width={w} height={h} />
      return item.url ? <BrowserFrame url={item.url}>{img}</BrowserFrame> : <Plain>{img}</Plain>
    }
    case 'phone':
      return (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-6">
          <PhoneFrame className="max-w-[220px]">
            <img src={item.src} alt={item.alt} width={780} height={1688} loading="lazy" decoding="async" className="block h-auto w-full" />
          </PhoneFrame>
        </div>
      )
    case 'diagram':
      return (
        <div className="flex flex-1 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#08080a]">
          <ResponsiveDiagram name={item.diagram} title={item.caption} />
        </div>
      )
    case 'code':
      return <CodeCard file={item.file} lang={item.lang} code={item.code} />
  }
}

/* ------------------------------------------------------------------ beats
   Each project has its own motion accent on the hero visual. None of them hides anything:
   stamp: the allow / ask / deny verdicts punch in a little (PermissionGuard)
   wipe:  a band of light sweeps across the screenshot, like a pane of glass (glassbox)
   tilt:  the browser tips up from a slight 3D angle, the countries drift in (EastWire) */

function Verdicts() {
  const items = [
    ['ALLOW', '#7ee2a8', 'read_file'],
    ['ASK', '#f2c46d', 'delete_file'],
    ['DENY', '#ff6b6b', 'rm -rf /'],
  ] as const
  return (
    <ul aria-hidden="true" className="pointer-events-none absolute -bottom-6 right-3 flex flex-col items-end gap-2 md:-right-6 md:bottom-auto md:top-16">
      {items.map(([v, c, what]) => (
        <li
          key={v}
          data-verdict
          style={{ borderColor: c, color: c }}
          className="flex items-center gap-3 rounded-lg border-2 bg-black/85 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-xl md:px-4 md:py-2 md:text-sm"
        >
          {v}
          <span className="font-normal normal-case tracking-normal text-gray-300">{what}</span>
        </li>
      ))}
    </ul>
  )
}

function CountryTicker() {
  return (
    <ul aria-label="Countries covered" className="mb-5 flex flex-wrap gap-2">
      {['China', 'India', 'South Korea', 'Japan'].map((c) => (
        <li key={c} data-country className="label rounded-full border border-tint/50 px-3.5 py-2 text-tint">
          {c}
        </li>
      ))}
    </ul>
  )
}

function useBeat(scope: RefObject<HTMLElement | null>, beat: Project['beat']) {
  useLayoutEffect(() => {
    const el = scope.current
    if (!el) return
    const mm = gsap.matchMedia(el)
    mm.add(MEDIA, (ctx) => {
      const { motion, desktop } = ctx.conditions as MediaConditions
      if (!motion) return
      const stage = el.querySelector('[data-beat-stage]')!
      const frame = el.querySelector('[data-beat-frame]')!
      if (beat === 'stamp') {
        const tween = gsap.from(el.querySelectorAll('[data-verdict]'), { scale: 1.25, rotate: -6, duration: 0.35, ease: 'back.out(2.4)', stagger: 0.1, paused: true })
        playOnEnter(stage, tween)
      }
      if (beat === 'wipe') {
        const scrub = { trigger: stage, start: 'top 95%', end: 'bottom 40%', scrub: 0.4 }
        gsap.fromTo(el.querySelector('[data-sheen]'), { xPercent: -100 }, { xPercent: 320, ease: 'none', scrollTrigger: scrub })
      }
      if (beat === 'tilt') {
        gsap.fromTo(
          frame,
          { rotateX: desktop ? 12 : 6, scale: 0.96, transformOrigin: '50% 100%' },
          { rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 98%', end: 'top 60%', scrub: 0.4 } },
        )
        playOnEnter(stage, gsap.from(el.querySelectorAll('[data-country]'), { x: 14, duration: 0.4, ease: 'power2.out', stagger: 0.05, paused: true }))
      }
    })
    return () => mm.revert()
  }, [scope, beat])
}

/* ------------------------------------------------------------------ sticky project stack
   Each project is sticky with its top at (viewport height - its own height), so it scrolls normally
   until its bottom reaches the bottom of the screen, then stays while the next project (higher
   z-index, opaque) slides up over it. Meanwhile the covered one recedes a little: its body scales to
   0.96 and a black shade fades in (transform and opacity only, one scrubbed timeline per project).
   ScrollTrigger cannot measure inside stuck elements, so sticky is switched off while it refreshes. */
function useStack(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-stack]'))
    const html = document.documentElement
    const place = () => sections.forEach((s) => s.style.setProperty('--stack-top', `${Math.min(0, window.innerHeight - s.offsetHeight)}px`))
    const ro = new ResizeObserver(place)
    sections.forEach((s) => ro.observe(s))
    window.addEventListener('resize', place)
    place()
    const unstick = () => html.classList.add('no-stack')
    const restick = () => html.classList.remove('no-stack')
    ScrollTrigger.addEventListener('refreshInit', unstick)
    ScrollTrigger.addEventListener('refresh', restick)

    const mm = gsap.matchMedia(root)
    mm.add(MEDIA.motion, () => {
      sections.slice(0, -1).forEach((section, i) => {
        const body = section.querySelector('[data-stack-body]')
        const shade = section.querySelector('[data-stack-shade]')
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sections[i + 1],
            start: 'top bottom',
            end: 'top top',
            scrub: true,
            // Own compositor layers only while it moves, so scaling never repaints the section.
            onToggle: (self) => {
              const value = self.isActive ? 'transform' : ''
              ;(body as HTMLElement).style.willChange = value
              ;(shade as HTMLElement).style.willChange = self.isActive ? 'opacity' : ''
            },
            // No transform left behind: a pinned element inside (glassbox's strip) needs none.
            onLeaveBack: () => gsap.set(body, { clearProps: 'transform' }),
          },
        })
        tl.to(body, { scale: 0.96, transformOrigin: '50% 0%', ease: 'none' }, 0).to(shade, { opacity: 0.55, ease: 'none' }, 0)
      })
    })
    return () => {
      mm.revert()
      ro.disconnect()
      window.removeEventListener('resize', place)
      ScrollTrigger.removeEventListener('refreshInit', unstick)
      ScrollTrigger.removeEventListener('refresh', restick)
      restick()
    }
  }, [scope])
}

/* ------------------------------------------------------------------ horizontal strip (desktop)
   From 1024px with motion allowed, the strip pins below the header and the scroll moves its track
   sideways through the gallery (x only). Without motion it stays a normal sideways-scrolling row. */
function useStrip(scope: RefObject<HTMLElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const el = scope.current
    if (!el || !enabled) return
    const mm = gsap.matchMedia(el)
    mm.add(`${MEDIA.motion} and (min-width: 1024px)`, () => {
      const strip = el.querySelector<HTMLElement>('[data-strip]')!
      const track = strip.querySelector<HTMLElement>('[data-strip-track]')!
      strip.classList.add('is-pinned')
      const distance = () => Math.max(0, track.scrollWidth - strip.clientWidth)
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: { trigger: strip, start: 'top 96px', end: () => `+=${distance()}`, pin: true, scrub: true, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1 },
      })
      return () => strip.classList.remove('is-pinned')
    })
    return () => mm.revert()
  }, [scope, enabled])
}

