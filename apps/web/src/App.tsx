import { useState } from 'react';
import type { ReactElement } from 'react';
import './App.css';

function App(): ReactElement {
  const [count, setCount] = useState<number>(0);

  return (
    <>
      <div className="app">
        <h1>Web Shell</h1>
        <div className="card">
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>
      </div>
    </>
  );
}

export default App;