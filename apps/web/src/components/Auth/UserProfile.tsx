import type { ReactElement } from 'react';
import { BiLoaderAlt } from 'react-icons/bi';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface UserProfileProps {
  className?: string;
}

export default function UserProfile({ className = '' }: UserProfileProps): ReactElement {
  const { currentUser, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className={`${className} text-gray-500 p-4 flex items-center`}>
        <BiLoaderAlt className="animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <div className={`${className} text-gray-500 p-4`}>Not signed in</div>;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div
      className={`user-profile ${className} flex items-center justify-between p-4 border rounded shadow-sm`}
    >
      <div className="user-profile-info flex items-center gap-3">
        {currentUser.photoURL && (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || 'User'}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div className="user-profile-details">
          <h3 className="font-semibold text-gray-800">{currentUser.displayName}</h3>
          <p className="text-sm text-gray-600">{currentUser.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded text-sm transition-colors flex items-center"
      >
        <FiLogOut className="mr-1" />
        Sign Out
      </button>
    </div>
  );
}
