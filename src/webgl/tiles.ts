// Hand-written WebGL2 portrait: thousands of instanced tiles, each one cell of the photo.
// Tiles start as drifting dust, fly home with a staggered delay when flyHome() is called, and the
// pointer pushes them away; they return when it leaves. resolve() fades the mosaic out (the page shows
// the full-resolution photo underneath); after that only the tiles the pointer pushes stay visible. The shader is stateless (position is a pure
// function of time, seed, mouse and hover), so "returning" is just the hover amount easing back to 0.

const VERT = `#version 300 es
in vec2 aCorner;            // quad corner, -0.5..0.5
in vec2 aHome;              // tile centre in the portrait, -1..1
in vec4 aColor;             // sampled colour + alpha
in vec3 aSeed;              // random 0..1: delay, dust x, dust y
uniform float uTime;
uniform float uStart;       // time flyHome() was called; far in the future while still dust
uniform float uHover;       // 0..1, eased on the CPU
uniform float uTile;        // tile size in portrait units
uniform vec2 uMouse;        // pointer in portrait units
uniform vec2 uScale;        // portrait units -> clip space (keeps the portrait square)
out vec4 vColor;
out vec2 vCorner;
out float vPush;

void main() {
  float delay = aSeed.x * 0.85;
  float p = clamp((uTime - uStart - delay) / 1.25, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - p, 3.0);
  float a = aSeed.y * 6.2831853;
  vec2 drift = vec2(sin(uTime * 0.35 + a), cos(uTime * 0.29 + aSeed.z * 6.2831853)) * 0.07;
  vec2 dust = (vec2(aSeed.y, aSeed.z) * 2.0 - 1.0) * vec2(1.25, 1.1) + drift;
  vec2 pos = mix(dust, aHome, e);

  vec2 d = pos - uMouse;
  float dist = length(d);
  float push = (1.0 - smoothstep(0.0, 0.32, dist)) * uHover * e;   // smoothstep needs edge0 < edge1
  pos += (d / max(dist, 1e-4)) * push * 0.16;

  float size = uTile * mix(0.32, 0.9, e) * (1.0 - push * 0.55);
  gl_Position = vec4((pos + aCorner * size) * uScale, 0.0, 1.0);
  vColor = vec4(aColor.rgb * (1.0 + push * 0.5), aColor.a * mix(0.28, 1.0, e));
  vCorner = aCorner;
  vPush = push;
}`

const FRAG = `#version 300 es
precision mediump float;
in vec4 vColor;
in vec2 vCorner;
in float vPush;
uniform float uResolve;     // 0 = mosaic, 1 = resolved: only pointer-pushed tiles are drawn
                            // (fragment-only: a uniform in both stages must match precision)
out vec4 outColor;
void main() {
  // soft-edged square
  float m = 1.0 - smoothstep(0.36, 0.5, max(abs(vCorner.x), abs(vCorner.y)));
  float a = vColor.a * m * mix(1.0, smoothstep(0.05, 0.6, vPush), uResolve);
  outColor = vec4(vColor.rgb * a, a);   // premultiplied
}`

export type TilesOptions = {
  /** Image (or canvas) to sample. Must be square-ish; it is scaled to cols x cols cells. */
  source: CanvasImageSource & { width: number; height: number }
  cols: number
  /** Start already assembled (no dust phase). */
  assembled?: boolean
  onFail?: () => void
}

export type Tiles = { flyHome(): void; resolve(): void; destroy(): void }

export function createTiles(canvas: HTMLCanvasElement, opts: TilesOptions): Tiles | null {
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: true, // the loop stops when idle, so the last frame must stay on screen
  })
  if (!context) return null
  const gl: WebGL2RenderingContext = context

  const prog = link(gl, VERT, FRAG)
  if (!prog) return null

  // ---- sample the source into per-tile colour
  const n = opts.cols
  const sampler = document.createElement('canvas')
  sampler.width = sampler.height = n
  const ctx = sampler.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(opts.source, 0, 0, n, n)
  const px = ctx.getImageData(0, 0, n, n).data

  const home: number[] = []
  const color: number[] = []
  const seed: number[] = []
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = (y * n + x) * 4
      const alpha = px[i + 3]
      if (alpha < 18) continue
      home.push(((x + 0.5) / n) * 2 - 1, 1 - ((y + 0.5) / n) * 2)
      color.push(px[i], px[i + 1], px[i + 2], alpha)
      // Delay grows from the top-centre outwards, plus noise, so the face forms first.
      const dx = (x / n - 0.5) * 2
      const dy = y / n
      seed.push(Math.min(1, Math.hypot(dx, dy) * 0.55 + Math.random() * 0.45), Math.random(), Math.random())
    }
  }
  const count = home.length / 2

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const attr = (name: string, data: ArrayBufferView, size: number, type: number, normalized: boolean, divisor: number) => {
    const loc = gl.getAttribLocation(prog, name)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, size, type, normalized, 0, 0)
    gl.vertexAttribDivisor(loc, divisor)
  }
  attr('aCorner', new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), 2, gl.FLOAT, false, 0)
  attr('aHome', new Float32Array(home), 2, gl.FLOAT, false, 1)
  attr('aColor', new Uint8Array(color), 4, gl.UNSIGNED_BYTE, true, 1)
  attr('aSeed', new Float32Array(seed), 3, gl.FLOAT, false, 1)

  const u = (name: string) => gl.getUniformLocation(prog, name)
  const uTime = u('uTime'), uStart = u('uStart'), uHover = u('uHover'), uTile = u('uTile'), uMouse = u('uMouse'), uScale = u('uScale')
  const uResolve = u('uResolve')
  gl.useProgram(prog)
  gl.uniform1f(uTile, 2 / n)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  // ---- state
  const t0 = performance.now()
  const now = () => (performance.now() - t0) / 1000
  // Dust until flyHome(): a start far in the future keeps every tile at p = 0; a start far in the
  // past puts every tile home at once.
  const DUST = 1e6
  let start = opts.assembled ? -DUST : DUST
  let hover = 0
  let resolveStart = -1 // time resolve() was called; the mosaic fades out over RESOLVE seconds
  const RESOLVE = 1.2
  let hoverTarget = 0
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
  let visible = true
  let raf = 0
  let lost = false

  // ---- size: DPR capped at 2, kept in sync by a ResizeObserver
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    const aspect = w / h
    gl.uniform2f(uScale, aspect > 1 ? 1 / aspect : 1, aspect > 1 ? 1 : aspect)
    schedule()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    schedule()
  })
  io.observe(canvas)

  // ---- pointer (window-level, so tiles react as the pointer approaches)
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    const side = Math.min(r.width, r.height)
    mouse.tx = ((e.clientX - (r.left + r.width / 2)) / side) * 2
    mouse.ty = -((e.clientY - (r.top + r.height / 2)) / side) * 2
    const inside = Math.abs(mouse.tx) < 1.2 && Math.abs(mouse.ty) < 1.2
    hoverTarget = inside ? 1 : 0
    if (hover < 0.01 && inside) {
      mouse.x = mouse.tx
      mouse.y = mouse.ty
    }
    schedule()
  }
  const onLeave = () => {
    hoverTarget = 0
    schedule()
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  const onVisibility = () => schedule()
  document.addEventListener('visibilitychange', onVisibility)

  const onLost = (e: Event) => {
    e.preventDefault()
    lost = true
    cancelAnimationFrame(raf)
    opts.onFail?.()
  }
  canvas.addEventListener('webglcontextlost', onLost)

  // ---- loop: draws only while something moves, so an idle portrait costs nothing
  function frame() {
    raf = 0
    if (lost) return
    const t = now()
    hover += (hoverTarget - hover) * 0.08
    mouse.x += (mouse.tx - mouse.x) * 0.16
    mouse.y += (mouse.ty - mouse.y) * 0.16
    gl.uniform1f(uTime, t)
    gl.uniform1f(uStart, start)
    gl.uniform1f(uHover, hover)
    gl.uniform2f(uMouse, mouse.x, mouse.y)
    gl.uniform1f(uResolve, resolveStart < 0 ? 0 : Math.min(1, (t - resolveStart) / RESOLVE))
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
    const resolving = resolveStart >= 0 && t - resolveStart < RESOLVE + 0.1
    const settling = resolving || start === DUST || t - start < 2.3 || Math.abs(hoverTarget - hover) > 0.002 || hover > 0.002
    if (settling) schedule()
  }
  function schedule() {
    if (!raf && visible && !document.hidden && !lost) raf = requestAnimationFrame(frame)
  }
  schedule()

  return {
    flyHome() {
      if (start === DUST) start = now()
      schedule()
    },
    resolve() {
      if (resolveStart < 0) resolveStart = now()
      schedule()
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onLost)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

function link(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(s))
      return null
    }
    return s
  }
  const v = compile(gl.VERTEX_SHADER, vs)
  const f = compile(gl.FRAGMENT_SHADER, fs)
  if (!v || !f) return null
  const p = gl.createProgram()!
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(p))
    return null
  }
  return p
}

/** Fallback source when there is no photo: the initials "YD" drawn in the accent colour. */
export function initialsSource(accent: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const ctx = c.getContext('2d')!
  ctx.fillStyle = accent
  ctx.font = '900 300px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('YD', 256, 270)
  return c
}
