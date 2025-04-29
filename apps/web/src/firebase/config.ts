import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'test-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'test-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abc123def456',
};

// 環境変数の状態をログに出力（開発環境・本番環境両方で）
console.group('⚙️ Firebase Environment Variables Status:');
const envVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

for (const key of envVars) {
  const value = import.meta.env[key];
  const status = value ? '✅ Set' : '❌ Missing';
  const displayValue =
    key === 'VITE_FIREBASE_API_KEY' && value ? `${value.substring(0, 5)}...` : value;
  console.log(`${key}: ${status}${value ? ` (${displayValue})` : ''}`);
}
console.groupEnd();

// Firebase設定とアプリケーション環境の情報をログ出力
console.log('🔥 Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : undefined,
});

console.log(
  '🌐 Environment:',
  import.meta.env.MODE,
  import.meta.env.PROD ? '(production)' : '(development)'
);
console.log('🔄 Current URL:', window.location.href);

// 不足している設定項目をチェック
const missingVars = envVars.filter((key) => !import.meta.env[key]);
if (missingVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
  console.warn('💡 Create a .env.local file in the apps/web directory with the required variables');
}

// CI環境かどうかを判断（process.env.NODE_ENV === 'test'またはCIフラグがある場合）
const isCI =
  import.meta.env.MODE === 'test' ||
  (typeof process !== 'undefined' && process.env && process.env.CI);

// Initialize Firebase
let app = null;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  if (!isCI) {
    throw error;
  }
  console.warn('Continuing despite Firebase initialization error in CI environment');
}

export const auth = app ? getAuth(app) : null;

// Firestoreを初期化（web-shellデータベースを指定）
export const db = app ? getFirestore(app, 'web-shell') : null;

// ローカル環境では Firebase Emulator に接続する
// if (import.meta.env.DEV && db) {
//   try {
//     // Firestore emulator は通常 8080 ポートで実行される
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     console.log('🔥 Connected to Firestore emulator on localhost:8080');
//   } catch (error) {
//     console.warn('⚠️ Failed to connect to Firestore emulator:', error);
//   }
// } else if (db) {
//   console.log('🔥 Using Firestore with web-shell path prefix for database');
// } else {
//   console.warn('⚠️ Firestore is not initialized. Some functionality may be limited.');
// }

export default app;
