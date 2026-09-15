# Phi Programs — 2차 리디자인

Beautiful Interface 1주차 과제. Phi [Programs 페이지](https://www.phi.design/programs)를 타이포그래피와 Form 중심으로 리디자인했습니다.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

`#system` 해시로 이동하면 토큰·컴포넌트 명세 페이지가 열립니다.

## 스타일 기준

[yongzu.github.io](https://yongzu.github.io/)와 [Phi Brain](https://yongzu.github.io/Phi_Brain/prototypes/home.html)의 스타일 소스를 기준으로 한 미니멀 버전입니다.

- 서체: Pretendard 1종
- 크기: 12pt(제목) · 10pt(나머지) 2단계 — SEED t5 · t3에 해당
- 굵기: 400 · 700
- 컬러: white + fill  · line  · gray  · ink - 위계는 크기가 아니라 **굵기와 톤**으로 만듭니다.

## 해결한 문제 (1 Pager)

| # | 문제 | 해결 방향 | 레퍼런스 |
|---|---|---|---|
| 0 | 굵기 5단계, 크기는 16·14·13px에 몰려 위계가 평평함 | 크기 2단계·굵기 2단계로 줄이고, 위계는 굵기(700/400)와 톤(ink/gray)으로 | 현대카드 |
| 1 | 코스 타입 경계가 안 보임 | 좌측 내비게이션에 코스 타입을 하위 탭으로 노출, 본문은 굵은 그룹 라벨 + 기간 메타 | 카카오 |
| 2 | 12개 수업 목록을 훑어 읽기 어려움 | 수업 한 줄 = 영문명(ink) + 국문명(gray), 설명은 Reveal로 접기 | 토스 채용 |
| 3 | 핵심 질문이 문단에 묻힘 | 펼치면 첫 문장을 ink로 분리해 설명(gray)보다 먼저 읽히게 | 당근 채용 |

Form 규칙: 누를 수 있는 요소만 반응합니다. 호버·선택 시 10px 밀리고, 점이 화살표로 바뀌며, 20px 스퀘어클 fill 또는 떠 있는 칩이 나타납니다.

## 구조

\
## 타이포그래피

| 시맨틱 | size / weight / line-height |
|---|---|
| Title | 12pt / 700 / 1.45 |
| Heading | 12pt / 400 / 1.45 |
| Label | 10pt / 700 / 1.45 |
| Body | 10pt / 400 / 1.45 |
| Copy | 10pt / 400 / 1.75 |
