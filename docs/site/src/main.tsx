import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import './site.css';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Adapters } from './pages/adapters';
import { ChartPage } from './pages/chart';
import { DashboardPage } from './pages/dashboard';
import { Gallery } from './pages/gallery';
import { Home } from './pages/home';
import { Playground } from './pages/playground';

/** The route is the hash, so the built site is plain static files on any host. */
function useRoute(): string {
  const [hash, setHash] = useState(() => location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    addEventListener('hashchange', onChange);
    return () => removeEventListener('hashchange', onChange);
  }, []);
  return hash.replace(/^#/, '') || '/';
}

const NAV = [
  ['/', 'Start'],
  ['/gallery', 'Gallery'],
  ['/playground', 'Playground'],
  ['/adapters', 'Three adapters'],
  ['/dashboard', 'Dashboard'],
] as const;

function Page({ route }: { route: string }) {
  if (route === '/gallery') return <Gallery />;
  if (route === '/playground') return <Playground />;
  if (route === '/adapters') return <Adapters />;
  if (route === '/dashboard') return <DashboardPage />;
  if (route.startsWith('/chart/')) return <ChartPage slug={route.slice('/chart/'.length)} />;
  return <Home />;
}

function Site() {
  const route = useRoute();
  useEffect(() => {
    // A new page moves focus to its content, as a page load would (WCAG 2.4.3).
    document.getElementById('content')?.focus();
  }, [route]);
  return (
    <>
      <a className="skip" href="#content" onClick={(e) => (e.preventDefault(), document.getElementById('content')?.focus())}>
        Skip to content
      </a>
      <header>
        <p className="brand">
          <a href="#/">silverpoint</a>
        </p>
        <nav aria-label="Documentation">
          <ul>
            {NAV.map(([path, label]) => (
              <li key={path}>
                <a href={`#${path}`} aria-current={route === path ? 'page' : undefined}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="content" tabIndex={-1}>
        <Page route={route} />
      </main>
      <footer>
        <p>MIT · Typeface: EB Garamond, SIL Open Font License.</p>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Site />
  </StrictMode>,
);
