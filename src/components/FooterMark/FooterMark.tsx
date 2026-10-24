import glyphs from '../../data/vectorGlyphs.json';
import './FooterMark.css';

/**
 * 푸터 맨 아래 'Fundamental Over Tools' — 푸터 폭에 꽉 차게(사용자 지시 2026-10-24).
 * 교육 철학 제목과 같은 글자 윤곽(Pretendard Bold, 자간 -0.035em — data/vectorGlyphs.json)을 한 줄로 이어 SVG로 그린다.
 * viewBox를 글자 잉크에 딱 맞춰 두어 폭 100%면 왼쪽 · 오른쪽 끝이 푸터 글줄 끝에 닿는다(글꼴 크기를 재서 맞출 필요가 없다).
 */
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
  return (
    <svg className="footer-mark" viewBox={layout.box.join(' ')} role="img" aria-label={TEXT.join(' ')}>
      {layout.parts.map((p) => <path key={p.name} d={p.d} transform={`translate(${p.x} 0)`} />)}
    </svg>
  );
}
