import { z } from 'zod';

/**
 * User signup validation schema
 */
export const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password is too long'),
  userType: z.enum(['admin', 'customer']).optional().default('customer'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  birthdate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Birthdate must be in DD/MM/YYYY format')
    .refine((date) => {
      try {
        const [day, month, year] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.getDate() === day && 
               dateObj.getMonth() === month - 1 && 
               dateObj.getFullYear() === year &&
               year >= 1900 &&
               dateObj <= new Date();
      } catch {
        return false;
      }
    }, 'Invalid date'),
  address: z.object({
    street: z
      .string()
      .max(100, 'Street address must be less than 100 characters')
      .optional()
      .or(z.literal('')),
    specificDescription: z
      .string()
      .max(200, 'Description must be less than 200 characters')
      .optional()
      .or(z.literal('')),
    city: z.enum([
      // Libya
      'benghazi', 'tripoli', 'musrata', 'al bayda', 'zawiya', 'gharyan',
      'tobruk', 'ajdabiya', 'zliten', 'derna', 'sirte', 'sabha', 'khoms',
      'bani walid', 'sabratha', 'zuwara', 'kufra', 'al marj', 'tarhuna',
      'ubari', 'gadames', 'ghat', 'nalut', 'jalu', 'brega', 'misrata',
      'al khums', 'darnah', 'yafran', 'shahat', 'bayda', 'marsa brega',
      // Turkey
      'istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya',
      'gaziantep', 'mersin', 'kayseri', 'eskisehir', 'diyarbakir', 'samsun',
      'denizli', 'malatya', 'trabzon', 'erzurum',
      // China
      'hongkong', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu',
      'wuhan', 'xi an', 'nanjing', 'hangzhou', 'tianjin', 'qingdao', 'dalian',
      'suzhou', 'chongqing', 'kunming', 'harbin',
      // UAE
      'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah',
      'umm al quwain', 'al ain', 'khor fakkan', 'dibba', 'madinat zaid',
    ], {
      errorMap: () => ({ message: 'Please select a valid city' }),
    }),
    country: z.enum(['libya', 'turkey', 'china', 'uae'], {
      errorMap: () => ({ message: 'Please select a valid country' }),
    }),
  }),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  privacyPolicy: z.object({
    usageAgreement: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' }),
    }),
  }),
}).refine(
  (data) => {
    if (data.userType === 'customer') {
      // Libyan phone validation
      return /^(?:\+218|0)?(91|92|93|94|95)\d{7}$/.test(data.phoneNumber);
    } else {
      // International phone validation (country code + 6-15 digits)
      return /^\+?\d{6,15}$/.test(data.phoneNumber);
    }
  },
  {
    message: 'Invalid phone number format',
    path: ['phoneNumber'],
  }
);

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * User update validation schema (excludes password and privacy policy)
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  userType: z.enum(['admin', 'customer']),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  birthdate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Birthdate must be in DD/MM/YYYY format')
    .refine((date) => {
      try {
        const [day, month, year] = date.split('/').map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj.getDate() === day && 
               dateObj.getMonth() === month - 1 && 
               dateObj.getFullYear() === year &&
               year >= 1900 &&
               dateObj <= new Date();
      } catch {
        return false;
      }
    }, 'Invalid date'),
  address: z.object({
    street: z
      .string()
      .max(100, 'Street address must be less than 100 characters')
      .optional()
      .or(z.literal('')),
    specificDescription: z
      .string()
      .max(200, 'Description must be less than 200 characters')
      .optional()
      .or(z.literal('')),
    city: z.enum([
      // Libya
      'benghazi', 'tripoli', 'musrata', 'al bayda', 'zawiya', 'gharyan',
      'tobruk', 'ajdabiya', 'zliten', 'derna', 'sirte', 'sabha', 'khoms',
      'bani walid', 'sabratha', 'zuwara', 'kufra', 'al marj', 'tarhuna',
      'ubari', 'gadames', 'ghat', 'nalut', 'jalu', 'brega', 'misrata',
      'al khums', 'darnah', 'yafran', 'shahat', 'bayda', 'marsa brega',
      // Turkey
      'istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana', 'konya',
      'gaziantep', 'mersin', 'kayseri', 'eskisehir', 'diyarbakir', 'samsun',
      'denizli', 'malatya', 'trabzon', 'erzurum',
      // China
      'hongkong', 'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'chengdu',
      'wuhan', 'xi an', 'nanjing', 'hangzhou', 'tianjin', 'qingdao', 'dalian',
      'suzhou', 'chongqing', 'kunming', 'harbin',
      // UAE
      'dubai', 'abu dhabi', 'sharjah', 'ajman', 'ras al khaimah', 'fujairah',
      'umm al quwain', 'al ain', 'khor fakkan', 'dibba', 'madinat zaid',
    ], {
      errorMap: () => ({ message: 'Please select a valid city' }),
    }),
    country: z.enum(['libya', 'turkey', 'china', 'uae'], {
      errorMap: () => ({ message: 'Please select a valid country' }),
    }),
  }),
  gender: z.enum(['male', 'female'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  disabled: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.userType === 'customer') {
      // Libyan phone validation
      return /^(?:\+218|0)?(91|92|93|94|95)\d{7}$/.test(data.phoneNumber);
    } else {
      // International phone validation (country code + 6-15 digits)
      return /^\+?\d{6,15}$/.test(data.phoneNumber);
    }
  },
  {
    message: 'Invalid phone number format',
    path: ['phoneNumber'],
  }
);

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
