import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const registerSchema = loginSchema.extend({
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  phoneNumber: z.string().optional(),
  registrationType: z.enum(['Student', 'Recruiter']),
  companyName: z.string().optional(),
  companyWebsite: z.string().optional(),
}).superRefine((value, context) => {
  if (value.registrationType === 'Recruiter' && !value.companyName?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['companyName'],
      message: 'Company name is required for recruiter registration.',
    });
  }
});

export const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email address.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
