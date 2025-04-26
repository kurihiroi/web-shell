import { useState } from 'react';
import type { ReactElement } from 'react';
import './App.css';
import { FormSchema } from './utils/validation';
import { getPositiveNumbersSum, doubleAllNumbers } from './utils/helpers';

function App(): ReactElement {
  const [count, setCount] = useState<number>(0);
  const [numbers] = useState<number[]>([1, -2, 3, -4, 5]);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Zod validation example
  const validateForm = (event: React.FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = {
      username: form.username.value,
      password: form.password.value,
      confirmPassword: form.confirmPassword.value,
      terms: form.terms.checked,
    };

    const result = FormSchema.safeParse(formData);
    if (!result.success) {
      const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      setFormErrors(errors);
    } else {
      setFormErrors([]);
      alert('Form is valid!');
    }
  };

  // Ramda examples
  const positiveSum = getPositiveNumbersSum(numbers);
  const doubledNumbers = doubleAllNumbers(numbers);
  
  return (
    <>
      <div className="app">
        <h1>Web Shell</h1>
        
        <div className="card">
          <button type="button" onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>

        <div className="ramda-example">
          <h3>Ramda Examples</h3>
          <p>Original numbers: {JSON.stringify(numbers)}</p>
          <p>Sum of positive numbers: {positiveSum}</p>
          <p>Doubled numbers: {JSON.stringify(doubledNumbers)}</p>
        </div>

        <div className="zod-example">
          <h3>Zod Validation Example</h3>
          <form onSubmit={validateForm}>
            <div>
              <label htmlFor="username">Username:</label>
              <input id="username" name="username" type="text" />
            </div>
            <div>
              <label htmlFor="password">Password:</label>
              <input id="password" name="password" type="password" />
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input id="confirmPassword" name="confirmPassword" type="password" />
            </div>
            <div>
              <label htmlFor="terms">
                <input id="terms" name="terms" type="checkbox" />
                I accept the terms
              </label>
            </div>
            <button type="submit">Submit</button>
          </form>
          {formErrors.length > 0 && (
            <div className="errors">
              <h4>Validation Errors:</h4>
              <ul>
                {formErrors.map((error) => (
                  <li key={`error-${error}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;