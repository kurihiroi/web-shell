import { useState } from 'react';
import type { ReactElement } from 'react';
import AuthStatus from './components/Auth/AuthStatus';
import Shell from './components/Shell/Shell';
import { AuthProvider } from './context/AuthContext';
import { doubleAllNumbers, getPositiveNumbersSum } from './utils/helpers';

function App(): ReactElement {
  const [count, setCount] = useState<number>(0);
  const [numbers] = useState<number[]>([1, -2, 3, -4, 5]);

  // Ramda examples
  const positiveSum = getPositiveNumbersSum(numbers);
  const doubledNumbers = doubleAllNumbers(numbers);

  return (
    <AuthProvider>
      <div className="max-w-5xl mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold mb-6">Web Shell</h1>

        <div className="p-8">
          <button
            type="button"
            className="m-4 rounded-lg border border-transparent px-5 py-2.5 text-base font-medium bg-gray-800 text-white hover:border-blue-500 transition-colors"
            onClick={() => setCount((count) => count + 1)}
          >
            count is {count}
          </button>
        </div>

        <div className="mt-8 p-6 border border-gray-200 rounded-lg text-left">
          <h3 className="text-xl font-semibold mb-3">Firebase Auth Example</h3>
          <AuthStatus />
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-3">Web Shell</h3>
          <Shell />
        </div>

        <div className="mt-8 p-6 border border-gray-200 rounded-lg text-left">
          <h3 className="text-xl font-semibold mb-3">Ramda Examples</h3>
          <p>Original numbers: {JSON.stringify(numbers)}</p>
          <p>Sum of positive numbers: {positiveSum}</p>
          <p>Doubled numbers: {JSON.stringify(doubledNumbers)}</p>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
