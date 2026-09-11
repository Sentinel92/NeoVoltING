import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CustomerDetails, ContractorConfig } from '../types';
import {
  SurveyPointRecord,
  RepairPlanSummary,
  SECTOR_METADATA,
} from './technicalSurveyEngine';
import { calculateLaborTimeEstimation } from './laborEstimationEngine';
import { getNeovoltLogoDataUrl } from '../components/NeovoltLogo';

export interface ExportTechnicalAuditPdfOptions {
  points: SurveyPointRecord[];
  repairPlan: RepairPlanSummary;
  customer: CustomerDetails;
  contractor: ContractorConfig;
  siteAddress?: string;
  auditNotes?: string;
}

export async function exportTechnicalAuditReportPdf({
  points,
  repairPlan,
  customer,
  contractor,
  siteAddress,
  auditNotes,
}: ExportTechnicalAuditPdfOptions): Promise<void> {
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

  const logoDataUrl = contractor.customLogoUrl || (await getNeovoltLogoDataUrl(false));

  const drawFooter = (pageNumber: number, totalPagesPlaceholder: string = '1') => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.text(
      `Auditoría Técnica & Estimación de Reparación • Norma SEC / RIC Chile • ${contractor.companyName || 'NEOVOLT PRO'}`,
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
    if (currentY + neededHeight > pageHeight - 18) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // --- HEADER SECTION ---
  if (logoDataUrl) {
    try {
      pdf.addImage(logoDataUrl, 'PNG', margin, currentY, 40, 14);
    } catch {
      // Ignore image error
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text('INFORME TÉCNICO DE AUDITORÍA Y PLAN DE REPARACIÓN', margin + 46, currentY + 6);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(225, 29, 72); // rose-600
  pdf.text('CONFORMIDAD NORMATIVA SEC • PLIEGOS TÉCNICOS RIC N°01 AL N°19', margin + 46, currentY + 11);

  currentY += 20;

  // --- CONTRACTOR & CLIENT INFO BOX ---
  autoTable(pdf, {
    startY: currentY,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [51, 65, 85] },
    body: [
      [
        {
          content: `DATOS DEL CLIENTE / INSTALACIÓN:\nNombre: ${customer.name || 'Cliente Particular'}\nDirección: ${siteAddress || customer.address || 'En terreno'}\nCiudad / Comuna: ${customer.city || 'Santiago, Chile'}\nContacto: ${customer.phone || 'Sin registrar'} • ${customer.email || ''}`,
          styles: { fontStyle: 'normal' },
        },
        {
          content: `PROFESIONAL AUDITOR / EMPRESA:\nEmpresa: ${contractor.companyName || 'Instalador Independiente'}\nAuditor SEC: ${contractor.installerName || 'Técnico Autorizado'}\nLicencia SEC: ${contractor.secLicense || 'Clase A/B/C/D'}\nFecha: ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}`,
          styles: { fontStyle: 'normal' },
        },
      ],
    ],
  });

  currentY = (pdf as any).lastAutoTable.finalY + 4;

  // --- AUDIT SCORE EXECUTIVE BANNER ---
  checkPageBreak(26);
  const statusColor: [number, number, number] =
    repairPlan.secComplianceStatus === 'NO_CUMPLE_CRITICO'
      ? [225, 29, 72] // rose-600
      : repairPlan.secComplianceStatus === 'OBSERVADO_MAYOR'
      ? [217, 119, 6] // amber-600
      : [16, 185, 129]; // emerald-500

  pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  pdf.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(
    `DIAGNÓSTICO GLOBAL: ${
      repairPlan.secComplianceStatus === 'NO_CUMPLE_CRITICO'
        ? 'RIESGO CRÍTICO - NO CONFORME CON REGLAMENTO SEC'
        : repairPlan.secComplianceStatus === 'OBSERVADO_MAYOR'
        ? 'OBSERVACIONES MAYORES - REQUIERE REGULARIZACIÓN'
        : 'INSTALACIÓN CONFORME / OBSERVACIONES MENORES'
    }`,
    margin + 6,
    currentY + 7
  );

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.text(
    `Índice de Seguridad: ${repairPlan.auditScore100}/100 • ${repairPlan.criticalCount} Críticos (Riesgo Incendio/Vida) • ${repairPlan.majorCount} Mayores • ${repairPlan.minorCount} Menores`,
    margin + 6,
    currentY + 14
  );

  currentY += 26;

  // --- SECTION 1: CENSO DE PUNTOS REGISTRADOS ---
  checkPageBreak(15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. Censo de Terreno & Estado de Puntos Auditados', margin, currentY);
  currentY += 4;

  const pointsRows = points.map((p, idx) => [
    `${idx + 1}`,
    p.name,
    SECTOR_METADATA[p.sector]?.label || p.sector,
    `${p.wireGaugeMm2} mm² (${p.wireType.replace(/_/g, ' ')})`,
    `${p.breakerRating} (${p.breakerType.replace(/_/g, ' ')})`,
    p.rcdStatus.includes('presente') ? 'OK (RCD 30mA)' : '⚠️ Ausente/Falla',
    p.groundStatus === 'presente_pe_continuo' ? 'OK (PE)' : p.groundStatus === 'puente_tierra_neutro_prohibido' ? '❌ Puente Ilegal' : '⚠️ Sin Tierra',
  ]);

  autoTable(pdf, {
    startY: currentY,
    theme: 'grid',
    head: [['#', 'Punto / Circuito', 'Sector', 'Conductor', 'Disyuntor', 'Diferencial', 'Puesta Tierra']],
    body: pointsRows,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 40 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
    },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 6;

  // --- SECTION 2: MATRIZ DE ANOMALÍAS Y ACCIONES CORRECTIVAS (NORMA RIC) ---
  checkPageBreak(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. Diagnóstico de Anomalías Normativas & Acciones Correctivas (SEC/RIC)', margin, currentY);
  currentY += 4;

  if (repairPlan.anomaliesList.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text('✓ No se detectaron fallas normativas en los puntos censados.', margin, currentY + 5);
    currentY += 12;
  } else {
    const anomaliesRows = repairPlan.anomaliesList.map((a) => [
      a.severity,
      a.codeRIC,
      `${a.title}\n• Riesgo: ${a.riskDescription}`,
      a.recommendedAction,
      `$${a.estimatedMaterialCostClp.toLocaleString('es-CL')}`,
    ]);

    autoTable(pdf, {
      startY: currentY,
      theme: 'grid',
      head: [['Severidad', 'Pliego RIC', 'Hallazgo Técnico & Riesgo', 'Acción Correctiva Recomendada', 'Material Est.']],
      body: anomaliesRows,
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 62 },
        3: { cellWidth: 54 },
        4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          if (data.cell.raw === 'CRITICO') {
            data.cell.styles.textColor = [225, 29, 72];
          } else if (data.cell.raw === 'MAYOR') {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [16, 185, 129];
          }
        }
      },
    });

    currentY = (pdf as any).lastAutoTable.finalY + 6;
  }

  // --- SECTION 3: ESTIMACIÓN DE TIEMPOS DE REPARACIÓN Y HORAS-HOMBRE (HH) ---
  const laborCalc = calculateLaborTimeEstimation(points, {
    hourlyRateClp: repairPlan.recommendedLaborRatePerHour,
  });

  checkPageBreak(25);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('3. Estimación de Tiempos de Reparación & Rendimientos Horas-Hombre (HH)', margin, currentY);
  currentY += 4;

  const laborRows = [
    [
      'Puntos de Fuerza / Enchufes',
      `${laborCalc.powerPointsCount} puntos`,
      '~42 min/pto',
      `${laborCalc.breakdownByPointType.find(b => b.pointType === 'enchufe_fuerza')?.totalManHoursHH || 0} HH`,
    ],
    [
      'Centros de Alumbrado e Interruptores',
      `${laborCalc.lightingPointsCount} centros`,
      '~36 min/centro',
      `${laborCalc.breakdownByPointType.find(b => b.pointType === 'centro_alumbrado')?.totalManHoursHH || 0} HH`,
    ],
    [
      'Circuitos de Tablero & Protecciones',
      `${laborCalc.boardCircuitsCount} circuitos`,
      '~45 min/circuito',
      `${laborCalc.breakdownByPointType.find(b => b.pointType === 'circuito_tablero')?.totalManHoursHH || 0} HH`,
    ],
    [
      'Canalizaciones & Cajas de Derivación',
      `${laborCalc.conduitBoxesCount} tramos`,
      '~30 min/caja',
      `${laborCalc.breakdownByPointType.find(b => b.pointType === 'canalizacion_caja')?.totalManHoursHH || 0} HH`,
    ],
  ];

  autoTable(pdf, {
    startY: currentY,
    theme: 'grid',
    head: [['Categoría de Trabajo', 'Cantidad Detectada', 'Rendimiento Base', 'Horas-Hombre Ajustadas']],
    body: laborRows,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 36, halign: 'center' },
      2: { cellWidth: 36, halign: 'center' },
      3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(
    `* Total Horas-Hombre Proyectadas: ${laborCalc.adjustedManHoursHH} HH | Plazo estimado de faena: ${laborCalc.projectedDurationDays} Días Hábiles (Cuadrilla Maestro + Ayudante).`,
    margin,
    currentY + 2
  );
  currentY += 8;

  // --- SECTION 4: CUBICADO ESTIMADO DE MATERIALES ---
  checkPageBreak(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('4. Cubicado de Materiales Requeridos para Regularización', margin, currentY);
  currentY += 4;

  const matRows = repairPlan.materialBill.map((m) => [
    m.sku,
    m.name,
    m.category,
    `${m.quantity} ${m.unit}`,
    `$${m.unitPriceClp.toLocaleString('es-CL')}`,
    `$${m.totalPriceClp.toLocaleString('es-CL')}`,
  ]);

  autoTable(pdf, {
    startY: currentY,
    theme: 'grid',
    head: [['Código', 'Descripción del Insumo / Material', 'Categoría', 'Cant.', 'Precio Unit.', 'Subtotal']],
    body: matRows,
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 70 },
      2: { cellWidth: 28 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 6;

  // --- SECTION 5: RESUMEN ECONÓMICO Y MANO DE OBRA ---
  checkPageBreak(35);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('5. Presupuesto Proyectado de Reparación', margin, currentY);
  currentY += 4;

  const budgetSummaryRows = [
    ['Total Materiales e Insumos Certificados:', `$${repairPlan.totalMaterialCostClp.toLocaleString('es-CL')}`],
    [`Mano de Obra Calificada (${laborCalc.adjustedManHoursHH} HH proyectadas):`, `$${laborCalc.totalLaborCostClp.toLocaleString('es-CL')}`],
    ['Subtotal Neto:', `$${(repairPlan.totalMaterialCostClp + laborCalc.totalLaborCostClp).toLocaleString('es-CL')}`],
    ['IVA (19%):', `$${Math.round((repairPlan.totalMaterialCostClp + laborCalc.totalLaborCostClp) * 0.19).toLocaleString('es-CL')}`],
    ['TOTAL GENERAL PROPUESTA:', `$${Math.round((repairPlan.totalMaterialCostClp + laborCalc.totalLaborCostClp) * 1.19).toLocaleString('es-CL')} CLP`],
  ];

  autoTable(pdf, {
    startY: currentY,
    theme: 'plain',
    body: budgetSummaryRows,
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: 'bold', textColor: [51, 65, 85] },
      1: { cellWidth: 52, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
    },
    didParseCell: (data) => {
      if (data.row.index === budgetSummaryRows.length - 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [225, 29, 72];
        data.cell.styles.fontSize = 9.5;
      }
    },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 12;

  // --- SIGNATURE SECTION ---
  checkPageBreak(28);
  pdf.setDrawColor(203, 213, 225);
  pdf.line(margin + 20, currentY + 15, margin + 80, currentY + 15);
  pdf.line(pageWidth - margin - 80, currentY + 15, pageWidth - margin - 20, currentY + 15);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('FIRMA AUDITOR SEC', margin + 34, currentY + 19);
  pdf.text('FIRMA CONFORMIDAD CLIENTE', pageWidth - margin - 68, currentY + 19);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text(`${contractor.installerName || 'Instalador Autorizado'} (SEC: ${contractor.secLicense || 'Clase A'})`, margin + 25, currentY + 23);
  pdf.text(`${customer.name || 'Cliente Propietario'}`, pageWidth - margin - 65, currentY + 23);

  // --- DRAW FOOTERS ACROSS ALL PAGES ---
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    drawFooter(i, `${totalPages}`);
  }

  // Save the PDF
  const filename = `Informe_Auditoria_SEC_${(customer.name || 'Cliente').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  pdf.save(filename);
}

