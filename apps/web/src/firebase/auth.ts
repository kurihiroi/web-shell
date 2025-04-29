import {
  type Auth,
  GoogleAuthProvider,
  type User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { auth } from './config';

// 認証が初期化されていない場合のダミー実装
// FirebaseAppやSettingsなどの型は非公開なので、as unknownでキャストして回避
// FirebaseのAuth型に必要な完全な型定義をモックするのは困難なため、
// ダミーオブジェクトとして必要最低限のプロパティと関数を実装する
const dummyAuth = {
  // 必須プロパティ
  currentUser: null,

  // 必須メソッド
  setPersistence: () => Promise.resolve(),
  onAuthStateChanged: () => () => {},
  beforeAuthStateChanged: () => () => {},
  onIdTokenChanged: () => () => {},
  signOut: () => Promise.resolve(),

  // 他のプロパティとメソッド
  app: null as unknown as object,
  name: '',
  config: {
    apiKey: 'dummy-api-key',
    apiHost: 'dummy-api-host',
    apiScheme: 'https',
    tokenApiHost: 'dummy-token-api-host',
    sdkClientVersion: 'dummy-sdk-client-version',
  },
  languageCode: null,
  tenantId: null,
  settings: {
    appVerificationDisabledForTesting: false,
  },
  _canInitEmulator: true,
  _updateCurrentUser: async () => {},
  _onStorageEvent: () => {},
  _notifyListenersIfCurrent: () => {},
  _persistenceKeyChanged: () => {},
  _key: '',
  _startProactiveRefresh: () => {},
  _stopProactiveRefresh: () => {},
  _getPersistence: () => Promise.resolve([] as unknown as string[]),
  _initializeRedirectPersistenceManager: () => Promise.resolve(),
  _popupRedirectResolver: null,
  _errorFactory: {} as unknown as object,
  _isInitialized: false,
  _initializationPromise: null,
  _projectConfig: {} as unknown as object,
  _tokenObservers: [] as unknown as object[],
  _frameworks: [] as unknown as object[],
} as unknown as Auth;

// Google認証プロバイダーの作成
const googleProvider = new GoogleAuthProvider();

// リダイレクト認証を使用
export const signInWithGoogleRedirect = async () => {
  try {
    console.log('Using redirect authentication');
    if (!auth) {
      console.warn('Auth is not initialized, skipping sign in');
      return;
    }
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
    if (!auth) {
      console.warn('Auth is not initialized, skipping sign in');
      return null;
    }
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Google popup sign-in error:', error);
    throw error;
  }
};

// リダイレクト結果の取得
export const getAuthRedirectResult = async () => {
  try {
    if (!auth) {
      console.warn('Auth is not initialized, skipping redirect result');
      return null;
    }
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
    if (!auth) {
      console.warn('Auth is not initialized, skipping sign out');
      return;
    }
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// 認証状態変更リスナーの設定
export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.warn('Auth is not initialized, cannot subscribe to auth changes');
    // ダミーのunsubscribe関数を返す
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// 現在のユーザーを取得
export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

// ユーザーがログインしているかどうかを確認
export const isUserLoggedIn = (): boolean => {
  return !!auth?.currentUser;
};

// Authインスタンスを取得
export const getAuth = (): Auth => {
  return auth || dummyAuth;
};
