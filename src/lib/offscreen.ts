// One shared IntersectionObserver that pauses infinite CSS animations (marquees, the status ping)
// while their element is off screen: it toggles .paused, which sets animation-play-state: paused.
// Anything marked data-pause-offscreen is observed by App on mount.

let io: IntersectionObserver | null = null

export function pauseOffscreen(el: Element) {
  io ??= new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('paused', !e.isIntersecting)), { rootMargin: '80px 0px' })
  io.observe(el)
  return () => io?.unobserve(el)
}
