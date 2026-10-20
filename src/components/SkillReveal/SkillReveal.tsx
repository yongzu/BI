import { useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Pillar } from '../../data/programs';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { SCROLL_REVEAL } from '../ScrollReveal/preset';
import './SkillReveal.css';

/**
 * 역량과 태도(v14, 2026-10-20) — v12(toss.im "광고 노출 전략도 다르게")처럼 세로 스크롤이 카드 줄의 가로 이동이 된다(사용자 지시 2026-10-20).
 *
 * - 왼쪽 정렬 제목 + 리드 아래 '역량' 줄, 그다음 줄에 'Phi OS' 줄(한 줄로 잇지 않고 줄을 나눈다).
 * - 줄마다 따로 붙는 무대: 무대(내용 높이)가 화면 세로 가운데에 붙은 채 세로로 스크롤하는 동안 그 줄의 카드가 화면 오른쪽에서
 *   들어와 왼쪽으로 흘러간다. 다섯 장이 양쪽 여백 사이에 딱 맞게 서면(첫 카드 왼쪽 = 제목 왼쪽 선, 마지막 카드 오른쪽 = 오른쪽 여백)
 *   무대가 풀려 페이지가 내려가고, 다음 줄에서 되풀이한다. 붙는 길이 = 그 줄이 가로로 움직이는 거리(스크롤 1px = 1px).
 *   무대 높이를 화면 전체가 아니라 내용만큼으로 해 두 줄 사이 여백이 예전의 절반쯤이다.
 * - 카드는 세로로 긴 한 장 — 이름 · 영문 · 전문이 처음부터 다 보인다.
 *   3D 기울기는 뒤의 카드 판(바탕 · 빛 · 그림자)에만 — 글자 층은 변형 없이 그 위에 있어 늘 또렷하고 끌어 고를 수 있다
 *   (예전 TiltedCard는 글자까지 기울여 흐렸다, 사용자 제보 2026-10-20).
 * - 카드는 기본으로 옅고 본문은 흐린 채 아래로 갈수록 옅어진다 — 마우스를 올린 카드만 진하고 또렷해진다(사용자 지시 2026-10-20).
 *   두 줄 모두 흰 카드(Phi OS 검정 카드는 되돌렸다). 오른쪽에서 들어오는 자리는 흐림 띠로 부드럽게.
 * 좁은 화면 · 움직임 줄이기 · 낮은 창: 붙는 무대 없이 줄마다 옆으로 넘기는 줄.
 */
export type SkillGroup = { label: string; items: Pillar[] };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 카드 판이 기우는 최대 각도(도) */
const TILT = 6;

export function SkillReveal({ title, lead, groups }: { title: string; lead: string; groups: SkillGroup[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rows = [...wrap.querySelectorAll<HTMLElement>('.sr-row')].map((row) => ({
      row,
      stage: row.querySelector<HTMLElement>('.sr-row__stage')!,
      track: row.querySelector<HTMLElement>('.sr-row__track')!,
      slots: [...row.querySelectorAll<HTMLElement>('.sr-card-slot')],
      travel: 0, // 줄이 가로로 움직이는 거리(px)
      startX: 0,
      top: 0, // 무대가 붙는 높이(화면 세로 가운데)
    }));
    const pinOn = window.matchMedia('(min-width: 1101px) and (min-height: 700px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let rightLine = 0; // 오른쪽 선(화면 x)
    /** 카드 폭 · 줄마다 출발 · 도착 자리 · 무대 길이를 잰다 — 붙는 상태(줄의 안쪽 여백이 달라진다)를 정한 뒤 프레임마다 */
    const measure = () => {
      const vw = document.documentElement.clientWidth; // 스크롤바를 뺀 보이는 폭
      // 왼쪽 선 = 화면에 보이는 소제목 · 제목의 왼쪽 선, 오른쪽 선 = 그와 대칭(무대는 100vw라 스크롤바 반만큼 비껴 있어 화면 좌표로 잰다)
      const label = wrap.querySelector<HTMLElement>('.sr-group__label');
      const wrapLeft = wrap.getBoundingClientRect().left;
      const left = label ? wrapLeft + (parseFloat(getComputedStyle(label).paddingLeft) || 24) : 24;
      const right = vw - left;
      rightLine = right;
      // 다섯 장이 두 선 사이에 딱 맞는 폭(사용자 지시 2026-10-20 — 첫 카드 왼쪽 · 마지막 카드 오른쪽이 선에)
      const gap = parseFloat(getComputedStyle(rows[0].track).columnGap) || 16;
      const n = Math.max(...rows.map((r) => r.track.children.length));
      wrap.style.setProperty('--sr-card-w', `${Math.max(160, (right - left - (n - 1) * gap) / n)}px`);
      for (const r of rows) {
        // 출발: 첫 카드가 화면 왼쪽에서 60% 자리에 / 도착: 마지막 카드의 오른쪽 끝이 오른쪽 선에(폭이 맞으면 첫 카드는 왼쪽 선에)
        const base = wrapLeft + r.track.offsetLeft; // 옮기기 전 줄의 화면 왼쪽
        r.startX = vw * 0.6 - base;
        const endX = right - base - r.track.scrollWidth;
        r.travel = Math.max(0, r.startX - endX);
        // 내용 높이(무대에 준 최소 높이와 상관없이) — 첫 자식 위 끝 ~ 마지막 자식 아래 끝 + 위아래 여백
        const cs = getComputedStyle(r.stage);
        const kids = r.stage.children;
        const natural =
          kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top +
          parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        r.top = Math.max(0, (window.innerHeight - natural) / 2);
        // 마지막 줄은 붙어 있는 동안 무대가 화면 아래 끝까지 회색으로 채운다 — 아니면 끝에 가까워질수록 아래 회색이 줄어들며
        // 다음 섹션(흰 바탕)이 올라와 보였다(사용자 제보 2026-10-20)
        const h = r.row === rows[rows.length - 1].row ? Math.max(natural, window.innerHeight - r.top) : natural;
        r.stage.style.minHeight = `${h}px`;
        r.stage.style.top = `${r.top}px`;
        r.row.style.height = `${h + r.travel}px`;
      }
    };
    const tick = () => {
      raf = 0;
      const on = pinOn.matches && !reduced;
      rows.forEach((r) => r.row.toggleAttribute('data-pin', on));
      if (!on) {
        wrap.style.removeProperty('--sr-card-w');
        rows.forEach((r) => {
          r.track.style.transform = '';
          r.stage.style.top = '';
          r.stage.style.minHeight = '';
          r.row.style.height = '';
          r.slots.forEach((s) => s.style.removeProperty('opacity'));
        });
        document.documentElement.removeAttribute('data-immersive');
        return;
      }
      measure();
      let immersive = false;
      for (const r of rows) {
        const box = r.row.getBoundingClientRect();
        const p = r.travel ? clamp01((r.top - box.top) / r.travel) : 1;
        if (box.top <= r.top && box.bottom >= r.top + r.stage.offsetHeight) immersive = true;
        const x = r.startX - r.travel * p;
        r.track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        // 오른쪽에서 들어오는 카드는 투명 → 불투명(흐림 띠 대신, 사용자 지시 2026-10-20): 화면 오른쪽 끝에서 0,
        // 오른쪽 여백 + 카드 폭 60%만큼 들어오면 1
        const vw = document.documentElement.clientWidth;
        for (const s of r.slots) {
          const left = s.getBoundingClientRect().left;
          const zone = Math.max(1, vw - rightLine + s.offsetWidth * 0.6);
          s.style.opacity = clamp01((vw - left) / zone).toFixed(3);
        }
      }
      document.documentElement.toggleAttribute('data-immersive', immersive);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    pinOn.addEventListener('change', schedule);
    document.fonts?.ready.then(schedule);
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      pinOn.removeEventListener('change', schedule);
      document.documentElement.removeAttribute('data-immersive');
    };
  }, []);

  return (
    <div ref={wrapRef} className="skill-reveal">
      {/* 줄마다 붙는 무대 하나 — 첫 줄엔 제목 · 리드가 함께 */}
      {groups.map((g, gi) => (
        <section key={g.label} className="sr-row" aria-label={g.label}>
          <div className="sr-row__stage">
            {gi === 0 && (
              <header className="skill-reveal__head">
                {/* 제목 · 리드는 ScrollReveal(단어마다 흐림 → 또렷, 사용자 지시 2026-10-20) */}
                <ScrollReveal as="h2" containerClassName="skill-reveal__title sr-plain" {...SCROLL_REVEAL}>{title}</ScrollReveal>
                <ScrollReveal as="p" containerClassName="skill-reveal__lead sr-plain" {...SCROLL_REVEAL}>{lead}</ScrollReveal>
              </header>
            )}
            <h3 className="sr-group__label">{g.label}</h3>
            <ol className="sr-row__track">
              {g.items.map((p, i) => (
                <li key={p.en} className="sr-card-slot" style={{ '--i': i } as CSSProperties}>
                  <SkillCard p={p} />
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}

/** 세로로 긴 카드 — 뒤의 판만 커서를 따라 기울고(빛 · 그림자), 위의 글자 층(이름 · 영문 · 전문)은 그대로 */
function SkillCard({ p }: { p: Pillar }) {
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse' || e.buttons) return; // 끌어 고르는 동안엔 움직이지 않는다
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((0.5 - y) * 2 * TILT).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((x - 0.5) * 2 * TILT).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
  };
  const leave = (e: ReactPointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  return (
    <article className="sr-card" onPointerMove={move} onPointerLeave={leave}>
      <div className="sr-card__plate" aria-hidden="true" />
      <div className="sr-card__text">
        <h4 className="sr-card__ko">{p.ko}</h4>
        <span className="sr-card__en">{p.en}</span>
        <p className="sr-card__body">{p.body}</p>
      </div>
    </article>
  );
}
