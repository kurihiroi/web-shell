import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useAuth } from '../../context/AuthContext';

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

export default function GoogleSignInButton({
  text = 'Sign in with Google',
  className = '',
}: GoogleSignInButtonProps): ReactElement {
  const { signInWithGoogleRedirect, signInWithGooglePopup, loading } = useAuth();
  const [envStatus, setEnvStatus] = useState<{ isSet: boolean; message: string }>({
    isSet: false,
    message: 'Checking environment...'
  });

  // 環境変数の状態をチェック
  useEffect(() => {
    const authDomainValue = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const isAuthDomainSet = !!authDomainValue;
    
    setEnvStatus({
      isSet: isAuthDomainSet,
      message: isAuthDomainSet 
        ? `Auth domain: ${authDomainValue}` 
        : '❌ Missing VITE_FIREBASE_AUTH_DOMAIN environment variable'
    });
  }, []);

  const handleRedirectSignIn = async () => {
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error('Error signing in with Google (redirect):', error);
    }
  };

  const handlePopupSignIn = async () => {
    try {
      await signInWithGooglePopup();
    } catch (error) {
      console.error('Error signing in with Google (popup):', error);
    }
  };

  return (
    <div className="google-auth-container">
      <div className="auth-buttons">
        <button
          onClick={handleRedirectSignIn}
          disabled={loading}
          className={`google-sign-in-button ${className}`}
          type="button"
        >
          {loading ? 'Loading...' : `${text} (Redirect)`}
        </button>
        <button
          onClick={handlePopupSignIn}
          disabled={loading}
          className={`google-sign-in-button ${className}`}
          type="button"
        >
          {loading ? 'Loading...' : `${text} (Popup)`}
        </button>
      </div>
      <div className="auth-info">
        <p className="auth-description">
          <strong>Redirect</strong>: ページ全体を切り替えて認証します。同一ドメインでの利用に最適。<br />
          <strong>Popup</strong>: 小さなウィンドウで認証します。クロスドメインでも利用可能。
        </p>
        <div className="env-status-indicator" style={{ 
          color: envStatus.isSet ? 'green' : 'red',
          fontSize: '0.8rem',
          marginTop: '0.5rem' 
        }}>
          {envStatus.message}
        </div>
      </div>
    </div>
  );
}