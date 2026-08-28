import { useState, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X, LogIn, LogOut, User, Loader2, ChevronDown, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';
import { subscribeToLiveCount } from '../lib/firebase';
import { useAuth } from '../lib/useAuth';
import { getAuthErrorMessage } from '../lib/authErrors';
import { FormError } from './ui/FormElements';

const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'contact', label: 'Contact' },
];

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, profile, signInGoogle, signOut } = useAuth();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const unsub = subscribeToLiveCount((count) => setLiveCount(count));
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (id: string) => {
    onNavigate(id);
    setMenuOpen(false);
    setShowUserMenu(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInGoogle();
      setShowUserMenu(false);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    }
    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (err) {
      setAuthError(getAuthErrorMessage(err));
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
      scrolled || menuOpen
        ? 'bg-[#070709]/95 backdrop-blur-md border-b border-blue-900/30'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

        {/* Logo: CYBROATRI + X image */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-0 group flex-shrink-0"
        >
          <span className="font-cyber text-base sm:text-lg tracking-widest text-white group-hover:opacity-90 transition-opacity leading-none">
            CYBROATRI
          </span>
          <img
            src="/images/ChatGPT_Image_Jul_4,_2026,_07_31_08_PM.png"
            alt="X"
            className="w-5 h-5 sm:w-6 sm:h-6 object-contain -ml-0.5"
          />
        </button>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className={`nav-link font-cyber text-xs tracking-widest transition-colors duration-200 ${
                currentPage === link.id
                  ? 'text-white active'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {link.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Desktop: Live Counter - Clickable */}
        <div className="hidden md:flex items-center gap-3 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-green-500/30 bg-green-950/20 backdrop-blur-sm rounded-sm hover:bg-green-950/30 hover:border-green-500/50 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <span className="font-cyber text-xs text-green-400/90 tracking-wide">
              {liveCount}
            </span>
            <ChevronDown className={`w-3 h-3 text-green-400/60 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: 'easeOut' }}
                className="absolute top-full right-0 mt-2 w-64 p-4 border border-blue-600/30 bg-[#0d0d14] backdrop-blur-sm rounded-sm shadow-xl origin-top-right"
              >
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-cyber text-xs text-white tracking-wide truncate">{profile?.displayName || user.displayName || 'User'}</div>
                        <div className="text-white/40 text-xs font-inter truncate">{user.email}</div>
                      </div>
                    </div>
                    {profile && (
                      <div className="space-y-1 -mx-1">
                        <button
                          onClick={() => handleNav('/dashboard')}
                          className="w-full flex items-center gap-2 px-2 py-2 text-xs font-inter text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                        </button>
                        <button
                          onClick={() => handleNav('/settings')}
                          className="w-full flex items-center gap-2 px-2 py-2 text-xs font-inter text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <SettingsIcon className="w-3.5 h-3.5" /> Settings
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-inter text-white/70"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-white/50 text-xs font-inter leading-relaxed">
                      Sign in with Google to show up in the live counter.
                    </p>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-gray-900 font-inter text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
                    >
                      {isSigningIn ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                      ) : (
                        <><LogIn className="w-4 h-4" /> Sign in with Google</>
                      )}
                    </button>
                    <FormError message={authError} />
                    <div className="flex items-center justify-center gap-3 text-xs font-inter pt-0.5">
                      <button onClick={() => handleNav('/login')} className="text-white/50 hover:text-white transition-colors">
                        Sign in
                      </button>
                      <span className="text-white/20">·</span>
                      <button onClick={() => handleNav('/register')} className="text-white/50 hover:text-white transition-colors">
                        Create account
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white/70 hover:text-white transition-colors p-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: 'easeInOut' }}
            className="md:hidden border-t border-blue-900/30 bg-[#070709]/98 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => handleNav(link.id)}
                  className={`w-full text-left py-3 px-4 font-cyber text-sm tracking-widest transition-colors ${
                    currentPage === link.id
                      ? 'text-white bg-blue-600/10 border-l-2 border-blue-500'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label.toUpperCase()}
                </button>
              ))}
              {/* Mobile Live Counter / Auth */}
              <div className="mt-3 pt-3 border-t border-blue-900/20">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-cyber text-xs text-white tracking-wide truncate">{profile?.displayName || user.displayName || 'User'}</div>
                        <div className="text-white/40 text-xs font-inter truncate">{user.email}</div>
                      </div>
                    </div>
                    {profile && (
                      <div className="flex flex-col gap-1 px-4">
                        <button onClick={() => handleNav('/dashboard')} className="flex items-center gap-2 py-2 text-xs font-inter text-white/70 hover:text-white transition-colors">
                          <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                        </button>
                        <button onClick={() => handleNav('/settings')} className="flex items-center gap-2 py-2 text-xs font-inter text-white/70 hover:text-white transition-colors">
                          <SettingsIcon className="w-3.5 h-3.5" /> Settings
                        </button>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-cyber text-xs text-green-400/90 tracking-wide">{liveCount} connected</span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1 px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-inter text-white/70"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="font-cyber text-xs text-green-400/90 tracking-wide">{liveCount} connected</span>
                    </div>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-gray-900 font-inter text-xs font-medium hover:bg-gray-100 transition-colors disabled:opacity-60"
                    >
                      {isSigningIn ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                      ) : (
                        <><LogIn className="w-4 h-4" /> Sign in with Google</>
                      )}
                    </button>
                    <FormError message={authError} />
                    <div className="flex items-center justify-center gap-3 text-xs font-inter">
                      <button onClick={() => handleNav('/login')} className="text-white/50 hover:text-white transition-colors">
                        Sign in
                      </button>
                      <span className="text-white/20">·</span>
                      <button onClick={() => handleNav('/register')} className="text-white/50 hover:text-white transition-colors">
                        Create account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
