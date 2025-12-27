import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { format as formatDateFns } from 'date-fns';
import LogosText from '@/assets/Logos-text.png';

/**
 * Arabic Shipment Invoice PDF Generator
 * Replicates the exact layout from the HTML template
 * RTL support with Arabic text
 */

// Color palette
const colors = {
  primary: [2, 181, 224] as [number, number, number],
  textDark: [31, 41, 55] as [number, number, number],
  textMuted: [107, 114, 128] as [number, number, number],
  headerBg: [2, 181, 224] as [number, number, number], // Cyan header for table
  white: [255, 255, 255] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  tableBorder: [200, 200, 200] as [number, number, number],
};

// Arabic text - disclaimer lines
const disclaimerLines = [
  'يرجى مراعاة ان اقل وزن يمكن احتسابه هو 3 كيلو غرام.',
  'نؤكد أيضًا أننا نحتسب تكلفة الشحن بناًء على كل من الوزن الفعلي والوزن الحجمي، و يتم احتساب الأعلى منهما.',
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
 * Calculate CBM (Cubic Meter)
 */
function calculateCBM(length: number, width: number, height: number): number {
  return length * width * height;
}

/**
 * Calculate volumetric weight
 */
function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 5000;
}

/**
 * Reverse Arabic text for jsPDF (since jsPDF doesn't support RTL natively)
 * This is a simple reversal - for production, consider using a proper RTL library
 */
function reverseArabicText(text: string): string {
  // Split by spaces, reverse each word's characters, then join
  // This is a simplified approach for Arabic in jsPDF
  return text.split('').reverse().join('');
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
 * Generate Arabic Shipment Invoice PDF
 * Exactly replicates the HTML template layout
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

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Load logo
  let logoBase64: string | null = null;
  try {
    logoBase64 = await loadImageAsBase64(LogosText);
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  // Extract shipment data
  const shipments = extractShipmentData(invoice.items);
  const itemsPerPage = 12;
  const totalPages = Math.ceil(shipments.length / itemsPerPage);

  // Calculate totals
  const totalWeight = shipments.reduce((sum, s) => sum + s.weight, 0);
  const totalExtraCosts = shipments.reduce((sum, s) => sum + s.extraCosts, 0);
  const shippingCost = options?.shippingCost || 0;

  // Get user info
  const userId = typeof invoice.userId === 'object' ? invoice.userId : null;
  const userFullName = userId ? `${userId.firstName} ${userId.lastName}` : '';

  // Generate pages
  for (let page = 0; page < Math.max(totalPages, 1); page++) {
    if (page > 0) {
      doc.addPage();
    }

    // ===== WATERMARK LOGO (Background) =====
    if (logoBase64) {
      doc.saveGraphicsState();
      // @ts-ignore - setGState exists in jsPDF
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      const watermarkWidth = 150;
      const watermarkHeight = 50;
      doc.addImage(
        logoBase64,
        'PNG',
        (pageWidth - watermarkWidth) / 2,
        (pageHeight - watermarkHeight) / 2 - 20,
        watermarkWidth,
        watermarkHeight
      );
      doc.restoreGraphicsState();
    }

    // ===== HEADER SECTION (First page only) =====
    if (page === 0) {
      let yPos = margin;

      // "فاتورة" title - right aligned
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      doc.text(reverseArabicText('فاتورة'), pageWidth - margin, yPos + 10, { align: 'right' });

      // Invoice number with logo on left side
      doc.setFontSize(16);
      doc.text(`#${invoice.invoiceNumber}`, pageWidth - margin, yPos + 22, { align: 'right' });

      // Logo on left side
      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin, yPos, 60, 20);
      }

      yPos += 35;

      // Contact info - right aligned
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('0919497423', pageWidth - margin, yPos, { align: 'right' });
      doc.text('info@mazexpress.com.ly', pageWidth - margin, yPos + 6, { align: 'right' });

      yPos += 16;

      // Address - right aligned
      doc.text(reverseArabicText('الفويهات، ارض بن علي، شارع الاندلس'), pageWidth - margin, yPos, { align: 'right' });
      doc.text(reverseArabicText('بنغازي, ليبيا'), pageWidth - margin, yPos + 6, { align: 'right' });

      yPos += 16;

      // Date and Name rows
      const issueDate = invoice.issueDate ? formatDateFns(new Date(invoice.issueDate), 'yyyy/MM/dd') : formatDateFns(new Date(), 'yyyy/MM/dd');
      
      doc.setFont('helvetica', 'bold');
      doc.text(reverseArabicText('التاريخ'), pageWidth - margin, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(issueDate, pageWidth - margin - 40, yPos, { align: 'right' });

      doc.setFont('helvetica', 'bold');
      doc.text(reverseArabicText('الاسم'), pageWidth - margin, yPos + 7, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(userFullName, pageWidth - margin - 40, yPos + 7, { align: 'right' });
    }

    // ===== ITEMS TABLE =====
    const tableStartY = page === 0 ? 105 : 25;
    const startIdx = page * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, shipments.length);
    const pageShipments = shipments.slice(startIdx, endIdx);

    // Table headers (RTL order - reversed)
    const tableHeaders = [
      [
        reverseArabicText('تكاليف إضافية'),
        reverseArabicText('الوزن بالابعاد'),
        'CBM',
        reverseArabicText('ابعاد الطرد CM'),
        reverseArabicText('وزن الطرد KG'),
        reverseArabicText('رقم'),
      ],
    ];

    // Table data
    const tableData = pageShipments.map((shipment, idx) => {
      const rowNum = startIdx + idx + 1;
      const dimensions = `${shipment.height} X ${shipment.width} X ${shipment.length}`;
      const cbm = calculateCBM(shipment.length, shipment.width, shipment.height);
      const volumetricWeight = calculateVolumetricWeight(shipment.length, shipment.width, shipment.height);

      return [
        shipment.extraCosts.toString(),
        volumetricWeight.toFixed(2),
        cbm.toString(),
        dimensions,
        shipment.weight.toString(),
        rowNum.toString(),
      ];
    });

    autoTable(doc, {
      startY: tableStartY,
      head: tableHeaders,
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.headerBg,
        textColor: colors.white,
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 10,
        textColor: colors.textDark,
        halign: 'center',
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 28 }, // Extra costs
        1: { cellWidth: 28 }, // Volumetric weight
        2: { cellWidth: 25 }, // CBM
        3: { cellWidth: 40 }, // Dimensions
        4: { cellWidth: 28 }, // Weight
        5: { cellWidth: 20 }, // Row number
      },
      styles: {
        lineColor: colors.tableBorder,
        lineWidth: 0.3,
      },
      margin: { left: margin, right: margin },
    });

    // ===== SUMMARY TABLE & FOOTER (Last page only) =====
    const isLastPage = page === totalPages - 1 || shipments.length === 0;
    
    if (isLastPage) {
      const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + 50;
      let yPos = finalY + 15;

      // Summary table headers (RTL order)
      const summaryHeaders = [
        [
          reverseArabicText('تكاليف إضافية'),
          reverseArabicText('سعر الكيلو بالدولار'),
          reverseArabicText('إجمالي الوزن KG'),
          reverseArabicText('عدد الطرود'),
        ],
      ];

      const summaryData = [
        [
          totalExtraCosts.toString(),
          shippingCost > 0 ? shippingCost.toString() : '-',
          `${totalWeight.toFixed(2)} KG`,
          shipments.length.toString(),
        ],
      ];

      autoTable(doc, {
        startY: yPos,
        head: summaryHeaders,
        body: summaryData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.headerBg,
          textColor: colors.white,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 11,
          textColor: colors.textDark,
          halign: 'center',
          cellPadding: 4,
          fontStyle: 'bold',
        },
        styles: {
          lineColor: colors.tableBorder,
          lineWidth: 0.3,
        },
        margin: { left: margin + 20, right: margin + 20 },
      });

      // Total Price
      const summaryFinalY = (doc as any).lastAutoTable?.finalY || yPos + 30;
      yPos = summaryFinalY + 15;

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.textDark[0], colors.textDark[1], colors.textDark[2]);
      
      const totalPriceText = `${reverseArabicText('إجمالي السعر')} ${invoice.totals.gross.toFixed(2)} ${reverseArabicText('دينار')}`;
      doc.text(totalPriceText, pageWidth / 2, yPos, { align: 'center' });

      // Disclaimer lines
      yPos += 15;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);

      disclaimerLines.forEach((line, idx) => {
        const reversedLine = reverseArabicText(line);
        const splitLines = doc.splitTextToSize(reversedLine, pageWidth - margin * 2);
        splitLines.forEach((splitLine: string) => {
          doc.text(splitLine, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
        });
        if (idx < disclaimerLines.length - 1) {
          yPos += 2;
        }
      });
    }
  }

  // Save PDF
  const filename = `invoice-${invoice.invoiceNumber || 'draft'}-arabic-${formatDateFns(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
}
