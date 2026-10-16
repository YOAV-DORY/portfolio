import { useEffect, useRef, useState } from 'react'
import { MEDIA } from '../motion/gsap'

/**
 * Muted screen loop, filling its (positioned) frame. The poster is a real image, loaded eagerly at low
 * priority, so a video that has not loaded yet never shows a black box. The video starts with
 * preload="metadata"; it starts buffering when it comes within a screen and a half of the viewport
 * (an IntersectionObserver with a generous rootMargin, so fast or programmatic scrolling still gets
 * there in time) and plays while it is on screen. A missing or broken file leaves the poster. With
 * reduced motion it never autoplays: a play button starts it on request. Poster and video sit on the
 * frame's parallax layer; the tag and the button stay pinned to the frame.
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
    let onScreen = false
    const tryPlay = () => {
      if (onScreen && v.paused) v.play().catch(() => {}) // retried on canplay and on the next entry
    }
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        v.preload = 'auto'
        if (v.readyState === 0) v.load()
        near.disconnect()
      },
      { rootMargin: '150% 0px 150% 0px' },
    )
    const visible = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting
        if (onScreen) tryPlay()
        else v.pause()
      },
      { threshold: 0.1 },
    )
    near.observe(v)
    visible.observe(v)
    v.addEventListener('canplay', tryPlay)
    return () => {
      near.disconnect()
      visible.disconnect()
      v.removeEventListener('canplay', tryPlay)
    }
  }, [])

  return (
    <>
      <div data-parallax="top" className="absolute inset-x-0 top-0 h-[114%]">
        <img src={poster} alt={alt} width={1280} height={912} fetchPriority="low" decoding="async" className="absolute inset-0 size-full object-cover" />
        {!failed && (
          <video
            ref={video}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-0'}`}
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster}
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            onPause={() => manual && setPlaying(false)}
            onEmptied={() => setPlaying(false)}
            onError={() => setFailed(true)}
          >
            <source src={src} type="video/mp4" onError={() => setFailed(true)} />
          </video>
        )}
      </div>
      {playing && (
        <span className="label absolute bottom-3 left-3 rounded-full bg-black/75 px-2.5 py-1 !text-[10px] text-tag">● Loop</span>
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
          className="label absolute bottom-3 right-3 rounded-full border border-white/25 bg-black/75 px-4 py-2 text-white hover:border-accent"
        >
          {playing ? 'Pause' : 'Play video'}
        </button>
      )}
    </>
  )
}
