import { 
  GoogleAuthProvider, 
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth';
import { auth } from './config';

// Google認証プロバイダーの作成
const googleProvider = new GoogleAuthProvider();

// リダイレクト認証を使用
export const signInWithGoogleRedirect = async () => {
  try {
    console.log('Using redirect authentication');
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Google redirect sign-in error:', error);
    throw error;
  }
};

// ポップアップ認証を使用
export const signInWithGooglePopup = async () => {
  try {
    console.log('Using popup authentication');
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Google popup sign-in error:', error);
    throw error;
  }
};

// リダイレクト結果の取得
export const getAuthRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    return result;
  } catch (error) {
    console.error('Error getting redirect result:', error);
    throw error;
  }
};

// サインアウト
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// 認証状態変更リスナーの設定
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

// 現在のユーザーを取得
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// ユーザーがログインしているかどうかを確認
export const isUserLoggedIn = (): boolean => {
  return !!auth.currentUser;
};

// Authインスタンスを取得
export const getAuth = (): Auth => {
  return auth;
};