import {
  doc, getDoc, updateDoc, runTransaction, writeBatch,
  onSnapshot, serverTimestamp, Timestamp, type Unsubscribe,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { firestoreDb } from './firebase';
import { sanitizeUsername, validateUsernameFormat } from './username';

export type ProfileVisibility = 'public' | 'private';

export interface ProjectEntry {
  id: string;
  title: string;
  description: string;
  url?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description: string;
  date?: string;
}

export interface BadgeEntry {
  id: string;
  label: string;
  description?: string;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  location: string;
  website: string;
  github: string;
  linkedin: string;
  twitter: string;
  skills: string[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  badges: BadgeEntry[];
  profileVisibility: ProfileVisibility;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
}

/** Fields a user is allowed to edit directly via updateUserProfile.
 * Notably excludes uid/username (username changes go through
 * changeUsername, which has to touch the usernames/ collection too) and
 * the server-managed timestamps. */
export type ProfileEditableFields = Partial<
  Pick<
    UserProfile,
    | 'displayName' | 'photoURL' | 'bio' | 'location' | 'website' | 'github'
    | 'linkedin' | 'twitter' | 'skills' | 'projects' | 'achievements'
    | 'badges' | 'profileVisibility'
  >
>;

export class UsernameTakenError extends Error {
  constructor() {
    super('That username is already taken.');
    this.name = 'UsernameTakenError';
  }
}

function usernameDocRef(username: string) {
  return doc(firestoreDb, 'usernames', username);
}

function userDocRef(uid: string) {
  return doc(firestoreDb, 'users', uid);
}

/** Best-effort availability check for live "as you type" UI feedback. This
 * is NOT the source of truth — createUserProfile/changeUsername re-check
 * inside a transaction at write time to close the race window, and
 * Firestore security rules enforce it server-side regardless of what the
 * client believes. */
export async function isUsernameAvailable(rawUsername: string): Promise<boolean> {
  const username = sanitizeUsername(rawUsername);
  if (!validateUsernameFormat(username).valid) return false;
  const snap = await getDoc(usernameDocRef(username));
  return !snap.exists();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function getProfileByUsername(rawUsername: string): Promise<UserProfile | null> {
  const username = sanitizeUsername(rawUsername);
  if (!validateUsernameFormat(username).valid) return null;
  const usernameSnap = await getDoc(usernameDocRef(username));
  if (!usernameSnap.exists()) return null;
  const { uid } = usernameSnap.data() as { uid: string };
  return getUserProfile(uid);
}

/** Live-subscribes to the signed-in user's own profile doc so the rest of
 * the app (navbar avatar, dashboard, etc.) updates the moment a save
 * completes, without a manual refetch. Public profile views use the
 * one-shot getProfileByUsername instead. */
export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(
    userDocRef(uid),
    (snap) => onChange(snap.exists() ? (snap.data() as UserProfile) : null),
    () => onChange(null)
  );
}

interface CreateProfileInput {
  username: string;
  displayName: string;
}

/** Creates the Firestore profile for a brand-new user and atomically claims
 * their username, via a transaction so two people can never win the same
 * name even if they submit at the same instant. */
export async function createUserProfile(
  user: FirebaseUser,
  { username, displayName }: CreateProfileInput
): Promise<UserProfile> {
  const clean = sanitizeUsername(username);
  const validation = validateUsernameFormat(clean);
  if (!validation.valid) throw new Error(validation.error);

  const usernameRef = usernameDocRef(clean);
  const userRef = userDocRef(user.uid);

  await runTransaction(firestoreDb, async (tx) => {
    const usernameSnap = await tx.get(usernameRef);
    if (usernameSnap.exists()) throw new UsernameTakenError();

    tx.set(usernameRef, { uid: user.uid, createdAt: serverTimestamp() });
    tx.set(userRef, {
      uid: user.uid,
      username: clean,
      displayName: displayName.trim() || user.displayName || 'User',
      email: user.email ?? '',
      photoURL: user.photoURL ?? null,
      bio: '',
      location: '',
      website: '',
      github: '',
      linkedin: '',
      twitter: '',
      skills: [],
      projects: [],
      achievements: [],
      badges: [],
      profileVisibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  });

  const created = await getUserProfile(user.uid);
  if (!created) throw new Error('Profile creation failed. Please try again.');
  return created;
}

export async function updateUserProfile(uid: string, data: ProfileEditableFields): Promise<void> {
  await updateDoc(userDocRef(uid), { ...data, updatedAt: serverTimestamp() });
}

/** Atomically moves a user from their current username to a new one:
 * claims the new usernames/ doc, releases the old one, and updates the
 * users/ doc — all inside one transaction so the two collections never
 * drift out of sync, and so a duplicate claim mid-flight is impossible. */
export async function changeUsername(user: FirebaseUser, newRawUsername: string): Promise<string> {
  const clean = sanitizeUsername(newRawUsername);
  const validation = validateUsernameFormat(clean);
  if (!validation.valid) throw new Error(validation.error);

  const userRef = userDocRef(user.uid);
  const newUsernameRef = usernameDocRef(clean);

  await runTransaction(firestoreDb, async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists()) throw new Error('Profile not found.');
    const currentUsername = (userSnap.data() as UserProfile).username;
    if (currentUsername === clean) return;

    const newSnap = await tx.get(newUsernameRef);
    if (newSnap.exists()) throw new UsernameTakenError();

    tx.set(newUsernameRef, { uid: user.uid, createdAt: serverTimestamp() });
    if (currentUsername) {
      tx.delete(usernameDocRef(currentUsername));
    }
    tx.update(userRef, { username: clean, updatedAt: serverTimestamp() });
  });

  return clean;
}

export async function touchLastLogin(uid: string): Promise<void> {
  try {
    await updateDoc(userDocRef(uid), { lastLoginAt: serverTimestamp() });
  } catch {
    // Best-effort — never block sign-in on this (e.g. user offline).
  }
}

/** Deletes both Firestore records for an account: the profile doc and its
 * username claim. Called as part of full account deletion (see Settings'
 * Danger Zone), after the Firebase Auth user itself is deleted. */
export async function deleteUserProfileData(uid: string, username: string): Promise<void> {
  const batch = writeBatch(firestoreDb);
  batch.delete(userDocRef(uid));
  if (username) batch.delete(usernameDocRef(username));
  await batch.commit();
}
