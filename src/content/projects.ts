// The three project sections. Every number is checked against the repo or its README (2026-10-16):
// PermissionGuard: `pytest` run locally (537 passed, 7 xfailed), CI matrix in .github/workflows/ci.yml.
// glassbox: README results table (held-out test set on the public Home Credit data), `pytest --collect-only`.
// EastWire: config/countries.yaml, config/cities.csv (170 rows), config/domains.yaml, config/sectors.yaml.
//
// Image kinds, as labelled in the brief:
//   1 = real screenshot / screen recording of the live product or repo
//   2 = designed mockup (frames, code cards, SVG diagrams drawn from the repo's real structure)
//   3 = generated abstract visual (CSS mesh, grain, grid) — backgrounds only, never shown as a product

export type Beat = 'stamp' | 'wipe' | 'tilt'

export type Media =
  | { kind: 'video'; src: string; poster: string; alt: string; frame: 'terminal' | 'browser'; url?: string } // kind 1
  | { kind: 'sequence'; frames: Array<{ src: string; alt: string }>; frame: 'browser'; url: string; caption: string } // kind 1

export type GalleryItem =
  | { kind: 'desktop'; src: string; alt: string; url?: string; caption: string; size?: [number, number] } // kind 1 (no url = image has its own window chrome; size defaults to 1440x900)
  | { kind: 'phone'; src: string; alt: string; caption: string } // kind 1
  | { kind: 'diagram'; diagram: 'permissionguard' | 'glassbox' | 'eastwire'; caption: string } // kind 2
  | { kind: 'code'; file: string; lang: string; code: string; caption: string } // kind 2

export type Project = {
  id: string
  number: string
  title: [string, string] // [plain part, italic serif part]
  pitch: string
  tint: string
  beat: Beat
  links: Array<{ label: string; href: string; primary?: boolean }>
  note?: string
  hero: Media
  does: string[]
  stack: string[]
  numbers: Array<{ value: number; decimals?: number; suffix?: string; label: string }>
  gallery: GalleryItem[]
}

export const PROJECTS: Project[] = [
  {
    id: 'project-1',
    number: '01',
    title: ['Permission', 'guard'],
    pitch: 'A permission layer between an AI assistant and its tools: every action is allowed, denied, or put to a human.',
    tint: '#7ee2a8',
    beat: 'stamp',
    links: [
      { label: 'GitHub', href: 'https://github.com/YOAV-DORY/PermissionGuard', primary: true },
      { label: 'Threat model', href: 'https://github.com/YOAV-DORY/PermissionGuard/blob/main/THREAT_MODEL.md' },
    ],
    hero: {
      kind: 'video',
      // Replay of real CLI output captured from the repo (scripts/pg-terminal.html); only the typing is added.
      src: '/media/permissionguard/loop.mp4',
      poster: '/media/permissionguard/poster.webp',
      alt: 'Terminal: a file read is allowed, a delete asks a human, rm -rf / is denied, then pytest reports 537 passed and 7 xfailed.',
      frame: 'terminal',
    },
    does: [
      'Checks every file or shell action an assistant asks for against a YAML policy: allow, deny, or ask a human.',
      'Writes each decision to a hash-chained, tamper-evident audit log before the tool runs.',
      'Runs as an MCP server, so any MCP client gets the same policy, with approval through MCP elicitation.',
      'Ships a prompt-injection demo and a red-team test suite; attacks that still work are pinned as xfail tests.',
    ],
    stack: ['Python 3.11', 'MCP', 'YAML policy', 'pytest', 'GitHub Actions', 'Ubuntu + macOS CI'],
    numbers: [
      { value: 537, label: 'tests passing' },
      { value: 7, label: 'known attacks pinned as xfail' },
      { value: 3, label: 'front ends on one guard' },
      { value: 2, label: 'operating systems in CI' },
    ],
    gallery: [
      { kind: 'diagram', diagram: 'permissionguard', caption: 'Request flow, drawn from the repo layout' },
      {
        kind: 'code',
        file: 'permission_guard/policies/default.yaml',
        lang: 'yaml',
        code: `actions:
  # ...
  read_file:
    inside_sandbox: allow
  write_file:
    inside_sandbox: ask
  delete_file:
    inside_sandbox: ask
  run_command:
    # ...
    default: ask
# ...
commands:
  # ...
  unknown_program: deny`,
        caption: 'The default policy fails closed',
      },
      {
        kind: 'desktop',
        src: '/media/permissionguard/injection.webp',
        size: [1804, 910],
        alt: 'Terminal recording from the repo: a poisoned file tells the assistant to pipe a script to a shell and read an SSH key; the guard blocks both and the human declines the delete.',
        caption: 'Prompt-injection demo, from the repo',
      },
    ],
  },
  {
    id: 'project-2',
    number: '02',
    title: ['Glass', 'box'],
    pitch: 'A credit-risk model you can see inside: every approve or decline comes with its reasons.',
    tint: '#8fa2ff',
    beat: 'wipe',
    links: [
      { label: 'Live demo', href: 'https://glassbox-uayo.onrender.com', primary: true },
      { label: 'GitHub', href: 'https://github.com/YOAV-DORY/glassbox' },
    ],
    note: 'Student project on public data. The live demo runs a model trained on synthetic applicants, so its numbers are illustrative, never real customers. The results below come from the held-out test set of the public Home Credit data. The free server can take up to a minute to wake.',
    hero: {
      kind: 'sequence',
      frame: 'browser',
      url: 'glassbox-uayo.onrender.com',
      caption: 'Live demo · synthetic applicants, illustrative numbers',
      frames: [
        { src: '/media/glassbox/landing-hero.webp', alt: 'glassbox landing page: "See inside every credit decision", with a demo-mode banner.' },
        { src: '/media/glassbox/desk-hero.webp', alt: 'Decision desk: probability of default, approve under the 14.3% cut-off, and the factors raising and lowering risk.' },
        { src: '/media/glassbox/simulator-hero.webp', alt: 'Portfolio simulator: loss and margin sliders and the resulting approval rate, defaults and profit.' },
      ],
    },
    does: [
      'Predicts the chance an applicant defaults with LightGBM, trained on public Home Credit data.',
      'Turns risk into approve or decline with a cost-based cut-off: approve only when expected profit is positive.',
      'Explains every decision with SHAP reason codes, computed live on each request.',
      'Replays the policy in a portfolio simulator and audits the outcome by gender and age.',
    ],
    stack: ['Python', 'LightGBM', 'SHAP', 'scikit-learn', 'pandas', 'FastAPI', 'React', 'TypeScript', 'Docker', 'GitHub Actions'],
    numbers: [
      { value: 307511, label: 'public applications' },
      { value: 0.763, decimals: 3, label: 'test ROC-AUC' },
      { value: 14.3, decimals: 1, suffix: '%', label: 'cost-based cut-off' },
      { value: 53, label: 'tests' },
    ],
    gallery: [
      { kind: 'phone', src: '/media/glassbox/desk-390.webp', alt: 'Decision desk on a phone, with the demo-mode banner.', caption: 'Decision desk · 390 px' },
      { kind: 'diagram', diagram: 'glassbox', caption: 'Pipeline, drawn from src/credit_risk' },
      {
        kind: 'code',
        file: 'src/credit_risk/decision.py',
        lang: 'python',
        code: `def cost_based_threshold(lgd: float, margin: float) -> float:
    """Highest probability of default at which approving still pays off.
    ...
    """
    if lgd <= 0 or margin <= 0:
        raise ValueError("lgd and margin must be positive")
    return margin / (margin + lgd)


def decide(p_default: float, threshold: float) -> Decision:
    return "approve" if p_default < threshold else "decline"`,
        caption: 'The lending policy is two lines of maths',
      },
      { kind: 'phone', src: '/media/glassbox/simulator-390.webp', alt: 'Portfolio simulator on a phone.', caption: 'Simulator · 390 px' },
    ],
  },
  {
    id: 'project-3',
    number: '03',
    title: ['East', 'wire'],
    pitch: 'English-language news from China, India, South Korea and Japan, on a map, with every source shown.',
    tint: '#ff5f7e',
    beat: 'tilt',
    links: [
      { label: 'Live site', href: 'https://eastwire.pages.dev', primary: true },
      { label: 'GitHub', href: 'https://github.com/YOAV-DORY/eastwire' },
    ],
    note: 'Runs on free hosting: the search and filter API sleeps when idle, so the first request after a quiet spell can take a while to wake up.',
    hero: {
      kind: 'video',
      src: '/media/eastwire/loop.mp4',
      poster: '/media/eastwire/poster.webp',
      alt: 'The live EastWire site: the front page with country counts and stories, then the map with city pins across Asia.',
      frame: 'browser',
      url: 'eastwire.pages.dev',
    },
    does: [
      'Collects English-language news about four countries every hour, from sources whose terms allow it.',
      'Pins stories to cities by role: where they are about, where they are datelined, where the publisher sits.',
      'Shows every source and why it is allowed; a publisher that has not allowed reuse is simply not shown.',
      'Full-text search with phrases, exclusions and OR, plus six rule-based sector tags you can audit.',
    ],
    stack: ['Java 21', 'Spring Boot', 'PostgreSQL', 'React', 'TypeScript', 'Leaflet', 'GitHub Actions', 'Cloudflare Pages'],
    numbers: [
      { value: 4, label: 'countries covered' },
      { value: 170, label: 'cities on the map' },
      { value: 61, label: 'publisher domains reviewed (16 allowed)' },
      { value: 6, label: 'auditable sector tags' },
    ],
    gallery: [
      { kind: 'desktop', src: '/media/eastwire/map-1440.webp', alt: 'EastWire map page: city pins and clusters across Asia beside a list of stories.', url: 'eastwire.pages.dev/map', caption: 'Map · 1440 px' },
      { kind: 'phone', src: '/media/eastwire/home-390.webp', alt: 'EastWire front page on a phone: country counts and the lead story.', caption: 'Front page · 390 px' },
      { kind: 'diagram', diagram: 'eastwire', caption: 'Architecture, drawn from the repo' },
      { kind: 'desktop', src: '/media/eastwire/sources-1440.webp', alt: 'EastWire sources page: where the news comes from, with the terms checked for each source.', url: 'eastwire.pages.dev/sources', caption: 'Sources · 1440 px' },
    ],
  },
]
