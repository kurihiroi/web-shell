import type { User } from 'firebase/auth';
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import {
  getAuthRedirectResult,
  logOut,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  subscribeToAuthChanges,
} from '../firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  user: User | null; // エイリアスとしてuserも追加
  loading: boolean;
  error: Error | null;
  signInWithGoogleRedirect: () => Promise<void>;
  signInWithGooglePopup: () => Promise<void>;
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
      console.log('###subscribeToAuthChanges', user);
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // リダイレクト認証を使用
  const signInWithGoogleRedirectImpl = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogleRedirect();
      // リダイレクト認証の場合は結果はnullとなり、リダイレクト後に処理される
    } catch (error) {
      setError(error as Error);
      setLoading(false);
      throw error;
    }
  };

  // ポップアップ認証を使用
  const signInWithGooglePopupImpl = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGooglePopup();
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
    user: currentUser, // userをcurrentUserのエイリアスとして追加
    loading,
    error,
    signInWithGoogleRedirect: signInWithGoogleRedirectImpl,
    signInWithGooglePopup: signInWithGooglePopupImpl,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
