import { useEffect, useState, type FormEvent } from 'react';
import { Shield, ArrowRight, Check, X as XIcon } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/useAuth';
import { getAuthErrorMessage } from '../lib/authErrors';
import { createUserProfile, isUsernameAvailable, UsernameTakenError } from '../lib/profile';
import { sanitizeUsername, validateUsernameFormat } from '../lib/username';
import { FormField, FormError, Spinner } from '../components/ui/FormElements';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function SetupProfile() {
  const { user, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Covers both directions: bounce away if a profile already exists (e.g.
  // they refreshed this page after finishing setup), and move forward once
  // creation below succeeds and the profile subscription picks it up.
  useEffect(() => {
    if (!profileLoading && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;

    const clean = sanitizeUsername(username);
    const validation = validateUsernameFormat(clean);
    if (!validation.valid) {
      setError(validation.error ?? 'Please choose a valid username.');
      return;
    }
    if (usernameStatus === 'taken') {
      setError('That username is already taken.');
      return;
    }
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    setSubmitting(true);
    try {
      await createUserProfile(user, { username: clean, displayName: displayName.trim() });
      // The effect above redirects to /dashboard once the profile
      // subscription in AuthContext picks up the new document.
    } catch (err) {
      if (err instanceof UsernameTakenError) {
        setUsernameStatus('taken');
        setError('That username was just taken. Please choose another.');
      } else {
        setError(getAuthErrorMessage(err));
      }
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-blue-400" />
          <span className="font-cyber text-lg tracking-widest gradient-text">CYBROATRIX</span>
        </div>

        <div className="feature-card p-8">
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-blue-500/30"
            />
          )}
          <h1 className="font-cyber text-2xl text-white tracking-wide mb-1 text-center">One Last Step</h1>
          <p className="text-white/40 text-sm font-inter mb-6 text-center">
            Choose a username to finish setting up your profile.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Username"
              htmlFor="setup-username"
              required
              hint={username ? `cybroatrix.com/${sanitizeUsername(username)}` : 'Letters, numbers, _ and - only.'}
            >
              <div className="relative">
                <input
                  id="setup-username"
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

            <FormField label="Display Name" htmlFor="setup-name" required>
              <input
                id="setup-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Chen"
                autoComplete="name"
                className="input-cyber"
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
                  CONTINUE <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
