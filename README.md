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

## 버전 기록

푸터 맨 아래에서 지난 버전 페이지로 건너갈 수 있습니다. 목록은 [public/versions.json](public/versions.json) 하나입니다.

- 최신 버전은 `/BI/`에, 지난 버전은 그때 코드로 고정된 빌드로 `/BI/v1/` · `/BI/v2/`에 둡니다. 각 버전은 같은 이름의 git 태그(`v1` · `v2`)에서 빌드합니다.
- `npm run deploy`는 지난 버전 폴더를 라이브 사이트에서 그대로 옮기고, 없는 버전만 태그에서 빌드합니다. 다시 빌드하려면 `npm run deploy -- --rebuild v1`을 실행합니다.
- 지난 버전을 태그에서 처음 빌드할 땐 그 버전의 의존성이 node_modules에 있어야 합니다(예: v10은 motion — 빠졌다면 `npm install --no-save motion@12`). 한 번 올라간 뒤로는 라이브에서 그대로 옮깁니다.
- 새 버전을 올릴 때는 세 단계를 거칩니다. 먼저 지금 버전의 커밋에 태그를 답니다(예: `git tag -a v3`). 다음으로 versions.json에서 그 버전의 `path`를 `"v3/"`로 바꾸고, 새 버전을 `path: ""`로 추가합니다. 마지막으로 `npm run deploy`를 실행합니다.

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
- **v12(2026-10-19, 역량: 토스 광고 카드 줄 연출)** — 배우는 역량: 붙는 무대에서 세로 스크롤 → 카드 줄 가로 이동(components/SkillScroll). v11의 SkillReveal은 v11 태그에 남음
- **v11(2026-10-19, 역량: 토스 상품 판매 연출)** — 배우는 역량: 큰 글씨 채움 → 작아짐 → 화면 폭 카드 다섯 장(components/SkillReveal). v10의 캐러셀 · TiltedCard · motion 의존성은 뺐다(v10 태그에 남음)
- **v10(2026-10-19, 역량 캐러셀 · 연간 구조 위 탭)** — 히어로 인터랙션 뺌. 연간 구조 탭을 섹션 위로. 배우는 역량: carousel-07(21st.dev, shadcnspace) 부채꼴 캐러셀 + react-bits TiltedCard(components/TiltedCard, MIT + Commons Clause), 붙는 무대에서 1 → 5 이너 스크롤(components/SkillCarousel). 의존성 motion 추가
- **v9(2026-10-19, 히어로 포털 · 스킬 카드 덱)** — 히어로: 포인터 깊이 + 스크롤 포털(components/HeroPortal). 배우는 역량: 붙는 무대 · 카드 딜링 · Φ 고리 · 기울기와 빛 · 카드 → 상세(View Transitions, components/SkillDeck)
- **v8(2026-10-19)** — 역량과 태도를 나눔: 배우는 역량(카드)은 과정 개요 다음, 태도는 채용 연계 다음 · 마무리 앞 "우리는 이렇게 사고한다"(components/PhiOS)
- **v7(2026-10-19, 카드 · 진행 바 · 고정 지도)** — v6(토스 레퍼런스 적용 시안) 위에 컴포넌트 · 인터랙션을 바꿨다. 근거 패널 "바뀐 점"은 2026-10-19 사용자 지시로 삭제했다
  - **과정 개요**: 숫자 타일 다섯 장(1년 · 1,000+ · 월–금 · 60명 · 8.24)
  - **역량과 태도**: 묶음마다 카드 다섯 장 + 아래 상세 띠(처음엔 첫 카드). 역량 띠의 수업 칩을 누르면 커리큘럼 상세 패널이 열린다 (components/ValueCards)
  - **연간 구조**: toss.im/company History 형식 — 위 시기 패널(질문 · 기간 · 사실 / 이름 · 설명 · 내용), 아래 진행 바(칸 길이 = 기간, 칸이 탭, ←/→). 위 탭 없음
  - **커리큘럼**: 세로 탭 · 카드 2열(After 미리보기, 차례로 떠오름) · 옆 패널(←/→, Esc, 휴대폰 전체 화면)
  - **수업을 관통하는 접근**: 왼쪽 고정 지도(배우는 자리 세 곳 · 장치 여섯) + 오른쪽 설명, 읽는 위치를 지도에 표시 (components/DeviceMap)
  - **채용 연계**: 카드 두 장 · **히어로 · 마무리**: 모집 마감 표시, 마무리 블록(v6부터)
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
