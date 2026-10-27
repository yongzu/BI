// 벡터 낱말(VectorWord)의 글자 윤곽을 미리 뽑는다 — Pretendard Bold(페이지 글자와 같은 굵기)에서 낱말마다
// 윤곽 경로(d)와 앵커(곡선 위 점)를 em 단위(기준선 0, 아래로 +)로 src/data/vectorGlyphs.json에 쓴다.
// 낱말이나 자간을 바꾸면 다시 돌린다:  node scripts/vector-glyphs.mjs
//
// 앵커는 최소한으로(사용자 지시 2026-10-23 — 너무 많았다). phi.design 첫 화면 코드처럼:
// - 조절점(곡선 밖 점)은 그리지 않는다. 곡선 위 점만.
// - 앞뒤가 모두 직선인 꺾인 점은 모서리(네모, 1), 곡선에 닿은 점은 부드러운 점(원, 0).
// - 같은 윤곽에서 앞 점과 MIN_GAP(em)보다 가까운 점은 뺀다 — 모서리는 곡선 점보다 먼저 남긴다.
import { writeFileSync } from 'node:fs';
import opentype from 'opentype.js';

const FONT = 'node_modules/pretendard/dist/public/static/Pretendard-Bold.otf';
/** 낱말 → 자간(em) — 교육 철학 제목은 -0.035em(Philosophy.css .philosophy__title). 본문 낱말은 박스만이라 윤곽이 필요 없다 */
const WORDS = {
  Fundamental: -0.035,
  Over: -0.035,
  Tools: -0.035,
};
/** 앵커 사이 최소 간격(em) — 곡선 점은 이보다 가까우면 뺀다 */
const MIN_GAP = 0.13;

const font = opentype.loadSync(FONT);
const upm = font.unitsPerEm;
const r = (n) => Math.round((n / upm) * 10000) / 10000;

/** 한 글자 경로 → 윤곽마다 [x, y, 곡선에 닿았나] 점 목록 */
function contours(commands) {
  const out = [];
  let cur = null;
  for (const c of commands) {
    if (c.type === 'M') {
      cur = [{ x: c.x, y: c.y, inCurve: false, outCurve: false }];
      out.push(cur);
    } else if (c.type === 'L' || c.type === 'Q' || c.type === 'C') {
      const curve = c.type !== 'L';
      cur[cur.length - 1].outCurve = curve;
      cur.push({ x: c.x, y: c.y, inCurve: curve, outCurve: false });
    } else if (c.type === 'Z' && cur.length > 1) {
      // 닫는 점이 첫 점과 같으면 합친다
      const first = cur[0];
      const last = cur[cur.length - 1];
      if (Math.abs(first.x - last.x) < 1 && Math.abs(first.y - last.y) < 1) {
        first.inCurve = last.inCurve;
        cur.pop();
      } else {
        last.outCurve = false;
        first.inCurve = false;
      }
    }
  }
  return out;
}

function anchors(points) {
  const kept = [];
  const corner = (p) => !p.inCurve && !p.outCurve;
  // 모서리 먼저, 그다음 곡선 점 — 가까운 점끼리는 먼저 남은 쪽을 둔다
  for (const pass of [true, false]) {
    for (const p of points) {
      if (corner(p) !== pass) continue;
      if (kept.some((k) => Math.hypot(k.x - p.x, k.y - p.y) < MIN_GAP * upm)) continue;
      kept.push(p);
    }
  }
  return kept.map((p) => [r(p.x), r(p.y), corner(p) ? 1 : 0]);
}

const out = { ascent: r(font.ascender), descent: r(-font.descender), words: {} };
// 글자마다 따로(2026-10-27): 브라우저(가변 글꼴 · GPOS 커닝)와 이 정적 글꼴의 커닝이 달라 낱말 윤곽을 통째로 두면
// 'To'처럼 커닝이 큰 자리에서 윤곽이 글자와 어긋났다. 글자 경로는 각자 원점(0, 기준선)에 두고, x는 기본 자리로만 적는다 —
// 화면에서는 VectorWord가 캔버스로 잰 실제 글자 자리로 옮긴다
for (const [word, spacing] of Object.entries(WORDS)) {
  const glyphs = font.stringToGlyphs(word);
  let x = 0;
  const list = [];
  glyphs.forEach((g, i) => {
    const path = g.getPath(0, 0, upm); // 크기 upm → 좌표가 글꼴 단위 그대로, y는 아래로 +
    const d = [];
    for (const c of path.commands) {
      if (c.type === 'M') d.push(`M${r(c.x)} ${r(c.y)}`);
      else if (c.type === 'L') d.push(`L${r(c.x)} ${r(c.y)}`);
      else if (c.type === 'Q') d.push(`Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`);
      else if (c.type === 'C') d.push(`C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`);
      else if (c.type === 'Z') d.push('Z');
    }
    const nodes = [];
    for (const contour of contours(path.commands)) nodes.push(...anchors(contour));
    list.push({ x: r(x), d: d.join(''), nodes });
    const next = glyphs[i + 1];
    x += g.advanceWidth + (next ? font.getKerningValue(g, next) + spacing * upm : 0);
  });
  out.words[word] = { width: r(x), glyphs: list };
}

writeFileSync('src/data/vectorGlyphs.json', JSON.stringify(out));
console.log(Object.entries(out.words).map(([w, v]) => `${w}: ${v.width}em, ${v.glyphs.reduce((n, g) => n + g.nodes.length, 0)} anchors`).join('\n'));
