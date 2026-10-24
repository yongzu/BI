import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { CourseType } from '../../data/programs';
import { lockScrollInput, scrollToTarget } from '../../smoothScroll';
import './CurriculumEntry.css';

/**
 * 커리큘럼 들어가는 길(사용자 지시 2026-10-24) — 역량과 태도 아래로 들어오면 커리큘럼으로 빨려 들어가는 무대.
 * 모션 참고: Notion 콘셉트 광고 리크리에이션(@schurhauz) 1–3초 — 화면을 채우는 큰 굵은 글자 더미가 릴처럼 빠르게 굴러가다
 * 천천히 멈추고(ease-out), 멈춘 뒤 옆으로 빠져나간다. 움직임 흐림은 뺐다.
 *
 * 들어오면 한 번에 끝까지 저절로 진행된다(사용자 지시 2026-10-24 — 스크롤로 한 단계씩 넘기지 않는다). 그동안 스크롤은 잠긴다:
 * 0. 무대 맨 위가 화면 60% 높이에 닿으면 시작 — 페이지가 무대 자리로 미끄러져 붙는다(START_SCROLL).
 *    커리큘럼 제목 · 리드는 미리 보이지 않는다(사용자 지시 2026-10-24) — 무대가 먼저, 제목은 3에서 함께 나온다.
 * 1. 과목 분류(Fundamental … Event)가 아주 큰 글씨로 촘촘히 쌓여 아래에서 올라온다. Fundamental이 가운데 줄.
 * 2. 올라오는 것과 동시에(Fundamental에서 머물지 않고 — 사용자 지시 2026-10-24) 가운데 줄이 Fundamental → Event로 순서대로
 *    내려가며(글자 더미는 위로) 빨리 출발해 천천히 선다(4제곱 ease-out — 지수 곡선은 너무 빨라 되돌렸다, 사용자 지시 2026-10-24).
 *    가운데 줄의 분류만 검정, 나머지는 회색.
 * 3. Event에 거의 다 닿을 즈음(릴이 다 서기 전에 — 섰다가 다시 출발하면 뚝 끊겨 보였다) 큰 분류 이름들이 빠르게 줄어들며
 *    (진하기는 실제 탭처럼 고른 분류만 검정으로) 왼쪽으로 미끄러져 실제 과목 분류 탭 자리로 각자 들어간다(줄마다 조금씩 늦게).
 *    (탭 목록을 화면 세로 가운데에 두고 회색 글자는 제자리에서 사라지게 한 시안은 되돌렸다 — 사용자 지시 2026-10-24)
 * 4. 다 줄어든 뒤에 실제 커리큘럼(제목 · 리드 · 분류 머리글 · 수업 줄 · 탭의 수와 설명)이 진해진다(사용자 지시 2026-10-24 —
 *    줄어드는 동안 함께 나오니 어색했다). 탭 이름은 그동안 무대 글자가 대신하다가, 끝에서 실제 탭 이름으로 바뀌고 스크롤이 풀린다.
 * 다시 역량과 태도까지 올라가면(무대가 화면 아래로 다 빠지면) 처음 상태로 돌아가 다음에 또 진행된다.
 * 목차 등으로 무대를 건너뛰어 커리큘럼 안쪽에 바로 오면 진행 없이 끝난 상태로 둔다.
 *
 * 이어 붙이는 법: 실제 커리큘럼은 무대 바로 뒤에 놓되, 위로 (화면 높이 − LAND_TOP)만큼 끌어올려 무대와 겹친다.
 * 무대는 붙는 길이 없이 한 화면 — 무대 맨 위가 화면 맨 위일 때(진행 중 잠긴 스크롤) 실제 커리큘럼 맨 위가 이미 LAND_TOP에 서 있다.
 * 그래서 무대가 사라지기 전에 실제 커리큘럼을 제자리에서 보여 줄 수 있다.
 * 분류 이름이 날아갈 자리 = 그 스크롤에서 실제 탭 이름이 설 화면 위치(지금 위치 − 남은 스크롤) — 매 프레임 실제 탭을 재서 정한다.
 * 그동안 실제 커리큘럼은 투명하다(키보드로 들어오면 끝으로 건너뛴다).
 * 좁은 화면 · 낮은 창 · 움직임 줄이기: 무대 없이 원래 커리큘럼 그대로.
 */
type Props = { types: CourseType[]; children: ReactNode };

/** 진행이 끝났을 때 실제 커리큘럼 맨 위(분류 머리글)가 서는 화면 높이(px) — 탭을 누를 때와 같은 56(CourseExplorer TABS_TOP).
 *  섹션 제목을 뺀 뒤(2026-10-24) 탭이 최대한 위에 서야 Event 탭이 화면 아래 끝에 붙지 않는다 */
const LAND_TOP = 56;
/** 무대가 붙어 있는 스크롤 길이 — 진행은 시간으로 하므로 없다(무대 = 한 화면) */
const PIN_SCREENS = 0;
/** 무대 맨 위가 이 높이(화면 비율) 위로 올라오면 시작 */
const TRIGGER = 0.6;
/** 가운데 줄 — 무대 높이에 대한 비율 */
const FOCUS = 0.5;
/** 진행 시간표(ms) — 시작부터 */
const START_SCROLL = 600; // 무대 자리로 미끄러져 붙기
const ENTER_MS = 350; // 글자 더미가 올라오며 진해지기
const ROLL_AT = 200; // 다 진해지기 전에 굴러가기 시작 — 예전 450ms는 Fundamental에서 멈춰 보였다
const ROLL_MS = 1500; // 가운데 줄이 Fundamental → Event
const SHRINK_AT = ROLL_AT + ROLL_MS * 0.6; // 릴이 97% 온 즈음 — 다 서기 전에 이어서
const SHRINK_MS = 560; // 줄어들며 왼쪽 탭으로
const STAGGER = 28; // 줄마다 늦게
const REVEAL_MS = 420; // 다 줄어든 뒤 실제 커리큘럼이 진해지기
const MEDIA = '(min-width: 901px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
/** 릴 — 영상처럼 빨리 출발해 길게 천천히 서는 곡선 */
const rollOut = (t: number) => 1 - (1 - t) ** 4;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function CurriculumEntry({ types, children }: Props) {
  const [on, setOn] = useState(() => window.matchMedia(MEDIA).matches);
  const [done, setDone] = useState(false);
  const introRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const mq = window.matchMedia(MEDIA);
    const sync = () => setOn(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const intro = introRef.current;
    const stage = stageRef.current;
    const content = contentRef.current;
    if (!on || !intro || !stage || !content) return;
    const reel = stage.querySelector<HTMLElement>('.ce-intro__reel')!;
    const names = [...stage.querySelectorAll<HTMLElement>('.ce-intro__name')];
    const last = names.length - 1;
    const shrunk = SHRINK_AT + SHRINK_MS + last * STAGGER; // 마지막 줄까지 다 줄어든 때
    const end = shrunk + REVEAL_MS;
    let base: { left: number; top: number; height: number }[] = [];
    let raf = 0;
    let phase: 'idle' | 'play' | 'done' = 'idle';
    let t0 = 0;
    let locked = false;

    // 분류 이름의 원래 자리(무대 기준, 변형 없이) — 폭 · 글꼴이 바뀔 때만 다시 잰다
    const measure = () => {
      reel.style.transform = 'none';
      names.forEach((n) => { n.style.transform = 'none'; });
      const s = stage.getBoundingClientRect();
      base = names.map((n) => {
        const r = n.getBoundingClientRect();
        return { left: r.left - s.left, top: r.top - s.top, height: r.height };
      });
      tick();
    };

    /** 진행 ms 지점의 모습 — idle은 보이지 않는 처음, done은 탭에 겹친 끝 */
    const render = (ms: number) => {
      if (!base.length) return;
      const r = intro.getBoundingClientRect();
      const pin = intro.offsetHeight - window.innerHeight;
      const remaining = r.top + pin; // 커리큘럼 자리(무대가 끝나는 스크롤)까지 남은 스크롤
      const s = stage.getBoundingClientRect();

      // 실제 탭 이름 자리 — 커리큘럼 자리(무대가 끝나는 스크롤)에서 설 화면 위치(지금 위치 − 남은 스크롤)
      const targets = [...content.querySelectorAll<HTMLElement>('.course-tab__name')].map((el) => {
        const t = el.getBoundingClientRect();
        return { left: t.left, center: t.top - remaining + t.height / 2, height: t.height };
      });
      const tabs = [...content.querySelectorAll<HTMLElement>('.course-tab')];
      const current = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));

      // 1. 올라오기 · 2. 릴(가운데 줄 = pos). 가운데 줄은 굴러가는 동안 화면 가운데에서 Event 탭 높이로 함께 내려간다 —
      //    다 굴렀을 때 Event가 이미 자기 탭 높이에 있어, 줄어들 땐 왼쪽으로만 간다(사용자 지시 2026-10-24 — 아래로 빨려 들어가 보였다)
      const a = phase === 'idle' ? 0 : easeOut(clamp01(ms / ENTER_MS));
      const pos = last * rollOut(clamp01((ms - ROLL_AT) / ROLL_MS));
      const lo = Math.floor(pos);
      const hi = Math.min(lo + 1, last);
      const mid = (i: number) => base[i].top + base[i].height / 2;
      // 단, 큰 Event 글자가 화면 아래로 잘리지 않을 만큼만 내려간다(낮은 화면에선 줄어들 때 조금 내려간다)
      const lowest = s.height - base[last].height / 2; // 글자 상자(줄 높이 1.2)의 아래 끝 = 화면 아래 끝 — 글자 획은 그 안쪽
      const endFocus = Math.min(lowest, targets[last] ? targets[last].center - s.top : s.height * FOCUS);
      const focusY = lerp(s.height * FOCUS, endFocus, pos / last);
      const reelY = focusY - lerp(mid(lo), mid(hi), pos - lo);
      reel.style.opacity = String(a);
      reel.style.transform = `translateY(${reelY + (1 - a) * 160}px)`;
      // 다 줄어든 뒤 실제 커리큘럼이 진해진다(탭 이름은 CSS로 끝까지 숨김 — 무대 글자가 그 자리에 있다)
      content.style.opacity = phase === 'done' ? '' : String(easeOut(clamp01((ms - shrunk) / REVEAL_MS)));

      // 3. 줄어들며 왼쪽으로 — 실제 탭 이름 자리로(줄마다 조금씩 늦게). 줄어드는 기준은 글자 왼쪽 가운데(CSS transform-origin)
      names.forEach((name, i) => {
        const t = targets[i];
        const b0 = base[i];
        if (!t || !b0) return;
        const c = easeInOut(clamp01((ms - SHRINK_AT - i * STAGGER) / SHRINK_MS));
        const dx = t.left - (s.left + b0.left);
        const dy = t.center - (s.top + mid(i) + reelY);
        const k = t.height / b0.height;
        name.style.transform = `translate(${dx * c}px, ${dy * c}px) scale(${1 + (k - 1) * c})`;
        // 가운데 줄에 온 분류만 검정, 나머지는 회색 → 날아가며 실제 탭의 진하기로(고른 탭은 진하게, 나머지는 3단계 글자)
        const focus = lerp(0.25, 1, Math.max(0, 1 - Math.abs(i - pos)));
        name.style.opacity = String(lerp(focus, i === current ? 1 : 0.72, c));
      });
    };

    // 진행 중엔 휠 · 터치 · 스크롤 키를 막는다(lockScrollInput — 스크롤바를 건드리지 않아 화면이 다시 배치되지 않는다)
    const lock = (on: boolean) => { if (on !== locked) { locked = on; lockScrollInput(on); } };
    const introTop = () => intro.getBoundingClientRect().top + window.scrollY;
    const pinPx = () => intro.offsetHeight - window.innerHeight;

    const start = (now: number) => {
      phase = 'play';
      t0 = now;
      lock(true);
      scrollToTarget(introTop(), { duration: START_SCROLL / 1000 });
    };
    /** 끝: jump면 커리큘럼 자리로 옮긴다(무대는 붙은 채라 그대로 보인다) */
    const finish = (jump: boolean) => {
      if (jump) scrollToTarget(introTop() + pinPx(), { immediate: true });
      if (phase === 'play') {
        lock(false);
      }
      phase = 'done';
      render(end);
      setDone(true);
    };
    skipRef.current = () => { if (phase !== 'done') finish(true); };

    const tick = () => {
      raf = 0;
      const now = performance.now();
      const vh = window.innerHeight;
      const top = intro.getBoundingClientRect().top;
      if (phase === 'idle') {
        if (top <= -window.innerHeight * 0.3) return finish(false); // 무대를 건너뛰어 이미 커리큘럼 안쪽
        if (top < vh * TRIGGER) start(now);
      } else if (phase === 'done' && top > vh) {
        phase = 'idle'; // 역량과 태도까지 돌아갔다 — 다음에 다시 진행
        setDone(false);
      }
      const ms = phase === 'play' ? now - t0 : phase === 'done' ? end : 0;
      if (phase === 'play' && ms >= end) return finish(true);
      render(ms);
      if (phase === 'play') raf = requestAnimationFrame(tick);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      lock(false);
      content.style.opacity = '';
    };
  }, [on]);

  // 끝나기 전에 키보드로 커리큘럼에 들어오면 끝으로 건너뛴다 — 투명한 채로 초점만 가 있지 않게
  const onFocus = () => {
    if (on && !done) skipRef.current();
  };

  return (
    <div className="ce" data-intro={on ? 'on' : 'off'} data-done={on && done} style={{ '--ce-pin': PIN_SCREENS, '--ce-land': `${LAND_TOP}px` } as React.CSSProperties}>
      {on && (
        <div ref={introRef} className="ce-intro">
          <div ref={stageRef} className="ce-intro__stage" aria-hidden="true">
            <ol className="ce-intro__reel">
              {types.map((t) => <li key={t.id} className="ce-intro__name">{t.name}</li>)}
            </ol>
          </div>
        </div>
      )}
      <div ref={contentRef} className="ce__content" onFocus={onFocus}>
        {children}
      </div>
    </div>
  );
}
