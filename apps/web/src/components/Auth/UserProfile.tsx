import type { ReactElement } from 'react';
import { useAuth } from '../../context/AuthContext';

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className = '' }: UserProfileProps): ReactElement {
  const { currentUser, logout, loading } = useAuth();
  
  if (loading) {
    return <div className={`user-profile-loading ${className}`}>Loading...</div>;
  }
  
  if (!currentUser) {
    return <div className={`user-profile-not-signed-in ${className}`}>Not signed in</div>;
  }
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <div className={`user-profile ${className}`}>
      <div className="user-profile-info">
        {currentUser.photoURL && (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName || 'User'} 
            className="user-profile-avatar"
          />
        )}
        <div className="user-profile-details">
          <h3>{currentUser.displayName}</h3>
          <p>{currentUser.email}</p>
        </div>
      </div>
      <button type="button" onClick={handleLogout} className="logout-button">
        Sign Out
      </button>
    </div>
  );
}