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

  // 現在のドメインとFirebase Auth Domainが一致するかチェック
  useEffect(() => {
    try {
      const currentDomain = window.location.hostname;
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.split('.')[0] || '';
      
      if (currentDomain === 'localhost') {
        setAuthMethod('redirect (localhost)');
        return;
      }
      
      const currentDomainBase = currentDomain.split('.')[0];
      if (currentDomainBase === authDomain) {
        setAuthMethod('redirect');
      } else {
        setAuthMethod('popup');
      }
    } catch (error) {
      console.error('Error checking domain:', error);
      setAuthMethod('popup (fallback)');
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
    </div>
  );
}