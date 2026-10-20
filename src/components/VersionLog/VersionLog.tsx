import { useEffect, useState } from 'react';
import { Text } from '../Text/Text';
import './VersionLog.css';

/**
 * 버전 기록 — 푸터 맨 아래에서 이전 버전 페이지로 건너간다(사용자 지시 2026-10-14).
 * 줄에는 번호와 핵심 변경(title)만 둔다 — 날짜와 긴 요약은 뺐다(사용자 지시 2026-10-20). versions.json의 date · summary는 기록으로 남는다.
 *
 * 목록은 사이트 맨 위의 versions.json(public/) 하나를 읽는다. 지난 버전(/BI/v1/ 등)은 그때 코드로 고정된 빌드라,
 * 목록을 빌드에 넣으면 나중 버전이 보이지 않는다 — 런타임에 맨 위 목록을 읽어 어느 버전에서든 같은 목록을 본다.
 * 지금 보는 버전은 주소로 안다: base가 …/v1/처럼 끝나면 그 버전, 아니면 맨 위(path '')인 최신 버전.
 * 이 파일은 지난 버전 스냅샷(태그 v1 · v2)에도 그대로 들어간다 — 그때의 토큰만 써도 되게 간격엔 기본값을 둔다.
 */
type Version = { id: string; date: string; title: string; summary: string; path: string };

const base = import.meta.env.BASE_URL; // '/BI/' · '/BI/v1/' · dev '/'
const own = base.match(/(v\d+)\/$/)?.[1];
const siteRoot = own ? base.slice(0, -(own.length + 1)) : base;

export function VersionLog() {
  const [versions, setVersions] = useState<Version[]>([]);
  useEffect(() => {
    let alive = true;
    fetch(`${siteRoot}versions.json`, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Version[]) => alive && setVersions(list))
      .catch(() => {}); // 목록을 못 읽으면 버전 기록 없이 푸터만
    return () => { alive = false; };
  }, []);

  if (!versions.length) return null;
  const current = own ?? versions.find((v) => v.path === '')?.id;

  return (
    <nav className="version-log" aria-label="버전 기록">
      <Text as="h2" typography="Label" color="tertiary">버전 기록</Text>
      <ol className="version-log__list">
        {[...versions].reverse().map((v) => {
          const isCurrent = v.id === current;
          const row = (
            <>
              <Text as="span" typography="Label" color="primary" className="version-log__id">{v.id}</Text>
              <Text as="span" typography="Label" color="primary" className="version-log__text">{v.title}</Text>
              <Text as="span" typography="Label" color="tertiary" className="version-log__state">{isCurrent ? '보는 중' : '보기'}</Text>
            </>
          );
          return (
            <li key={v.id}>
              {isCurrent ? (
                <span className="version-log__row" aria-current="page">{row}</span>
              ) : (
                <a className="version-log__row" href={`${siteRoot}${v.path}`}>{row}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
