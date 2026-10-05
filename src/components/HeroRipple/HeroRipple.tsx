import { useEffect, useRef, type RefObject } from 'react';
import { FRAG, VERT } from './shader';
import './HeroRipple.css';

/**
 * 히어로 일렁임 — 토스뱅크 디자인 채용 히어로(Simplify / Banking)의 파동을 따름(사용자 지시 2026-10-03).
 *
 * 'Programs' 제목 한가운데에서 파동 하나가 퍼지며, 지나는 자리의 글자를 굴절 · 흐림 · 색번짐으로 한꺼번에 일렁이게 한다
 * (사용자 지시 2026-10-04 — 흐림과 맑아짐이 두 단계로 나뉘던 것을 토스처럼 하나로). 색번짐 · 흐림 세기는 토스와 같고
 * 굴절은 토스(34)보다 약한 예전 값 22.
 * 토스의 파란 빛은 넣지 않는다 — 일렁임만(사용자 지시 2026-10-03).
 * 4.2초마다 한 번, 한 번에 4.2초 — 끝나자마자 다음 파동(사용자 지시 2026-10-04). 고리가 퍼지는 속력은 빠르게 올랐다 길게 잦아드는 곡선(사용자 제공 AE 그래프).
 *
 * 첫 화면(introStyle):
 * - 'together'(기본, 사용자 지시 2026-10-04): 'Programs' · 소개 · 설명 · 지원 기간이 함께 투명 · 40px 아래에서 떠오르고,
 *   다 오를 즈음 전체가 4.2초 동안 일렁인다. 다 떠오르면 onIntroEnd(지원하기 · 자세히 보기가 이어서 떠오름).
 * - 'sequence'(이전 방식, 따로 남겨 둠): 'Programs'만 떠올라 3.4초 동안 일렁이고, 제목이 맑아지면 onIntroEnd로
 *   소개가 단어마다 블러에서 · 지원 기간이 이어서 · 마지막에 지원하기가 떠오른다.
 * 떠오르기도 캔버스가 그려 파동으로 이음매 없이 이어진다. WebGL을 못 쓰면 CSS로 떠오르기만.
 * 그 뒤부터 주기적인 파동. 첫 화면이 이미 끝났거나(개발 중 핫 리로드) 히어로가 화면 밖이면(스크롤 복원)
 * 첫 화면을 건너뛰고 바로 다 보여 준다 — 안 보는 사이 소개 등장이 지나가 버리지 않게.
 *
 * 평소엔 HTML 글자가 그대로 보이고, 파동이 도는 동안만 글자를 캔버스에 옮겨 그린 WebGL 화면으로 바꾼다
 * (읽기 도구 · 검색 · 블러 등장은 HTML 그대로). 움직임 줄이기 설정 · WebGL2 미지원 · 화면 밖이면 돌지 않는다.
 * 지원하기 버튼은 효과 밖에 둔다.
 *
 * controlRef를 주면 바깥에서 파동을 보낼 수 있다 — 3D 로고가 X자가 되는 순간마다(사용자 지시 2026-10-05).
 * 한 번이라도 바깥에서 부르면 자체 주기(PERIOD_MS)는 멈추고 바깥 박자만 따른다. 로고를 못 띄우면 자체 주기 그대로.
 * 첫 화면 떠오르기가 시작되면 히어로에 data-intro-go를 단다 — 로고가 같은 순간 함께 떠오른다.
 *
 * 파동 · 떠오르기 도중 화면 크기가 바뀌면 다음 프레임에 글자를 새 자리에서 다시 옮겨 그리고 진행 중이던 지점부터 잇는다
 * (사용자 지시 2026-10-05) — 끝난 뒤에 한꺼번에 재배치되지 않고 로고와 함께 바로 제자리를 찾는다.
 * 창을 끄는 동안에도 다시 그리기는 프레임당 한 번뿐이다.
 */

export type RippleControl = { ripple: () => void };

const SOURCES = ['.hero__title', '.hero__intro', '.hero__period'];
const INTRO_SOURCES = ['.hero__title'];
const PERIOD_MS = 4200; // 파동 시작 간격(사용자 지시 2026-10-04)
const DURATION_S = 4.2; // 한 번의 길이(사용자 지시 2026-10-04, 3.5 → 4.2) — 간격과 같아 쉬는 시간 없이 이어진다
const INTRO_DURATION_S = 3.4; // 첫 화면 파동만 조금 빠르게(사용자 지시 2026-10-04)
// 토스 값(1920 디자인 프레임 px). 화면에선 배율을 곱한다
const R_FROM = 80; // 고리가 출발하는 반지름
const WAVE_W = 360; // 고리 폭
// 고리가 멈추는 곳 = 가장 먼 글자 끝 + 고리 폭 × 이 값. 흐림은 고리보다 안쪽까지 넓게 걸치므로 2폭쯤은 지나가야
// 바깥 글자(제목 양끝 · 지원 기간)에서 흐림이 빠진다 — 1.2폭일 땐 2초 넘게 흐리다가 끝에 툭 맑아졌다
const END_W = 2;
const STRENGTH = 22; // 굴절 — 토스 34는 너무 세서 예전 값으로(사용자 지시 2026-10-04)
const CHROMA = 9; // 색번짐
const BLUR = 30; // 흐림
const RISE_S = 1; // 제목이 떠오르는 시간
const RISE_PX = 40; // 떠오르는 거리 — 아래 섹션들의 떠오르기(programs.css data-reveal)와 같게
// 떠오르기가 88%쯤(0.3초) 됐을 때 파동을 출발시킨다. 세기가 서서히 켜지므로 다 오른 순간 일렁이기 시작하는 것으로 보인다
const WAVE_AT_S = 0.3;
/** 떠오르기 곡선(빠르게 출발해 길게 감속) */
const easeOut = (x: number) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 5;
// 첫 파동이 이만큼 지나면(제목 가운데가 다 맑아진 때 — 3.4초 파동에서 1.36초, 양끝 여운만 남음) 바로 소개 · 지원 기간을 띄운다.
// 0.55(2.3초)일 땐 일렁임이 끝난 뒤 기다리는 시간이 길었다(사용자 지시 2026-10-04)
const INTRO_REVEAL_T = 0.4;
const FIRST_DELAY_MS = 3000; // 첫 화면이 끝난 뒤 첫 주기 파동(소개 블러 등장이 끝난 뒤)

/**
 * 파동이 퍼지는 진행(0 → 1). 속력 그래프 = 사용자가 준 AE 속력 그래프 모양(2026-10-04):
 * 0에서 시작해 20% 지점에서 정점까지 가파르게 오르고, 뒤로 길게 잦아들어 끝에서 0.
 * 속력을 적분해 표로 만들어 두고 보간한다.
 */
const PEAK = 0.2;
const TAIL = 3.8; // 클수록 정점 뒤 빨리 잦아든다
const ease = (() => {
  const end = 1 / (1 + TAIL * (1 - PEAK)) ** 2;
  const speed = (x: number) => {
    if (x < PEAK) { const a = x / PEAK; return a * a * (3 - 2 * a); }
    return (1 / (1 + TAIL * (x - PEAK)) ** 2 - end) / (1 - end);
  };
  const N = 256;
  const table = [0];
  for (let i = 1; i <= N; i++) table.push(table[i - 1] + (speed((i - 1) / N) + speed(i / N)) / 2);
  const total = table[N];
  return (x: number) => {
    const f = Math.min(1, Math.max(0, x)) * N;
    const i = Math.min(N - 1, Math.floor(f));
    return (table[i] + (table[i + 1] - table[i]) * (f - i)) / total;
  };
})();

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

type Props = {
  /** 첫 화면 방식 — 'together': 글 전체가 함께 떠올라 함께 일렁임, 'sequence': 제목만 → 소개 · 기간 차례로 */
  introStyle?: 'together' | 'sequence';
  /** 첫 화면에서 제목이 거의 맑아졌을 때(효과를 못 쓰면 바로) 한 번 부른다 */
  onIntroEnd?: () => void;
  /** 바깥에서 파동을 보내는 손잡이(3D 로고 박자) */
  controlRef?: RefObject<RippleControl | null>;
};

export function HeroRipple({ onIntroEnd, introStyle = 'together', controlRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const introEndRef = useRef(onIntroEnd);
  useEffect(() => { introEndRef.current = onIntroEnd; }, [onIntroEnd]);
  const introStyleRef = useRef(introStyle); // 첫 화면은 한 번뿐이라 처음 값만 쓴다
  const controlRefRef = useRef(controlRef); // 손잡이 ref는 처음 것만 쓴다

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;
    const introEnd = () => introEndRef.current?.();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return introEnd();
    // 첫 화면을 할지: 아직 시작 전(data-intro가 'done'이 아님)이고 히어로가 화면 안에 있을 때만
    const r = hero.getBoundingClientRect();
    const withIntro = hero.dataset.intro !== 'done' && r.bottom > 0 && r.top < window.innerHeight;
    const together = introStyleRef.current === 'together';
    if (!withIntro) introEnd();
    // WebGL을 못 쓰면 CSS로: 제목이 떠오르고(data-intro-css → data-title-in) 소개로 넘어간다
    const fallback = () => {
      if (!withIntro) return;
      hero.setAttribute('data-intro-css', '');
      hero.setAttribute('data-intro-go', '');
      void hero.offsetWidth; // 숨은 상태를 먼저 그려야 떠오르기 전환이 돈다
      hero.setAttribute('data-title-in', '');
      const id = window.setTimeout(introEnd, RISE_S * 1000);
      return () => window.clearTimeout(id);
    };
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return fallback();

    let prog: WebGLProgram;
    try {
      prog = compile(gl);
    } catch (e) {
      console.warn('[HeroRipple]', e);
      return fallback();
    }
    gl.useProgram(prog);
    const u = (name: string) => gl.getUniformLocation(prog, name);
    const U = {
      size: u('uSize'), dpr: u('uDpr'), center: u('uCenter'), radius: u('uR'), width: u('uW'), env: u('uEnv'),
      strength: u('uStrength'), chroma: u('uChroma'), blur: u('uBlur'), alpha: u('uAlpha'), shift: u('uShift'),
      bg: u('uBg'), tex: u('uTex'),
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
    let center = [0, 0]; // 파동 중심
    let reach = 600; // 중심에서 가장 먼 글자 끝까지(세로 ÷0.7 거리)

    /** 캔버스를 히어로 줄 전체 폭(화면 폭)으로 맞추고, 지금 보이는 글자를 그대로 옮겨 그려 텍스처로 올린다. */
    const prepare = (sources: string[]) => {
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
      let titleBox = [0, 0, 0, 0]; // 제목 글자 범위(왼 · 위 · 오 · 아래) — 파동 중심
      for (const sel of sources) {
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
        if (sel === '.hero__title') titleBox = [left, top, right, bottom];
      }
      // 파동은 'Programs' 한가운데에서(사용자 지시 2026-10-04). 거리는 거기서 가장 먼 글자 끝까지
      center = [(titleBox[0] + titleBox[2]) / 2, (titleBox[1] + titleBox[3]) / 2];
      reach = Math.hypot(Math.max(center[0] - left, right - center[0]), Math.max(center[1] - top, bottom - center[1]) / 0.7);

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

    /**
     * t: 파동 진행(0 → 1, 4.2초), rise: 첫 화면 떠오르기 진행(0 → 1, 그 밖엔 1).
     * 고리는 R_FROM에서 '가장 먼 글자 끝 + 고리 폭 × END_W'까지 퍼진다. 속력 곡선이 앞에 몰려 있어(시간 40%에 거리 80%)
     * 빠르게 퍼져 글자 전체가 한꺼번에 일렁이고, 길게 잦아드는 동안 바깥 글자에 옅은 여운이 남는다.
     * 세기는 처음 15%에 켜지고 마지막 18%에 꺼져 시작 · 끝 장면이 HTML 글자와 같다.
     */
    const draw = (t: number, rise = 1) => {
      const w = WAVE_W * scale;
      const from = R_FROM * scale;
      gl.uniform2f(U.size, cssW, cssH);
      gl.uniform1f(U.dpr, dpr);
      gl.uniform2f(U.center, center[0], center[1]);
      gl.uniform1f(U.radius, from + (reach + END_W * w - from) * ease(t));
      gl.uniform1f(U.width, w);
      gl.uniform1f(U.env, smoothstep(0, 0.15, t) * (1 - smoothstep(0.82, 1, t)));
      gl.uniform1f(U.strength, STRENGTH * scale);
      gl.uniform1f(U.chroma, CHROMA * scale);
      gl.uniform1f(U.blur, BLUR * scale);
      gl.uniform1f(U.alpha, easeOut(rise));
      gl.uniform1f(U.shift, RISE_PX * (1 - easeOut(rise)));
      gl.uniform1i(U.tex, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    let visible = true;
    let sources: string[] = SOURCES; // 지금 도는 파동이 옮겨 그린 글자
    let dirty = false; // 크기가 바뀌어 다시 옮겨 그려야 함
    let raf = 0;
    let timer = 0;
    let revealed = false;
    const stop = () => {
      cancelAnimationFrame(raf);
      hero.removeAttribute('data-rippling');
    };
    /**
     * 파동 한 번. intro면 제목만 옮겨 그려 투명 · 아래에서 떠오르게 하고(RISE_S), WAVE_AT_S부터 파동을 보낸다.
     * 파동이 INTRO_REVEAL_T만큼 지나면 소개를 띄운다.
     */
    const play = (intro: boolean, then: () => void) => {
      cancelAnimationFrame(raf); // 간격 = 길이라 앞 파동의 마지막 프레임과 겹칠 수 있다 — 새 파동만 남긴다
      // 'together'면 첫 화면도 글 전체를 옮겨 그리고 주기 파동과 같은 길이 · 같은 감춤
      const titleOnly = intro && !together;
      sources = titleOnly ? INTRO_SOURCES : SOURCES;
      dirty = false;
      prepare(sources);
      draw(0, intro ? 0 : 1);
      hero.setAttribute('data-rippling', titleOnly ? 'intro' : '');
      if (intro) hero.setAttribute('data-intro-go', '');
      const lead = intro ? WAVE_AT_S : 0;
      const begin = performance.now();
      const frame = (now: number) => {
        const el = (now - begin) / 1000;
        const t = Math.max(0, el - lead) / (titleOnly ? INTRO_DURATION_S : DURATION_S);
        if (intro && !revealed && (together ? el >= RISE_S : t >= INTRO_REVEAL_T)) { revealed = true; introEnd(); }
        if (t >= 1) { stop(); return then(); }
        if (dirty) { dirty = false; prepare(sources); }
        draw(t, intro ? el / RISE_S : 1);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    };
    let external = false; // 바깥 박자를 따르는 중
    let ready = false; // 첫 화면이 끝나 주기 파동을 보낼 수 있음
    const run = () => {
      if (external) return;
      timer = window.setTimeout(run, PERIOD_MS);
      if (!visible || document.hidden) return;
      play(false, () => {});
    };
    // 글꼴이 다 들어온 뒤 첫 화면을 시작한다(글자를 캔버스에 옮겨 그리므로). 그전까지 제목은 투명(HeroRipple.css)
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const periodic = () => {
        ready = true;
        if (!external) timer = window.setTimeout(run, FIRST_DELAY_MS);
      };
      if (withIntro) play(true, periodic);
      else periodic();
    });

    // 히어로(글자 배치) 또는 화면 폭이 바뀌면 다음 프레임에 다시 옮겨 그린다 — 도는 중일 때만 의미가 있다
    const onResize = () => { if (hero.hasAttribute('data-rippling')) dirty = true; };
    const ro = new ResizeObserver(onResize);
    ro.observe(hero);
    window.addEventListener('resize', onResize);

    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    io.observe(hero);

    const control = controlRefRef.current;
    if (control) {
      control.current = {
        ripple: () => {
          if (!external) { external = true; window.clearTimeout(timer); }
          if (!ready || !visible || document.hidden) return;
          play(false, () => {});
        },
      };
    }

    // 개발용: window.__heroRipple(t 0~1, intro?, rise?)로 한 장면을 멈춰 볼 수 있다(검증 · 스크린샷)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__heroRipple = (t: number | null, intro = false, rise = 1) => {
        window.clearTimeout(timer);
        stop();
        if (t == null) return;
        const titleOnly = intro && !together;
        prepare(titleOnly ? INTRO_SOURCES : SOURCES);
        draw(t, rise);
        hero.setAttribute('data-rippling', titleOnly ? 'intro' : '');
      };
    }

    return () => {
      if (control) control.current = null;
      cancelled = true;
      window.clearTimeout(timer);
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-ripple" aria-hidden="true" />;
}
