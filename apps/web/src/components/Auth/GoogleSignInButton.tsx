import { useEffect, useState } from 'react';
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
    message: 'Checking environment...',
  });

  // 環境変数の状態をチェック
  useEffect(() => {
    const authDomainValue = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const isAuthDomainSet = !!authDomainValue;

    setEnvStatus({
      isSet: isAuthDomainSet,
      message: isAuthDomainSet
        ? `Auth domain: ${authDomainValue}`
        : '❌ Missing VITE_FIREBASE_AUTH_DOMAIN environment variable',
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <button
          onClick={handleRedirectSignIn}
          disabled={loading}
          className={`bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm flex items-center justify-center transition-colors ${className}`}
          type="button"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true" role="img">
            <title>Google Logo</title>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? 'Loading...' : `${text} (Redirect)`}
        </button>
        <button
          onClick={handlePopupSignIn}
          disabled={loading}
          className={`bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm flex items-center justify-center transition-colors ${className}`}
          type="button"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true" role="img">
            <title>Google Logo</title>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? 'Loading...' : `${text} (Popup)`}
        </button>
      </div>
      <div className="text-xs text-gray-600">
        <p className="mb-1">
          <span className="font-medium">Redirect</span>:
          ページ全体を切り替えて認証します。同一ドメインでの利用に最適。
          <br />
          <span className="font-medium">Popup</span>:
          小さなウィンドウで認証します。クロスドメインでも利用可能。
        </p>
        <div className={`text-xs mt-1 ${envStatus.isSet ? 'text-green-600' : 'text-red-600'}`}>
          {envStatus.message}
        </div>
      </div>
    </div>
  );
}
