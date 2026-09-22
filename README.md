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
| Heading | Bold 48 / -3% |
| Lead | Regular 20 / 1.4 / -3%, 잉크 70% |
| Intro | Regular 20 / 1.4 / -3%, 잉크 70% |
| Title | Bold 24 / -3% |
| Label | Medium 16 / -3%, 잉크 40% |
| Body | Regular 16 / 1.6 / -2%, 잉크 70% |
| 잉크 | `#333` 한 가지 — 위계는 투명도 100 · 70 · 40% |
| 레이아웃 | 1140px 본문, 5열 그리드(196px + 40px 간격), 섹션 헤더는 제목 + 710px 리드 |
| 그룹 라벨 | 24px 제목 왼쪽 20px에 28px 세로선 (Figma 에셋) |
| 목차 | 좌측 237px, 13/12/11px, `#141414` · `#666` · `#9c9c9c`, 선 `#e3e3e3`. 히어로 옆에서 시작해 스크롤 시 상단에 붙고, 본문이 끝나면 함께 올라감 |

## Figma 밖에서 이어 설계한 부분

- **상단 바** (Phi Brain 툴바 스타일): 좌측 워드마크, 우측 About · Programs · Experts · Admissions 알약 링크, 최우측 2기 오픈 알림 신청(검정 박스, 스크롤해도 고정)

- **과정 개요** 드롭다운 (히어로 아래): 스크롤을 내리면 자동으로 펼쳐지고 맨 위로 돌아오면 접힘. 클릭으로도 열고 닫을 수 있음
- **연간 구조** 줌 타임라인: 칩이나 막대에 호버하면 축이 해당 기간으로 확대되고 막대가 상세 카드로 펼쳐짐(나머지는 흐려지며 밀려남). 클릭하면 고정되고, 타임라인 밖을 클릭하면 전체로 복귀
- **주요 수업들**: 코스 타입별 수업 박스(4열). 호버하면 더 큰 미리보기 박스가 블러에서 드러나며 학습 목표 일부를 보여주고, 클릭하면 우측 패널에서 Course Profile 전체(수업 목표 · 수업 개요 · 학습 목표 Before/After · 전문가 소개)를 페이지 이동 없이 확인. 패널 안에서 ←/→로 12개 수업을 넘겨볼 수 있음
- **수업을 관통하는 접근 · 방학 + 캠프 · 수료 & 졸업 · 채용 연계**: 섹션 헤더 + 그룹 라벨 + 3열 아이템
- **주간 시간표**: 10–18시 시간축 캘린더 그리드. 세션을 실제 시간 범위에 배치하고 점심시간 띠를 가로질러 표시
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
│  ├─ CourseCard/               수업 박스 + 호버 미리보기
│  ├─ CoursePanel/              코스 프로필 사이드 패널
│  ├─ Dropdown/                 애니메이션 드롭다운
│  ├─ SiteHeader/               상단 바 + 고정 CTA
│  ├─ WeekGrid/                 주간 시간표 캘린더 그리드
│  └─ Toc/                      좌측 페이지 목차
├─ hooks/useScrollReveal.ts     스크롤 텍스트 등장 인터랙션
├─ data/programs.ts             원본 페이지 콘텐츠
├─ data/courseProfiles.ts       12개 Course Profile (phi.design에서 가져온 원문)
└─ pages/                       ProgramsPage, SystemPage
```
