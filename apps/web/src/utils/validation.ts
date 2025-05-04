import * as R from 'ramda';
import { z } from 'zod';

// Email validation with Zod
export const EmailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

// Password validation with Zod
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// User input validation with Zod
export const UserInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: EmailSchema,
  age: z.number().min(13, 'Must be at least 13 years old').optional(),
});

export type UserInput = z.infer<typeof UserInputSchema>;

// Form validation helper combining Zod and Ramda
export const validateForm = <T>(schema: z.ZodType<T>, data: unknown) => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { isValid: true, data: result.data, errors: null };
  }

  // Transform Zod errors into a more usable format using Ramda
  const formatErrors = R.pipe(
    R.pathOr([], ['error', 'errors']),
    R.reduce((acc: Record<string, string>, err: z.ZodIssue) => {
      const path = err.path.join('.');
      return R.assoc(path, err.message, acc);
    }, {})
  );

  return { isValid: false, data: null, errors: formatErrors(result) };
};

// Parse and validate query parameters
export const parseQueryParams = <T>(schema: z.ZodType<T>, params: URLSearchParams): T | null => {
  const paramsObj = Array.from(params.entries()).reduce(
    (acc, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const result = schema.safeParse(paramsObj);
  return result.success ? result.data : null;
};
