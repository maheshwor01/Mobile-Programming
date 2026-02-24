import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { getFirebaseAuth } from '@/lib/firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const auth = getFirebaseAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  async function signIn(email: string, password: string) {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setAuthError(getFriendlyAuthError(message));
      throw e;
    }
  }

  async function signUp(email: string, password: string) {
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      setAuthError(getFriendlyAuthError(message));
      throw e;
    }
  }

  async function signOut() {
    setAuthError(null);
    await firebaseSignOut(auth);
  }

  function clearAuthError() {
    setAuthError(null);
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    authError,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getFriendlyAuthError(message: string): string {
  if (message.includes('auth/invalid-email')) return 'Invalid email address.';
  if (message.includes('auth/user-disabled')) return 'This account has been disabled.';
  if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password'))
    return 'Invalid email or password.';
  if (message.includes('auth/email-already-in-use')) return 'This email is already registered.';
  if (message.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (message.includes('auth/too-many-requests')) return 'Too many attempts. Try again later.';
  if (message.includes('auth/network-request-failed')) return 'Network error. Check your connection.';
  return message;
}
