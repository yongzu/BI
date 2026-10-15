# 01 · 인터랙션의 속성값

인터랙션을 "멋있다/심심하다"가 아닌 **속성값**으로 설명하기 위한 정리. 어떤 인터랙션이든 아래 7가지 값으로 쪼개어 말할 수 있고, 각 값마다 사용자 관점의 근거를 붙일 수 있다.

> 출처는 이름과 주소를 적어 두었다. 이 세션에서 원문을 다시 열어 보지는 않았으므로 발표 전 링크와 수치를 한 번 확인할 것.

---

## A. 속성값 7가지

### 1. 트리거 — 무엇이 시작시키나
| 값 | 맞는 경우 | 근거 / 주의 |
|---|---|---|
| **클릭(탭)** | 상태를 바꾸는 모든 것 (열기, 고정, 필터) | 마우스·터치·키보드 모두에서 같은 결과. 기본값으로 둔다. |
| **호버** | 미리보기, "누를 수 있음" 알림 | 터치에는 호버가 없다. 호버로만 볼 수 있는 정보가 있으면 모바일 사용자는 보지 못한다. 호버로 나타난 내용은 사라지지 않게 유지되고, 닫을 수 있고, 그 위로 마우스를 옮길 수 있어야 한다 (WCAG 2.1 SC 1.4.13 *Content on Hover or Focus*). 지나가기만 해도 열리지 않도록 지연(~0.3–0.5s)을 둔다 (NN/g *Timing Guidelines for Exposing Hidden Content*). |
| **스크롤 위치** | 읽는 흐름을 따라 순서대로 드러남 | 사용자가 요청하지 않은 변화. 레이아웃을 바꾸면(높이 변화) 읽던 자리를 잃는다. 등장 연출까지만 쓰고 내용을 숨기는 데는 쓰지 않는다. |
| **시간(자동)** | 히어로 루프처럼 정보가 아닌 분위기 | 5초 넘게 움직이는 것은 멈출 수 있어야 한다 (WCAG SC 2.2.2 *Pause, Stop, Hide*). 자동 넘김 캐러셀은 사용자가 놓치고 짜증을 낸다 (NN/g *Auto-Forwarding Carousels*). |

### 2. 피드백 — 시작했다는 걸 어떻게 아나
- **0.1초 안에** 반응해야 "내가 한 것"으로 느낀다. 1초를 넘으면 흐름이 끊긴다 (Nielsen, *Response Times: The 3 Important Limits*).
- 호버 시 배경 면, 커서 변화, 화살표 회전 같은 **시그니파이어**가 "누를 수 있음"을 알린다 (Norman, *The Design of Everyday Things* — affordance와 signifier 구분).

### 3. 지속 시간 · 이징
- UI 전환은 대략 **100–500ms**. 작고 가까운 변화는 짧게, 크고 먼 변화는 길게 (Material Design *Motion – Duration*; NN/g *Executing UX Animations: Duration and Motion Characteristics*).
- 들어올 때 ease-out(빠르게 시작해서 멈춤), 나갈 때 ease-in. 같은 길이라도 이징이 맞지 않으면 굼뜨게 느껴진다.
- 반복해서 쓰는 인터랙션일수록 짧게. 매번 기다려야 하는 애니메이션은 두 번째부터 비용이 된다.

### 4. 범위 — 하나만 / 여럿 / 전부
| 값 | 맞는 경우 |
|---|---|
| 하나만 열림 (배타) | 항목끼리 비교할 일이 없고, 한 번에 하나에 집중할 때 |
| 여럿 열림 (독립) | 사용자가 둘 이상을 나란히 비교할 때 |
| 전부 함께 | 항목이 아니라 "보기 방식"을 바꾸는 것일 때 (펼쳐 보기 / 접어 보기 토글) |

- 누른 것과 다른 것이 바뀌면 사용자는 원인과 결과를 연결하지 못한다. 한 칸을 눌렀는데 여섯 칸이 열리는 건 기대와 다르다 (Norman — *mapping*).

### 5. 상태 유지 — 언제까지 남나
- 일시(호버하는 동안) / 고정(다시 누를 때까지) / 기억(새로고침해도).
- 되돌리기 쉬워야 한다 — 같은 컨트롤을 다시 누르면 원래대로 (Nielsen 휴리스틱 3 *User control and freedom*).

### 6. 공간 변화 — 화면이 어떻게 움직이나
- **밀어내기**(아코디언처럼 아래 내용을 밀어냄): 맥락은 유지되지만 아래 콘텐츠가 이동한다.
- **덮기**(오버레이, 팝오버, 사이드 패널): 레이아웃은 그대로, 대신 뒤쪽을 가린다.
- **제자리 변형**(카드가 커짐, 축 확대): 관계를 보여 주기 좋지만 움직임이 크다.
- 사용자가 보던 곳(커서 아래, 읽던 줄)이 움직이지 않아야 한다. 호버로 높이가 변하면 커서 아래 항목이 바뀌어 연쇄적으로 열리고 닫힌다.

### 7. 발견 가능성 — 숨긴 걸 사용자가 찾나
- 숨긴 내용은 덜 읽힌다. 대부분의 사용자에게 필요한 정보라면 숨기지 않는다. **점진적 공개**는 "자주 필요한 것 먼저, 가끔 필요한 것은 한 단계 뒤"일 때 효과가 있다 (Nielsen, *Progressive Disclosure*).
- 아코디언은 사용자가 **일부만** 필요할 때 좋고, 대부분을 읽어야 한다면 펼쳐 두는 편이 낫다 (NN/g *Accordions on Desktop: When and How to Use*).
- 기억보다 알아보기 — 선택지가 보여야 한다 (Nielsen 휴리스틱 6 *Recognition rather than recall*).

---

## B. 패턴별 기대값 — "사용자가 이걸 보면 무엇을 기대하나"

| 패턴 | 사용자가 기대하는 것 | 맞는 정보 | 맞지 않는 정보 |
|---|---|---|---|
| **아코디언 / 드롭다운 줄** | 화살표나 +가 있는 줄을 누르면 그 줄 아래가 열린다 | 제목만으로 고를 수 있는 다수 항목, 일부만 읽음 (FAQ) | 짧고 모두 읽어야 하는 설명 |
| **탭 / 세그먼트** | 같은 자리의 내용이 바뀐다. 동시에 둘은 못 본다 | 서로 배타적인 분류, 하나만 보면 되는 경우 | 비교가 필요한 내용 (NN/g *Tabs, Used Right*) |
| **필터 칩** | 목록이 줄어든다. 해제하면 원래대로 | 같은 형식의 목록 (수업, 공고) | 형식이 다른 내용 묶음 |
| **타임라인 (가로 시간축)** | 왼쪽에서 오른쪽으로 시간이 흐르고, 길이가 기간 | 기간과 순서가 의미 있는 정보 | 순서가 없는 목록 |
| **카드 그리드** | 각 카드는 독립된 하나. 누르면 상세로 | 대등한 항목을 훑어보고 고르기 | 순서와 흐름이 있는 내용 |
| **사이드 패널 / 모달** | 지금 위치를 유지한 채 상세를 본다. 닫으면 돌아온다 | 목록을 오가며 상세를 보는 경우 | 한두 줄짜리 설명 |
| **툴팁 / 팝오버** | 짧은 보조 설명. 잠깐 보고 사라짐 | 용어 정의, 보조 수치 | 핵심 정보 (터치에서 안 보임) |
| **스크롤 연동 (스크롤리텔링)** | 내려갈수록 이야기가 진행된다 | 단계가 순서대로 쌓이는 설명 | 사용자가 골라 읽는 정보 |
| **하이라이트 연결 (브러싱)** | 하나를 가리키면 관련된 것이 함께 표시된다 | 항목 사이 관계 (역량 ↔ 수업) | 관계 없는 목록 |

---

## C. 근거로 쓸 기준 모음

| 근거 | 한 줄 요약 | 쓰는 자리 |
|---|---|---|
| Nielsen 10 휴리스틱 | 시스템 상태 보이기, 일관성, 알아보기, 사용자 통제 | 모든 섹션의 평가 기준 |
| Hick의 법칙 | 선택지가 늘수록 결정 시간이 늘어난다 | 필터 개수, 한 화면 항목 수 |
| Fitts의 법칙 | 목표가 크고 가까울수록 빨리 누른다 | 누를 영역 크기 (줄 전체를 누르게) |
| 게슈탈트 (근접, 유사, 공통 영역) | 가깝고 비슷하고 같은 면 안에 있으면 한 묶음 | 그룹 라벨, 역량/태도 두 단 |
| Miller 7±2 (청킹) | 한 번에 다루는 덩어리 수를 줄인다 | 12개 수업을 4개 타입으로 묶기 |
| Jakob의 법칙 | 사용자는 다른 사이트에서 익힌 방식을 기대한다 | 토스 채용 페이지 패턴 차용의 근거 |
| WCAG 2.1 (1.4.13, 2.2.2, 2.3.3) | 호버 내용 유지, 자동 움직임 멈춤, 움직임 줄이기 존중 | 호버 펼침, 히어로, 스크롤 연출 |
| 인지적 도제 (Collins, Brown & Newman 1989) | 모델링 · 코칭 · 스캐폴딩 · 명료화 · 성찰 · 탐구 | 관통하는 접근 섹션의 구조 (03 참고) |

## 주요 출처
- Nielsen, *10 Usability Heuristics for User Interface Design* — https://www.nngroup.com/articles/ten-usability-heuristics/
- Nielsen, *Progressive Disclosure* — https://www.nngroup.com/articles/progressive-disclosure/
- NN/g, *Accordions on Desktop: When and How to Use* — https://www.nngroup.com/articles/accordions-on-desktop/
- NN/g, *Tabs, Used Right* — https://www.nngroup.com/articles/tabs-used-right/
- NN/g, *Timing Guidelines for Exposing Hidden Content* — https://www.nngroup.com/articles/timing-exposing-content/
- Nielsen, *Response Times: The 3 Important Limits* — https://www.nngroup.com/articles/response-times-3-important-limits/
- W3C, *Understanding SC 1.4.13 Content on Hover or Focus* — https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html
- Laws of UX (Hick, Fitts, Jakob, Miller 등 요약) — https://lawsofux.com/
