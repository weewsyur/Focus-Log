import { navigate } from '../../hooks/useRoute';
import type { Page } from '../../types';

const ITEMS: { page: Page; label: string }[] = [
  { page: 'dashboard', label: 'Home' }, { page: 'focus', label: 'Focus' }, { page: 'habits', label: 'Habits' },
  { page: 'analytics', label: 'Analytics' }, { page: 'settings', label: 'Settings' },
];

export function Sidebar({ active, onSignOut }: { active: Page; onSignOut: () => void }) {
  const item = 'rounded-md px-3 py-2 text-left text-sm';
  return (
    <aside className="flex flex-wrap items-center gap-1 bg-[#1255A8] p-3 text-white md:min-h-screen md:w-52 md:flex-col md:items-stretch md:p-4">
      <div className="mr-2 flex items-center gap-2 font-bold md:mb-5">
        <span className="h-4 w-4 rounded-full border-[3px] border-white border-t-[#32CC59]" />Focus Log
      </div>
      <nav className="flex flex-wrap gap-1 md:flex-col" aria-label="Main">
        {ITEMS.map(({ page, label }) => (
          <button key={page} type="button" onClick={() => navigate(page)} aria-current={active === page ? 'page' : undefined}
            className={`${item} ${active === page ? 'bg-white font-bold text-[#0B2F63]' : 'hover:bg-white/10'}`}>{label}</button>
        ))}
      </nav>
      <div className="flex-1" />
      <button type="button" onClick={onSignOut} className={`${item} hover:bg-white/10 md:border-t md:border-white/20`}>Sign out</button>
    </aside>
  );
}
