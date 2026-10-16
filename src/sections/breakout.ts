// Canvas 2D Breakout whose bricks spell HELLO WORLD in a 5x7 pixel font. Lazy-loaded with the
// optional Play section (FEATURES.play). Attract mode plays itself until PLAY; then 3 lives,
// paddle on the pointer, bricks grow back a few seconds after they break.

const FONT: Record<string, string[]> = {
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
}
const WORDS = ['HELLO', 'WORLD']
const COLS = WORDS[0].length * 6 - 1 // 5 cells per letter + 1 gap
const ROWS = 7 * 2 + 2

type Brick = { x: number; y: number; alive: boolean; brokeAt: number }
export type GameState = { mode: 'attract' | 'play' | 'over'; lives: number; score: number }

export function startBreakout(canvas: HTMLCanvasElement, accent: string, onState: (s: GameState) => void) {
  const ctx = canvas.getContext('2d')!
  let w = 0, h = 0, cell = 0, ox = 0, oy = 0
  const bricks: Brick[] = []
  WORDS.forEach((word, wi) =>
    [...word].forEach((ch, ci) =>
      FONT[ch].forEach((row, ry) =>
        [...row].forEach((bit, rx) => {
          if (bit === '1') bricks.push({ x: ci * 6 + rx, y: wi * 9 + ry, alive: true, brokeAt: 0 })
        }),
      ),
    ),
  )
  const state: GameState = { mode: 'attract', lives: 3, score: 0 }
  const ball = { x: 0, y: 0, vx: 0, vy: 0, r: 0 }
  const paddle = { x: 0, w: 0, h: 0, target: 0 }
  let raf = 0, last = 0, visible = true

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    cell = Math.min((w * 0.86) / COLS, (h * 0.5) / ROWS)
    ox = (w - cell * COLS) / 2
    oy = h * 0.08
    paddle.w = Math.max(70, w * 0.16)
    paddle.h = Math.max(8, cell * 0.6)
    ball.r = Math.max(5, cell * 0.38)
  }
  function serve() {
    ball.x = w / 2
    ball.y = h * 0.72
    const speed = Math.max(260, h * 0.75)
    const a = (-Math.PI / 2) + (Math.random() - 0.5) * 0.9
    ball.vx = Math.cos(a) * speed
    ball.vy = Math.sin(a) * speed
  }
  function step(dt: number, now: number) {
    if (state.mode === 'attract') paddle.target = ball.x
    paddle.x += (paddle.target - paddle.x) * Math.min(1, dt * 14)
    paddle.x = Math.max(paddle.w / 2, Math.min(w - paddle.w / 2, paddle.x))
    if (state.mode === 'over') return

    ball.x += ball.vx * dt
    ball.y += ball.vy * dt
    if (ball.x < ball.r || ball.x > w - ball.r) { ball.vx *= -1; ball.x = Math.max(ball.r, Math.min(w - ball.r, ball.x)) }
    if (ball.y < ball.r) { ball.vy = Math.abs(ball.vy); ball.y = ball.r }

    const py = h - paddle.h - 18
    if (ball.vy > 0 && ball.y + ball.r >= py && ball.y < py + paddle.h && Math.abs(ball.x - paddle.x) < paddle.w / 2 + ball.r) {
      const hit = (ball.x - paddle.x) / (paddle.w / 2)
      const speed = Math.hypot(ball.vx, ball.vy)
      const a = -Math.PI / 2 + hit * 1.05
      ball.vx = Math.cos(a) * speed
      ball.vy = Math.sin(a) * speed
      ball.y = py - ball.r
    }
    if (ball.y > h + ball.r * 2) {
      if (state.mode === 'play') {
        state.lives--
        if (state.lives <= 0) state.mode = 'over'
        onState({ ...state })
      }
      serve()
    }
    for (const b of bricks) {
      if (!b.alive) {
        if (now - b.brokeAt > 7000) b.alive = true
        continue
      }
      const bx = ox + b.x * cell, by = oy + b.y * cell
      if (ball.x + ball.r > bx && ball.x - ball.r < bx + cell && ball.y + ball.r > by && ball.y - ball.r < by + cell) {
        b.alive = false
        b.brokeAt = now
        const overlapX = Math.min(ball.x + ball.r - bx, bx + cell - (ball.x - ball.r))
        const overlapY = Math.min(ball.y + ball.r - by, by + cell - (ball.y - ball.r))
        if (overlapX < overlapY) ball.vx *= -1
        else ball.vy *= -1
        if (state.mode === 'play') { state.score++; onState({ ...state }) }
        break
      }
    }
  }
  function draw() {
    ctx.clearRect(0, 0, w, h)
    for (const b of bricks) {
      if (!b.alive) continue
      ctx.fillStyle = accent
      ctx.fillRect(ox + b.x * cell + 1, oy + b.y * cell + 1, cell - 2, cell - 2)
    }
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    ctx.fill()
    const py = h - paddle.h - 18
    ctx.fillStyle = state.mode === 'attract' ? 'rgba(255,255,255,.45)' : '#ffffff'
    ctx.beginPath()
    ctx.roundRect(paddle.x - paddle.w / 2, py, paddle.w, paddle.h, paddle.h / 2)
    ctx.fill()
  }
  function frame(t: number) {
    raf = 0
    const dt = Math.min(0.033, (t - (last || t)) / 1000)
    last = t
    step(dt, t)
    draw()
    if (visible && !document.hidden) raf = requestAnimationFrame(frame)
  }
  const resume = () => {
    if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame) }
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; resume() })
  io.observe(canvas)
  const ro = new ResizeObserver(() => { layout(); draw() })
  ro.observe(canvas)
  const onMove = (e: PointerEvent) => {
    if (state.mode !== 'play') return
    const r = canvas.getBoundingClientRect()
    paddle.target = e.clientX - r.left
  }
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onMove)
  document.addEventListener('visibilitychange', resume)

  layout()
  paddle.x = paddle.target = w / 2
  serve()
  resume()

  return {
    play() {
      state.mode = 'play'
      state.lives = 3
      state.score = 0
      bricks.forEach((b) => (b.alive = true))
      serve()
      onState({ ...state })
      resume()
    },
    destroy() {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onMove)
      document.removeEventListener('visibilitychange', resume)
    },
  }
}
