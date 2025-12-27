import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { format as formatDateFns } from 'date-fns';
import LogosText from '@/assets/Logos-text.png';
import Logo2 from '@/assets/logo-2.png';
import CairoFontUrl from '@/assets/fonts/Cairo-Regular.ttf';

/**
 * Arabic Shipment Invoice PDF Generator
 * Uses embedded Cairo font for proper Arabic text rendering
 * Matches the exact HTML template layout
 */

// Color palette - matching SCSS $blue-color: #367da3
const colors = {
  primary: [54, 125, 163] as [number, number, number], // #367da3
  textDark: [0, 0, 0] as [number, number, number],
  textMuted: [80, 80, 80] as [number, number, number],
  headerBg: [54, 125, 163] as [number, number, number], // #367da3
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  borderLight: [230, 230, 230] as [number, number, number],
};

// Arabic disclaimer lines
const disclaimerLines = [
  'يرجى مراعاة ان اقل وزن يمكن احتسابه هو 3 كيلو غرام.',
  'نؤكد أيضاً أننا نحتسب تكلفة الشحن بناءً على كل من الوزن الفعلي والوزن الحجمي،',
  'و يتم احتساب الأعلى منهما.',
  'يرجى مراعاة ان شركة ماز اكسبريس غير مسؤولة عن البضائع القابلة للكسر.',
  'نوصي بفحص الشحنة عند الاستلام.',
  'نتطلع إلى خدمتكم مرة أخرى في المستقبل',
];

interface ShipmentData {
  weight: number;
  length: number;
  width: number;
  height: number;
  extraCosts: number;
}

/**
 * Load font file as ArrayBuffer and convert to Base64
 */
async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Load image as base64
 */
async function loadImageAsBase64(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Extract shipment data from invoice items
 */
function extractShipmentData(items: InvoiceItem[]): ShipmentData[] {
  return items
    .filter(item => item.kind === 'SHIPMENT' && item.shipmentId && typeof item.shipmentId === 'object')
    .map(item => {
      const shipment = item.shipmentId;
      return {
        weight: shipment?.size?.weight || 0,
        length: shipment?.size?.length || 0,
        width: shipment?.size?.width || 0,
        height: shipment?.size?.height || 0,
        extraCosts: shipment?.extraCosts || 0,
      };
    });
}

/**
 * Calculate volumetric weight
 */
function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 5000;
}

/**
 * Generate Arabic Shipment Invoice PDF
 * Exactly replicates the HTML template layout with Cairo font
 */
export async function generateArabicShipmentInvoicePDF(
  invoice: Invoice,
  options?: { shippingCost?: number }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const innerMargin = 20;

  // Load and register Cairo font
  try {
    const cairoBase64 = await loadFontAsBase64(CairoFontUrl);
    doc.addFileToVFS('Cairo-Regular.ttf', cairoBase64);
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'bold'); // Use same font for bold
  } catch (e) {
    console.error('Could not load Cairo font:', e);
    // Fallback to helvetica if font fails
  }

  // Load logos
  let logosTextBase64: string | null = null;
  let logo2Base64: string | null = null;
  try {
    [logosTextBase64, logo2Base64] = await Promise.all([
      loadImageAsBase64(LogosText),
      loadImageAsBase64(Logo2),
    ]);
  } catch (e) {
    console.warn('Could not load logos:', e);
  }

  // Extract shipment data
  const shipments = extractShipmentData(invoice.items);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(shipments.length / itemsPerPage));

  // Calculate totals
  const totalWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
  const totalExtraCosts = shipments.reduce((sum, s) => sum + s.extraCosts, 0);
  const shippingCost = options?.shippingCost || 0;

  // Get user info
  const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
  const userFullName = userId ? `${userId.firstName} ${userId.lastName}` : '';
  const issueDate = invoice.issueDate 
    ? formatDateFns(new Date(invoice.issueDate), 'yyyy/MM/dd') 
    : formatDateFns(new Date(), 'yyyy/MM/dd');

  // Generate pages
  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage();
    }

    // ===== BLUE BORDERS (Top & Bottom) =====
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 5, 'F'); // Top border
    doc.rect(0, pageHeight - 5, pageWidth, 5, 'F'); // Bottom border

    // ===== WATERMARK (Center background) =====
    if (logosTextBase64) {
      doc.saveGraphicsState();
      // @ts-ignore - setGState exists in jsPDF
      doc.setGState(new doc.GState({ opacity: 0.1 }));
      const watermarkWidth = 120;
      const watermarkHeight = 40;
      doc.addImage(
        logosTextBase64,
        'PNG',
        (pageWidth - watermarkWidth) / 2,
        (pageHeight - watermarkHeight) / 2,
        watermarkWidth,
        watermarkHeight
      );
      doc.restoreGraphicsState();
    }

    // ===== HEADER SECTION (First page only) =====
    if (page === 0) {
      let yPos = margin + 10;

      // Set Cairo font for Arabic text
      doc.setFont('Cairo', 'normal');

      // === LEFT SIDE: Invoice Number & Logo ===
      doc.setFontSize(14);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(`#${invoice.invoiceNumber}`, margin, yPos + 5);

      if (logo2Base64) {
        doc.addImage(logo2Base64, 'PNG', margin, yPos + 10, 50, 17);
      }

      // === RIGHT SIDE: فاتورة title ===
      doc.setFontSize(36);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('فاتورة', pageWidth - margin, yPos, { align: 'right' });

      yPos += 15;

      // Contact info
      doc.setFontSize(12);
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('0919497423', pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
      doc.text('info@mazexpress.com.ly', pageWidth - margin, yPos, { align: 'right' });

      yPos += 8;

      // Address
      doc.text('الفويهات، ارض بن علي، شارع الاندلس', pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
      doc.text('بنغازي, ليبيا', pageWidth - margin, yPos, { align: 'right' });

      yPos += 12;

      // Date row
      doc.setFontSize(11);
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text('التاريخ', pageWidth - margin, yPos, { align: 'right' });
      doc.text(issueDate, pageWidth - margin - 45, yPos, { align: 'right' });

      yPos += 7;

      // Name row
      doc.text('الاسم', pageWidth - margin, yPos, { align: 'right' });
      doc.text(userFullName, pageWidth - margin - 45, yPos, { align: 'right' });
    }

    // ===== ITEMS TABLE =====
    const tableStartY = page === 0 ? 95 : 20;
    const startIdx = page * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, shipments.length);
    const pageShipments = shipments.slice(startIdx, endIdx);

    // Table headers (RTL order - right to left)
    const tableHeaders = [
      ['رقم', 'وزن الطرد KG', 'ابعاد الطرد CM', 'CBM', 'الوزن بالابعاد', 'تكاليف إضافية'],
    ];

    // Table data (RTL order)
    const tableData = pageShipments.map((shipment, idx) => {
      const rowNum = startIdx + idx + 1;
      const dimensions = `${shipment.length} X ${shipment.width} X ${shipment.height}`;
      const cbm = shipment.length * shipment.width * shipment.height;
      const volumetricWeight = calculateVolumetricWeight(shipment.length, shipment.width, shipment.height);

      return [
        rowNum.toString(),
        shipment.weight.toString(),
        dimensions,
        cbm.toString(),
        volumetricWeight.toFixed(2),
        shipment.extraCosts.toString(),
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: tableHeaders,
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: colors.headerBg,
        textColor: colors.white,
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 4,
        font: 'Cairo',
      },
      bodyStyles: {
        fontSize: 9,
        textColor: colors.textDark,
        halign: 'center',
        valign: 'middle',
        cellPadding: 3,
        font: 'Cairo',
        lineColor: colors.borderLight,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 18 }, // رقم
        1: { cellWidth: 28 }, // وزن الطرد
        2: { cellWidth: 42 }, // ابعاد الطرد
        3: { cellWidth: 28 }, // CBM
        4: { cellWidth: 30 }, // الوزن بالابعاد
        5: { cellWidth: 28 }, // تكاليف إضافية
      },
      styles: {
        overflow: 'linebreak',
        font: 'Cairo',
      },
      margin: { left: margin, right: margin },
      tableLineColor: colors.borderLight,
      tableLineWidth: 0.2,
      didDrawCell: (data) => {
        // Draw vertical dividers between header cells
        if (data.section === 'head' && data.column.index < 5) {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.line(x + width, y + 3, x + width, y + height - 3);
        }
        // Draw bottom border for body rows
        if (data.section === 'body') {
          const { x, y, width, height } = data.cell;
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.2);
          doc.line(x, y + height, x + width, y + height);
        }
      },
      didDrawPage: (data) => {
        // Round corners effect for header (approximate with filled rect)
        if (data.pageNumber === 1) {
          // This is handled by the table styling
        }
      },
    });

    // ===== SUMMARY TABLE & FOOTER (Last page only) =====
    const isLastPage = page === totalPages - 1;
    
    if (isLastPage) {
      const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
      let yPos = finalY + 12;

      // Summary table headers (RTL order)
      const summaryHeaders = [
        ['عدد الطرود', 'إجمالي الوزن KG', 'سعر الكيلو بالدولار', 'تكاليف إضافية'],
      ];

      const summaryData = [
        [
          shipments.length.toString(),
          `${totalWeight.toFixed(2)} KG`,
          shippingCost > 0 ? shippingCost.toString() : '-',
          totalExtraCosts.toString(),
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: summaryHeaders,
        body: summaryData,
        theme: 'plain',
        headStyles: {
          fillColor: colors.headerBg,
          textColor: colors.white,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 4,
          font: 'Cairo',
        },
        bodyStyles: {
          fontSize: 10,
          textColor: colors.textDark,
          halign: 'center',
          valign: 'middle',
          cellPadding: 4,
          fontStyle: 'bold',
          font: 'Cairo',
        },
        styles: {
          font: 'Cairo',
        },
        margin: { left: margin + 15, right: margin + 15 },
        tableWidth: pageWidth - margin * 2 - 30,
        didDrawCell: (data) => {
          // Draw vertical dividers between header cells
          if (data.section === 'head' && data.column.index < 3) {
            const { x, y, width, height } = data.cell;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.3);
            doc.line(x + width, y + 3, x + width, y + height - 3);
          }
        },
      });

      // Total Price
      const summaryFinalY = (doc as any).lastAutoTable?.finalY || yPos + 25;
      yPos = summaryFinalY + 15;

      doc.setFont('Cairo', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      
      const totalPriceText = `إجمالي السعر ${invoice.totals.gross.toFixed(2)} دينار`;
      doc.text(totalPriceText, pageWidth - margin, yPos, { align: 'right' });

      // Disclaimer lines
      yPos += 12;
      doc.setFont('Cairo', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);

      disclaimerLines.forEach((line) => {
        doc.text(line, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
      });
    }
  }

  // Save PDF
  const filename = `invoice-${invoice.invoiceNumber || 'draft'}-arabic-${formatDateFns(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}
