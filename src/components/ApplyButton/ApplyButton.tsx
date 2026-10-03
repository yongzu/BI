import type { ReactNode } from 'react';
import './ApplyButton.css';

/**
 * 지원하기 버튼 — 토스뱅크 디자인 채용 페이지의 rolling button을 따름(사용자 지시 2026-10-03).
 * 잉크로 채운 둥근 버튼 + 위쪽 빛 반사. 호버하면 조금 더 진해지고, 글이 오른쪽으로 4px 밀리며
 * 동그란 화살표가 옆에서 열린다.
 */
type Props = { href: string; children: ReactNode; className?: string };

export function ApplyButton({ href, children, className }: Props) {
  return (
    <a className={['apply-button', className].filter(Boolean).join(' ')} href={href} target="_blank" rel="noreferrer">
      <span className="apply-button__label">
        {children}
        <span className="apply-button__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="currentColor" />
            <path d="M7 12h9m-3.5-3.5L16 12l-3.5 3.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    </a>
  );
}
