import { useEffect, useRef } from 'react';
import { FRAG, VERT } from './shader';
import './HeroRipple.css';

/**
 * 히어로 일렁임 — 토스뱅크 디자인 채용 히어로(Simplify / Banking)의 파동을 따름(사용자 지시 2026-10-03).
 *
 * 글자 덩어리 위쪽에서 흐림이 퍼져 위 줄부터 글자를 흐리게 하고, 뒤따르는 맑은 구멍이 굴절 · 색번짐 파동과 함께
 * 위 줄부터 다시 또렷하게 한다. 토스의 파란 빛은 넣지 않는다 — 일렁임만(사용자 지시 2026-10-03).
 * 4초마다 한 번, 한 번에 1.7초. 시간 값은 토스 영상(1920×1080) 실측.
 *
 * 평소엔 HTML 글자가 그대로 보이고, 파동이 도는 동안만 글자를 캔버스에 옮겨 그린 WebGL 화면으로 바꾼다
 * (읽기 도구 · 검색 · 블러 등장은 HTML 그대로). 움직임 줄이기 설정 · WebGL2 미지원 · 화면 밖이면 돌지 않는다.
 * 지원하기 버튼은 효과 밖에 둔다.
 */

const SOURCES = ['.hero__title', '.hero__intro', '.hero__period'];
const PERIOD_MS = 4000; // 파동 시작 간격
const DURATION_MS = 1700; // 한 번의 길이
const FIRST_DELAY_MS = 2600; // 블러 등장이 끝난 뒤 첫 파동

/** 0 → 1을 시작 · 끝 시점(초) 사이로 자른다 */
const span = (s: number, from: number, to: number) => Math.min(1, Math.max(0, (s - from) / (to - from)));
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function compile(gl: WebGL2RenderingContext) {
  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  return prog;
}

export function HeroRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;

    let prog: WebGLProgram;
    try {
      prog = compile(gl);
    } catch (e) {
      console.warn('[HeroRipple]', e);
      return;
    }
    gl.useProgram(prog);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const U = {
      size: u('uSize'), dpr: u('uDpr'), scale: u('uScale'), center: u('uCenter'), lead: u('uLead'), hole: u('uHole'), hole2: u('uHole2'),
      fade: u('uFade'), bg: u('uBg'), tex: u('uTex'),
    };
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();

    const raster = document.createElement('canvas');
    const ctx = raster.getContext('2d')!;
    let dpr = 1;
    let cssW = 0;
    let cssH = 0;
    let scale = 1;
    let center = [0, 0]; // 흐림 · 일렁임 중심
    let block = 300; // 글자 덩어리 높이 — 흐림 시점을 줄 위치에 맞춘다
    let far = 1000; // 흐림 중심에서 캔버스 가장 먼 모서리까지(세로 0.7배 거리)

    /** 캔버스를 히어로 줄 전체 폭(화면 폭)으로 맞추고, 지금 보이는 글자를 그대로 옮겨 그려 텍스처로 올린다. */
    const prepare = () => {
      const heroRect = hero.getBoundingClientRect();
      cssW = document.documentElement.clientWidth;
      cssH = hero.offsetHeight;
      canvas.style.left = `${-heroRect.left}px`;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cssW * cssH * dpr * dpr > 6e6) dpr = Math.sqrt(6e6 / (cssW * cssH));
      const pw = Math.round(cssW * dpr);
      const ph = Math.round(cssH * dpr);
      canvas.width = raster.width = pw;
      canvas.height = raster.height = ph;
      // 캔버스 왼쪽 = 화면 왼쪽, 위쪽 = 히어로 위쪽
      const originX = 0;
      const originY = heroRect.top;

      // 1920 × 1080 디자인 프레임 대비 화면 배율(토스 1440 이상 0.833) — 히어로 글자 배율(--hs)과 같은 기준
      const hs = Math.min(1, window.innerWidth / 1440, window.innerHeight / 1080);
      scale = 0.8333 * hs;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.textBaseline = 'alphabetic';
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      for (const sel of SOURCES) {
        const root = hero.querySelector(sel);
        if (!root) continue;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const el = node.parentElement!;
          if (el.closest('.blur-reveal__sr')) continue;
          const st = getComputedStyle(el);
          ctx.font = `${st.fontStyle} ${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
          ctx.letterSpacing = st.letterSpacing === 'normal' ? '0px' : st.letterSpacing;
          ctx.fillStyle = st.color;
          const text = node.textContent ?? '';
          const range = document.createRange();
          for (const m of text.matchAll(/\S+/g)) {
            range.setStart(node, m.index);
            range.setEnd(node, m.index + m[0].length);
            const rect = range.getClientRects()[0];
            if (!rect) continue;
            const metrics = ctx.measureText(m[0]);
            const x = rect.left - originX;
            const y = rect.top - originY + metrics.fontBoundingBoxAscent;
            ctx.fillText(m[0], x, y);
            top = Math.min(top, y - metrics.actualBoundingBoxAscent);
            bottom = Math.max(bottom, y + metrics.actualBoundingBoxDescent);
            left = Math.min(left, x);
            right = Math.max(right, x + metrics.width);
          }
        }
      }
      // 흐림은 글자 덩어리 위쪽(높이의 10% 위)에서 — 위 줄이 먼저 흐려지고 먼저 돌아온다
      const cx = (left + right) / 2;
      block = bottom - top;
      center = [cx, top - (bottom - top) * 0.1];
      far = Math.hypot(Math.max(cx, cssW - cx), Math.max(center[1], cssH - center[1]) * 0.7);

      gl.viewport(0, 0, pw, ph);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const bg = getComputedStyle(document.body).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [255, 255, 255];
      gl.uniform3f(U.bg, bg[0] / 255, bg[1] / 255, bg[2] / 255);
    };

    /** t: 0 → 1 (한 번의 파동 안에서 시간). 아래 시점(초)은 토스 영상에서 잰 값 */
    const draw = (t: number) => {
      const s = t * DURATION_MS / 1000;
      gl.uniform2f(U.size, cssW, cssH);
      gl.uniform1f(U.dpr, dpr);
      gl.uniform1f(U.scale, scale);
      gl.uniform2f(U.center, center[0], center[1]);
      // 흐림 앞머리: 제목 0.3초 · 설명 0.5초 · 날짜 0.6초에 가장 흐림
      gl.uniform1f(U.lead, block * (0.3 + 1.65 * s) * span(s, 0, 0.08));
      // 맑은 구멍: 0.45초에 열려 제목 0.6초 · 설명 0.9초 · 날짜 1초에 돌아오고, 1.6초에 화면 끝. 두 번째 고리는 0.4초 뒤
      const hole = (x: number) => block * 0.95 * span(x, 0.45, 1.15) ** 1.3 + Math.max(0, far - block * 0.95) * span(x, 1.15, 1.6) ** 1.5;
      gl.uniform1f(U.hole, hole(s));
      gl.uniform1f(U.hole2, hole(s - 0.4));
      gl.uniform1f(U.fade, 1 - smoothstep(0.78, 1, t));
      gl.uniform1i(U.tex, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let visible = true;
    let raf = 0;
    let timer = 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      hero.removeAttribute('data-rippling');
    };
    const run = () => {
      timer = window.setTimeout(run, PERIOD_MS);
      if (!visible || document.hidden) return;
      prepare();
      draw(0);
      hero.setAttribute('data-rippling', '');
      const start = performance.now();
      const frame = (now: number) => {
        const t = (now - start) / DURATION_MS;
        if (t >= 1) return stop();
        draw(t);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    timer = window.setTimeout(run, FIRST_DELAY_MS);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(hero);

    // 개발용: window.__heroRipple(t)로 한 장면을 멈춰 볼 수 있다(검증 · 스크린샷)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__heroRipple = (t: number | null) => {
        window.clearTimeout(timer);
        stop();
        if (t == null) return;
        prepare();
        draw(t);
        hero.setAttribute('data-rippling', '');
      };
    }

    return () => {
      window.clearTimeout(timer);
      stop();
      io.disconnect();
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-ripple" aria-hidden="true" />;
}
