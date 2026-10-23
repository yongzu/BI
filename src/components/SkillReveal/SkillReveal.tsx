import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Pillar } from '../../data/programs';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { SCROLL_REVEAL } from '../ScrollReveal/preset';
import './SkillReveal.css';

/**
 * 역량과 태도(v14, 2026-10-20) — v12(toss.im "광고 노출 전략도 다르게")처럼 세로 스크롤이 카드 줄의 가로 이동이 된다(사용자 지시 2026-10-20).
 *
 * - 왼쪽 정렬 제목 + 리드는 그냥 지나가고, 그 아래 '역량' 줄과 'Phi OS' 줄이 한 무대에 위아래로 선다.
 * - 붙는 무대 하나(사용자 지시 2026-10-20 — 한 화면에서 카드 10장을 모두 본다): 두 줄이 함께 화면 세로 가운데에 붙은 채
 *   세로로 스크롤하는 동안 두 줄의 카드가 화면 오른쪽에서 들어와 왼쪽으로 흘러간다. 다섯 장씩 양쪽 여백 사이에 딱 맞게 서면
 *   (첫 카드 왼쪽 = 소제목 왼쪽 선, 마지막 카드 오른쪽 = 오른쪽 여백) 무대가 풀린다. 붙는 길이 = 가로로 움직이는 거리(1px = 1px)
 *   + 시간차. 아래 줄은 위 줄보다 LAG만큼 늦게 출발해 늦게 도착한다(사용자 지시 2026-10-20 — 동시가 아니라 차례로).
 *   예전엔 줄마다 따로 붙어 한 화면에 한 줄(다섯 장)만 보였다. 카드 높이는 두 줄이 한 화면에 들어가게 줄였다(CSS --sr-card-h).
 * - 카드 한 장 — 이름 · 영문 · 전문(아래로 갈수록 옅게 잘린다).
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
/** 아래 줄(Phi OS)이 위 줄(역량)보다 늦게 출발하는 거리 — 가로 이동 거리에 대한 비율(v15: 0.35 → 0.2) */
const LAG = 0.2;
/** 세로 스크롤 1px에 카드 줄이 가로로 움직이는 거리(px). v15(2026-10-23): 1 → 1.6 — 붙잡는 구간이 길어
 *  지나가고 싶어도 못 지나갔다(휴리스틱 평가 · 사용자 통제와 자유). 붙는 길이 = (이동 + 시간차) ÷ SPEED */
const SPEED = 1.6;

export function SkillReveal({ title, lead, groups }: { title: string; lead: string; groups: SkillGroup[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // 카드를 누르면 전문을 대화 상자로(v15, 2026-10-23) — 카드 높이를 넘는 전문은 아래가 잘려, 터치 화면에선 끝까지 읽을 길이 없었다
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reading, setReading] = useState<Pillar | null>(null);
  const read = (p: Pillar) => {
    setReading(p);
    dialogRef.current?.showModal();
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const row = wrap.querySelector<HTMLElement>('.sr-row')!;
    const stage = row.querySelector<HTMLElement>('.sr-row__stage')!;
    const tracks = [...row.querySelectorAll<HTMLElement>('.sr-row__track')].map((track) => ({
      track,
      slots: [...track.querySelectorAll<HTMLElement>('.sr-card-slot')],
      startX: 0,
    }));
    const pinOn = window.matchMedia('(min-width: 1101px) and (min-height: 700px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let rightLine = 0; // 오른쪽 선(화면 x)
    let travel = 0; // 한 줄이 가로로 움직이는 거리(px) — 가장 긴 줄
    let lag = 0; // 줄마다 늦게 출발하는 스크롤 거리(px)
    let top = 0; // 무대가 붙는 높이(화면 세로 가운데)
    /** 카드 폭 · 줄마다 출발 자리 · 무대 길이를 잰다 — 붙는 상태(줄의 안쪽 여백이 달라진다)를 정한 뒤 프레임마다 */
    const measure = () => {
      const vw = document.documentElement.clientWidth; // 스크롤바를 뺀 보이는 폭
      // 왼쪽 선 = 화면에 보이는 소제목의 왼쪽 선, 오른쪽 선 = 그와 대칭(무대는 100vw라 스크롤바 반만큼 비껴 있어 화면 좌표로 잰다)
      const label = wrap.querySelector<HTMLElement>('.sr-group__label');
      const wrapLeft = wrap.getBoundingClientRect().left;
      const left = label ? wrapLeft + (parseFloat(getComputedStyle(label).paddingLeft) || 24) : 24;
      const right = vw - left;
      rightLine = right;
      // 다섯 장이 두 선 사이에 딱 맞는 폭(사용자 지시 2026-10-20 — 첫 카드 왼쪽 · 마지막 카드 오른쪽이 선에)
      const gap = parseFloat(getComputedStyle(tracks[0].track).columnGap) || 16;
      const n = Math.max(...tracks.map((t) => t.track.children.length));
      wrap.style.setProperty('--sr-card-w', `${Math.max(160, (right - left - (n - 1) * gap) / n)}px`);
      // 출발: 첫 카드가 화면 왼쪽에서 60% 자리에 / 도착: 마지막 카드의 오른쪽 끝이 오른쪽 선에 — 아래 줄은 lag만큼 늦게
      travel = 0;
      for (const t of tracks) {
        const base = wrapLeft + t.track.offsetLeft; // 옮기기 전 줄의 화면 왼쪽
        t.startX = vw * 0.6 - base;
        const endX = right - base - t.track.scrollWidth;
        travel = Math.max(travel, t.startX - endX);
      }
      lag = travel * LAG;
      // 내용 높이(무대에 준 최소 높이와 상관없이) — 첫 자식 위 끝 ~ 마지막 자식 아래 끝 + 위아래 여백
      const cs = getComputedStyle(stage);
      const kids = stage.children;
      const natural =
        kids[kids.length - 1].getBoundingClientRect().bottom - kids[0].getBoundingClientRect().top +
        parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      top = Math.max(0, (window.innerHeight - natural) / 2);
      // 붙어 있는 동안 무대가 화면 아래 끝까지 회색으로 채운다 — 아니면 끝에 가까워질수록 아래 회색이 줄어들며
      // 다음 섹션(흰 바탕)이 올라와 보였다(사용자 제보 2026-10-20)
      const h = Math.max(natural, window.innerHeight - top);
      stage.style.minHeight = `${h}px`;
      stage.style.top = `${top}px`;
      row.style.height = `${h + (travel + lag * (tracks.length - 1)) / SPEED}px`;
    };
    const tick = () => {
      raf = 0;
      const on = pinOn.matches && !reduced;
      row.toggleAttribute('data-pin', on);
      if (!on) {
        wrap.style.removeProperty('--sr-card-w');
        tracks.forEach((t) => {
          t.track.style.transform = '';
          t.slots.forEach((s) => s.style.removeProperty('opacity'));
        });
        stage.style.top = '';
        stage.style.minHeight = '';
        row.style.height = '';
        document.documentElement.removeAttribute('data-immersive');
        return;
      }
      measure();
      const box = row.getBoundingClientRect();
      const scrolled = top - box.top; // 무대가 붙은 뒤 내려온 거리
      const immersive = box.top <= top && box.bottom >= top + stage.offsetHeight;
      const vw = document.documentElement.clientWidth;
      tracks.forEach((t, i) => {
        const p = travel ? clamp01((scrolled * SPEED - lag * i) / travel) : 1;
        const x = t.startX - travel * p;
        t.track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        // 오른쪽에서 들어오는 카드는 투명 → 불투명(흐림 띠 대신, 사용자 지시 2026-10-20): 화면 오른쪽 끝에서 0,
        // 오른쪽 여백 + 카드 폭 60%만큼 들어오면 1
        for (const s of t.slots) {
          const left = s.getBoundingClientRect().left;
          const zone = Math.max(1, vw - rightLine + s.offsetWidth * 0.6);
          s.style.opacity = clamp01((vw - left) / zone).toFixed(3);
        }
      });
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
      <header className="skill-reveal__head">
        {/* 제목 · 리드는 ScrollReveal(단어마다 흐림 → 또렷, 사용자 지시 2026-10-20) */}
        <ScrollReveal as="h2" containerClassName="skill-reveal__title sr-plain" {...SCROLL_REVEAL}>{title}</ScrollReveal>
        <ScrollReveal as="p" containerClassName="skill-reveal__lead sr-plain" {...SCROLL_REVEAL}>{lead}</ScrollReveal>
      </header>
      {/* 붙는 무대 하나에 두 줄(역량 · Phi OS) — 한 화면에 카드 10장 */}
      <div className="sr-row">
        <div className="sr-row__stage">
          {groups.map((g) => (
            <section key={g.label} className="sr-group" aria-label={g.label}>
              <h3 className="sr-group__label">{g.label}</h3>
              <ol className="sr-row__track">
                {g.items.map((p, i) => (
                  <li key={p.en} className="sr-card-slot" style={{ '--i': i } as CSSProperties}>
                    <SkillCard p={p} onRead={() => read(p)} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
      {/* 바깥(배경)을 누르거나 Esc · 닫기 버튼으로 닫힌다. 닫히면 초점은 누른 카드로 돌아간다(브라우저 기본) */}
      <dialog
        ref={dialogRef}
        className="sr-dialog"
        aria-labelledby="sr-dialog-title"
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      >
        {reading && (
          <div className="sr-dialog__inner">
            <h4 id="sr-dialog-title" className="sr-card__ko">{reading.ko}</h4>
            <span className="sr-card__en">{reading.en}</span>
            <p className="sr-card__body">{reading.body}</p>
            <button type="button" className="sr-dialog__close" onClick={() => dialogRef.current?.close()}>닫기</button>
          </div>
        )}
      </dialog>
    </div>
  );
}

/** 카드 — 뒤의 판만 커서를 따라 기울고(빛 · 그림자), 위의 글자 층(이름 · 영문 · 전문)은 그대로 */
function SkillCard({ p, onRead }: { p: Pillar; onRead: () => void }) {
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
    // 카드 어디를 눌러도 전문이 열린다 — 글자를 끌어 고른 뒤 손을 뗀 경우만 빼고(글자 층은 늘 끌어 고를 수 있다)
    <article className="sr-card" onPointerMove={move} onPointerLeave={leave} onClick={() => { if (!window.getSelection()?.toString()) onRead(); }}>
      <div className="sr-card__plate" aria-hidden="true" />
      <div className="sr-card__text">
        <h4 className="sr-card__ko">{p.ko}</h4>
        <span className="sr-card__en">{p.en}</span>
        <p className="sr-card__body">{p.body}</p>
      </div>
      {/* 키보드 · 화면 읽기 프로그램용 버튼이자 '누르면 열린다'는 표시 — 위 오른쪽 '+' */}
      <button type="button" className="sr-card__open" aria-haspopup="dialog" aria-label={`${p.ko} 전문 보기`} onClick={(e) => { e.stopPropagation(); onRead(); }}>
        <span className="sr-card__plus" aria-hidden="true" />
      </button>
    </article>
  );
}
