import Lenis from 'lenis';

/**
 * Smooth wheel scrolling — started from the Phi Brain IPS page settings, then quickened
 * a little (사용자 지시 2026-09-22 — "너무 느리다"):
 * - lerp 0.07 → 0.09: a notch settles in about 0.7s instead of ~1s
 * - wheelMultiplier 0.9 → 1: each notch travels the browser's normal distance again
 * - touch stays native; nothing is created when the user asks for reduced motion
 */
export const lenis: Lenis | null = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? null
  : new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: true });

// No hover pause while scrolling: turning pointer events off during the glide (as the IPS page
// does) swallowed any click made mid-scroll — the press lands on <html> before anything can turn
// them back on (사용자 제보 2026-09-22). Clicks always work now.

/**
 * Where the browser's own scrollIntoView({block:'start'}) would put an element: its layout top
 * (offsetTop chain — ignores the rise-in transform a not-yet-revealed section still carries,
 * which getBoundingClientRect would count) minus scroll-margin-top and the root's scroll-padding-top.
 */
function layoutTop(el: HTMLElement) {
  let top = 0;
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) top += n.offsetTop;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  return Math.max(0, top - margin - padding);
}

/** easeOutCubic — 빨리 출발해 부드럽게 멈춘다 */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * Scroll to a page Y or an element (scroll-margin / scroll-padding respected), smooth when Lenis runs.
 * `duration`(초)을 주면 Lenis의 느린 따라붙기(lerp) 대신 그 시간 안에 easeOut으로 간다 — 빠른 화면 전환용(2026-10-20)
 */
export function scrollToTarget(target: number | HTMLElement, { immediate = false, duration }: { immediate?: boolean; duration?: number } = {}) {
  if (lenis) {
    const y = typeof target === 'number' ? target : layoutTop(target);
    lenis.scrollTo(y, duration && !immediate ? { duration, easing: easeOut, force: true } : { immediate, force: true });
    return;
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' });
}

/** 연출 중 막는 키 — 스크롤을 움직이는 키 */
const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ']);
/** capture 단계에서 막아 Lenis까지 가지 않게 한다 */
const BLOCK = { capture: true, passive: false } as const;
const blockInput = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
const blockKeys = (e: Event) => { if (SCROLL_KEYS.has((e as KeyboardEvent).key)) blockInput(e); };
let locks = 0;
/**
 * 연출이 저절로 진행되는 동안 사용자의 스크롤 입력(휠 · 터치 · 스크롤 키)을 막는다 — 커리큘럼 들어가는 길(CurriculumEntry) ·
 * 교육 철학 → 역량과 태도 이어 주기(VectorHandoff). 여럿이 겹쳐 걸어도 마지막 하나가 풀릴 때 풀린다.
 * lenis.stop()은 쓰지 않는다 — html에 overflow: clip(index.css .lenis-stopped)이 붙어 스크롤바가 사라졌다 돌아오며
 * 페이지 폭이 바뀌어, 끝난 직후 화면 전체가 한 번 다시 배치되며 지직거렸다(사용자 제보 2026-10-24)
 */
export function lockScrollInput(on: boolean) {
  const before = locks;
  locks = Math.max(0, locks + (on ? 1 : -1));
  if (before === 0 && locks === 1) {
    window.addEventListener('wheel', blockInput, BLOCK);
    window.addEventListener('touchmove', blockInput, BLOCK);
    window.addEventListener('keydown', blockKeys, BLOCK);
  } else if (before === 1 && locks === 0) {
    window.removeEventListener('wheel', blockInput, BLOCK);
    window.removeEventListener('touchmove', blockInput, BLOCK);
    window.removeEventListener('keydown', blockKeys, BLOCK);
  }
}

/**
 * 여닫을 때 누른 박스를 화면의 같은 자리에 붙잡아 둔다(사용자 제보 2026-10-05: 워크숍을 닫으면 화면이 아래로 내려가는 듯했다).
 * 원인: 한 번에 모두 여닫히므로 누른 박스 위의 박스 · 줄들도 함께 늘거나 줄어, 스크롤 위치는 그대로인데 내용이 딸려 움직였다.
 * 여닫히는 동안(0.48초 + 여유) 프레임마다 박스가 움직인 만큼 스크롤을 같이 옮겨 박스가 제자리에 머문다.
 * 펼칠 때 누른 박스를 화면 가운데로 옮기던 자동 스크롤은 방해된다고 해 없앴다(사용자 지시 2026-10-05) — 박스는 누른 자리 그대로.
 * 역량과 태도 · 수업 장치(ProgramsPage)와 주요 수업들(CourseExplorer — 다른 수업을 누르면 위에서 펼쳐 있던 수업이 접힌다)이 쓴다.
 * 사용자가 휠 · 터치 · 키보드 · 스크롤바로 직접 스크롤을 시작하면 즉시 손을 뗀다 — 프레임마다 스크롤을 덮어쓰던 동안엔
 * 여닫히는 0.6초 내내 휠이 먹지 않았다(사용자 제보 2026-10-05: 인터랙션 도중에도 스크롤할 수 있게).
 */
const USER_SCROLL_EVENTS = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;
export function keepInPlace(target: HTMLElement, ms = 600) {
  const startTop = target.getBoundingClientRect().top;
  const end = performance.now() + ms;
  let released = false;
  // 누른 그 클릭(pointerdown)은 이미 지나갔으므로, 여기서 듣는 건 그 뒤의 사용자 입력뿐이다
  const release = () => { released = true; };
  USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, release, { passive: true, capture: true }));
  const cleanup = () => USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, release, { capture: true }));
  const frame = (now: number) => {
    if (released) return cleanup();
    const delta = target.getBoundingClientRect().top - startTop;
    if (Math.abs(delta) >= 0.5) scrollToTarget(Math.max(0, window.scrollY + delta), { immediate: true });
    if (now < end) requestAnimationFrame(frame);
    else cleanup();
  };
  requestAnimationFrame(frame);
}

/**
 * 목차 이동 중 표시(사용자 지시 2026-10-27 — 역량과 태도에서 연간 구조 · 채용 연계로 가는 동안 커리큘럼 들어가는 길이 저절로 진행되며
 * 스크롤을 붙잡아 이동이 막혔다). 목차가 이동을 시작할 때 켜고, 스크롤이 SETTLE_MS 동안 멈추면 꺼진다.
 * 저절로 진행되는 연출(CurriculumEntry)은 이 동안 시작하지 않고 끝난 모습으로 건너뛴다.
 */
let navigating = false;
let navTimer = 0;
const NAV_SETTLE_MS = 250;
const endNavigation = () => {
  navigating = false;
  window.removeEventListener('scroll', onNavScroll);
};
const onNavScroll = () => {
  window.clearTimeout(navTimer);
  navTimer = window.setTimeout(endNavigation, NAV_SETTLE_MS);
};
export function markNavigation() {
  navigating = true;
  window.clearTimeout(navTimer);
  navTimer = window.setTimeout(endNavigation, 600); // 스크롤이 일어나지 않으면(이미 그 자리) 곧 끈다
  window.addEventListener('scroll', onNavScroll, { passive: true });
}
export const isNavigating = () => navigating;
