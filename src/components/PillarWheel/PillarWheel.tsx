import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Text } from '../Text/Text';
import './PillarWheel.css';

/**
 * 역량과 태도 휠(사용자 지시 2026-10-12) — React Bits의 Option Wheel(https://reactbits.dev/components/option-wheel,
 * tilt 7 · smoothing 190 · spacing 1.65)을 옮겨 왔다. 왼쪽 휠, 오른쪽엔 휠 가운데 항목의 설명 하나만.
 *
 * 원본과 다른 점 — 정보 구조를 휠의 움직임으로 드러낸다:
 * - 묶음 머리글(역량 · 태도)은 큰 글자로 휠에 함께 돌지만 고를 수 없다. 머리글은 두 칸을 차지해, 역량 → 태도로
 *   넘어갈 때 휠이 한 칸이 아니라 세 칸을 돈다 — 묶음의 경계를 '더 먼 이동'으로 느끼게 한다.
 * - 휠 · 끌기 · 키보드는 고를 수 있는 항목 단위(index)로 움직이고, 그리기는 칸 단위(slot)로 한다. index ↔ slot은
 *   항목 가운데끼리 잇는 꺾은선으로 바꾼다.
 * - 페이지 스크롤을 가두지 않는다: 휠 전체가 화면 안에 들어왔을 때만 휠이 돌고, 처음 · 끝 항목에서 같은 방향으로
 *   더 굴리면 페이지가 이어서 내려간다(사용자 제보 2026-10-05의 '스크롤이 먹지 않는' 문제를 반복하지 않게).
 * - 터치에서는 끌기를 끄고 탭으로만 고른다 — 세로로 쓸면 페이지가 스크롤된다.
 */

export type WheelEntry = { id: string; title: string; en: string; body: ReactNode };
export type WheelGroup = { id: string; title: string; en: string; items: WheelEntry[] };

type Row =
  | { kind: 'group'; key: string; group: WheelGroup; slots: number }
  | { kind: 'item'; key: string; group: WheelGroup; entry: WheelEntry; number: number; index: number; slots: number };

const GROUP_SLOTS = 2; // 머리글(48)은 항목(24) 두 칸 높이
const TILT = 7; // 이웃 칸 사이 각도(°)
const SPACING = 1.65; // 칸 높이 = 항목 글자 크기 × 1.65
const SMOOTHING = 190; // 따라붙는 시간 상수(ms)
const BLUR = 1.2; // 칸마다 더하는 흐림(px) — 머리글은 절반(이정표라 멀리서도 읽히게)
const FADE = 0.16; // 칸마다 빠지는 불투명도 — 한 묶음 다섯 항목이 한눈에 읽히는 정도
const MIN_OPACITY = 0.06;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function PillarWheel({ groups, label }: { groups: WheelGroup[]; label: string }) {
  // 휠에 놓이는 줄: 머리글 · 항목을 데이터 순서대로, 칸 위치(가운데)를 미리 센다
  const rows: Row[] = [];
  let index = 0;
  for (const group of groups) {
    rows.push({ kind: 'group', key: `g-${group.id}`, group, slots: GROUP_SLOTS });
    group.items.forEach((entry, i) => rows.push({ kind: 'item', key: entry.id, group, entry, number: i + 1, index: index++, slots: 1 }));
  }
  const centers: number[] = [];
  rows.reduce((top, row) => {
    centers.push(top + row.slots / 2);
    return top + row.slots;
  }, 0);
  const items = rows.filter((r): r is Extract<Row, { kind: 'item' }> => r.kind === 'item');
  const itemCenters = items.map((it) => centers[rows.indexOf(it)]);
  const count = items.length;

  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const geo = useRef({ centers, itemCenters, count, rowPx: 40 });
  // 렌더 중엔 ref를 건드리지 않는다 — 다른 effect보다 먼저 선언해 먼저 돈다
  useEffect(() => {
    geo.current = { ...geo.current, centers, itemCenters, count };
  });

  const target = useRef(0); // index 단위(소수 = 끌기 · 트랙패드 도중)
  const pos = useRef(itemCenters[0]); // slot 단위, 그려지는 위치
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const selectedRef = useRef(0);
  const [selected, setSelected] = useState(0);
  const [dir, setDir] = useState(1);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ y: number; startSlot: number; id: number; moved: boolean } | null>(null);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** index(소수 가능) → slot: 항목 가운데끼리 직선으로 잇는다 */
  const toSlot = (v: number) => {
    const { itemCenters: c, count: n } = geo.current;
    const i = Math.min(Math.max(Math.floor(v), 0), n - 2);
    return c[i] + (c[i + 1] - c[i]) * (v - i);
  };
  /** slot → index: toSlot의 역 */
  const toIndex = (s: number) => {
    const { itemCenters: c, count: n } = geo.current;
    if (s <= c[0]) return 0;
    for (let i = 0; i < n - 1; i++) if (s <= c[i + 1]) return i + (s - c[i]) / (c[i + 1] - c[i]);
    return n - 1;
  };

  // 한 rAF 루프: pos를 목표 slot으로 지수 감쇠로 따라붙이고, 줄마다 원호 위 자리 · 흐림 · 불투명도를 매긴다
  const frame = useCallback(function frame(now: number) {
    const dt = Math.min((now - last.current) / 1000, 0.05);
    last.current = now;
    const goal = toSlot(target.current);
    const k = reduceMotion() ? 1 : 1 - Math.exp(-dt / (SMOOTHING / 1000));
    let next = pos.current + (goal - pos.current) * k;
    const settled = Math.abs(goal - next) < 0.001;
    if (settled) next = goal;
    pos.current = next;

    const { centers: c, rowPx } = geo.current;
    const tilt = (TILT * Math.PI) / 180;
    const R = rowPx / tilt; // 이웃 칸 사이 호의 길이 = 칸 높이
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      const d = c[i] - next;
      const dist = Math.abs(d);
      const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tilt));
      const y = R * Math.sin(ang);
      const x = -R * (1 - Math.cos(ang));
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${((ang * 180) / Math.PI).toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(MIN_OPACITY, 1 - dist * FADE));
      const blur = dist * BLUR * (el.dataset.kind === 'group' ? 0.5 : 1);
      el.style.filter = blur > 0.02 ? `blur(${blur.toFixed(2)}px)` : 'none';
      el.style.setProperty('--pw-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    });
    raf.current = settled ? null : requestAnimationFrame(frame);
  }, []);

  const kick = useCallback(() => {
    if (raf.current != null) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(frame);
  }, [frame]);

  const aim = useCallback(
    (value: number, snap: boolean) => {
      let v = Math.min(Math.max(value, 0), geo.current.count - 1);
      if (snap) v = Math.round(v);
      target.current = v;
      const idx = Math.round(v);
      if (idx !== selectedRef.current) {
        setDir(idx > selectedRef.current ? 1 : -1);
        selectedRef.current = idx;
        setSelected(idx);
      }
      kick();
    },
    [kick],
  );

  // 칸 높이는 항목 글자 크기(Title, 화면 폭에 따라 20 → 24)에서 — 폭이 바뀌면 다시 잰다
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const title = el.querySelector('.pillar-wheel__title');
      const size = title ? parseFloat(getComputedStyle(title).fontSize) : 24;
      geo.current.rowPx = size * SPACING;
      el.style.setProperty('--pw-row', `${geo.current.rowPx}px`);
      kick();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [kick]);

  // 휠 · 트랙패드: 휠 전체가 화면 안일 때만 돌리고, 끝에서 더 굴리면 페이지로 넘긴다
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const r = el.getBoundingClientRect();
      const inView = r.top >= -8 && r.bottom <= window.innerHeight + 8;
      const atEdge = (e.deltaY < 0 && target.current <= 0) || (e.deltaY > 0 && target.current >= geo.current.count - 1);
      if (!inView || atEdge) return; // 페이지(Lenis)가 받는다
      e.preventDefault();
      e.stopPropagation(); // Lenis는 window에서 듣는다
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      // 휠 한 칸 = 항목 하나, 트랙패드는 이어서 — 원본과 같은 규칙
      aim(target.current + Math.max(-1, Math.min(1, delta / geo.current.rowPx)), false);
      if (snapTimer.current) clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => aim(target.current, true), 140);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, [aim]);

  // 비워 두지 않으면 StrictMode의 두 번째 마운트에서 kick()이 '이미 도는 중'으로 알고 루프를 다시 열지 않는다
  useEffect(() => () => {
    if (raf.current != null) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  // 끌기: 손가락을 따라 slot 단위로 — 머리글 칸에선 손이 더 움직여야 다음 항목에 닿는다
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    drag.current = { y: e.clientY, startSlot: toSlot(target.current), id: e.pointerId, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.abs(dy) > 4) {
      d.moved = true;
      setDragging(true);
      rootRef.current?.setPointerCapture(d.id);
    }
    if (d.moved) aim(toIndex(d.startSlot - dy / geo.current.rowPx), false);
  };
  const onPointerEnd = () => {
    const d = drag.current;
    if (!d) return;
    if (d.moved) aim(target.current, true);
    setDragging(false);
    // 끌기 직후의 click은 무시해야 하므로 한 틱 뒤에 비운다
    setTimeout(() => { drag.current = null; });
  };
  const pick = (row: Row) => {
    if (drag.current?.moved) return;
    // 머리글을 누르면 그 묶음의 첫 항목으로
    const to = row.kind === 'item' ? row.index : items.find((it) => it.group === row.group)?.index ?? 0;
    aim(to, true);
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key];
    if (step != null) aim(Math.round(target.current) + step, true);
    else if (e.key === 'Home') aim(0, true);
    else if (e.key === 'End') aim(count - 1, true);
    else return;
    e.preventDefault();
  };

  const current = items[selected];
  return (
    <div className="pillar-wheel">
      <div
        ref={rootRef}
        className="pillar-wheel__wheel"
        data-dragging={dragging}
        role="listbox"
        tabIndex={0}
        aria-label={label}
        aria-activedescendant={`pw-${current.key}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        {rows.map((row, i) => (
          <div
            key={row.key}
            ref={(el) => { rowRefs.current[i] = el; }}
            id={`pw-${row.key}`}
            className={`pillar-wheel__row pillar-wheel__row--${row.kind}`}
            data-kind={row.kind}
            role={row.kind === 'item' ? 'option' : 'presentation'}
            aria-selected={row.kind === 'item' ? row.index === selected : undefined}
            onClick={() => pick(row)}
          >
            {row.kind === 'group' ? (
              <>
                <Text as="span" typography="Heading" color="inherit">{row.group.title}</Text>
                <Text as="span" typography="Label" color="tertiary">{row.group.en}</Text>
              </>
            ) : (
              <>
                <Text as="span" typography="Label" color="tertiary" className="pillar-wheel__num">{String(row.number).padStart(2, '0')}</Text>
                <Text as="span" typography="Title" color="inherit" className="pillar-wheel__title">{row.entry.title}</Text>
                <Text as="span" typography="Label" color="tertiary">{row.entry.en}</Text>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 오른쪽: 휠 가운데 항목의 설명만. 모두 한 칸에 겹쳐 두어 높이가 가장 긴 설명에 맞춰진다 —
          바뀔 때 휠이 도는 방향(--pw-dir)에서 떠올라 들어온다 */}
      <div className="pillar-wheel__detail" aria-live="polite" style={{ '--pw-dir': dir } as React.CSSProperties}>
        {items.map((it) => (
          <article key={it.key} className="pillar-wheel__card" data-active={it.index === selected} aria-hidden={it.index !== selected}>
            <Text as="p" typography="Label" color="tertiary">{it.group.title} · {it.group.en}</Text>
            <div className="pillar-wheel__card-head">
              <Text as="span" typography="Label" color="tertiary">{String(it.number).padStart(2, '0')}</Text>
              <Text as="h4" typography="Title">{it.entry.title}</Text>
              <Text as="span" typography="Label" color="tertiary">{it.entry.en}</Text>
            </div>
            {typeof it.entry.body === 'string' ? <Text typography="Body" color="secondary">{it.entry.body}</Text> : it.entry.body}
          </article>
        ))}
      </div>
    </div>
  );
}
