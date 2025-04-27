import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  subscribeToAuthChanges,
  signInWithGoogle,
  signInWithGoogleRedirectExplicitly,
  signInWithGooglePopupExplicitly,
  logOut,
  getAuthRedirectResult
} from '../firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: Error | null;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
  signInWithGoogleAuto: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Handle redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getAuthRedirectResult();
        if (result?.user) {
          setCurrentUser(result.user);
        }
      } catch (error) {
        setError(error as Error);
        console.error('Redirect sign-in error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRedirectResult();
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      console.log('###subscribeToAuthChanges', user)
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 環境に応じて自動的に認証方法を選択
  const signInWithGoogleAuto = async () => {
    setLoading(true);
    setError(null);
    try {
      // signInWithGoogle関数は環境に応じてリダイレクトかポップアップを使用
      const result = await signInWithGoogle();
      // ポップアップ認証の場合は結果が直接返される
      if (result?.user) {
        setCurrentUser(result.user);
        setLoading(false);
      }
      // リダイレクト認証の場合は結果はnullとなり、リダイレクト後に処理される
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  };

  // 明示的にリダイレクト認証を使用
  const signInWithGoogleRedirect = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogleRedirectExplicitly();
      // リダイレクト認証の場合は結果はnullとなり、リダイレクト後に処理される
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  };

  // 明示的にポップアップ認証を使用
  const signInWithGooglePopup = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGooglePopupExplicitly();
      if (result?.user) {
        setCurrentUser(result.user);
      }
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await logOut();
      setCurrentUser(null);
    } catch (error) {
      setError(error as Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    signInWithGoogleRedirect,
    signInWithGooglePopup,
    signInWithGoogleAuto,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
