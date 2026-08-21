import { createContext, useContext } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInGoogle: async () => {},
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
