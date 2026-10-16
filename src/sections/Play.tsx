import { useEffect, useRef, useState } from 'react'
import { Accent, Container, Label, Lines } from '../components/ui'
import { useReveal } from '../motion/useReveal'
import type { GameState } from './breakout'

/** Optional section behind FEATURES.play (off for v1). The game code loads only when it scrolls near. */
export default function Play() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const game = useRef<{ play(): void; destroy(): void } | null>(null)
  const [state, setState] = useState<GameState>({ mode: 'attract', lives: 3, score: 0 })
  useReveal(root)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    let cancelled = false
    const io = new IntersectionObserver(
      async ([e]) => {
        if (!e.isIntersecting || game.current) return
        io.disconnect()
        const { startBreakout } = await import('./breakout')
        if (cancelled) return
        const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e8e4dc'
        game.current = startBreakout(el, accent, setState)
      },
      { rootMargin: '300px 0px' },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
      game.current?.destroy()
    }
  }, [])

  return (
    <section id="play" ref={root} aria-labelledby="play-title" className="border-t border-white/10 py-24 md:py-36">
      <Container>
        <Label className="mb-6">Play</Label>
        <Lines id="play-title" lines={['Hello', <Accent key="a">world</Accent>]} className="text-[clamp(3.25rem,11vw,9rem)]" />
        <div className="relative mt-12 aspect-[5/6] overflow-hidden rounded-3xl border border-white/10 bg-black sm:aspect-[4/3] lg:aspect-[16/9]">
          <canvas ref={canvas} className="size-full touch-none" aria-label="Breakout game: bricks spell HELLO WORLD" />
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-5">
            <p className="label text-gray-400" aria-live="polite">
              {state.mode === 'attract' ? 'Demo' : state.mode === 'over' ? `Game over · ${state.score}` : `Lives ${state.lives} · ${state.score}`}
            </p>
            {state.mode !== 'play' && (
              <button type="button" onClick={() => game.current?.play()} className="label rounded-full bg-accent px-5 py-2.5 text-black">
                {state.mode === 'over' ? 'Again' : 'Play'}
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500">Bricks grow back after a few seconds. Three lives.</p>
      </Container>
    </section>
  )
}
