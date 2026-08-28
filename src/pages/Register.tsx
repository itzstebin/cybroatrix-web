import { useEffect, useState, type FormEvent } from 'react';
import { Shield, ArrowRight, Check, X as XIcon } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/useAuth';
import { useRedirectIfAuthenticated } from '../lib/authGuards';
import { getAuthErrorMessage } from '../lib/authErrors';
import { auth, sendVerificationEmail } from '../lib/firebase';
import { createUserProfile, isUsernameAvailable, UsernameTakenError } from '../lib/profile';
import { sanitizeUsername, validateUsernameFormat } from '../lib/username';
import { FormField, FormError, PasswordField, GoogleIcon, Spinner } from '../components/ui/FormElements';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function Register() {
  const { signInGoogle, signUpEmail } = useAuth();
  const navigate = useNavigate();
  const redirecting = useRedirectIfAuthenticated();

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  useEffect(() => {
    const clean = sanitizeUsername(username);
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }
    const validation = validateUsernameFormat(clean);
    if (!validation.valid) {
      setUsernameStatus('invalid');
      setUsernameError(validation.error ?? 'Invalid username.');
      return;
    }
    setUsernameStatus('checking');
    setUsernameError(null);
    const timeout = setTimeout(() => {
      isUsernameAvailable(clean)
        .then((available) => setUsernameStatus(available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 500);
    return () => clearTimeout(timeout);
  }, [username]);

  async function handleEmailRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsername = sanitizeUsername(username);
    const usernameValidation = validateUsernameFormat(cleanUsername);
    if (!usernameValidation.valid) {
      setError(usernameValidation.error ?? 'Please choose a valid username.');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('That username is already taken.');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await signUpEmail(email.trim(), password, displayName.trim());
      const newUser = auth.currentUser;
      if (!newUser) throw new Error('Something went wrong creating your account. Please try again.');

      try {
        await createUserProfile(newUser, { username: cleanUsername, displayName: displayName.trim() });
      } catch (profileErr) {
        if (profileErr instanceof UsernameTakenError) {
          setError('That username was just taken by someone else. Redirecting you to pick another…');
          setUsernameStatus('taken');
          setSubmitting(false);
          return;
        }
        throw profileErr;
      }

      sendVerificationEmail(newUser).catch(() => {
        // Non-fatal — they can resend from Settings later.
      });
      // useRedirectIfAuthenticated takes it from here once profile state updates.
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function handleGoogleRegister() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInGoogle();
      // New Google users have no profile yet — useRedirectIfAuthenticated
      // sends them to /setup-profile automatically once that resolves.
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  }

  if (redirecting) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 mb-8 mx-auto"
        >
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="font-cyber text-lg tracking-widest gradient-text">CYBROATRIX</span>
        </button>

        <div className="feature-card p-8">
          <h1 className="font-cyber text-2xl text-white tracking-wide mb-1">Create Account</h1>
          <p className="text-white/40 text-sm font-inter mb-6">Join the Cybroatrix community.</p>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleSubmitting}
            className="btn-google disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleSubmitting ? <Spinner className="w-4 h-4 text-black/60" /> : <GoogleIcon />}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-white/30 text-xs font-cyber tracking-widest">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <FormField
              label="Username"
              htmlFor="reg-username"
              required
              hint={username ? `cybroatrix.com/${sanitizeUsername(username)}` : 'Letters, numbers, _ and - only.'}
            >
              <div className="relative">
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="input-cyber pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Spinner className="w-4 h-4 text-white/40" />}
                  {usernameStatus === 'available' && <Check className="w-4 h-4 text-emerald-400" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <XIcon className="w-4 h-4 text-red-400" />
                  )}
                </span>
              </div>
              {usernameStatus === 'taken' && (
                <p className="mt-1.5 text-xs text-red-400/80 font-inter">Already taken.</p>
              )}
              {usernameStatus === 'invalid' && usernameError && (
                <p className="mt-1.5 text-xs text-red-400/80 font-inter">{usernameError}</p>
              )}
            </FormField>

            <FormField label="Display Name" htmlFor="reg-name" required>
              <input
                id="reg-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Chen"
                autoComplete="name"
                className="input-cyber"
              />
            </FormField>

            <FormField label="Email" htmlFor="reg-email" required>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-cyber"
              />
            </FormField>

            <FormField label="Password" htmlFor="reg-password" required hint="At least 6 characters.">
              <PasswordField
                id="reg-password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </FormField>

            <FormField label="Confirm Password" htmlFor="reg-confirm" required>
              <PasswordField
                id="reg-confirm"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </FormField>

            <FormError message={error} />

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Spinner /> : (
                <>
                  CREATE ACCOUNT <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm font-inter mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-cyan-400 transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
