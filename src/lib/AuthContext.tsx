import { useEffect, useState, ReactNode } from 'react';
import {
  auth, onAuthStateChanged, trackUserPresence, signInWithGoogle, signOutUser,
  signInWithEmail, registerWithEmail,
} from '../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { AuthContext } from './useAuth';
import { subscribeToUserProfile, touchLastLogin, type UserProfile } from './profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        trackUserPresence(u);
        void touchLastLogin(u.uid);
      }
    });
    return () => unsub();
  }, []);

  // Live-subscribe to the signed-in user's own profile document, so saves
  // made in Settings/Profile Edit reflect immediately everywhere (navbar
  // avatar, dashboard, etc.) without a manual refetch.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const unsub = subscribeToUserProfile(user.uid, (p) => {
      setProfile(p);
      setProfileLoading(false);
    });
    return () => unsub();
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      profile,
      profileLoading,
      signInGoogle: async () => { await signInWithGoogle(); },
      signInEmail: async (email, password) => { await signInWithEmail(email, password); },
      signUpEmail: async (email, password, displayName) => { await registerWithEmail(email, password, displayName); },
      signOut: async () => { await signOutUser(); },
    }}>
      {children}
    </AuthContext.Provider>
  );
}
