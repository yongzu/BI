import { useState } from 'react';
import { Text } from '../components/Text/Text';
import { typographies, type Typography } from '../components/Text/typography';
import { Pill } from '../components/Pill/Pill';
import { Disclosure } from '../components/Disclosure/Disclosure';
import { ArticleCard } from '../examples/ArticleCard';
import { Dialog } from '../examples/Dialog';
import './system.css';

const typeSpec: Record<Typography, string> = {
  Display1: 'Helvetica → Pretendard · 64→160 · 700 · 0.9 · -0.045em  (project extension)',
  Display2: 'Helvetica → Pretendard · 48→88 · 700 · 0.95 · -0.035em  (project extension)',
  Title1: 'SEED t14 · 48/60 · 700',
  Title2: 'SEED t12 · 32/42 · 700',
  Title3: 'SEED t10 · 26/35 · 700  (= screenTitle)',
  Subtitle1: 'SEED t7 · 20/27 · 700',
  Subtitle2: 'SEED t5 · 16/22 · 700',
  Body1: 'SEED t5 + t6 lh · 16/24 · 400  (= articleBody)',
  Body2: 'SEED t4 · 14/22 · 400',
  Caption1: 'SEED t3 · 13/18 · 400',
  Caption2: 'SEED t2 · 12/16 · 700',
};

const palette = ['white', 'gray-50', 'gray-100', 'gray-200', 'gray-300', 'gray-400', 'gray-500', 'gray-600', 'gray-700', 'gray-800', 'gray-900', 'gray-950', 'black'];

const semantic = [
  ['bg-default', 'white'], ['bg-subtle', 'gray-50'], ['bg-muted', 'gray-100'], ['bg-inverse', 'black'],
  ['bg-hover', 'gray-100'], ['bg-pressed', 'gray-200'], ['bg-disabled', 'gray-100'],
  ['text-primary', 'black'], ['text-secondary', 'gray-600'], ['text-tertiary', 'gray-500'], ['text-disabled', 'gray-300'],
  ['border-subtle', 'gray-100'], ['border-default', 'gray-200'], ['border-strong', 'black'],
];

export function SystemPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className="system container">
      <a href="#" className="text-link typo-subtitle2">← Programs</a>
      <Text as="h1" typography="Display1">System</Text>
      <Text typography="Body1" color="secondary" className="measure">
        SEED 타이포그래피 스케일과 모노톤 컬러로 만든 토큰입니다. 굵기는 400·700 두 개만 쓰고, 위계는 크기로 만듭니다.
        둥근 모서리는 누를 수 있는 요소에만 씁니다.
      </Text>

      <section className="system__section">
        <Text as="h2" typography="Title2">Typography</Text>
        <ul className="type-list">
          {typographies.map((t) => (
            <li key={t}>
              <Text typography="Caption2" color="tertiary">{t} — {typeSpec[t]}</Text>
              <Text typography={t}>{t.startsWith('Display') ? 'Fundamental' : '우리는 정말 읽고 있을까?'}</Text>
            </li>
          ))}
        </ul>
      </section>

      <section className="system__section">
        <Text as="h2" typography="Title2">Palette</Text>
        <ul className="swatches">
          {palette.map((p) => (
            <li key={p}>
              <span className="swatch" style={{ background: `var(--palette-${p})` }} />
              <Text typography="Caption1">{p}</Text>
            </li>
          ))}
        </ul>
        <Text as="h3" typography="Subtitle1" className="system__sub">Semantic</Text>
        <ul className="semantic">
          {semantic.map(([name, ref]) => (
            <li key={name}>
              <span className="swatch swatch--sm" style={{ background: `var(--palette-${ref})` }} />
              <Text typography="Body2">--color-{name}</Text>
              <Text typography="Caption1" color="tertiary">{ref}</Text>
            </li>
          ))}
        </ul>
      </section>

      <section className="system__section">
        <Text as="h2" typography="Title2">Components</Text>
        <div className="system__row">
          <Pill selected>Selected</Pill>
          <Pill count={3}>Resting</Pill>
          <Pill disabled>Disabled</Pill>
        </div>
        <Disclosure summary={<Text as="span" typography="Subtitle1">Disclosure</Text>}>
          <Text typography="Body1" color="secondary">접힌 상태에서는 비교에 필요한 정보만, 펼치면 긴 내용을 보여줍니다.</Text>
        </Disclosure>
        <div className="system__cards">
          <ArticleCard category="Domain" title="완성도 120%의 인터페이스란 어떤 것일까?" summary="다양한 인터페이스 요소들을 끝까지 파고들었을 때 어떤 결과물을 만들어낼 수 있는지 실험해본다." meta="Beautiful Interface · 1–2개월" />
          <ArticleCard category="Ritual" title="읽기 쉽고 읽고 싶은 글" summary="내 글을 읽을 독자가 누구인지 설정하고, 그 독자에게 유용한 메시지를 설계한다." meta="Readable Writing · 월 1회" />
        </div>
        <div className="system__row">
          <button type="button" className="button button--primary typo-subtitle2" onClick={() => setOpen(true)}>Dialog 열기</button>
        </div>
        <Dialog
          open={open}
          title="오픈 알림을 신청할까요?"
          description="2기 모집이 시작되면 입력한 이메일로 가장 먼저 알려드려요."
          confirmLabel="신청하기"
          onConfirm={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </section>
    </main>
  );
}
