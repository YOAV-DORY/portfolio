import type { ReactNode } from 'react'

// Designed device frames (image kind 2) around real screenshots and recordings (kind 1).
// The glow is the section's tint, so every frame belongs to its project.

const glow = 'shadow-[0_40px_120px_-40px_color-mix(in_oklab,var(--tint)_45%,transparent),0_0_0_1px_rgb(255_255_255/0.08)]'
// Shown behind an image that has not arrived yet: a tinted panel, never a black hole.
const placeholder = 'bg-[linear-gradient(135deg,color-mix(in_oklab,var(--tint)_12%,#17171a),#101012)]'

export function BrowserFrame({ url, children, className = '' }: { url?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl ${placeholder} ${glow} ${className}`}>
      <div className="flex h-9 items-center gap-2 border-b border-white/[0.07] bg-[#0c0c0d] px-4">
        <i className="size-2.5 rounded-full bg-white/15" />
        <i className="size-2.5 rounded-full bg-white/15" />
        <i className="size-2.5 rounded-full bg-white/15" />
        {url && (
          <span className="mx-auto max-w-[60%] truncate rounded-md bg-white/[0.05] px-3 py-0.5 font-mono text-[11px] text-gray-400">{url}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export function TerminalFrame({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-[#07090c] ${glow} ${className}`}>
      <div className="flex h-9 items-center gap-2 border-b border-white/[0.07] bg-[#10161d] px-4">
        <i className="size-2.5 rounded-full bg-white/15" />
        <i className="size-2.5 rounded-full bg-white/15" />
        <i className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-[11px] text-gray-500">{title}</span>
      </div>
      {children}
    </div>
  )
}

export function PhoneFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[300px] rounded-[2.6rem] bg-[#111] p-2.5 ${glow} ${className}`}>
      <div className={`relative overflow-hidden rounded-[2.1rem] ${placeholder}`}>
        {children}
        <span aria-hidden="true" className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  )
}

export function Plain({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-2xl ${placeholder} ${glow} ${className}`}>{children}</div>
}
