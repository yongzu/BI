import { useState } from 'react';
import { Text } from '../components/Text/Text';
import { typographies, type Typography } from '../components/Text/typography';
import { Pill } from '../components/Pill/Pill';
import { Reveal, RevealList } from '../components/Reveal/Reveal';
import { ArticleCard } from '../examples/ArticleCard';
import { Dialog } from '../examples/Dialog';
import './programs.css';
import './system.css';

const typeSpec: Record<Typography, string> = {
  Title: '12pt · 700 · 1.45',
  Heading: '12pt · 400 · 1.45',
  Label: '10pt · 700 · 1.45',
  Body: '10pt · 400 · 1.45',
  Copy: '10pt · 400 · 1.75',
};

const palette = [
  ['white', '#ffffff', 'page'],
  ['fill', '#f5f5f5', 'hover · selected · surface'],
  ['line', '#ededed', 'divider · border'],
  ['gray', '#999999', 'secondary text · idle'],
  ['ink', '#333333', 'primary text · active'],
];

export function SystemPage() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('전체');

  return (
    <main className="shell system">
      <a href="#" className="link">← Programs</a>

      <section className="section">
        <Text as="h1" typography="Title">Design System</Text>
        <Text typography="Copy" color="secondary" className="section__lead">
          Pretendard 한 가지, 크기 두 가지(12pt·10pt), 굵기 두 가지(400·700), 흰색과 네 가지 톤.
          위계는 크기가 아니라 굵기와 톤으로 만듭니다.
        </Text>
      </section>

      <section className="section">
        <Text typography="Title">Typography</Text>
        <dl className="facts section__body">
          {typographies.map((t) => (
            <div key={t} className="facts__row">
              <Text as="dt" typography="Body" color="secondary">{t}<span className="block">{typeSpec[t]}</span></Text>
              <Text as="dd" typography={t}>우리는 정말 읽고 있을까?</Text>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <Text typography="Title">Color</Text>
        <dl className="facts section__body">
          {palette.map(([name, hex, role]) => (
            <div key={name} className="facts__row">
              <dt className="swatch-row">
                <span className="swatch" style={{ background: `var(--palette-${name})` }} />
                <Text as="span" typography="Body">{name}</Text>
              </dt>
              <Text as="dd" typography="Body" color="secondary">{hex} · {role}</Text>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <Text typography="Title">Components</Text>
        <div className="section__body">
          <div className="filter">
            {['전체', 'Fundamental', 'Domain'].map((p, i) => (
              <Pill key={p} className={i === 0 ? 'pill--start' : undefined} selected={selected === p} onClick={() => setSelected(p)}>{p}</Pill>
            ))}
          </div>
          <RevealList>
            <Reveal label="Reveal" meta="hover · open">
              <Text typography="Copy" color="secondary">점이 화살표로 바뀌고 행이 10px 밀리며, 라벨 뒤에 떠 있는 칩이 나타납니다.</Text>
            </Reveal>
            <Reveal label="Art of Reading" meta="읽기의 기술">
              <Text typography="Copy">우리는 정말 읽고 있을까?</Text>
            </Reveal>
          </RevealList>
          <div>
            <ArticleCard category="Domain" title="완성도 120%의 인터페이스란 어떤 것일까?" summary="다양한 인터페이스 요소들을 끝까지 파고들었을 때 어떤 결과물을 만들어낼 수 있는지 실험해본다." meta="Beautiful Interface" />
            <ArticleCard category="Ritual" title="읽기 쉽고 읽고 싶은 글" summary="내 글을 읽을 독자가 누구인지 설정하고, 그 독자에게 유용한 메시지를 설계한다." meta="Readable Writing" />
          </div>
          <div>
            <Pill className="pill--start" onClick={() => setOpen(true)}>Dialog 열기 →</Pill>
          </div>
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
