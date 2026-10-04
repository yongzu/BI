/* 히어로 일렁임 셰이더(WebGL2). 좌표는 CSS px, y는 아래로. 텍스처는 글자만 그린 투명 이미지(premultiplied).

   파동 하나(사용자 지시 2026-10-04 — 토스뱅크 디자인 채용 히어로처럼):
   글자 덩어리 가운데(uCenter)에서 고리 하나(반지름 uR, 폭 uW)가 퍼지고, 그 고리가 지나는 자리에서
   굴절(렌즈처럼 글자를 늘이고 누름) · 흐림 · 색번짐이 같은 모양으로 함께 커졌다 사라진다. 지나간 안쪽엔 옅은 흐림 여운.
   세기 전체는 uEnv(시간에 따라 0 → 1 → 0)로 켜고 끈다. 세기 값(색번짐 9 · 흐림 30, 고리 폭 360)은 토스와 같고 굴절은 22(토스 34보다 약하게),
   1920 디자인 프레임 px라 HeroRipple.tsx가 화면 배율을 곱해 넘긴다.
   거리는 세로를 0.7로 나눠 잰다 — 고리가 옆으로 넓은 타원(가로로 긴 글자 덩어리에 맞게).
   토스의 파란 빛은 넣지 않는다 — 일렁임만(사용자 지시 2026-10-03). */

export const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

export const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uTex;
uniform vec2 uSize;        // 캔버스 CSS px
uniform float uDpr;
uniform vec2 uCenter;      // 파동 중심(글자 덩어리 가운데)
uniform float uR;          // 고리 반지름
uniform float uW;          // 고리 폭
uniform float uEnv;        // 세기(시간에 따라 0 → 1 → 0)
uniform float uStrength;   // 굴절 거리(px)
uniform float uChroma;     // 색번짐 거리(px)
uniform float uBlur;       // 흐림 반지름(px)
uniform float uAlpha;      // 글자 불투명도 — 첫 화면에서 떠오르며 0 → 1
uniform float uShift;      // 글자를 아래로 내린 거리(px) — 첫 화면에서 떠오르며 40 → 0
uniform vec3 uBg;

in vec2 vUv;
out vec4 outColor;

// 고리 단면: 가우시안 × 코사인(앞은 밀고 뒤는 당겨 글자가 늘고 눌림) + 안쪽으로 잦아드는 여운
float packet(float u) {
  float b = max(-u, 0.0);
  return exp(-u * u * 1.8) * cos(2.2 * u) + sin(5.1 * b) * exp(-3.3575 * b) * 0.4;
}

vec4 tap(vec2 p, float lod) { return textureLod(uTex, p / uSize, lod); }
vec3 over(vec4 s, vec3 bg) { return s.rgb + bg * (1.0 - s.a); }

void main() {
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;
  vec2 q = p - uCenter;
  vec2 e = vec2(q.x, q.y / 0.7);
  float d = length(e);
  vec2 n = normalize(vec2(e.x, e.y / 0.7) + 1e-4); // 바깥 방향
  vec2 tng = vec2(-n.y, n.x);

  float u = (d - uR) / uW;              // 고리 기준 위치(0 = 고리 한가운데, 음수 = 지나간 안쪽)
  float pk = packet(u) * uEnv;
  float band = exp(-u * u * 1.8);
  float behind = max(-u, 0.0);
  // 흐림은 고리보다 조금 안쪽에서 가장 세고, 지나간 자리엔 30% 여운
  float lag = u + 0.35;
  float blurPx = uBlur * uEnv * (exp(-lag * lag * 1.4) + 0.3 * exp(-behind * 1.6) * step(u, 0.0));
  float ch = uChroma * uEnv * (abs(pk) * 0.7 + band * 0.5);
  vec2 sp = p - n * uStrength * pk - vec2(0.0, uShift); // 굴절 + 떠오르기
  vec3 bg = uBg;

  vec3 col;
  if (blurPx < 0.4 && ch < 0.3) {
    col = over(tap(sp, 0.0), bg);
  } else {
    // 흐림 = 원판 위에 고르게 흩은 점(골든 앵글 나선) × 가우시안 무게. 점 사이 간격만큼은 밉맵으로 미리 흐려
    // 빈틈 · 겹상이 안 보이게 한다(예전 12점을 몇 줄에 몰아 찍던 방식은 가장자리가 거칠고 겹쳐 보였다, 2026-10-04)
    const int N = 24;
    float lod = log2(max(blurPx * uDpr * 2.0 / sqrt(float(N)), 1.0));
    bool split = ch >= 0.3;
    vec3 acc = vec3(0.0);
    float wsum = 0.0;
    for (int i = 0; i < N; i++) {
      float r = sqrt((float(i) + 0.5) / float(N));
      float a = float(i) * 2.39996;
      vec2 c = sp + (n * cos(a) + tng * sin(a)) * r * blurPx;
      float w = exp(-2.0 * r * r);
      vec3 v;
      if (split) {
        v = vec3(over(tap(c + n * ch, lod), bg).r, over(tap(c, lod), bg).g, over(tap(c - n * ch, lod), bg).b);
      } else {
        v = over(tap(c, lod), bg);
      }
      acc += v * w;
      wsum += w;
    }
    col = acc / wsum;
  }
  outColor = vec4(mix(bg, col, uAlpha), 1.0);
}`;
