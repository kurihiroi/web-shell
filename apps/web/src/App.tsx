import { useState } from 'react';
import type { ReactElement } from 'react';
import './App.css';
import AuthStatus from './components/Auth/AuthStatus';
import Shell from './components/Shell/Shell';
import { AuthProvider } from './context/AuthContext';
import './components/Auth/Auth.css';

function App(): ReactElement {
  const [count, setCount] = useState<number>(0);

  return (
    <AuthProvider>
      <div className="app">
        <h1>Web Shell</h1>

        <div className="card">
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>

        <div className="auth-example">
          <h3>Firebase Auth Example</h3>
          <AuthStatus />
        </div>

        <div className="shell-example">
          <h3>Web Shell</h3>
          <Shell />
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
