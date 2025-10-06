import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'errors.required')
    .email('errors.email')
    .max(255, 'errors.email'),
  password: z
    .string()
    .min(6, 'errors.passwordMin')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
