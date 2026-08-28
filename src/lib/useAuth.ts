import { createContext, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { UserProfile } from './profile';

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  /** The signed-in user's Firestore profile document, or null if they
   * haven't finished username setup yet (or aren't signed in). */
  profile: UserProfile | null;
  /** True while the profile subscription's first snapshot is pending.
   * Distinct from `loading` (which only covers Firebase Auth resolving). */
  profileLoading: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  profileLoading: true,
  signInGoogle: async () => {},
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
