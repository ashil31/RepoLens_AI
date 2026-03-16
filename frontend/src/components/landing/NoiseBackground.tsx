"use client";

import { useEffect, useRef } from "react";

const VS = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Design intent:
//   • Controlled monochrome — #0a0a0a base, max brightness ~#2a2a2a (no marble)
//   • One soft light center behind the headline (radial spotlight)
//   • Directional air-current flow (left→right drift + gentle sine wave)
//   • Only 2 noise layers (large flow + medium turbulence) — no detail chaos
//   • Cursor warp very subtle (0.08 strength vs old 0.28)
//   • Half speed vs old timings
//   • No harsh grain — tiny amplitude only
// ─────────────────────────────────────────────────────────────────────────────
const FS = `
  precision highp float;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uMouse;

  // ── Simplex 2D ─────────────────────────────────────────────────────────
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy  -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                   + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                             dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // ── FBM — 4 octaves only (was 5), no deep detail layer ─────────────────
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2  shift = vec2(100.0);
    mat2  rot   = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; i++) {
      v += a * snoise(p);
      p  = rot * p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / uResolution.y;

    float t = uTime;

    // ── Directional flow (air current: left→right drift + soft sine wave) ──
    vec2 st = uv;
    st.x *= aspect;
    st.x += t * 0.03;                                  // slow leftward drift
    st.y += sin(st.x * 0.8 + t * 0.2) * 0.05;         // gentle undulation

    // ── Cursor warp — very subtle (0.08 vs old 0.28) ───────────────────────
    vec2 mouse = uMouse;
    mouse.x   *= aspect;
    float dist = length(st - mouse);
    float warp = exp(-dist * 4.5) * 0.08;              // was 3.8 * 0.28
    st += warp * normalize(st - mouse + vec2(0.001));

    // ── Two noise layers only (removed the 7.0 detail pass) ────────────────
    vec2 q = vec2(
      fbm(st * 1.2 + vec2(0.0,  t * 0.03)),            // was 0.06
      fbm(st * 1.2 + vec2(5.2,  t * 0.03 + 1.3))
    );
    vec2 r = vec2(
      fbm(st * 2.8 + 4.0 * q + vec2(1.7, 9.2) + t * 0.05), // was 0.10
      fbm(st * 2.8 + 4.0 * q + vec2(8.3, 2.8) + t * 0.05)
    );

    // Combined — only 2 layers, no detail
    float n = fbm(st + r) * 0.7
            + fbm(st * 2.8 + t * 0.04) * 0.3;          // was 0.08
    n = clamp(n * 0.5 + 0.5, 0.0, 1.0);

    // ── Brand palette — max brightness capped at #2a2a2a (no harsh whites) ─
    //   #0a0a0a → #111 → #171717 → #2a2a2a
    //   #fafafa removed entirely — no marble highlights
    vec3 cA = vec3(0.039, 0.039, 0.039);  // --background  #0a0a0a
    vec3 cB = vec3(0.067, 0.067, 0.067);  // --card        #111
    vec3 cC = vec3(0.090, 0.090, 0.090);  // --muted       #171717
    vec3 cD = vec3(0.165, 0.165, 0.165);  // soft mid      #2a2a2a  ← new ceiling

    vec3 col = mix(cA, cB, smoothstep(0.0,  0.30, n));
    col      = mix(col, cC, smoothstep(0.25, 0.55, n));
    col      = mix(col, cD, smoothstep(0.48, 0.82, n) * 0.55);
    // cD mix at 0.55 weight so peak is #1a1a1a not full #2a2a2a

    // ── Subtle surface lighting — very low (0.025) stays monochrome ─────────
    float eps = 0.005;
    float gnx = fbm(st + vec2(eps, 0.0) + r) - fbm(st - vec2(eps, 0.0) + r);
    float gny = fbm(st + vec2(0.0, eps) + r) - fbm(st - vec2(0.0, eps) + r);
    vec3  nrm = normalize(vec3(gnx, gny, 0.018));
    vec3  lgt = normalize(vec3(0.2, 0.5, 1.0));
    float dif = clamp(dot(nrm, lgt), 0.0, 1.0);
    col += dif * 0.025;

    // ── Vignette — strong pull to #0a0a0a at edges ──────────────────────────
    vec2  vigUv = uv * (1.0 - uv.yx);
    float vv    = vigUv.x * vigUv.y * 22.0;            // stronger than before
    vv = pow(vv, 0.50);
    col *= vv;

    // ── Radial spotlight behind headline (most important improvement) ────────
    //    Soft +0.06 lift centred at (0.50, 0.42) — pushes hero text forward
    vec2  spotCenter = vec2(0.50, 0.42);
    float spotDist   = distance(uv, spotCenter);
    float spotlight  = exp(-spotDist * 4.0) * 0.06;
    col += spotlight * cC;

    // ── Secondary glow — slightly offset, larger radius, even softer ────────
    vec2  glowCenter = vec2(0.45, 0.35);
    float glowDist   = distance(uv, glowCenter);
    float glow       = exp(-glowDist * 2.6) * 0.04;
    col += glow * cB;

    // ── Micro grain — very low amplitude (0.010, half of old 0.018) ─────────
    float grain = fract(sin(dot(gl_FragCoord.xy + t * 47.3,
                   vec2(127.1, 311.7))) * 43758.5453) * 0.010 - 0.005;
    col += grain;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export function NoiseBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS))
        throw new Error(gl!.getShaderInfoLog(s) ?? "shader error");
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, "uTime");
    const uRes   = gl.getUniformLocation(prog, "uResolution");
    const uMouse = gl.getUniformLocation(prog, "uMouse");

    let mouseX = 0.5, mouseY = 0.42;
    let targetX = 0.5, targetY = 0.42;

    function onMouseMove(e: MouseEvent) {
      targetX = e.clientX / window.innerWidth;
      targetY = 1.0 - e.clientY / window.innerHeight;
    }
    window.addEventListener("mousemove", onMouseMove);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width  = window.innerWidth  * dpr;
      canvas!.height = window.innerHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener("resize", resize);

    let animId: number;
    const start = performance.now();

    function frame() {
      const t = (performance.now() - start) / 1000;
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouseX, mouseY);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      animId = requestAnimationFrame(frame);
    }
    frame();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* WebGL noise canvas — z-0, sits at the very back */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ zIndex: 0 }}
        aria-hidden
      />

      {/* Radial gradient overlay — adds CSS depth on top of shader */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,255,255,0.035) 0%, transparent 100%)",
        }}
      />

      {/* Bottom fade — pulls section into dark footer / dashboard below */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          zIndex: 1,
          height: "35%",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.55) 100%)",
        }}
      />
    </>
  );
}