import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registered once, in the browser only (the prerender runs this module in Node). Lag smoothing is
// off: on a busy machine GSAP would otherwise stretch slow frames and the ~3.3 s intro could take
// much longer in wall-clock time. With it off, animations follow the real clock.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
  gsap.ticker.lagSmoothing(0)
}

export { gsap, ScrollTrigger }

/** Media conditions shared by every gsap.matchMedia call. */
export const MEDIA = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(prefers-reduced-motion: no-preference) and (min-width: 768px)',
  fine: '(prefers-reduced-motion: no-preference) and (pointer: fine)',
} as const

export type MediaConditions = { motion: boolean; desktop: boolean; fine: boolean }

/** Defaults of the reveal system: a 0.45 s drift, power2.out, starting as the element enters (top at 96%). */
export const REVEAL = { duration: 0.45, ease: 'power2.out', start: 'top 96%' } as const
