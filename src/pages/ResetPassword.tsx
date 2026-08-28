import { useEffect, useState, type FormEvent } from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { verifyResetCode, completePasswordReset } from '../lib/firebase';
import { getAuthErrorMessage } from '../lib/authErrors';
import { FormField, FormError, PasswordField, Spinner } from '../components/ui/FormElements';

type Stage = 'verifying' | 'invalid' | 'ready' | 'success';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('verifying');
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    const mode = params.get('mode');
    if (!code || mode !== 'resetPassword') {
      setStage('invalid');
      return;
    }
    setOobCode(code);
    verifyResetCode(code)
      .then((resolvedEmail) => {
        setEmail(resolvedEmail);
        setStage('ready');
      })
      .catch((err: unknown) => {
        setError(getAuthErrorMessage(err));
        setStage('invalid');
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
      await completePasswordReset(oobCode, password);
      setStage('success');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

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
          {stage === 'verifying' && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Spinner className="w-6 h-6 text-blue-400" />
              <p className="text-white/40 text-sm font-inter">Verifying your reset link…</p>
            </div>
          )}

          {stage === 'invalid' && (
            <>
              <h1 className="font-cyber text-xl text-white tracking-wide mb-2">Link Invalid or Expired</h1>
              <p className="text-white/40 text-sm font-inter mb-6">
                This password reset link is no longer valid. Request a new one to continue.
              </p>
              <FormError message={error} />
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="btn-primary w-full mt-4"
              >
                REQUEST NEW LINK
              </button>
            </>
          )}

          {stage === 'ready' && (
            <>
              <h1 className="font-cyber text-2xl text-white tracking-wide mb-1">Choose New Password</h1>
              <p className="text-white/40 text-sm font-inter mb-6">Resetting password for {email}</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="New Password" htmlFor="new-password" required hint="At least 6 characters.">
                  <PasswordField
                    id="new-password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </FormField>
                <FormField label="Confirm New Password" htmlFor="confirm-password" required>
                  <PasswordField
                    id="confirm-password"
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
                  {submitting ? <Spinner /> : 'RESET PASSWORD'}
                </button>
              </form>
            </>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center py-4 gap-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              <h1 className="font-cyber text-xl text-white tracking-wide">Password Reset</h1>
              <p className="text-white/40 text-sm font-inter mb-2">
                Your password has been updated. You can now sign in.
              </p>
              <button type="button" onClick={() => navigate('/login')} className="btn-primary w-full">
                GO TO SIGN IN
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
