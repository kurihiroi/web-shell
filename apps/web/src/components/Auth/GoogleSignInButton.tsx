import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../hooks/useAuth';

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
}

export function GoogleSignInButton({
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
          <FcGoogle className="w-5 h-5 mr-2" aria-hidden="true" />
          {loading ? 'Loading...' : `${text} (Redirect)`}
        </button>
        <button
          onClick={handlePopupSignIn}
          disabled={loading}
          className={`bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded shadow-sm flex items-center justify-center transition-colors ${className}`}
          type="button"
        >
          <FcGoogle className="w-5 h-5 mr-2" aria-hidden="true" />
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
