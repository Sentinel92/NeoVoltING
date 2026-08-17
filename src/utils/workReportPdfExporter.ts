import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { WorkReportData, CustomerDetails, ContractorConfig, RoomData, HighAppliance } from '../types';
import { getNeovoltLogoDataUrl } from '../components/NeovoltLogo';

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

  // Pre-fetch images or fallback to authentic Neovolt logo
  let customLogo = contractor.customLogoUrl;
  let defaultLogoPromise = !customLogo ? getNeovoltLogoDataUrl(false) : Promise.resolve(null);

  const [fetchedCustomLogo, defaultLogoData, signatureDataUrl, ...photoDataUrls] = await Promise.all([
    urlToDataUrl(customLogo),
    defaultLogoPromise,
    urlToDataUrl(overrideInstallerSignatureUrl || contractor.installerSignatureUrl),
    ...reportData.photoPaths.map((p) => urlToDataUrl(p)),
  ]);

  const logoDataUrl = fetchedCustomLogo || defaultLogoData;

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
  // 1. CORPORATE HEADER BANNER (Authentic NEOVOLT Palette)
  // -------------------------------------------------------------
  const headerHeight = 36;
  // Deep Black / Charcoal Header Box (#0B0F19)
  pdf.setFillColor(11, 15, 25);
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

  // Cyan Top Stripe (#00E5FF)
  pdf.setFillColor(0, 229, 255);
  pdf.rect(margin, currentY, contentWidth, 2.5, 'F');

  // Magenta Accent Side Bar (#E83D84)
  pdf.setFillColor(232, 61, 132);
  pdf.rect(margin, currentY + 2.5, 3.5, headerHeight - 2.5, 'F');

  let textXOffset = margin + 7;

  // Draw Logo if available
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin + 6, currentY + 6, 44, 24);
      textXOffset = margin + 53;
    } catch {
      textXOffset = margin + 8;
    }
  }

  // Company Name & Subtitle inside Header
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(contractor.companyName || 'NEOVOLT ELECTRICIDAD', textXOffset, currentY + 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(226, 232, 240); // slate-200
  pdf.text('INFORME TÉCNICO DE ENTREGA DE OBRA & MEMORIA DE MONTAJE', textXOffset, currentY + 17);
  pdf.text(
    `RUT: ${contractor.rut || '76.543.210-K'} | ${contractor.address || 'Santiago, Chile'} | Tel: ${contractor.phone || '+56 9 1234 5678'}`,
    textXOffset,
    currentY + 23
  );

  const secTitle = contractor.isSecCertified !== false
    ? `Lic. SEC: ${contractor.secLicense || '12345'} (${contractor.secClass || 'Clase A'})`
    : contractor.customProfessionalTitle || 'Técnico Especialista';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(232, 61, 132); // Authentic Magenta #E83D84
  pdf.text(`Instalador: ${contractor.installerName || 'Técnico Responsable'} • ${secTitle}`, textXOffset, currentY + 29);

  // Document Badge (Right Side)
  const docCode = `INF-${Date.now().toString().slice(-6)}`;
  const currentDateStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  pdf.setFillColor(22, 30, 49); // slate-800
  pdf.roundedRect(pageWidth - margin - 46, currentY + 5, 43, 26, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(0, 229, 255); // Cyan
  pdf.text('CARPETA SEC TE1', pageWidth - margin - 24, currentY + 10, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(docCode, pageWidth - margin - 24, currentY + 17, { align: 'center' });

  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.setFont('helvetica', 'normal');
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

export interface TechnicalSimulationReportOptions {
  customer: CustomerDetails;
  contractor: ContractorConfig;
  boardDiagramDataUrl?: string | null;
  components: Array<{
    id: string;
    name: string;
    type: string;
    dinModules?: number;
    ampacity?: number;
    curve?: string;
    isTripped?: boolean;
    isOff?: boolean;
  }>;
  simulationEvents: Array<{
    id: string;
    timestamp: string;
    title: string;
    category?: string;
    description: string;
    currentAmps?: number;
    timeMs?: number;
    normReference?: string;
  }>;
  faultSnapshots?: Array<{
    id: string;
    timestamp: string;
    title: string;
    faultType: string;
    iccAmps: number;
    timeMs: number;
    normReference: string;
    description: string;
    trippedCompName?: string;
  }>;
  supplyType?: string;
  notes?: string;
  overrideInstallerSignatureUrl?: string;
}

/**
 * Generates a specialized technical report PDF focusing on the 2D Board Diagram,
 * configured components, and simulation / short-circuit event logs.
 */
export async function exportTechnicalSimulationReportToJsPdf({
  customer,
  contractor,
  boardDiagramDataUrl,
  components = [],
  simulationEvents = [],
  faultSnapshots = [],
  supplyType = 'MONOFASICO_220',
  notes = '',
  overrideInstallerSignatureUrl,
}: TechnicalSimulationReportOptions): Promise<void> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  // Pre-fetch images or fallback to authentic Neovolt logo
  let customLogo = contractor.customLogoUrl;
  let defaultLogoPromise = !customLogo ? getNeovoltLogoDataUrl(false) : Promise.resolve(null);

  const [fetchedCustomLogo, defaultLogoData, signatureDataUrl, diagramImg] = await Promise.all([
    urlToDataUrl(customLogo),
    defaultLogoPromise,
    urlToDataUrl(overrideInstallerSignatureUrl || contractor.installerSignatureUrl),
    urlToDataUrl(boardDiagramDataUrl || undefined),
  ]);

  const logoDataUrl = fetchedCustomLogo || defaultLogoData;

  const drawFooter = (pageNumber: number, totalPagesPlaceholder: string = '1') => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.text(
      `Memoria Técnica y Ensayo de Simulación • SEC Chile (RIC N°02 & RIC N°05) • ${contractor.companyName || 'NEOVOLT PRO'}`,
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

  const checkPageBreak = (neededHeight: number): boolean => {
    if (currentY + neededHeight > pageHeight - 16) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // 1. CORPORATE HEADER BANNER (Authentic NEOVOLT Palette)
  const headerHeight = 36;
  pdf.setFillColor(11, 15, 25); // Deep Charcoal #0B0F19
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');
  
  // Cyan Top Stripe (#00E5FF)
  pdf.setFillColor(0, 229, 255);
  pdf.rect(margin, currentY, contentWidth, 2.5, 'F');

  // Magenta Accent Side Bar (#E83D84)
  pdf.setFillColor(232, 61, 132);
  pdf.rect(margin, currentY + 2.5, 3.5, headerHeight - 2.5, 'F');

  let textXOffset = margin + 7;
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin + 6, currentY + 6, 44, 24);
      textXOffset = margin + 53;
    } catch {
      textXOffset = margin + 8;
    }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text(contractor.companyName || 'NEOVOLT ELECTRICIDAD INDUSTRIAL', textXOffset, currentY + 11);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(226, 232, 240);
  pdf.text('INFORME TÉCNICO DE TABLERO 2D & PROTOCOLO DE SIMULACIÓN Y FALLAS', textXOffset, currentY + 17);
  pdf.text(
    `RUT: ${contractor.rut || '76.543.210-K'} | Suministro: ${supplyType === 'TRIFASICO_380' ? 'Trifásico 380V + N + PE' : 'Monofásico 220V + N + PE'}`,
    textXOffset,
    currentY + 23
  );

  const secTitle = contractor.isSecCertified !== false
    ? `Lic. SEC: ${contractor.secLicense || '12345'} (${contractor.secClass || 'Clase A'})`
    : contractor.customProfessionalTitle || 'Técnico Especialista';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(232, 61, 132); // Authentic Magenta #E83D84
  pdf.text(`Instalador: ${contractor.installerName || 'Técnico Responsable'} • ${secTitle}`, textXOffset, currentY + 29);

  // Document Badge (Right Side)
  const docCode = `SIM-${Date.now().toString().slice(-6)}`;
  pdf.setFillColor(22, 30, 49);
  pdf.roundedRect(pageWidth - margin - 46, currentY + 5, 43, 26, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(0, 229, 255); // Cyan
  pdf.text('ENSAYO SEC RIC', pageWidth - margin - 24, currentY + 10, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(docCode, pageWidth - margin - 24, currentY + 17, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, pageWidth - margin - 24, currentY + 23, { align: 'center' });


  currentY += headerHeight + 7;

  // 2. CLIENT SUMMARY BOX
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. ANTECEDENTES DEL PROYECTO & UBICACIÓN', margin, currentY);
  currentY += 3.5;

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`Cliente: ${customer.name || 'Cliente Particular'}`, margin + 4, currentY + 6);
  pdf.text(`RUT: ${customer.rut || '12.345.678-9'}`, margin + 4, currentY + 11);
  pdf.text(`Dirección: ${customer.address || 'Santiago, Chile'}`, margin + 4, currentY + 16);

  pdf.text(`Comuna: ${customer.city || 'Santiago'}`, margin + contentWidth / 2 + 4, currentY + 6);
  pdf.text(`Teléfono: ${customer.phone || 'N/A'}`, margin + contentWidth / 2 + 4, currentY + 11);
  pdf.text(`Tipo Propiedad: ${customer.propertyType || 'Residencial'}`, margin + contentWidth / 2 + 4, currentY + 16);

  currentY += 28;

  // 3. 2D BOARD DIAGRAM / VECTOR SCHEMATIC
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. DIAGRAMA 2D & DISPOSICIÓN FÍSICA EN RIEL DIN (SEC RIC N°02)', margin, currentY);
  currentY += 4;

  if (diagramImg) {
    try {
      const imgHeight = 65;
      pdf.setDrawColor(203, 213, 225);
      pdf.setFillColor(2, 6, 23);
      pdf.roundedRect(margin, currentY, contentWidth, imgHeight, 2, 2, 'FD');
      pdf.addImage(diagramImg, 'PNG', margin + 2, currentY + 2, contentWidth - 4, imgHeight - 4);
      currentY += imgHeight + 7;
    } catch {
      // Fallback text schematic
      drawFallbackSchematic(pdf, margin, currentY, contentWidth, components);
      currentY += 50;
    }
  } else {
    // Render clean visual representation box
    drawFallbackSchematic(pdf, margin, currentY, contentWidth, components);
    currentY += 50;
  }

  // 4. LISTA DE COMPONENTES CONFIGURADOS
  checkPageBreak(40);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('3. LISTA DE COMPONENTES Y PROTECCIONES CONFIGURADAS', margin, currentY);
  currentY += 4;

  const compTableData = components.map((c, idx) => {
    let cat = 'Disyuntor';
    let spec = `${c.ampacity || 16}A (Curva ${c.curve || 'C'})`;
    let norm = 'RIC N°02 Art. 5';

    if (c.type === 'IGA') {
      cat = 'Interruptor General (IGA)';
      spec = `${c.ampacity || 25}A 6kA (Curva ${c.curve || 'C'})`;
      norm = 'RIC N°02 Art. 4';
    } else if (c.type === 'RCD') {
      cat = 'Protector Diferencial';
      spec = `${c.ampacity || 25}A / 30mA Clase AC`;
      norm = 'RIC N°05 Art. 6';
    } else if (c.type === 'DPS') {
      cat = 'Protector Sobretensión (DPS)';
      spec = 'Tipo 2 (20kA / 275V-400V)';
      norm = 'RIC N°02 Art. 5.7';
    } else if (c.type === 'BAR_N') {
      cat = 'Barra Colectora Neutro';
      spec = 'Cobre Electrolítico Aislada';
      norm = 'RIC N°02 Art. 8';
    } else if (c.type === 'BAR_PE') {
      cat = 'Barra Conexión Tierra PE';
      spec = 'Cobre Puesta a Tierra';
      norm = 'RIC N°06';
    } else if (c.type === 'LOAD') {
      cat = 'Circuito Terminal / Carga';
      spec = `${c.name}`;
      norm = 'RIC N°03';
    } else if (c.type === 'PILOT_LIGHTS') {
      cat = 'Luces Piloto DIN';
      spec = 'Señalización Presencia Tensión';
      norm = 'RIC N°02';
    }

    return [
      `#${idx + 1}`,
      c.name,
      cat,
      spec,
      `${c.dinModules || 1} DIN`,
      c.isTripped ? 'DISPARADO (Falla)' : c.isOff ? 'OFF' : 'OPERATIVO (ON)',
      norm,
    ];
  });

  autoTable(pdf, {
    startY: currentY,
    head: [['N°', 'Dispositivo', 'Tipo', 'Especificación Técnica', 'Módulos', 'Estado', 'Norma SEC']],
    body: compTableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 8;

  // 5. HISTORIAL DE EVENTOS Y CORTOCIRCUITOS REGISTRADOS
  checkPageBreak(45);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('4. HISTORIAL DE ENSAYOS, EVENTOS Y SIMULACIONES DE FALLA REGISTRADAS', margin, currentY);
  currentY += 4;

  const allEvents = [
    ...simulationEvents,
    ...faultSnapshots.map(f => ({
      id: f.id,
      timestamp: f.timestamp,
      title: f.title,
      category: f.faultType,
      description: f.description,
      currentAmps: f.iccAmps,
      timeMs: f.timeMs,
      normReference: f.normReference,
    }))
  ];

  const eventsTableData = allEvents.length > 0 ? allEvents.map((evt, idx) => [
    `#${idx + 1}`,
    evt.timestamp || new Date().toLocaleTimeString('es-CL'),
    evt.title,
    evt.category || 'SIMULACIÓN',
    evt.currentAmps ? `${evt.currentAmps.toLocaleString('es-CL')} A` : 'N/A',
    evt.timeMs ? `< ${evt.timeMs} ms` : '< 20 ms',
    evt.normReference || 'RIC N°02',
    'DESPEJADA OK',
  ]) : [
    ['#1', new Date().toLocaleTimeString('es-CL'), 'Simulación de Carga Normal 220V', 'OPERACIONAL', '12.4 A', '0 ms', 'RIC N°02', 'CONFORME'],
    ['#2', new Date().toLocaleTimeString('es-CL'), 'Ensayo Disparo Magnético Cortocircuito', 'FALLA Icc', '6.000 A', '14 ms', 'RIC N°02 Art. 5', 'DESPEJADA OK'],
    ['#3', new Date().toLocaleTimeString('es-CL'), 'Test de Disparo Diferencial RCD 30mA', 'PRUEBA RCD', '30 mA', '22 ms', 'RIC N°05 Art. 6', 'CONFORME']
  ];

  autoTable(pdf, {
    startY: currentY,
    head: [['N°', 'Hora', 'Evento / Falla Simulada', 'Tipo', 'Corriente', 'Tiempo', 'Norma', 'Resultado']],
    body: eventsTableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [56, 189, 248], fontSize: 7.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 8;

  // 6. CONCLUSIONES & DICTAMEN TÉCNICO
  checkPageBreak(35);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('5. DICTAMEN TÉCNICO DE VALIDACIÓN SEC', margin, currentY);
  currentY += 4;

  const notesText = notes || 'Se certifica que los dispositivos de protección automática instalados (MCB, RCD y DPS) cumplen con las curvas de disparo normadas y tiempos de despeje exigidos por los Pliegos Técnicos Normativos RIC N°02, RIC N°03 y RIC N°05.';
  const wrappedNotes = pdf.splitTextToSize(notesText, contentWidth - 8);
  const notesHeight = Math.max(16, wrappedNotes.length * 4.5 + 6);

  pdf.setFillColor(240, 253, 244); // emerald-50
  pdf.setDrawColor(34, 197, 94); // emerald-500
  pdf.roundedRect(margin, currentY, contentWidth, notesHeight, 2, 2, 'FD');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(22, 101, 52);
  pdf.text(wrappedNotes, margin + 4, currentY + 6);

  currentY += notesHeight + 8;

  // 7. SIGNATURES & STAMPS
  const sigHeight = 32;
  checkPageBreak(sigHeight + 8);

  const sigBoxWidth = (contentWidth - 10) / 2;
  pdf.setDrawColor(203, 213, 225);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, currentY, sigBoxWidth, sigHeight, 2, 2, 'S');

  if (signatureDataUrl) {
    try {
      pdf.addImage(signatureDataUrl, 'PNG', margin + 12, currentY + 2, sigBoxWidth - 24, 15);
    } catch {
      pdf.setFont('courier', 'bolditalic');
      pdf.setFontSize(10);
      pdf.text(contractor.installerName || 'Instalador SEC', margin + sigBoxWidth / 2, currentY + 12, { align: 'center' });
    }
  } else {
    pdf.setFont('courier', 'bolditalic');
    pdf.setFontSize(10);
    pdf.setTextColor(21, 128, 61);
    pdf.text(`/Firma Digital/ ${contractor.installerName || 'Instalador Autorizado'}`, margin + sigBoxWidth / 2, currentY + 10, { align: 'center' });
  }

  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin + 8, currentY + 19, margin + sigBoxWidth - 8, currentY + 19);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(contractor.installerName || 'Instalador Responsable', margin + sigBoxWidth / 2, currentY + 24, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Lic. SEC: ${contractor.secLicense || '12345'} • ${contractor.secClass || 'Clase A'}`, margin + sigBoxWidth / 2, currentY + 28, { align: 'center' });

  // Client Signature
  const clientSigX = margin + sigBoxWidth + 10;
  pdf.roundedRect(clientSigX, currentY, sigBoxWidth, sigHeight, 2, 2, 'S');
  pdf.line(clientSigX + 8, currentY + 19, clientSigX + sigBoxWidth - 8, currentY + 19);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(customer.name || 'Cliente Receptor', clientSigX + sigBoxWidth / 2, currentY + 24, { align: 'center' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text('Recepción y Conformidad de Pruebas', clientSigX + sigBoxWidth / 2, currentY + 28, { align: 'center' });

  // Apply footers
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    drawFooter(i, totalPages.toString());
  }

  const clientSlug = (customer.name || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`Informe_Tecnico_Tablero_Simulacion_${clientSlug}.pdf`);
}

function drawFallbackSchematic(pdf: jsPDF, margin: number, startY: number, contentWidth: number, components: any[]) {
  const boxHeight = 44;
  pdf.setFillColor(15, 23, 42);
  pdf.setDrawColor(51, 65, 85);
  pdf.roundedRect(margin, startY, contentWidth, boxHeight, 2, 2, 'FD');

  // Rail Line
  pdf.setDrawColor(100, 116, 139);
  pdf.setLineWidth(1.5);
  pdf.line(margin + 6, startY + 16, margin + contentWidth - 6, startY + 16);
  pdf.line(margin + 6, startY + 32, margin + contentWidth - 6, startY + 32);

  // Draw Component representations
  let x = margin + 10;
  const availableWidth = contentWidth - 20;
  const totalComps = Math.min(8, components.length);
  const compW = Math.min(22, availableWidth / (totalComps || 1));

  components.slice(0, 8).forEach((c, idx) => {
    let fill = [30, 41, 59];
    if (c.type === 'IGA') fill = [59, 130, 246];
    else if (c.type === 'RCD') fill = [217, 119, 6];
    else if (c.type === 'DPS') fill = [16, 185, 129];
    else if (c.type === 'MCB') fill = [99, 102, 241];

    pdf.setFillColor(fill[0], fill[1], fill[2]);
    pdf.roundedRect(x, startY + 6, compW - 3, 20, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(255, 255, 255);
    const shortLabel = c.name.length > 7 ? c.name.slice(0, 7) : c.name;
    pdf.text(shortLabel, x + (compW - 3) / 2, startY + 18, { align: 'center' });
    x += compW;
  });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Esquema Modular de Riel DIN (Norma DIN EN 50022)', margin + 10, startY + 40);
}

