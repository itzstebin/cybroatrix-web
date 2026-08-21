import { useEffect, useState, ReactNode } from 'react';
import {
  auth, onAuthStateChanged, trackUserPresence, signInWithGoogle, signOutUser,
  signInWithEmail, registerWithEmail,
} from '../lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) trackUserPresence(u);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInGoogle: async () => { await signInWithGoogle(); },
      signInEmail: async (email, password) => { await signInWithEmail(email, password); },
      signUpEmail: async (email, password, displayName) => { await registerWithEmail(email, password, displayName); },
      signOut: async () => { await signOutUser(); },
    }}>
      {children}
    </AuthContext.Provider>
  );
}
