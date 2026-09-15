import { useState } from 'react';
import { Text } from '../components/Text/Text';
import { typographies, type Typography } from '../components/Text/typography';
import { Button, IconButton } from '../components/Button/Button';
import { Segmented } from '../components/Segmented/Segmented';
import { Accordion } from '../components/Accordion/Accordion';
import { Modal } from '../components/Modal/Modal';
import './programs.css';
import './system.css';

const typeSpec: Record<Typography, string> = {
  Hero: '48→80 · 600 · 1.1',
  Headline: '32→48 · 600 · 1.17',
  Stat: '40 · 600 · 1.1',
  Eyebrow: '28 · 600 · 1.25',
  Title: '24 · 600 · 1.25',
  Intro: '21 · 400 · 1.52',
  Body: '17 · 400 · 1.47',
  Label: '17 · 600 · 1.47',
  Caption: '14 · 400 · 1.43',
  Footnote: '12 · 400 · 1.33',
};

const palette = [
  ['white', '#ffffff'],
  ['gray-50', '#fafafc'],
  ['gray-100', '#f5f5f7'],
  ['gray-200', '#e8e8ed'],
  ['gray-300', '#d2d2d7'],
  ['gray-500', '#6e6e73'],
  ['gray-800', '#333336'],
  ['gray-900', '#1d1d1f'],
];

export function SystemPage() {
  const [tab, setTab] = useState<'a' | 'b' | 'c'>('a');
  const [open, setOpen] = useState(false);

  return (
    <main className="system">
      <section className="section">
        <div className="text-column">
          <a href="#" className="text-link typo-body">‹ Programs</a>
          <Text as="h1" typography="Hero" className="system__title">Design System.</Text>
          <Text typography="Intro" color="secondary">
            Phi의 흑백 모노톤과 Apple 제품 페이지의 타입 스케일, 여백, 둥근 카드를 합친 토큰입니다. 굵기는 400·600 두 가지만 씁니다.
          </Text>
        </div>
      </section>

      <section className="section section--alt">
        <div className="text-column">
          <Text typography="Headline" className="system__heading">Typography.</Text>
          <ul className="system__list">
            {typographies.map((t) => (
              <li key={t}>
                <Text typography="Caption" color="secondary">{t} — {typeSpec[t]}</Text>
                <Text typography={t}>도구보다 사고방식.</Text>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="text-column">
          <Text typography="Headline" className="system__heading">Color.</Text>
          <ul className="system__swatches">
            {palette.map(([name, hex]) => (
              <li key={name}>
                <span className="system__swatch" style={{ background: `var(--palette-${name})` }} />
                <Text typography="Label">{name}</Text>
                <Text typography="Caption" color="secondary">{hex}</Text>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--alt">
        <div className="text-column system__components">
          <Text typography="Headline" className="system__heading">Components.</Text>
          <div className="system__row">
            <Button size="lg">Primary</Button>
            <Button size="lg" variant="secondary">Secondary</Button>
            <IconButton icon="plus" label="더하기" tone="action" />
            <IconButton icon="prev" label="이전" />
            <IconButton icon="next" label="다음" />
          </div>
          <Segmented label="예시" value={tab} onChange={setTab} options={[{ value: 'a', label: '전체' }, { value: 'b', label: 'Fundamental' }, { value: 'c', label: 'Domain' }]} />
          <Accordion items={[
            { id: '1', title: '라이브데모', content: <Text typography="Body">전문가가 학습자의 과제를 실시간으로 푸는 과정을 시연합니다.</Text> },
            { id: '2', title: '피어크리틱', content: <Text typography="Body">루브릭 기반으로 구체적인 피드백을 주고받습니다.</Text> },
          ]} />
          <div><Button size="lg" onClick={() => setOpen(true)}>Modal 열기</Button></div>
          <Modal open={open} onClose={() => setOpen(false)} labelledBy="system-modal-title">
            <Text id="system-modal-title" typography="Headline">Art of Reading</Text>
            <Text typography="Intro" color="secondary">우리는 정말 읽고 있을까?</Text>
          </Modal>
        </div>
      </section>
    </main>
  );
}
