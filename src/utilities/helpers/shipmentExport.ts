import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IShipment, ShipmentFilters } from '@/types/shipment';
import { shipmentsApi } from '@/utilities/api/shipments.api';

function escapeCSVField(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '';
  const s = String(field);
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

function calculateCBM(l: number, w: number, h: number): string {
  return (l * w * h / 1000000).toFixed(4);
}

function shipmentsToCSV(shipments: IShipment[]): string {
  const headers = [
    'ESN', 'CSN', 'ISN', 'Destination', 'Origin Country', 'Origin City',
    'Shipping Method', 'Status', 'Weight (kg)', 'Length (cm)', 'Width (cm)',
    'Height (cm)', 'CBM (m³)', 'Extra Costs', 'Tier', 'Note', 'Created At', 'Updated At',
  ];

  const rows = shipments.map(s => [
    escapeCSVField(s.esn), escapeCSVField(s.csn), escapeCSVField(s.isn),
    escapeCSVField(s.shipmentDestination), escapeCSVField(s.originCountry),
    escapeCSVField(s.originCity), escapeCSVField(s.shippingMethod),
    escapeCSVField(s.status), escapeCSVField(s.size?.weight),
    escapeCSVField(s.size?.length), escapeCSVField(s.size?.width),
    escapeCSVField(s.size?.height),
    escapeCSVField(s.size ? calculateCBM(s.size.length, s.size.width, s.size.height) : ''),
    escapeCSVField(s.extraCosts), escapeCSVField(s.tier), escapeCSVField(s.note),
    escapeCSVField(s.createdAt ? formatDate(s.createdAt) : ''),
    escapeCSVField(s.updatedAt ? formatDate(s.updatedAt) : ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  return '\uFEFF' + csvContent;
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

async function fetchAllShipments(filters: ShipmentFilters): Promise<IShipment[]> {
  let allShipments: IShipment[] = [];
  let currentPage = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await shipmentsApi.getShipments({
      ...filters,
      page: currentPage,
      limit: 100,
    });

    if (response.data.shipments.length > 0) {
      allShipments = [...allShipments, ...response.data.shipments];
    }

    hasMore = response.data.pagination.hasNextPage;
    currentPage++;
    if (currentPage > 50) break;
  }

  if (allShipments.length === 0) {
    throw new Error('No shipments found to export');
  }

  return allShipments;
}

export async function exportShipmentsToCSV(filters: ShipmentFilters, preloadedShipments?: IShipment[]): Promise<number> {
  const allShipments = preloadedShipments ?? await fetchAllShipments(filters);
  if (allShipments.length === 0) throw new Error('No shipments found to export');
  const csvContent = shipmentsToCSV(allShipments);
  const method = filters.method || filters.shippingMethod || 'all';
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const filename = `shipments-${method}-${timestamp}.csv`;
  downloadCSV(csvContent, filename);
  return allShipments.length;
}

export async function exportShipmentsToPDF(filters: ShipmentFilters, preloadedShipments?: IShipment[]): Promise<number> {
  const allShipments = preloadedShipments ?? await fetchAllShipments(filters);
  if (allShipments.length === 0) throw new Error('No shipments found to export');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.text('Shipments Report', 14, 15);
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}  |  Total: ${allShipments.length} shipments`, 14, 22);

  const headers = ['ESN', 'CSN', 'Destination', 'Origin', 'Method', 'Status', 'Weight', 'CBM', 'Tier', 'Created'];

  const rows = allShipments.map(s => [
    s.esn || '',
    s.csn || '',
    s.shipmentDestination || '',
    `${s.originCountry || ''}${s.originCity ? ' / ' + s.originCity : ''}`,
    s.shippingMethod || '',
    s.status || '',
    s.size?.weight != null ? String(s.size.weight) : '',
    s.size ? calculateCBM(s.size.length, s.size.width, s.size.height) : '',
    s.tier || '',
    s.createdAt ? format(new Date(s.createdAt), 'MM/dd/yy') : '',
  ]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 27,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
  });

  const method = filters.method || filters.shippingMethod || 'all';
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  doc.save(`shipments-${method}-${timestamp}.pdf`);

  return allShipments.length;
}
