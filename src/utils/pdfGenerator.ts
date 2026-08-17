// src/utils/pdfGenerator.ts
import html2canvasPro from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export interface PdfOptions {
  filename?: string;
  margin?: number | [number, number, number, number];
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'mm' | 'cm' | 'in';
  format?: 'a4' | 'letter' | 'legal';
  isBlackAndWhite?: boolean;
  colorMode?: 'color' | 'bw';
}

const oklchCache = new Map<string, string>();

/**
 * Normalizes CSS colors (oklch, lab, color(srgb...), hwb) to valid RGB values
 * using browser computed style parsing as fallback.
 */
export function convertOklchToRgb(colorStr: string): string {
  const trimmed = colorStr.trim();
  if (oklchCache.has(trimmed)) return oklchCache.get(trimmed)!;

  let res = '#1e293b';
  if (typeof document !== 'undefined') {
    try {
      const div = document.createElement('div');
      div.style.color = 'rgb(0, 0, 0)';
      div.style.color = trimmed;
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div).color;
      document.body.removeChild(div);
      if (computed && computed !== '' && !computed.includes('rgba(0, 0, 0, 0)')) {
        res = computed;
      }
    } catch {
      res = '#1e293b';
    }
  }
  oklchCache.set(trimmed, res);
  return res;
}

/**
 * Replaces any unsupported CSS color functions (oklch, lab, color, hwb) in a CSS string with RGB equivalents
 */
export function sanitizeCssText(cssText: string): string {
  if (!cssText) return cssText;
  if (
    !cssText.includes('oklch') &&
    !cssText.includes('lab(') &&
    !cssText.includes('color(') &&
    !cssText.includes('hwb(')
  ) {
    return cssText;
  }

  return cssText
    .replace(/oklch\s*\([\s\S]*?\)/gi, (match) => convertOklchToRgb(match))
    .replace(/lab\s*\([\s\S]*?\)/gi, (match) => convertOklchToRgb(match))
    .replace(/color\s*\([\s\S]*?\)/gi, (match) => convertOklchToRgb(match))
    .replace(/hwb\s*\([\s\S]*?\)/gi, (match) => convertOklchToRgb(match));
}

/**
 * Sanitizes style tags and element inline styles in cloned DOM trees before rendering canvas
 */
function sanitizeDocumentStylesheets(clonedDoc: Document) {
  // 1. Aggregate styles from accessible styleSheets
  let aggregatedCss = '';
  try {
    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
      try {
        if (sheet.cssRules) {
          const rules = Array.from(sheet.cssRules);
          for (const rule of rules) {
            aggregatedCss += rule.cssText + '\n';
          }
        }
      } catch {
        // Cross-origin stylesheet - skip
      }
    }
  } catch (e) {
    console.warn('Error al leer document.styleSheets:', e);
  }

  // 2. Sanitize existing <style> tags in clonedDoc
  const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
  styleTags.forEach((style) => {
    if (style.textContent) {
      style.textContent = sanitizeCssText(style.textContent);
    }
  });

  // 3. Remove non-essential external stylesheets
  const linkTags = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
  linkTags.forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (!href.includes('fonts.googleapis') && !href.includes('gstatic') && !href.includes('fontawesome')) {
      link.remove();
    }
  });

  // 4. Inject sanitized CSS
  if (aggregatedCss) {
    const sanitizedStyle = clonedDoc.createElement('style');
    sanitizedStyle.setAttribute('data-pdf-sanitized', 'true');
    sanitizedStyle.textContent = sanitizeCssText(aggregatedCss);
    clonedDoc.head.appendChild(sanitizedStyle);
  }

  // 5. Sanitize inline styles
  const styledElements = Array.from(clonedDoc.querySelectorAll('[style]'));
  styledElements.forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      el.setAttribute('style', sanitizeCssText(styleAttr));
    }
  });
}

function preparePrintContainer(
  element: HTMLElement,
  orientation: 'portrait' | 'landscape' = 'portrait',
  isBw: boolean = false
) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = orientation === 'landscape' ? '297mm' : '210mm';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.padding = '12px';

  const clone = element.cloneNode(true) as HTMLElement;
  if (isBw) {
    clone.style.filter = 'grayscale(100%) contrast(140%)';
  }

  // 1. Strip print-hidden elements
  const hiddenInPrint = clone.querySelectorAll('.print\\:hidden');
  hiddenInPrint.forEach((el) => el.remove());

  // 2. Convert form elements (input, textarea, select) to static text for pristine formal printing
  const inputs = clone.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    const htmlInput = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const val = htmlInput.value || htmlInput.getAttribute('placeholder') || '';
    const span = document.createElement('span');
    span.textContent = val;
    span.className = htmlInput.className;
    span.style.color = '#000000';
    span.style.border = 'none';
    span.style.background = 'transparent';
    span.style.fontWeight = 'bold';
    if (htmlInput.parentNode) {
      htmlInput.parentNode.replaceChild(span, htmlInput);
    }
  });

  // 3. Clean root clone background
  clone.classList.remove('bg-slate-900', 'bg-slate-950', 'text-white', 'text-slate-200');
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';

  // 4. Transform ALL sub-elements to ultra-formal pristine black & white layout without gray shading or overlapping text
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;

    // Sanitize any inline styles with unsupported color functions
    const styleAttr = htmlEl.getAttribute('style');
    if (styleAttr) {
      htmlEl.setAttribute('style', sanitizeCssText(styleAttr));
    }

    const tagName = htmlEl.tagName.toUpperCase();

    // Prevent text overlapping ("letras montadas") with clean line heights and dynamic container heights
    htmlEl.style.lineHeight = '1.4';
    if (htmlEl.style.height && htmlEl.style.height !== 'auto') {
      htmlEl.style.minHeight = htmlEl.style.height;
      htmlEl.style.height = 'auto';
    }

    // Page breaking rules for crisp multi-page document ordering ("ordene las hojas")
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tagName)) {
      htmlEl.style.pageBreakAfter = 'avoid';
      htmlEl.style.breakAfter = 'avoid';
      htmlEl.style.marginTop = '10px';
      htmlEl.style.marginBottom = '6px';
      htmlEl.style.color = '#000000';
    }

    if (['TR', 'TABLE', 'SECTION', 'ARTICLE'].includes(tagName) || htmlEl.classList.contains('grid') || htmlEl.classList.contains('border')) {
      htmlEl.style.pageBreakInside = 'avoid';
      htmlEl.style.breakInside = 'avoid';
    }

    // Force ALL backgrounds to pure white (#ffffff) to eliminate gray shading/underline blocks ("quites el color gris")
    htmlEl.style.backgroundColor = '#ffffff';

    const computedClass = htmlEl.className || '';
    if (typeof computedClass === 'string') {
      // Set text to solid black
      if (
        /\btext-(fuchsia|emerald|teal|amber|rose|blue|indigo|cyan|purple|green|red|yellow|slate)-\d+\b/.test(computedClass) ||
        htmlEl.classList.contains('text-white') ||
        htmlEl.classList.contains('text-slate-200') ||
        htmlEl.classList.contains('text-slate-300')
      ) {
        htmlEl.style.color = '#000000';
      } else if (htmlEl.classList.contains('text-slate-400') || htmlEl.classList.contains('text-slate-500')) {
        htmlEl.style.color = '#334155';
      }

      // Neutralize borders to clean thin gray/slate lines
      if (
        htmlEl.classList.contains('border-slate-800') ||
        htmlEl.classList.contains('border-slate-700') ||
        /\bborder-(fuchsia|emerald|teal|amber|rose|blue|indigo|cyan|purple|green|red|yellow|slate)-\d+\b/.test(computedClass)
      ) {
        htmlEl.style.borderColor = '#cbd5e1';
      }
    }

    // Table cells styling for formal reports
    if (tagName === 'TH' || tagName === 'TD') {
      htmlEl.style.backgroundColor = '#ffffff';
      htmlEl.style.borderColor = '#cbd5e1';
      htmlEl.style.color = '#000000';
      htmlEl.style.padding = '6px 8px';
    }

    // Force SVGs / icons to be dark/black for formal corporate print
    if (tagName === 'SVG') {
      htmlEl.style.color = '#000000';
      htmlEl.style.fill = 'currentColor';
    }
  });

  container.appendChild(clone);
  return container;
}

function buildHtml2PdfOptions(options: PdfOptions) {
  const {
    filename = 'documento-neovolt.pdf',
    margin = 8,
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
  } = options;

  return {
    margin,
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'landscape' ? 1200 : 800,
      onclone: (clonedDoc: Document) => {
        sanitizeDocumentStylesheets(clonedDoc);
      },
    },
    jsPDF: {
      unit,
      format,
      orientation,
    },
  };
}

/**
 * Downloads a high-resolution PDF from a DOM element using html2canvas-pro & jsPDF
 */
export async function downloadPdfFromElement(
  element: HTMLElement | null,
  options: PdfOptions = {}
): Promise<boolean> {
  if (!element) {
    console.warn('Elemento no encontrado para generación de PDF, ejecutando vista de impresión.');
    window.print();
    return false;
  }

  const orientation = options.orientation || 'portrait';
  const marginNum = typeof options.margin === 'number' ? options.margin : 8;
  const filename = options.filename
    ? options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`
    : 'documento-neovolt.pdf';

  const isBw = !!(options.isBlackAndWhite || options.colorMode === 'bw');
  const container = preparePrintContainer(element, orientation, isBw);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvasPro(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'landscape' ? 1200 : 800,
      onclone: (clonedDoc: Document) => {
        sanitizeDocumentStylesheets(clonedDoc);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation,
      unit: (options.unit as any) || 'mm',
      format: (options.format as any) || 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - marginNum * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = marginNum;

    pdf.addImage(imgData, 'JPEG', marginNum, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - marginNum * 2);

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + marginNum;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', marginNum, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - marginNum * 2);
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error durante la generación del archivo PDF con html2canvas-pro:', err);
    try {
      const pdfOpt = buildHtml2PdfOptions(options);
      await html2pdf().set(pdfOpt).from(container).save();
      return true;
    } catch (fallbackErr) {
      console.error('Error final en la generación de PDF:', fallbackErr);
      window.print();
      return false;
    }
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

/**
 * Generates a PDF Blob from a DOM element for direct sharing (WhatsApp, Email, WebShare API)
 */
export async function generatePdfBlob(
  element: HTMLElement | null,
  options: PdfOptions = {}
): Promise<Blob | null> {
  if (!element) return null;

  const orientation = options.orientation || 'portrait';
  const marginNum = typeof options.margin === 'number' ? options.margin : 8;

  const container = preparePrintContainer(element, orientation);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvasPro(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: orientation === 'landscape' ? 1200 : 800,
      onclone: (clonedDoc: Document) => {
        sanitizeDocumentStylesheets(clonedDoc);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      orientation,
      unit: (options.unit as any) || 'mm',
      format: (options.format as any) || 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - marginNum * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = marginNum;

    pdf.addImage(imgData, 'JPEG', marginNum, position, contentWidth, contentHeight);
    heightLeft -= (pdfHeight - marginNum * 2);

    while (heightLeft > 0) {
      position = heightLeft - contentHeight + marginNum;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', marginNum, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - marginNum * 2);
    }

    return pdf.output('blob');
  } catch (err) {
    console.error('Error al generar Blob de PDF con html2canvas-pro:', err);
    try {
      const pdfOpt = buildHtml2PdfOptions(options);
      const worker = html2pdf().set(pdfOpt).from(container);
      return await worker.output('blob');
    } catch (fallbackErr) {
      console.error('Error al generar Blob en fallback:', fallbackErr);
      return null;
    }
  } finally {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
}

import { getNeovoltLogoDataUrl } from '../components/NeovoltLogo';

/**
 * Direct jsPDF vector generator with professional letterhead, authentic NEOVOLT branding, and autoTable
 */
export async function exportQuoteJsPdf(data: {
  items: Array<{ id: string; name: string; quantity: number; price: number; category: string; unit?: string; skuCode?: string }>;
  customer: { name: string; rut?: string; address?: string; city?: string; phone?: string; email?: string };
  contractor: {
    companyName: string;
    rut?: string;
    installerName: string;
    secLicense?: string;
    secClass?: string;
    phone?: string;
    email?: string;
    customLogoUrl?: string;
    bankDetails?: { bankName: string; accountType: string; accountNumber: string; holderName: string; holderRut: string; emailForNotify: string };
  };
  laborCost: number;
  includeContingency15: boolean;
  clauses?: Array<{ id: string; title: string; content: string }>;
  signatureDataUrl?: string;
}): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Fetch authentic Neovolt logo (or contractor's custom logo)
  let logoData = data.contractor.customLogoUrl;
  if (!logoData) {
    logoData = await getNeovoltLogoDataUrl(false);
  }

  // 1. Membrete Encabezado Corporativo Oficial
  const headerHeight = 32;
  doc.setFillColor(11, 15, 25); // Deep corporate black #0B0F19
  doc.rect(0, 0, 210, headerHeight, 'F');

  // Cyan Accent Line (#00E5FF)
  doc.setFillColor(0, 229, 255);
  doc.rect(0, 0, 210, 2.5, 'F');

  // Magenta Accent Tag (#E83D84)
  doc.setFillColor(232, 61, 132);
  doc.rect(0, 2.5, 4, headerHeight - 2.5, 'F');

  let textLeft = 14;

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 12, 5.5, 48, 22);
      textLeft = 65;
    } catch {
      textLeft = 14;
    }
  }

  // Company Details inside Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(data.contractor.companyName || 'NEOVOLT - PROYECTOS ELÉCTRICOS', textLeft, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`RUT: ${data.contractor.rut || '77.892.100-K'} | Instalador: ${data.contractor.installerName} (${data.contractor.secLicense ? `SEC ${data.contractor.secLicense}` : 'Certificado SEC'})`, textLeft, 18);
  doc.text(`Email: ${data.contractor.email || 'contacto@neovolt.cl'} | Fono: ${data.contractor.phone || '+56 9 8765 4321'}`, textLeft, 23);

  // Folio & Quote Badge (Right Side)
  const today = new Date().toLocaleDateString('es-CL');
  const folioNum = `COT-${Date.now().toString().slice(-6)}`;

  doc.setFillColor(22, 30, 49); // slate-800
  doc.roundedRect(144, 5, 52, 23, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 229, 255); // Cyan
  doc.text('PRESUPUESTO OFICIAL', 170, 10, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(folioNum, 170, 16.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.text(`Emisión: ${today}`, 170, 22, { align: 'center' });

  // 2. Datos del Cliente & Ubicación de Obra
  doc.setTextColor(15, 23, 42);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.rect(14, 38, 182, 21, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DATOS DEL CLIENTE Y UBICACIÓN DE OBRA:', 18, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Cliente: ${data.customer.name || 'Cliente Particular'} (RUT: ${data.customer.rut || 'N/A'})`, 18, 50);
  doc.text(`Dirección: ${data.customer.address || 'Chile'} - ${data.customer.city || ''}`, 18, 55);
  doc.text(`Contacto: ${data.customer.phone || 'N/A'} | Email: ${data.customer.email || 'N/A'}`, 110, 50);

  // 3. Tabla de Materiales e Insumos (autoTable)
  const tableData = data.items.map((item, idx) => [
    (idx + 1).toString(),
    item.name,
    item.category || 'MATERIAL',
    item.quantity.toString(),
    `$${item.price.toLocaleString('es-CL')}`,
    `$${(item.quantity * item.price).toLocaleString('es-CL')}`,
  ]);

  const rawMaterialsTotal = data.items.reduce((s, i) => s + i.quantity * i.price, 0);

  autoTable(doc, {
    startY: 64,
    head: [['#', 'Descripción de Materiales e Insumos', 'Categoría', 'Cant.', 'Unit. CLP', 'Subtotal CLP']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 15, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 32 },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 23, halign: 'right' },
    },
  });

  // Get final Y after autoTable
  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 100;

  if (finalY > 220) {
    doc.addPage();
    finalY = 20;
  }

  // 4. Resumen Financiero de Costos
  const baseSubtotal = rawMaterialsTotal + data.laborCost;
  const contingencyVal = data.includeContingency15 ? baseSubtotal * 0.15 : 0;
  const totalFinalCLP = baseSubtotal + contingencyVal;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(110, finalY, 86, 38, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text(`Total Materiales e Insumos:`, 114, finalY + 6);
  doc.text(`$${rawMaterialsTotal.toLocaleString('es-CL')} CLP`, 190, finalY + 6, { align: 'right' });

  doc.text(`Mano de Obra Especializada SEC:`, 114, finalY + 12);
  doc.text(`$${data.laborCost.toLocaleString('es-CL')} CLP`, 190, finalY + 12, { align: 'right' });

  if (data.includeContingency15) {
    doc.text(`Imprevistos de Obra (15%):`, 114, finalY + 18);
    doc.text(`$${contingencyVal.toLocaleString('es-CL')} CLP`, 190, finalY + 18, { align: 'right' });
  }

  doc.setLineWidth(0.4);
  doc.setDrawColor(11, 15, 25);
  doc.line(114, finalY + 23, 190, finalY + 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(11, 15, 25);
  doc.text(`TOTAL FINAL:`, 114, finalY + 31);
  doc.text(`$${totalFinalCLP.toLocaleString('es-CL')} CLP`, 190, finalY + 31, { align: 'right' });

  // Datos Bancarios (Lado izquierdo)
  if (data.contractor.bankDetails) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(11, 15, 25);
    doc.text('DATOS PARA TRANSFERENCIA BANCARIA:', 14, finalY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Banco: ${data.contractor.bankDetails.bankName}`, 14, finalY + 12);
    doc.text(`Tipo Cuenta: ${data.contractor.bankDetails.accountType} N° ${data.contractor.bankDetails.accountNumber}`, 14, finalY + 17);
    doc.text(`Titular: ${data.contractor.bankDetails.holderName} (RUT: ${data.contractor.bankDetails.holderRut})`, 14, finalY + 22);
    doc.text(`Email Comprobante: ${data.contractor.bankDetails.emailForNotify}`, 14, finalY + 27);
  }

  // 5. Cláusulas del Contrato
  let clauseY = finalY + 44;
  if (data.clauses && data.clauses.length > 0) {
    if (clauseY > 210) {
      doc.addPage();
      clauseY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(11, 15, 25);
    doc.text('CONDICIONES Y CLÁUSULAS CONTRACTUALES RIC SEC:', 14, clauseY);
    clauseY += 5;

    data.clauses.forEach((c) => {
      if (clauseY > 265) {
        doc.addPage();
        clauseY = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(11, 15, 25);
      doc.text(c.title, 14, clauseY);
      clauseY += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitText = doc.splitTextToSize(c.content, 182);
      doc.text(splitText, 14, clauseY);
      clauseY += splitText.length * 3.5 + 2;
    });
  }

  // 6. Firma digital si existe
  if (data.signatureDataUrl) {
    if (clauseY > 230) {
      doc.addPage();
      clauseY = 20;
    }
    try {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(11, 15, 25);
      doc.text('FIRMA DE ACEPTACIÓN DEL CLIENTE:', 14, clauseY + 4);
      doc.addImage(data.signatureDataUrl, 'PNG', 14, clauseY + 6, 45, 18);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Firmado digitalmente por: ${data.customer.name}`, 14, clauseY + 27);
    } catch (e) {
      console.warn('No se pudo insertar la firma en PDF:', e);
    }
  }

  const clientSlug = (data.customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Cotizacion_Oficial_${clientSlug}.pdf`);
  return doc;
}

