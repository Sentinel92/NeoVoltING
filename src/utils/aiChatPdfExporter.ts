import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UserSession } from '../types';
import { ChatMessage } from '../components/AiDiagnosticConsultantTab';

export interface ExportChatPdfOptions {
  messages: ChatMessage[];
  currentUser?: UserSession;
  installationType?: string;
  selectedMissingTools?: string[];
  contextNotes?: string;
}

/**
 * Helper to convert image URL or base64 to base64 Data URL
 */
async function ensureDataUrl(url?: string): Promise<string | null> {
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
    console.warn('Could not load image for PDF:', url, e);
    return null;
  }
}

/**
 * Generates a styled, client-facing PDF report of the technical AI diagnosis conversation.
 */
export async function exportChatHistoryToJsPdf({
  messages,
  currentUser,
  installationType = 'Monofásica 220V Residencial',
  selectedMissingTools = [],
  contextNotes,
}: ExportChatPdfOptions): Promise<void> {
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

  const validMessages = messages.filter((m) => !m.isError);

  const drawFooter = (pageNumber: number) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.text(
      `NEOVOLT PRO • Informe de Consultoría y Diagnóstico Eléctrico SEC • Norma RIC Chile`,
      margin,
      pageHeight - 7
    );
    pdf.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number): boolean => {
    if (currentY + neededHeight > pageHeight - 18) {
      pdf.addPage();
      currentY = margin;
      return true;
    }
    return false;
  };

  // -------------------------------------------------------------
  // 1. HEADER BANNER
  // -------------------------------------------------------------
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F');

  // Accent line
  pdf.setFillColor(217, 70, 239); // fuchsia-500
  pdf.rect(margin, currentY, 4, 26, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('INFORME TÉCNICO DE DIAGNÓSTICO & CONSULTORÍA IA', margin + 8, currentY + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(226, 232, 240);
  pdf.text('Auditoría Eléctrica • Copiloto Técnico RIC/SEC • Documentación Técnica', margin + 8, currentY + 16);

  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  const nowStr = new Date().toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  pdf.text(`Fecha de Emisión: ${nowStr}`, margin + 8, currentY + 22);

  currentY += 31;

  // -------------------------------------------------------------
  // 2. PROJECT & INSTALLER METADATA BOX
  // -------------------------------------------------------------
  const techName = currentUser?.name || 'Instalador Certificado SEC';
  const secLic = currentUser?.secNumber || 'SEC-84291-CL';
  const email = currentUser?.email || 'contacto@neovolt.cl';

  autoTable(pdf, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [['DATOS DEL ESPECIALISTA SEC', 'PARÁMETROS DEL DIAGNÓSTICO']],
    body: [
      [
        `Profesional: ${techName}\nLicencia SEC: ${secLic}\nContacto: ${email}`,
        `Instalación: ${installationType}\nHerramientas Ausentes: ${
          selectedMissingTools.length > 0 ? selectedMissingTools.join(', ') : 'Ninguna (Kit Completo)'
        }${contextNotes ? `\nContexto: ${contextNotes}` : ''}`,
      ],
    ],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: [203, 213, 225],
    },
  });

  currentY = (pdf as any).lastAutoTable.finalY + 8;

  // -------------------------------------------------------------
  // 3. CONVERSATION LOG
  // -------------------------------------------------------------
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('REGISTRO CRONOLÓGICO DE CONSULTAS Y RECOMENDACIONES', margin, currentY);
  currentY += 6;

  for (let i = 0; i < validMessages.length; i++) {
    const msg = validMessages[i];
    const isModel = msg.role === 'model';
    const senderLabel = isModel ? '🤖 COPILOTO TÉCNICO NEOVOLT (IA / NORMA RIC)' : '👤 TÉCNICO / INSTALADOR';

    checkPageBreak(30);

    // Header strip for message
    pdf.setFillColor(isModel ? 245 : 241, isModel ? 243 : 245, isModel ? 255 : 249);
    pdf.setDrawColor(isModel ? 217 : 203, isModel ? 70 : 213, isModel ? 239 : 225);
    pdf.roundedRect(margin, currentY, contentWidth, 7, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(isModel ? 147 : 51, isModel ? 51 : 65, isModel ? 234 : 85);
    pdf.text(senderLabel, margin + 3, currentY + 4.8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Hora: ${msg.timestamp}`, pageWidth - margin - 3, currentY + 4.8, { align: 'right' });

    currentY += 9;

    // Split message text clean of markdown symbols for PDF clarity
    const cleanText = msg.text
      .replace(/###/g, '')
      .replace(/##/g, '')
      .replace(/#/g, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim();

    const lines = pdf.splitTextToSize(cleanText, contentWidth - 6);
    const textHeight = lines.length * 4.2;

    checkPageBreak(textHeight + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(lines, margin + 3, currentY + 3);

    currentY += textHeight + 6;

    // Render photo indicators if attached
    if (msg.images && msg.images.length > 0) {
      checkPageBreak(12);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`[Fotografías adjuntas a la consulta: ${msg.images.length} imagen(es) inspeccionada(s)]`, margin + 3, currentY);
      currentY += 6;
    }

    // Divider
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;
  }

  // -------------------------------------------------------------
  // 4. SEC & RIC NORMATIVE VALIDATION SEAL
  // -------------------------------------------------------------
  checkPageBreak(35);

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(15, 23, 42);
  pdf.text('DECLARACIÓN DE CUMPLIMIENTO TÉCNICO & SEGURIDAD', margin + 4, currentY + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  const disclaimer =
    'Este documento registra la asesoría técnica automatizada basada en los Pliegos Técnicos Normativos RIC N°01 al N°19 de la Superintendencia de Electricidad y Combustibles (SEC de Chile). Todas las intervenciones en terreno deben ser ejecutadas por personal calificado con EPP dieléctrico y verificación de ausencia de tensión.';
  const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth - 8);
  pdf.text(disclaimerLines, margin + 4, currentY + 11);

  currentY += 30;

  // Add footers on all pages
  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    drawFooter(p);
  }

  // Trigger download
  const cleanFileName = `NEOVOLT_Diagnostico_SEC_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(cleanFileName);
}
