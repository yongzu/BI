# Phi Programs — 2차 리디자인

Beautiful Interface 1주차 과제. Phi [Programs 페이지](https://www.phi.design/programs)를 타이포그래피와 Form 중심으로 리디자인했습니다.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

`#system` 해시로 이동하면 토큰·컴포넌트 명세 페이지가 열립니다.

## 해결한 문제 (1 Pager)

| # | 문제 | 해결 방향 | 레퍼런스 |
|---|---|---|---|
| 0 | 굵기 5단계, 크기는 16·14·13px에 몰려 위계가 평평함 | 굵기는 400·700 두 개, 위계는 크기 대비로. 이정표에만 다른 서체(Instrument Serif) | 현대카드 |
| 1 | 코스 타입 경계가 안 보임 | Fundamental / Domain / Ritual / Study를 표지형 Display 타이포로 | 카카오 |
| 2 | 12개 수업 목록을 훑어 읽기 어려움 | "굵고 큰 이름 + 가볍고 작은 정보" 한 줄 리듬, 설명은 아코디언 | 토스 채용 |
| 3 | 핵심 질문이 문단에 묻힘 | 펼치면 질문을 제목(Title2)으로 끌어올림 | 당근 채용 |

Form 규칙: **정보는 각지게, 누를 수 있는 것만 둥글게** (pill, 아코디언 행, 버튼).

## 구조

```
src/
├─ index.css                    글로벌: 폰트 로딩, 리셋, 렌더링 최적화
├─ styles/tokens/
│  ├─ typography.css            SEED t1–t14 스케일 → 시맨틱 스타일
│  ├─ color.css                 모노톤 팔레트 → 시맨틱 컬러
│  └─ foundation.css            radius, spacing, motion
├─ components/
│  ├─ Text/Text.tsx             <Text typography="Title1" color="primary" />
│  ├─ Pill/                     칩 / 필터
│  └─ Disclosure/               아코디언 행
├─ examples/                    ArticleCard, Dialog 사용 예시
├─ data/programs.ts             원본 페이지 콘텐츠
└─ pages/                       ProgramsPage, SystemPage
```

## 타이포그래피 (SEED 기반)

| 시맨틱 | 매핑 | size / line-height / weight |
|---|---|---|
| Display1 | 프로젝트 확장 | Instrument Serif 64→160 / 0.9 / 400, -0.03em |
| Display2 | 프로젝트 확장 | Instrument Serif 48→88 / 0.95 / 400, -0.02em |
| Title1 | t14 | 48 / 60 / 700 |
| Title2 | t12 | 32 / 42 / 700 |
| Title3 | t10 (screenTitle) | 26 / 35 / 700 |
| Subtitle1 | t7 | 20 / 27 / 700 |
| Subtitle2 | t5 | 16 / 22 / 700 |
| Body1 | t5 + t6 lh (articleBody) | 16 / 24 / 400 |
| Body2 | t4 | 14 / 22 / 400 |
| Caption1 | t3 | 13 / 18 / 400 |
| Caption2 | t2 | 12 / 16 / 700 |

SEED 문서에는 웹 letter-spacing 값이 없어 SEED 기반 스타일은 0입니다. Display는 SEED 최대치(48px)를 넘는 표지용 확장입니다.

## 컬러 (모노톤)

순수 흑·백과 R=G=B 그레이만 사용합니다. 텍스트 대비 기준(흰 배경):
gray-500 `#737373` 4.7:1 (AA 최소) · gray-600 `#525252` 7.8:1 · gray-400 이하는 장식/비활성 전용.
컴포넌트는 팔레트가 아닌 시맨틱 토큰(`--color-text-secondary` 등)만 참조합니다.
