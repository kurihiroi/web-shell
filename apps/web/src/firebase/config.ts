import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
  const displayValue = key === 'VITE_FIREBASE_API_KEY' && value 
    ? `${value.substring(0, 5)}...` 
    : value;
  console.log(`${key}: ${status}${value ? ` (${displayValue})` : ''}`);
}
console.groupEnd();

// Firebase設定とアプリケーション環境の情報をログ出力
console.log('🔥 Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : undefined,
});

console.log('🌐 Environment:', import.meta.env.MODE, import.meta.env.PROD ? '(production)' : '(development)');
console.log('🔄 Current URL:', window.location.href);

// 不足している設定項目をチェック
const missingVars = envVars.filter(key => !import.meta.env[key]);
if (missingVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
  console.warn('💡 Create a .env.local file in the apps/web directory with the required variables');
}

// Initialize Firebase
let app = null;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

export const auth = getAuth(app);
export default app;