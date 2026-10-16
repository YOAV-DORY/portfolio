// Code-snippet card (image kind 2): a verbatim excerpt from the project's repo, lightly highlighted.
// Skipped lines are shown as `...` or `# ...`, never rewritten. On phones long lines wrap with a
// hanging indent instead of scrolling sideways.

const KEYWORDS = new Set(['def', 'return', 'if', 'else', 'or', 'and', 'raise', 'import', 'from', 'class', 'for', 'in', 'not'])

function highlight(line: string, lang: string) {
  const parts: Array<{ t: string; c?: string }> = []
  if (/^\s*(#|\.\.\.$)/.test(line)) return [{ t: line, c: 'text-gray-600' }] // comments and elisions
  if (lang === 'yaml') {
    const m = line.match(/^(\s*)([\w.-]+)(:)(.*)$/)
    if (!m) return [{ t: line }]
    const value = m[4].trim()
    const tone = value === 'allow' ? 'text-[#7ee2a8]' : value === 'deny' ? 'text-[#ff6b6b]' : value === 'ask' ? 'text-[#f2c46d]' : 'text-gray-300'
    return [{ t: m[1] }, { t: m[2], c: 'text-tint' }, { t: m[3], c: 'text-gray-500' }, { t: m[4], c: tone }]
  }
  // python: strings, keywords, the rest
  const re = /("""[^"]*(?:""")?|"[^"]*"|'[^']*')|(\b\w+\b)|(\s+)|(.)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    if (m[1]) parts.push({ t: m[1], c: 'text-[#c7b98a]' })
    else if (m[2] && KEYWORDS.has(m[2])) parts.push({ t: m[2], c: 'text-tint' })
    else parts.push({ t: m[0] })
  }
  return parts
}

export function CodeCard({ file, lang, code }: { file: string; lang: string; code: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0c] shadow-[0_40px_120px_-50px_color-mix(in_oklab,var(--tint)_40%,transparent)]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-3">
        <span className="truncate font-mono text-[11px] text-gray-400">{file}</span>
        <span className="label !text-[10px] text-gray-600">{lang}</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-[1.6] text-gray-300 md:whitespace-pre md:p-5">
        <code>
          {code.split('\n').map((line, i) => (
            <span key={i} className="block min-h-[1.6em] pl-[2ch] -indent-[2ch] md:pl-0 md:indent-0">
              {highlight(line, lang).map((p, j) => (
                <span key={j} className={p.c}>
                  {p.t}
                </span>
              ))}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  )
}
