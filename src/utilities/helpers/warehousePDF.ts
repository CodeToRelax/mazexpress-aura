/**
 * Warehouse PDF Generation Utilities
 * Generates PDF printouts for customers (only open warehouses)
 */

import type { Warehouse } from '@/types/warehouse';
import { format } from 'date-fns';

/**
 * Generate PDF for a single warehouse (for customers)
 * Only generates PDF for open warehouses
 */
export function generateWarehousePDF(warehouse: Warehouse): void {
  if (warehouse.status !== 'open') {
    throw new Error('PDF generation is only available for open warehouses');
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please allow popups.');
  }

  // Format operating hours
  const formatDayHours = (hours: any): string => {
    if (!hours.isOpen) return '<span style="color: #666;">Closed</span>';
    
    let schedule = `${hours.openTime || ''} - ${hours.closeTime || ''}`;
    if (hours.breakStartTime && hours.breakEndTime) {
      schedule += `<br><small style="color: #666;">Break: ${hours.breakStartTime} - ${hours.breakEndTime}</small>`;
    }
    return schedule;
  };

  // Build address string
  const addressParts = [
    warehouse.address.doorNumber,
    warehouse.address.buildingNumber,
    warehouse.address.street,
    warehouse.address.neighborhood,
    warehouse.address.district,
    warehouse.address.city,
    warehouse.address.country,
  ].filter(Boolean);
  const fullAddress = addressParts.join(', ');

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${warehouse.name} - Warehouse Information</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
          color: #333;
        }
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 32px;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          background: #10b981;
          color: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 12px;
          margin-bottom: 20px;
        }
        .info-label {
          font-weight: 600;
          color: #64748b;
        }
        .info-value {
          color: #1e293b;
        }
        .hours-table {
          width: 100%;
          border-collapse: collapse;
        }
        .hours-table th,
        .hours-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .hours-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
        }
        .hours-table tr:last-child td {
          border-bottom: none;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }
        .print-button:hover {
          background: #1d4ed8;
        }
        a {
          color: #2563eb;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">Print PDF</button>
      
      <div class="header">
        <h1>${warehouse.name}</h1>
        <span class="status-badge">Open</span>
      </div>

      <div class="section">
        <h2 class="section-title">Location</h2>
        <div class="info-grid">
          <div class="info-label">Address:</div>
          <div class="info-value">${fullAddress}</div>
          
          <div class="info-label">Zip Code:</div>
          <div class="info-value">${warehouse.address.zipCode}</div>
          
          ${warehouse.address.coordinates ? `
            <div class="info-label">Coordinates:</div>
            <div class="info-value">
              Lat: ${warehouse.address.coordinates.latitude}, 
              Long: ${warehouse.address.coordinates.longitude}
            </div>
          ` : ''}
          
          ${warehouse.address.googleMapsUrl ? `
            <div class="info-label">Google Maps:</div>
            <div class="info-value">
              <a href="${warehouse.address.googleMapsUrl}" target="_blank">View on Google Maps</a>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Contact Information</h2>
        <div class="info-grid">
          ${warehouse.phoneNumber ? `
            <div class="info-label">Phone:</div>
            <div class="info-value">${warehouse.phoneNumber}</div>
          ` : ''}
          
          ${warehouse.email ? `
            <div class="info-label">Email:</div>
            <div class="info-value">${warehouse.email}</div>
          ` : ''}
          
          ${warehouse.youtubeUrl ? `
            <div class="info-label">YouTube:</div>
            <div class="info-value">
              <a href="${warehouse.youtubeUrl}" target="_blank">Watch Video Tour</a>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Operating Hours</h2>
        <table class="hours-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><strong>Monday</strong></td><td>${formatDayHours(warehouse.operatingHours.monday)}</td></tr>
            <tr><td><strong>Tuesday</strong></td><td>${formatDayHours(warehouse.operatingHours.tuesday)}</td></tr>
            <tr><td><strong>Wednesday</strong></td><td>${formatDayHours(warehouse.operatingHours.wednesday)}</td></tr>
            <tr><td><strong>Thursday</strong></td><td>${formatDayHours(warehouse.operatingHours.thursday)}</td></tr>
            <tr><td><strong>Friday</strong></td><td>${formatDayHours(warehouse.operatingHours.friday)}</td></tr>
            <tr><td><strong>Saturday</strong></td><td>${formatDayHours(warehouse.operatingHours.saturday)}</td></tr>
            <tr><td><strong>Sunday</strong></td><td>${formatDayHours(warehouse.operatingHours.sunday)}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="footer">
        <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
        <p>Last updated: ${format(new Date(warehouse.updatedAt), 'MMMM dd, yyyy')}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Generate PDF for multiple open warehouses
 */
export function generateWarehousesPDF(warehouses: Warehouse[]): void {
  const openWarehouses = warehouses.filter((w) => w.status === 'open');
  
  if (openWarehouses.length === 0) {
    throw new Error('No open warehouses to generate PDF');
  }

  // For multiple warehouses, open each in a new tab or generate a combined PDF
  if (openWarehouses.length === 1) {
    generateWarehousePDF(openWarehouses[0]);
  } else {
    // Generate a combined PDF with all open warehouses
    openWarehouses.forEach((warehouse, index) => {
      setTimeout(() => {
        generateWarehousePDF(warehouse);
      }, index * 500); // Stagger the popups
    });
  }
}
