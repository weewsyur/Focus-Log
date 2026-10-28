import { useEffect, useState } from 'react';
import type { Page } from '../types';

const PAGES: Page[] = ['dashboard', 'focus', 'habits', 'analytics', 'settings', 'complete'];
function read(): Page {
  const h = window.location.hash.replace(/^#\/?/, '') as Page;
  return PAGES.includes(h) ? h : 'dashboard';
}
export function navigate(page: Page): void { window.location.hash = `/${page}`; }
export function useRoute(): Page {
  const [page, setPage] = useState<Page>(read);
  useEffect(() => {
    const on = () => setPage(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return page;
}
