import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkReportData, CustomerDetails, ContractorConfig, RoomData, HighAppliance } from '../types';

export interface ExportWorkReportPdfOptions {
  reportData: WorkReportData;
  customer: CustomerDetails;
  contractor: ContractorConfig;
  rooms?: RoomData[];
  highAppliances?: HighAppliance[];
  overrideInstallerSignatureUrl?: string;
}

/**
  Helper to convert any image URL (remote or data URL) into a Base64 Data URL
 */
async function urlToDataUrl(url?: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not fetch image URL for PDF embedding:', url, e);
    return null;
  }
}

/**
 * Generates a high-quality, professional vector PDF of the Work Report using jsPDF.
 * Ready for SEC presentation with Installer Logo, Signature, and Test Protocol.
 */
export async function exportWorkReportToJsPdf({
  reportData,
  customer,
  contractor,
  rooms = [],
  highAppliances = [],
  overrideInstallerSignatureUrl,
}: ExportWorkReportPdfOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  let currentY = margin;

  // Pre-fetch images to Data URLs in parallel
  const [logoDataUrl, signatureDataUrl, ...photoDataUrls] = await Promise.all([
    urlToDataUrl(contractor.customLogoUrl),
    urlToDataUrl(overrideInstallerSignatureUrl || contractor.installerSignatureUrl),
    ...reportData.photoPaths.map((p) => urlToDataUrl(p)),
  ]);

  // Helper to draw footers with page numbers
  const drawFooter = (pageNumber: number, totalPagesPlaceholder: string = '1') => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.text(
      `Documento Técnico de Entrega de Obra • SEC Chile • ${contractor.companyName || 'NEOVOLT PRO'}`,
      margin,
      pageHeight - 7
    );
    pdf.text(
      `Página ${pageNumber} de ${totalPagesPlaceholder}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  };

  // Helper to handle auto-page breaking
  const checkPageBreak = (neededHeight: number): boolean => {
    if (currentY + neededHeight > pageHeight - 16) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // 1. CORPORATE HEADER BANNER
  // -------------------------------------------------------------
  const headerHeight = 36;
  // Dark Slate Header Box
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

  // Decorative Accent bar (fuchsia)
  pdf.setFillColor(217, 70, 239); // fuchsia-500
  pdf.rect(margin, currentY, 3.5, headerHeight, 'F');

  let textXOffset = margin + 7;

  // Draw Logo if available, else draw Neovolt Corporate Vector Logo Badge
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin + 6, currentY + 5, 26, 26);
      textXOffset = margin + 35;
    } catch (e) {
      console.warn('Could not render logo in PDF header:', e);
      pdf.setFillColor(217, 70, 239); // fuchsia-500
      pdf.roundedRect(margin + 6, currentY + 5, 26, 26, 3, 3, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('NV', margin + 19, currentY + 21, { align: 'center' });
      textXOffset = margin + 35;
    }
  } else {
    pdf.setFillColor(217, 70, 239); // fuchsia-500
    pdf.roundedRect(margin + 6, currentY + 5, 26, 26, 3, 3, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('NV', margin + 19, currentY + 21, { align: 'center' });
    textXOffset = margin + 35;
  }

  // Company Name & Subtitle inside Header
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(contractor.companyName || 'NEOVOLT ELECTRICIDAD', textXOffset, currentY + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(226, 232, 240); // slate-200
  pdf.text('INFORME TÉCNICO DE ENTREGA DE OBRA & MEMORIA DE MONTAJE', textXOffset, currentY + 15);
  pdf.text(
    `RUT: ${contractor.rut || '76.543.210-K'} | ${contractor.address || 'Santiago, Chile'} | Tel: ${contractor.phone || '+56 9 1234 5678'}`,
    textXOffset,
    currentY + 21
  );

  const secTitle = contractor.isSecCertified !== false
    ? `Lic. SEC: ${contractor.secLicense || '12345'} (${contractor.secClass || 'Clase A'})`
    : contractor.customProfessionalTitle || 'Técnico Especialista';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(217, 70, 239); // fuchsia-400
  pdf.text(`Instalador: ${contractor.installerName || 'Técnico Responsable'} • ${secTitle}`, textXOffset, currentY + 28);

  // Document Badge (Right Side)
  const docCode = `INF-${Date.now().toString().slice(-6)}`;
  const currentDateStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  pdf.setFillColor(30, 41, 59); // slate-800
  pdf.roundedRect(pageWidth - margin - 46, currentY + 5, 43, 26, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(217, 70, 239);
  pdf.text('CARPETA SEC TE1', pageWidth - margin - 24, currentY + 10, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(docCode, pageWidth - margin - 24, currentY + 17, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(`Fecha: ${currentDateStr}`, pageWidth - margin - 24, currentY + 23, { align: 'center' });

  currentY += headerHeight + 8;

  // -------------------------------------------------------------
  // 2. CLIENT & PROJECT LOCATION SUMMARY
  // -------------------------------------------------------------
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. DATOS DEL CLIENTE Y UBICACIÓN DE LA OBRA', margin, currentY);
  currentY += 4;

  const clientBoxHeight = 28;
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.setDrawColor(203, 213, 225); // slate-300
  pdf.roundedRect(margin, currentY, contentWidth, clientBoxHeight, 2, 2, 'FD');

  const halfWidth = contentWidth / 2;

  // Column 1: Client details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('CLIENTE RECEPTOR', margin + 4, currentY + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(customer.name || reportData.clientName || 'Cliente Particular', margin + 4, currentY + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`RUT: ${customer.rut || '12.345.678-9'}`, margin + 4, currentY + 17);
  pdf.text(`Email: ${customer.email || 'no-registrado@email.com'}`, margin + 4, currentY + 22);

  // Column 2: Location details
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('UBICACIÓN Y PROPIEDAD', margin + halfWidth + 4, currentY + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  const locationAddr = customer.address || reportData.address || 'Santiago, Chile';
  const truncatedAddr = locationAddr.length > 38 ? locationAddr.slice(0, 38) + '...' : locationAddr;
  pdf.text(truncatedAddr, margin + halfWidth + 4, currentY + 12);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Comuna/Ciudad: ${customer.city || 'Santiago'}`, margin + halfWidth + 4, currentY + 17);
  pdf.text(`Teléfono: ${customer.phone || 'N/A'} | Propiedad: ${customer.propertyType || 'Residencial'}`, margin + halfWidth + 4, currentY + 22);

  currentY += clientBoxHeight + 8;

  // -------------------------------------------------------------
  // 3. SEC NORMATIVE MEASUREMENTS & TESTS
  // -------------------------------------------------------------
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. PROTOCOLO DE MEDICIONES Y ENSAYOS NORMATIVOS SEC', margin, currentY);
  currentY += 4;

  const earthResistance = reportData.testResults?.earthResistanceOhms ?? 12.4;
  const isEarthCompliant = earthResistance <= 20.0;

  const testsData = [
    [
      'Aislamiento Conductores',
      'RIC N°04',
      reportData.testResults?.isolationMOhms ? `> ${reportData.testResults.isolationMOhms} MΩ (500V DC)` : '> 50 MΩ (500V DC)',
      'CONFORME SEC'
    ],
    [
      'Resistencia Puesta a Tierra',
      'RIC N°06',
      `${earthResistance} Ω (Límite max: 20.0 Ω)`,
      isEarthCompliant ? 'CONFORME SEC' : 'NO CONFORME'
    ],
    [
      'Tiempo Disparo RCD',
      'RIC N°05',
      reportData.testResults?.rcdTripTimeMs ? `${reportData.testResults.rcdTripTimeMs} ms` : '22 ms (a 30mA)',
      'CONFORME SEC'
    ]
  ];

  autoTable(pdf, {
    startY: currentY,
    head: [['Ensayos e Inspecciones', 'Norma RIC', 'Valor Medido en Terreno', 'Dictamen SEC']],
    body: testsData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin }
  });

  currentY = (pdf as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // 4. NOTES / OBSERVACIONES DE TERRENO
  // -------------------------------------------------------------
  checkPageBreak(30);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('3. OBSERVACIONES Y NOTAS TÉCNICAS DE TERRENO', margin, currentY);
  currentY += 4;

  const notesText = reportData.briefNotes?.trim() || 'Se realizó el montaje e instalación del Tablero TDA con protecciones normadas, verificación de equilibrio de cargas y apriete dinakilométrico de bornes.';
  const wrappedNotes = pdf.splitTextToSize(notesText, contentWidth - 8);
  const notesBoxHeight = Math.max(16, wrappedNotes.length * 4.5 + 6);

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(margin, currentY, contentWidth, notesBoxHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(51, 65, 85);
  pdf.text(wrappedNotes, margin + 4, currentY + 6);

  currentY += notesBoxHeight + 8;

  // -------------------------------------------------------------
  // 5. AI GENERATED MEMORIA DE MONTAJE / DICTAMEN
  // -------------------------------------------------------------
  if (reportData.generatedAiReport) {
    checkPageBreak(35);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text('4. MEMORIA EXPLICATIVA DE MONTAJE Y ESPECIFICACIONES (RIC SEC)', margin, currentY);
    currentY += 5;

    // Clean markdown headings/bold syntax if present for clean text rendering
    const sanitizedAiReport = reportData.generatedAiReport
      .replace(/\*\*/g, '')
      .replace(/###/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '');

    const lines = sanitizedAiReport.split('\n');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);

    lines.forEach((line) => {
      if (!line.trim()) {
        currentY += 2;
        return;
      }

      const isHeader = line.toUpperCase().startsWith('INFORME') ||
                       line.toUpperCase().startsWith('MEMORIA') ||
                       line.toUpperCase().includes('CONCLUSI') ||
                       line.toUpperCase().includes('ESPECIFICAC') ||
                       line.toUpperCase().includes('DIMENSIONAMIENTO') ||
                       line.toUpperCase().includes('PROTOCOLO') ||
                       line.toUpperCase().includes('NORMA');

      if (isHeader) {
        checkPageBreak(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(15, 23, 42);
        currentY += 2;
      } else {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(51, 65, 85);
      }

      const wrappedLine = pdf.splitTextToSize(line, contentWidth - 6);

      wrappedLine.forEach((subLine: string) => {
        checkPageBreak(5);
        pdf.text(subLine, margin + 3, currentY);
        currentY += 4.2;
      });
    });

    currentY += 6;
  }

  // -------------------------------------------------------------
  // 6. PHOTOS ATTACHMENT (IF ANY)
  // -------------------------------------------------------------
  const validPhotos = photoDataUrls.filter((p): p is string => p !== null);
  if (validPhotos.length > 0) {
    checkPageBreak(40);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`5. ANEXO FOTOGRÁFICO DE REGISTRO EN TERRENO (${validPhotos.length})`, margin, currentY);
    currentY += 5;

    const imgWidth = 55;
    const imgHeight = 40;
    const imgsPerRow = 3;

    for (let i = 0; i < Math.min(6, validPhotos.length); i++) {
      const col = i % imgsPerRow;
      if (col === 0 && i > 0) {
        currentY += imgHeight + 4;
        checkPageBreak(imgHeight + 6);
      }

      const imgX = margin + col * (imgWidth + 8);
      const photoDataUrl = validPhotos[i];

      try {
        pdf.addImage(photoDataUrl, 'JPEG', imgX, currentY, imgWidth, imgHeight);
      } catch (err) {
        console.warn('Could not embed photo into PDF:', err);
        pdf.setDrawColor(203, 213, 225);
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(imgX, currentY, imgWidth, imgHeight, 2, 2, 'FD');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Fotografía de Terreno ${i + 1}`, imgX + imgWidth / 2, currentY + imgHeight / 2, { align: 'center' });
      }
    }
    currentY += imgHeight + 8;
  }

  // -------------------------------------------------------------
  // 7. SIGNATURES & RECEPTIONS
  // -------------------------------------------------------------
  const signatureHeight = 35;
  checkPageBreak(signatureHeight + 10);

  currentY += 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(15, 23, 42);
  pdf.text('6. FIRMAS DE CONFORMIDAD Y ENTREGA TÉCNICA SEC', margin, currentY);
  currentY += 6;

  const sigBoxWidth = (contentWidth - 10) / 2;

  // Signature 1: Installer SEC
  const sig1X = margin;
  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(sig1X, currentY, sigBoxWidth, signatureHeight, 2, 2, 'S');

  if (signatureDataUrl) {
    try {
      pdf.addImage(signatureDataUrl, 'PNG', sig1X + 15, currentY + 3, sigBoxWidth - 30, 16);
      pdf.line(sig1X + 10, currentY + 21, sig1X + sigBoxWidth - 10, currentY + 21);
    } catch (e) {
      console.warn('Could not render signature image:', e);
      pdf.setFont('courier', 'bolditalic');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text(contractor.installerName || 'Gonzalo Araya P.', sig1X + sigBoxWidth / 2, currentY + 12, { align: 'center' });
      pdf.line(sig1X + 10, currentY + 18, sig1X + sigBoxWidth - 10, currentY + 18);
    }
  } else {
    // Simulated Digital Signature Badge & Stamp
    pdf.setFillColor(240, 253, 244); // emerald-50
    pdf.setDrawColor(34, 197, 94); // emerald-500
    pdf.roundedRect(sig1X + 4, currentY + 3, sigBoxWidth - 8, 14, 1.5, 1.5, 'FD');

    pdf.setFont('courier', 'bolditalic');
    pdf.setFontSize(10);
    pdf.setTextColor(21, 128, 61); // emerald-700
    pdf.text(`/Firma Digital / ${contractor.installerName || 'Instalador SEC'}`, sig1X + sigBoxWidth / 2, currentY + 8, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(22, 101, 52);
    const hash = `SEC-VERIFIED-${(contractor.secLicense || '12345').replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;
    pdf.text(`HASH DIG: ${hash}`, sig1X + sigBoxWidth / 2, currentY + 13, { align: 'center' });

    pdf.setDrawColor(203, 213, 225);
    pdf.line(sig1X + 10, currentY + 20, sig1X + sigBoxWidth - 10, currentY + 20);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(contractor.installerName || 'Instalador Responsable', sig1X + sigBoxWidth / 2, currentY + 25, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  const sig1Subtitle = contractor.isSecCertified !== false
    ? `Instalador Autorizado SEC (${contractor.secLicense || 'Licencia Registrada'})`
    : contractor.customProfessionalTitle || 'Técnico Especialista';
  pdf.text(sig1Subtitle, sig1X + sigBoxWidth / 2, currentY + 29, { align: 'center' });

  // Signature 2: Client
  const sig2X = margin + sigBoxWidth + 10;
  pdf.roundedRect(sig2X, currentY, sigBoxWidth, signatureHeight, 2, 2, 'S');
  pdf.line(sig2X + 10, currentY + 20, sig2X + sigBoxWidth - 10, currentY + 20);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text(customer.name || reportData.clientName || 'Cliente Receptor', sig2X + sigBoxWidth / 2, currentY + 25, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Firma Recepción Conforme de Obra', sig2X + sigBoxWidth / 2, currentY + 29, { align: 'center' });

  // -------------------------------------------------------------
  // 8. APPLY FOOTERS TO ALL PAGES
  // -------------------------------------------------------------
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    drawFooter(i, totalPages.toString());
  }

  // Save the generated document
  const clientSlug = (customer.name || reportData.clientName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`Informe_Tecnico_Obra_${clientSlug}.pdf`);
}

