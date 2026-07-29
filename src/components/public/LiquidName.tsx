'use client'

import { useEffect, useRef, useState } from 'react'

// Nombre "líquido" con WebGL. Deformación por: (1) charco que sigue al cursor,
// (2) metaball que funde letras donde hay actividad, y (3) reactividad al
// MICRÓFONO por bandas (graves/medios/agudos, muy suavizadas + noise gate) que
// modulan un flujo ondulado de baja frecuencia — olas grandes y suaves que
// respiran con el sonido, sin temblar y quietas en silencio. Con "reduce
// motion" o sin WebGL, sale el nombre normal.
const NAME_CLS =
  'font-display text-[clamp(2.8rem,8vw,6.5rem)] font-normal leading-[1.0] tracking-[0.01em] text-light'

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uActive;
uniform float uAmbient;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uLevel;
uniform float uTime;
uniform float uAspect;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0,0.0));
  float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

void main(){
  vec2 uv = vUv;
  vec2 asp = vec2(uAspect, 1.0);
  float t = uTime;

  // 1) Charco bajo el cursor.
  float d = distance(uv * asp, uMouse * asp);
  float fall = pow(smoothstep(0.17, 0.0, d), 1.5) * uActive;
  vec2 nc = vec2(
    noise(uv * 7.0 + vec2(t * 0.5, t * 0.3)),
    noise(uv * 7.0 + vec2(-t * 0.4, t * 0.45) + 11.0)
  ) - 0.5;
  vec2 disp = (nc * 0.05 + uVel * 0.18) * fall;

  // 2) Flujo líquido de baja frecuencia cuya amplitud respira con las bandas.
  //    Sin término base: en silencio (bandas a 0) el nombre queda quieto.
  vec2 flow = vec2(
    noise(uv * 2.4 + vec2(t * 0.32, 0.0)),
    noise(uv * 2.4 + vec2(0.0, -t * 0.28) + 5.0)
  ) - 0.5;
  // uAmbient da una ondulación base suave siempre activa (para táctil, sin hover).
  float amp = uAmbient * 0.05 + uBass * 0.06 + uMid * 0.034;
  disp += flow * amp;
  disp += (vec2(noise(uv * 5.0 + t * 0.6), noise(uv * 5.0 - t * 0.5 + 9.0)) - 0.5) * uHigh * 0.016;

  // 3) Metaball: funde letras donde hay actividad (cursor + volumen).
  vec2 p = uv + disp;
  vec4 base = texture2D(uTex, p);
  float amount = clamp(fall + uLevel * 0.6, 0.0, 1.0);
  float r = 0.004 + 0.016 * amount;
  float rx = r / uAspect;
  float bl = base.a;
  bl += texture2D(uTex, p + vec2(rx, 0.0)).a;
  bl += texture2D(uTex, p + vec2(-rx, 0.0)).a;
  bl += texture2D(uTex, p + vec2(0.0, r)).a;
  bl += texture2D(uTex, p + vec2(0.0, -r)).a;
  bl += texture2D(uTex, p + vec2(rx, r) * 0.7).a;
  bl += texture2D(uTex, p + vec2(-rx, r) * 0.7).a;
  bl += texture2D(uTex, p + vec2(rx, -r) * 0.7).a;
  bl += texture2D(uTex, p + vec2(-rx, -r) * 0.7).a;
  bl /= 9.0;
  float blob = smoothstep(0.30, 0.52, bl) * amount;
  vec3 ink = vec3(0.949, 0.929, 0.902);
  float a = max(base.a, blob);
  gl_FragColor = vec4(ink * a, a);
}`

type AudioState = {
  analyser: AnalyserNode
  freq: Uint8Array<ArrayBuffer>
  ctx: AudioContext
  stream: MediaStream
}

export default function LiquidName() {
  const box = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [ok, setOk] = useState(true)

  useEffect(() => {
    // Con "reduce motion" no auto-animamos, pero sí renderizamos el nombre y
    // permitimos el sonido si el usuario lo activa con un toque (opt-in).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cv = canvas.current
    const wrap = box.current
    if (!cv || !wrap) return

    const gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
    if (!gl) {
      setOk(false)
      return
    }
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src)
      gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(sh) || 'shader')
      return sh
    }
    let prog: WebGLProgram
    try {
      prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link')
    } catch {
      setOk(false)
      return
    }
    gl.useProgram(prog)

    const glbuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, glbuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const U = (n: string) => gl.getUniformLocation(prog, n)
    const uMouse = U('uMouse'),
      uVel = U('uVel'),
      uActive = U('uActive'),
      uAmbient = U('uAmbient')
    const uBass = U('uBass'),
      uMid = U('uMid'),
      uHigh = U('uHigh'),
      uLevel = U('uLevel')
    const uTime = U('uTime'),
      uAspect = U('uAspect')

    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.uniform1i(U('uTex'), 0)

    const tc = document.createElement('canvas')
    const tctx = tc.getContext('2d')!
    const fam = getComputedStyle(wrap).fontFamily || 'Georgia, serif'
    let aspect = 1

    function drawText() {
      const w = wrap!.clientWidth
      if (w === 0) return
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const h = Math.round(w * 0.44)
      tc.width = Math.round(w * dpr)
      tc.height = Math.round(h * dpr)
      aspect = w / h
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      tctx.clearRect(0, 0, w, h)
      tctx.fillStyle = '#f2ede6'
      tctx.textAlign = 'center'
      tctx.textBaseline = 'middle'
      const fs = Math.min(w * 0.135, 108)
      tctx.font = `400 ${fs}px ${fam}`
      const gap = fs * 0.56
      tctx.fillText('Práxedes', w / 2, h / 2 - gap)
      tctx.fillText('de Vilallonga', w / 2, h / 2 + gap)

      cv!.width = tc.width
      cv!.height = tc.height
      cv!.style.height = `${h}px`
      gl!.viewport(0, 0, cv!.width, cv!.height)
      gl!.activeTexture(gl!.TEXTURE0)
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, tc)
    }

    let audio: AudioState | null = null
    const s = {
      mx: 0.5,
      my: 0.5,
      tmx: 0.5,
      tmy: 0.5,
      vx: 0,
      vy: 0,
      active: 0,
      targetActive: 0,
      ambient: 0,
      bass: 0,
      mid: 0,
      high: 0,
      time: 0,
      raf: 0,
      running: false,
    }

    function render() {
      gl!.clearColor(0, 0, 0, 0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
      gl!.uniform2f(uMouse, s.mx, s.my)
      gl!.uniform2f(uVel, s.vx, s.vy)
      gl!.uniform1f(uActive, s.active)
      gl!.uniform1f(uAmbient, s.ambient)
      gl!.uniform1f(uBass, s.bass)
      gl!.uniform1f(uMid, s.mid)
      gl!.uniform1f(uHigh, s.high)
      gl!.uniform1f(uLevel, Math.min(1, s.bass * 0.7 + s.mid * 0.5))
      gl!.uniform1f(uTime, s.time)
      gl!.uniform1f(uAspect, aspect)
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    }

    function bandAvg(a: number, b: number): number {
      if (!audio) return 0
      let x = 0
      for (let i = a; i < b; i++) x += audio.freq[i]
      return x / (b - a) / 255
    }

    function tick() {
      s.time += 0.016
      s.mx += (s.tmx - s.mx) * 0.18
      s.my += (s.tmy - s.my) * 0.18
      s.vx *= 0.86
      s.vy *= 0.86
      s.active += (s.targetActive - s.active) * 0.08

      let tb = 0,
        tm = 0,
        th = 0
      if (audio) {
        audio.analyser.getByteFrequencyData(audio.freq)
        const GATE = 0.17
        const gate = (v: number) => (v <= GATE ? 0 : (v - GATE) / (1 - GATE))
        tb = Math.min(1, gate(bandAvg(2, 10)) * 2.0)
        tm = Math.min(1, gate(bandAvg(12, 42)) * 2.2)
        th = Math.min(1, gate(bandAvg(46, 92)) * 2.4)
      }
      s.bass += (tb - s.bass) * 0.1
      s.mid += (tm - s.mid) * 0.1
      s.high += (th - s.high) * 0.1

      render()
      const alive = s.targetActive > 0 || s.active > 0.01 || !!audio || s.ambient > 0
      if (!alive) {
        s.running = false
        return
      }
      s.raf = requestAnimationFrame(tick)
    }
    function startLoop() {
      if (!s.running) {
        s.running = true
        s.raf = requestAnimationFrame(tick)
      }
    }

    function onMove(e: globalThis.PointerEvent) {
      const r = cv!.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width
      const ny = 1 - (e.clientY - r.top) / r.height
      s.vx += (nx - s.tmx) * 0.6
      s.vy += (ny - s.tmy) * 0.6
      s.tmx = nx
      s.tmy = ny
      startLoop()
    }
    function onEnter(e: globalThis.PointerEvent) {
      const r = cv!.getBoundingClientRect()
      s.tmx = s.mx = (e.clientX - r.left) / r.width
      s.tmy = s.my = 1 - (e.clientY - r.top) / r.height
      s.targetActive = 1
      startLoop()
    }
    function onLeave() {
      s.targetActive = 0
      startLoop()
    }

    async function initAudio() {
      if (audio || !navigator.mediaDevices?.getUserMedia) return
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const ctx = new AudioContext()
        // En iOS el contexto nace suspendido; si estamos dentro de un gesto, se
        // reanuda aquí. Si no, se reintenta al primer toque/tecla.
        await ctx.resume().catch(() => {})
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        analyser.smoothingTimeConstant = 0.85
        source.connect(analyser)
        audio = { analyser, freq: new Uint8Array(analyser.frequencyBinCount), ctx, stream }
        if (ctx.state === 'suspended') {
          const resume = () => ctx.resume()
          window.addEventListener('pointerdown', resume, { once: true })
          window.addEventListener('keydown', resume, { once: true })
        }
        startLoop()
      } catch {
        // permiso denegado o sin micro → el efecto sigue con cursor/ambiente
      }
    }

    let ro: ResizeObserver | null = null
    let painted = false
    // Plan B: si el canvas no ha pintado en 1,5 s (fallo WebGL/fuente en iOS…),
    // mostramos el nombre normal para que nunca quede invisible.
    const watchdog = window.setTimeout(() => {
      if (!painted) setOk(false)
    }, 1500)

    const setup = () => {
      drawText()
      render()
      painted = true
      cv!.style.opacity = '1'
      cv!.addEventListener('pointermove', onMove)
      cv!.addEventListener('pointerenter', onEnter)
      cv!.addEventListener('pointerleave', onLeave)
      ro = new ResizeObserver(() => {
        drawText()
        render()
      })
      ro.observe(wrap!)
      const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches
      if (touch) {
        // Sin hover no hay charco → ondulación ambiente (salvo reduce motion).
        if (!reduce) {
          s.ambient = 1
          startLoop()
        }
        // iOS exige un gesto para el micro → lo pedimos al primer toque.
        window.addEventListener('pointerdown', firstGesture, { once: true })
        window.addEventListener('touchstart', firstGesture, { once: true })
      } else if (!reduce) {
        initAudio()
      } else {
        window.addEventListener('pointerdown', firstGesture, { once: true })
      }
    }
    function firstGesture() {
      initAudio()
    }
    if (document.fonts?.ready) document.fonts.ready.then(setup)
    else setup()

    return () => {
      cancelAnimationFrame(s.raf)
      clearTimeout(watchdog)
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerenter', onEnter)
      cv.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', firstGesture)
      window.removeEventListener('touchstart', firstGesture)
      ro?.disconnect()
      if (audio) {
        audio.stream.getTracks().forEach((t) => t.stop())
        audio.ctx.close()
        audio = null
      }
    }
  }, [])

  return (
    <div ref={box} className="relative w-full animate-fade-up font-display">
      <h1 aria-label="Práxedes de Vilallonga" className={ok ? 'sr-only' : NAME_CLS}>
        Práxedes
        <br />
        de Vilallonga
      </h1>
      {ok && (
        <canvas
          ref={canvas}
          aria-hidden
          className="block w-full bg-transparent opacity-0 transition-opacity duration-500"
        />
      )}
    </div>
  )
}
