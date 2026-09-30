import { useEffect, useState } from 'react';
import { scrollToTarget } from '../../smoothScroll';
import './SiteHeader.css';

/**
 * Top bar in the Phi Brain toolbar style: wordmark left, quiet pill links right.
 * The bar itself is fully transparent and scrolls away with the page, taking the menu
 * links with it — only the Phi wordmark (top-left) and the 2기 오픈 알림 신청 CTA
 * (an ink box, the page's most important action, top-right) stay pinned (사용자 지시 2026-09-30).
 */
const links = ['About', 'Programs', 'Experts', 'Admissions'];

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

export function SiteHeader({ current = 'Programs' }: { current?: string }) {
  return (
    <header className="site-header">
      <a href="#" className="site-header__brand" aria-label="Phi Institute of Design 홈">Phi</a>
      <nav className="site-header__nav" aria-label="주요 메뉴">
        {links.map((l) => (
          <a key={l} href="#" className="site-header__link" aria-current={l === current ? 'page' : undefined}>
            {l}
          </a>
        ))}
      </nav>
      {/* Placeholder keeps the nav from sliding under the fixed CTA */}
      <span className="site-header__cta-space" aria-hidden="true" />
      <a href="https://www.phi.design/updates" className="site-header__cta" target="_blank" rel="noreferrer">
        2기 오픈 알림 신청
      </a>
    </header>
  );
}
