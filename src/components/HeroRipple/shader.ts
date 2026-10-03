/* 히어로 일렁임 셰이더(WebGL2). 좌표는 CSS px, y는 아래로. 텍스처는 글자만 그린 투명 이미지(premultiplied).

   토스 영상 실측으로 맞춘 흐름(반지름은 HeroRipple.tsx가 시간에 따라 넘긴다):
   글자 덩어리 위쪽 가운데(uCenter)에서 '흐림 앞머리'(uLead)가 퍼져 위 줄부터 글자를 흐리게 하고,
     뒤따라 '맑은 구멍'(uHole)이 열려 위 줄부터 다시 또렷하게 한다. 구멍 가장자리를 따라 굴절 · 색번짐 파동이 지나가고
     0.4초 뒤 옅은 흐림 고리가 한 번 더 지나간다.
   토스의 파란 빛은 넣지 않는다 — 일렁임만(사용자 지시 2026-10-03).
   거리는 세로를 0.7배로 줄여 잰다(위아래로 긴 타원). */

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
uniform float uScale;      // 1920 디자인 프레임 대비 배율
uniform vec2 uCenter;      // 흐림 · 일렁임 중심(글자 덩어리 위쪽 가운데)
uniform float uLead;       // 흐림 앞머리 반지름
uniform float uHole;       // 맑은 구멍 반지름
uniform float uHole2;      // 구멍을 0.4초 늦게 따라오는 두 번째(옅은) 흐림 고리
uniform float uFade;       // 끝에서 전체가 사라짐(1 → 0)
uniform vec3 uBg;

in vec2 vUv;
out vec4 outColor;

// 구멍 가장자리의 굴곡(가우시안 × 코사인) + 안쪽으로 잦아드는 여운
float packet(float u) {
  float b = max(-u, 0.0);
  return exp(-u * u * 1.8) * cos(2.2 * u) + sin(5.1 * b) * exp(-3.3575 * b) * 0.4;
}

vec4 tap(vec2 p, float lod) { return textureLod(uTex, p / uSize, lod); }
vec3 over(vec4 s, vec3 bg) { return s.rgb + bg * (1.0 - s.a); }

void main() {
  float k = uScale;
  vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uSize;

  vec2 q = p - uCenter;
  vec2 e = vec2(q.x, q.y * 0.7);
  float d = length(e);
  vec2 n = normalize(vec2(e.x, e.y * 0.7) + 1e-4); // 바깥 방향
  vec2 tng = vec2(-n.y, n.x);

  float lead = 1.0 - smoothstep(uLead - 220.0 * k, uLead + 120.0 * k, d);
  float ahead = smoothstep(uHole - 30.0 * k, uHole + 110.0 * k, d);
  float zone = lead * ahead * uFade;

  float open = smoothstep(0.0, 80.0 * k, uHole);
  float u = (d - uHole) / (150.0 * k);
  float pk = packet(u) * open * uFade;
  float edge = exp(-u * u * 1.8) * open * uFade;
  float u2 = (d - uHole2) / (120.0 * k);
  float ring2 = exp(-u2 * u2) * smoothstep(0.0, 80.0 * k, uHole2) * uFade;

  float blurPx = 22.0 * k * zone + 4.5 * k * ring2;
  float ch = 7.0 * k * (abs(pk) * 0.8 + edge * 0.4);
  vec2 sp = p - n * 22.0 * k * pk; // 굴절
  vec3 bg = uBg;

  vec3 col;
  if (blurPx < 0.4 && ch < 0.3) {
    col = over(tap(sp, 0.0), bg);
  } else {
    float lod = log2(max(blurPx * uDpr * 0.5, 1.0));
    vec3 acc = vec3(0.0);
    const int N = 12;
    for (int i = 0; i < N; i++) {
      float f = (float(i) + 0.5) / float(N) - 0.5;
      float a = float(i) * 2.39996;
      vec2 c = sp + (n * f * 1.2 + tng * sin(a) * 0.6) * blurPx;
      acc.r += over(tap(c + n * ch, lod), bg).r;
      acc.g += over(tap(c, lod), bg).g;
      acc.b += over(tap(c - n * ch, lod), bg).b;
    }
    col = acc / float(N);
  }
  outColor = vec4(col, 1.0);
}`;
