import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Text } from '../Text/Text';
import type { Typography, TextColor } from '../Text/typography';
import './BlurReveal.css';

/**
 * 블러 등장 — 토스뱅크 디자인 채용 페이지의 '다양한 관점이 모여' 제목을 따름(사용자 지시 2026-10-03).
 * 큰 글씨는 단어마다 흐림 · 투명 · 조금 아래에서 차례로 선명해지며 올라오고,
 * 아래 설명(children)은 마지막 단어 뒤에 통째로 같은 방식으로 떠오른다.
 * 화면에 들어올 때 한 번만 재생한다. 움직임 줄이기 설정이면 처음부터 다 보인다.
 */
type Props = {
  lines: string[];
  typography: Typography;
  color?: TextColor;
  /** 큰 글씨에 붙는 클래스 */
  headingClassName?: string;
  className?: string;
  /** 첫 단어가 시작하기 전 기다리는 시간(ms) */
  delay?: number;
  children?: ReactNode;
};

const STEP_MS = 70; // 단어 사이 간격

export function BlurReveal({ lines, typography, color, headingClassName, className, delay = 0, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setShown(true);
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  let index = 0;
  const word = (w: string, key: string) => (
    <span key={key} className="blur-reveal__word" style={{ ['--i' as string]: index++ }}>{w}</span>
  );

  return (
    <div
      ref={ref}
      className={['blur-reveal', className].filter(Boolean).join(' ')}
      data-shown={shown}
      style={{ ['--blur-delay' as string]: `${delay}ms`, ['--blur-step' as string]: `${STEP_MS}ms` }}
    >
      {/* 읽기 도구는 쪼갠 단어 대신 문장 그대로 읽는다 */}
      <Text as="p" typography={typography} color={color} className={headingClassName}>
        <span className="blur-reveal__sr">{lines.join(' ')}</span>
        {lines.map((line, li) => (
          <span key={li} className="blur-reveal__line" aria-hidden="true">
            {line.split(' ').map((w, wi) => [wi > 0 && ' ', word(w, `${li}-${wi}`)])}
          </span>
        ))}
      </Text>
      {children && (
        <div className="blur-reveal__body" style={{ ['--i' as string]: index }}>
          {children}
        </div>
      )}
    </div>
  );
}
