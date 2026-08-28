import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from './useAuth';
import { useNavigate } from './router';

interface RequireAuthProps {
  children: ReactNode;
  /** If true (default), also require a Firestore profile to exist —
   * redirecting to /setup-profile if the user is authenticated but hasn't
   * finished onboarding yet. Pass false for setup-profile itself, which
   * only needs a signed-in user. */
  requireProfile?: boolean;
}

/** Gates a page behind authentication (and, by default, an existing
 * profile). Renders a spinner while auth/profile state is resolving or a
 * redirect is pending, so protected pages never flash their real content
 * to a signed-out visitor before bouncing them to /login. */
export function RequireAuth({ children, requireProfile = true }: RequireAuthProps) {
  const { user, loading, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  const stillResolving = loading || (!!user && requireProfile && profileLoading);
  const needsRedirect = !loading && (!user || (requireProfile && !profileLoading && !profile));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (requireProfile && !profileLoading && !profile) {
      navigate('/setup-profile', { replace: true });
    }
  }, [user, loading, profile, profileLoading, requireProfile, navigate]);

  if (stillResolving || needsRedirect) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-24">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

/** For guest-only pages (login/register/forgot-password): bounces an
 * already-signed-in user onward to their dashboard, or to username setup
 * if they haven't finished onboarding. */
export function useRedirectIfAuthenticated(): boolean {
  const { user, loading, profile, profileLoading } = useAuth();
  const navigate = useNavigate();

  const shouldRedirect = !loading && !!user && !profileLoading;

  useEffect(() => {
    if (!shouldRedirect) return;
    navigate(profile ? '/dashboard' : '/setup-profile', { replace: true });
  }, [shouldRedirect, profile, navigate]);

  return shouldRedirect;
}
