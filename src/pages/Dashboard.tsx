import { useState } from 'react';
import {
  Mail, MailCheck, MailWarning, LogOut, Sparkles, Folder, Award, Trophy,
  UserCog, Settings as SettingsIcon, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { useNavigate } from '../lib/router';
import { DashboardLayout } from '../components/DashboardLayout';
import { sendVerificationEmail } from '../lib/firebase';

export default function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  if (!profile || !user) return null; // RequireAuth guarantees this in practice

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  async function handleResendVerification() {
    if (!user) return;
    setResendState('sending');
    try {
      await sendVerificationEmail(user);
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  }

  const stats = [
    { label: 'Skills', value: profile.skills.length, icon: Sparkles },
    { label: 'Projects', value: profile.projects.length, icon: Folder },
    { label: 'Achievements', value: profile.achievements.length, icon: Award },
    { label: 'Badges', value: profile.badges.length, icon: Trophy },
  ];

  return (
    <DashboardLayout
      title={`Welcome back, ${profile.displayName.split(' ')[0]}`}
      description="Here's your Cybroatrix overview."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 feature-card p-6">
          <div className="flex items-start gap-4">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-16 h-16 rounded-full border-2 border-blue-500/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-cyber text-xl text-white/40">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="font-cyber text-lg text-white">{profile.displayName}</h2>
              <p className="text-blue-400 text-sm font-inter">@{profile.username}</p>
              <p className="text-white/40 text-sm font-inter mt-2 line-clamp-2">
                {profile.bio || 'No bio yet — add one from Edit Profile.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="social-card p-4 text-center">
                <stat.icon className="w-4 h-4 text-blue-400 mx-auto mb-2" />
                <div className="font-cyber text-xl text-white">{stat.value}</div>
                <div className="text-white/40 text-xs font-inter">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="btn-primary flex items-center gap-2"
            >
              <UserCog className="w-4 h-4" /> EDIT PROFILE
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="btn-outline flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" /> SETTINGS
            </button>
            <button
              type="button"
              onClick={() => navigate(`/${profile.username}`)}
              className="btn-outline flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> VIEW PUBLIC PROFILE
            </button>
          </div>
        </div>

        <div className="feature-card p-6">
          <h3 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Account</h3>
          <div className="space-y-3 text-sm font-inter">
            <div className="flex items-center gap-2 text-white/70">
              <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              {user.emailVerified ? (
                <>
                  <MailCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-400/80 text-xs">Email verified</span>
                </>
              ) : (
                <>
                  <MailWarning className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-amber-400/80 text-xs">
                    Not verified —{' '}
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendState !== 'idle'}
                      className="underline hover:text-amber-300 disabled:opacity-60"
                    >
                      {resendState === 'sent' ? 'sent!' : resendState === 'sending' ? 'sending…' : 'resend'}
                    </button>
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn-danger w-full flex items-center justify-center gap-2 mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut className="w-4 h-4" /> {signingOut ? 'SIGNING OUT…' : 'LOG OUT'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
