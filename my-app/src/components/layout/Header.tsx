import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuthContext';
import { navigate } from '../../hooks/useRoute';
import { initials } from '../../lib/utils';

export function Header({ title, actions }: { title: string; actions?: ReactNode }) {
  const { profile } = useAuth();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-5 text-app-white">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        <button type="button" onClick={() => navigate('settings')} className="grid h-8 w-8 place-items-center rounded-full bg-app-white text-[11px] font-bold text-app-navy" aria-label="View profile and settings">
          {initials(profile?.displayName ?? '')}
        </button>
      </div>
    </header>
  );
}
