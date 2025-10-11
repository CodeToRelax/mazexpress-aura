import { z } from 'zod';
import { ShipmentStatus, ShippingMethod, Cities } from '@/types/shipment';

// Shipment Size Schema - Either weight OR all dimensions required
export const shipmentSizeSchema = z.object({
  weight: z.number().min(0.1).max(1000).optional(),
  height: z.number().min(1).max(200).optional(),
  width: z.number().min(1).max(200).optional(),
  length: z.number().min(1).max(200).optional(),
}).refine(
  (data) => data.weight || (data.height && data.width && data.length),
  { message: 'Either weight OR all dimensions must be provided' }
);

// Create Shipment Schema
export const createShipmentSchema = z.object({
  isn: z.string().regex(/^[A-Z0-9]{8,20}$/i, 'Invalid ISN format').optional().or(z.literal('')),
  csn: z.string().regex(/^[A-Za-z]{3}-[A-Za-z0-9]{3,4}$/i, 'Invalid CSN format (e.g., BEN-828C or ben-test)'),
  size: shipmentSizeSchema,
  shipmentDestination: z.nativeEnum(Cities, {
    errorMap: () => ({ message: 'Invalid destination' }),
  }),
  shippingMethod: z.nativeEnum(ShippingMethod, {
    errorMap: () => ({ message: 'Invalid shipping method' }),
  }),
  extraCosts: z.number().min(0).max(10000).optional(),
  note: z.string().max(500).optional().or(z.literal('')),
  estimatedArrival: z.string().optional().or(z.literal('')),
  isDomestic: z.boolean().optional(),
});

// Update Shipment Schema
export const updateShipmentSchema = z.object({
  isn: z.string().regex(/^[A-Z0-9]{8,20}$/i, 'Invalid ISN format').optional().or(z.literal('')),
  csn: z.string().regex(/^[A-Za-z]{3}-[A-Za-z0-9]{3,4}$/i, 'Invalid CSN format').optional(),
  size: shipmentSizeSchema.optional(),
  shipmentDestination: z.nativeEnum(Cities).optional(),
  shippingMethod: z.nativeEnum(ShippingMethod).optional(),
  extraCosts: z.number().min(0).max(10000).optional(),
  note: z.string().max(500).optional().or(z.literal('')),
  status: z.nativeEnum(ShipmentStatus).optional(),
  estimatedArrival: z.string().optional().or(z.literal('')),
  isDomestic: z.boolean().optional(),
});

// Search Shipment Schema - Support both ESN formats
export const searchShipmentSchema = z.object({
  searchParam: z.string().min(1, 'Search term is required'),
});

// ESN Validation Schema - Support both old and new formats
export const esnSchema = z.string().regex(
  /^([A-Z]{3}-[A-Z0-9]{6,8}|\d{10})$/,
  'Invalid ESN format. Must be either ABC-123456 format or 10-digit numeric format'
);

// Price Calculation Schema
export const priceCalculationSchema = z.object({
  weight: z.string().optional(),
  dimensions: z.object({
    height: z.number().min(1),
    width: z.number().min(1),
    length: z.number().min(1),
  }).optional(),
  shippingMethod: z.nativeEnum(ShippingMethod),
  destination: z.string().min(1),
  country: z.string().min(1),
}).refine(
  (data) => data.weight || data.dimensions,
  {
    message: 'Provide either weight or dimensions',
  }
);

// Export types
export type CreateShipmentFormData = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentFormData = z.infer<typeof updateShipmentSchema>;
export type SearchShipmentFormData = z.infer<typeof searchShipmentSchema>;
export type PriceCalculationFormData = z.infer<typeof priceCalculationSchema>;
