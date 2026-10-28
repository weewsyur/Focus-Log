import type { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { navigate } from '../../hooks/useRoute';
import { initials } from '../../lib/utils';

export function Header({ title, actions }: { title: string; actions?: ReactNode }) {
  const { profile } = useAuth();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 py-5 text-white">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {actions}
        <button type="button" onClick={() => navigate('settings')} className="rounded-full bg-white/20 px-3 py-1 text-xs hover:bg-white/30">Settings</button>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[11px] font-bold text-[#0B2F63]" aria-label="Profile">
          {initials(profile?.displayName ?? '')}
        </span>
      </div>
    </header>
  );
}
