/**
 * Warehouse Export Utilities
 * Handles CSV export with human-readable formatting
 */

import type { Warehouse } from '@/types/warehouse';
import { format } from 'date-fns';

/**
 * Format operating hours for a single day
 */
function formatDayHours(day: string, hours: any): string {
  if (!hours.isOpen) return 'Closed';
  
  let schedule = `${hours.openTime || ''} - ${hours.closeTime || ''}`;
  if (hours.breakStartTime && hours.breakEndTime) {
    schedule += ` (Break: ${hours.breakStartTime} - ${hours.breakEndTime})`;
  }
  return schedule;
}

/**
 * Export warehouses to CSV
 */
export function exportWarehousesToCSV(warehouses: Warehouse[]): void {
  // Define CSV headers
  const headers = [
    'Warehouse Name',
    'Status',
    'City',
    'Country',
    'Address',
    'Phone Number',
    'Email',
    'Monday Hours',
    'Tuesday Hours',
    'Wednesday Hours',
    'Thursday Hours',
    'Friday Hours',
    'Saturday Hours',
    'Sunday Hours',
    'Google Maps URL',
    'YouTube URL',
    'Created Date',
    'Last Updated',
  ];

  // Convert warehouses to CSV rows
  const rows = warehouses.map((warehouse) => {
    const address = [
      warehouse.address.doorNumber,
      warehouse.address.buildingNumber,
      warehouse.address.street,
      warehouse.address.neighborhood,
      warehouse.address.district,
      warehouse.address.city,
    ]
      .filter(Boolean)
      .join(', ');

    return [
      warehouse.name,
      warehouse.status === 'open' ? 'Open' : 'Closed',
      warehouse.address.city,
      warehouse.address.country,
      address,
      warehouse.phoneNumber || 'N/A',
      warehouse.email || 'N/A',
      formatDayHours('Monday', warehouse.operatingHours.monday),
      formatDayHours('Tuesday', warehouse.operatingHours.tuesday),
      formatDayHours('Wednesday', warehouse.operatingHours.wednesday),
      formatDayHours('Thursday', warehouse.operatingHours.thursday),
      formatDayHours('Friday', warehouse.operatingHours.friday),
      formatDayHours('Saturday', warehouse.operatingHours.saturday),
      formatDayHours('Sunday', warehouse.operatingHours.sunday),
      warehouse.address.googleMapsUrl || 'N/A',
      warehouse.youtubeUrl || 'N/A',
      format(new Date(warehouse.createdAt), 'MMM dd, yyyy hh:mm a'),
      format(new Date(warehouse.updatedAt), 'MMM dd, yyyy hh:mm a'),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `warehouses_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
