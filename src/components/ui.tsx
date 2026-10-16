import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react'

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-3.5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 12 12 4M5.5 4H12v6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

type PillProps = AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: 'primary' | 'secondary'; children: ReactNode; arrow?: boolean }

/** Pill button. Primary: accent fill with black text. Secondary: thin border that fills on hover. */
export function Pill({ variant = 'secondary', arrow = true, className = '', children, ...rest }: PillProps) {
  const base =
    'group inline-flex min-h-11 items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-medium tracking-tight transition-[background-color,color,border-color] duration-300 ease-[var(--ease-out)]'
  const look =
    variant === 'primary'
      ? 'bg-accent text-black hover:bg-accent-hover'
      : 'border border-white/25 text-white hover:border-accent hover:bg-accent hover:text-black'
  const external = rest.href?.startsWith('http')
  return (
    <a className={`${base} ${look} ${className}`} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
      {children}
      {arrow && <Arrow className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </a>
  )
}

/** Small mono label: 10-12px, uppercase, widest tracking. */
export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`label text-gray-400 ${className}`}>{children}</p>
}

/** Accent word inside a heading: light italic serif, lowercase. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="accent-word">{children}</em>
}

/**
 * Heading revealed line by line. Every line gets its own overflow-hidden mask and the gradient fill.
 * Pass lines as nodes: ['Things I have', <Accent>built</Accent>].
 */
export function Lines({
  as: Tag = 'h2',
  lines,
  className = '',
  id,
  style,
  scrub = false,
}: {
  as?: 'h1' | 'h2' | 'h3'
  lines: ReactNode[]
  className?: string
  id?: string
  style?: CSSProperties
  /** Roll the lines up into their masks with scroll instead of a one-shot drift. */
  scrub?: boolean
}) {
  return (
    <Tag id={id} data-reveal-lines={scrub ? 'scrub' : ''} className={`heading ${className}`} style={style}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <span data-line className="text-gradient">
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}

/** Horizontal page container: px-6 on phones, px-16 from 768px, max-w-7xl. */
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-6 md:px-16 ${className}`}>{children}</div>
}
