import { useState } from 'react';
import type { ReactElement } from 'react';
import { BsTerminalFill } from 'react-icons/bs';
import { FaFireAlt } from 'react-icons/fa';
import { HiOutlinePlusCircle } from 'react-icons/hi';
import AuthStatus from './components/Auth/AuthStatus';
import Shell from './components/Shell/Shell';
import { AuthProvider } from './context/AuthContext';

function App(): ReactElement {
  const [count, setCount] = useState<number>(0);

  return (
    <AuthProvider>
      <div className="max-w-5xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-6">Web Shell</h1>

        <div className="p-8">
          <button
            type="button"
            className="m-4 rounded-lg border border-transparent px-5 py-2.5 text-base font-medium bg-gray-800 text-white hover:border-blue-500 transition-colors flex items-center justify-center"
            onClick={() => setCount((count) => count + 1)}
          >
            <HiOutlinePlusCircle className="mr-2" />
            count is {count}
          </button>
        </div>

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
