import type { ReactElement } from 'react';
import { BsTerminalFill } from 'react-icons/bs';
import { FaFireAlt } from 'react-icons/fa';
import AuthStatus from './components/Auth/AuthStatus';
import Shell from './components/Shell/Shell';
import { AuthProvider } from './context/AuthContext';

function App(): ReactElement {
  return (
    <AuthProvider>
      <div className="max-w-5xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-6">Web Shell</h1>

        <div className="mt-8 p-6 border border-gray-200 rounded-lg text-left">
          <h3 className="text-xl font-semibold mb-3 flex items-center">
            <FaFireAlt className="text-orange-500 mr-2" />
            Firebase Auth Example
          </h3>
          <AuthStatus />
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3 flex items-center justify-center">
            <BsTerminalFill className="mr-2" />
            Web Shell
          </h3>
          <Shell />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
