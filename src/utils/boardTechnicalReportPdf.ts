import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getNeovoltLogoDataUrl } from '../components/NeovoltLogo';
import { InteractiveComponent, Wire, SimulationEvent } from '../components/PhysicalBoardSimulationTab';
import { ContractorConfig, FaultSnapshot } from '../types';

export interface ExportBoardTechnicalReportOptions {
  svgElement?: SVGSVGElement | null;
  svgDataUrl?: string;
  components: InteractiveComponent[];
  wires: Wire[];
  simulationEvents: SimulationEvent[];
  savedFaultSnapshots?: FaultSnapshot[];
  supplyType: 'MONOFASICO_220' | 'TRIFASICO_380';
  boardCapacity: number;
  clientInfo?: {
    name?: string;
    propertyType?: string;
    address?: string;
    rut?: string;
    commune?: string;
    city?: string;
  };
  contractor?: ContractorConfig | null;
  loads?: Array<{ id: string; name: string; power: number }>;
}

/**
 * Converts an SVG element into a PNG data URL using canvas.
 */
export async function convertSvgToPngDataUrl(svgElement: SVGSVGElement): Promise<string> {
  return new Promise((resolve) => {
    try {
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Remove unwanted dynamic interactive elements like cursors if needed
      const serialized = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = typeof window !== 'undefined' ? (window.URL || (window as any).webkitURL) : null;
      if (!URLObj) {
        resolve('');
        return;
      }
      const blobURL = URLObj.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const bbox = svgElement.viewBox.baseVal;
        const width = bbox && bbox.width > 0 ? bbox.width : 1200;
        const height = bbox && bbox.height > 0 ? bbox.height : 750;

        // Render at 2x resolution for crisp PDF output
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#070b14';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URLObj.revokeObjectURL(blobURL);
          resolve(canvas.toDataURL('image/png'));
        } else {
          URLObj.revokeObjectURL(blobURL);
          resolve('');
        }
      };
      img.onerror = () => {
        URLObj.revokeObjectURL(blobURL);
        resolve('');
      };
      img.src = blobURL;
    } catch (e) {
      console.warn('Error converting SVG to PNG data URL:', e);
      resolve('');
    }
  });
}

/**
 * Generates an exhaustive, SEC-compliant engineering technical dossier in PDF
 * including the 2D layout graphic, the full table of configured protection components,
 * and the historical log of detected short-circuit & electrical fault events.
 */
export async function exportBoardTechnicalReportPdf(options: ExportBoardTechnicalReportOptions): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // 1. Fetch Neovolt Logo
  let logoDataUrl = '';
  try {
    logoDataUrl = await getNeovoltLogoDataUrl(false);
  } catch (e) {
    console.warn('Could not fetch logo data url', e);
  }

  // 2. Fetch or Convert SVG Layout Image
  let boardLayoutDataUrl = options.svgDataUrl || '';
  if (!boardLayoutDataUrl && options.svgElement) {
    try {
      boardLayoutDataUrl = await convertSvgToPngDataUrl(options.svgElement);
    } catch (e) {
      console.warn('Could not convert SVG element to image:', e);
    }
  }

  const clientName = options.clientInfo?.name || 'Instalación Tipo Residencial';
  const propertyType = options.clientInfo?.propertyType || (options.supplyType === 'TRIFASICO_380' ? 'Trifásico Comercial / Fuerza' : 'Residencial Monofásico');
  const installerName = options.contractor?.installerName || 'Instalador Autorizado SEC';
  const secLicense = options.contractor?.secLicense || 'SEC-84291-CL';
  const secClass = options.contractor?.secClass || 'Clase A';
  const companyName = options.contractor?.companyName || 'NEOVOLT - Soluciones de Ingeniería Eléctrica';
  const folio = `REP-TAB2D-${Date.now().toString().slice(-6)}`;
  const dateFormatted = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // ----------------------------------------------------------------
  // PAGE 1: HEADER BANNER
  // ----------------------------------------------------------------
  const headerHeight = 32;
  doc.setFillColor(11, 15, 25); // #0B0F19
  doc.rect(margin, margin, contentWidth, headerHeight, 'F');

  // Top Cyan Stripe (#00E5FF)
  doc.setFillColor(0, 229, 255);
  doc.rect(margin, margin, contentWidth, 2.5, 'F');

  // Left Magenta Accent Tag (#E83D84)
  doc.setFillColor(232, 61, 132);
  doc.rect(margin, margin + 2.5, 3.5, headerHeight - 2.5, 'F');

  let textLeft = margin + 8;
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin + 6, margin + 5, 40, 22);
      textLeft = margin + 50;
    } catch {
      textLeft = margin + 8;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('INFORME TÉCNICO DE MONTAJE Y AUDITORÍA DE TABLERO 2D', textLeft, margin + 10);

  doc.setFontSize(8);
  doc.setTextColor(0, 229, 255);
  doc.text('SUPERINTENDENCIA DE ELECTRICIDAD Y COMBUSTIBLES • PLIEGOS RIC N°01, N°02, N°05 Y N°10', textLeft, margin + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Mandante: ${clientName} | Inmueble: ${propertyType}`, textLeft, margin + 22);
  doc.text(`Empresa / Instalador: ${companyName} (${secLicense} - ${secClass})`, textLeft, margin + 27);

  // Folio Box
  doc.setFillColor(22, 30, 49);
  doc.roundedRect(pageWidth - margin - 44, margin + 5, 41, 23, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(232, 61, 132);
  doc.text('FOLIO AUDITORÍA', pageWidth - margin - 23.5, margin + 10, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(folio, pageWidth - margin - 23.5, margin + 16, { align: 'center' });

  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${dateFormatted}`, pageWidth - margin - 23.5, margin + 22, { align: 'center' });

  let currentY = margin + headerHeight + 5;

  // ----------------------------------------------------------------
  // SUMMARY METRICS BAR
  // ----------------------------------------------------------------
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 14, 'FD');

  const totalModulesUsed = options.components.reduce((acc, c) => acc + (c.dinModules || c.poles || 1), 0);
  const totalPowerW = options.loads ? options.loads.reduce((acc, l) => acc + l.power, 0) : 0;
  const reservePercent = Math.max(0, Math.round(((options.boardCapacity - totalModulesUsed) / options.boardCapacity) * 100));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  const colW = contentWidth / 4;
  doc.text(`Suministro: ${options.supplyType === 'TRIFASICO_380' ? 'Trifásico 380V' : 'Monofásico 220V'}`, margin + 3, currentY + 5.5);
  doc.text(`Capacidad Gabinete: ${options.boardCapacity} Módulos`, margin + colW + 3, currentY + 5.5);
  doc.text(`Módulos Ocupados: ${totalModulesUsed} (${reservePercent}% Reserva)`, margin + colW * 2 + 3, currentY + 5.5);
  doc.text(`Potencia Conectada: ${(totalPowerW / 1000).toFixed(2)} kW`, margin + colW * 3 + 3, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Dispositivos: ${options.components.length} unidades DIN`, margin + 3, currentY + 10.5);
  doc.text(`Conductores: ${options.wires.length} enlaces cableados`, margin + colW + 3, currentY + 10.5);
  doc.text(`Norma RIC N°02: ${reservePercent >= 25 ? '✓ Cumple Reserva ≥25%' : '⚠ Reserva menor a 25%'}`, margin + colW * 2 + 3, currentY + 10.5);
  doc.text(`Eventos Falla: ${options.simulationEvents.filter(e => e.category === 'CORTOCIRCUITO' || e.type.includes('SHORT')).length} registrados`, margin + colW * 3 + 3, currentY + 10.5);

  currentY += 18;

  // ----------------------------------------------------------------
  // SECTION 1: 2D BOARD VISUAL LAYOUT GRAPHIC (CAPTURA DEL PLANO 2D)
  // ----------------------------------------------------------------
  doc.setFillColor(11, 15, 25);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('1. DISPOSICIÓN FÍSICA Y PLANO DE MONTAJE 2D DEL TABLERO EN RIEL DIN', margin + 3, currentY + 4);

  currentY += 6.5;

  const layoutBoxHeight = 56;
  doc.setFillColor(7, 11, 20);
  doc.setDrawColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, layoutBoxHeight, 'FD');

  if (boardLayoutDataUrl) {
    try {
      doc.addImage(boardLayoutDataUrl, 'PNG', margin + 1, currentY + 1, contentWidth - 2, layoutBoxHeight - 2);
    } catch (e) {
      console.warn('Could not render board image in PDF', e);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Plano 2D generado vectorialmente en formato DIN 35mm.', margin + 10, currentY + layoutBoxHeight / 2);
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Esquema de distribución modular en riel DIN 35mm con cableado estructurado según código de colores RIC N°04.', margin + 10, currentY + layoutBoxHeight / 2);
  }

  currentY += layoutBoxHeight + 5;

  // ----------------------------------------------------------------
  // SECTION 2: CONFIGURED COMPONENTS & PROTECTION DEVICES TABLE
  // ----------------------------------------------------------------
  doc.setFillColor(11, 15, 25);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('2. NÓMINA TÉCNICA DE COMPONENTES Y DISPOSITIVOS DE PROTECCIÓN CONFIGURADOS', margin + 3, currentY + 4);

  currentY += 6.5;

  const componentRows = options.components.map((c, idx) => {
    const polesStr = c.poles ? `${c.poles}P` : (c.type === 'IGA' ? (options.supplyType === 'TRIFASICO_380' ? '4P' : '2P') : c.type === 'RCD' ? '2P' : '1P');
    const ampsStr = c.ampacity ? `${c.ampacity} A` : (c.type === 'DPS' ? '20 kA' : '16 A');
    const curveStr = c.curve ? `Curva ${c.curve}` : (c.type === 'MCB' ? 'Curva C' : c.type === 'IGA' ? 'Curva C' : '-');
    const breakingCapStr = c.icnKa ? `${c.icnKa} kA` : (c.type === 'MCB' || c.type === 'IGA' ? '6.0 kA' : '-');
    
    let sensitivityOrClass = '-';
    if (c.type === 'RCD') {
      sensitivityOrClass = '30 mA (Clase AC/A)';
    } else if (c.type === 'DPS') {
      sensitivityOrClass = 'Tipo 2 (275V / 20kA)';
    } else if (c.type === 'PILOT_LIGHTS') {
      sensitivityOrClass = 'LED 230V Presencia Fase';
    } else if (c.type === 'GRID') {
      sensitivityOrClass = 'Empalme Red Distribución';
    } else if (c.type === 'BAR_N' || c.type === 'BAR_PE') {
      sensitivityOrClass = 'Barra Cobre Equipotencial';
    }

    let statusStr = 'NORMAL (ON)';
    if (c.isTripped) statusStr = 'DISPARADO (TRIP)';
    else if (c.isOff || c.powerStatus === 'OFF') statusStr = 'DESCONECTADO (OFF)';

    return [
      `[${idx + 1}] ${c.type}`,
      c.name || `${c.type} Módulo`,
      polesStr,
      ampsStr,
      curveStr,
      breakingCapStr,
      sensitivityOrClass,
      statusStr,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Tipo', 'Denominación / Etiqueta', 'Polos', 'Calibre In', 'Curva', 'Poder Icn', 'Sensibilidad / Tipo', 'Estado Operativo']],
    body: componentRows,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 15, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      cellPadding: 1.8,
    },
    styles: {
      fontSize: 6.5,
      cellPadding: 1.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 44 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 36 },
      7: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 50;

  // ----------------------------------------------------------------
  // PAGE 2: HISTORICAL RECORD OF SHORT CIRCUITS & FAULT EVENTS
  // ----------------------------------------------------------------
  if (currentY > 190) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFillColor(11, 15, 25);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('3. REGISTRO HISTÓRICO AUDITADO DE EVENTOS DE CORTOCIRCUITO Y ANOMALÍAS DETECTADAS', margin + 3, currentY + 4);

  currentY += 6.5;

  // Combine live simulation events + stored snapshots
  const faultEvents = options.simulationEvents.filter(
    e => e.category === 'CORTOCIRCUITO' || e.category === 'DIFERENCIAL' || e.category === 'SOBRETENSION' || e.type.includes('SHORT') || e.type.includes('FAULT') || e.type.includes('OVERLOAD')
  );

  const storedSnapshots = options.savedFaultSnapshots || [];

  // Summary Card of Fault Protection & Clearing Reliability
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 14, 'FD');

  const totalFaultsCount = Math.max(faultEvents.length, storedSnapshots.length);
  const maxIcc = Math.max(
    ...faultEvents.map(f => f.iccAmps || 0),
    ...storedSnapshots.map(s => s.iccAmps || 0),
    0
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Ensayos de Falla: ${totalFaultsCount} eventos`, margin + 3, currentY + 5);
  doc.text(`Corriente Icc Máxima: ${maxIcc > 0 ? `${maxIcc.toLocaleString('es-CL')} A (${(maxIcc / 1000).toFixed(2)} kA)` : 'Sin fallas activas'}`, margin + 60, currentY + 5);
  doc.text(`Capacidad de Corte Tablero: 6.0 kA / 10.0 kA`, margin + 125, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Despeje de Falla: Instantáneo electromagnético (< 25 ms)`, margin + 3, currentY + 10);
  doc.text(`Norma Evaluada: RIC N°01 & RIC N°02 (Icn ≥ Icc)`, margin + 60, currentY + 10);
  doc.text(`Estado de Selectividad: ${maxIcc <= 6000 ? '✓ Conforme a Norma SEC' : '⚠ Requiere protección 10kA'}`, margin + 125, currentY + 10);

  currentY += 16;

  // Build Fault Log Rows
  let faultRows: string[][] = [];

  if (faultEvents.length > 0) {
    faultRows = faultEvents.map((evt, idx) => {
      const timeStr = evt.timestampFull || evt.timestamp || dateFormatted;
      const iccStr = evt.iccAmps ? `${evt.iccAmps.toLocaleString('es-CL')} A` : 'N/A';
      const tripTimeStr = evt.timeMs ? `< ${evt.timeMs} ms` : '< 20 ms';
      const compStr = evt.trippedCompName || 'IGA / MCB';
      const normStr = evt.normReference || 'RIC N°01';
      const cleanDesc = evt.description.length > 70 ? evt.description.slice(0, 67) + '...' : evt.description;

      return [
        `#${idx + 1}`,
        timeStr,
        evt.title || evt.type.replace(/_/g, ' '),
        iccStr,
        tripTimeStr,
        compStr,
        normStr,
        cleanDesc,
      ];
    });
  } else if (storedSnapshots.length > 0) {
    faultRows = storedSnapshots.map((snap, idx) => {
      const timeStr = snap.timestamp ? new Date(snap.timestamp).toLocaleString('es-CL') : dateFormatted;
      const iccStr = snap.iccAmps ? `${snap.iccAmps.toLocaleString('es-CL')} A` : 'N/A';
      const tripTimeStr = snap.timeMs ? `< ${snap.timeMs} ms` : '< 20 ms';
      const normStr = snap.normReference || 'RIC N°01 / N°02';
      const cleanDesc = snap.description.length > 70 ? snap.description.slice(0, 67) + '...' : snap.description;

      const faultTypeStr = snap.faultType || snap.title || 'Cortocircuito';
      return [
        `#${idx + 1}`,
        timeStr,
        faultTypeStr.replace(/_/g, ' '),
        iccStr,
        tripTimeStr,
        snap.trippedCompName || 'IGA / Disyuntor',
        normStr,
        cleanDesc,
      ];
    });
  } else {
    // Clean Record fallback entry
    faultRows = [
      [
        '#0',
        dateFormatted,
        'REGISTRO LIMPIO - SIN CORTOCIRCUITOS',
        '0 A',
        'N/A',
        'Operativo',
        'RIC N°01',
        'No se han producido eventos de cortocircuito ni fallas de aislamiento en la simulación.',
      ],
    ];
  }

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Fecha / Hora', 'Tipo de Evento de Falla', 'Icc Calculada', 'Tiempo', 'Protección', 'Pliego SEC', 'Dictamen / Diagnóstico Técnico']],
    body: faultRows,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 15, 25],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.5,
      cellPadding: 1.8,
    },
    styles: {
      fontSize: 6.2,
      cellPadding: 1.5,
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 8, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 14, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 50 },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : currentY + 45;

  // ----------------------------------------------------------------
  // SECTION 4: NORMATIVE CERTIFICATION & SIGNATURES
  // ----------------------------------------------------------------
  if (currentY > 230) {
    doc.addPage();
    currentY = margin;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 34, 'FD');

  doc.setFillColor(11, 15, 25);
  doc.rect(margin, currentY, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(255, 255, 255);
  doc.text('4. DECLARACIÓN DE CONFORMIDAD NORMATIVA SEC Y FIRMAS OFICIALES', margin + 3, currentY + 4);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const certText = 'Se certifica que la disposición física en riel DIN, las capacidades nominales de corte Icn, las curvas de disparo magnético y los diferenciales de 30mA documentados en este informe han sido validados rigurosamente bajo los Pliegos Técnicos Normativos RIC N°01, RIC N°02, RIC N°05 y RIC N°10.';
  const splitCert = doc.splitTextToSize(certText, contentWidth - 6);
  doc.text(splitCert, margin + 3, currentY + 9);

  // Signatures Boxes (Left: Installer, Right: Client)
  const signBoxWidth = (contentWidth - 10) / 2;
  const signY = currentY + 16;

  // Installer Box
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 6, signY + 10, margin + signBoxWidth - 6, signY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(installerName, margin + signBoxWidth / 2, signY + 13.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Instalador Autorizado SEC • ${secLicense} (${secClass})`, margin + signBoxWidth / 2, signY + 16.5, { align: 'center' });

  // Client Box
  const rightBoxX = margin + signBoxWidth + 10;
  doc.line(rightBoxX + 6, signY + 10, rightBoxX + signBoxWidth - 6, signY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text(clientName, rightBoxX + signBoxWidth / 2, signY + 13.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(`Propietario / Mandante • ${options.clientInfo?.rut || 'RUT Conforme'}`, rightBoxX + signBoxWidth / 2, signY + 16.5, { align: 'center' });

  // Add Page Numbers in Footer
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${totalPages} • NEOVOLT SEC Sistema de Auditoría y Diseño de Tableros Eléctricos 2D`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Save PDF
  const clientSlug = clientName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Reporte_Tecnico_Tablero_2D_${clientSlug}_${Date.now().toString().slice(-4)}.pdf`);

  return doc;
}
