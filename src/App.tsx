import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './lib/AuthContext';
import { RouterProvider, useRoute, useNavigate, type Route, type NavigateFn } from './lib/router';
import { RequireAuth } from './lib/authGuards';
import { useAuth } from './lib/useAuth';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Events = lazy(() => import('./pages/Events'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SetupProfile = lazy(() => import('./pages/SetupProfile'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const ProfileEdit = lazy(() => import('./pages/ProfileEdit'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  );
}

/** Three chrome tiers: 'bare' has no navbar/footer (auth flow pages get their
 * own minimal logo header instead, and 'events' has its own immersive
 * layout as before); 'app' keeps the navbar for wayfinding but drops the
 * marketing footer (the authenticated dashboard/settings/profile-edit
 * pages already have their own tab nav via DashboardLayout); 'full' is the
 * original site chrome. */
type Chrome = 'bare' | 'app' | 'full';

function chromeForRoute(route: Route): Chrome {
  switch (route.name) {
    case 'events':
    case 'login':
    case 'register':
    case 'forgot-password':
    case 'reset-password':
    case 'setup-profile':
      return 'bare';
    case 'dashboard':
    case 'settings':
    case 'profile-edit':
      return 'app';
    default:
      return 'full';
  }
}

/** Distinguishes different usernames under the same 'user-profile' route
 * name so AnimatePresence actually transitions when navigating from one
 * member's profile straight to another's. */
function routeKey(route: Route): string {
  return route.name === 'user-profile' ? `user-profile:${route.username}` : route.name;
}

const PROFILE_SETUP_EXEMPT_ROUTES = new Set([
  'setup-profile', 'login', 'register', 'forgot-password', 'reset-password',
]);

/** Catches sign-ins from ANY entry point — not just the dedicated Login/
 * Register pages, but also the navbar's quick Google button, the Home hero
 * widget, and Events.tsx's own inline auth modal — and routes a newly
 * authenticated user who has no Firestore profile yet to /setup-profile,
 * regardless of what page they happened to sign in from. */
function useGlobalProfileSetupGuard(route: Route, navigate: NavigateFn) {
  const { user, loading, profile, profileLoading } = useAuth();
  useEffect(() => {
    if (loading || profileLoading || !user || profile) return;
    if (PROFILE_SETUP_EXEMPT_ROUTES.has(route.name)) return;
    navigate('/setup-profile', { replace: true });
  }, [user, loading, profile, profileLoading, route, navigate]);
}

function renderRoute(route: Route, navigate: (path: string) => void): ReactNode {
  switch (route.name) {
    case 'home': return <Home onNavigate={navigate} />;
    case 'about': return <About />;
    case 'services': return <Services />;
    case 'events': return <Events />;
    case 'contact': return <Contact />;
    case 'login': return <Login />;
    case 'register': return <Register />;
    case 'forgot-password': return <ForgotPassword />;
    case 'reset-password': return <ResetPassword />;
    case 'setup-profile':
      return (
        <RequireAuth requireProfile={false}>
          <SetupProfile />
        </RequireAuth>
      );
    case 'dashboard':
      return (
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      );
    case 'settings':
      return (
        <RequireAuth>
          <Settings />
        </RequireAuth>
      );
    case 'profile-edit':
      return (
        <RequireAuth>
          <ProfileEdit />
        </RequireAuth>
      );
    case 'user-profile': return <PublicProfile username={route.username} />;
    case 'not-found': return <NotFound />;
    default: return <NotFound />;
  }
}

function AppShell() {
  const route = useRoute();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const chrome = chromeForRoute(route);

  useGlobalProfileSetupGuard(route, navigate);

  const pageVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  const pageTransition = (
    <AnimatePresence mode="wait">
      <motion.main
        key={routeKey(route)}
        initial={pageVariants.initial}
        animate={pageVariants.animate}
        exit={pageVariants.exit}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<PageFallback />}>
          {renderRoute(route, navigate)}
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );

  if (chrome === 'bare') {
    return (
      <div className="min-h-screen bg-[#070709] text-white">
        <div className="noise-overlay" />
        {pageTransition}
      </div>
    );
  }

  if (chrome === 'app') {
    return (
      <div className="min-h-screen bg-[#070709] text-white">
        <div className="noise-overlay" />
        <Navbar currentPage={route.name} onNavigate={navigate} />
        {pageTransition}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      <div className="noise-overlay" />
      <Navbar currentPage={route.name} onNavigate={navigate} />
      {pageTransition}
      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </RouterProvider>
  );
}
