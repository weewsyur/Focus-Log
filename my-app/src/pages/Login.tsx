import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { errMsg } from '../lib/utils';

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
  const field = 'rounded-lg border border-[#E3EAF3] px-3 py-2.5 text-sm';
  return (
    <div className="grid min-h-screen font-['Quicksand',system-ui,sans-serif] text-[#0B2F63] md:grid-cols-2">
      <div className="flex flex-col justify-center gap-4 bg-[#2180DB] p-8 text-white md:p-14">
        <div className="flex items-center gap-2 font-bold"><span className="h-4 w-4 rounded-full border-[3px] border-white border-t-[#32CC59]" />Focus Log</div>
        <h2 className="max-w-sm text-4xl font-bold leading-tight">Hours of studying, minus the hours of scrolling.</h2>
        <p className="text-sm opacity-90">25-minute sessions logged. Habits checked. Streak kept.</p>
      </div>
      <div className="flex items-center justify-center bg-white p-8">
        <form onSubmit={(e) => void submit(e)} className="flex w-full max-w-sm flex-col gap-3">
          <h2 className="text-2xl font-bold">{signup ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-sm text-[#6B7C93]">{signup ? 'Start your streak today' : 'Sign in to pick up your streak'}</p>
          {signup && <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />}
          <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className={field} type="password" placeholder="Password (min 6 characters)" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required
            autoComplete={signup ? 'new-password' : 'current-password'} />
          <p role="alert" className="min-h-5 text-sm text-red-600">{error ?? authError}</p>
          <Button type="submit" variant="secondary" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Sign up' : 'Sign in'}</Button>
          <p className="text-center text-sm">
            {signup ? 'Have an account? ' : 'New here? '}
            <button type="button" className="text-[#2180DB]" onClick={() => { setSignup(!signup); setError(null); }}>{signup ? 'Sign in' : 'Create an account'}</button>
          </p>
        </form>
      </div>
    </div>
  );
}
