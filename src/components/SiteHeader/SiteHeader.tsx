import { useEffect, useState } from 'react';
import { scrollToTarget } from '../../smoothScroll';
import './SiteHeader.css';

/**
 * Top bar in the Phi Brain toolbar style: wordmark left, quiet pill links and the CTA right.
 * The bar itself is fully transparent and scrolls away with the page, taking the menu links with it.
 * The Phi wordmark stays pinned top-left; past the hero a pinned copy of the CTA fades in top-right (v15, 2026-10-23).
 */
// v15(2026-10-23): 메뉴가 모두 href="#"라 눌러도 맨 위로만 갔다 — phi.design의 실제 주소로 잇는다(지금 페이지 Programs는 그대로 맨 위)
const links: [string, string][] = [
  ['About', 'https://www.phi.design/about'],
  ['Programs', '#'],
  ['Experts', 'https://www.phi.design/experts'],
  ['Admissions', 'https://www.phi.design/admissions'],
];

/**
 * 맨 위로 버튼(사용자 지시 2026-09-22): 한 화면쯤 내려가면 오른쪽 아래에 나타나고, 누르면 부드럽게 맨 위로.
 */
export function BackToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const update = () => setShown(window.scrollY > window.innerHeight * 0.8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <button
      type="button"
      className="back-to-top"
      data-shown={shown}
      aria-label="맨 위로"
      title="맨 위로"
      tabIndex={shown ? 0 : -1}
      onClick={() => scrollToTarget(0)}
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}

/** 바깥(새 탭)으로 나가는 링크 표시 — 글자 뒤 작은 ↗(v15) */
export function External() {
  return (
    <>
      <span className="external-mark" aria-hidden="true">↗</span>
      <span className="visually-hidden">(새 탭)</span>
    </>
  );
}

export function SiteHeader({ current = 'Programs', cta }: { current?: string; cta: { href: string; label: string } }) {
  // 히어로를 지나면 오른쪽 위에 고정된 신청 버튼이 나타난다(v15, 2026-10-23 — 상단바와 함께 사라져 다 읽은 뒤 신청하려면
  // 맨 위로 돌아가야 했다. 2026-10-12 '상단에만'을 바꿈). 목차는 2026-10-19부터 오른쪽 세로 가운데라 자리가 겹치지 않는다
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const update = () => setPinned(window.scrollY > window.innerHeight * 0.8);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <header className="site-header">
      <a href="#" className="site-header__brand" aria-label="Phi Institute of Design 홈">Phi</a>
      <nav className="site-header__nav" aria-label="주요 메뉴">
        {links.map(([l, href]) => (
          <a key={l} href={href} className="site-header__link" aria-current={l === current ? 'page' : undefined}>
            {l}
          </a>
        ))}
      </nav>
      <a href={cta.href} className="site-header__cta" target="_blank" rel="noreferrer">
        {cta.label} <External />
      </a>
      <a href={cta.href} className="site-header__cta site-header__cta--pinned" data-shown={pinned} tabIndex={pinned ? 0 : -1} aria-hidden={!pinned} target="_blank" rel="noreferrer">
        {cta.label} <External />
      </a>
    </header>
  );
}
