import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { scrollToTarget } from '../../smoothScroll';
import { PhiMotion } from '../PhiMotion/PhiMotion';
import { VectorGuides, VectorWord } from '../VectorWord/VectorWord';
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
 * - 벡터형 인재(사용자 제공 phi.design 화면 녹화 · 코드): 한 줄 제목 아래 왼쪽 단락 · 오른쪽 Φ 모션그래픽(PhiMotion). 섹션 전체에서
 *   포인터를 십자선 · 좌표가 따라다니고(VectorGuides), 제목 낱말과 본문의 [사고방식] · [벡터형 인재] · [역량과 태도] · Φ 고리는
 *   마우스를 올리면 벡터 보기(VectorWord — 윤곽 · 최소한의 앵커 · 바운딩 박스 · 안내선 · 좌표).
 * - 본문은 react-bits ScrollReveal(사용자 제공 설정: chars · fade · stagger 0.05 · smoothing 2 · baseOpacity 0.1 · blur 4).
 * - 단락마다 끊어 넘긴다(사용자 지시 2026-10-23 — 스크롤에 따라 반쯤 흐린 글이 남았다): 무대가 붙어 있는 동안 스크롤이 멈추면
 *   단락 자리로 맞춰 간다. 지금 단락에서 SNAP_PX 넘게 내려왔으면 다음 단락, 올라갔으면 이전 단락, 아니면 제자리로.
 *   마지막 단락에서 더 내리면 무대가 풀리는 자리로 보내 다음 섹션으로 이어진다. 바깥에서 들어오면 위에선 첫 단락, 아래에선 마지막 단락으로.
 *   글은 스크롤 위치(scrub)가 아니라 단락이 자리 잡으면 시간으로 끝까지 드러난다 — 문장은 차례로(SENTENCE_GAP초 간격).
 * 단락마다 스크롤 STEP(화면 높이 배수). 움직임 줄이기면 붙는 무대 없이 제목과 단락을 차례로 쌓는다(CSS).
 */
type Props = { title: string; paragraphs: string[][] };

/** 한 단락이 쓰는 스크롤 길이(화면 높이 배수) */
const STEP = 1.2;
/** 지금 단락 자리에서 이만큼(px) 넘게 움직이고 멈추면 다음 · 이전 단락으로 넘긴다 */
const SNAP_PX = 40;
/** 스크롤이 멈췄다고 보는 시간(ms) */
const SETTLE_MS = 140;
/** 단락 자리로 맞춰 가는 시간(초) */
const SNAP_S = 0.7;
/** 한 단락 안 문장들이 차례로 드러나는 간격(초) */
const SENTENCE_GAP = 0.9;
/** Φ 고리가 X자 장면(한 바퀴의 처음 · 끝)에서 캔버스 안에 차지하는 세로 자리 — 위 끝 16.4%, 높이 66.75%(scene.bounds 실측) */
const X_POSE_TOP = 0.164;
const X_POSE_H = 0.6675;
/** 같은 장면의 왼쪽 끝(캔버스 폭 대비) — 고리 왼쪽 끝을 제목 끝에서 TITLE_GAP 띄운다 */
const X_POSE_LEFT = 0.164;
const TITLE_GAP = 64;

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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const parasRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);

  // Φ 크기 · 자리: X자 장면에서 고리 위 끝 = 제목 위 끝, 아래 끝 = 본문 아래 끝(사용자 지시 2026-10-23).
  // 왼쪽 끝은 CSS(화면 폭 70%) — 고리가 제목 끝에 붙으면 비켜 둔다. 오른쪽은 화면 밖으로 잘린다. 휴대폰(720px 이하)은 CSS의 작은 Φ 그대로
  useLayoutEffect(() => {
    const [title, body, paras, motion] = [titleRef.current, bodyRef.current, parasRef.current, motionRef.current];
    if (!title || !body || !paras || !motion) return;
    const small = window.matchMedia('(max-width: 720px)');
    const place = () => {
      if (small.matches) {
        motion.style.width = motion.style.top = motion.style.left = '';
        return;
      }
      // 변형(떠오름)과 상관없이 배치 자리로 잰다 — 제목 · 본문 칸은 무대 안, 단락은 본문 칸 안
      const top = title.offsetTop - body.offsetTop;
      const bottom = paras.offsetTop + paras.offsetHeight;
      const size = (bottom - top) / X_POSE_H;
      motion.style.width = `${size}px`;
      motion.style.top = `${top - X_POSE_TOP * size}px`;
      // 가로: 기본은 화면 폭 70%(CSS), 고리 왼쪽 끝이 제목 끝에 붙으면 TITLE_GAP만큼 오른쪽으로
      motion.style.left = '';
      const range = document.createRange();
      range.selectNodeContents(title);
      const titleRight = range.getBoundingClientRect().right - body.getBoundingClientRect().left;
      const ringLeft = motion.offsetLeft + X_POSE_LEFT * size;
      if (ringLeft < titleRight + TITLE_GAP) motion.style.left = `${titleRight + TITLE_GAP - X_POSE_LEFT * size}px`;
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(paras);
    ro.observe(title);
    small.addEventListener('change', place);
    return () => {
      ro.disconnect();
      small.removeEventListener('change', place);
    };
  }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const track = root.querySelector<HTMLElement>('.philosophy__track')!;
    const n = paragraphs.length;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let settle = 0;
    let snapping = 0; // 맞춰 가는 동안(이 시각까지)은 스크롤 멈춤을 무시한다
    let idx = -1; // 마지막으로 맞춘 자리: 0 … n-1 = 단락, n = 무대가 풀리는 자리. -1 = 바깥
    // 단락 자리(페이지 y): 단락 i가 지금이 되는 지점 = 무대 위 끝 + i × (붙는 길이 ÷ n), n번째는 무대가 풀리는 자리
    const anchors = () => {
      const r = track.getBoundingClientRect();
      const top = window.scrollY + r.top;
      const span = r.height - window.innerHeight;
      return Array.from({ length: n + 1 }, (_, i) => Math.round(top + (span * i) / n) + (i === n ? 0 : 1));
    };
    const tick = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      // 무대 위 끝이 화면 60% 선에 닿으면 제목 · 첫 단락이 떠오른다. 다시 그 아래로 내려가면 숨는다
      setShown(r.top < vh * 0.6 && r.bottom > vh * 0.4);
      const span = r.height - vh; // 무대가 붙어 있는 동안의 스크롤 길이
      const p = span > 0 ? Math.min(0.999, Math.max(0, -r.top / span)) : 0;
      setAt(Math.floor(p * n));
    };
    const snap = () => {
      if (reduced || performance.now() < snapping) return;
      const a = anchors();
      const y = window.scrollY;
      if (y < a[0] - 2 || y > a[n] + 2) {
        idx = -1; // 무대 밖 — 맞추지 않는다
        return;
      }
      let target: number;
      if (idx < 0) {
        // 바깥에서 들어왔다: 위에서 내려왔으면 첫 단락, 아래에서 올라왔으면 마지막 단락
        target = y - a[0] < a[n] - y ? 0 : n - 1;
      } else {
        const d = y - a[idx];
        target = d > SNAP_PX ? idx + 1 : d < -SNAP_PX ? idx - 1 : idx;
        if (target < 0) return; // 첫 단락에서 위로 — 무대 밖으로 나가게 둔다
      }
      target = Math.min(n, target);
      idx = target;
      if (Math.abs(a[target] - y) < 2) return;
      snapping = performance.now() + SNAP_S * 1000 + 120;
      scrollToTarget(a[target], { duration: SNAP_S });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
      window.clearTimeout(settle);
      settle = window.setTimeout(snap, SETTLE_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
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
      style={{ '--ph-n': paragraphs.length, '--ph-step': STEP } as CSSProperties}
    >
      {/* 섹션 전체가 십자선 영역 — 포인터를 늘 십자선 · 좌표가 따라다닌다(phi.design data-hero-crosshair-zone) */}
      <VectorGuides zone={ref} />
      <div className="philosophy__track">
        <div className="philosophy__stage">
          {/* 제목은 한 줄(사용자 지시 2026-10-23) */}
          <h2 ref={titleRef} id="philosophy-title" className="philosophy__title">
            {title.split(' ').map((w, i) => (
              <Fragment key={w}>
                {i > 0 && ' '}
                <VectorWord word={w} />
              </Fragment>
            ))}
          </h2>
          {/* 제목 아래: 왼쪽 단락 · 오른쪽 Φ 모션(사용자 제공 이미지 배치 — 단락 높이 가운데) */}
          <div ref={bodyRef} className="philosophy__body">
            <div ref={parasRef} className="philosophy__paras">
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
                        smoothing={2}
                        baseOpacity={0.1}
                        baseRotation={0}
                        baseOffset={0}
                        enableBlur
                        blurStrength={4}
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
            <div ref={motionRef} className="philosophy__motion">
              <PhiMotion />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
