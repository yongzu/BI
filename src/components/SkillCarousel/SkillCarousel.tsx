import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue, type PanInfo } from 'motion/react';
import type { CourseType, Pillar } from '../../data/programs';
import { openCourse } from '../CourseExplorer/openCourse';
import { scrollToTarget } from '../../smoothScroll';
import TiltedCard, { TiltedCardLayer } from '../TiltedCard/TiltedCard';
import './SkillCarousel.css';

/**
 * 배우는 역량(v10, 2026-10-19) — 21st.dev carousel-07(shadcnspace)의 겹친 부채꼴 캐러셀 + react-bits TiltedCard의 깊이.
 *
 * - 카드 다섯 장이 가운데 카드를 중심으로 좌우에 겹쳐 놓이고, 멀어질수록 옆으로 · 아래로 · 기울어지며 작아지고 어두워진다
 *   (carousel-07의 offset → x · y · rotate · scale · 어둠 변환을 그대로, 카드 크기만 우리 카드에 맞춰 키움).
 * - 처음 화면에 들어오면 무대가 붙은 채, 스크롤하는 동안 1번 → 5번으로 넘어간다(이너 스크롤, 사용자 지시 2026-10-19).
 *   카드마다 잠깐 머물도록 한 칸 안에서 감속한다. 다 넘기면 무대가 풀려 페이지가 이어진다.
 * - 그 뒤엔 carousel-07처럼 옆으로 끌어서(속도 반영, 스프링) 또는 아래 번호 · ←/→ 버튼으로 넘긴다. 옆 카드를 누르면 그 카드로.
 * - 카드는 TiltedCard — 마우스를 따라 기울고, 층마다 깊이(TiltedCardLayer depth)가 달라 번호 · 글이 떠 보인다. 빛 · 그림자.
 * - "이 역량을 기르는 수업"은 가운데 카드에 마우스를 올리거나 누르기 전엔 숨긴다(사용자 지시). 키보드는 카드 안 버튼으로 연다.
 * 휴대폰 · 움직임 줄이기: 붙는 무대 없이 끌기 · 버튼으로 넘긴다.
 */
type Course = { slug: string; en: string; tags: string[]; type: string };

type Config = { cardW: number; distanceDivisor: number; velocityDivisor: number; sensitivity: number; x: number; y: number; rotate: number; scaleReduction: number };

/** carousel-07의 화면 폭별 값. x · y는 원본 카드 폭(256 · 224 · 176)에 대한 비율로 우리 카드 폭에 맞춘다 */
const configFor = (width: number): Config => {
  if (width < 640) return { cardW: 260, distanceDivisor: 120, velocityDivisor: 500, sensitivity: 180, x: 90 * (260 / 176), y: 20, rotate: 8, scaleReduction: 0.06 };
  if (width < 1024) return { cardW: 300, distanceDivisor: 160, velocityDivisor: 650, sensitivity: 220, x: 130 * (300 / 224), y: 30, rotate: 10, scaleReduction: 0.09 };
  return { cardW: 320, distanceDivisor: 200, velocityDivisor: 800, sensitivity: 250, x: 170 * (320 / 256), y: 40, rotate: 12, scaleReduction: 0.12 };
};

const spring = { type: 'spring' as const, stiffness: 200, damping: 30, mass: 1 };
/** 한 칸 안에서 감속 — 스크롤하는 동안 카드마다 잠깐 머문다 */
const dwell = (x: number) => {
  const i = Math.floor(x);
  const f = x - i;
  return i + f * f * (3 - 2 * f);
};

export function SkillCarousel({ items, courseTypes, header }: { items: Pillar[]; courseTypes: CourseType[]; header?: ReactNode }) {
  const courses: Course[] = courseTypes.flatMap((t) => t.courses.map((c) => ({ slug: c.slug, en: c.en, tags: c.tags, type: t.name })));
  const total = items.length;
  const progress = useMotionValue(0);
  const start = useRef(0);
  const panning = useRef(false); // 끌기 직후의 클릭(놓는 순간)은 카드 선택으로 치지 않는다
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const [active, setActive] = useState(0);
  const [openIdx, setOpenIdx] = useState<number | null>(null); // 수업을 눌러 고정해 둔 카드 — 가운데가 바뀌면 풀린다
  const config = useMemo(() => configFor(width), [width]);
  const motionOk = useRef(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const activeRef = useRef(0);
  useMotionValueEvent(progress, 'change', (p) => {
    const a = ((Math.round(p) % total) + total) % total;
    if (a === activeRef.current) return;
    activeRef.current = a;
    setActive(a);
    setOpenIdx(null);
  });

  // 이너 스크롤: 무대가 붙어 있는 동안 스크롤 진행(0 → 1)을 1번 → 5번으로. 무대 밖에선 끌기 · 버튼이 맡는다
  const pinned = () => {
    const wrap = wrapRef.current;
    if (!wrap || !wrap.hasAttribute('data-pin')) return null;
    const r = wrap.getBoundingClientRect();
    const range = r.height - window.innerHeight;
    return range > 0 ? { r, range } : null;
  };
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const pinOn = window.matchMedia('(min-width: 901px)');
    const sync = () => {
      wrap.toggleAttribute('data-pin', pinOn.matches && motionOk.current);
    };
    sync();
    let raf = 0;
    const tick = () => {
      raf = 0;
      const pin = pinned();
      if (!pin) { document.documentElement.removeAttribute('data-immersive'); return; }
      const d = -pin.r.top / pin.range;
      const inside = d >= 0 && d <= 1;
      // 붙어 있는 동안은 몰입 구간 — 오른쪽 위 목차가 오른쪽 카드를 가리지 않게 잠시 걷는다
      document.documentElement.toggleAttribute('data-immersive', inside);
      if (d > -0.15 && d < 1.15) progress.set(dwell(Math.min(1, Math.max(0, d)) * (total - 1)));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    pinOn.addEventListener('change', () => { sync(); schedule(); });
    schedule();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.documentElement.removeAttribute('data-immersive');
    };
  }, [progress, total]);

  /** i번 카드로: 무대가 붙어 있으면 그 자리까지 스크롤, 아니면 스프링으로 */
  const goTo = (i: number) => {
    const pin = pinned();
    const target = Math.max(0, Math.min(total - 1, i));
    if (pin) {
      const d = -pin.r.top / pin.range;
      if (d >= 0 && d <= 1) {
        const top = pin.r.top + window.scrollY;
        scrollToTarget(top + (pin.range * target) / (total - 1));
        return;
      }
    }
    const cur = progress.get();
    // 가장 가까운 쪽으로 돈다(원형)
    let delta = (((target - cur) % total) + total) % total;
    if (delta > total / 2) delta -= total;
    if (motionOk.current) animate(progress, cur + delta, spring);
    else progress.set(cur + delta);
  };

  // carousel-07의 끌기: 끄는 동안 따라오고, 놓으면 거리 + 속도로 몇 칸 갈지 정해 스프링으로 정수 자리에
  const onPanStart = () => { start.current = progress.get(); panning.current = true; };
  const onPan = (_: PointerEvent, info: PanInfo) => { progress.set(progress.get() - info.delta.x / config.sensitivity); };
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    const shift = Math.max(-3, Math.min(3, Math.round(-info.offset.x / config.distanceDivisor - info.velocity.x / config.velocityDivisor)));
    const target = Math.round(start.current) + shift;
    window.setTimeout(() => { panning.current = false; }, 0);
    if (motionOk.current) animate(progress, target, spring);
    else progress.set(target);
  };

  return (
    <div ref={wrapRef} className="skill-carousel" style={{ '--sc-card-w': `${config.cardW}px`, '--sc-n': total } as CSSProperties}>
      <div className="skill-carousel__stage">
        {header}
        <motion.div
          className="skill-carousel__track"
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
          role="group"
          aria-roledescription="carousel"
          aria-label="배우는 역량 다섯 가지"
        >
          {items.map((p, i) => (
            <SkillCard
              key={p.en}
              p={p}
              index={i}
              total={total}
              progress={progress}
              config={config}
              isActive={active === i}
              related={courses.filter((c) => c.tags.includes(p.ko))}
              courseTotal={courses.length}
              onSelect={() => goTo(i)}
              isPanning={() => panning.current}
              open={openIdx === i}
              onToggle={() => setOpenIdx((v) => (v === i ? null : i))}
            />
          ))}
        </motion.div>

        <div className="skill-carousel__nav">
          <button type="button" className="skill-carousel__arrow" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="이전 역량">←</button>
          <ol className="skill-carousel__dots">
            {items.map((p, i) => (
              <li key={p.en}>
                <button type="button" aria-current={active === i ? 'true' : undefined} onClick={() => goTo(i)}>
                  <span className="skill-carousel__dot-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="skill-carousel__dot-name">{p.ko}</span>
                </button>
              </li>
            ))}
          </ol>
          <button type="button" className="skill-carousel__arrow" onClick={() => goTo(active + 1)} disabled={active === total - 1} aria-label="다음 역량">→</button>
        </div>
      </div>
    </div>
  );
}

type CardProps = {
  p: Pillar;
  index: number;
  total: number;
  progress: MotionValue<number>;
  config: Config;
  isActive: boolean;
  related: Course[];
  courseTotal: number;
  onSelect: () => void;
  isPanning: () => boolean;
  open: boolean;
  onToggle: () => void;
};

function SkillCard({ p, index, total, progress, config, isActive, related, courseTotal, onSelect, isPanning, open, onToggle }: CardProps) {
  // carousel-07 Card의 변환 그대로: 원형으로 감싼 거리(offset) → 자리 · 기울기 · 크기 · 겹침 순서 · 어둠
  const offset = useTransform(progress, (v) => {
    let diff = (index - v) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  });
  const x = useTransform(offset, (o) => o * config.x);
  const rotate = useTransform(offset, (o) => (Math.abs(o) < 0.05 ? 0 : o * config.rotate));
  const y = useTransform(offset, (o) => (Math.abs(o) < 0.05 ? 0 : Math.abs(o) * config.y));
  const scale = useTransform(offset, (o) => 1 - Math.abs(o) * config.scaleReduction);
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));
  const dim = useTransform(offset, [-2, -0.5, 0, 0.5, 2], [0.55, 0.25, 0, 0.25, 0.55]);
  const textOpacity = useTransform(offset, [-0.6, 0, 0.6], [0.35, 1, 0.35]);

  // 이 역량을 기르는 수업: 가운데 카드에 마우스를 올리면 보이고, 누르면 고정 — 그 전엔 숨김
  const [hover, setHover] = useState(false);
  const shown = isActive && (hover || open);

  return (
    <motion.div
      className="skill-slot"
      style={{ x, rotate, y, scale, zIndex }}
      data-active={isActive}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse' && isActive) setHover(true); }}
      onPointerLeave={() => setHover(false)}
      onClick={() => { if (isPanning()) return; if (isActive) onToggle(); else onSelect(); }}
      aria-hidden={!isActive || undefined}
    >
      <TiltedCard
        containerWidth="100%"
        containerHeight="100%"
        imageWidth="100%"
        imageHeight="100%"
        radius={24}
        perspective={900}
        rotateAmplitude={isActive ? 12 : 0}
        scaleOnHover={isActive ? 1.04 : 1}
        glare={0.4}
        shadow={0.5}
        parallax={1}
        intro={false}
        gyroscope={false}
        showTooltip={false}
        flipOnClick={false}
        className="skill-tilt"
      >
        <TiltedCardLayer depth={-12} className="skill-face__bg" />
        <TiltedCardLayer depth={14} className="skill-face__top">
          <span className="skill-face__num">{String(index + 1).padStart(2, '0')}</span>
          <span className="skill-face__badge">{p.en}</span>
        </TiltedCardLayer>
        <TiltedCardLayer depth={30} className="skill-face__text">
          <motion.span className="skill-face__copy" style={{ opacity: textOpacity }}>
            <span className="skill-face__ko">{p.ko}</span>
            <span className="skill-face__summary">{p.summary}</span>
            <span className="skill-face__body">{p.body}</span>
            <span className="skill-face__count">
              <span className="skill-dots" aria-hidden="true">
                {Array.from({ length: courseTotal }, (_, k) => <span key={k} data-on={k < related.length} />)}
              </span>
              기르는 수업 {related.length}
            </span>
          </motion.span>
        </TiltedCardLayer>
        <motion.span className="skill-face__dim" style={{ opacity: dim }} aria-hidden="true" />

        {/* 이 역량을 기르는 수업 — 아래에서 올라와 카드 아래쪽을 덮는다 */}
        <div className="skill-courses" data-shown={shown} inert={!shown} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
          <span className="skill-courses__label">이 역량을 기르는 수업 {related.length}</span>
          <ul>
            {related.map((c) => (
              <li key={c.slug}>
                <button type="button" className="skill-course" onClick={() => openCourse(c.slug)}>
                  {c.en}<span className="skill-course__type">{c.type}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </TiltedCard>
      {/* 키보드 · 보조기기: 가운데 카드의 수업을 여닫는 버튼(마우스는 카드 아무 데나 눌러도 된다) */}
      {isActive && (
        <button
          type="button"
          className="skill-courses__toggle"
          aria-expanded={shown}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          {shown ? '수업 닫기' : `기르는 수업 ${related.length} 보기`}
        </button>
      )}
    </motion.div>
  );
}
