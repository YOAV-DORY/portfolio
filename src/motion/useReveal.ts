import { useLayoutEffect, type RefObject } from 'react'
import { gsap, MEDIA, REVEAL, ScrollTrigger, type MediaConditions } from './gsap'

/**
 * The reveal system. Scoped to one section: finds data attributes inside `scope` and animates them.
 * Nothing is ever hidden: content is fully visible from first paint and the reveals only add a short
 * drift into place, so a fast scroller always sees real text, images and numbers.
 *
 *   data-reveal="up|down|left|right|scale|fade"  drifts in from y 16 / x ±20 / scale .97 (fade: none)
 *   data-reveal-delay="0.2"                      extra delay in seconds
 *   data-reveal-group                            children drift in from y 12, stagger .04 (data-reveal-stagger)
 *   data-reveal-lines                            each [data-line] drifts up from yPercent 18
 *   data-parallax-frame > data-parallax          image drifts yPercent -6 to 6 with scroll (scrub)
 *   data-parallax="top"                          same travel, anchored at the top: yPercent 0 to -12
 *   data-magnetic=".3"                           follows the pointer (fine pointers only), factor = value
 *
 * Reveals last 0.45 s and complete at once for fast scrolls and anchor jumps (see playOnEnter).
 * Everything runs inside gsap.matchMedia: nothing moves for prefers-reduced-motion, magnetic needs a
 * fine pointer. mm.revert() on unmount kills every tween, ScrollTrigger and listener created here.
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = scope.current
    if (!root) return
    const mm = gsap.matchMedia(root)
    mm.add(MEDIA, (ctx) => {
      const { motion, fine } = ctx.conditions as MediaConditions
      if (!motion) return
      const all = <T extends HTMLElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel))
      const base = { duration: REVEAL.duration, ease: REVEAL.ease, paused: true }

      for (const el of all('[data-reveal]')) {
        const tween = gsap.from(el, { ...base, ...FROM[el.dataset.reveal as Direction], delay: Number(el.dataset.revealDelay ?? 0) })
        playOnEnter(el, tween)
      }

      for (const el of all('[data-reveal-group]')) {
        const tween = gsap.from(el.children, { ...base, y: 12, stagger: Number(el.dataset.revealStagger ?? 0.04), delay: Number(el.dataset.revealDelay ?? 0) })
        playOnEnter(el, tween)
      }

      for (const el of all('[data-reveal-lines]')) {
        const tween = gsap.from(el.querySelectorAll('[data-line]'), { ...base, yPercent: 18, stagger: 0.05, delay: Number(el.dataset.revealDelay ?? 0) })
        playOnEnter(el, tween)
      }

      for (const frame of all('[data-parallax-frame]')) {
        const img = frame.querySelector<HTMLElement>('[data-parallax]')
        if (!img) continue
        const [from, to] = img.dataset.parallax === 'top' ? [0, -12] : [-6, 6]
        gsap.fromTo(
          img,
          { yPercent: from },
          { yPercent: to, ease: 'none', scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      }

      if (!fine) return
      const cleanups = all('[data-magnetic]').map((el) => magnetic(el, Number(el.dataset.magnetic) || 0.3))
      return () => cleanups.forEach((off) => off())
    })
    return () => mm.revert()
  }, [scope])
}

const FAST = 2500 // px/s: faster than this, nobody is reading, so skip straight to the final state

/**
 * Plays a paused reveal when `el` enters (top at 96% of the viewport). An element already above the
 * viewport, or reached by a fast scroll or an anchor jump, is put in its final place at once, and so
 * is anything still moving when it scrolls out of view. Must run inside a gsap context (matchMedia)
 * so it is cleaned up with it.
 */
export function playOnEnter(el: Element, tween: gsap.core.Animation, start: string = REVEAL.start) {
  if (el.getBoundingClientRect().bottom < 0) {
    tween.progress(1)
    return
  }
  ScrollTrigger.create({
    trigger: el,
    start,
    end: 'bottom top',
    onEnter: (self) => (Math.abs(self.getVelocity()) > FAST ? tween.progress(1) : tween.play()),
    onLeave: (self) => {
      tween.progress(1)
      self.kill()
    },
  })
}

type Direction = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
const FROM: Record<Direction, gsap.TweenVars> = {
  up: { y: 16 },
  down: { y: -16 },
  left: { x: -20 },
  right: { x: 20 },
  scale: { scale: 0.97 },
  fade: {},
}

export const numberFormat = (decimals: number) => {
  const f = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return (v: number) => f.format(v)
}

/** Pull an element toward the pointer while it is over it; spring back on leave. Returns a cleanup. */
export function magnetic(el: HTMLElement, factor: number) {
  const x = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })
  const y = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })
  let box: DOMRect | null = null
  const enter = () => {
    // Measure without the current offset so the pull does not feed back into itself.
    const r = el.getBoundingClientRect()
    const dx = Number(gsap.getProperty(el, 'x'))
    const dy = Number(gsap.getProperty(el, 'y'))
    box = new DOMRect(r.left - dx, r.top - dy, r.width, r.height)
  }
  const move = (e: PointerEvent) => {
    if (!box) enter()
    x((e.clientX - (box!.left + box!.width / 2)) * factor)
    y((e.clientY - (box!.top + box!.height / 2)) * factor)
  }
  const leave = () => {
    box = null
    x(0)
    y(0)
  }
  el.addEventListener('pointerenter', enter)
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', leave)
  return () => {
    el.removeEventListener('pointerenter', enter)
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', leave)
    gsap.set(el, { x: 0, y: 0 })
  }
}
