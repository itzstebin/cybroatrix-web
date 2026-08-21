import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  User, Trophy, Target, Crown, Share2, Check, Edit3, Loader2, LogIn,
  AlertCircle, Zap, Github, Linkedin, Twitter, Globe, MessageCircle,
  X, Plus, Flame, Award,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { getProfile, saveProfile, getPortfolioData, type UserProfile, type ProfileLinks, type PortfolioData, type SolveActivity, type CtfStats } from '../lib/profile';
import { achievements as achievementList, earnedAchievements } from '../lib/achievements';
import { categoryConfig, difficultyConfig } from '../lib/challengeMeta';

interface ProfileProps {
  viewUserId: string | null;
  onNavigate: (page: string, param?: string) => void;
}

const emptyLinks: ProfileLinks = { github: '', linkedin: '', twitter: '', website: '', discord: '' };
const accentPresets = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
const MAX_SKILLS = 12;

const linkMeta: { key: keyof ProfileLinks; icon: typeof Github; label: string }[] = [
  { key: 'github', icon: Github, label: 'GitHub' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { key: 'twitter', icon: Twitter, label: 'X / Twitter' },
  { key: 'website', icon: Globe, label: 'Website' },
  { key: 'discord', icon: MessageCircle, label: 'Discord' },
];

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const week = Math.floor(day / 7);
  if (week < 5) return `${week}w ago`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface HeatCell { key: string; date: Date; count: number; inRange: boolean }

function buildHeatmap(activity: SolveActivity[], weeks: number) {
  const counts = new Map<string, number>();
  for (const a of activity) {
    const key = a.date.slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - weeks * 7 + 1);
  start.setDate(start.getDate() - start.getDay());

  const cols: HeatCell[][] = [];
  const monthLabels: { col: number; label: string }[] = [];
  const cursor = new Date(start);
  let lastMonth = -1;
  let col = 0;
  while (cursor <= today) {
    const week: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push({ key, date: new Date(cursor), count: counts.get(key) || 0, inRange: cursor <= today });
      if (d === 0 && cursor.getMonth() !== lastMonth && cursor <= today) {
        monthLabels.push({ col, label: cursor.toLocaleString('default', { month: 'short' }) });
        lastMonth = cursor.getMonth();
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(week);
    col++;
  }
  return { cols, monthLabels };
}

function heatLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Trophy; label: string; value: string | number }) {
  return (
    <div className="feature-card p-4 sm:p-5 rounded-sm text-center">
      <Icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
      <div className="font-cyber text-xl sm:text-2xl text-white">{value}</div>
      <div className="text-white/40 text-xs font-inter tracking-wide mt-1">{label}</div>
    </div>
  );
}

function BreakdownBars({ title, data, config }: {
  title: string;
  data: [string, number][];
  config: Record<string, { color: string; icon?: typeof Trophy; label?: string; dot?: string }>;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(([, n]) => n));
  return (
    <div className="feature-card p-5 sm:p-6 rounded-sm">
      <h3 className="font-cyber text-xs text-white/50 tracking-widest mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map(([key, count]) => {
          const meta = config[key];
          const colorClass = meta?.color?.split(' ')[0] || 'text-blue-400';
          return (
            <div key={key} className="flex items-center gap-3">
              <span className={`text-xs font-cyber tracking-wide w-20 sm:w-24 flex-shrink-0 truncate ${colorClass}`}>
                {meta?.label || key}
              </span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(count / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full ${meta?.dot || 'bg-blue-400'}`}
                />
              </div>
              <span className="text-white/40 text-xs font-inter w-5 text-right flex-shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Profile({ viewUserId, onNavigate }: ProfileProps) {
  const { user, loading: authLoading } = useAuth();
  const reduceMotion = useReducedMotion();

  const targetUid = viewUserId || user?.uid || null;
  const isOwn = !!user && !!targetUid && targetUid === user.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    displayName: '', bio: '', avatarUrl: '', accentColor: accentPresets[0] as string,
    links: emptyLinks, skills: [] as string[],
  });

  const load = useCallback(async () => {
    if (!targetUid) { setLoading(false); return; }
    setLoading(true);
    try {
      const [p, data] = await Promise.all([getProfile(targetUid), getPortfolioData(targetUid)]);
      setProfile(p);
      setPortfolio(data);
      setForm({
        displayName: p?.displayName || (isOwn ? user?.displayName || '' : ''),
        bio: p?.bio || '',
        avatarUrl: p?.avatarUrl || '',
        accentColor: p?.accentColor || accentPresets[0],
        links: { ...emptyLinks, ...(p?.links || {}) },
        skills: p?.skills || [],
      });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUid, isOwn]);

  useEffect(() => { load(); }, [load]);

  const addSkill = () => {
    const val = skillInput.trim();
    if (!val || form.skills.length >= MAX_SKILLS || form.skills.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setForm({ ...form, skills: [...form.skills, val] });
    setSkillInput('');
  };

  const removeSkill = (skill: string) => setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid) return;
    setSaving(true);
    try {
      const cleanedLinks = Object.fromEntries(Object.entries(form.links).filter(([, v]) => v.trim())) as ProfileLinks;
      const saved = await saveProfile(targetUid, {
        displayName: form.displayName.trim() || user?.displayName || 'Anonymous',
        bio: form.bio.trim(),
        avatarUrl: form.avatarUrl.trim() || null,
        accentColor: form.accentColor,
        links: cleanedLinks,
        skills: form.skills,
        updatedAt: new Date().toISOString(),
      });
      setProfile(saved);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!targetUid) return;
    const url = `${window.location.origin}/profile/${targetUid}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const accentColor = profile?.accentColor || accentPresets[0];
  const displayName = profile?.displayName || (isOwn ? user?.displayName : null) || 'CybroatriX Member';
  const avatarSrc = profile?.avatarUrl || (isOwn ? user?.photoURL : null);
  const stats: CtfStats | undefined = portfolio?.stats;
  const activity = useMemo(() => portfolio?.activity || [], [portfolio]);

  const heatmap = useMemo(() => buildHeatmap(activity, 14), [activity]);
  const earned = useMemo(() => (stats ? earnedAchievements(stats, activity) : []), [stats, activity]);
  const earnedIds = useMemo(() => new Set(earned.map((a) => a.id)), [earned]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activity) map.set(a.category, (map.get(a.category) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [activity]);

  const difficultyBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activity) map.set(a.difficulty, (map.get(a.difficulty) || 0) + 1);
    return ['easy', 'medium', 'hard', 'insane'].filter((d) => map.has(d)).map((d) => [d, map.get(d)!] as [string, number]);
  }, [activity]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!targetUid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="feature-card p-8 sm:p-10 rounded-sm text-center max-w-sm">
          <div className="w-14 h-14 gradient-bg rounded-sm flex items-center justify-center mx-auto mb-5">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-cyber text-lg text-white mb-2 tracking-wide">SIGN IN FOR YOUR PORTFOLIO</h1>
          <p className="text-white/40 font-inter text-sm mb-6 leading-relaxed">
            Sign in to build your portfolio and track your CTF stats across every event.
          </p>
          <button onClick={() => onNavigate('events')} className="btn-primary inline-flex items-center gap-2 text-xs">
            <LogIn className="w-4 h-4" /> GO SIGN IN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-20 pb-16 sm:pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        {/* Cover + header */}
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 sm:mt-8 mb-6"
        >
          <div
            className="h-28 sm:h-36 rounded-t-sm relative overflow-hidden cyber-grid"
            style={{ background: `linear-gradient(135deg, ${accentColor}33 0%, transparent 70%), radial-gradient(ellipse at top left, ${accentColor}22 0%, transparent 60%)` }}
          >
            <div className="absolute inset-0 border border-b-0 border-blue-900/20 rounded-t-sm" />
          </div>
          <div className="feature-card !rounded-t-none border-t-0 p-6 sm:p-8 pt-0 rounded-sm">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-10 sm:-mt-12 text-center sm:text-left">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[#0d0d14] flex-shrink-0" style={{ boxShadow: `0 0 0 1px ${accentColor}55` }} />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-[#0d0d14]" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}>
                  <User className="w-9 h-9 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 pb-1">
                <h1 className="font-cyber text-xl sm:text-2xl text-white tracking-wide truncate">{displayName.toUpperCase()}</h1>
                {profile?.createdAt && (
                  <p className="text-white/30 text-xs font-inter mt-1">Member since {formatJoinDate(profile.createdAt)}</p>
                )}
              </div>
              <div className="flex sm:flex-col gap-2 flex-shrink-0 pb-1">
                {isOwn && (
                  <button onClick={() => setEditing((v) => !v)} className="btn-outline flex items-center justify-center gap-2 text-xs whitespace-nowrap">
                    <Edit3 className="w-3.5 h-3.5" /> {editing ? 'CANCEL' : 'EDIT'}
                  </button>
                )}
                <button onClick={handleShare} className="btn-outline flex items-center justify-center gap-2 text-xs whitespace-nowrap">
                  {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  {shareCopied ? 'COPIED' : 'SHARE'}
                </button>
              </div>
            </div>

            {profile?.bio ? (
              <p className="text-white/50 font-inter text-sm leading-relaxed mt-4 max-w-2xl">{profile.bio}</p>
            ) : isOwn ? (
              <p className="text-white/30 font-inter text-sm italic mt-4">No bio yet — add one so people know who you are.</p>
            ) : null}

            {(profile?.skills?.length || 0) > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {profile!.skills.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 border border-blue-900/30 bg-white/[0.02] rounded-sm text-xs font-inter text-white/60">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {linkMeta.some(({ key }) => profile?.links?.[key]) && (
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-4">
                {linkMeta.map(({ key, icon: Icon, label }) => {
                  const href = profile?.links?.[key];
                  if (!href) return null;
                  return (
                    <a key={key} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                       className="w-9 h-9 flex items-center justify-center border border-blue-900/30 text-white/50 hover:text-white hover:border-blue-500/40 transition-colors rounded-sm">
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}

            {portfolio?.globalRank && (
              <div className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 border rounded-sm" style={{ borderColor: `${accentColor}44`, background: `${accentColor}11` }}>
                <Crown className="w-3.5 h-3.5" style={{ color: accentColor }} />
                <span className="font-cyber text-xs text-white tracking-wide">
                  #{portfolio.globalRank.rank} <span className="text-white/40">of {portfolio.globalRank.totalMembers} members</span>
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Edit form */}
        <AnimatePresence>
          {isOwn && editing && (
            <motion.form
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSave}
              className="feature-card rounded-sm p-6 sm:p-8 mb-6 space-y-4 overflow-hidden"
            >
              <div>
                <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">DISPLAY NAME</label>
                <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} maxLength={50} className="input-cyber w-full" placeholder="Your name" />
              </div>
              <div>
                <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">BIO</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={280} rows={3} className="input-cyber w-full resize-none" placeholder="Who are you? What do you work on?" />
                <div className="text-white/20 text-xs font-inter mt-1 text-right">{form.bio.length}/280</div>
              </div>
              <div>
                <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">AVATAR URL <span className="text-white/20 normal-case tracking-normal">(optional — defaults to your Google photo)</span></label>
                <input type="url" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="input-cyber w-full" placeholder="https://..." />
              </div>
              <div>
                <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">ACCENT COLOR</label>
                <div className="flex items-center gap-2">
                  {accentPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, accentColor: c })}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: c, outline: form.accentColor === c ? `2px solid white` : 'none', outlineOffset: '2px' }}
                      aria-label={`Choose ${c}`}
                    >
                      {form.accentColor === c && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2">
                  SKILLS <span className="text-white/20 normal-case tracking-normal">({form.skills.length}/{MAX_SKILLS})</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-blue-900/30 bg-white/[0.02] rounded-sm text-xs font-inter text-white/60">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {form.skills.length < MAX_SKILLS && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }}
                      className="input-cyber flex-1"
                      placeholder="e.g. Python, Web Exploitation, Linux"
                    />
                    <button type="button" onClick={addSkill} className="btn-outline px-3 flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-cyber text-xs text-white/40 tracking-widest mb-3">LINKS</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {linkMeta.map(({ key, icon: Icon, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <input type="url" value={form.links[key] || ''} onChange={(e) => setForm({ ...form, links: { ...form.links, [key]: e.target.value } })} className="input-cyber w-full" placeholder={`${label} URL`} />
                    </div>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-xs disabled:opacity-60">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> SAVING...</> : 'SAVE PROFILE'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {!profile && !isOwn && (
          <div className="flex items-center gap-2 text-white/30 font-inter text-xs mb-6 px-1">
            <AlertCircle className="w-3.5 h-3.5" /> This member hasn't customized their profile yet.
          </div>
        )}

        {/* CTF Stats */}
        {!stats || stats.eventsPlayed === 0 ? (
          <div className="feature-card rounded-sm p-8 text-center mb-6">
            <Zap className="w-6 h-6 text-white/20 mx-auto mb-3" />
            <p className="text-white/30 font-inter text-sm">{isOwn ? "You haven't competed in any events yet." : 'No event activity yet.'}</p>
            {isOwn && <button onClick={() => onNavigate('events')} className="btn-outline mt-4 text-xs inline-flex items-center gap-2">BROWSE EVENTS</button>}
          </div>
        ) : (
          <>
            <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }} className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <StatCard icon={Award} label="TOTAL POINTS" value={stats.totalPoints} />
                <StatCard icon={Target} label="SOLVED" value={stats.totalSolved} />
                <StatCard icon={Trophy} label="EVENTS PLAYED" value={stats.eventsPlayed} />
                <StatCard icon={Crown} label="BEST RANK" value={stats.bestRank ? `#${stats.bestRank}` : '—'} />
              </div>
            </motion.div>

            {/* Category / Difficulty breakdown */}
            {(categoryBreakdown.length > 0 || difficultyBreakdown.length > 0) && (
              <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <BreakdownBars title="SOLVES BY CATEGORY" data={categoryBreakdown} config={categoryConfig} />
                <BreakdownBars title="SOLVES BY DIFFICULTY" data={difficultyBreakdown} config={difficultyConfig} />
              </motion.div>
            )}

            {/* Activity heatmap */}
            <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }} className="feature-card rounded-sm p-5 sm:p-6 mb-6 overflow-x-auto">
              <h3 className="font-cyber text-xs text-white/50 tracking-widest mb-4">SOLVE ACTIVITY</h3>
              <div className="min-w-[560px]">
                <div className="flex gap-[3px] mb-1 pl-6 relative" style={{ height: '14px' }}>
                  {heatmap.monthLabels.map(({ col, label }) => (
                    <span key={`${label}-${col}`} className="text-white/30 text-[10px] font-inter absolute top-0" style={{ left: `${24 + col * 13}px` }}>{label}</span>
                  ))}
                </div>
                <div className="flex gap-[3px]">
                  <div className="flex flex-col gap-[3px] justify-around pr-1" style={{ height: '91px' }}>
                    {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                      <span key={i} className="text-white/25 text-[9px] font-inter h-[10px] leading-[10px]">{d}</span>
                    ))}
                  </div>
                  {heatmap.cols.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((cell) => (
                        <div
                          key={cell.key}
                          title={cell.inRange ? `${cell.count} solve${cell.count === 1 ? '' : 's'} on ${cell.date.toLocaleDateString()}` : ''}
                          className="w-[10px] h-[10px] rounded-[2px]"
                          style={{
                            background: !cell.inRange ? 'transparent' : heatLevel(cell.count) === 0 ? 'rgba(255,255,255,0.04)' : accentColor,
                            opacity: !cell.inRange ? 0 : heatLevel(cell.count) === 0 ? 1 : [0, 0.35, 0.55, 0.75, 1][heatLevel(cell.count)],
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Recent activity + Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }} className="feature-card rounded-sm p-5 sm:p-6">
                <h3 className="font-cyber text-xs text-white/50 tracking-widest mb-4">RECENT ACTIVITY</h3>
                {activity.length === 0 ? (
                  <p className="text-white/30 text-sm font-inter">No solves yet.</p>
                ) : (
                  <div className="space-y-3">
                    {activity.slice(0, 6).map((a) => {
                      const catMeta = categoryConfig[a.category];
                      const CatIcon = catMeta?.icon || Flame;
                      return (
                        <div key={`${a.eventId}-${a.challengeId}`} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-sm border flex items-center justify-center flex-shrink-0 ${catMeta?.color || 'text-white/40 border-white/10 bg-white/5'}`}>
                            <CatIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white/80 text-sm font-inter truncate">{a.challengeTitle}</div>
                            <div className="text-white/30 text-xs font-inter truncate">{a.eventTitle}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-cyber text-xs gradient-text">+{a.points}</div>
                            <div className="text-white/25 text-[10px] font-inter">{formatRelativeTime(a.date)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }} className="feature-card rounded-sm p-5 sm:p-6">
                <h3 className="font-cyber text-xs text-white/50 tracking-widest mb-4">ACHIEVEMENTS ({earned.length}/{achievementList.length})</h3>
                <div className="grid grid-cols-3 xs:grid-cols-4 gap-3">
                  {achievementList.map((a) => {
                    const isEarned = earnedIds.has(a.id);
                    const Icon = a.icon;
                    return (
                      <div key={a.id} title={a.description} className="flex flex-col items-center gap-1.5 text-center">
                        <div className={`w-11 h-11 rounded-sm border flex items-center justify-center ${isEarned ? 'border-blue-500/40 bg-blue-950/20' : 'border-white/5 bg-white/[0.02] opacity-30'}`}>
                          <Icon className={`w-5 h-5 ${isEarned ? 'text-blue-400' : 'text-white/30'}`} />
                        </div>
                        <span className={`text-[10px] font-inter leading-tight ${isEarned ? 'text-white/60' : 'text-white/20'}`}>{a.label}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Per-event results */}
            <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.5 }}>
              <h3 className="font-cyber text-xs text-white/50 tracking-widest mb-3">EVENT HISTORY</h3>
              <div className="space-y-2">
                {stats.results.map((r) => (
                  <div key={r.eventId} className="feature-card p-4 rounded-sm flex items-center gap-4">
                    <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: r.bannerColor || accentColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-cyber text-sm text-white tracking-wide truncate">{r.eventTitle}</div>
                      <div className="text-white/30 text-xs font-inter">{r.challengesSolved} solved · rank #{r.rank} of {r.fieldSize}</div>
                    </div>
                    <div className="font-cyber text-sm gradient-text flex-shrink-0">{r.points} pts</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
