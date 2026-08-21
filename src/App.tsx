import { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from './lib/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Services = lazy(() => import('./pages/Services'));
const Events = lazy(() => import('./pages/Events'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
    </div>
  );
}

export type Page = 'home' | 'about' | 'services' | 'events' | 'contact' | 'profile';
const validPages: Page[] = ['home', 'about', 'services', 'events', 'contact', 'profile'];

function isPage(value: string): value is Page {
  return (validPages as string[]).includes(value);
}

/** Reads the current page + optional :param (e.g. /profile/abc123) from the URL. */
function parseLocation(): { page: Page; param: string | null } {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const [first, second] = segments;
  const page = first && isPage(first) ? first : 'home';
  return { page, param: page === 'profile' ? second ?? null : null };
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [pageParam, setPageParam] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const navigate = (page: string, param?: string) => {
    const p: Page = isPage(page) ? page : 'home';
    setCurrentPage(p);
    setPageParam(param ?? null);
    const path = p === 'home' ? '/' : param ? `/${p}/${param}` : `/${p}`;
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const applyLocation = () => {
      const { page, param } = parseLocation();
      setCurrentPage(page);
      setPageParam(param);
    };
    applyLocation();
    window.addEventListener('popstate', applyLocation);
    return () => window.removeEventListener('popstate', applyLocation);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <Home onNavigate={navigate} />;
      case 'about': return <About />;
      case 'services': return <Services />;
      case 'events': return <Events />;
      case 'contact': return <Contact />;
      case 'profile': return <Profile viewUserId={pageParam} onNavigate={navigate} />;
      default: return <Home onNavigate={navigate} />;
    }
  };

  const pageVariants = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

  const pageTransition = (
    <AnimatePresence mode="wait">
      <motion.main
        key={`${currentPage}-${pageParam ?? ''}`}
        initial={pageVariants.initial}
        animate={pageVariants.animate}
        exit={pageVariants.exit}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Suspense fallback={<PageFallback />}>
          {renderPage()}
        </Suspense>
      </motion.main>
    </AnimatePresence>
  );

  if (currentPage === 'events') {
    return (
      <AuthProvider>
        <div className="min-h-screen bg-[#070709] text-white">
          <div className="noise-overlay" />
          {pageTransition}
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#070709] text-white">
        <div className="noise-overlay" />
        <Navbar currentPage={currentPage} onNavigate={navigate} />
        {pageTransition}
        <Footer onNavigate={navigate} />
      </div>
    </AuthProvider>
  );
}
