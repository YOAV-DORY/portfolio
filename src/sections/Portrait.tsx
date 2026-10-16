import { useEffect, useRef, useState } from 'react'
import { intro } from '../lib/intro'
import { MEDIA } from '../motion/gsap'
import { createTiles, initialsSource, type Tiles } from '../webgl/tiles'

const PHOTO = '/assets/yoav.webp'

/**
 * Hero portrait. The prerendered HTML shows the static cut-out; in the browser (motion allowed,
 * WebGL2 available) a tile canvas takes over. If WebGL fails the static image simply stays; if the
 * photo itself fails, tiles are built from the initials "YD" instead.
 */
export function Portrait({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<'static' | 'webgl' | 'initials'>('static')

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
    }
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
        className="portrait-static absolute inset-0 size-full object-contain transition-opacity duration-700"
        style={mode === 'static' ? undefined : { opacity: 0 }}
      />
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
      {mode === 'initials' && <span className="sr-only">Initials YD (the portrait photo could not be loaded)</span>}
    </div>
  )
}
