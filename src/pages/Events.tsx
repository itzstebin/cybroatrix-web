import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../lib/useAuth';
import { dbList, dbGet, dbPush, dbSet, dbUpdate, dbRemove } from '../lib/firebase';
import { difficulties, difficultyConfig, categories, categoryConfig } from '../lib/challengeMeta';
import {
  Trophy, Calendar, Users, MapPin, Clock, Plus, X, Edit3, Trash2,
  Check, ArrowRight, Loader2, AlertCircle, UserCircle, Search,
  Terminal, Home, Crown, Medal, Target,
  KeyRound, Lightbulb, LogOut, Star, Share2, Lock, Sparkles,
  Shield, Flame, Eye, EyeOff, Mail,
  Flag, TrendingUp, UserPlus, Swords, BookOpen, Radio, LogIn, Upload,
} from 'lucide-react';

interface EventRow {
  id: string;
  title: string;
  description: string;
  event_type: string;
  event_date: string;
  location: string;
  max_participants: number | null;
  creator_name: string;
  creator_email: string | null;
  created_at: string;
  user_id: string | null;
  join_code: string | null;
  status: string;
  banner_color: string | null;
  start_time?: string | null;
  end_time?: string | null;
  registration_count?: number;
}

interface ChallengeRow {
  id: string;
  event_id: string;
  title: string;
  description: string;
  question: string;
  answer?: string;
  hint: string | null;
  points: number;
  order_index: number;
  difficulty: string;
  category: string;
  file_url: string | null;
  file_name?: string | null;
  created_at: string;
}

interface LeaderboardRow {
  id: string;
  event_id: string;
  user_id: string | null;
  participant_name: string;
  participant_email: string | null;
  points: number;
  challenges_solved: number;
  created_at: string;
}

interface RegistrationRow {
  id: string;
  event_id: string;
  participant_name: string;
  participant_email: string | null;
  created_at: string;
}

interface SolveResult {
  success: boolean;
  points: number;
  message: string;
}

// Firebase Realtime Database keys can't contain . # $ [ ] / — sanitize emails etc. before using as keys
function sanitizeKey(raw: string): string {
  return raw.replace(/[.#$/[\]]/g, '_');
}

const eventTypeConfig: Record<string, { icon: typeof Trophy; label: string }> = {
  CTF: { icon: Trophy, label: 'CTF' },
  Workshop: { icon: Terminal, label: 'Workshop' },
  'Live Session': { icon: Radio, label: 'Live' },
};
const eventTypes = ['CTF', 'Workshop', 'Live Session'];
const bannerColors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

type SidebarTab = 'all' | 'leaderboard' | 'mine' | 'manage';

export default function Events() {
  const { user: fbUser, signInGoogle, signInEmail, signUpEmail, signOut } = useAuth();
  const reduceMotion = useReducedMotion();
  const authUser = fbUser ? {
    id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName || 'User', avatar_url: fbUser.photoURL || null,
  } : null;

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', confirm: '' });

  // Event form
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingEvent, setEditingEvent] = useState<EventRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', description: '', event_type: 'CTF', event_date: 'TBA',
    location: 'Online', max_participants: '', creator_name: '',
    join_code: '', status: 'scheduled', banner_color: '#3b82f6',
    start_time: '', end_time: '',
  });

  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [challengeDraft, setChallengeDraft] = useState({
    title: '', description: '', question: '', answer: '', hint: '', points: '100', difficulty: 'medium', category: 'Web', file_url: '', file_name: '',
  });
  const [uploadingChallengeFile, setUploadingChallengeFile] = useState(false);
  const [challengeFileError, setChallengeFileError] = useState<string | null>(null);

  // Details
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [fullPageOpen, setFullPageOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<EventRow | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [detailsChallenges, setDetailsChallenges] = useState<ChallengeRow[]>([]);
  const [detailsLeaderboard, setDetailsLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'info' | 'challenges' | 'leaderboard' | 'participants'>('info');

  const [joinName, setJoinName] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  const [solvingChallengeId, setSolvingChallengeId] = useState<string | null>(null);
  const [solveAnswer, setSolveAnswer] = useState('');
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [solving, setSolving] = useState(false);
  const [showHintFor, setShowHintFor] = useState<string | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardRow[]>([]);
  const [shareCopied, setShareCopied] = useState(false);

  // ---- Auth handlers ----
  const resetAuthForm = () => { setAuthForm({ name: '', email: '', password: '', confirm: '' }); setAuthError(null); setShowPw(false); };
  const openAuth = (mode: 'login' | 'signup') => { setAuthMode(mode); resetAuthForm(); setShowAuthModal(true); };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setAuthError(null);
    try {
      if (authMode === 'login') {
        await signInEmail(authForm.email, authForm.password);
      } else {
        if (!authForm.name.trim()) throw new Error('Display name is required');
        if (authForm.password.length < 6) throw new Error('Password must be at least 6 characters');
        if (authForm.password !== authForm.confirm) throw new Error('Passwords do not match');
        await signUpEmail(authForm.email, authForm.password, authForm.name);
      }
      setShowAuthModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setAuthError(msg.replace('Firebase: ', '').replace(/\(auth\/.*?\)\.?/, '').trim() || msg);
    }
    setBusy(false);
  };

  const handleGoogleAuth = async () => {
    setBusy(true); setAuthError(null);
    try { await signInGoogle(); setShowAuthModal(false); }
    catch (err) { setAuthError(err instanceof Error ? err.message : 'Google sign-in failed'); }
    setBusy(false);
  };

  const handleSignOut = async () => { await signOut(); };

  // ---- Fetch ----
  const fetchEvents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const evList = await dbList<EventRow>('events');
      // eventRegistrations is stored as eventRegistrations/{eventId}/{regId}
      const regsRoot = await dbGet<Record<string, Record<string, RegistrationRow>>>('eventRegistrations');
      const enriched = evList
        .map(ev => ({
          ...ev,
          registration_count: regsRoot?.[ev.id] ? Object.keys(regsRoot[ev.id]).length : 0,
        }))
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      setEvents(enriched);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load events'); }
    finally { setLoading(false); }
  }, []);

  const fetchOverallLeaderboard = useCallback(async () => {
    try {
      // eventLeaderboard is stored as eventLeaderboard/{eventId}/{entryId}
      const lbRoot = await dbGet<Record<string, Record<string, LeaderboardRow>>>('eventLeaderboard');
      const flat: LeaderboardRow[] = [];
      if (lbRoot) {
        for (const eventId of Object.keys(lbRoot)) {
          for (const entryId of Object.keys(lbRoot[eventId])) {
            flat.push({ ...lbRoot[eventId][entryId], id: entryId });
          }
        }
      }
      flat.sort((a, b) => b.points - a.points);
      setOverallLeaderboard(flat);
    } catch { setOverallLeaderboard([]); }
  }, []);

  useEffect(() => { fetchEvents(); fetchOverallLeaderboard(); }, [fetchEvents, fetchOverallLeaderboard]);

  // ---- Filtering ----
  const filteredEvents = events.filter(ev => !search ||
    ev.title.toLowerCase().includes(search.toLowerCase()) ||
    ev.description.toLowerCase().includes(search.toLowerCase()) ||
    ev.creator_name.toLowerCase().includes(search.toLowerCase())
  );
  const myEvents = events.filter(ev => authUser && ev.user_id === authUser.id);
  const eventsToShow = sidebarTab === 'mine' ? myEvents.filter(ev => !search ||
    ev.title.toLowerCase().includes(search.toLowerCase())) : filteredEvents;

  // ---- Event form ----
  const openCreateForm = () => {
    if (!authUser) { openAuth('signup'); return; }
    setFormMode('create'); setEditingEvent(null); setFormStep(1);
    setFormData({
      title: '', description: '', event_type: 'CTF', event_date: 'TBA',
      location: 'Online', max_participants: '', creator_name: authUser.name,
      join_code: '', status: 'scheduled', banner_color: '#3b82f6',
      start_time: '', end_time: '',
    });
    setChallenges([]);
    setChallengeDraft({ title: '', description: '', question: '', answer: '', hint: '', points: '100', difficulty: 'medium', category: 'Web', file_url: '', file_name: '' });
    setChallengeFileError(null); setUploadingChallengeFile(false);
    setShowFormModal(true);
  };

  const openEditForm = async (ev: EventRow) => {
    setFormMode('edit'); setEditingEvent(ev); setFormStep(1);
    setFormData({
      title: ev.title, description: ev.description, event_type: ev.event_type,
      event_date: ev.event_date, location: ev.location,
      max_participants: ev.max_participants ? String(ev.max_participants) : '',
      creator_name: ev.creator_name, join_code: ev.join_code || '',
      status: ev.status || 'scheduled', banner_color: ev.banner_color || '#3b82f6',
      start_time: ev.start_time || '', end_time: ev.end_time || '',
    });
    setChallenges([]);
    setChallengeDraft({ title: '', description: '', question: '', answer: '', hint: '', points: '100', difficulty: 'medium', category: 'Web', file_url: '', file_name: '' });
    setChallengeFileError(null); setUploadingChallengeFile(false);
    setShowFormModal(true);
    try {
      const list = await dbList<ChallengeRow>(`eventChallenges/${ev.id}`);
      list.sort((a, b) => a.order_index - b.order_index);
      setChallenges(list);
    } catch { /* ignore */ }
  };

  const addChallengeDraft = () => {
    if (!challengeDraft.title.trim() || !challengeDraft.question.trim() || !challengeDraft.answer.trim()) return;
    const newCh: ChallengeRow = {
      id: 'draft-' + Date.now(), event_id: editingEvent?.id || 'pending',
      title: challengeDraft.title.trim(), description: challengeDraft.description.trim(),
      question: challengeDraft.question.trim(), answer: challengeDraft.answer.trim(),
      hint: challengeDraft.hint.trim() || null, points: parseInt(challengeDraft.points, 10) || 100,
      order_index: challenges.length, difficulty: challengeDraft.difficulty,
      category: challengeDraft.category, file_url: challengeDraft.file_url.trim() || null,
      file_name: challengeDraft.file_name.trim() || null,
      created_at: new Date().toISOString(),
    };
    setChallenges([...challenges, newCh]);
    setChallengeDraft({ title: '', description: '', question: '', answer: '', hint: '', points: '100', difficulty: 'medium', category: 'Web', file_url: '', file_name: '' });
    setChallengeFileError(null);
  };

  const MAX_CHALLENGE_FILE_BYTES = 700 * 1024; // ~700KB raw (~950KB once base64-encoded)

  const handleChallengeFileUpload = async (file: File) => {
    setUploadingChallengeFile(true); setChallengeFileError(null);
    try {
      if (file.size > MAX_CHALLENGE_FILE_BYTES) {
        throw new Error(`File must be under ${Math.round(MAX_CHALLENGE_FILE_BYTES / 1024)}KB (this database stores files inline — keep it small, e.g. text, small images, or small zips)`);
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      setChallengeDraft(prev => ({ ...prev, file_url: dataUrl, file_name: file.name }));
    } catch (err) {
      setChallengeFileError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingChallengeFile(false);
    }
  };

  const removeChallengeDraft = (id: string) => setChallenges(challenges.filter(c => c.id !== id));

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      const payload = {
        title: formData.title.trim(), description: formData.description.trim(),
        event_type: formData.event_type, event_date: formData.event_date.trim() || 'TBA',
        location: formData.location.trim() || 'Online',
        max_participants: formData.max_participants ? parseInt(formData.max_participants, 10) : null,
        creator_name: formData.creator_name.trim(), creator_email: authUser?.email || null,
        user_id: authUser?.id || null, join_code: formData.join_code.trim() || null,
        status: formData.status, banner_color: formData.banner_color,
        start_time: formData.start_time || null, end_time: formData.end_time || null,
      };
      let eventId: string;
      const nowIso = new Date().toISOString();
      if (formMode === 'create') {
        eventId = await dbPush('events', { ...payload, created_at: nowIso });
      } else if (editingEvent) {
        eventId = editingEvent.id;
        await dbUpdate(`events/${eventId}`, payload);
        // Remove challenges that were deleted in edit mode
        const existingIds = challenges.filter(c => !c.id.startsWith('draft-')).map(c => c.id);
        const existingCh = await dbList<ChallengeRow>(`eventChallenges/${eventId}`);
        const toDelete = existingCh.map(c => c.id).filter(id => !existingIds.includes(id));
        for (const id of toDelete) await dbRemove(`eventChallenges/${eventId}/${id}`);
      } else throw new Error('No event to edit');

      // Insert new draft challenges
      for (const ch of challenges.filter(c => c.id.startsWith('draft-'))) {
        const { id: _id, event_id: _eid, created_at: _ca, ...chData } = ch;
        await dbPush(`eventChallenges/${eventId}`, {
          ...chData, event_id: eventId, created_at: new Date().toISOString(),
        });
      }
      // Update existing challenges
      for (const ch of challenges.filter(c => !c.id.startsWith('draft-'))) {
        const { id: _id, ...chData } = ch;
        await dbSet(`eventChallenges/${eventId}/${ch.id}`, { ...chData, id: ch.id });
      }
      setShowFormModal(false);
      await fetchEvents();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save event'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await dbRemove(`eventChallenges/${deleteTarget.id}`);
      await dbRemove(`eventRegistrations/${deleteTarget.id}`);
      await dbRemove(`eventLeaderboard/${deleteTarget.id}`);
      await dbRemove(`events/${deleteTarget.id}`);
      setConfirmDelete(false); setDeleteTarget(null); setShowDetailsModal(false);
      await fetchEvents();
      await fetchOverallLeaderboard();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete event'); }
    finally { setSubmitting(false); }
  };

  // ---- Details ----
  // Stable identity used to dedupe solves across page refreshes.
  // Prefers the signed-in Firebase uid; falls back to a sanitized email if provided.
  const computeSolverKey = (emailOverride?: string | null): string | null => {
    if (authUser?.id) return `uid_${authUser.id}`;
    const email = (emailOverride || authUser?.email || '').trim().toLowerCase();
    return email ? `email_${sanitizeKey(email)}` : null;
  };

  const openDetails = async (ev: EventRow) => {
    setDetailsEvent(ev); setShowDetailsModal(true); setDetailsTab('info');
    setLoadingDetails(true);
    setJoinName(authUser?.name || ''); setJoinEmail(authUser?.email || ''); setJoinCode(''); setJoinError(null);
    setSolvingChallengeId(null); setSolveAnswer(''); setSolveResult(null);
    setShowHintFor(null); setShareCopied(false); setSolvedIds(new Set());
    try {
      const [regList, chList, lbList] = await Promise.all([
        dbList<RegistrationRow>(`eventRegistrations/${ev.id}`),
        dbList<ChallengeRow>(`eventChallenges/${ev.id}`),
        dbList<LeaderboardRow>(`eventLeaderboard/${ev.id}`),
      ]);
      regList.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
      chList.sort((a, b) => a.order_index - b.order_index);
      lbList.sort((a, b) => b.points - a.points);
      setRegistrations(regList);
      setDetailsChallenges(chList);
      setDetailsLeaderboard(lbList);
      const ownReg = authUser ? regList.find(r => r.participant_email === authUser.email) : null;
      if (authUser) {
        setHasJoined(!!ownReg);
      } else setHasJoined(false);

      // Restore which challenges this user has already solved, so refreshing doesn't let them re-earn points.
      const solverKey = computeSolverKey(ownReg?.participant_email);
      if (solverKey) {
        const solvesRoot = await dbGet<Record<string, Record<string, unknown>>>(`eventSolves/${ev.id}`);
        const solved = new Set<string>();
        if (solvesRoot) {
          for (const challengeId of Object.keys(solvesRoot)) {
            if (solvesRoot[challengeId]?.[solverKey]) solved.add(challengeId);
          }
        }
        setSolvedIds(solved);
      }
    } catch {
      setRegistrations([]); setDetailsChallenges([]); setDetailsLeaderboard([]); setHasJoined(false);
    } finally { setLoadingDetails(false); }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailsEvent) return;
    if (!joinName.trim()) { setJoinError('Please enter your name'); return; }
    if (detailsEvent.join_code && joinCode.trim() !== detailsEvent.join_code.trim()) { setJoinError('Incorrect password'); return; }
    if (detailsEvent.max_participants && registrations.length >= detailsEvent.max_participants) { setJoinError('Event is full'); return; }
    setJoinError(null);
    try {
      const reg = {
        event_id: detailsEvent.id, participant_name: joinName.trim(),
        participant_email: joinEmail.trim() || null, created_at: new Date().toISOString(),
      };
      const regId = await dbPush(`eventRegistrations/${detailsEvent.id}`, reg);
      setRegistrations([...registrations, { ...reg, id: regId } as RegistrationRow]);
      setHasJoined(true); setJoinName(''); setJoinEmail(''); setJoinCode('');
      await fetchEvents();
    } catch (err) { setJoinError(err instanceof Error ? err.message : 'Failed to join'); }
  };

  const handleSolveChallenge = async (challenge: ChallengeRow) => {
    if (!detailsEvent || !solveAnswer.trim()) return;
    const now = new Date();
    if (detailsEvent.start_time && now < new Date(detailsEvent.start_time)) {
      setSolveResult({ success: false, points: 0, message: 'This event has not opened yet.' });
      return;
    }
    if (detailsEvent.end_time && now > new Date(detailsEvent.end_time)) {
      setSolveResult({ success: false, points: 0, message: 'This event has closed. Submissions are no longer accepted.' });
      return;
    }
    setSolving(true); setSolveResult(null);
    try {
      const userAnswer = solveAnswer.trim();
      const expected = (challenge.answer || '').trim();
      const isCorrect = userAnswer.toLowerCase() === expected.toLowerCase();
      if (!isCorrect) {
        setSolveResult({ success: false, points: 0, message: 'Incorrect answer. Try again!' });
        return;
      }
      const userEmail = authUser?.email || joinEmail || null;
      const userName = authUser?.name || joinName || 'Anonymous';

      // Persistent dedupe check — survives page refresh, unlike the in-memory solvedIds set.
      const solverKey = computeSolverKey(userEmail);
      if (solverKey) {
        const alreadySolved = await dbGet(`eventSolves/${detailsEvent.id}/${challenge.id}/${solverKey}`);
        if (alreadySolved) {
          setSolvedIds(new Set([...solvedIds, challenge.id]));
          setSolveResult({ success: false, points: 0, message: 'You already solved this challenge.' });
          return;
        }
      }

      // Check if already solved by this user
      let existingId: string | null = null;
      let existing: LeaderboardRow | null = null;
      if (userEmail) {
        const lbList = await dbList<LeaderboardRow>(`eventLeaderboard/${detailsEvent.id}`);
        const match = lbList.find(l => l.participant_email === userEmail);
        if (match) { existingId = match.id; existing = match; }
      }
      if (existing && existingId) {
        const newPoints = existing.points + challenge.points;
        const newSolved = existing.challenges_solved + 1;
        await dbUpdate(`eventLeaderboard/${detailsEvent.id}/${existingId}`, {
          points: newPoints, challenges_solved: newSolved,
        });
        setSolveResult({ success: true, points: challenge.points, message: `Correct! +${challenge.points} points` });
      } else {
        const lb = {
          event_id: detailsEvent.id, user_id: authUser?.id || null,
          participant_name: userName, participant_email: userEmail,
          points: challenge.points, challenges_solved: 1, created_at: new Date().toISOString(),
        };
        await dbPush(`eventLeaderboard/${detailsEvent.id}`, lb);
        setSolveResult({ success: true, points: challenge.points, message: `Correct! +${challenge.points} points` });
      }
      // Record the solve permanently so a refresh (or resubmitting the same flag) can't double-award points.
      if (solverKey) {
        await dbSet(`eventSolves/${detailsEvent.id}/${challenge.id}/${solverKey}`, {
          participant_name: userName, participant_email: userEmail,
          user_id: authUser?.id || null, solved_at: new Date().toISOString(),
        });
      }
      setSolvedIds(new Set([...solvedIds, challenge.id]));
      // Refresh leaderboard
      const refreshedLb = await dbList<LeaderboardRow>(`eventLeaderboard/${detailsEvent.id}`);
      refreshedLb.sort((a, b) => b.points - a.points);
      setDetailsLeaderboard(refreshedLb);
      await fetchOverallLeaderboard();
      setTimeout(() => { setSolvingChallengeId(null); setSolveAnswer(''); setSolveResult(null); }, 2500);
    } catch (err) {
      setSolveResult({ success: false, points: 0, message: err instanceof Error ? err.message : 'Failed to submit' });
    } finally { setSolving(false); }
  };

  const handleLeave = async (regId: string) => {
    if (!detailsEvent) return;
    try {
      await dbRemove(`eventRegistrations/${detailsEvent.id}/${regId}`);
      setRegistrations(registrations.filter(r => r.id !== regId));
      setHasJoined(false);
      await fetchEvents();
    } catch (err) { setJoinError(err instanceof Error ? err.message : 'Failed to leave'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/events').then(() => {
      setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => setShareCopied(false));
  };

  const totalParticipants = events.reduce((s, e) => s + (e.registration_count || 0), 0);
  const totalSolves = overallLeaderboard.reduce((s, e) => s + e.challenges_solved, 0);
  const canEditEvent = (ev: EventRow) => authUser && (ev.user_id === null || ev.user_id === authUser.id);

  const sidebarItems = [
    { id: 'all' as const, icon: Trophy, label: 'Arena', count: events.length },
    { id: 'leaderboard' as const, icon: Crown, label: 'Rankings', count: null },
    { id: 'mine' as const, icon: Shield, label: 'My Events', count: authUser ? myEvents.length : null },
    { id: 'manage' as const, icon: Target, label: 'Manage', count: null },
  ];

  function renderEventTabs(scope: 'modal' | 'page') {
    const allTabs = [
      { id: 'info' as const, label: 'Info', icon: Target },
      { id: 'challenges' as const, label: `Challenges (${detailsChallenges.length})`, icon: Terminal },
      { id: 'leaderboard' as const, label: 'Rankings', icon: Crown },
      { id: 'participants' as const, label: `Players (${registrations.length})`, icon: Users },
    ];
    const tabs = scope === 'modal' ? allTabs.filter(t => t.id === 'info' || t.id === 'participants') : allTabs;
    return (
            <div className="flex items-center gap-1 mb-6 border-b border-blue-900/20 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setDetailsTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-2.5 font-cyber text-xs tracking-wide transition-all border-b-2 whitespace-nowrap ${detailsTab === tab.id ? 'border-blue-500 text-white' : 'border-transparent text-white/40 hover:text-white'}`}>
                    <Icon className="w-3.5 h-3.5" /> {tab.label.toUpperCase()}
                  </button>
                );
              })}
            </div>
    );
  }

  function renderEventTabContent(detailsEvent: EventRow) {
    return (
      <>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
            ) : detailsTab === 'info' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InfoCard icon={Clock} label="DATE" value={detailsEvent.event_date} />
                  <InfoCard icon={MapPin} label="LOCATION" value={detailsEvent.location} />
                  <InfoCard icon={Users} label="PLAYERS" value={`${registrations.length}${detailsEvent.max_participants ? ` / ${detailsEvent.max_participants}` : ''}`} />
                </div>
                {(detailsEvent.start_time || detailsEvent.end_time) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailsEvent.start_time && (
                      <InfoCard icon={Clock} label="CHALLENGES OPEN" value={new Date(detailsEvent.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} />
                    )}
                    {detailsEvent.end_time && (
                      <InfoCard icon={Clock} label="CHALLENGES CLOSE" value={new Date(detailsEvent.end_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} />
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2"><UserCircle className="w-4 h-4 text-white/40" /><span className="font-cyber text-xs text-white/50 tracking-widest">HOSTED BY {detailsEvent.creator_name.toUpperCase()}</span></div>

                {!hasJoined ? (
                  <div className="feature-card p-4 rounded-sm">
                    <h3 className="font-cyber text-sm text-white mb-3 tracking-wide flex items-center gap-2"><UserPlus className="w-4 h-4 text-blue-400" /> JOIN THIS EVENT</h3>
                    <form onSubmit={handleJoin} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" required maxLength={50} value={joinName} onChange={(e) => setJoinName(e.target.value)} placeholder="Your name" className="input-cyber" />
                        <input type="email" value={joinEmail} onChange={(e) => setJoinEmail(e.target.value)} placeholder="Email (optional)" className="input-cyber" />
                      </div>
                      {detailsEvent.join_code && (
                        <div>
                          <label className="font-cyber text-xs text-amber-400/60 tracking-wider mb-1.5 flex items-center gap-1.5"><KeyRound className="w-3 h-3" /> PASSWORD REQUIRED</label>
                          <input type="text" required value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Enter event password" className="input-cyber" />
                        </div>
                      )}
                      <button type="submit" disabled={!!detailsEvent.max_participants && registrations.length >= detailsEvent.max_participants} className="btn-primary flex items-center gap-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center">
                        <UserPlus className="w-4 h-4" /> JOIN EVENT
                      </button>
                      {joinError && <p className="text-red-400 text-xs font-inter">{joinError}</p>}
                      {detailsEvent.max_participants && registrations.length >= detailsEvent.max_participants && <p className="text-orange-400 text-xs font-inter">This event is full.</p>}
                    </form>
                  </div>
                ) : (
                  <div className="feature-card p-4 rounded-sm flex items-center gap-3 border-emerald-500/20">
                    <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center rounded-sm flex-shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-cyber text-sm text-white tracking-wide">YOU'RE IN!</div>
                      <div className="text-white/40 text-xs font-inter">Ready to start solving challenges.</div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setDetailsTab('challenges'); setShowDetailsModal(false); setFullPageOpen(true); }}
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-xs"
                >
                  <Terminal className="w-4 h-4" /> ENTER CHALLENGES <ArrowRight className="w-4 h-4" />
                </button>

                {canEditEvent(detailsEvent) && (
                  <div className="flex items-center gap-2 pt-4 border-t border-blue-900/15">
                    <button onClick={() => openEditForm(detailsEvent)} className="btn-outline flex items-center gap-2 text-xs"><Edit3 className="w-3.5 h-3.5" /> EDIT</button>
                    <button onClick={() => { setDeleteTarget(detailsEvent); setConfirmDelete(true); }} className="btn-danger flex items-center gap-2 text-xs"><Trash2 className="w-3.5 h-3.5" /> DELETE</button>
                  </div>
                )}
              </div>
            ) : detailsTab === 'challenges' ? (
              (() => {
                const now = new Date();
                const opensAt = detailsEvent.start_time ? new Date(detailsEvent.start_time) : null;
                const closesAt = detailsEvent.end_time ? new Date(detailsEvent.end_time) : null;
                const notStarted = !!opensAt && now < opensAt;
                const closed = !!closesAt && now > closesAt;

                if (notStarted) {
                  return (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 border border-blue-900/30 flex items-center justify-center rounded-sm mx-auto mb-4">
                        <Clock className="w-7 h-7 text-blue-400/50" />
                      </div>
                      <h3 className="font-cyber text-lg text-white/60 mb-2">CHALLENGES NOT OPEN YET</h3>
                      <p className="text-white/30 font-inter text-sm">
                        Opens {opensAt!.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-5">
                    {closed && (
                      <div className="flex items-center gap-2 border border-red-500/30 bg-red-950/20 px-4 py-3 rounded-sm">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm font-inter">
                          This event closed {closesAt!.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}. Submissions are no longer accepted.
                        </p>
                      </div>
                    )}
                    {detailsChallenges.length === 0 ? (
                      <EmptyState icon={Terminal} title="NO CHALLENGES" desc="No challenges have been added yet." />
                    ) : (
                      detailsChallenges.map((ch) => {
                        const isSolved = solvedIds.has(ch.id);
                        const isActive = solvingChallengeId === ch.id;
                        const answerValue = isActive ? solveAnswer : '';
                        return (
                          <div key={ch.id} className={`feature-card rounded-sm overflow-hidden ${isSolved ? 'border-emerald-500/30' : ''}`}>
                            <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${detailsEvent.banner_color || '#3b82f6'}, transparent)` }} />
                            <div className="p-5 sm:p-6">
                              {/* Category + difficulty + points row */}
                              <div className="flex items-center gap-2 mb-4 flex-wrap">
                                <span className={`font-cyber text-xs px-2.5 py-1 border ${categoryConfig[ch.category]?.color || categoryConfig.Misc.color} tracking-wide rounded-sm`}>{ch.category}</span>
                                <span className={`flex items-center gap-1.5 font-cyber text-xs px-2.5 py-1 border ${difficultyConfig[ch.difficulty]?.color || difficultyConfig.medium.color} border-white/10 tracking-wide rounded-sm`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${difficultyConfig[ch.difficulty]?.dot || difficultyConfig.medium.dot}`} />
                                  {difficultyConfig[ch.difficulty]?.label || 'Medium'}
                                </span>
                                <span className="font-cyber text-xs px-2.5 py-1 border border-amber-500/30 text-amber-400 bg-amber-950/10 tracking-wider flex items-center gap-1 rounded-sm">
                                  <Star className="w-3 h-3" /> {ch.points} pts
                                </span>
                                {isSolved && (
                                  <span className="ml-auto font-cyber text-xs px-2.5 py-1 border border-emerald-500/30 text-emerald-400 bg-emerald-950/20 tracking-wider flex items-center gap-1.5 rounded-sm">
                                    <Check className="w-3.5 h-3.5" /> SOLVED
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="font-cyber text-lg sm:text-xl text-white mb-1 tracking-wide">{ch.title}</h3>
                              {ch.description && <p className="text-white/30 text-xs font-inter mb-4">{ch.description}</p>}

                              {/* Question / prompt block */}
                              <div className="border border-blue-900/25 bg-black/20 px-4 py-4 rounded-sm mb-4">
                                <p className="text-white/70 text-sm font-inter leading-relaxed whitespace-pre-wrap">{ch.question}</p>
                              </div>

                              {ch.file_url && (
                                <a href={ch.file_url} download={ch.file_name || undefined} target={ch.file_url.startsWith('data:') ? undefined : '_blank'} rel="noopener noreferrer" className="mb-4 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors font-inter">
                                  <BookOpen className="w-3.5 h-3.5" /> {ch.file_name ? `Download ${ch.file_name}` : 'Download challenge file'}
                                </a>
                              )}

                              {/* Flag input — always visible, Dragon Byte style */}
                              {isSolved ? (
                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-inter">
                                  <Flag className="w-4 h-4" /> Correct — +{ch.points} points earned
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                      type="text"
                                      value={answerValue}
                                      onChange={(e) => { setSolvingChallengeId(ch.id); setSolveAnswer(e.target.value); }}
                                      onFocus={() => { if (solvingChallengeId !== ch.id) { setSolvingChallengeId(ch.id); setSolveResult(null); } }}
                                      placeholder={closed ? 'Submissions closed' : 'Enter flag / answer...'}
                                      className="input-cyber flex-1"
                                      onKeyDown={(e) => { if (e.key === 'Enter' && !solving && !closed) handleSolveChallenge(ch); }}
                                      disabled={closed || (solving && isActive)}
                                    />
                                    <button onClick={() => { setSolvingChallengeId(ch.id); handleSolveChallenge(ch); }} disabled={closed || (solving && isActive)} className="btn-primary flex items-center justify-center gap-1.5 text-xs whitespace-nowrap disabled:opacity-50">
                                      {solving && isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />} SUBMIT
                                    </button>
                                  </div>
                                  {isActive && solveResult && (
                                    <p className={`text-sm font-inter flex items-center gap-1.5 ${solveResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {solveResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                      {solveResult.message}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Hint */}
                              {ch.hint && !isSolved && (
                                <div className="mt-3 pt-3 border-t border-blue-900/15">
                                  <button onClick={() => setShowHintFor(showHintFor === ch.id ? null : ch.id)} className="flex items-center gap-1.5 text-xs text-amber-400/60 hover:text-amber-400 transition-colors font-cyber tracking-wide">
                                    <Lightbulb className="w-3.5 h-3.5" /> {showHintFor === ch.id ? 'HIDE HINT' : 'REVEAL HINT'}
                                  </button>
                                  {showHintFor === ch.id && (
                                    <div className="mt-2 border border-amber-500/20 bg-amber-950/10 px-3 py-2 rounded-sm">
                                      <p className="text-amber-400/70 text-sm font-inter">{ch.hint}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()
            ) : detailsTab === 'leaderboard' ? (
              <div className="space-y-2">
                {detailsLeaderboard.length === 0 ? (
                  <EmptyState icon={Crown} title="NO SCORES" desc="Solve challenges to appear here!" />
                ) : (
                  detailsLeaderboard.map((entry, i) => (
                    <div key={entry.id} className={`feature-card p-3 rounded-sm flex items-center gap-3 ${i < 3 ? 'border border-blue-500/20' : ''}`}>
                      <div className={`w-8 h-8 flex items-center justify-center rounded-sm flex-shrink-0 font-cyber ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white' : 'bg-white/5 text-white/60'}`}>
                        {i < 3 ? <Medal className="w-4 h-4 text-white" /> : <span>{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-cyber text-sm text-white tracking-wide truncate">{entry.participant_name}</div>
                        <div className="text-white/30 text-xs font-inter">{entry.challenges_solved} solved</div>
                      </div>
                      <div className="font-cyber text-sm gradient-text">{entry.points} pts</div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {registrations.length === 0 ? (
                  <p className="text-white/30 font-inter text-sm py-3">No players yet. Be the first!</p>
                ) : (
                  registrations.map((reg, i) => (
                    <div key={reg.id} className="flex items-center gap-3 px-3 py-2.5 border border-blue-900/15 bg-white/[0.02] rounded-sm">
                      <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-cyber text-xs text-white">{(i + 1).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/70 text-sm font-inter truncate">{reg.participant_name}</div>
                        {reg.participant_email && <div className="text-white/30 text-xs font-inter truncate">{reg.participant_email}</div>}
                      </div>
                      {canEditEvent(detailsEvent) && <button onClick={() => handleLeave(reg.id)} className="text-white/20 hover:text-red-400 transition-colors p-1" title="Remove"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))
                )}
              </div>
            )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-md border-b border-blue-900/20">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-white/50 hover:text-white transition-colors" aria-label="Toggle sidebar">
              <Trophy className="w-5 h-5" />
            </button>
            <a href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 gradient-bg rounded-sm flex items-center justify-center">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <span className="font-cyber text-sm sm:text-base font-bold text-white">CTF <span className="gradient-text">ARENA</span></span>
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="/" className="flex items-center gap-1.5 font-cyber text-xs text-white/40 hover:text-white transition-colors px-3 py-2 border border-blue-900/20 rounded-sm hover:border-blue-500/30">
              <Home className="w-3.5 h-3.5" /> <span className="hidden sm:inline">HOME</span>
            </a>
            {authUser && (
              <div className="flex items-center gap-2">
                {authUser.avatar_url ? (
                  <img src={authUser.avatar_url} alt="" className="w-8 h-8 rounded-full border border-blue-500/30" />
                ) : (
                  <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                    <span className="font-cyber text-xs text-white">{authUser.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <span className="hidden sm:inline font-cyber text-xs text-white/60 max-w-[100px] truncate">{authUser.name}</span>
                <button onClick={handleSignOut} className="p-2 text-white/40 hover:text-red-400 transition-colors" title="Sign out"><LogOut className="w-4 h-4" /></button>
              </div>
            )}
            <button onClick={openCreateForm} className="btn-primary flex items-center gap-2 text-xs">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">CREATE</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-[52px] left-0 z-30 w-60 h-[calc(100vh-52px)] flex-shrink-0 bg-[#0a0a0f] border-r border-blue-900/20 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="p-4 flex flex-col h-full">
            <nav className="space-y-1 mb-6">
              <p className="font-cyber text-xs text-white/30 tracking-widest mb-3 px-2">MENU</p>
              {sidebarItems.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => { setSidebarTab(item.id); setSidebarOpen(false); setFullPageOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm font-cyber text-xs tracking-wide transition-all ${sidebarTab === item.id ? 'gradient-bg text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label.toUpperCase()}</span>
                    {item.count !== null && item.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-sm ${sidebarTab === item.id ? 'bg-white/20' : 'bg-white/10'}`}>{item.count}</span>}
                  </button>
                );
              })}
            </nav>

            {/* Stats panel */}
            <div className="feature-card p-4 rounded-sm mb-4">
              <p className="font-cyber text-xs text-white/30 tracking-widest mb-3 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> STATS</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs font-inter flex items-center gap-1.5"><Trophy className="w-3 h-3" /> Events</span>
                  <span className="font-cyber text-sm gradient-text">{events.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs font-inter flex items-center gap-1.5"><Users className="w-3 h-3" /> Players</span>
                  <span className="font-cyber text-sm gradient-text">{totalParticipants}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs font-inter flex items-center gap-1.5"><Flag className="w-3 h-3" /> Solves</span>
                  <span className="font-cyber text-sm gradient-text">{totalSolves}</span>
                </div>
              </div>
            </div>

            {/* Top 3 players mini board */}
            {overallLeaderboard.length > 0 && (
              <div className="feature-card p-4 rounded-sm">
                <p className="font-cyber text-xs text-white/30 tracking-widest mb-3 flex items-center gap-2"><Crown className="w-3.5 h-3.5" /> TOP PLAYERS</p>
                <div className="space-y-2">
                  {overallLeaderboard.slice(0, 3).map((entry, i) => (
                    <div key={entry.id} className="flex items-center gap-2">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-sm text-xs font-cyber ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : 'bg-gradient-to-br from-amber-700 to-amber-900 text-white'}`}>{i + 1}</span>
                      <span className="text-white/60 text-xs font-inter truncate flex-1">{entry.participant_name}</span>
                      <span className="font-cyber text-xs gradient-text">{entry.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {fullPageOpen && detailsEvent ? (
            /* ---- FULL-PAGE EVENT VIEW (Info / Challenges / Rankings / Players) ---- */
            <div className="max-w-4xl mx-auto fade-in">
              <button onClick={() => setFullPageOpen(false)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-cyber tracking-wide mb-6">
                <ArrowRight className="w-4 h-4 rotate-180" /> BACK TO ARENA
              </button>

              <div className="flex items-start justify-between mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-cyber text-xs text-white tracking-wider" style={{ background: `linear-gradient(135deg, ${detailsEvent.banner_color || '#3b82f6'}, ${detailsEvent.banner_color || '#3b82f6'}99)` }}>
                      {(() => { const I = eventTypeConfig[detailsEvent.event_type]?.icon || Trophy; return <I className="w-3 h-3" />; })()}
                      {detailsEvent.event_type.toUpperCase()}
                    </span>
                    <span className={`font-cyber text-xs px-2 py-1 border tracking-wider ${detailsEvent.status === 'live' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20' : detailsEvent.status === 'ended' ? 'border-white/10 text-white/30' : 'border-blue-600/20 text-blue-400/70 bg-blue-950/10'}`}>
                      {detailsEvent.status?.toUpperCase() || 'SCHEDULED'}
                    </span>
                    {detailsEvent.join_code && <span className="flex items-center gap-1 font-cyber text-xs px-2 py-1 border border-amber-500/30 text-amber-400 bg-amber-950/20 tracking-wider"><KeyRound className="w-3 h-3" /> PASSWORD</span>}
                  </div>
                  <h1 className="font-cyber text-xl sm:text-2xl text-white mb-2">{detailsEvent.title}</h1>
                  <p className="text-white/40 font-inter text-sm leading-relaxed">{detailsEvent.description}</p>
                </div>
                <button onClick={handleShare} className="p-2 text-white/40 hover:text-blue-400 transition-colors flex-shrink-0" title="Share">
                  {shareCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                </button>
              </div>

              {renderEventTabs('page')}

              {renderEventTabContent(detailsEvent)}
            </div>
          ) : sidebarTab === 'leaderboard' ? (
            /* ---- GLOBAL LEADERBOARD ---- */
            <div className="max-w-5xl mx-auto fade-in">
              <PageHeader label="GLOBAL RANKINGS" title="LEADERBOARD" />
              {overallLeaderboard.length === 0 ? (
                <EmptyState icon={Crown} title="NO SCORES YET" desc="Solve challenges in events to appear on the leaderboard." />
              ) : (
                <div className="space-y-2">
                  {overallLeaderboard.map((entry, i) => (
                    <div key={entry.id} className={`feature-card p-4 rounded-sm flex items-center gap-4 slide-up ${i < 3 ? 'border border-blue-500/20' : ''}`}>
                      <div className={`w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0 font-cyber ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' : i === 2 ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white' : 'bg-white/5 text-white/60'}`}>
                        {i < 3 ? <Crown className="w-5 h-5" /> : <span>{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-cyber text-sm text-white tracking-wide truncate">{entry.participant_name}</div>
                        <div className="text-white/30 text-xs font-inter">{entry.challenges_solved} challenges solved</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-cyber text-lg gradient-text">{entry.points}</div>
                        <div className="font-cyber text-xs text-white/30 tracking-wide">PTS</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : sidebarTab === 'manage' ? (
            /* ---- MANAGE ---- */
            <div className="max-w-5xl mx-auto fade-in">
              <PageHeader label="ADMIN PANEL" title="MANAGE EVENTS" />
              {!authUser ? (
                <EmptyState icon={Lock} title="SIGN IN REQUIRED" desc="Click CREATE to sign in and manage your events." action={<button onClick={openCreateForm} className="btn-primary inline-flex items-center gap-2 text-xs"><Plus className="w-4 h-4" /> CREATE EVENT</button>} />
              ) : events.length === 0 ? (
                <EmptyState icon={Calendar} title="NO EVENTS" desc="Create your first event to get started." action={<button onClick={openCreateForm} className="btn-primary inline-flex items-center gap-2 text-xs"><Plus className="w-4 h-4" /> CREATE EVENT</button>} />
              ) : (
                <div className="space-y-3">
                  {events.map(ev => {
                    const cfg = eventTypeConfig[ev.event_type] || eventTypeConfig.CTF;
                    const Icon = cfg.icon;
                    return (
                      <div key={ev.id} className="feature-card p-4 rounded-sm flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0" style={{ background: `linear-gradient(135deg, ${ev.banner_color || '#3b82f6'}, ${ev.banner_color || '#3b82f6'}99)` }}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-cyber text-sm text-white tracking-wide truncate">{ev.title}</h3>
                          <div className="flex items-center gap-3 text-white/30 text-xs font-inter mt-1 flex-wrap">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {ev.registration_count || 0}{ev.max_participants ? `/${ev.max_participants}` : ''}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.event_date}</span>
                            {ev.join_code && <span className="flex items-center gap-1 text-amber-400/60"><KeyRound className="w-3 h-3" /> PASS</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => openDetails(ev)} className="px-3 py-1.5 font-cyber text-xs text-blue-400/70 border border-blue-600/20 hover:bg-blue-600/10 transition-colors rounded-sm">VIEW</button>
                          {canEditEvent(ev) && <button onClick={() => openEditForm(ev)} className="p-2 text-white/30 hover:text-blue-400 transition-colors"><Edit3 className="w-4 h-4" /></button>}
                          {canEditEvent(ev) && <button onClick={() => { setDeleteTarget(ev); setConfirmDelete(true); }} className="p-2 text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ---- ARENA / MY EVENTS ---- */
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 gradient-bg rounded-sm flex items-center justify-center">
                    <Swords className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-cyber text-xs text-blue-400/60 tracking-widest">{sidebarTab === 'mine' ? 'YOUR CREATIONS' : 'COMPETE & LEARN'}</p>
                    <h1 className="font-cyber text-2xl sm:text-3xl text-white">{sidebarTab === 'mine' ? 'MY ' : ''}<span className="gradient-text">ARENA</span></h1>
                  </div>
                </div>
                <div className="divider-gradient w-32 opacity-50" />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: Trophy, label: sidebarTab === 'mine' ? 'MY EVENTS' : 'TOTAL EVENTS', value: sidebarTab === 'mine' ? myEvents.length : events.length },
                  { icon: Users, label: 'PLAYERS', value: totalParticipants },
                  { icon: Flag, label: 'TOTAL SOLVES', value: totalSolves },
                  { icon: Flame, label: 'LIVE NOW', value: events.filter(e => e.status === 'live').length },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="feature-card p-3 sm:p-4 rounded-sm flex items-center gap-3">
                    <div className="w-9 h-9 gradient-bg rounded-sm flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-white" /></div>
                    <div className="min-w-0">
                      <div className="font-cyber text-lg sm:text-xl gradient-text leading-none">{value}</div>
                      <div className="font-cyber text-xs text-white/40 tracking-wide mt-1 truncate">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="input-cyber pl-10" />
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 border border-red-500/30 bg-red-950/20 px-4 py-3 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm font-inter">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              )}

              {sidebarTab === 'mine' && !authUser ? (
                <EmptyState icon={Lock} title="SIGN IN REQUIRED" desc="Click CREATE to sign in and start creating events." action={<button onClick={openCreateForm} className="btn-primary inline-flex items-center gap-2 text-xs"><Plus className="w-4 h-4" /> CREATE EVENT</button>} />
              ) : loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
              ) : eventsToShow.length === 0 ? (
                <EmptyState icon={Calendar} title={search ? 'NO MATCHES' : 'NO EVENTS YET'} desc={search ? 'Try a different search.' : 'Be the first to create an event.'} action={<button onClick={openCreateForm} className="btn-primary inline-flex items-center gap-2 text-xs"><Plus className="w-4 h-4" /> CREATE EVENT</button>} />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {eventsToShow.map(ev => (
                    <motion.div
                      key={ev.id}
                      variants={reduceMotion ? { hidden: { opacity: 1 }, show: { opacity: 1 } } : { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <EventCard event={ev} onOpen={openDetails} onEdit={canEditEvent(ev) ? openEditForm : undefined} onDelete={canEditEvent(ev) ? (e) => { setDeleteTarget(e); setConfirmDelete(true); } : undefined} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ---- AUTH MODAL ---- */}
      <AnimatePresence>
      {showAuthModal && (
        <Modal onClose={() => setShowAuthModal(false)}>
          <div className="p-6 sm:p-8">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 gradient-bg flex items-center justify-center rounded-sm mx-auto mb-4">
                {authMode === 'login' ? <Lock className="w-7 h-7 text-white" /> : <Sparkles className="w-7 h-7 text-white" />}
              </div>
              <h2 className="font-cyber text-xl text-white mb-1">{authMode === 'login' ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</h2>
              <p className="text-white/40 font-inter text-sm">{authMode === 'login' ? 'Sign in to your arena account' : 'Join the arena for free'}</p>
            </div>
            {authError && <div className="mb-4 border border-red-500/30 bg-red-950/20 px-4 py-3 rounded-sm"><p className="text-red-400 text-xs font-inter">{authError}</p></div>}
            <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
              {authMode === 'signup' && (
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="text" required placeholder="Display name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} className="input-cyber pl-10" />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" required placeholder="Email address" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} className="input-cyber pl-10" />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type={showPw ? 'text' : 'password'} required placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} className="input-cyber pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authMode === 'signup' && (
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type={showPw ? 'text' : 'password'} required placeholder="Confirm password" value={authForm.confirm} onChange={(e) => setAuthForm({ ...authForm, confirm: e.target.value })} className="input-cyber pl-10" />
                </div>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2 text-xs disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? <LogIn className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />)}
                {busy ? 'PLEASE WAIT...' : authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </form>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 font-inter text-xs">OR</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <button onClick={handleGoogleAuth} disabled={busy} className="btn-google mb-4 disabled:opacity-50">
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              <span>{busy ? 'Connecting...' : 'Continue with Google'}</span>
            </button>
            <p className="text-center text-white/30 font-inter text-xs">
              {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); resetAuthForm(); }} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                {authMode === 'login' ? 'Register free' : 'Sign in'}
              </button>
            </p>
          </div>
        </Modal>
      )}
      </AnimatePresence>

      {/* ---- CREATE/EDIT EVENT MODAL ---- */}
      <AnimatePresence>
      {showFormModal && (
        <Modal onClose={() => setShowFormModal(false)} wide>
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-1">{formMode === 'create' ? 'NEW EVENT' : 'EDIT EVENT'} • STEP {formStep} OF 2</p>
                <h2 className="font-cyber text-xl sm:text-2xl text-white">{formStep === 1 ? 'EVENT DETAILS' : 'CHALLENGES & Q&A'}</h2>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2 mb-6">
              <div className={`flex-1 h-1 rounded-full ${formStep >= 1 ? 'gradient-bg' : 'bg-white/10'}`} />
              <div className={`flex-1 h-1 rounded-full ${formStep >= 2 ? 'gradient-bg' : 'bg-white/10'}`} />
            </div>

            {formStep === 1 ? (
              <form onSubmit={(e) => { e.preventDefault(); setFormStep(2); }} className="space-y-4">
                <Field label="EVENT NAME *">
                  <input type="text" required maxLength={100} value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="CybroatriX CTF #1" className="input-cyber" />
                </Field>
                <Field label="DESCRIPTION *">
                  <textarea required maxLength={500} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe the event..." rows={3} className="input-cyber resize-none" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="EVENT TYPE">
                    <select value={formData.event_type} onChange={(e) => setFormData({ ...formData, event_type: e.target.value })} className="input-cyber cursor-pointer">
                      {eventTypes.map(t => <option key={t} value={t} className="bg-[#0d0d12]">{t}</option>)}
                    </select>
                  </Field>
                  <Field label="STATUS">
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-cyber cursor-pointer">
                      <option value="scheduled" className="bg-[#0d0d12]">Scheduled</option>
                      <option value="live" className="bg-[#0d0d12]">Live</option>
                      <option value="ended" className="bg-[#0d0d12]">Ended</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={<span className="flex items-center justify-between"><span>DATE & TIME</span><button type="button" onClick={() => setFormData({ ...formData, event_date: formData.event_date === 'TBA' ? '' : 'TBA' })} className={`text-xs font-cyber tracking-wide ${formData.event_date === 'TBA' ? 'text-amber-400' : 'text-white/30 hover:text-white/60'}`}>{formData.event_date === 'TBA' ? 'TBA ✓' : 'Set TBA'}</button></span>}>
                    {formData.event_date === 'TBA' ? (
                      <div className="input-cyber flex items-center justify-center text-white/30 text-sm font-inter">Date to be announced</div>
                    ) : (
                      <input type="datetime-local" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} className="input-cyber cursor-text" style={{ colorScheme: 'dark' }} />
                    )}
                  </Field>
                  <Field label="LOCATION">
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Online, Discord..." className="input-cyber" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="MAX PARTICIPANTS">
                    <input type="number" min="1" value={formData.max_participants} onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })} placeholder="Unlimited" className="input-cyber" />
                  </Field>
                  <Field label={<span className="flex items-center gap-1.5"><KeyRound className="w-3 h-3 text-amber-400/60" /> PASSWORD (optional)</span>}>
                    <input type="text" value={formData.join_code} onChange={(e) => setFormData({ ...formData, join_code: e.target.value })} placeholder="Secret password to join" className="input-cyber" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={<span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-blue-400/60" /> CHALLENGES OPEN AT (optional)</span>}>
                    <input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="input-cyber cursor-text" style={{ colorScheme: 'dark' }} />
                  </Field>
                  <Field label={<span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-red-400/60" /> CHALLENGES CLOSE AT (optional)</span>}>
                    <input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="input-cyber cursor-text" style={{ colorScheme: 'dark' }} />
                  </Field>
                </div>
                <p className="text-white/25 font-inter text-xs -mt-2">Leave blank for no restriction. If set, participants can only submit flags between these times.</p>
                <Field label="BANNER COLOR">
                  <div className="flex items-center gap-2 flex-wrap">
                    {bannerColors.map(c => (
                      <button key={c} type="button" onClick={() => setFormData({ ...formData, banner_color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${formData.banner_color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </Field>
                <Field label="CREATOR NAME *">
                  <input type="text" required maxLength={50} value={formData.creator_name} onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })} placeholder="Your display name" className="input-cyber" />
                </Field>
                <div className="flex items-center gap-3 pt-2">
                  <button type="submit" className="btn-primary flex items-center gap-2 text-xs">NEXT: ADD CHALLENGES <ArrowRight className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setShowFormModal(false)} className="btn-outline text-xs">CANCEL</button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="feature-card p-4 rounded-sm">
                  <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-3 flex items-center gap-2"><Terminal className="w-3.5 h-3.5" /> ADD A CHALLENGE</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input type="text" placeholder="Challenge title *" value={challengeDraft.title} onChange={(e) => setChallengeDraft({ ...challengeDraft, title: e.target.value })} className="input-cyber" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={challengeDraft.category} onChange={(e) => setChallengeDraft({ ...challengeDraft, category: e.target.value })} className="input-cyber cursor-pointer">
                        {categories.map(c => <option key={c} value={c} className="bg-[#0d0d12]">{c}</option>)}
                      </select>
                      <select value={challengeDraft.difficulty} onChange={(e) => setChallengeDraft({ ...challengeDraft, difficulty: e.target.value })} className="input-cyber cursor-pointer">
                        {difficulties.map(d => <option key={d} value={d} className="bg-[#0d0d12]">{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input type="number" min="1" placeholder="Points" value={challengeDraft.points} onChange={(e) => setChallengeDraft({ ...challengeDraft, points: e.target.value })} className="input-cyber" />
                    <div>
                      {challengeDraft.file_url ? (
                        <div className="flex items-center gap-2 h-full px-3 py-2.5 border border-emerald-500/25 bg-emerald-950/10 rounded-sm">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <a href={challengeDraft.file_url} download={challengeDraft.file_name || 'file'} className="text-emerald-400 text-xs font-inter truncate flex-1 hover:underline">
                            {challengeDraft.file_name || 'File uploaded'}
                          </a>
                          <button type="button" onClick={() => setChallengeDraft({ ...challengeDraft, file_url: '', file_name: '' })} className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0" title="Remove file">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label className={`flex items-center justify-center gap-2 h-full min-h-[42px] px-3 py-2.5 border border-dashed border-blue-900/40 rounded-sm cursor-pointer transition-colors ${uploadingChallengeFile ? 'opacity-50 cursor-wait' : 'hover:border-blue-500/50 hover:bg-blue-950/10'}`}>
                          {uploadingChallengeFile ? (
                            <><Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" /> <span className="text-white/40 text-xs font-inter">Reading file...</span></>
                          ) : (
                            <><Upload className="w-3.5 h-3.5 text-white/30" /> <span className="text-white/30 text-xs font-inter">Attach file (max 700KB)</span></>
                          )}
                          <input
                            type="file"
                            className="hidden"
                            disabled={uploadingChallengeFile}
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleChallengeFileUpload(f); e.target.value = ''; }}
                          />
                        </label>
                      )}
                      {challengeFileError && <p className="text-red-400 text-xs font-inter mt-1">{challengeFileError}</p>}
                    </div>
                  </div>
                  <input type="text" placeholder="Description (optional)" value={challengeDraft.description} onChange={(e) => setChallengeDraft({ ...challengeDraft, description: e.target.value })} className="input-cyber mb-3" />
                  <textarea placeholder="Question / challenge prompt shown to participants *" value={challengeDraft.question} onChange={(e) => setChallengeDraft({ ...challengeDraft, question: e.target.value })} rows={3} className="input-cyber resize-none mb-3" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <input type="text" placeholder="Expected flag / answer *" value={challengeDraft.answer} onChange={(e) => setChallengeDraft({ ...challengeDraft, answer: e.target.value })} className="input-cyber" />
                    <input type="text" placeholder="Hint (optional)" value={challengeDraft.hint} onChange={(e) => setChallengeDraft({ ...challengeDraft, hint: e.target.value })} className="input-cyber" />
                  </div>
                  <button type="button" onClick={addChallengeDraft} disabled={!challengeDraft.title.trim() || !challengeDraft.question.trim() || !challengeDraft.answer.trim()} className="btn-outline flex items-center gap-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" /> ADD CHALLENGE
                  </button>
                </div>
                {challenges.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-cyber text-xs text-white/50 tracking-widest">{challenges.length} CHALLENGE{challenges.length !== 1 ? 'S' : ''} ADDED</p>
                    {challenges.map((ch, i) => (
                      <div key={ch.id} className="feature-card p-3 rounded-sm flex items-center gap-3">
                        <div className="w-8 h-8 gradient-bg flex items-center justify-center rounded-sm flex-shrink-0">
                          <span className="font-cyber text-xs text-white">{(i + 1).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-cyber text-xs text-white tracking-wide truncate">{ch.title}</div>
                          <div className="flex items-center gap-2 text-white/30 text-xs font-inter flex-wrap">
                            <span className={`px-1.5 py-0.5 border ${categoryConfig[ch.category]?.color || categoryConfig.Misc.color} rounded-sm`}>{ch.category}</span>
                            <span>{ch.points} pts</span>
                            {ch.hint && <span>• hint</span>}
                            {ch.file_url && <span>• file</span>}
                            <span className={`flex items-center gap-1 ${difficultyConfig[ch.difficulty]?.color || difficultyConfig.medium.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${difficultyConfig[ch.difficulty]?.dot || difficultyConfig.medium.dot}`} />
                              {difficultyConfig[ch.difficulty]?.label || 'Medium'}
                            </span>
                          </div>
                        </div>
                        <button type="button" onClick={() => removeChallengeDraft(ch.id)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={() => setFormStep(1)} className="btn-outline flex items-center gap-2 text-xs"><ArrowRight className="w-4 h-4 rotate-180" /> BACK</button>
                  <button type="button" onClick={handleSubmitForm} disabled={submitting} className="btn-primary flex items-center gap-2 text-xs disabled:opacity-50">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> SAVING...</> : <><Check className="w-4 h-4" /> {formMode === 'create' ? 'CREATE EVENT' : 'SAVE CHANGES'}</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      </AnimatePresence>

      {/* ---- DETAILS MODAL ---- */}
      <AnimatePresence>
      {showDetailsModal && detailsEvent && (
        <Modal onClose={() => setShowDetailsModal(false)} wide>
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-cyber text-xs text-white tracking-wider" style={{ background: `linear-gradient(135deg, ${detailsEvent.banner_color || '#3b82f6'}, ${detailsEvent.banner_color || '#3b82f6'}99)` }}>
                    {(() => { const I = eventTypeConfig[detailsEvent.event_type]?.icon || Trophy; return <I className="w-3 h-3" />; })()}
                    {detailsEvent.event_type.toUpperCase()}
                  </span>
                  <span className={`font-cyber text-xs px-2 py-1 border tracking-wider ${detailsEvent.status === 'live' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20' : detailsEvent.status === 'ended' ? 'border-white/10 text-white/30' : 'border-blue-600/20 text-blue-400/70 bg-blue-950/10'}`}>
                    {detailsEvent.status?.toUpperCase() || 'SCHEDULED'}
                  </span>
                  {detailsEvent.join_code && <span className="flex items-center gap-1 font-cyber text-xs px-2 py-1 border border-amber-500/30 text-amber-400 bg-amber-950/20 tracking-wider"><KeyRound className="w-3 h-3" /> PASSWORD</span>}
                </div>
                <h2 className="font-cyber text-xl sm:text-2xl text-white mb-2">{detailsEvent.title}</h2>
                <p className="text-white/40 font-inter text-sm leading-relaxed">{detailsEvent.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleShare} className="p-2 text-white/40 hover:text-blue-400 transition-colors" title="Share">
                  {shareCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                </button>
                <button onClick={() => setShowDetailsModal(false)} className="text-white/40 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {renderEventTabs('modal')}

            {renderEventTabContent(detailsEvent)}
          </div>
        </Modal>
      )}
      </AnimatePresence>

      {/* ---- DELETE CONFIRM ---- */}
      <AnimatePresence>
      {confirmDelete && deleteTarget && (
        <Modal onClose={() => { setConfirmDelete(false); setDeleteTarget(null); }}>
          <div className="p-6 sm:p-8 text-center">
            <div className="w-14 h-14 border border-red-500/30 bg-red-950/20 flex items-center justify-center rounded-sm mx-auto mb-5">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="font-cyber text-lg text-white mb-2">DELETE EVENT?</h2>
            <p className="font-cyber text-sm text-white mb-6">"{deleteTarget.title}"</p>
            <p className="text-white/30 font-inter text-xs mb-6">This removes all challenges, scores, and {deleteTarget.registration_count || 0} player(s). Cannot be undone.</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={handleDelete} disabled={submitting} className="btn-danger flex items-center gap-2 text-xs disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> DELETING...</> : <><Trash2 className="w-3.5 h-3.5" /> YES, DELETE</>}
              </button>
              <button onClick={() => { setConfirmDelete(false); setDeleteTarget(null); }} className="btn-outline text-xs">CANCEL</button>
            </div>
          </div>
        </Modal>
      )}
      </AnimatePresence>

      {/* Floating create */}
      <button onClick={openCreateForm} className="fixed bottom-6 right-6 z-30 w-12 h-12 sm:w-14 sm:h-14 gradient-bg flex items-center justify-center rounded-full shadow-lg shadow-blue-500/30 hover:scale-110 transition-transform blue-glow-box-hover" aria-label="Create event">
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>
    </div>
  );
}

function EventCard({ event, onOpen, onEdit, onDelete }: {
  event: EventRow; onOpen: (ev: EventRow) => void; onEdit?: (ev: EventRow) => void; onDelete?: (ev: EventRow) => void;
}) {
  const cfg = eventTypeConfig[event.event_type] || eventTypeConfig.CTF;
  const Icon = cfg.icon;
  const isFull = event.max_participants !== null && (event.registration_count || 0) >= event.max_participants;
  const accent = event.banner_color || '#3b82f6';
  return (
    <div className="feature-card rounded-sm overflow-hidden flex flex-col group cursor-pointer slide-up" onClick={() => onOpen(event)}>
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-sm flex-shrink-0" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}99)` }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            {isFull && <span className="font-cyber text-xs px-2 py-0.5 border border-orange-500/30 text-orange-400 bg-orange-950/20 tracking-wider">FULL</span>}
            {event.status === 'live' && <span className="flex items-center gap-1 font-cyber text-xs px-2 py-0.5 border border-emerald-500/30 text-emerald-400 bg-emerald-950/20 tracking-wider"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />LIVE</span>}
          </div>
        </div>
        <h3 className="font-cyber text-sm sm:text-base text-white mb-2 tracking-wide line-clamp-1">{event.title}</h3>
        <p className="text-white/40 text-sm font-inter leading-relaxed mb-4 flex-1 line-clamp-2">{event.description}</p>
        <div className="flex items-center gap-3 text-white/30 text-xs font-inter mb-4 flex-wrap">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.event_date}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
          {event.join_code && <span className="flex items-center gap-1 text-amber-400/60"><KeyRound className="w-3 h-3" /> PASS</span>}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-blue-900/15">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400/60" />
            <span className="font-cyber text-xs text-white/50 tracking-wide">{event.registration_count || 0}{event.max_participants ? `/${event.max_participants}` : ''} PLAYERS</span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {onEdit && <button onClick={() => onEdit(event)} className="p-1.5 text-white/20 hover:text-blue-400 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>}
              {onDelete && <button onClick={() => onDelete(event)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-8">
      <p className="font-cyber text-xs text-blue-400/60 tracking-widest mb-2">{label}</p>
      <h1 className="font-cyber text-2xl sm:text-3xl text-white mb-2"><span className="gradient-text">{title}</span></h1>
      <div className="divider-gradient w-32 opacity-50" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, action }: { icon: typeof Trophy; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 border border-blue-900/30 flex items-center justify-center rounded-sm mx-auto mb-4">
        <Icon className="w-7 h-7 text-white/20" />
      </div>
      <h3 className="font-cyber text-lg text-white/60 mb-2">{title}</h3>
      <p className="text-white/30 font-inter text-sm mb-6">{desc}</p>
      {action}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="feature-card p-3 rounded-sm flex items-center gap-3">
      <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
      <div className="min-w-0">
        <div className="font-cyber text-xs text-white/40 tracking-wide">{label}</div>
        <div className="text-white/70 text-sm font-inter truncate">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-cyber text-xs text-white/50 tracking-wider mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.1 : 0.2 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" style={{ zIndex: -1 }} onClick={onClose} />
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`relative ${wide ? 'max-w-2xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-y-auto bg-[#0d0d12] border border-blue-900/30 rounded-sm shadow-2xl shadow-black/50`}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}