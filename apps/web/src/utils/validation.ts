import { z } from 'zod';

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  createdAt: z.date(),
});

// Type inference from schema
export type User = z.infer<typeof UserSchema>;

// Function to validate user data
export function validateUser(data: unknown): { success: boolean; data?: User; error?: string } {
  try {
    const user = UserSchema.parse(data);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: 'Unknown validation error' };
  }
}

// Form schema
export const FormSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type FormData = z.infer<typeof FormSchema>;