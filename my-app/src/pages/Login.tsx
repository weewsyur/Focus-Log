import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Circle, Eye, EyeOff, LockKeyhole, LogIn, Mail, UserRound, UserRoundPlus, type LucideIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/ToastContext';
import { Button } from '../components/ui/Button';
import { LoginClock } from '../components/focus/LoginTimer';
import { getPasswordRequirements, isPasswordValid } from '../lib/passwordValidation';
import { errMsg } from '../lib/utils';

function IconInput({ icon: Icon, trailing, className = '', ...props }: ComponentProps<'input'> & { icon: LucideIcon; trailing?: ReactNode }) {
  return (
    <span className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" size={16} strokeWidth={2} aria-hidden="true" />
      <input {...props} className={`w-full rounded-lg border border-app-border py-2.5 pl-9 text-sm ${trailing ? 'pr-10' : 'pr-3'} ${className}`} />
      {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
    </span>
  );
}

function VisibilityToggle({ visible, onToggle, label }: { visible: boolean; onToggle: () => void; label: string }) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <button type="button" onClick={onToggle} aria-label={`${visible ? 'Hide' : 'Show'} ${label}`} aria-pressed={visible}
      className="grid h-8 w-8 place-items-center rounded text-app-muted hover:bg-app-surface hover:text-app-navy">
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

export function Login() {
  const { signIn, signUp, error: authError } = useAuth();
  const { notify } = useToast();
  const [signup, setSignup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authError) notify('error', authError);
  }, [authError, notify]);

  const requirements = getPasswordRequirements(password);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setValidationError(null);
    if (signup) {
      if (!firstName.trim() || !lastName.trim()) {
        setValidationError('First name and last name are required.');
        return;
      }
      if (!isPasswordValid(password)) {
        setValidationError('Please meet every password requirement before creating your account.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
    }

    setBusy(true);
    try {
      if (signup) {
        const signedIn = await signUp({ firstName, lastName, middleName, suffix }, email.trim(), password);
        if (signedIn) notify('success', 'Your account was created successfully.');
        else notify('warning', 'Account created. Check your email to confirm your address before signing in.');
      } else {
        await signIn(email.trim(), password);
        notify('login', 'You are signed in.');
      }
    } catch (error) {
      notify('error', errMsg(error, signup ? 'Could not create your account.' : 'Could not sign in.'));
    } finally {
      setBusy(false);
    }
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
        <form onSubmit={(event) => void submit(event)} className="flex w-full max-w-sm flex-col gap-3">
          <h2 className="text-2xl font-bold">{signup ? 'Create account' : 'Welcome back'}</h2>
          <p className="text-sm text-app-muted">{signup ? 'Start your streak today' : 'Sign in to pick up your streak'}</p>
          {signup && (
            <>
              <IconInput icon={UserRound} placeholder="Last name" value={lastName} onChange={(event) => { setLastName(event.target.value); setValidationError(null); }} required autoComplete="family-name" />
              <IconInput icon={UserRound} placeholder="First name" value={firstName} onChange={(event) => { setFirstName(event.target.value); setValidationError(null); }} required autoComplete="given-name" />
              <IconInput icon={UserRound} placeholder="Middle name (optional)" value={middleName} onChange={(event) => { setMiddleName(event.target.value); setValidationError(null); }} autoComplete="additional-name" />
              <IconInput icon={UserRound} placeholder="Suffix (optional)" value={suffix} onChange={(event) => { setSuffix(event.target.value); setValidationError(null); }} autoComplete="honorific-suffix" />
            </>
          )}
          <IconInput icon={Mail} type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <IconInput icon={LockKeyhole} type={passwordVisible ? 'text' : 'password'} placeholder="Password" value={password}
            onChange={(event) => { setPassword(event.target.value); setValidationError(null); }} required minLength={signup ? 8 : undefined} autoComplete={signup ? 'new-password' : 'current-password'}
            trailing={<VisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} label="password" />} />
          {signup && (
            <>
              <ul aria-label="Password requirements" aria-live="polite" className="flex flex-col gap-1 pl-1 text-xs text-app-muted">
                {requirements.map(({ label, met }) => {
                  const RequirementIcon = met ? CheckCircle2 : Circle;
                  return (
                    <li key={label} className={`flex items-center gap-2 ${met ? 'text-app-success-dark' : ''}`}>
                      <RequirementIcon size={14} strokeWidth={2} aria-hidden="true" />{label}
                    </li>
                  );
                })}
              </ul>
              <IconInput icon={LockKeyhole} type={confirmVisible ? 'text' : 'password'} placeholder="Confirm password" value={confirmPassword}
                onChange={(event) => { setConfirmPassword(event.target.value); setValidationError(null); }} required autoComplete="new-password"
                trailing={<VisibilityToggle visible={confirmVisible} onToggle={() => setConfirmVisible((visible) => !visible)} label="confirmation password" />} />
              {confirmPassword && password !== confirmPassword && <p role="alert" className="text-sm text-app-danger">Passwords do not match.</p>}
            </>
          )}
          {validationError && <p role="alert" className="text-sm text-app-danger">{validationError}</p>}
          <Button type="submit" variant="secondary" icon={<LogIn size={16} strokeWidth={2} aria-hidden="true" />} disabled={busy}>
            {busy ? 'Please wait…' : signup ? 'Sign up' : 'Sign in'}
          </Button>
          <p className="text-center text-sm">
            {signup ? 'Have an account? ' : 'New here? '}
            <button type="button" className="inline-flex items-center gap-1 text-app-primary"
              onClick={() => { setSignup((current) => !current); setValidationError(null); }}>
              {signup ? <LogIn size={14} strokeWidth={2} aria-hidden="true" /> : <UserRoundPlus size={14} strokeWidth={2} aria-hidden="true" />}
              {signup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
