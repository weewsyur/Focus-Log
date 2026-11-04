import { navigate } from '../../hooks/useRoute';
import type { Page } from '../../types';
import { ChartNoAxesCombined, House, LogOut, Repeat, Settings, Timer } from 'lucide-react';

const ITEMS = [
  { page: 'dashboard', label: 'Home', icon: House }, { page: 'focus', label: 'Focus', icon: Timer },
  { page: 'habits', label: 'Habits', icon: Repeat }, { page: 'analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { page: 'settings', label: 'Settings', icon: Settings },
] satisfies { page: Page; label: string; icon: typeof House }[];

export function Sidebar({ active, onSignOut }: { active: Page; onSignOut: () => void }) {
  const item = 'inline-flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors';
  return (
    <aside className="flex flex-wrap items-center gap-1 bg-app-blue-deep p-3 text-app-white md:min-h-screen md:w-52 md:flex-col md:items-stretch md:p-4">
      <div className="mr-2 flex items-center gap-2 font-bold md:mb-5">
        <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
        <span>Focus Log</span>
      </div>
      <nav className="flex flex-wrap gap-1 md:flex-col" aria-label="Main">
        {ITEMS.map(({ page, label, icon: Icon }) => (
          <button key={page} type="button" onClick={() => navigate(page)} aria-current={active === page ? 'page' : undefined}
            className={`${item} ${active === page ? 'bg-app-white font-bold text-app-navy' : 'hover:bg-app-white/10'}`}>
            <Icon size={16} strokeWidth={2} aria-hidden="true" />{label}
          </button>
        ))}
      </nav>
      <div className="flex-1" />
      <button type="button" onClick={onSignOut} className={`${item} hover:bg-app-white/10 md:border-t md:border-app-white/20`}>
        <LogOut size={16} strokeWidth={2} aria-hidden="true" />Sign out
      </button>
    </aside>
  );
}
