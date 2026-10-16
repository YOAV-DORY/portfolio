import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Registered once, in the browser only (the prerender runs this module in Node).
if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }

/** Media conditions shared by every gsap.matchMedia call. */
export const MEDIA = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(prefers-reduced-motion: no-preference) and (min-width: 768px)',
  fine: '(prefers-reduced-motion: no-preference) and (pointer: fine)',
} as const

export type MediaConditions = { motion: boolean; desktop: boolean; fine: boolean }

/** Defaults of the reveal system: duration .8, power3.out, start at 96% of the viewport (as it enters), play once. */
export const REVEAL = { duration: 0.8, ease: 'power3.out', start: 'top 96%' } as const
