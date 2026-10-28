import { useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Page } from '../../types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { errMsg } from '../../lib/utils';

interface AppLayoutProps { active: Page; title: string; actions?: ReactNode; children: ReactNode }

export function AppLayout({ active, title, actions, children }: AppLayoutProps) {
  const { signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const handleSignOut = async () => {
    try { await signOut(); setSignOutError(null); }
    catch (e) { setSignOutError(errMsg(e, 'Could not sign out.')); }
  };
  return (
    <div className="min-h-screen bg-[#2180DB] font-['Quicksand',system-ui,sans-serif] md:flex">
      <Sidebar active={active === 'complete' ? 'focus' : active} onSignOut={() => void handleSignOut()} />
      <div className="min-w-0 flex-1 px-4 pb-8 md:px-6">
        <Header title={title} actions={actions} />
        {signOutError && <p role="alert" className="mb-3 rounded-lg bg-white px-4 py-2 text-sm text-red-600">{signOutError}</p>}
        {children}
      </div>
    </div>
  );
}
