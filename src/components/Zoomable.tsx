import { useEffect, useRef, useState, type ReactNode } from 'react'

type Img = { src: string; alt: string; width: number; height: number }

/**
 * Full-size view for evidence that is unreadable at phone width. A native <dialog> shows the image
 * at a readable width (at least 1100px, so a phone pans across it): Esc and the Close button close
 * it, focus moves into it and back to the trigger afterwards, and the page behind does not scroll.
 */
function useZoom() {
  const dialog = useRef<HTMLDialogElement>(null)
  const close = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      close.current?.focus()
      document.documentElement.style.overflow = 'hidden'
    }
    if (!open && d.open) d.close()
    const onClose = () => {
      setOpen(false)
      document.documentElement.style.overflow = ''
    }
    d.addEventListener('close', onClose)
    return () => d.removeEventListener('close', onClose)
  }, [open])

  const view = ({ src, alt, width, height }: Img): ReactNode => (
    <dialog
      ref={dialog}
      aria-label={alt}
      className="m-0 h-[100dvh] max-h-none w-screen max-w-none flex-col overflow-hidden bg-[#050505]/95 p-0 text-white backdrop:bg-black/80 open:flex"
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-black/80 px-4 py-3 md:px-8">
        <p className="label truncate text-gray-400">Scroll or pan to read · Esc closes</p>
        <button
          ref={close}
          type="button"
          aria-label="Close enlarged image"
          onClick={() => setOpen(false)}
          className="label shrink-0 rounded-full border border-white/25 px-4 py-2.5 text-white hover:border-accent hover:bg-accent hover:text-black"
        >
          Close ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain p-4 md:p-8">
        {open && <img src={src} alt={alt} width={width} height={height} className="mx-auto block h-auto max-w-none rounded-xl" style={{ width: `max(min(100%, ${width}px), 1100px)` }} />}
      </div>
    </dialog>
  )
  return { open: () => setOpen(true), view }
}

/** A screenshot that opens full size on tap or click. */
export function Zoomable(img: Img) {
  const zoom = useZoom()
  return (
    <>
      <button type="button" onClick={zoom.open} className="group relative block w-full cursor-zoom-in" aria-label={`Enlarge: ${img.alt}`}>
        <img src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" decoding="async" className="block h-auto w-full" />
        <span aria-hidden="true" className="label absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1.5 !text-[10px] text-white backdrop-blur transition-colors group-hover:bg-accent group-hover:text-black">
          Enlarge
        </span>
      </button>
      {zoom.view(img)}
    </>
  )
}

/** A small "Enlarge" button over media that is not itself an image (a screen recording on a phone). */
export function EnlargeButton({ className = '', ...img }: Img & { className?: string }) {
  const zoom = useZoom()
  return (
    <>
      <button
        type="button"
        onClick={zoom.open}
        aria-label={`Enlarge: ${img.alt}`}
        className={`label absolute right-3 top-3 z-10 min-h-9 rounded-full bg-black/75 px-3 py-1.5 !text-[10px] text-white backdrop-blur ${className}`}
      >
        Enlarge
      </button>
      {zoom.view(img)}
    </>
  )
}
