/**
 * Warehouse Validation Schemas
 * Zod schemas for warehouse form validation
 */

import { z } from 'zod';
import { WarehouseStatus } from '@/types/warehouse';

// Time format validation (HH:MM in 24-hour format)
const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM (24-hour)')
  .optional();

// URL validation helpers
const googleMapsUrlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => url.includes('google.com/maps'), {
    message: 'Must be a valid Google Maps URL',
  });

const youtubeUrlSchema = z
  .string()
  .url('Invalid URL format')
  .refine((url) => url.includes('youtube.com'), {
    message: 'Must be a valid YouTube URL',
  })
  .optional()
  .or(z.literal(''));

const imageUrlSchema = z.string().url('Invalid URL format').optional().or(z.literal(''));

// Phone number validation (international format)
const phoneNumberSchema = z
  .string()
  .regex(/^[\+]?[1-9][\d\s\-\(\)]{0,15}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

// Coordinates schema
const coordinatesSchema = z.object({
  latitude: z.number().min(-90, 'Latitude must be >= -90').max(90, 'Latitude must be <= 90'),
  longitude: z.number().min(-180, 'Longitude must be >= -180').max(180, 'Longitude must be <= 180'),
});

// Address schema
const addressSchema = z.object({
  doorNumber: z.string().max(20, 'Door number too long').optional().or(z.literal('')),
  buildingNumber: z.string().max(20, 'Building number too long').optional().or(z.literal('')),
  street: z.string().max(100, 'Street name too long').optional().or(z.literal('')),
  neighborhood: z.string().max(100, 'Neighborhood name too long').optional().or(z.literal('')),
  district: z.string().max(100, 'District name too long').optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').max(50, 'City name too long'),
  country: z.string().min(1, 'Country is required').max(50, 'Country name too long'),
  googleMapsUrl: googleMapsUrlSchema,
  zipCode: z
    .string()
    .min(3, 'ZIP code must be at least 3 characters')
    .max(20, 'ZIP code too long')
    .regex(/^[A-Za-z0-9\s-]{3,20}$/, 'Invalid ZIP code format'),
  coordinates: coordinatesSchema,
});

// Day hours schema
const dayHoursSchema = z.object({
  isOpen: z.boolean(),
  openTime: timeSchema,
  closeTime: timeSchema,
  breakStartTime: timeSchema,
  breakEndTime: timeSchema,
});

// Operating hours schema
const operatingHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

// Create warehouse schema
export const createWarehouseSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  address: addressSchema,
  phoneNumber: phoneNumberSchema,
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  youtubeUrl: youtubeUrlSchema,
  imageUrl: imageUrlSchema,
  status: z.nativeEnum(WarehouseStatus, {
    errorMap: () => ({ message: 'Invalid warehouse status' }),
  }),
  operatingHours: operatingHoursSchema,
});

// Update warehouse schema (all fields optional except what's being updated)
export const updateWarehouseSchema = createWarehouseSchema.partial();

// Toggle status schema
export const toggleWarehouseStatusSchema = z.object({
  status: z.nativeEnum(WarehouseStatus, {
    errorMap: () => ({ message: 'Invalid warehouse status' }),
  }),
});

// Filter schema
export const warehouseFiltersSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  status: z.nativeEnum(WarehouseStatus).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  search: z.string().optional(),
});

// Export types
export type CreateWarehouseFormData = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseFormData = z.infer<typeof updateWarehouseSchema>;
export type ToggleWarehouseStatusFormData = z.infer<typeof toggleWarehouseStatusSchema>;
export type WarehouseFiltersFormData = z.infer<typeof warehouseFiltersSchema>;
