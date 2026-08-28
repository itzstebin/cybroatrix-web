import type { ReactNode } from 'react';
import { LayoutDashboard, UserCog, Settings as SettingsIcon, ExternalLink, type LucideIcon } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useNavigate, useRoute, routeToPath, type StaticRouteName } from '../lib/router';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const TABS: { route: StaticRouteName; label: string; icon: LucideIcon }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'profile-edit', label: 'Edit Profile', icon: UserCog },
  { route: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const route = useRoute();

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-cyber text-2xl text-white tracking-wide">{title}</h1>
            {description && <p className="text-white/40 text-sm font-inter mt-1">{description}</p>}
          </div>
          {profile && (
            <button
              type="button"
              onClick={() => navigate(`/${profile.username}`)}
              className="btn-outline flex items-center gap-2 self-start"
            >
              VIEW PUBLIC PROFILE <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = route.name === tab.route;
            const Icon = tab.icon;
            return (
              <button
                key={tab.route}
                type="button"
                onClick={() => navigate(routeToPath(tab.route))}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-cyber tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-400 text-white'
                    : 'border-transparent text-white/40 hover:text-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
