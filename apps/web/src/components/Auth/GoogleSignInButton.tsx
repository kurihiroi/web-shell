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
  const { signInWithGoogleRedirect, loading } = useAuth();
  const [authMethod, setAuthMethod] = useState<string>('checking...');
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

  // 現在のドメインとFirebase Auth Domainが一致するかチェック
  useEffect(() => {
    try {
      const currentDomain = window.location.hostname;
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.split('.')[0] || '';
      
      if (!authDomain) {
        setAuthMethod('popup (fallback - missing auth domain)');
        return;
      }
      
      if (currentDomain === 'localhost') {
        setAuthMethod('redirect (localhost)');
        return;
      }
      
      const currentDomainBase = currentDomain.split('.')[0];
      const domainsMatch = currentDomainBase === authDomain;
      
      if (domainsMatch) {
        setAuthMethod(`redirect (${currentDomain} matches ${authDomain})`);
      } else {
        setAuthMethod(`popup (${currentDomain} ≠ ${authDomain})`);
      }
    } catch (error) {
      console.error('Error checking domain:', error);
      setAuthMethod('popup (fallback - error)');
    }
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithGoogleRedirect();
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <div className="google-auth-container">
      <button
        onClick={handleSignIn}
        disabled={loading}
        className={`google-sign-in-button ${className}`}
        type="button"
      >
        {loading ? 'Loading...' : text}
      </button>
      <div className="auth-method-indicator">
        Using {authMethod} authentication
      </div>
      <div className="env-status-indicator" style={{ 
        color: envStatus.isSet ? 'green' : 'red',
        fontSize: '0.8rem',
        marginTop: '0.5rem' 
      }}>
        {envStatus.message}
      </div>
    </div>
  );
}