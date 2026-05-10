import { z } from 'zod';
import { DOMESTIC_CITIES } from '@/data/domesticCities';

const PHONE_RE = /^[+]?[0-9\s\-()]{7,20}$/;

const cityEnum = z.string().refine((v) => DOMESTIC_CITIES.includes(v), {
  message: 'Invalid city',
});

const tierEnum = z.enum(['A', 'B', 'C', 'D']);

export const recipientSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  primaryPhone: z.string().trim().regex(PHONE_RE, 'Invalid phone number'),
  alternatePhone: z
    .string()
    .trim()
    .regex(PHONE_RE, 'Invalid phone number')
    .optional()
    .or(z.literal(''))
    .nullable(),
  city: cityEnum,
  address: z.string().trim().min(1, 'Address is required').max(300),
});

export const routeSchema = z
  .object({
    originCity: cityEnum,
    destinationCity: cityEnum,
    priceTierA: z.coerce.number().min(0, 'Must be ≥ 0'),
    priceTierB: z.coerce.number().min(0, 'Must be ≥ 0'),
    priceTierC: z.coerce.number().min(0, 'Must be ≥ 0'),
    priceTierD: z.coerce.number().min(0, 'Must be ≥ 0'),
  })
  .refine((v) => v.originCity !== v.destinationCity, {
    message: 'Origin and destination must differ.',
    path: ['destinationCity'],
  });

export type RouteFormValues = z.infer<typeof routeSchema>;

export const optionsSchema = z.object({
  fragile: z.boolean().optional(),
  storeOnDeliveryFailure: z.boolean().optional(),
  insurance: z.boolean().optional(),
});

export const walkInSchema = z
  .object({
    senderUserId: z.string().min(1, 'Pick a sender'),
    originCity: cityEnum,
    recipient: recipientSchema,
    description: z.string().trim().min(1, 'Required').max(500),
    itemPrice: z.coerce.number().min(0).default(0),
    quantity: z.coerce.number().int().min(1).default(1),
    tier: tierEnum,
    shippingPrice: z.coerce.number().min(0).optional(),
    options: optionsSchema.optional(),
    notes: z.string().trim().max(500).optional().or(z.literal('')).nullable(),
    status: z
      .enum(['awaiting_approval', 'awaiting_shipping', 'in_transit'])
      .default('awaiting_shipping'),
  })
  .refine((v) => v.originCity !== v.recipient.city, {
    message: 'Origin and destination must differ.',
    path: ['recipient', 'city'],
  })
  .refine(
    (v) => v.tier !== 'D' || (typeof v.shippingPrice === 'number' && v.shippingPrice >= 0),
    {
      message: 'Shipping price is required for tier D.',
      path: ['shippingPrice'],
    }
  );

export type WalkInFormValues = z.infer<typeof walkInSchema>;

export const editShipmentSchema = z
  .object({
    originCity: cityEnum,
    recipient: recipientSchema,
    description: z.string().trim().min(1, 'Required').max(500),
    itemPrice: z.coerce.number().min(0),
    quantity: z.coerce.number().int().min(1),
    tier: tierEnum,
    shippingPrice: z.coerce.number().min(0).optional(),
    options: optionsSchema.optional(),
    notes: z.string().trim().max(500).optional().or(z.literal('')).nullable(),
  })
  .refine((v) => v.originCity !== v.recipient.city, {
    message: 'Origin and destination must differ.',
    path: ['recipient', 'city'],
  })
  .refine(
    (v) => v.tier !== 'D' || (typeof v.shippingPrice === 'number' && v.shippingPrice >= 0),
    {
      message: 'Shipping price is required for tier D.',
      path: ['shippingPrice'],
    }
  );

export type EditShipmentFormValues = z.infer<typeof editShipmentSchema>;