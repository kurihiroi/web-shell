import { useState, useEffect, useCallback } from 'react';
import type { ReactElement } from 'react';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import '../../firebase/config';

interface AuthDebugProps {
  className?: string;
}

export default function AuthDebug({ className = '' }: AuthDebugProps): ReactElement {
  const { currentUser, error } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [configDetails, setConfigDetails] = useState<string>('');

  // ログを追加する関数
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`]);
  }, []);

  // Firebase設定をチェック
  useEffect(() => {
    // 環境変数の状態を表示用に準備
    const envVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];
    
    const envStatus = envVars.map(key => {
      const value = import.meta.env[key];
      return {
        key,
        set: !!value,
        value: key === 'VITE_FIREBASE_API_KEY' && value ? `${value.slice(0, 5)}...` : value
      };
    });
    
    const configInfo = {
      title: 'Environment Variables Status:',
      variables: envStatus
    };
    
    setConfigDetails(JSON.stringify(configInfo, null, 2));
    
    // 現在のホスト情報をログに追加
    addLog(`Current host: ${window.location.hostname}`);
    addLog(`Auth domain: ${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}`);
    
    // マッチングをチェック
    const currentDomain = window.location.hostname;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.split('.')[0] || '';
    
    if (currentDomain === 'localhost') {
      addLog('Running on localhost - should use redirect auth');
    } else {
      const currentDomainBase = currentDomain.split('.')[0];
      if (currentDomainBase === authDomain) {
        addLog('Domain matches Auth domain - should use redirect auth');
      } else {
        addLog('Domain does NOT match Auth domain - should use popup auth');
      }
    }
    
    // 認証インスタンスをチェック
    try {
      getAuth(); // 認証インスタンスを取得（結果は使用しない）
      addLog('Auth instance created successfully');
    } catch (e) {
      addLog(`Error creating auth instance: ${e}`);
    }
  }, [addLog]); // addLog関数を依存配列に追加

  // 直接ポップアップサインインをテスト
  const testPopupSignIn = async () => {
    try {
      addLog('Testing popup sign in...');
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      addLog('Calling signInWithPopup...');
      const result = await signInWithPopup(auth, provider);
      addLog(`Popup sign in success: User ${result.user.displayName || result.user.email}`);
    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog(`Popup sign in error: ${errorMessage}`);
      console.error('Popup sign in error:', error);
    }
  };

  // 直接リダイレクトサインインをテスト
  const testRedirectSignIn = async () => {
    try {
      addLog('Testing redirect sign in...');
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      
      addLog('Calling signInWithRedirect...');
      await signInWithRedirect(auth, provider);
      // リダイレクト後はこの先の処理は実行されない
    } catch (error) {
      const errorMessage = (error as Error).message;
      addLog(`Redirect sign in error: ${errorMessage}`);
      console.error('Redirect sign in error:', error);
    }
  };

  // ログをクリア
  const clearLogs = () => setLogs([]);

  return (
    <div className={`auth-debug ${className}`}>
      <h3>Firebase Auth Debug</h3>
      
      <div className="debug-section">
        <h4>Environment Config</h4>
        <pre>{configDetails}</pre>
      </div>
      
      <div className="debug-section">
        <h4>User State</h4>
        <p>
          {currentUser ? (
            <>
              Signed in as: <strong>{currentUser.displayName || currentUser.email}</strong>
            </>
          ) : (
            'Not signed in'
          )}
        </p>
        {error && (
          <p className="error-message">
            Error: {error.message}
          </p>
        )}
      </div>
      
      <div className="debug-actions">
        <h4>Debug Actions</h4>
        <div className="button-group">
          <button 
            type="button" 
            onClick={testPopupSignIn} 
            className="debug-button popup-button"
          >
            Test Popup Sign In
          </button>
          <button 
            type="button" 
            onClick={testRedirectSignIn} 
            className="debug-button redirect-button"
          >
            Test Redirect Sign In
          </button>
          <button 
            type="button" 
            onClick={clearLogs} 
            className="debug-button clear-button"
          >
            Clear Logs
          </button>
        </div>
      </div>
      
      <div className="debug-logs">
        <h4>Debug Logs</h4>
        <ul>
          {logs.map((log) => (
            <li key={`log-${log}`}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}