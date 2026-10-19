/**
 * 다른 섹션에서 커리큘럼의 수업 상세 패널을 연다(v7) — 역량 카드의 "이 역량을 기르는 수업"이 쓴다.
 * CourseExplorer가 이 이벤트를 듣고 그 수업의 타입 탭을 고른 뒤 옆 패널을 연다. 페이지는 스크롤하지 않는다(패널은 화면에 고정).
 */
export const COURSE_OPEN_EVENT = 'course:open';
export const openCourse = (slug: string) => window.dispatchEvent(new CustomEvent(COURSE_OPEN_EVENT, { detail: slug }));
