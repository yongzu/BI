import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { lockScrollInput, scrollToTarget } from '../../smoothScroll';
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
 * - 2026-10-27 자동 벡터(사용자 지시 — 벡터 인터랙션을 제대로 경험하지 못하는 것 같다): 제목은 점만 한 크기(DOT_PX)에서 시작해 커지고,
 *   커지는 동안 낱말이 차례로 벡터(윤곽 · 앵커 · 그 낱말의 바운딩 박스)가 되며, 끝 크기에 닿으면 세 낱말을 한 바운딩 박스로 묶어 보인다.
 *   위에서 내려와 무대가 붙으면 저절로 재생된다 — 커진 자리(끊어 넘기기 자리 1)까지 PLAY_S초 동안 일정한 속도로 스크롤하고(그동안 입력을 막는다),
 *   거기서 멈춰 묶음 벡터를 보여 준다. 다음 스크롤에 제목이 올라가며 벡터가 풀리고 단락이 나온다. 손으로 스크롤해도 같은 장면이 스크롤을 따른다.
 * 단락마다 스크롤 STEP(화면 높이 배수). 움직임 줄이기면 붙는 무대 없이 제목과 단락을 차례로 쌓는다(CSS).
 */
type Props = { title: string; paragraphs: string[][] };

/** 한 단락이 쓰는 스크롤 길이(화면 높이 배수) */
const STEP = 1.2;
/** 제목이 커지는 스크롤 길이(화면 높이 배수) */
const INTRO = 1;
/** 처음 제목 폭(px) — 점처럼(사용자 지시 2026-10-27). 이전엔 화면 폭 × 0.3(최소 260px) */
const DOT_PX = 8;
/** 자동 재생: 점 → 끝 크기(커진 자리)까지 걸리는 시간(초) */
const PLAY_S = 3;
/** 커지는 몫(0 – 1) 중 낱말 i가 벡터가 되는 지점 · 세 낱말을 한 묶음으로 보이는 지점 */
const VEC_AT = [0.2, 0.42, 0.64];
const GROUP_AT = 0.92;
/** 제자리로 올라가는 몫(0 – 1) 중 벡터가 풀리는 지점 */
const VEC_END = 0.35;
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
  const [vecN, setVecN] = useState(0); // 자동 벡터가 된 제목 낱말 수
  const guideRef = useRef<HTMLDivElement>(null);

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
    let idx = -1; // 마지막으로 맞춘 자리: 0 = 점 제목, 1 = 커진 제목(묶음 벡터), 2 … n + 1 = 단락, n + 2 = 무대가 풀리는 자리. -1 = 바깥
    let lastY = window.scrollY;
    let prevY = window.scrollY; // 자동 재생: 내려오는 중인지
    let unlock = 0;
    let atShown = 0; // 보이는 단락 — 스크롤이 가리키는 단락보다 늦을 수 있다(hold)
    let wasOn = false;
    let holdUntil = 0;
    let holdTimer = 0;
    // 단락 i가 다 드러나는 시간(ms): 문장이 SENTENCE_GAP초 간격으로 시작해 마지막 문장이 READ_S초 동안 드러난다
    const hold = (i: number) => ((paragraphs[i].length - 1) * SENTENCE_GAP + READ_S) * 1000;
    // 맞출 자리(페이지 y): 0 = 무대가 붙는 순간(점 제목), 1 = 제목이 끝 크기로 커진 자리, i + 2 = 단락 i가 지금이 되는 지점, 끝 = 무대가 풀리는 자리
    const geometry = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const top = window.scrollY + r.top;
      const span = r.height - vh; // 무대가 붙어 있는 동안의 스크롤 길이
      const intro = INTRO * vh;
      const seg = (span - intro) / n;
      const anchors = [top, Math.round(top + GROW * intro), ...Array.from({ length: n }, (_, i) => Math.round(top + intro + seg * i) + 1), top + span];
      return { r, vh, span, intro, seg, anchors };
    };
    // 제목을 무대 글줄 폭(양옆 --gutter 안)에 꽉 차게 — 글꼴 크기에 폭이 비례하니 한 번 재서 맞춘다(사용자 지시 2026-10-24)
    const fit = () => {
      const cs = getComputedStyle(stage);
      const avail = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const fs = parseFloat(getComputedStyle(title).fontSize);
      if (title.offsetWidth > 0) title.style.fontSize = `${((fs * avail) / title.offsetWidth).toFixed(2)}px`;
    };
    const tick = () => {
      raf = 0;
      const { r, vh, span, intro } = geometry();
      // 몰입(v21): 0 = 화면 가운데 작은 제목 → GROW = 가운데에서 꽉 찬 폭 → 1 = 제자리(위)
      const k = reduced ? 1 : Math.min(1, Math.max(0, -r.top / intro));
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2); // easeInOutCubic
      const pA = Math.min(1, k / GROW); // 커지는 몫
      const pB = Math.max(0, (k - GROW) / (1 - GROW)); // 제자리로 올라가는 몫
      const eA = 1 - (1 - pA) ** 3; // easeOutCubic — 점에서 빨리 읽히는 크기로 커진 뒤 천천히 끝 크기로
      const eB = ease(pB);
      if (!reduced) {
        const w = title.offsetWidth;
        const h = title.offsetHeight;
        const s0 = Math.min(1, DOT_PX / w);
        const sc = s0 ** (1 - eA); // 크기는 비율로 커져야 고르게 보인다
        // 제목은 가로 가운데에 놓여 있어(CSS) 가운데를 축으로 키우면 된다. 세로는 ① 화면 가운데 → ② 제자리(무대가 붙어 있어 무대 위 = 화면 위)
        const ty = (vh / 2 - (title.offsetTop + h / 2)) * (1 - eB);
        title.style.transform = k >= 1 ? '' : `translate(0, ${ty.toFixed(1)}px) scale(${sc.toFixed(4)})`;
        // 단락 칸은 ②를 따라 페이드인 — v21: 제목과 함께 올라온다(제목 밑에 붙어, 24px 더 아래에서 제자리로). 따로 두면 올라오는 제목과 겹쳤다
        body.style.opacity = eB >= 1 ? '' : eB.toFixed(3);
        body.style.transform = eB >= 1 ? '' : `translateY(${(ty + (1 - eB) * 24).toFixed(1)}px)`;
      }
      // 큰 제목인 동안은 벡터 인터랙션 · 십자선을 꺼 둔다
      setVectorZone(root, k >= 1);
      // 자동 벡터: 커지며 낱말이 차례로 → 끝 크기에선 한 묶음 → 올라가며 풀린다
      const live = !reduced && k > 0 && pB < VEC_END;
      const nOn = live ? VEC_AT.filter((v) => pA >= v).length : 0;
      setVecN(nOn);
      const words = [...title.querySelectorAll<SVGGElement>('.vw__glyphs')].map((g) => g.getBoundingClientRect());
      let box: DOMRect | null = null;
      if (live && pA >= GROUP_AT && words.length) {
        const l = Math.min(...words.map((b) => b.left));
        const t = Math.min(...words.map((b) => b.top));
        box = new DOMRect(l, t, Math.max(...words.map((b) => b.right)) - l, Math.max(...words.map((b) => b.bottom)) - t);
      } else if (nOn > 0) box = words[nOn - 1] ?? null;
      drawGuide(box);
      // 자동 재생: 위에서 내려와 무대가 막 붙었으면(점 제목) 커진 자리까지 저절로 간다
      const down = window.scrollY > prevY;
      prevY = window.scrollY;
      if (!reduced && down && idx < 0 && k > 0 && pA < 0.5 && performance.now() >= snapping) play();
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
      setAt(atShown);
    };
    // 자동 벡터의 바운딩 박스 · 안내선 · 좌표(VectorGuides와 같은 모양) — 매 프레임 자리를 다시 잰다
    const drawGuide = (b: DOMRect | null) => {
      const g = guideRef.current;
      if (!g) return;
      g.dataset.on = String(!!b);
      if (!b) return;
      const q = (key: string) => g.querySelector<HTMLElement>(`[data-g="${key}"]`)!;
      q('t').style.top = `${b.top}px`;
      q('b').style.top = `${b.bottom}px`;
      q('l').style.left = `${b.left}px`;
      q('r').style.left = `${b.right}px`;
      Object.assign(q('box').style, { left: `${b.left}px`, top: `${b.top}px`, width: `${b.width}px`, height: `${b.height}px` });
      [[b.left, b.top], [b.right, b.top], [b.left, b.bottom], [b.right, b.bottom]].forEach(([x, y], i) =>
        Object.assign(q(`h${i}`).style, { left: `${x}px`, top: `${y}px` }),
      );
      q('lt').style.top = `${b.top}px`;
      q('lt').textContent = `(${Math.round(b.left)},${Math.round(b.top)})`;
      q('lb').style.top = `${b.bottom}px`;
      q('lb').textContent = `(${Math.round(b.right)},${Math.round(b.bottom)})`;
    };
    // 점 제목 → 커진 제목(자리 1)까지 일정한 속도로 저절로 — 그동안 사용자 스크롤은 막는다
    const play = () => {
      const { anchors: a } = geometry();
      idx = 1;
      snapping = performance.now() + PLAY_S * 1000 + 120;
      lockScrollInput(true);
      window.clearTimeout(unlock);
      unlock = window.setTimeout(() => lockScrollInput(false), PLAY_S * 1000);
      scrollToTarget(a[1], { duration: PLAY_S, easing: (t) => t });
    };
    const snap = () => {
      const y = window.scrollY;
      const down = y >= lastY;
      lastY = y;
      if (reduced || performance.now() < snapping) return;
      const { vh, anchors: a } = geometry();
      const last = n + 2;
      if (y < a[0] - 2 || y > a[last] + 2) {
        idx = -1; // 무대 밖 — 맞추지 않는다
        return;
      }
      let target: number;
      if (idx < 0) {
        // 바깥에서 들어왔다: 내려오는 중이면 커진 제목(묶음 벡터), 올라오는 중이면 마지막 단락
        target = down ? 1 : n + 1;
      } else {
        const d = y - a[idx];
        target = d > SNAP_PX ? idx + 1 : d < -SNAP_PX ? idx - 1 : idx;
        if (target < 0) return; // 큰 제목에서 위로 — 무대 밖으로 나가게 둔다
      }
      target = Math.min(last, target);
      // 막 드러난 단락을 읽는 중이면 그 단락 자리로 되돌린다(내용이 나오자마자 넘어가지 않게, 사용자 지시 2026-10-23)
      if (atShown + 2 < target && performance.now() < holdUntil) target = atShown + 2;
      idx = target;
      const dist = Math.abs(a[target] - y);
      if (dist < 2) return;
      // 먼 거리(큰 제목 ↔ 첫 단락)는 조금 더 길게
      const dur = Math.min(1.1, Math.max(SNAP_S, 0.5 + (dist / vh) * 0.5));
      snapping = performance.now() + dur * 1000 + 120;
      scrollToTarget(a[target], { duration: dur });
    };
    const onScroll = () => {
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
      title.style.transform = title.style.fontSize = '';
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
      {/* 자동 벡터의 바운딩 박스 · 안내선(제목이 커지는 동안, 2026-10-27) — 자리는 tick이 바로 적는다 */}
      {createPortal(
        <div className="vguides" aria-hidden="true">
          <div ref={guideRef} className="vguides__group" data-on="false">
            <span className="vguides__h" data-g="t" />
            <span className="vguides__h" data-g="b" />
            <span className="vguides__v" data-g="l" />
            <span className="vguides__v" data-g="r" />
            <span className="vguides__box" data-g="box" />
            {[0, 1, 2, 3].map((i) => <span key={i} className="vguides__handle" data-g={`h${i}`} />)}
            <span className="vguides__label" data-g="lt" />
            <span className="vguides__label" data-g="lb" />
          </div>
        </div>,
        document.body,
      )}
      <div className="philosophy__track">
        <div className="philosophy__stage">
          {/* 제목은 한 줄(사용자 지시 2026-10-23) */}
          <h2 id="philosophy-title" className="philosophy__title">
            {title.split(' ').map((w, i) => (
              <Fragment key={w}>
                {i > 0 && ' '}
                <VectorWord word={w} auto={i < vecN} />
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
                        containerClassName="philosophy__sentence sr-plain"
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
                        {sentence(s)}
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
