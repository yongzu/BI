import { useEffect, useRef, useState } from 'react';
import { Text } from '../Text/Text';
import { scrollToTarget } from '../../smoothScroll';
import { changes, notYet, release, rules } from '../../data/changes';
import './ChangeNotes.css';

/**
 * 바뀐 점(v6 시안, 2026-10-19) — 최종본이 아니므로 무엇을 왜 바꿨는지를 페이지에서 바로 본다(사용자 지시 2026-10-19).
 * - 왼쪽 아래에 늘 떠 있는 버튼, 그리고 바뀐 섹션마다 머리글 옆 작은 버튼(ChangeChip)이 같은 패널을 연다.
 *   섹션 버튼으로 열면 그 섹션 항목으로 바로 간다.
 * - 패널은 왼쪽에서 나오는 논모달 — 페이지를 보며 읽는다(커리큘럼 상세 패널은 오른쪽). Esc · 닫기로 닫는다.
 * - 항목마다 전 → 후 · 근거 · 토스 레퍼런스(노트의 캡처로 이동) · 남은 일, 그리고 "이 섹션 보기".
 */
const EVENT = 'changes:open';
const openChanges = (id?: string) => window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));

const base = import.meta.env.BASE_URL; // '/BI/' · dev '/'
const prevUrl = `${base}${release.prev}/`;
const tossUrl = (anchor: string) => `https://yongzu.github.io/notes/#d1015-toss-${anchor}`;

/** 섹션 머리글 옆 작은 버튼 */
export function ChangeChip({ id }: { id: string }) {
  return (
    <button type="button" className="change-chip" onClick={() => openChanges(id)} aria-label={`${release.id}에서 이 섹션이 바뀐 점과 근거 보기`}>
      <span className="change-chip__dot" aria-hidden="true" />
      {release.id}에서 바뀐 점
    </button>
  );
}

export function ChangeNotes() {
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      opener.current = document.activeElement as HTMLElement | null;
      setFocus((e as CustomEvent<string | undefined>).detail ?? null);
      setOpen(true);
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);

  const close = () => {
    setOpen(false);
    opener.current?.focus({ preventScroll: true });
  };

  // 열리면 닫기 버튼으로 초점, 섹션 버튼으로 열었으면 그 항목을 패널 맨 위로
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const scroller = scrollRef.current;
    const entry = focus ? scroller?.querySelector<HTMLElement>(`[data-change="${focus}"]`) : null;
    if (scroller) scroller.scrollTo({ top: entry ? entry.offsetTop - 16 : 0, behavior: 'instant' as ScrollBehavior });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      opener.current?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, focus]);

  const goTo = (target?: string) => {
    const el = target ? document.getElementById(target) : null;
    scrollToTarget(el ?? 0);
    if (window.matchMedia('(max-width: 720px)').matches) setOpen(false); // 휴대폰에선 패널이 화면을 덮으므로 닫고 이동
  };

  return (
    <>
      <button type="button" className="change-fab" aria-expanded={open} aria-controls="change-panel" onClick={() => (open ? close() : openChanges())}>
        <span className="change-fab__badge">{release.id}</span>
        <span>시안 · 바뀐 점 {changes.length}</span>
      </button>

      <aside id="change-panel" className="change-panel" data-open={open} role="dialog" aria-modal="false" aria-labelledby="change-panel-title" inert={!open}>
        <div className="change-panel__bar">
          <Text as="span" typography="Caption" color="tertiary">{release.id} · {release.date.replace(/-/g, '.')} · 최종본 아님</Text>
          <button ref={closeRef} type="button" className="change-panel__close" onClick={close} aria-label="닫기">×</button>
        </div>
        <div ref={scrollRef} className="change-panel__scroll" data-lenis-prevent>
          <header className="change-panel__intro">
            <Text as="h2" id="change-panel-title" typography="Title">이번 버전에서 바뀐 것</Text>
            <Text typography="Meta" color="secondary">
              토스 페이지 다섯 곳을 분석해 고른 적용 후보를 페이지에 직접 넣어 본 시안입니다. 항목마다 무엇이 어떻게 바뀌었는지와 그 근거, 참고한 토스 화면을 적었습니다.
            </Text>
            <span className="change-panel__links">
              <a className="change-panel__link" href={prevUrl} target="_blank" rel="noreferrer">{release.prev}(바꾸기 전) 보기 ↗</a>
              <a className="change-panel__link" href={release.notes} target="_blank" rel="noreferrer">분석 노트 ↗</a>
            </span>
          </header>

          <section className="change-rules" aria-labelledby="change-rules-title">
            <Text as="h3" id="change-rules-title" typography="Caption" color="tertiary" className="change-panel__kicker">페이지 전체 규칙</Text>
            <ul className="change-list">
              {rules.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </section>

          <ol className="change-entries">
            {changes.map((c) => (
              <li key={c.id} className="change-entry" data-change={c.id} data-focus={open && focus === c.id}>
                <div className="change-entry__head">
                  <Text as="h3" typography="Body" className="change-entry__title">{c.section}</Text>
                  <span className="change-entry__prio" data-prio={c.priority}>{c.priority}</span>
                  <button type="button" className="change-entry__go" onClick={() => goTo(c.target)}>이 섹션 보기</button>
                </div>
                <dl className="change-entry__body">
                  <dt>전</dt>
                  <dd><ul className="change-list change-list--muted">{c.before.map((t) => <li key={t}>{t}</li>)}</ul></dd>
                  <dt>후</dt>
                  <dd><ul className="change-list">{c.after.map((t) => <li key={t}>{t}</li>)}</ul></dd>
                  <dt>근거</dt>
                  <dd><ul className="change-list">{c.why.map((t) => <li key={t}>{t}</li>)}</ul></dd>
                  <dt>토스</dt>
                  <dd className="change-refs">
                    {c.refs.map(([label, anchor]) => (
                      <a key={anchor} className="change-ref" href={tossUrl(anchor)} target="_blank" rel="noreferrer">{label} ↗</a>
                    ))}
                  </dd>
                  {c.todo && (
                    <>
                      <dt>남은 일</dt>
                      <dd className="change-entry__todo">{c.todo}</dd>
                    </>
                  )}
                </dl>
              </li>
            ))}
          </ol>

          <section className="change-rules" aria-labelledby="change-later-title">
            <Text as="h3" id="change-later-title" typography="Caption" color="tertiary" className="change-panel__kicker">이번에 넣지 않은 것</Text>
            <ul className="change-list change-list--muted">
              {notYet.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
