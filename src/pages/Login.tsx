import { useState, type FormEvent } from 'react';
import { Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useNavigate } from '../lib/router';
import { useRedirectIfAuthenticated } from '../lib/authGuards';
import { getAuthErrorMessage } from '../lib/authErrors';
import { FormField, FormError, PasswordField, GoogleIcon, Spinner } from '../components/ui/FormElements';

export default function Login() {
  const { signInGoogle, signInEmail } = useAuth();
  const navigate = useNavigate();
  const redirecting = useRedirectIfAuthenticated();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signInEmail(email.trim(), password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInGoogle();
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
          <h1 className="font-cyber text-2xl text-white tracking-wide mb-1">Sign In</h1>
          <p className="text-white/40 text-sm font-inter mb-6">Welcome back to the community.</p>

          <button
            type="button"
            onClick={handleGoogleLogin}
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

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <FormField label="Email" htmlFor="login-email" required>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="input-cyber"
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password" required>
              <PasswordField
                id="login-password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </FormField>

            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-blue-400/80 hover:text-blue-400 font-inter transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <FormError message={error} />

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Spinner /> : (
                <>
                  SIGN IN <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/40 text-sm font-inter mt-6">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-blue-400 hover:text-cyan-400 transition-colors"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
