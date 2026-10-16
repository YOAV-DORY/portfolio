import { useSyncExternalStore } from 'react'

// Intro state shared by the hero (which runs it), the nav (which enters after it) and the portrait
// (which flies its tiles home on cue). html.intro is set by the inline script in index.html.

type Event = 'tiles' | 'done'
const listeners: Record<Event, Set<() => void>> = { tiles: new Set(), done: new Set() }
let done = typeof document === 'undefined' || !document.documentElement.classList.contains('intro')
let tilesCued = done

declare global {
  interface Window {
    __introFailsafe?: number
  }
}

export const intro = {
  isDone: () => done,
  tilesCued: () => tilesCued,
  cueTiles() {
    if (tilesCued) return
    tilesCued = true
    listeners.tiles.forEach((fn) => fn())
  },
  finish() {
    if (done) return
    done = true
    window.clearTimeout(window.__introFailsafe)
    document.documentElement.classList.remove('intro')
    try {
      sessionStorage.setItem('yd.intro', '1')
    } catch {
      /* private mode: the intro may simply play again */
    }
    intro.cueTiles()
    listeners.done.forEach((fn) => fn())
  },
  on(event: Event, fn: () => void) {
    listeners[event].add(fn)
    return () => void listeners[event].delete(fn)
  },
}

/** True once the intro has finished or was never needed. The prerender always sees true. */
export function useIntroDone() {
  return useSyncExternalStore(
    (fn) => intro.on('done', fn),
    intro.isDone,
    () => true,
  )
}
