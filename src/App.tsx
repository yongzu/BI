import { useEffect, useState } from 'react';
import { ProgramsPage } from './pages/ProgramsPage';
import { SystemPage } from './pages/SystemPage';
import { scrollToTarget } from './smoothScroll';

/** Two views, no router needed: #system shows the token/component spec. */
export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash);
      if (window.location.hash === '#system' || window.location.hash === '') scrollToTarget(0, { immediate: true });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return hash === '#system' ? <SystemPage /> : <ProgramsPage />;
}
