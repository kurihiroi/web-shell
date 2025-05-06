import type { ReactElement } from 'react';
import { useAuth } from '../../hooks/useAuth';
import GoogleSignInButton from './GoogleSignInButton';
import UserProfile from './UserProfile';

interface AuthStatusProps {
  className?: string;
}

export default function AuthStatus({ className = '' }: AuthStatusProps): ReactElement {
  const { currentUser, loading, error } = useAuth();

  return (
    <div className={`auth-status ${className}`}>
      {error && <div className="text-red-500 p-2 rounded bg-red-100">Error: {error.message}</div>}

      {loading ? (
        <div className="text-gray-600">Loading authentication status...</div>
      ) : currentUser ? (
        <UserProfile />
      ) : (
        <div className="p-4 border rounded bg-gray-50">
          <p className="mb-2">Sign in to access your account</p>
          <GoogleSignInButton />
        </div>
      )}
    </div>
  );
}
