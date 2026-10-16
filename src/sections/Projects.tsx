import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { BrowserFrame, PhoneFrame, Plain, TerminalFrame } from '../components/frames'
import { Accent, Container, Label, Lines, Pill } from '../components/ui'
import { VideoSlot } from '../components/VideoSlot'
import { PROJECTS, type GalleryItem, type Media, type Project } from '../content/projects'
import { SITE } from '../content/site'
import { gsap, MEDIA, type MediaConditions } from '../motion/gsap'
import { numberFormat, playOnEnter, useReveal } from '../motion/useReveal'
import { CodeCard } from '../visuals/CodeCard'
import { Diagram } from '../visuals/Diagrams'

export function Projects() {
  const intro = useRef<HTMLDivElement>(null)
  useReveal(intro)
  return (
    <section id="projects" aria-labelledby="projects-title" className="relative">
      <div ref={intro} className="border-t border-white/10 pb-6 pt-20 md:pb-8 md:pt-28">
        <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Label className="mb-6">
              <span className="text-tag">04</span> &nbsp;/ Projects
            </Label>
            <Lines id="projects-title" lines={["Things I've", <Accent key="a">built</Accent>]} className="text-[clamp(3.25rem,11vw,9rem)]" />
          </div>
          <div data-reveal="up" className="max-w-sm space-y-6">
            <p className="text-gray-400">Three projects, each built end to end: an AI security layer, an explainable credit model and a news map. All code is public.</p>
            <Pill href={SITE.github}>All code on GitHub</Pill>
          </div>
        </Container>
      </div>
      {PROJECTS.map((p) => (
        <ProjectSection key={p.id} project={p} />
      ))}
    </section>
  )
}

function ProjectSection({ project: p }: { project: Project }) {
  const root = useRef<HTMLElement>(null)
  useReveal(root)
  useBeat(root, p.beat)
  const titleId = `${p.id}-title`

  return (
    <section
      id={p.id}
      ref={root}
      aria-labelledby={titleId}
      style={{ '--tint': p.tint, '--word': p.tint } as CSSProperties}
      className="relative isolate overflow-hidden py-16 md:py-24"
    >
      {/* Generated abstract backdrop (image kind 3): CSS gradient mesh, grid and grain in the tint. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="mesh absolute -inset-[10%] opacity-70" />
        <div className="grid-lines absolute inset-0" />
        <div className="grain absolute inset-0" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-tint/50 to-transparent" />
      </div>

      <Container>
        {/* header: title on its own full-width line, then pitch and links */}
        <p data-reveal="up" className="label mb-5 flex items-center gap-3 text-gray-400">
          <span className="text-tint">{p.number}</span>
          <span className="h-px w-10 bg-white/25" />
          Project
        </p>
        <Lines
          as="h3"
          id={titleId}
          lines={[
            <span key="t">
              {p.title[0]}
              <Accent>{p.title[1]}</Accent>
            </span>,
          ]}
          className="whitespace-nowrap"
          style={{ fontSize: titleSize(p.title.join('')) }}
        />
        <div className="mt-8 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-12 md:items-end">
          <p data-reveal="up" className="text-lg leading-relaxed text-gray-200 md:col-span-7 md:text-xl">
            {p.pitch}
          </p>
          <div data-reveal-group className="flex flex-wrap gap-3 md:col-span-5 md:justify-end">
            {p.links.map((l) => (
              <Pill key={l.href} href={l.href} variant={l.primary ? 'primary' : 'secondary'}>
                {l.label}
              </Pill>
            ))}
          </div>
        </div>

        {/* hero visual */}
        <figure className="mt-10 md:mt-14">
          <div data-beat-stage className="relative [perspective:1400px]">
            {p.beat === 'tilt' && <CountryTicker />}
            <div data-beat-frame className="relative">
              <HeroMedia media={p.hero} />
              {p.beat === 'wipe' && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <span data-sheen className="absolute inset-y-0 left-0 w-1/3 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent mix-blend-overlay" />
                </span>
              )}
            </div>
            {p.beat === 'stamp' && <Verdicts />}
          </div>
          <figcaption className="label mt-4 flex items-center gap-2 text-gray-500">
            <span className="size-1.5 rounded-full bg-tint" />
            {p.hero.kind === 'sequence' ? p.hero.caption : 'Screen recording'}
          </figcaption>
        </figure>

        {p.note && (
          <p data-reveal="up" className="mt-8 max-w-3xl rounded-2xl border border-white/10 bg-panel px-5 py-4 text-sm leading-relaxed text-gray-300">
            <span className="label mr-3 !text-[10px] text-tag">Note</span>
            {p.note}
          </p>
        )}

        {/* what it does + how it is built */}
        <div className="mt-14 grid grid-cols-1 gap-12 md:mt-20 md:grid-cols-12">
          <div className="md:col-span-7">
            <Label className="mb-6">What it does</Label>
            <ol data-reveal-group className="space-y-5">
              {p.does.map((d, i) => (
                <li key={d} className="flex gap-5 border-t border-white/10 pt-5">
                  <span className="label pt-1 text-tint">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-lg leading-relaxed text-gray-200">{d}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="md:col-span-5">
            <Label className="mb-6">How it is built</Label>
            <ul data-reveal-group data-reveal-stagger="0.05" className="flex flex-wrap gap-2.5">
              {p.stack.map((s) => (
                <li key={s} className="rounded-full border border-white/15 bg-white/[0.03] px-4 py-2 font-mono text-[12.5px] text-gray-200">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* numbers */}
        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:mt-20 lg:grid-cols-4">
          {p.numbers.map((n) => (
            <div key={n.label} className="flex flex-col-reverse justify-end gap-2 bg-[#070707] px-4 py-7 md:px-7 md:py-10">
              <dt className="text-sm leading-snug text-gray-400">{n.label}</dt>
              <dd className="heading text-gradient whitespace-nowrap text-[clamp(1.5rem,7.5vw,4rem)] tabular-nums lg:text-[clamp(2.5rem,3.6vw,3.75rem)]">
                <span data-count={n.value} data-decimals={n.decimals ?? 0}>
                  {numberFormat(n.decimals ?? 0)(n.value)}
                </span>
                {n.suffix}
              </dd>
            </div>
          ))}
        </dl>

        {/* gallery */}
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 md:mt-20 md:grid-cols-2">
          {p.gallery.map((g, i) => (
            <figure
              key={i}
              data-reveal={i % 2 ? 'right' : 'left'}
              className={`flex min-w-0 flex-col ${p.gallery.length % 2 && i === p.gallery.length - 1 ? 'md:col-span-2' : ''}`}
            >
              <GalleryVisual item={g} />
              <figcaption className="label mt-4 text-gray-500">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}

/** Title size from its length, so a short name is big and PERMISSIONguard still fits a 320px phone. */
function titleSize(title: string) {
  return `min(${(138 / title.length).toFixed(2)}vw, ${Math.min(11, 124 / title.length).toFixed(2)}rem)`
}

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
    const slot = frame(<VideoSlot src={media.src} poster={media.poster} alt={media.alt} />)
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
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur" aria-hidden="true">
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
      const [w, h] = item.size ?? [1440, 900]
      const img = <img src={item.src} alt={item.alt} width={w} height={h} loading="lazy" decoding="async" className="block h-auto w-full" />
      return item.url ? <BrowserFrame url={item.url}>{img}</BrowserFrame> : <Plain>{img}</Plain>
    }
    case 'phone':
      return (
        <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10">
          <PhoneFrame className="max-w-[250px]">
            <img src={item.src} alt={item.alt} width={780} height={1688} loading="lazy" decoding="async" className="block h-auto w-full" />
          </PhoneFrame>
        </div>
      )
    case 'diagram':
      return (
        <div className="flex flex-1 items-center overflow-hidden rounded-2xl border border-white/10 bg-[#08080a]">
          <Diagram name={item.diagram} title={item.caption} />
        </div>
      )
    case 'code':
      return <CodeCard file={item.file} lang={item.lang} code={item.code} />
  }
}

/* ------------------------------------------------------------------ beats
   Each project has its own motion beat on the hero visual:
   stamp: allow / ask / deny verdicts stamp onto the terminal (PermissionGuard)
   wipe:  the screenshot is uncovered like a pane of glass, with a light sheen (glassbox)
   tilt:  the browser tips up from a 3D angle while the four countries slide in (EastWire) */

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
          className="flex items-center gap-3 rounded-lg border-2 bg-black/85 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest shadow-xl backdrop-blur md:px-4 md:py-2 md:text-sm"
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
        const tl = gsap.timeline({ paused: true })
        tl.from(frame, { y: 60, autoAlpha: 0, duration: 0.8, ease: 'power3.out' })
        tl.from(el.querySelectorAll('[data-verdict]'), { scale: 1.9, rotate: -10, autoAlpha: 0, duration: 0.4, ease: 'back.out(2.2)', stagger: 0.18 }, 0.35)
        playOnEnter(stage, tl)
      }
      if (beat === 'wipe') {
        // Finishes while the frame is still entering, so nobody reads a half-covered screenshot.
        const scrub = { trigger: stage, start: 'top 95%', end: 'top 60%', scrub: 0.4 }
        gsap.fromTo(frame, { clipPath: 'inset(0% 100% 0% 0% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', ease: 'none', scrollTrigger: scrub })
        gsap.fromTo(el.querySelector('[data-sheen]'), { xPercent: -100 }, { xPercent: 320, ease: 'none', scrollTrigger: scrub })
      }
      if (beat === 'tilt') {
        gsap.fromTo(
          frame,
          { rotateX: desktop ? 24 : 12, scale: 0.9, y: 40, transformOrigin: '50% 100%' },
          { rotateX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: stage, start: 'top 98%', end: 'top 55%', scrub: 0.4 } },
        )
        playOnEnter(stage, gsap.from(el.querySelectorAll('[data-country]'), { x: 60, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07, paused: true }))
      }
    })
    return () => mm.revert()
  }, [scope, beat])
}
