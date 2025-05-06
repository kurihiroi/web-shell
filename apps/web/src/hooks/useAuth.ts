import type { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import {
  getAuthRedirectResult,
  getCurrentUser,
  logOut,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  subscribeToAuthChanges,
} from '../firebase/auth';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
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
  const signInWithGoogleRedirectImpl = useCallback(async () => {
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
  }, []);

  // ポップアップ認証を使用
  const signInWithGooglePopupImpl = useCallback(async () => {
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
  }, []);

  // Sign out
  const logout = useCallback(async () => {
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
  }, []);

  return {
    currentUser,
    user: currentUser, // userをcurrentUserのエイリアスとして追加
    loading,
    error,
    signInWithGoogleRedirect: signInWithGoogleRedirectImpl,
    signInWithGooglePopup: signInWithGooglePopupImpl,
    logout,
  };
}
