import './SiteHeader.css';

/**
 * Top bar in the Phi Brain toolbar style: wordmark left, quiet pill links right.
 * The 2기 오픈 알림 신청 CTA is the page's most important action, so it is an ink
 * box with white type and stays pinned to the top-right while the page scrolls.
 */
const links = ['About', 'Programs', 'Experts', 'Admissions'];

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
