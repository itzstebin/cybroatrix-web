import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
  type ReactNode,
} from 'react';
import { isReservedUsername, validateUsernameFormat } from './username';

export type StaticRouteName =
  | 'home' | 'about' | 'services' | 'events' | 'contact'
  | 'login' | 'register' | 'forgot-password' | 'reset-password'
  | 'setup-profile' | 'dashboard' | 'settings' | 'profile-edit';

export type Route =
  | { name: StaticRouteName }
  | { name: 'user-profile'; username: string }
  | { name: 'not-found'; path: string };

export type NavigateFn = (path: string, options?: { replace?: boolean }) => void;

const STATIC_ROUTES: Record<string, StaticRouteName> = {
  '': 'home',
  home: 'home',
  about: 'about',
  services: 'services',
  events: 'events',
  contact: 'contact',
  login: 'login',
  register: 'register',
  'forgot-password': 'forgot-password',
  'reset-password': 'reset-password',
  'setup-profile': 'setup-profile',
  dashboard: 'dashboard',
  settings: 'settings',
};

export function parseRoute(pathname: string): Route {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'home' };

  if (segments.length === 1) {
    const [first] = segments;
    const staticName = STATIC_ROUTES[first];
    if (staticName) return { name: staticName };

    const username = first.toLowerCase();
    const validation = validateUsernameFormat(username);
    if (validation.valid && !isReservedUsername(username)) {
      return { name: 'user-profile', username };
    }
    return { name: 'not-found', path: pathname };
  }

  if (segments.length === 2 && segments[0] === 'profile' && segments[1] === 'edit') {
    return { name: 'profile-edit' };
  }

  return { name: 'not-found', path: pathname };
}

export function routeToPath(name: StaticRouteName): string {
  if (name === 'home') return '/';
  if (name === 'profile-edit') return '/profile/edit';
  return `/${name}`;
}

interface RouterContextValue {
  route: Route;
  navigate: NavigateFn;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));

  useEffect(() => {
    const applyLocation = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', applyLocation);
    return () => window.removeEventListener('popstate', applyLocation);
  }, []);

  const navigate = useCallback<NavigateFn>((path, options) => {
    // Back-compat: existing components pass bare page ids like
    // onNavigate('events'); new code passes full paths like '/dashboard'.
    const target = path.startsWith('/') ? path : `/${path}`;
    if (target === window.location.pathname) {
      setRoute(parseRoute(target));
      return;
    }
    if (options?.replace) {
      window.history.replaceState({}, '', target);
    } else {
      window.history.pushState({}, '', target);
    }
    setRoute(parseRoute(target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const value = useMemo<RouterContextValue>(() => ({ route, navigate }), [route, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouterContext(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRoute/useNavigate must be used within a RouterProvider');
  return ctx;
}

export function useRoute(): Route {
  return useRouterContext().route;
}

export function useNavigate(): NavigateFn {
  return useRouterContext().navigate;
}
