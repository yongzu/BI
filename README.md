# Phi Programs — 2차 리디자인

Beautiful Interface 1주차 과제. Phi [Programs 페이지](https://www.phi.design/programs)의 내용과 모노톤을,
[Apple iPhone Duo 페이지](https://www.apple.com/kr/iphone-duo/)의 타입 스케일·여백·컴포넌트 구조와 합쳤습니다.

배포 주소: https://yongzu.github.io/BI/ · 토큰/컴포넌트 명세: https://yongzu.github.io/BI/#system

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run deploy   # dist → gh-pages 브랜치 (GitHub Pages)
```

## 무엇을 합쳤나

| | Phi 원본에서 | Apple에서 |
|---|---|---|
| 콘텐츠 | 모든 문구·섹션 순서 | 섹션마다 짧은 마침표 헤드라인 (Phi 문장에서 발췌) |
| 컬러 | 흑백 모노톤, 강조색 없음 | `#f5f5f7` 교차 배경, 쿨 뉴트럴 그레이 (파란색은 제외) |
| 타이포 | 한 가지 목소리 | 80 · 48 · 28 · 24 · 21 · 17 · 14 · 12 스케일, 굵기 400/600 |
| Form | — | 28px 카드, 980px pill 버튼, 원형 아이콘 버튼 |
| 컴포넌트 | — | 패들 갤러리, + 버튼 모달, 세그먼트 컨트롤, 뷰어 컨트롤 pill, FAQ 아코디언 |

## 내비게이션

상단 바 대신 1차 리디자인의 계층 목차(ON THIS PAGE)를 좌측에 작고 투명하게 둡니다. 3단계 들여쓰기, 현재 위치는 막대로 표시하고, 1200px 미만에서는 숨깁니다.

## 인터랙션

스크롤로 텍스트 블록이 화면에 들어오면 투명한 상태에서 40px 아래로부터 올라오며 나타납니다(Apple). 같은 묶음 안에서는 90ms씩 순차로 등장하고, 동작 줄이기 설정에서는 꺼집니다.

## 섹션 매핑

| Phi 섹션 | Apple 패턴 |
|---|---|
| 소개 · 기본 정보 | 중앙 정렬 히어로 + "일단 핵심부터." 스탯 카드 |
| 역량과 태도 | 패들 갤러리 타일 |
| 커리큘럼 연간 구조 | "보다 자세히 들여다보기." 컨트롤 pill + 뷰어 |
| 주요 수업 | 세그먼트 필터 + 코스 카드 갤러리 + 모달 상세 |
| 수업 장치 | "질문에 답해드립니다." FAQ 아코디언 |
| 시간표 · 캠프 · 수료 & 졸업 | 카드 / 갤러리 / 2열 카드 |

## 구조

```
src/
├─ index.css                    글로벌: 폰트 로딩, 리셋, 렌더링 최적화
├─ styles/tokens/               color · typography · foundation
├─ components/
│  ├─ Text/                     <Text typography="Headline" color="primary" />
│  ├─ Button/                   Button (pill), IconButton (round)
│  ├─ Gallery/                  scroll-snap 갤러리 + 패들
│  ├─ Accordion/                FAQ 아코디언
│  ├─ Segmented/                세그먼트 컨트롤
│  ├─ Modal/                    카드 상세 모달
│  └─ Toc/                      좌측 계층 목차
├─ hooks/useScrollReveal.ts     스크롤 텍스트 등장 인터랙션
├─ data/programs.ts             원본 페이지 콘텐츠
└─ pages/                       ProgramsPage, SystemPage
```

서체: SF Pro는 번들할 수 없어 Apple 기기에서는 시스템 서체, 그 외에는 Pretendard로 표시됩니다.
