import { useEffect, useState } from 'react';
import {
  UserX, Lock, MapPin, Link as LinkIcon, Github, Linkedin, Twitter,
  Calendar, Award, Folder, Sparkles, Trophy,
} from 'lucide-react';
import { FirestoreError } from 'firebase/firestore';
import { useAuth } from '../lib/useAuth';
import { useNavigate } from '../lib/router';
import { getProfileByUsername, type UserProfile } from '../lib/profile';
import { EmptyState } from '../components/ui/EmptyState';

type ViewState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'private' }
  | { status: 'found'; profile: UserProfile };

function socialUrl(platform: 'github' | 'linkedin' | 'twitter' | 'website', value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, '');
  switch (platform) {
    case 'github': return `https://github.com/${handle}`;
    case 'linkedin': return `https://linkedin.com/in/${handle}`;
    case 'twitter': return `https://twitter.com/${handle}`;
    case 'website': return `https://${trimmed}`;
  }
}

function formatMemberSince(profile: UserProfile): string | null {
  const createdAt = profile.createdAt;
  if (!createdAt) return null;
  try {
    return createdAt.toDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return null;
  }
}

interface PublicProfileProps {
  username: string;
}

export default function PublicProfile({ username }: PublicProfileProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<ViewState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getProfileByUsername(username)
      .then((profile) => {
        if (cancelled) return;
        setState(profile ? { status: 'found', profile } : { status: 'not-found' });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof FirestoreError && err.code === 'permission-denied') {
          setState({ status: 'private' });
        } else {
          setState({ status: 'not-found' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (state.status === 'not-found') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-16 px-4">
        <EmptyState
          icon={UserX}
          title="User Not Found"
          description={`There's no Cybroatrix member at @${username}.`}
          action={
            <button type="button" onClick={() => navigate('/')} className="btn-outline">
              BACK TO HOME
            </button>
          }
        />
      </div>
    );
  }

  if (state.status === 'private') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center pt-16 px-4">
        <EmptyState
          icon={Lock}
          title="This Profile Is Private"
          description={`@${username} has chosen to keep their profile private.`}
          action={
            <button type="button" onClick={() => navigate('/')} className="btn-outline">
              BACK TO HOME
            </button>
          }
        />
      </div>
    );
  }

  const { profile } = state;
  const isOwner = user?.uid === profile.uid;
  const memberSince = formatMemberSince(profile);

  const socialLinks = [
    { key: 'website', icon: LinkIcon, value: profile.website, url: socialUrl('website', profile.website) },
    { key: 'github', icon: Github, value: profile.github, url: socialUrl('github', profile.github) },
    { key: 'linkedin', icon: Linkedin, value: profile.linkedin, url: socialUrl('linkedin', profile.linkedin) },
    { key: 'twitter', icon: Twitter, value: profile.twitter, url: socialUrl('twitter', profile.twitter) },
  ].filter((link) => link.value.trim());

  return (
    <div className="min-h-screen pt-28 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {isOwner && profile.profileVisibility === 'private' && (
          <div className="flex items-center gap-2 text-amber-400/80 text-xs font-inter border border-amber-500/20 bg-amber-950/10 px-4 py-3 rounded mb-6">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            This profile is private — only you can see this page.
          </div>
        )}

        {/* Header */}
        <div className="feature-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt=""
                className="w-24 h-24 rounded-full border-2 border-blue-500/30 flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                <span className="font-cyber text-2xl text-white/40">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="font-cyber text-2xl text-white tracking-wide">{profile.displayName}</h1>
              <p className="text-blue-400 font-inter mb-3">@{profile.username}</p>

              {profile.bio && (
                <p className="text-white/60 font-inter text-sm mb-3 max-w-xl">{profile.bio}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-white/40 text-xs font-inter">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {profile.location}
                  </span>
                )}
                {memberSince && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Member since {memberSince}
                  </span>
                )}
              </div>

              {socialLinks.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                  {socialLinks.map(({ key, icon: Icon, url }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-blue-400 hover:border-blue-500/30 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.skills.length > 0 && (
          <section className="feature-card p-6 mb-6">
            <h2 className="font-cyber text-sm text-white tracking-widest uppercase mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" /> Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 text-xs font-inter text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {profile.projects.length > 0 && (
          <section className="feature-card p-6 mb-6">
            <h2 className="font-cyber text-sm text-white tracking-widest uppercase mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" /> Projects
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {profile.projects.map((project) => (
                <div key={project.id} className="social-card p-4">
                  <h3 className="font-cyber text-sm text-white mb-1">{project.title}</h3>
                  {project.description && (
                    <p className="text-white/50 text-xs font-inter mb-2 line-clamp-2">{project.description}</p>
                  )}
                  {project.url && (
                    <a
                      href={/^https?:\/\//i.test(project.url) ? project.url : `https://${project.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-cyan-400 text-xs font-inter transition-colors"
                    >
                      View project →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.achievements.length > 0 && (
          <section className="feature-card p-6 mb-6">
            <h2 className="font-cyber text-sm text-white tracking-widest uppercase mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" /> Achievements
            </h2>
            <div className="space-y-3">
              {profile.achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Award className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-cyber text-sm text-white">{achievement.title}</h3>
                    {achievement.description && (
                      <p className="text-white/50 text-xs font-inter">{achievement.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {profile.badges.length > 0 && (
          <section className="feature-card p-6">
            <h2 className="font-cyber text-sm text-white tracking-widest uppercase mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-400" /> Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((badge) => (
                <span
                  key={badge.id}
                  title={badge.description}
                  className="px-3 py-1.5 text-xs font-cyber tracking-wide text-white bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full"
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
