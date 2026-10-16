// Architecture diagrams (image kind 2: designed mockups), drawn as SVG from each repo's real structure:
// PermissionGuard's README architecture and package layout, glassbox's src/credit_risk + api + web,
// EastWire's backend modules (ingest, core, api), workflows and hosting. Labels name real files/modules.

type Box = { x: number; y: number; w: number; h: number; title: string; lines?: string[]; strong?: boolean }

function Node({ x, y, w, h, title, lines = [], strong }: Box) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="10"
        fill={strong ? 'color-mix(in oklab, var(--tint) 14%, #0b0b0c)' : '#0e0e10'}
        stroke={strong ? 'var(--tint)' : 'rgb(255 255 255 / 0.16)'}
      />
      <text x={x + 14} y={y + 24} fill="#fff" fontSize="13" fontWeight="700" fontFamily="var(--font-sans)">
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={l} x={x + 14} y={y + 44 + i * 17} fill="#9ca3af" fontSize="11" fontFamily="var(--font-mono)">
          {l}
        </text>
      ))}
    </g>
  )
}

function Edge({ d, label, lx, ly, m }: { d: string; label?: string; lx?: number; ly?: number; m: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke="var(--tint)" strokeOpacity="0.75" strokeWidth="1.5" className="flow" markerEnd={`url(#${m})`} />
      {label && (
        <text x={lx} y={ly} fill="var(--tint)" fontSize="10.5" fontFamily="var(--font-mono)" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  )
}

// Each diagram gets its own marker id: the marker's fill resolves --tint inside its own section.
const defs = (id: string) => (
  <defs>
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 10 5 0 10z" fill="var(--tint)" />
    </marker>
  </defs>
)

export function Diagram({ name, title }: { name: 'permissionguard' | 'glassbox' | 'eastwire'; title: string }) {
  return (
    <svg viewBox="0 0 640 400" role="img" aria-label={title} className="h-auto w-full">
      {defs(`arrow-${name}`)}
      <rect width="640" height="400" fill="#08080a" />
      {name === 'permissionguard' && <PermissionGuard m={`arrow-${name}`} />}
      {name === 'glassbox' && <Glassbox m={`arrow-${name}`} />}
      {name === 'eastwire' && <EastWire m={`arrow-${name}`} />}
    </svg>
  )
}

function PermissionGuard({ m }: { m: string }) {
  return (
    <>
      <Node x={24} y={40} w={150} h={98} title="Front ends" lines={['demo.py', 'demo_injection.py', 'mcp_server.py']} />
      <Node x={236} y={24} w={176} h={226} title="guard.handle()" strong lines={['1 policy.evaluate', '  allow | deny | ask', '2 approval.py', '  human: y / n / session', '3 audit (write-ahead)', '4 run, then log outcome', '', 'fails closed on any error']} />
      <Node x={466} y={40} w={150} h={116} title="tools.py" lines={['read_file', 'write_file', 'delete_file', 'run_command']} />
      <Node x={466} y={212} w={150} h={82} title="audit.py" lines={['hash-chained JSONL', 'verify / --sandbox']} />
      <Node x={236} y={290} w={176} h={86} title="policy.yaml" lines={['sandbox_root', 'allowlist-first commands']} />
      <Node x={24} y={212} w={150} h={82} title="Human" lines={['approves in CLI', 'or MCP elicitation']} />
      <Edge m={m} d="M174 88 H232" label="request" lx={203} ly={80} />
      <Edge m={m} d="M412 98 H462" label="allowed" lx={437} ly={90} />
      <Edge m={m} d="M412 222 C440 222 440 252 462 252" />
      <Edge m={m} d="M324 290 V254" />
      <Edge m={m} d="M232 220 C200 220 200 252 178 252" label="ask" lx={205} ly={210} />
    </>
  )
}

function Glassbox({ m }: { m: string }) {
  return (
    <>
      <Node x={20} y={30} w={170} h={80} title="Home Credit data" lines={['307,511 applications', 'public, Kaggle']} />
      <Node x={20} y={150} w={170} h={80} title="features.py" lines={['15 fields + 5 ratios', 'inside the pipeline']} />
      <Node x={235} y={30} w={170} h={80} title="LightGBM → p(default)" strong lines={['monotone constraints', 'test ROC-AUC 0.763']} />
      <Node x={235} y={150} w={170} h={80} title="explain.py · SHAP" lines={['reason codes', 'per request']} />
      <Node x={450} y={30} w={170} h={80} title="decision.py" strong lines={['p < m / (m + lgd)', 'cut-off 14.3%']} />
      <Node x={450} y={150} w={170} h={80} title="fairness.py" lines={['gaps by gender, age', 'descriptive audit']} />
      <Node x={130} y={290} w={170} h={86} title="FastAPI · api/" lines={['POST /predict', 'POST /portfolio/simulate']} />
      <Node x={345} y={290} w={170} h={86} title="React · web/" lines={['decision desk', 'portfolio simulator']} />
      <Edge m={m} d="M105 110 V146" />
      <Edge m={m} d="M190 190 C212 190 212 70 231 70" />
      <Edge m={m} d="M320 110 V146" />
      <Edge m={m} d="M405 70 H446" />
      <Edge m={m} d="M535 110 V146" />
      <Edge m={m} d="M320 230 C320 260 215 260 215 286" />
      <Edge m={m} d="M535 230 C535 260 300 250 300 286" />
      <Edge m={m} d="M300 333 H341" label="JSON" lx={321} ly={325} />
    </>
  )
}

function EastWire({ m }: { m: string }) {
  return (
    <>
      <Node x={20} y={24} w={176} h={100} title="Sources" lines={['GDELT GKG files', 'Global Voices', 'Bluesky newsrooms']} />
      <Node x={232} y={24} w={176} h={100} title="ingest (Java 21)" strong lines={['GitHub Actions, hourly', 'domain allowlist', 'city + sector rules']} />
      <Node x={444} y={24} w={176} h={100} title="PostgreSQL" lines={['Neon free tier', 'Flyway migrations']} />
      <Node x={444} y={168} w={176} h={100} title="api (Spring Boot)" strong lines={['Render free tier', 'DisplayPolicy on', 'every read']} />
      <Node x={232} y={168} w={176} h={100} title="React + TypeScript" lines={['Cloudflare Pages', 'search, sectors, map']} />
      <Node x={20} y={168} w={176} h={100} title="Reader" lines={['English, any device', 'every source credited']} />
      <Node x={232} y={300} w={176} h={76} title="config/*.yaml" lines={['sources, domains,', 'sectors, cities']} />
      <Edge m={m} d="M196 74 H228" />
      <Edge m={m} d="M408 74 H440" label="write" lx={424} ly={66} />
      <Edge m={m} d="M532 124 V164" label="read-only" lx={572} ly={148} />
      <Edge m={m} d="M444 218 H412" label="JSON" lx={428} ly={210} />
      <Edge m={m} d="M232 218 H200" />
      <Edge m={m} d="M320 300 V272" />
      <Edge m={m} d="M380 300 C380 140 360 140 340 128" />
    </>
  )
}

/* ------------------------------------------------------------------ phone versions
   A 640-wide diagram squeezed into a phone is unreadable, so phones get the same facts as a vertical
   flow: one box per step, 13px text at 1:1 scale, an arrow (with its label) between steps. */

type Step = { title: string; lines: string[]; strong?: boolean; edge?: string }

const VERTICAL: Record<'permissionguard' | 'glassbox' | 'eastwire', Step[]> = {
  permissionguard: [
    { title: 'Front ends', lines: ['demo.py · demo_injection.py', 'mcp_server.py'], edge: 'request' },
    { title: 'guard.handle()', strong: true, lines: ['1 policy.evaluate: allow | deny | ask', '2 ask: a human approves in the CLI', '  or through MCP elicitation', 'fails closed on any error'], edge: 'decision logged first' },
    { title: 'audit.py', lines: ['hash-chained JSONL', 'verify / --sandbox'], edge: 'then, if allowed' },
    { title: 'tools.py', lines: ['read_file · write_file', 'delete_file · run_command'] },
    { title: 'policy.yaml (read by the guard)', lines: ['sandbox_root', 'allowlist-first commands'] },
  ],
  glassbox: [
    { title: 'Home Credit data', lines: ['307,511 applications', 'public, Kaggle'] },
    { title: 'features.py', lines: ['15 fields + 5 ratios', 'inside the pipeline'] },
    { title: 'LightGBM', strong: true, lines: ['monotone constraints', 'test ROC-AUC 0.763'], edge: 'p(default)' },
    { title: 'explain.py · SHAP', lines: ['reason codes per request'] },
    { title: 'decision.py', strong: true, lines: ['approve if p < m / (m + lgd)', 'cut-off 14.3%'] },
    { title: 'fairness.py', lines: ['gaps by gender and age', 'descriptive audit'] },
    { title: 'FastAPI · api/', lines: ['POST /predict', 'POST /portfolio/simulate'], edge: 'JSON' },
    { title: 'React · web/', lines: ['decision desk', 'portfolio simulator'] },
  ],
  eastwire: [
    { title: 'Sources', lines: ['GDELT GKG files', 'Global Voices · Bluesky newsrooms'] },
    { title: 'ingest (Java 21)', strong: true, lines: ['GitHub Actions, hourly', 'domain allowlist', 'city + sector rules (config/*.yaml)'], edge: 'write' },
    { title: 'PostgreSQL', lines: ['Neon free tier', 'Flyway migrations'], edge: 'read-only' },
    { title: 'api (Spring Boot)', strong: true, lines: ['Render free tier', 'DisplayPolicy on every read'], edge: 'JSON' },
    { title: 'React + TypeScript', lines: ['Cloudflare Pages', 'search, sectors, map'] },
    { title: 'Reader', lines: ['English, any device', 'every source credited'] },
  ],
}

function VerticalDiagram({ name, title }: { name: keyof typeof VERTICAL; title: string }) {
  const W = 340
  const GAP = 34
  const id = `arrow-v-${name}`
  const placed: Array<Step & { y: number; h: number }> = []
  for (const s of VERTICAL[name]) {
    const prev = placed[placed.length - 1]
    placed.push({ ...s, y: prev ? prev.y + prev.h + GAP : 12, h: 34 + s.lines.length * 18 })
  }
  const last = placed[placed.length - 1]
  const H = last.y + last.h + 12
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full">
      {defs(id)}
      <rect width={W} height={H} fill="#08080a" />
      {placed.map((s, i) => (
        <g key={s.title}>
          <rect x={12} y={s.y} width={W - 24} height={s.h} rx="10" fill={s.strong ? 'color-mix(in oklab, var(--tint) 14%, #0b0b0c)' : '#0e0e10'} stroke={s.strong ? 'var(--tint)' : 'rgb(255 255 255 / 0.16)'} />
          <text x={26} y={s.y + 24} fill="#fff" fontSize="14" fontWeight="700" fontFamily="var(--font-sans)">
            {s.title}
          </text>
          {s.lines.map((l, k) => (
            <text key={k} x={26} y={s.y + 44 + k * 18} fill="#a1a1aa" fontSize="12.5" fontFamily="var(--font-mono)" xmlSpace="preserve">
              {l}
            </text>
          ))}
          {i < placed.length - 1 && (
            <g>
              <path d={`M${W / 2} ${s.y + s.h + 2} V${s.y + s.h + GAP - 4}`} stroke="var(--tint)" strokeOpacity="0.75" strokeWidth="1.5" markerEnd={`url(#${id})`} />
              {s.edge && (
                <text x={W / 2 + 10} y={s.y + s.h + GAP / 2 + 4} fill="var(--tint)" fontSize="12" fontFamily="var(--font-mono)">
                  {s.edge}
                </text>
              )}
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}

/** The horizontal diagram from 768px up, the vertical one below (only one is ever displayed). */
export function ResponsiveDiagram({ name, title }: { name: keyof typeof VERTICAL; title: string }) {
  return (
    <>
      <div className="hidden w-full md:block">
        <Diagram name={name} title={title} />
      </div>
      <div className="w-full md:hidden">
        <VerticalDiagram name={name} title={title} />
      </div>
    </>
  )
}
