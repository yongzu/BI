import { useEffect, useRef, useState } from 'react';
import glyphs from '../../data/vectorGlyphs.json';
import './FooterMark.css';

/**
 * 푸터 맨 아래 'Fundamental Over Tools' — 푸터 폭에 꽉 차게(사용자 지시 2026-10-24).
 * 교육 철학 제목과 같은 글자 윤곽(Pretendard Bold, 자간 -0.035em — data/vectorGlyphs.json)을 한 줄로 이어 SVG로 그린다.
 * viewBox를 글자 잉크에 딱 맞춰 두어 폭 100%면 왼쪽 · 오른쪽 끝이 푸터 글줄 끝에 닿는다(글꼴 크기를 재서 맞출 필요가 없다).
 * 2026-10-27(사용자 지시): 푸터 맨 아래에 여백 없이 화면 폭에 꽉 차게(양옆 · 아래 0).
 *
 * 떠오르는 구역(사용자 지시 2026-10-27 — granola.ai 푸터, morphin.dev 'granola-ai-footer' 참고): 글자 뒤 화면 아래 끝에서
 * 직사각형 구역 하나가 슬쩍 떠올라 글자 위로 윗부분을 내밀고, 잠시(STAY) 머물렀다가 다시 내려간다 — 쉬었다가(GAP) 되풀이.
 * 카드(기울어진 그래픽 카드)로 시작했다가 직사각형 구역으로 바꿨다. 안은 일단 파란 면 — 이미지는 나중에 넣는다(사용자 지시).
 * 푸터가 화면에 보일 때만 돈다. 움직임 줄이기면 쉰다.
 */
const RISE = 900; // 떠오르는 시간(ms) — CSS와 같다
const STAY = 2600; // 머무는 시간
const SINK = 700; // 내려가는 시간 — CSS와 같다
const GAP = 1600; // 다 내려간 뒤 다시 떠오르기까지
type Word = { width: number; d: string };
const words = (glyphs as { words: Record<string, Word> }).words;
const TEXT = ['Fundamental', 'Over', 'Tools'];
/** 낱말 사이 띄어쓰기(em) — Pretendard 공백 폭에 자간을 더한 값에 가깝게 */
const SPACE = 0.24;

const layout = (() => {
  let x = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  const parts = TEXT.map((name) => {
    const w = words[name];
    // 경로는 절대 좌표(M · L · Q · C)라 숫자가 x, y 차례로 나온다 — 잉크 상자를 잰다
    const nums = w.d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      minX = Math.min(minX, nums[i] + x);
      maxX = Math.max(maxX, nums[i] + x);
      minY = Math.min(minY, nums[i + 1]);
      maxY = Math.max(maxY, nums[i + 1]);
    }
    const part = { name, x, d: w.d };
    x += w.width + SPACE;
    return part;
  });
  return { parts, box: [minX, minY, maxX - minX, maxY - minY] };
})();

export function FooterMark() {
  const ref = useRef<HTMLDivElement>(null);
  const [up, setUp] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    let running = false;
    // 떠오름 → 머묾 → 내려감 → 쉼 → 되풀이
    const cycle = () => {
      setUp(true);
      timer = window.setTimeout(() => {
        setUp(false);
        timer = window.setTimeout(cycle, SINK + GAP);
      }, RISE + STAY);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        timer = window.setTimeout(cycle, 400);
      } else if (!entry.isIntersecting && running) {
        running = false;
        window.clearTimeout(timer);
        setUp(false);
      }
    });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(timer); };
  }, []);

  return (
    <div ref={ref} className="footer-mark-wrap">
      {/* 구역 길 — 글자 위로 열려 있고 아래 끝에서 자른다(기다리는 구역이 페이지 높이를 늘리지 않게 overflow로 자른다) */}
      <div className="footer-peek-lane" aria-hidden="true">
        <div className="footer-peek" data-up={up} />
      </div>
      <svg className="footer-mark" viewBox={layout.box.join(' ')} role="img" aria-label={TEXT.join(' ')}>
        {layout.parts.map((p) => <path key={p.name} d={p.d} transform={`translate(${p.x} 0)`} />)}
      </svg>
    </div>
  );
}
