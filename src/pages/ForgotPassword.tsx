import { useState, type FormEvent } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { useNavigate } from '../lib/router';
import { sendResetPasswordEmail } from '../lib/firebase';
import { getAuthErrorMessage } from '../lib/authErrors';
import { FormField, FormError, FormSuccess, Spinner } from '../components/ui/FormElements';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setSubmitting(true);
    try {
      await sendResetPasswordEmail(email.trim());
      setSent(true);
    } catch (err) {
      // Don't reveal whether an account exists for this email — treat
      // "not found" the same as success. Do surface genuine problems
      // (bad email format, network issues, rate limiting).
      if (err instanceof FirebaseError && err.code === 'auth/user-not-found') {
        setSent(true);
      } else {
        setError(getAuthErrorMessage(err));
      }
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
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-inter mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </button>

          <h1 className="font-cyber text-2xl text-white tracking-wide mb-1">Reset Password</h1>
          <p className="text-white/40 text-sm font-inter mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {sent ? (
            <FormSuccess message="If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder)." />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Email" htmlFor="forgot-email" required>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="input-cyber"
                />
              </FormField>

              <FormError message={error} />

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? <Spinner /> : 'SEND RESET LINK'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
