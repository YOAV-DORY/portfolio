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

/** Defaults of the reveal system: a 0.45 s drift, power2.out, starting as the element enters (top at 96%). */
export const REVEAL = { duration: 0.45, ease: 'power2.out', start: 'top 96%' } as const
