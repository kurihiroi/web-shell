import type { ReactElement } from 'react';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';
import UserProfile from './UserProfile';

interface AuthStatusProps {
  className?: string;
}

export default function AuthStatus({ className = '' }: AuthStatusProps): ReactElement {
  const { currentUser, loading, error } = useAuth();

  return (
    <div className={`auth-status ${className}`}>
      {error && (
        <div className="auth-error">
          Error: {error.message}
        </div>
      )}
      
      {loading ? (
        <div className="auth-loading">Loading authentication status...</div>
      ) : currentUser ? (
        <UserProfile />
      ) : (
        <div className="auth-sign-in">
          <p>Sign in to access your account</p>
          <GoogleSignInButton />
        </div>
      )}
    </div>
  );
}