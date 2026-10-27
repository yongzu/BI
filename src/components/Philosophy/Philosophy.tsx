import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { holdAutoplay, isNavigating, lockScrollInput, scrollToTarget } from '../../smoothScroll';
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
 * - 단락마다 끊어 넘긴다(사용자 지시 2026-10-23 — 스크롤에 따라 반쯤 흐린 글이 남았다): 무대가 붙어 있는 동안 스크롤이 멈추면
 *   단락 자리로 맞춰 간다. 지금 단락에서 SNAP_PX 넘게 내려왔으면 다음 단락, 올라갔으면 이전 단락, 아니면 제자리로.
 *   마지막 단락에서 더 내리면 무대가 풀리는 자리로 보내 다음 섹션으로 이어진다. 바깥에서 들어오면 위에선 첫 단락, 아래에선 마지막 단락으로.
 *   글은 스크롤 위치(scrub)가 아니라 단락이 자리 잡으면 시간으로 끝까지 드러난다 — 문장은 차례로(SENTENCE_GAP초 간격).
 * - v19(사용자 지시 2026-10-23): 오른쪽 Φ 모션그래픽(PhiMotion)을 뺐다 — v18엔 단락 오른쪽에 화면 밖으로 잘리는 큰 Φ가 있었다.
 * - v19 몰입(사용자 지시 2026-10-23): 무대 앞에 INTRO 화면 높이만큼의 길을 더 두고, 그동안 제목이 화면을 넘칠 만큼 크게(화면 폭의 INTRO_WIDTH배)
 *   화면 가운데 있다가 스크롤을 따라 제자리 크기 · 자리로 줄어든다. 제목엔 떠오름(StaggeredFadeIn)을 쓰지 않는다.
 *   두 단계(사용자 지시 2026-10-23): ① SHRINK 몫 동안 화면 가로 가운데 · 제목 본래 높이(세로 가운데 선)에 선 채 제 크기로 줄고,
 *   ② 나머지 동안 같은 높이에서 왼쪽 제자리로 옮겨 가며
 *   단락 칸이 함께 페이드인된다(스크롤을 따라). 큰 제목인 동안(① ~ ②)은 벡터 인터랙션 · 십자선을 꺼 둔다(setVectorZone).
 *   끊어 넘기기도 큰 제목 자리(0) → 단락들(1 … n) → 무대가 풀리는 자리(n + 1) 순서로 맞춘다.
 * - 머묾(사용자 지시 2026-10-23 — 스크롤하다 보면 내용이 나오자마자 넘어갔다): 막 드러난 단락은 문장이 다 드러날 때까지(hold) 다음 단락으로
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
/** 처음 제목 폭 = 화면 폭 × 이 값 — v21: 1.7(화면을 넘친다) → 0.3(가운데 작게, 사용자 지시 2026-10-24) → 0.12(더 작게, 2026-10-27) */
const INTRO_WIDTH = 0.12;
/** 처음 제목 폭의 하한(px) — 좁은 화면에서 아주 작아지지 않게 */
const INTRO_MIN = 120;
/** 처음 흐림(화면 px) — 커지며 걷힌다(사용자 지시 2026-10-27) */
const INTRO_BLUR = 14;
/** 몰입 길 중 가운데에서 커지는 몫 — 나머지는 제자리(위)로 올라가며 단락이 페이드인 */
const GROW = 0.6;
/** 지금 단락 자리에서 이만큼(px) 넘게 움직이고 멈추면 다음 · 이전 단락으로 넘긴다 */
const SNAP_PX = 40;
/** 스크롤이 멈췄다고 보는 시간(ms) */
const SETTLE_MS = 140;
/** 단락 자리로 맞춰 가는 시간(초) */
const SNAP_S = 0.7;
/** 한 단락 안 문장들이 차례로 드러나는 간격(초) */
const SENTENCE_GAP = 0.45; // 0.9 → 0.45 — 두 배 빠르게(사용자 지시 2026-10-24)
/** 한 문장이 드러나 읽히는 시간(초) — 막 드러난 단락은 이만큼 머문 뒤에야 다음 단락으로 넘어간다 */
const READ_S = 0.6; // 1.2 → 0.6
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

  useEffect(() => {
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
    let snapping = 0; // 맞춰 가는 동안(이 시각까지)은 스크롤 멈춤을 무시한다
    let idx = -1; // 마지막으로 맞춘 자리: 0 = 큰 제목, 1 … n = 단락, n + 1 = 무대가 풀리는 자리. -1 = 바깥
    let lastY = window.scrollY;
    let atShown = 0; // 보이는 단락 — 스크롤이 가리키는 단락보다 늦을 수 있다(hold)
    let wasOn = false;
    let holdUntil = 0;
    let holdTimer = 0;
    // 다 읽었나(사용자 지시 2026-10-27 — 빠르게 스크롤하면 둘째 단락을 읽지 않고 역량과 태도로 넘어갔다):
    // 마지막 단락이 보이고 다 드러난 뒤(hold)에야 true. 무대 안에서 본 마지막 단락(lastOn), 무대에 들어와 있었나(inside)
    let readAll = false;
    let lastOn = 0;
    let inside = false;
    let guardY = window.scrollY; // 앞 스크롤 자리 — 무대 끝을 '이어서' 넘었는지(한 번에 뛰어넘은 이동은 막지 않는다)
    let unlock = 0;
    // 단락 i가 다 드러나는 시간(ms): 문장이 SENTENCE_GAP초 간격으로 시작해 마지막 문장이 READ_S초 동안 드러난다
    const hold = (i: number) => ((paragraphs[i].length - 1) * SENTENCE_GAP + READ_S) * 1000;
    // 맞출 자리(페이지 y): 0 = 무대가 붙는 순간(큰 제목), i = 단락 i - 1이 지금이 되는 지점, n + 1 = 무대가 풀리는 자리
    const geometry = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
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
        title.style.willChange = k >= 1 ? '' : 'transform';
        // 작을 때 흐렸다가 커지며 또렷하게 — 흐림은 변환 전에 걸리므로 화면에서의 흐림(INTRO_BLUR × 남은 몫)을 배율로 나눈다
        const blur = (INTRO_BLUR * (1 - eA)) / sc;
        title.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
        // 단락 칸은 ②를 따라 페이드인 — v21: 제목과 함께 올라온다(제목 밑에 붙어, 24px 더 아래에서 제자리로). 따로 두면 올라오는 제목과 겹쳤다
        body.style.opacity = eB >= 1 ? '' : eB.toFixed(3);
        body.style.transform = eB >= 1 ? '' : `translateY(${(ty + (1 - eB) * 24).toFixed(1)}px)`;
      }
      // 벡터 인터랙션 · 십자선은 늘 켠다(사용자 지시 2026-10-27 — 단락이 나오기 전, 제목이 커지는 동안에도 호버되게).
      // 예전(v19)엔 큰 제목인 동안 꺼 뒀다. 스크롤하는 동안 박스는 VectorGuides가 매 프레임 다시 잰다
      setVectorZone(root, true);
      // 단락 글자는 ②가 시작되면 드러나기 시작한다
      const on = k > GROW && r.bottom > vh * 0.4;
      setShown(on);
      const q = span > intro ? Math.min(0.999, Math.max(0, (-r.top - intro) / (span - intro))) : 0;
      const atT = Math.floor(q * n);
      // 막 드러난 단락은 다 읽힐 때까지(hold) 다음으로 넘기지 않는다 — 한 번에 한 칸씩, 되돌아갈 땐 바로
      const now = performance.now();
      if (!on) {
        atShown = atT;
        holdUntil = 0;
      } else if (!wasOn || atT < atShown) {
        atShown = atT;
        holdUntil = now + hold(atShown);
      } else if (atT > atShown) {
        if (now >= holdUntil) {
          atShown += 1;
          holdUntil = now + hold(atShown);
        }
        // 다 읽힐 때 다시 본다(그동안 스크롤이 멈춰 있어도)
        window.clearTimeout(holdTimer);
        holdTimer = window.setTimeout(onScroll, Math.max(0, holdUntil - now) + 16);
      }
      wasOn = on;
      if (on) {
        lastOn = atShown;
        if (atShown >= n - 1 && now >= holdUntil) readAll = true;
        else if (atShown < n - 1) readAll = false; // 앞 단락으로 되돌아갔다 — 다시 끝까지 읽어야
      }
      setAt(atShown);
    };
    const snap = () => {
      const y = window.scrollY;
      const down = y >= lastY;
      lastY = y;
      if (reduced || performance.now() < snapping) return;
      const { vh, anchors: a } = geometry();
      const last = n + 1;
      if (y < a[0] - 2 || y > a[last] + 2) {
        idx = -1; // 무대 밖 — 맞추지 않는다
        return;
      }
      let target: number;
      if (idx < 0) {
        // 바깥에서 들어왔다: 내려오는 중이면 첫 단락(제목이 끝까지 줄어든다), 올라오는 중이면 마지막 단락
        target = down ? 1 : n;
      } else {
        const d = y - a[idx];
        target = d > SNAP_PX ? idx + 1 : d < -SNAP_PX ? idx - 1 : idx;
        if (target < 0) return; // 큰 제목에서 위로 — 무대 밖으로 나가게 둔다
      }
      target = Math.min(last, target);
      // 막 드러난 단락을 읽는 중이면 그 단락 자리로 되돌린다(내용이 나오자마자 넘어가지 않게, 사용자 지시 2026-10-23)
      if (atShown + 1 < target && performance.now() < holdUntil) target = atShown + 1;
      idx = target;
      const dist = Math.abs(a[target] - y);
      if (dist < 2) return;
      // 먼 거리(큰 제목 ↔ 첫 단락)는 조금 더 길게
      const dur = Math.min(1.1, Math.max(SNAP_S, 0.5 + (dist / vh) * 0.5));
      snapping = performance.now() + dur * 1000 + 120;
      scrollToTarget(a[target], { duration: dur });
    };
    // 무대 끝을 지나쳤는데 아직 다 읽지 않았으면(빠른 스크롤 · 관성) 읽지 않은 단락으로 되돌린다 — 그동안 입력을 막고,
    // 무대 끝의 이어 주기(VectorHandoff)도 잠깐 멈춘다. 목차 · 맨 위로 이동(isNavigating)은 막지 않는다
    const guard = () => {
      if (reduced) return;
      const y = window.scrollY;
      const { vh, anchors: a } = geometry();
      const end = a[n + 1];
      const prev = guardY;
      guardY = y;
      if (y >= a[0] && y <= end + 2) {
        inside = true;
        return;
      }
      if (y < a[0]) inside = false;
      // 무대 안에서 스크롤이 이어져 끝을 막 넘은 순간만(앞 자리가 무대 안, 한 프레임 이동이 한 화면 미만).
      // 한 번에 멀리 뛰는 이동(주소 링크 · 스크롤바 끌기 · 목차)은 막지 않는다
      const crossed = prev <= end + 2 && y - prev < vh;
      if (!inside || !crossed || isNavigating() || performance.now() < snapping) return;
      const now = performance.now();
      if (readAll || (wasOn && atShown >= n - 1 && now >= holdUntil)) return;
      // 보던 단락이 아직 다 드러나지 않았으면 그 단락, 다 드러났으면 다음 단락(자리 i + 1 = 단락 i)
      const doneLast = now >= holdUntil;
      const target = Math.min(n, lastOn + 1 + (doneLast ? 1 : 0));
      const dur = 0.8;
      idx = target;
      inside = false; // 되돌아가며 다시 들어온다
      snapping = now + dur * 1000 + 120;
      // 그 단락은 되돌아가 닿은 뒤부터 다시 다 드러날 때까지 머문다 — 되돌아가는 동안 시간이 흘러 남은 관성에 바로 다시 넘어가지 않게
      atShown = target - 1;
      readAll = false;
      holdUntil = now + dur * 1000 + hold(atShown);
      holdAutoplay(dur * 1000 + 300);
      // 관성(트랙패드)이 남아 있는 동안도 막는다 — 되돌아간 뒤 0.4초 더
      lockScrollInput(true);
      window.clearTimeout(unlock);
      unlock = window.setTimeout(() => {
        unlock = 0;
        lockScrollInput(false);
      }, dur * 1000 + 400);
      scrollToTarget(a[target], { duration: dur });
    };
    const onScroll = () => {
      guard();
      if (!raf) raf = requestAnimationFrame(tick);
      window.clearTimeout(settle);
      settle = window.setTimeout(snap, SETTLE_MS);
    };
    const onResize = () => {
      fit();
      onScroll();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    onResize();
    document.fonts.ready.then(() => ref.current && onResize()); // 글꼴이 들어오면 폭이 바뀐다
    // 개발용: window.__philosophyTick()로 지금 스크롤 자리의 장면을 바로 그린다(검증 · 스크린샷 — 숨은 창에선 프레임이 돌지 않는다)
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__philosophyTick = tick;
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.clearTimeout(holdTimer);
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
                        enableBlur
                        blurStrength={2} // 4 → 2(사용자 지시 2026-10-24)
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
        </div>
      </div>
    </section>
  );
}
