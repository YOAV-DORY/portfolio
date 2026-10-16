// Everything a visitor reads lives here. Facts come from Yoav's CV ("CV - Yoav Dory.pdf", 13 Oct 2026)
// and from each project's README; nothing is invented. Open items are marked [PLACEHOLDER].

export const SITE = {
  name: 'Yoav Dory',
  title: 'Yoav Dory - Portfolio',
  cv: '/cv.pdf',
  email: 'yoavdory5@gmail.com', // on the CV
  github: 'https://github.com/YOAV-DORY',
  linkedin: 'https://www.linkedin.com/in/yoav-dory', // on the CV as linkedin.com/in/yoav-dory
  status: 'Open to student roles',
}

/** Optional sections. The game is off for v1: the CV and the projects are the point. */
export const FEATURES = {
  play: false,
}

export const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'cv', label: 'CV' },
  { id: 'projects', label: 'Projects' },
  ...(FEATURES.play ? [{ id: 'play', label: 'Play' }] : []),
  { id: 'contact', label: 'Contact' },
]

/** About card. Segments marked bold are the key phrases (they light up first in the scroll reveal). */
export const ABOUT: Array<{ text: string; bold?: boolean }> = [
  { text: "I'm a " },
  { text: 'second-year Computer Science & Entrepreneurship student', bold: true },
  { text: ' at Reichman University with a ' },
  { text: 'GPA of 92', bold: true },
  { text: ', on a combined track that builds technical depth alongside product-oriented thinking. Before university I served as a ' },
  { text: 'Combat ICT Officer in the IDF Paratroopers Brigade', bold: true },
  { text: ', where I ' },
  { text: 'led a team of 23', bold: true },
  { text: ' and ' },
  { text: 'delivered 10+ end-to-end technology projects', bold: true },
  { text: " with Israel's top defense firms, from first requirement to operational deployment. During deployment I was the senior-ranking ICT officer in the brigade, keeping systems and connectivity up around the clock. Today I serve in the reserves as a " },
  { text: 'Combat ICT Officer (Captain) in a commando unit', bold: true },
  { text: ', and I ' },
  { text: 'build AI and security tools', bold: true },
  { text: ': a permission layer for AI assistants, a credit-risk model you can see inside, and a news map for Asia. I am looking for a ' },
  { text: 'student developer or product role', bold: true },
  { text: '.' },
]

export const LANGUAGES = 'Hebrew (native) · English (fluent)'

export type Entry = { role: string; org: string; dates?: string; bullets: string[] }
/** highlights: the one or two lines a skimming reader sees on the row itself, without opening it. */
export type Track = { title: string; summary: string; highlights: string[]; entries: Entry[] }

export const TRACKS: Track[] = [
  {
    title: 'Military service',
    summary: 'IDF · Combat ICT Officer, now Captain in the reserves',
    highlights: ['Led a team of 23 and delivered 10+ end-to-end projects with defense-tech companies', 'Senior-ranking ICT officer in the brigade during deployment'],
    entries: [
      {
        role: 'Combat ICT Officer',
        org: 'IDF Paratroopers Brigade',
        dates: '2021–2024',
        bullets: [
          'Managed 10+ end-to-end technology projects from initiation to operational deployment, with leading defense-tech companies.',
          'Led a multidisciplinary team of 23 (3 commanders, 20 soldiers): helpdesk, logistics and ICT infrastructure under pressure.',
          'Architected and delivered computing infrastructure and communication networks from complex operational requirements.',
          'Senior-ranking ICT officer in the brigade during deployment, responsible for 24/7 reliability and connectivity.',
        ],
      },
      {
        role: 'Combat ICT Reserves Officer (Captain)',
        org: 'Commando Unit',
        // [PLACEHOLDER: reserve service start date — not on the CV]
        bullets: [
          'Leading a specialized technical team of 20 (5 commanders, 15 soldiers) running mission-critical ICT operations.',
          'Working with elite military technology units to field advanced communication systems and specialized combat tools.',
          'Overseeing the integration of new technologies, keeping systems ready and adaptable as conditions change.',
        ],
      },
    ],
  },
  {
    title: 'Education',
    summary: 'B.Sc. Computer Science & Entrepreneurship · Reichman University',
    highlights: ['GPA 92 after the first year', 'Combined CS and Entrepreneurship track, 2025–2028'],
    entries: [
      {
        role: 'B.Sc. in Computer Science & Entrepreneurship',
        org: 'Reichman University',
        dates: '2025–2028',
        bullets: [
          'GPA 92 after the first year.',
          'Combined CS and Entrepreneurship track: technical depth alongside product-oriented thinking.',
          'Relevant coursework: Data Structures, Logic, Linux and C Programming, Java, Calculus and Linear Algebra.',
          'Psychometric score: 713.',
        ],
      },
    ],
  },
  {
    title: 'Volunteering',
    summary: 'Youth movement counselor · Givat Shmuel',
    highlights: ['Led group activities and mentored teenagers, 2016–2018'],
    entries: [
      {
        role: 'Youth Movement Counselor',
        org: 'Givat Shmuel',
        dates: '2016–2018',
        bullets: [
          'Led group activities and mentored teenagers.',
          'Organized educational and social programs for a local youth movement chapter.',
        ],
      },
    ],
  },
]

export const SKILLS: Array<{ label: string; items: string[]; seconds: number; reverse?: boolean }> = [
  { label: 'Languages', items: ['Python', 'Java', 'C', 'C++', 'SQL', 'TypeScript'], seconds: 44 },
  { label: 'Backend & ML', items: ['FastAPI', 'REST APIs', 'scikit-learn', 'LightGBM', 'SHAP', 'pandas'], seconds: 52, reverse: true },
  {
    label: 'Frontend & tools',
    items: ['React', 'Git', 'GitHub Actions', 'Docker', 'pytest', 'Linux', 'Claude Code', 'Cursor', 'MCP', 'LLM APIs', 'OOP', 'Data structures', 'Algorithms'],
    seconds: 55,
  },
]
