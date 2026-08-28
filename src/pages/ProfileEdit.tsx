import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Camera, Trash2, Plus, X as XIcon, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import { DashboardLayout } from '../components/DashboardLayout';
import { FormField, FormError, FormSuccess, Spinner } from '../components/ui/FormElements';
import {
  updateUserProfile, changeUsername, UsernameTakenError, isUsernameAvailable,
  type ProjectEntry, type AchievementEntry, type BadgeEntry,
} from '../lib/profile';
import { uploadAvatar, removeAvatar, AvatarValidationError } from '../lib/storage';
import { sanitizeUsername, validateUsernameFormat } from '../lib/username';
import { getAuthErrorMessage } from '../lib/authErrors';

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged';

export default function ProfileEdit() {
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [usernameInput, setUsernameInput] = useState(profile?.username ?? '');
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('unchanged');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameFormError, setUsernameFormError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [website, setWebsite] = useState(profile?.website ?? '');
  const [github, setGithub] = useState(profile?.github ?? '');
  const [linkedin, setLinkedin] = useState(profile?.linkedin ?? '');
  const [twitter, setTwitter] = useState(profile?.twitter ?? '');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [skillInput, setSkillInput] = useState('');
  const [projects, setProjects] = useState<ProjectEntry[]>(profile?.projects ?? []);
  const [achievements, setAchievements] = useState<AchievementEntry[]>(profile?.achievements ?? []);
  const [badges, setBadges] = useState<BadgeEntry[]>(profile?.badges ?? []);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [newProject, setNewProject] = useState({ title: '', description: '', url: '' });
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '' });
  const [newBadge, setNewBadge] = useState({ label: '', description: '' });

  useEffect(() => {
    setUsernameSaved(false);
    const clean = sanitizeUsername(usernameInput);
    if (clean === profile?.username) {
      setUsernameStatus('unchanged');
      setUsernameFormError(null);
      return;
    }
    const validation = validateUsernameFormat(clean);
    if (!validation.valid) {
      setUsernameStatus('invalid');
      setUsernameFormError(validation.error ?? 'Invalid username.');
      return;
    }
    setUsernameStatus('checking');
    setUsernameFormError(null);
    const timeout = setTimeout(() => {
      isUsernameAvailable(clean)
        .then((available) => setUsernameStatus(available ? 'available' : 'taken'))
        .catch(() => setUsernameStatus('idle'));
    }, 500);
    return () => clearTimeout(timeout);
  }, [usernameInput, profile?.username]);

  if (!profile || !user) return null; // RequireAuth guarantees this in practice

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      await updateUserProfile(user.uid, { photoURL: url });
    } catch (err) {
      setAvatarError(err instanceof AvatarValidationError ? err.message : getAuthErrorMessage(err));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      await removeAvatar(user.uid);
      await updateUserProfile(user.uid, { photoURL: null });
    } catch (err) {
      setAvatarError(getAuthErrorMessage(err));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleUsernameSave() {
    const clean = sanitizeUsername(usernameInput);
    if (clean === profile.username || usernameStatus === 'taken' || usernameStatus === 'invalid') return;

    setUsernameSaving(true);
    setUsernameFormError(null);
    try {
      await changeUsername(user, clean);
      setUsernameSaved(true);
      setUsernameStatus('unchanged');
    } catch (err) {
      if (err instanceof UsernameTakenError) {
        setUsernameStatus('taken');
        setUsernameFormError('That username was just taken. Please choose another.');
      } else {
        setUsernameFormError(getAuthErrorMessage(err));
      }
    } finally {
      setUsernameSaving(false);
    }
  }

  function addSkill() {
    const value = skillInput.trim();
    if (!value || skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillInput('');
  }

  function addProject() {
    if (!newProject.title.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        url: newProject.url.trim() || undefined,
      },
    ]);
    setNewProject({ title: '', description: '', url: '' });
  }

  function addAchievement() {
    if (!newAchievement.title.trim()) return;
    setAchievements((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: newAchievement.title.trim(), description: newAchievement.description.trim() },
    ]);
    setNewAchievement({ title: '', description: '' });
  }

  function addBadge() {
    if (!newBadge.label.trim()) return;
    setBadges((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newBadge.label.trim(), description: newBadge.description.trim() || undefined },
    ]);
    setNewBadge({ label: '', description: '' });
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim() || profile.displayName,
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        github: github.trim(),
        linkedin: linkedin.trim(),
        twitter: twitter.trim(),
        skills,
        projects,
        achievements,
        badges,
      });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="Edit Profile" description="This is what other members see on your public profile.">
      <div className="space-y-6">
        {/* Avatar */}
        <div className="feature-card p-6">
          <h2 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Profile Picture</h2>
          <div className="flex items-center gap-5">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-20 h-20 rounded-full border-2 border-blue-500/30 object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="font-cyber text-2xl text-white/40">{profile.displayName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="btn-outline text-xs flex items-center gap-2 disabled:opacity-60"
              >
                {avatarUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {profile.photoURL ? 'REPLACE' : 'UPLOAD'}
              </button>
              {profile.photoURL && (
                <button
                  type="button"
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  className="text-xs text-red-400/70 hover:text-red-400 font-inter flex items-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
          {avatarError && <p className="mt-3 text-xs text-red-400/80 font-inter">{avatarError}</p>}
          <p className="mt-3 text-xs text-white/30 font-inter">JPG, PNG, WEBP or GIF. Max 5MB.</p>
        </div>

        {/* Username */}
        <div className="feature-card p-6">
          <h2 className="font-cyber text-xs text-white/40 tracking-widest uppercase mb-4">Username</h2>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="input-cyber pr-9"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Spinner className="w-4 h-4 text-white/40" />}
                  {usernameStatus === 'available' && <Check className="w-4 h-4 text-emerald-400" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                    <XIcon className="w-4 h-4 text-red-400" />
                  )}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-white/35 font-inter">
                cybroatrix.com/{sanitizeUsername(usernameInput) || 'username'}
              </p>
              {usernameFormError && <p className="mt-1 text-xs text-red-400/80 font-inter">{usernameFormError}</p>}
              {usernameSaved && <p className="mt-1 text-xs text-emerald-400/80 font-inter">Username updated.</p>}
            </div>
            <button
              type="button"
              onClick={handleUsernameSave}
              disabled={usernameSaving || usernameStatus === 'unchanged' || usernameStatus === 'checking' || usernameStatus === 'taken' || usernameStatus === 'invalid'}
              className="btn-outline text-xs whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {usernameSaving ? 'SAVING…' : 'SAVE USERNAME'}
            </button>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleSaveProfile} className="feature-card p-6 space-y-5">
          <h2 className="font-cyber text-xs text-white/40 tracking-widest uppercase">Profile Details</h2>

          <FormField label="Display Name" htmlFor="edit-name" required>
            <input id="edit-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input-cyber" />
          </FormField>

          <FormField label="Bio" htmlFor="edit-bio">
            <textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Tell the community a bit about yourself…"
              className="input-cyber resize-none"
            />
            <p className="mt-1 text-right text-xs text-white/25 font-inter">{bio.length}/280</p>
          </FormField>

          <div className="grid sm:grid-cols-2 gap-5">
            <FormField label="Location" htmlFor="edit-location">
              <input id="edit-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="input-cyber" />
            </FormField>
            <FormField label="Website" htmlFor="edit-website">
              <input id="edit-website" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yoursite.com" className="input-cyber" />
            </FormField>
            <FormField label="GitHub" htmlFor="edit-github">
              <input id="edit-github" type="text" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username" className="input-cyber" />
            </FormField>
            <FormField label="LinkedIn" htmlFor="edit-linkedin">
              <input id="edit-linkedin" type="text" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="username" className="input-cyber" />
            </FormField>
            <FormField label="Twitter / X" htmlFor="edit-twitter">
              <input id="edit-twitter" type="text" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="username" className="input-cyber" />
            </FormField>
          </div>

          {/* Skills */}
          <div>
            <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2 uppercase">Skills</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {skills.map((skill) => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-inter text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                  {skill}
                  <button type="button" onClick={() => setSkills((prev) => prev.filter((s) => s !== skill))} className="hover:text-white">
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                placeholder="Add a skill and press Enter"
                className="input-cyber"
              />
              <button type="button" onClick={addSkill} className="btn-outline text-xs px-4 whitespace-nowrap">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Projects */}
          <div>
            <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2 uppercase">Projects</label>
            <div className="space-y-2 mb-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-start justify-between gap-3 social-card p-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-inter font-medium truncate">{project.title}</p>
                    {project.description && <p className="text-xs text-white/40 font-inter line-clamp-1">{project.description}</p>}
                  </div>
                  <button type="button" onClick={() => setProjects((prev) => prev.filter((p) => p.id !== project.id))} className="text-white/30 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <input type="text" value={newProject.title} onChange={(e) => setNewProject((p) => ({ ...p, title: e.target.value }))} placeholder="Project title" className="input-cyber" />
              <input type="text" value={newProject.description} onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))} placeholder="Short description" className="input-cyber" />
              <div className="flex gap-2">
                <input type="text" value={newProject.url} onChange={(e) => setNewProject((p) => ({ ...p, url: e.target.value }))} placeholder="Link (optional)" className="input-cyber" />
                <button type="button" onClick={addProject} className="btn-outline text-xs px-4 flex-shrink-0"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div>
            <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2 uppercase">Achievements</label>
            <div className="space-y-2 mb-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-start justify-between gap-3 social-card p-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-inter font-medium truncate">{achievement.title}</p>
                    {achievement.description && <p className="text-xs text-white/40 font-inter line-clamp-1">{achievement.description}</p>}
                  </div>
                  <button type="button" onClick={() => setAchievements((prev) => prev.filter((a) => a.id !== achievement.id))} className="text-white/30 hover:text-red-400 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <input type="text" value={newAchievement.title} onChange={(e) => setNewAchievement((a) => ({ ...a, title: e.target.value }))} placeholder="Achievement title" className="input-cyber" />
              <div className="flex gap-2">
                <input type="text" value={newAchievement.description} onChange={(e) => setNewAchievement((a) => ({ ...a, description: e.target.value }))} placeholder="Short description" className="input-cyber" />
                <button type="button" onClick={addAchievement} className="btn-outline text-xs px-4 flex-shrink-0"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <label className="block font-cyber text-xs text-white/40 tracking-widest mb-2 uppercase">Badges</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {badges.map((badge) => (
                <span key={badge.id} title={badge.description} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-cyber tracking-wide text-white bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full">
                  {badge.label}
                  <button type="button" onClick={() => setBadges((prev) => prev.filter((b) => b.id !== badge.id))} className="hover:text-red-300">
                    <XIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newBadge.label} onChange={(e) => setNewBadge((b) => ({ ...b, label: e.target.value }))} placeholder="Badge name" className="input-cyber" />
              <input type="text" value={newBadge.description} onChange={(e) => setNewBadge((b) => ({ ...b, description: e.target.value }))} placeholder="Description (optional)" className="input-cyber" />
              <button type="button" onClick={addBadge} className="btn-outline text-xs px-4 flex-shrink-0 whitespace-nowrap"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <FormError message={saveError} />
          <FormSuccess message={saveSuccess ? 'Profile saved.' : null} />

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <Spinner /> : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
