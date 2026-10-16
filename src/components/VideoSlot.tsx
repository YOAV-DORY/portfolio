import { useEffect, useRef, useState } from 'react'
import { MEDIA } from '../motion/gsap'

/**
 * Muted screen loop, filling its (positioned) frame. The poster is a real image and always renders
 * first; the video has preload="none" and only loads when it scrolls near the viewport, then plays
 * while visible. A missing or broken file leaves the poster. With reduced motion it never autoplays:
 * a play button starts it on request. Poster and video sit on the frame's parallax layer; the tag and
 * the button stay pinned to the frame.
 */
export function VideoSlot({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [manual, setManual] = useState(false)

  useEffect(() => {
    const v = video.current
    if (!v) return
    const auto = window.matchMedia(MEDIA.motion).matches
    setManual(!auto)
    if (!auto) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { rootMargin: '120px 0px', threshold: 0.15 },
    )
    io.observe(v)
    return () => io.disconnect()
  }, [])

  return (
    <>
      <div data-parallax="top" className="absolute inset-x-0 top-0 h-[114%]">
        <img src={poster} alt={alt} width={1280} height={912} loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
        {!failed && (
          <video
            ref={video}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onPause={() => manual && setPlaying(false)}
            onError={() => setFailed(true)}
          >
            <source src={src} type="video/mp4" onError={() => setFailed(true)} />
          </video>
        )}
      </div>
      {playing && (
        <span className="label absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 !text-[10px] text-tag backdrop-blur">● Loop</span>
      )}
      {manual && !failed && (
        <button
          type="button"
          onClick={() => {
            const v = video.current
            if (!v) return
            if (v.paused) v.play().catch(() => setFailed(true))
            else v.pause()
          }}
          className="label absolute bottom-3 right-3 rounded-full border border-white/25 bg-black/75 px-4 py-2 text-white backdrop-blur hover:border-accent"
        >
          {playing ? 'Pause' : 'Play video'}
        </button>
      )}
    </>
  )
}
