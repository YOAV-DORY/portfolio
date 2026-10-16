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

/** Defaults of the reveal system: duration .9, power3.out, start at 88% of the viewport, play once. */
export const REVEAL = { duration: 0.9, ease: 'power3.out', start: 'top 88%' } as const
