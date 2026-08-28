import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onDisconnect, set, onValue, serverTimestamp, push, get, update, remove } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile,
  sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode,
  sendEmailVerification, updatePassword, deleteUser,
  reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider,
  setPersistence, browserLocalPersistence,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    'Missing Firebase config. Copy .env.example to .env and fill in your Firebase project values.'
  );
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const firestoreDb = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Keep users signed in across browser restarts (this is actually the SDK's
// default in a browser context already — set explicitly so it isn't left
// to an implicit default).
void setPersistence(auth, browserLocalPersistence);

export function trackUserPresence(user: User | null) {
  if (!user) return;
  const presenceRef = ref(db, 'presence/' + user.uid);
  const isOnlineRef = ref(db, '.info/connected');
  onValue(isOnlineRef, (snapshot) => {
    if (snapshot.val() === true) {
      set(presenceRef, {
        online: true,
        displayName: user.displayName || 'User',
        email: user.email || null,
        lastSeen: serverTimestamp(),
      });
      onDisconnect(presenceRef).remove();
    }
  });
}

export function subscribeToLiveCount(callback: (count: number) => void) {
  const presenceRef = ref(db, 'presence');
  return onValue(presenceRef, (snapshot) => {
    const data = snapshot.val();
    callback(data ? Object.keys(data).length : 0);
  });
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: displayName.trim() || 'User' });
  return credential;
}

export { onAuthStateChanged };
export type { User };

/* ---------------------------------------------------------------------
 * Account management
 * Password reset, email verification, password change, re-authentication,
 * and account deletion. Layered on top of the Google/email sign-in above.
 * ------------------------------------------------------------------- */

export async function sendResetPasswordEmail(email: string): Promise<void> {
  // handleCodeInApp + url send the user straight to our own /reset-password
  // page (with ?mode=resetPassword&oobCode=... attached) instead of
  // Firebase's generic hosted reset page.
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  });
}

/** Validates a password-reset action code and returns the email it belongs
 * to, or throws (expired/invalid) — used by the Reset Password page before
 * showing the "choose a new password" form. */
export async function verifyResetCode(oobCode: string): Promise<string> {
  return verifyPasswordResetCode(auth, oobCode);
}

export async function completePasswordReset(oobCode: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(auth, oobCode, newPassword);
}

export async function sendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export function isGoogleUser(user: User | null): boolean {
  return !!user && user.providerData.some((p) => p.providerId === 'google.com');
}

export function isPasswordUser(user: User | null): boolean {
  return !!user && user.providerData.some((p) => p.providerId === 'password');
}

/** Re-authenticates with just the current password, without changing it —
 * used before sensitive actions like account deletion. */
export async function reauthenticateWithPassword(currentPassword: string): Promise<void> {
  const current = auth.currentUser;
  if (!current || !current.email) {
    throw new Error('You must be signed in with an email and password to do this.');
  }
  const credential = EmailAuthProvider.credential(current.email, currentPassword);
  await reauthenticateWithCredential(current, credential);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await reauthenticateWithPassword(currentPassword);
  const current = auth.currentUser;
  if (!current) throw new Error('Not signed in.');
  await updatePassword(current, newPassword);
}

/** Re-authenticates a Google-signed-in user via a fresh popup — needed
 * before sensitive actions (like account deletion) for accounts that have
 * no password to verify with. */
export async function reauthenticateWithGoogle(): Promise<void> {
  const current = auth.currentUser;
  if (!current) throw new Error('Not signed in.');
  await reauthenticateWithPopup(current, googleProvider);
}

export async function deleteFirebaseAccount(user: User): Promise<void> {
  await deleteUser(user);
}

/* ---------------------------------------------------------------------
 * Generic Realtime Database helpers
 * Used by pages (e.g. Events.tsx) to store structured data such as
 * events, challenges, registrations, and leaderboard entries.
 * ------------------------------------------------------------------- */

/** Fetch all children at a path as an array of { id, ...data } */
export async function dbList<T = Record<string, unknown>>(path: string): Promise<(T & { id: string })[]> {
  const snap = await get(ref(db, path));
  const val = snap.val();
  if (!val) return [];
  return Object.entries(val).map(([id, data]) => ({ id, ...(data as object) })) as (T & { id: string })[];
}

/** Fetch the raw value at a path (object, or null if it doesn't exist) */
export async function dbGet<T = Record<string, unknown>>(path: string): Promise<T | null> {
  const snap = await get(ref(db, path));
  return snap.exists() ? (snap.val() as T) : null;
}

/** Push a new child under a path, stamping its generated key as `id`. Returns the new key. */
export async function dbPush(path: string, data: Record<string, unknown>): Promise<string> {
  const newRef = push(ref(db, path));
  const id = newRef.key as string;
  await set(newRef, { ...data, id });
  return id;
}

/** Overwrite the value at a path entirely */
export async function dbSet(path: string, data: unknown): Promise<void> {
  await set(ref(db, path), data);
}

/** Merge/patch fields at a path without overwriting siblings */
export async function dbUpdate(path: string, data: Record<string, unknown>): Promise<void> {
  await update(ref(db, path), data);
}

/** Delete the value (and all children) at a path */
export async function dbRemove(path: string): Promise<void> {
  await remove(ref(db, path));
}