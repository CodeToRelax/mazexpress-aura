import { z } from 'zod';
import { ShipmentStatus, ShippingMethod, ShipmentDestination } from '@/types/shipment';

// Shipment Size Schema
export const shipmentSizeSchema = z.object({
  weight: z.number().min(0.1).max(1000).optional(),
  height: z.number().min(1).max(1000).optional(),
  width: z.number().min(1).max(1000).optional(),
  length: z.number().min(1).max(1000).optional(),
}).refine(
  (data) => {
    // Either weight OR all dimensions must be provided
    const hasWeight = data.weight !== undefined;
    const hasDimensions = 
      data.height !== undefined && 
      data.width !== undefined && 
      data.length !== undefined;
    return hasWeight || hasDimensions;
  },
  {
    message: 'Provide either weight or dimensions (height, width, length)',
  }
);

// Create Shipment Schema
export const createShipmentSchema = z.object({
  isn: z.string().regex(/^[A-Z0-9]{8,20}$/, 'Invalid ISN format').optional().or(z.literal('')),
  csn: z.string().regex(/^[A-Z]{3}-[A-Z0-9]{3,4}$/, 'Invalid CSN format (e.g., BEN-828C)'),
  size: shipmentSizeSchema,
  shipmentDestination: z.nativeEnum(ShipmentDestination, {
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
  isn: z.string().regex(/^[A-Z0-9]{8,20}$/, 'Invalid ISN format').optional().or(z.literal('')),
  csn: z.string().regex(/^[A-Z]{3}-[A-Z0-9]{3,4}$/, 'Invalid CSN format').optional(),
  size: z.object({
    weight: z.number().min(0.1).max(1000).optional(),
    height: z.number().min(1).max(1000).optional(),
    width: z.number().min(1).max(1000).optional(),
    length: z.number().min(1).max(1000).optional(),
  }).optional(),
  shipmentDestination: z.nativeEnum(ShipmentDestination).optional(),
  shippingMethod: z.nativeEnum(ShippingMethod).optional(),
  extraCosts: z.number().min(0).max(10000).optional(),
  note: z.string().max(500).optional().or(z.literal('')),
  status: z.nativeEnum(ShipmentStatus).optional(),
  estimatedArrival: z.string().optional().or(z.literal('')),
  isDomestic: z.boolean().optional(),
});

// Search Shipment Schema
export const searchShipmentSchema = z.object({
  searchParam: z.string().min(1, 'Search term is required'),
});

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
