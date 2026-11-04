import { useState, type ComponentProps, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { LoginClock } from '../components/focus/LoginTimer';
import { errMsg } from '../lib/utils';
import { LockKeyhole, LogIn, Mail, UserRound, UserRoundPlus, type LucideIcon } from 'lucide-react';

function IconInput({ icon: Icon, ...props }: ComponentProps<'input'> & { icon: LucideIcon }) {
  return (
    <span className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={16} strokeWidth={2} aria-hidden="true" />
      <input {...props} className="w-full rounded-lg border border-app-border py-2.5 pl-9 pr-3 text-sm" />
    </span>
  );
}

export function Login() {
  const { signIn, signUp, error: authError } = useAuth();
  const [signup, setSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (signup) await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (err) { setError(errMsg(err, 'Could not sign in.')); }
    finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen text-app-navy md:grid-cols-2">
      <div className="flex flex-col justify-between gap-10 bg-app-primary p-8 text-app-white md:p-14">
        <div className="flex items-center gap-2 font-bold">
          <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl" />
          <span>Focus Log</span>
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <LoginClock />
          <h2 className="max-w-xs text-4xl font-bold leading-tight md:text-5xl">Hours of studying, minus the hours of scrolling.</h2>
        </div>
        <p className="text-sm opacity-90">25-minute sessions logged. Habits checked. Streak kept.</p>
      </div>
      <div className="flex items-center justify-center bg-app-white p-8">
        <form onSubmit={(e) => void submit(e)} className="flex w-full max-w-sm flex-col gap-3">
          <h2 className="text-2xl font-bold">{signup ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-sm text-app-muted">{signup ? 'Start your streak today' : 'Sign in to pick up your streak'}</p>
          {signup && <IconInput icon={UserRound} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />}
          <IconInput icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <IconInput icon={LockKeyhole} type="password" placeholder="Password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required
            autoComplete={signup ? 'new-password' : 'current-password'} />
          <p role="alert" className="min-h-5 text-sm text-app-danger">{error ?? authError}</p>
          <Button type="submit" variant="secondary" icon={<LogIn size={16} strokeWidth={2} aria-hidden="true" />} disabled={busy}>{busy ? 'Please wait…' : signup ? 'Sign up' : 'Sign in'}</Button>
          <p className="text-center text-sm">
            {signup ? 'Have an account? ' : 'New here? '}
            <button type="button" className="inline-flex items-center gap-1 text-app-primary" onClick={() => { setSignup(!signup); setError(null); }}>
              {signup ? <LogIn size={14} strokeWidth={2} aria-hidden="true" /> : <UserRoundPlus size={14} strokeWidth={2} aria-hidden="true" />}
              {signup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}