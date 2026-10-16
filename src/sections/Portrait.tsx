import { useEffect, useRef, useState } from 'react'
import { intro } from '../lib/intro'
import { MEDIA } from '../motion/gsap'
import { createTiles, initialsSource, type Tiles } from '../webgl/tiles'

const PHOTO = '/assets/yoav.webp'

const RESOLVE_AFTER = 2000 // ms after the intro ends (or after load, when there is no intro)

/**
 * Hero portrait. The prerendered HTML shows the static cut-out; in the browser (motion allowed,
 * WebGL2 available) a tile canvas takes over for the intro, then resolves back to the full photo
 * 2 s after the intro ends, on every device. After that the pointer still scatters tiles around it,
 * as an extra. If WebGL fails the static image simply stays; if the photo itself fails, tiles are
 * built from the initials "YD" instead (and stay, since there is no photo to resolve to).
 */
export function Portrait({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'static' | 'webgl' | 'initials'>('static')
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !window.matchMedia(MEDIA.motion).matches) return
    let tiles: Tiles | null = null
    let cancelled = false
    const fine = window.matchMedia('(min-width: 768px)').matches
    const start = (source: CanvasImageSource & { width: number; height: number }, initials: boolean) => {
      if (cancelled) return
      tiles = createTiles(canvas, {
        source,
        cols: fine ? 112 : 84, // ~9.6k / ~5.4k visible tiles after the transparent wall is skipped
        assembled: intro.tilesCued(),
        onFail: () => setMode('static'),
      })
      if (!tiles) return // no WebGL2: keep the static image
      setMode(initials ? 'initials' : 'webgl')
      if (intro.tilesCued()) tiles.flyHome()
      if (initials) return
      const scheduleResolve = () => {
        timer = window.setTimeout(() => {
          tiles?.resolve()
          setResolved(true)
        }, RESOLVE_AFTER)
      }
      if (intro.isDone()) scheduleResolve()
      else offDone = intro.on('done', scheduleResolve)
    }
    let timer = 0
    let offDone = () => {}
    const img = new Image()
    img.decoding = 'async'
    img.src = PHOTO
    img
      .decode()
      .then(() => start(img, false))
      .catch(() => start(initialsSource(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e8e4dc'), true))
    const off = intro.on('tiles', () => tiles?.flyHome())
    return () => {
      cancelled = true
      off()
      offDone()
      window.clearTimeout(timer)
      tiles?.destroy()
    }
  }, [])

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      {/* The static cut-out: the reduced-motion and no-WebGL view, and what the prerendered page shows. */}
      <img
        src={PHOTO}
        alt="Portrait of Yoav Dory"
        width={800}
        height={800}
        fetchPriority="high"
        className="portrait-static absolute inset-0 size-full object-contain transition-opacity duration-[1200ms] ease-out"
        style={mode === 'static' || resolved ? undefined : { opacity: 0 }}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
      {mode === 'initials' && <span className="sr-only">Initials YD (the portrait photo could not be loaded)</span>}
    </div>
  )
}
