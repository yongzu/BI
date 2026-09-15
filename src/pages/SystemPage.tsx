import { Text } from '../components/Text/Text';
import { typographies, type Typography } from '../components/Text/typography';
import './programs.css';
import './system.css';

const typeSpec: Record<Typography, string> = {
  Display: '100 · Bold · 1.19 · -3%',
  Heading: '64 · Bold · 1.2 · -3%',
  Lead: '20 · Regular · 1.4 · -3%',
  Intro: '20 · Regular · 1.4 · -3%',
  Title: '24 · Bold · 1.2 · -3%',
  Label: '16 · Medium · 1.2 · -3%',
  Body: '16 · Regular · 1.6 · -2%',
};

const colors = [
  ['text-primary', 'var(--color-text-primary)', '#333 · 100%'],
  ['text-secondary', 'var(--color-text-secondary)', '#333 · 70%'],
  ['text-tertiary', 'var(--color-text-tertiary)', '#333 · 20%'],
  ['border', 'var(--color-border)', '#e3e3e3'],
  ['nav-strong', 'var(--color-nav-strong)', '#141414'],
  ['nav', 'var(--color-nav)', '#666666'],
  ['nav-faint', 'var(--color-nav-faint)', '#9c9c9c'],
];

export function SystemPage() {
  return (
    <main className="container system">
      <a href="#" className="link typo-label">← Programs</a>
      <Text as="h1" typography="Heading" className="system__title">Design System</Text>
      <Text typography="Lead" color="secondary">Pretendard 한 가지, #333 잉크 한 가지. 위계는 크기·굵기와 잉크의 투명도(100 · 70 · 20%)로 만듭니다.</Text>

      <section className="system__section">
        <Text typography="Title">Typography</Text>
        <ul className="system__list">
          {typographies.map((t) => (
            <li key={t}>
              <Text typography="Label" color="tertiary">{t} — {typeSpec[t]}</Text>
              <Text typography={t}>도구보다 사고방식</Text>
            </li>
          ))}
        </ul>
      </section>

      <section className="system__section">
        <Text typography="Title">Color</Text>
        <ul className="system__swatches">
          {colors.map(([name, value, note]) => (
            <li key={name}>
              <span className="system__swatch" style={{ background: value }} />
              <Text typography="Label">{name}</Text>
              <Text typography="Body" color="secondary">{note}</Text>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
