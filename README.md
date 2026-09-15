# Phi Programs — 2차 리디자인

Beautiful Interface 1주차 과제. Phi [Programs 페이지](https://www.phi.design/programs) 리디자인.
[Figma 시안 (node 1650:6417)](https://www.figma.com/design/dhXKmqQ2FMSZ3c0VEWETej/Phi-Design-Institute?node-id=1650-6417)의 히어로·역량과 태도·페이지 목차를 구현하고, 같은 문법으로 나머지 섹션을 이어 설계했습니다.

배포 주소: https://yongzu.github.io/BI/ · 토큰 명세: https://yongzu.github.io/BI/#system

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run deploy   # dist → gh-pages 브랜치 (GitHub Pages)
```

## Figma에서 가져온 규칙

| 역할 | 값 |
|---|---|
| Display | Pretendard Bold 100 / 1.19 / -3% |
| Heading | Bold 64 / -3% |
| Lead | Regular 32 / 1.4 / -3%, 잉크 70% |
| Intro | Regular 20 / 1.4 / -3%, 잉크 70% |
| Title | Bold 24 / -3% |
| Label | Medium 16 / -3%, 잉크 20% |
| Body | Regular 16 / 1.6 / -2%, 잉크 70% |
| 잉크 | `#333` 한 가지 — 위계는 투명도 100 · 70 · 20% |
| 레이아웃 | 1140px 본문, 5열 그리드(196px + 40px 간격), 섹션 헤더는 제목 + 710px 리드 |
| 그룹 라벨 | 24px 제목 왼쪽 20px에 28px 세로선 (Figma 에셋) |
| 목차 | 좌측 237px, 13/12/11px, `#141414` · `#666` · `#9c9c9c`, 선 `#e3e3e3` |

## Figma 밖에서 이어 설계한 부분

- **과정 개요** 드롭다운 (히어로 아래): 높이·내용이 부드럽게 열리고 닫힘
- **연간 구조** 줌 타임라인: 칩이나 막대를 누르면 축이 해당 기간으로 확대되고 막대가 상세 카드로 펼쳐짐, 나머지 막대는 흐려지며 밀려남
- **주요 수업들**: 코스 타입별 수업 5열 그리드
- **수업을 관통하는 접근 · 방학 + 캠프 · 수료 & 졸업 · 채용 연계**: 섹션 헤더 + 그룹 라벨 + 3열 아이템
- **주간 시간표**: 가는 선만 쓰는 표
- 스크롤 시 텍스트가 투명한 상태에서 아래로부터 올라오며 나타남

## 구조

```
src/
├─ index.css                    글로벌: 폰트 로딩, 리셋, 렌더링 최적화
├─ styles/tokens/               color · typography · foundation
├─ assets/label-rule.svg        그룹 라벨 세로선 (Figma 에셋)
├─ components/
│  ├─ Text/                     <Text typography="Heading" color="primary" />
│  ├─ AnnualTimeline/           연간 구조 줌 타임라인
│  ├─ Dropdown/                 애니메이션 드롭다운
│  └─ Toc/                      좌측 페이지 목차
├─ hooks/useScrollReveal.ts     스크롤 텍스트 등장 인터랙션
├─ data/programs.ts             원본 페이지 콘텐츠
└─ pages/                       ProgramsPage, SystemPage
```
