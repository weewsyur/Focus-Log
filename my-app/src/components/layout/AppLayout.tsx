import { useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Page } from '../../types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { errMsg } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AppLayoutProps { active: Page; title: string; actions?: ReactNode; children: ReactNode }

export function AppLayout({ active, title, actions, children }: AppLayoutProps) {
  const { signOut } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const handleSignOut = async () => {
    setSignOutBusy(true);
    try { await signOut(); setSignOutError(null); setSignOutOpen(false); }
    catch (e) { setSignOutError(errMsg(e, 'Could not sign out.')); }
    finally { setSignOutBusy(false); }
  };
  return (
    <div className="min-h-screen bg-app-primary font-['Quicksand',system-ui,sans-serif] md:flex">
      <Sidebar active={active === 'complete' ? 'focus' : active} onSignOut={() => { setSignOutError(null); setSignOutOpen(true); }} />
      <div className="min-w-0 flex-1 px-4 pb-8 md:px-6">
        <Header title={title} actions={actions} />
        {children}
      </div>
      {signOutOpen && (
        <Modal title="Sign out?" onClose={() => { if (!signOutBusy) setSignOutOpen(false); }}>
          <p className="text-sm leading-6 text-app-slate">Are you sure you want to sign out of Focus Log?</p>
          {signOutError && <p role="alert" className="mt-3 text-sm text-app-danger">{signOutError}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button className="rounded-lg" variant="ghost" disabled={signOutBusy} onClick={() => setSignOutOpen(false)}>Stay signed in</Button>
            <Button className="rounded-lg" variant="danger" disabled={signOutBusy} onClick={() => void handleSignOut()}>
              {signOutBusy ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
