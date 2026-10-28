import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { isNavigating, jumpTo, lenis, lockScrollInput, scrollToTarget, setWheelFilter, type WheelInput } from '../../smoothScroll';
import { VectorGuides, VectorWord, setVectorZone } from '../VectorWord/VectorWord';
import './Philosophy.css';

/**
 * 교육 철학(v16 → v17 → v18).
 *
 * v18(사용자 지시 2026-10-23) — apple.com/kr/macbook-pro '성능' 섹션(M5. M5 Pro. M5 Max. / 스피드 삼총사. → M1 시리즈 대비
 * 최대 8배 더 빠른 AI 성능)의 인터랙션을 빌렸다:
 * - 화면 높이 무대가 붙어 있는 동안, 위에 큰 제목(Fundamental Over Tools — 본문보다 큰 글)이 머물고
 *   그 아래 본문 단락이 스크롤 지점마다 바뀐다. 무대가 화면에 들어오면 제목 → 첫 단락이 차례로 떠오른다(Apple StaggeredFadeIn).
 * - 단락이 바뀔 땐 iPhone Duo 소개 영상(youtube bxSGfpoFP30, 8 ~ 11초)의 펼침 — 나가는 단락은 흐려지며 비키고,
 *   들어오는 단락은 위 경첩에서 3D로 젖혀진 채 접혀 있다가 아래로 펼쳐지며 흐림이 걷힌다(사용자 지시 — 좌우가 아니라 위아래로).
 *   스크롤 지점을 넘으면 시간으로 움직인다(되돌리면 거꾸로). 제목은 잉크 단색, 단락은 v17과 같은 큰 글(44px).
 * - 벡터형 인재(사용자 제공 phi.design 화면 녹화 · 코드): 한 줄 제목 아래 단락. 섹션 전체에서
 *   포인터를 십자선 · 좌표가 따라다니고(VectorGuides), 제목 낱말과 본문의 [사고방식] · [벡터형 인재] · [역량과 태도]는
 *   마우스를 올리면 벡터 보기(VectorWord — 윤곽 · 최소한의 앵커 · 바운딩 박스 · 안내선 · 좌표).
 * - 본문은 react-bits ScrollReveal(사용자 제공 설정: chars · fade · stagger 0.05 · smoothing 2 · baseOpacity 0.1 · blur 4).
 *   2026-10-24: 흐림 4 → 2, 드러나는 시간 · 문장 간격 · 머무는 시간 모두 절반(두 배 빠르게, 사용자 지시).
 * - 단락마다 끊어 넘긴다(사용자 지시 2026-10-23 — 스크롤에 따라 반쯤 흐린 글이 남았다). 2026-10-28부터는 멈춘 뒤 맞춰 가지 않고,
 *   아래로 가다 단락 자리에 닿으면 그 자리에 걸려 CATCH_MS 머문 뒤 바로 이어 갈 수 있다(catchAt).
 *   글은 스크롤 위치(scrub)가 아니라 단락이 자리 잡으면 시간으로 끝까지 드러난다 — 문장은 차례로(SENTENCE_GAP초 간격).
 * - v19(사용자 지시 2026-10-23): 오른쪽 Φ 모션그래픽(PhiMotion)을 뺐다 — v18엔 단락 오른쪽에 화면 밖으로 잘리는 큰 Φ가 있었다.
 * - v19 몰입(사용자 지시 2026-10-23): 무대 앞에 INTRO 화면 높이만큼의 길을 더 두고, 그동안 제목이 화면을 넘칠 만큼 크게(화면 폭의 INTRO_WIDTH배)
 *   화면 가운데 있다가 스크롤을 따라 제자리 크기 · 자리로 줄어든다. 제목엔 떠오름(StaggeredFadeIn)을 쓰지 않는다.
 *   두 단계(사용자 지시 2026-10-23): ① SHRINK 몫 동안 화면 가로 가운데 · 제목 본래 높이(세로 가운데 선)에 선 채 제 크기로 줄고,
 *   ② 나머지 동안 같은 높이에서 왼쪽 제자리로 옮겨 가며
 *   단락 칸이 함께 페이드인된다(스크롤을 따라). 큰 제목인 동안(① ~ ②)은 벡터 인터랙션 · 십자선을 꺼 둔다(setVectorZone).
 *   끊어 넘기기도 큰 제목 자리(0) → 단락들(1 … n) → 무대가 풀리는 자리(n + 1) 순서로 맞춘다.
 * - 머묾(2026-10-23 ~ 10-27, 2026-10-28에 뺐다 — 넘어가는 딜레이가 심하고 스크롤이 위로 끌려갔다): 막 드러난 단락은 문장이 다 드러날 때까지(hold) 다음 단락으로
 *   넘어가지 않는다. 그동안 더 내려도 단락은 그대로이고, 멈추면 그 단락 자리로 되돌린다. 넘어갈 땐 한 칸씩. 스크롤 자체는 가로채지 않는다.
 * - v21 몰입 뒤집기(사용자 지시 2026-10-24 — 큰 제목이 줄며 왼쪽으로 가던 것을): 제목이 화면 가운데에서 작게(화면 폭의 INTRO_WIDTH배) 시작해
 *   ① GROW 몫 동안 화면 가운데에 선 채 글줄 폭에 꽉 차게(양옆 --side-wide — 다른 섹션과 같은 폭, 2026-10-27. v21은 --gutter) 커지고, ② 나머지 동안 제자리(위)로 올라가며 단락 칸이 페이드인된다.
 *   제자리 크기는 꽉 찬 폭이라 글꼴 크기를 재서 맞춘다(fit — 크기 바꿀 때 · 글꼴이 들어온 뒤). 제목은 가운데 정렬(CSS).
 * - 2026-10-27(사용자 지시): 단락은 왼쪽 정렬로 다른 섹션 글과 같은 왼쪽 선에 붙이고(아래 역량과 태도로 세로로 이어지게) 글씨는 절반(44 → 22px).
 * 단락마다 스크롤 STEP(화면 높이 배수). 움직임 줄이기면 붙는 무대 없이 제목과 단락을 차례로 쌓는다(CSS).
 */
type Props = { title: string; paragraphs: string[][] };

/** 한 단락이 쓰는 스크롤 길이(화면 높이 배수) */
const STEP = 1.2;
/** 제목이 커지는 스크롤 길이(화면 높이 배수) */
const INTRO = 1;
/** 처음 제목 폭 = 화면 폭 × 이 값 — v21: 1.7(화면을 넘친다) → 0.3(가운데 작게, 사용자 지시 2026-10-24) → 0.12(더 작게, 2026-10-27).
 *  같은 날 6px 점에서 시작하게 했다가 되돌렸다(사용자 지시) */
const INTRO_WIDTH = 0.12;
/** 처음 제목 폭의 하한(px) — 좁은 화면에서 아주 작아지지 않게 */
const INTRO_MIN = 120;
/** 몰입 길 중 가운데에서 커지는 몫 — 나머지는 제자리(위)로 올라가며 단락이 페이드인 */
const GROW = 0.6;
/** 스크롤이 멈췄다고 보는 시간(ms) */
const SETTLE_MS = 140;
/** 단락 자리에 걸려 머무는 시간(ms) — 그 뒤엔 바로 이어 내려갈 수 있다(사용자 지시 2026-10-28) */
const CATCH_MS = 100;
/** 한 단락 안 문장들이 차례로 드러나는 간격(초) */
const SENTENCE_GAP = 0.45; // 0.9 → 0.45 — 두 배 빠르게(사용자 지시 2026-10-24)
/** '**'로 시작하는 문장은 굵게(사용자 지시 2026-10-27) */
const strong = (text: string) => text.startsWith('**');
/** 문장 → ScrollReveal children: 글은 그대로, [ ]로 감싼 낱말은 벡터 낱말 — 본문은 박스만(앵커 없이, 사용자 지시 2026-10-23) */
function sentence(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\])/).filter(Boolean).map((part, i) =>
    part.startsWith('[') ? <VectorWord key={i} word={part.slice(1, -1)} boxOnly /> : part,
  );
}

export function Philosophy({ title, paragraphs }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [at, setAt] = useState(0); // 지금 단락

  // 그리기 전에(useLayoutEffect) 첫 장면을 잡는다(사용자 제보 2026-10-27 — 처음 들어오면 제목이 꽉 찬 크기로 잠깐 보였다가 작아졌다):
  // 예전엔 useEffect + 다음 프레임(rAF)에서 처음 그려, 그 사이 한 프레임은 CSS 그대로(꽉 찬 제목 · 보이는 단락)였다
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const track = root.querySelector<HTMLElement>('.philosophy__track')!;
    const stage = root.querySelector<HTMLElement>('.philosophy__stage')!;
    const title = root.querySelector<HTMLElement>('.philosophy__title')!;
    const body = root.querySelector<HTMLElement>('.philosophy__body')!;
    const n = paragraphs.length;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let settle = 0;
    let lastY = window.scrollY; // 앞 스크롤 자리 — 단락 자리를 '이어서' 넘었는지 · 가던 쪽
    let unlock = 0;
    let held = -1; // 휠이 걸린 단락 자리(px) — 닿아 CATCH_MS가 지날 때까지 그 자리를 넘지 않는다
    // 맞출 자리(페이지 y): 0 = 무대가 붙는 순간(큰 제목), i = 단락 i - 1이 지금이 되는 지점, n + 1 = 무대가 풀리는 자리
    // 화면 높이는 무대 높이(100svh)로 잰다(2026-10-27 — 맨 처음으로 되돌아가던 원인 ①): 휴대폰은 스크롤하면 주소창이 접히며
    // innerHeight가 바뀌는데, 그 값으로 잰 단락 자리가 수십 px 위아래로 밀려 '위로 올라갔다'로 읽혔다(→ 큰 제목 자리 = 맨 위로)
    const geometry = () => {
      const r = track.getBoundingClientRect();
      const vh = stage.offsetHeight;
      const top = window.scrollY + r.top;
      const span = r.height - vh; // 무대가 붙어 있는 동안의 스크롤 길이
      const intro = INTRO * vh;
      const seg = (span - intro) / n;
      const anchors = [top, ...Array.from({ length: n }, (_, i) => Math.round(top + intro + seg * i) + 1), top + span];
      return { r, vh, span, intro, seg, anchors };
    };
    // 제목을 화면 폭에 꽉 차게(사용자 지시 2026-10-27 — Full width, 양옆 여백 없이. 이전엔 무대 글줄 폭) — 글자 잉크가 화면 양끝에 닿도록
    // 같은 글꼴로 캔버스에서 잉크 폭을 재 글꼴 크기를 맞춘다(글꼴 크기에 폭이 비례). 넘친 글자 상자의 옆 여백은 무대가 가운데에서 양쪽으로 넘긴다
    const ink = document.createElement('canvas').getContext('2d');
    const fit = () => {
      const cs = getComputedStyle(title);
      const fs = parseFloat(cs.fontSize);
      if (!ink || !fs) return;
      ink.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      if ('letterSpacing' in ink) ink.letterSpacing = cs.letterSpacing;
      const m = ink.measureText(title.textContent ?? '');
      const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
      if (w > 0) title.style.fontSize = `${((fs * stage.clientWidth) / w).toFixed(2)}px`;
    };
    const tick = () => {
      raf = 0;
      const { r, vh, span, intro } = geometry();
      // 몰입(v21): 0 = 화면 가운데 작은 제목 → GROW = 가운데에서 꽉 찬 폭 → 1 = 제자리(위)
      const k = reduced ? 1 : Math.min(1, Math.max(0, -r.top / intro));
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2); // easeInOutCubic
      const eA = ease(Math.min(1, k / GROW));
      const eB = ease(Math.max(0, (k - GROW) / (1 - GROW)));
      if (!reduced) {
        const w = title.offsetWidth;
        const h = title.offsetHeight;
        const s0 = Math.max(window.innerWidth * INTRO_WIDTH, Math.min(w, INTRO_MIN)) / w;
        const sc = s0 ** (1 - eA); // 크기는 비율로 커져야 고르게 보인다
        // 제목은 가로 가운데에 놓여 있어(CSS) 가운데를 축으로 키우면 된다. 세로는 ① 화면 가운데 → ② 제자리(무대가 붙어 있어 무대 위 = 화면 위)
        const ty = (vh / 2 - (title.offsetTop + h / 2)) * (1 - eB);
        title.style.transform = k >= 1 ? '' : `translate(0, ${ty.toFixed(1)}px) scale(${sc.toFixed(4)})`;
        // 움직이는 동안만 레이어로 — 제자리에선 풀어야 제 크기로 선명하게 다시 그린다(늘 걸면 작을 때 그린 그림을 확대해 흐렸다)
        // will-change는 걸지 않는다(2026-10-27) — 걸면 크롬이 처음(작을 때) 그린 그림을 확대해 써서 커지는 동안 제목 · 벡터 윤곽이
        // 깨져 보였다. 걸지 않으면 크기가 바뀔 때마다 그 크기로 다시 그린다(제목 한 줄이라 부담이 작다)
        // 흐림은 없다(사용자 지시 2026-10-27 — 히어로의 블러 효과 제거). 같은 날 앞서는 작을 때 흐렸다가 또렷해졌다
        // 단락 칸은 ②를 따라 페이드인 — v21: 제목과 함께 올라온다(제목 밑에 붙어, 24px 더 아래에서 제자리로). 따로 두면 올라오는 제목과 겹쳤다
        body.style.opacity = eB >= 1 ? '' : eB.toFixed(3);
        body.style.transform = eB >= 1 ? '' : `translateY(${(ty + (1 - eB) * 24).toFixed(1)}px)`;
      }
      // 벡터 인터랙션 · 십자선은 늘 켠다(사용자 지시 2026-10-27 — 단락이 나오기 전, 제목이 커지는 동안에도 호버되게).
      // 예전(v19)엔 큰 제목인 동안 꺼 뒀다. 스크롤하는 동안 박스는 VectorGuides가 매 프레임 다시 잰다
      setVectorZone(root, true);
      // 단락 글자는 단락 칸이 제자리에 다 들어온 뒤(② 끝)에 드러나기 시작한다(사용자 제보 2026-10-27): 예전엔 ②가 시작되면 시작해,
      // 칸이 아직 투명한 동안 글자가 다 드러나 버려 칸이 나타날 땐 한꺼번에 · 흐리게 떴다. ② 동안 아래 스크롤을 막던 것(hold)도 함께 풀린다
      const on = k >= 1 && r.bottom > vh * 0.4;
      setShown(on);
      const q = span > intro ? Math.min(0.999, Math.max(0, (-r.top - intro) / (span - intro))) : 0;
      // 단락은 그 단락 자리(걸리는 자리)에 닿는 순간 바뀐다 — 위로 가면 그 자리 위에서 앞 단락으로
      setAt(Math.min(n - 1, Math.floor(q * n)));
    };
    // 단락 자리에 걸기(사용자 지시 2026-10-28): 아래로 스크롤하다 단락 자리(a[1] … a[n])를 넘으려 하면 넘치지 않고 그 자리에 딱 멈추고,
    // CATCH_MS 동안만 입력을 막은 뒤 풀어 바로 이어 내려갈 수 있다. 빠르게 굴려도 단락을 건너뛰지 않는다.
    // 예전(10-23 ~ 10-28)엔 멈춘 뒤 단락 자리로 맞춰 가거나(snap), 무대 끝을 지나친 뒤 위로 되돌려(guard) 내려갔다 돌아오는 게 어색했고,
    // 맞춰 가는 사이 관성에 첫 단락을 건너뛰기도 했다. 위로 갈 땐 걸지 않는다
    const catchAt = (y: number) => {
      jumpTo(y); // 부드러운 스크롤의 남은 미끄러짐도 함께 끊는다
      if (!unlock) lockScrollInput(true);
      window.clearTimeout(unlock);
      unlock = window.setTimeout(() => {
        unlock = 0;
        held = -1;
        lockScrollInput(false);
      }, CATCH_MS);
    };
    // 휠(부드러운 스크롤)은 입력 단계에서 거리를 잘라 단락 자리를 넘지 않게 한다 — 넘친 뒤 되돌리면 한 프레임 넘었다가 돌아오는 게 보였다.
    // 그 자리에 닿으면(onScroll) catchAt이 CATCH_MS 동안 걸어 둔다. 터치 · 키 · 스크롤바(브라우저 스크롤)는 닿은 뒤 catchAt이 되돌린다
    const filterWheel = (data: WheelInput) => {
      if (!lenis || reduced || !data.event.type.includes('wheel') || isNavigating()) return;
      if (data.deltaY <= 0) {
        held = -1; // 위로 — 걸지 않는다
        return;
      }
      // 지금 자리(pos)에서 가려는 자리(Lenis 목표 + 이번 거리)까지 단락 자리가 있으면 거기까지만 — 목표가 이미 단락 자리인
      // 맞춰 가기(첫 단락으로 마저 가기) 중에도 넘지 않게 지금 자리로 잰다
      const pos = lenis.animatedScroll;
      const tgt = lenis.targetScroll;
      if (held >= 0) {
        // 거의 닿았는데(마지막 몇 px에서 늘어지는 중) 아직 걸지 않았으면 지금 건다 — 닿기를 기다리다 영영 안 풀리는 일이 없게
        if (pos >= held - 8 && !unlock) catchAt(held);
        data.deltaY = Math.max(0, held - tgt);
        if (data.deltaY > 0) return;
        // 남은 거리가 없으면 입력을 버린다 — 거리 0을 Lenis에 넘기면 Lenis가 손을 떼 브라우저가 휠 한 칸(100px)을 그냥 스크롤했다
        data.event.preventDefault();
        return false;
      }
      const a = geometry().anchors;
      for (let i = 1; i <= n; i++) {
        // 목표가 아직 그 자리 앞이거나, 목표는 그 자리인데 지금 자리가 아직 오는 중이면(맞춰 가는 중) — 이미 와 있으면(8px 안) 다음 자리를 본다
        if ((tgt < a[i] - 0.5 || pos < a[i] - 8) && tgt + data.deltaY >= a[i] - 0.5) {
          held = a[i];
          data.deltaY = Math.max(0, a[i] - tgt);
          if (data.deltaY > 0) return;
          data.event.preventDefault();
          return false;
        }
      }
    };
    setWheelFilter(filterWheel);
    // 제목이 커지는 길(첫 단락 자리 위)에서 내려가다 멈추면 첫 단락 자리로 마저 간다 — 반쯤 커진 제목에 머물지 않게.
    // 위로 가다 멈추면 그대로 둔다(맨 위로 저절로 가지 않는다 — 2026-10-27)
    const settleIntro = () => {
      const y = window.scrollY;
      if (reduced || unlock || isNavigating() || y <= lastSettle) return void (lastSettle = y);
      lastSettle = y;
      const { vh, anchors: a } = geometry();
      if (y <= a[0] + 2 || y >= a[1] - 2) return;
      scrollToTarget(a[1], { duration: Math.min(0.9, 0.35 + ((a[1] - y) / vh) * 0.5) });
    };
    let lastSettle = window.scrollY;
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
      window.clearTimeout(settle);
      settle = window.setTimeout(settleIntro, SETTLE_MS);
      const y = window.scrollY;
      const prev = lastY;
      lastY = y;
      if (reduced || unlock || isNavigating() || y <= prev) return;
      const { vh, anchors: a } = geometry();
      // 한 번에 멀리 뛰는 이동(주소 링크 · 스크롤바 끌기)은 걸지 않는다
      if (y - prev >= vh) return;
      for (let i = 1; i <= n; i++) {
        // 휠이 걸린 자리는 8px 앞에서 닿은 것으로 — 부드러운 스크롤이 마지막 1px에 늘어져(0.2초) 걸림이 길어 보였다
        const reach = a[i] - (held === a[i] ? 8 : 0.5);
        if (prev < reach && y >= reach) return catchAt(a[i]);
      }
    };
    // 크기 · 글꼴이 바뀌면 다시 재서 그리기만 한다 — 자리 맞추기는 사용자 스크롤에만
    const onResize = () => {
      fit();
      // 재고 바로 그린다 — 글꼴 크기가 바뀐 프레임에 옛 배율이 한 번 보이지 않게
      cancelAnimationFrame(raf);
      tick();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onResize();
    document.fonts.ready.then(() => ref.current && onResize()); // 글꼴이 들어오면 폭이 바뀐다
    // 개발용: window.__philosophyTick()로 지금 스크롤 자리의 장면을 바로 그린다(검증 · 스크린샷 — 숨은 창에선 프레임이 돌지 않는다)
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__philosophyTick = tick;
    return () => {
      setWheelFilter(null);
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      if (unlock) {
        window.clearTimeout(unlock);
        lockScrollInput(false);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      title.style.transform = title.style.fontSize = title.style.filter = title.style.willChange = '';
      body.style.opacity = body.style.transform = '';
    };
  }, [paragraphs.length]);

  // 지난 단락 · 지금 단락은 다 드러나 있고(시간으로), 다음 단락은 아직. 무대가 들어오기 전엔 모두 숨김
  const fill = (i: number) => (shown && i <= at ? 1 : 0);

  return (
    <section
      ref={ref}
      id="philosophy"
      className="philosophy"
      aria-labelledby="philosophy-title"
      data-shown={shown}
      style={{ '--ph-n': paragraphs.length, '--ph-step': STEP, '--ph-intro': INTRO } as CSSProperties}
    >
      {/* 섹션 전체가 십자선 영역 — 포인터를 늘 십자선 · 좌표가 따라다닌다(phi.design data-hero-crosshair-zone) */}
      <VectorGuides zone={ref} />
      <div className="philosophy__track">
        <div className="philosophy__stage">
          {/* 제목은 한 줄(사용자 지시 2026-10-23) */}
          <h2 id="philosophy-title" className="philosophy__title">
            {title.split(' ').map((w, i) => (
              <Fragment key={w}>
                {i > 0 && ' '}
                <VectorWord word={w} />
              </Fragment>
            ))}
          </h2>
          <div className="philosophy__body">
            <div className="philosophy__paras">
                {paragraphs.map((sentences, i) => (
                  <div key={i} className="philosophy__para" data-state={i < at ? 'past' : i > at ? 'next' : 'now'}>
                    {sentences.map((s, j) => (
                      <ScrollReveal
                        key={j}
                        as="p"
                        containerClassName={`philosophy__sentence sr-plain${strong(s) ? ' philosophy__sentence--strong' : ''}`}
                        mode="scrub"
                        splitBy="chars"
                        effect="fade"
                        stagger={0.05}
                        duration={0.8}
                        smoothing={1} // 한 문장이 드러나는 시간(초) — 2 → 1, 두 배 빠르게(사용자 지시 2026-10-24)
                        baseOpacity={0.1}
                        baseRotation={0}
                        baseOffset={0}
                        enableBlur={false} // 흐림 없이 옅은 글자에서 진해지기만(사용자 지시 2026-10-27 — 히어로의 블러 효과 제거)
                        // 단락이 자리 잡으면 문장이 차례로 시간으로 끝까지 드러난다
                        progress={fill(i)}
                        delay={j * SENTENCE_GAP}
                      >
                        {sentence(strong(s) ? s.slice(2) : s)}
                      </ScrollReveal>
                    ))}
                  </div>
                ))}
            </div>
          </div>
          {/* 아래로 스크롤하라는 화살표(사용자 지시 2026-10-27) — 단락 아래와 무대 맨 아래의 가운데, 옅어졌다 진해졌다를 되풀이 */}
          <span className="philosophy__hint" data-on={shown} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v15M5.5 12.5 12 19l6.5-6.5" />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
